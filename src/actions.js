import { Capture, CaptureProperty, CapturePropertyIds, CapturePropertyTypes } from "socketmobile-capturejs";
import MyLogger from "./MyLogger";

const logger = new MyLogger('actions')
let dataId = 10;

// **********************************
// Device Arrival Event
//   a device needs to be opened in
//   to receive the decoded data
//  e = {
//    id: CaptureEventIds.DeviceArrival,
//    type: CaptureEventTypes.DeviceInfo,
//    value: {
//      guid: "b876d9a8-85b6-1bb5-f1f6-1bb5d78a2c6e",
//      name: "Socket S740 [E2ABB4]",
//      type: CaptureDeviceType.ScannerS740
//    }
//  }
// Returns a Promise with the new deviceEntry
// **********************************
function DeviceArrival({e, devices, capture, setStatus, setDevices}) {
  const newDevice = new Capture();
  const {guid, name} = e.value;
  return new Promise((resolve, reject) => {
    newDevice
      .openDevice(guid, capture)
      .then(result => {
        logger.info(`opening device ${e.value.name} returns: `, result);
        setStatus(`result of opening ${e.value.name}: ${result}`);
        var dvcs = [...devices];
        const foundDevices = dvcs.filter(x => x.guid === guid)
        if (foundDevices.length === 0){
          const deviceEntry = {
            guid,
            name,
            handle: newDevice.clientOrDeviceHandle,
            device: newDevice,
            battery: -1,
          };
          dvcs.push(deviceEntry);
          logger.debug('DeviceArrival is about to set devices');
          setDevices(dvcs);
          return resolve(deviceEntry)
        } else {
          return resolve(foundDevices[0])
        }
      })
      .catch(err => {
        logger.error('error opening device', err);
        setStatus(`error opening a device: ${err}`);
        return reject(err);
      });
  }); 
}

// **********************************
// Device Removal Event
//   it is better to close the device
//  e = {
//    id: CaptureEventIds.DeviceRemoval,
//    type: CaptureEventTypes.DeviceInfo,
//    value: {
//      guid: "b876d9a8-85b6-1bb5-f1f6-1bb5d78a2c6e",
//      name: "Socket S740 [E2ABB4]",
//      type: CaptureDeviceType.ScannerS740
//    }
//  }
// **********************************
function DeviceRemoval({e, devices, setDevices, setStatus}) {
  const removeDevice = devices.find(d => d.guid === e.value.guid);
  if (!removeDevice) {
    logger.debug(`no matching devices found for ${e.value.name}`);
    return;
  }
  logger.debug('DeviceRemoval is about to set devices')
  setDevices(prevDevices => {
    prevDevices = prevDevices.filter(d => d.guid !== e.value.guid);
    return prevDevices;
  });
  logger.info('removeDevice: ', removeDevice.name);
  removeDevice.device
    .close()
    .then(result => {
      logger.info('closing a device returns: ', result);
      setStatus(`result of closing ${removeDevice.name}: ${result}`);
    })
    .catch(err => {
      logger.error(`error closing a device: ${err.message}`);
      setStatus(`error closing a device: ${err}`);
    });
}



// **********************************
// Decoded Data
//   receive the decoded data from
//   a specific device
//  e = {
//    id: CaptureEventIds.DecodedData,
//    type: CaptureEventTypes.DecodedData,
//    value: {
//      data: [55, 97, 100, 57, 53, 100, 97, 98, 48, 102, 102, 99, 52, 53, 57, 48, 97, 52, 57, 54, 49, 97, 51, 49, 57, 50, 99, 49, 102, 51, 53, 55],
//      id: CaptureDataSourceID.SymbologyQRCode,
//      name: "QR Code"
//    }
//  }
// **********************************
function DecodedData({e, handle, devices, decodedDataList, setStatus, setDecodedDataList, setValue}) {
  const deviceSource = devices.find(d => d.handle === handle);
  const list = [...decodedDataList];

  if (!deviceSource) {
    logger.warn(`no matching devices found for ${e.value.name}`, {handle, devices, deviceSource});
    setStatus(`no matching devices found for ${e.value.name}`);
  }

  var newScan = {
    id: dataId, 
    name: e.value.name, 
    data: String.fromCharCode.apply(null, e.value.data),
    length:String.fromCharCode.apply(null, e.value.data).length
  };
  
  list.push(newScan);

  dataId++;

  setDecodedDataList(list);
  setValue(`${ newScan.name.toUpperCase()} (${newScan.length}): ${newScan.data}`);
}

function getBattery(deviceEntry) {
  const property = new CaptureProperty(
    CapturePropertyIds.BatteryLevelDevice,
    CapturePropertyTypes.None,
    {}
  );
  logger.info(`getBattery for ${deviceEntry.name}`)
  return deviceEntry.device.getProperty(property)
  .then(result => {
    // mask off the battery percentag
    const battery = (result.value & 0xff00) >> 8
    logger.debug(`battery ${battery} from result.value 0x${result.value.toString(16)}`)
    return {battery, deviceEntry} 
  })
}
  

export {
  DeviceArrival,
  DeviceRemoval,
  DecodedData,
  getBattery
}