import React, {useState, useEffect, useCallback} from 'react'
import {Capture, CaptureEventIds, SktErrors} from "socketmobile-capturejs";
import CREDENTIALS from "./credentials"

const {appId, appKey, developerId} = CREDENTIALS

// The logger can help to troubleshoot the communication
// with Capture, this is totally optional and Capture
// can be instantiated directly without any argument
class MyLogger {
  log(message, arg) {
    arg = arg !== undefined ? arg : '';
    console.log('SingleEntryRN: ' + message, arg);
  }
  error(message, arg) {
    arg = arg !== undefined ? arg : '';
    console.error('SingleEntryRN: ' + message, arg);
  }
}

const myLogger = new MyLogger();
const capture = new Capture();
let dataId = 10;

const App = () => {

  const [devices, setDevices] = useState([]);
  const [status, setStatus] = useState('Opening Capture...');
  const [decodedDataList, setDecodedDataList] = useState([]);
  const [deviceMap, setDeviceMap] = useState({})
  const [value, setValue] = useState("")

  // useEffect(()=>{
  //   console.log(decodedDataList)
  // }, [decodedDataList])

  const onCaptureEvent = useCallback(
    (e, handle) => {
      if (!e) {
        return;
      }
      myLogger.log(`onCaptureEvent from ${handle}: `, e);

      switch (e.id) {
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
        // **********************************
        case CaptureEventIds.DeviceArrival:
          const newDevice = new Capture();
          const {guid, name} = e.value;
          newDevice
            .openDevice(guid, capture)
            .then(result => {
              myLogger.log('opening a device returns: ', result);
              setStatus(`result of opening ${e.value.name} : ${result}`);
              var dvcs = [...devices]
              var map = {...deviceMap}
              if (!map[name]){
                dvcs.push({
                    guid,
                    name,
                    handle: newDevice.clientOrDeviceHandle,
                    device: newDevice,
                });
                map[name] = true
                setDeviceMap(map)
              } 
              setDevices(dvcs)
            })
            .catch(err => {
              myLogger.log(err);
              setStatus(`error opening a device: ${err}`);
            });
          break;
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
        case CaptureEventIds.DeviceRemoval:
          const removeDevice = devices.find(d => d.guid === e.value.guid);
          if (!removeDevice) {
            myLogger.log(`no matching devices found for ${e.value.name}`);
            return;
          }
          setDevices(prevDevices => {
            prevDevices = prevDevices.filter(d => d.guid !== e.value.guid);
            return prevDevices;
          });
          myLogger.log('removeDevice: ', removeDevice.name);
          removeDevice.device
            .close()
            .then(result => {
              myLogger.log('closing a device returns: ', result);
              setStatus(`result of closing ${removeDevice.name}: ${result}`);
            })
            .catch(err => {
              myLogger.log(`error closing a device: ${err.message}`);
              setStatus(`error closing a device: ${err}`);
            });
          break;
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
        case CaptureEventIds.DecodedData:
          const deviceSource = devices.find(d => d.handle === handle);
          var list = decodedDataList

          if (deviceSource) {
            setStatus(`no matching devices found for ${e.value.name}`)
          }

          var newScan = {
            id: dataId, 
            name: e.value.name, 
            data: String.fromCharCode.apply(null, e.value.data),
            length:String.fromCharCode.apply(null, e.value.data).length
          }
          
          list.push(newScan)

          dataId++

          setDecodedDataList(list);
          setValue(`${ newScan.name.toUpperCase()} (${newScan.length}): ${newScan.data}`)

          break;
      }
    },
    [devices],
  );

  const closeCapture = useCallback(() => {
    myLogger.log('close Capture');
    capture
      .close()
      .then(result => {
        myLogger.log('Success in closing Capture: ', result);
      })
      .catch(err => {
        myLogger.log(`failed to close Capture: ${err}`);
      });
  }, []);

  useEffect(() => {
    const appInfo = {
      appId,
      developerId,
      appKey,
    };
    
    capture
      .open(appInfo, onCaptureEvent)
      .then(() => {
        setStatus('capture open success');
      })
      .catch(err => {
        myLogger.error(err);
        setStatus(`failed to open Capture: ${err}`);
        // this is mostly for Android platform which requires
        // Socket Mobile Companion app to be installed
        if (err === SktErrors.ESKT_UNABLEOPENDEVICE) {
          setStatus('Is Socket Mobile Companion app installed?');
        }
      });
    return closeCapture;
  }, []);

  const clearHandler = () => {
    setDecodedDataList([]);
    setValue("")
  };

  return (
    <div>
      <h3><span>Status: </span><span>{status}</span></h3>
      <h3>Devices</h3>
      <table>
        <tbody>
          <tr>
            <th>Name</th>
            <th>GUID</th>
          </tr>
          {devices.map(x=>{
            return <tr key={x.name}>
              <th>{x.name}</th>
              <th>{x.guid}</th>
            </tr>
          })}
        </tbody>
      </table>
      {devices.length ? null : <p>NO DEVICES AVAILABLE</p>}
      Current Scan: <input value={value} readOnly/>
      <h3>Recent Scans</h3>
      <ul>
        {decodedDataList.map(x=>{
          return <li key={x.id}>{x.name} ({x.length}): {x.data}</li>

        })}
      </ul>
      <button onClick={clearHandler}>CLEAR</button>
    </div>
  );
}

export default App;
