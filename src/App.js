import React, { useState, useEffect, useRef } from "react";
import {
  Capture,
  CaptureEventIds,
  SktErrors,
  CaptureDeviceType,
  CaptureProperty,
  CapturePropertyIds,
  CapturePropertyTypes,
} from "socketmobile-capturejs";
import CREDENTIALS from "./credentials";

const SocketCamTypes = [
  CaptureDeviceType.SocketCamC820,
  CaptureDeviceType.SocketCamC860,
];

const { appId, appKey, developerId } = CREDENTIALS;

// The logger can help to troubleshoot the communication
// with Capture, this is totally optional and Capture
// can be instantiated directly without any argument
class MyLogger {
  log(message, arg) {
    arg = arg !== undefined ? arg : "";
    console.log("SingleEntryRN: " + message, arg);
  }
  error(message, arg) {
    arg = arg !== undefined ? arg : "";
    console.error("SingleEntryRN: " + message, arg);
  }
}

const resToString = (res) => {
  return JSON.stringify(res, null, 4);
};

const myLogger = new MyLogger();
const capture = new Capture();
let dataId = 10;

const initialState = {
  devices: [],
  deviceCapture: null,
  bleDeviceManagerCapture: null,
  socketcamDevice: null,
  deviceGuidMap: {},
  os: false,
};

const App = () => {
  const [devices, setDevices] = useState([]);
  // deviceGuidMap is used to keep track of devices already
  // added to the list; meant to prevent adding a device twice
  const [deviceGuidMap, setDeviceGuidMap] = useState({});
  const [status, setStatus] = useState("Opening Capture...");
  const [decodedDataList, setDecodedDataList] = useState([]);
  const [deviceCapture, setDeviceCapture] = useState(null);
  const [bleDeviceManagerCapture, setBleDeviceManagerCapture] = useState(null);
  const [socketcamDevice, setSocketCamDevice] = useState(null);
  const [value, setValue] = useState("");
  // useRef is required to reliably reference component state in a callback
  // that is executed outside of the scope of the component.
  // onCaptureEvent is not called directly by the component, but rather
  // by the capture instance managing events.

  const stateRef = useRef(initialState);

  stateRef.current = {
    devices,
    deviceCapture,
    bleDeviceManagerCapture,
    socketcamDevice,
    deviceGuidMap,
  };

  const onCaptureEvent = (e, handle) => {
    if (!e) {
      return;
    }
    let devs = [...stateRef.current.devices];
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
      case CaptureEventIds.DeviceManagerArrival:
        const newBleDeviceManager = new Capture();
        openDeviceHelper(newBleDeviceManager, e, true);
        break;
      case CaptureEventIds.DeviceArrival:
        const newDevice = new Capture();
        openDeviceHelper(newDevice, e, false);
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
        let index = devs.findIndex((d) => {
          return d.guid === e.value.guid;
        });
        if (index < 0) {
          myLogger.error(`no matching devices found for ${e.value.name}`);
          return;
        } else {
          let removeDevice = devs[index];
          myLogger.log("removeDevice: ", removeDevice?.name);
          removeDevice?.devCapture
            .close()
            .then((result) => {
              myLogger.log("closing a device returns: ", `${result}`);
              setStatus(`result of closing ${removeDevice?.name}: ${result}`);
              devs.splice(index, 1);
              setDevices(devs);
              let myMap = { ...stateRef.current.deviceGuidMap };
              delete myMap[e.value.guid];
              setDeviceGuidMap(myMap);
              let bleDeviceManagerCaptureDev = bleDeviceManagerCapture;
              if (
                bleDeviceManagerCaptureDev &&
                e.value.guid === bleDeviceManagerCaptureDev.guid
              ) {
                setBleDeviceManagerCapture(null);
              } else {
                setDeviceCapture(null);
              }
            })
            .catch((res) => {
              let { error } = res;
              let { message, code } = error;
              // The error code -38 is related to SocketCam extension closing the SocketCam device when you DISABLE SocketCam on android.
              // When you disable SocketCam, it closes the device via the extension so there is no need to close it in the React Native side.
              // It will not show up with other devices and therefore can be ignored.
              // Other error codes must be handled accordingly.
              if (code !== -38) {
                myLogger.error(`error closing a device: ${code}: ${message}`);
                setStatus(`error closing a device: ${code}: ${message}`);
              }
            });
        }
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
        const deviceSource = devices.find((d) => d.handle === handle);
        var list = decodedDataList;

        if (deviceSource) {
          setStatus(`no matching devices found for ${e.value.name}`);
        }

        var newScan = {
          id: dataId,
          name: e.value.name,
          data: String.fromCharCode.apply(null, e.value.data),
          length: String.fromCharCode.apply(null, e.value.data).length,
        };

        list.push(newScan);

        dataId++;

        setDecodedDataList(list);
        setValue(
          `${newScan.name.toUpperCase()} (${newScan.length}): ${newScan.data}`
        );

        break;
      default:
        break;
    }
  };

  const genDevice = (dev, guid, name, type) => {
    return {
      guid,
      name,
      type,
      handle: dev.clientOrDeviceHandle,
      devCapture: dev,
    };
  };

  const openDeviceHelper = (dev, e, isManager) => {
    let { name, guid, type } = e.value;
    let loggedOption = isManager ? "device manager" : "device";
    dev
      .openDevice(guid, capture)
      .then((result) => {
        myLogger.log(`opening a ${loggedOption} returns: `, `${result}`);
        setStatus(`result of opening ${name} : ${result}`);
        let myMap = { ...stateRef.current.deviceGuidMap };
        if (!myMap[guid] && !isManager) {
          let device = genDevice(dev, guid, name, type);
          let devs = [...stateRef.current.devices, device];
          setDevices(devs);
          myMap[guid] = "1";
          setDeviceGuidMap(myMap);
        }
        if (!isManager) {
          // check for socketcam device type
          if (SocketCamTypes.indexOf(e.value.type) > -1) {
            let device = genDevice(dev, guid, name, type);
            setSocketCamDevice(device);
          } else {
            setDeviceCapture(dev);
          }
        } else {
          setBleDeviceManagerCapture(dev);
          getFavorite(dev);
        }
      })
      .catch((res) => {
        let { error } = res;
        const { code, message } = error;
        myLogger.error(resToString(error));
        setStatus(`error opening a device: ${code} \n ${message}}`);
      });
  };

  const getFavorite = async (dev) => {
    let property = new CaptureProperty(
      CapturePropertyIds.Favorite,
      CapturePropertyTypes.None,
      {}
    );

    try {
      let favorite = await dev.getProperty(property);

      setStatus("retrieving BLE Device Manager favorite... ");
      if (favorite.value.length === 0) {
        setFavorite(dev);
      } else {
        setStatus("Favorite found! Try using an NFC reader!");
      }
    } catch (err) {
      myLogger.error(`${err.code} : ${err.message}`);
      setStatus(`failed to get favorite: ${err.code} : ${err.message}`);
    }
  };

  const setFavorite = async (bleDevice) => {
    let property = new CaptureProperty(
      CapturePropertyIds.Favorite,
      CapturePropertyTypes.String,
      "*"
    );

    try {
      let data = await bleDevice.setProperty(property);
      myLogger.log(JSON.stringify(data.value));
      setStatus(`successfully set favorite for BLE Device Manager!`);
    } catch (res) {
      let { code, message } = res.error;
      myLogger.error(`${code} : ${message}`);
      setStatus(`failed to set favorite: ${code} : ${message}`);
    }
  };

  useEffect(() => {
    const appInfo = {
      appId,
      developerId,
      appKey,
    };

    capture
      .open(appInfo, onCaptureEvent)
      .then(() => {
        setStatus("capture open success");
      })
      .catch((err) => {
        myLogger.error(err);
        setStatus(`failed to open Capture: ${err}`);
        // this is mostly for Android platform which requires
        // Socket Mobile Companion app to be installed
        if (err === SktErrors.ESKT_UNABLEOPENDEVICE) {
          setStatus("Is Socket Mobile Companion app installed?");
        }
      });
  }, []);

  const clearHandler = () => {
    setDecodedDataList([]);
    setValue("");
  };

  return (
    <div>
      <h3>
        <span>Status: </span>
        <span>{status}</span>
      </h3>
      <h3>Devices</h3>
      <table>
        <tbody>
          <tr>
            <th>Name</th>
            <th>GUID</th>
          </tr>
          {devices.map((x) => {
            return (
              <tr key={x.name}>
                <th>{x.name}</th>
                <th>{x.guid}</th>
              </tr>
            );
          })}
        </tbody>
      </table>
      {devices.length ? null : <p>NO DEVICES AVAILABLE</p>}
      Current Scan: <input value={value} readOnly />
      <h3>Recent Scans</h3>
      <ul>
        {decodedDataList.map((x) => {
          return (
            <li key={x.id}>
              {x.name} ({x.length}): {x.data}
            </li>
          );
        })}
      </ul>
      <button onClick={clearHandler}>CLEAR</button>
    </div>
  );
};

export default App;
