import React, {useState, useEffect, useCallback, useRef} from 'react'
import {CaptureEventIds, SktErrors} from "socketmobile-capturejs";
import DeviceList from './components/DeviceList';
import { DecodedData, DeviceArrival, DeviceRemoval, getBattery } from './actions';
import MyLogger from './MyLogger';
import captureRegistry from './registry';
import MessageList from './components/MessageList';

const logger = new MyLogger('App');



const App = () => {
  const [devices, setDevices] = useState([]);  // {guid, name, handle, device, battery}
  const [messages, setMessages] = useState(['Opening Capture...']);
  const [decodedDataList, setDecodedDataList] = useState([]);
  const [value, setValue] = useState("");
  const ref = useRef(null);

  const setStatus = (message)=> {
    //add new message to top
    setMessages(x => {
      x.unshift(message)
      // remove if more than 5
      if (x.length > 5) {
        x.pop()
      }
      return x
    })
  }

  
  const onCaptureEvent = useCallback(
    (e, handle) => {
      if (!e) {
        return;
      }
      const eventAsName = CaptureEventIds[e.id];
      logger.info(`onCaptureEvent ${eventAsName} from ${handle}: `, {e, devices});
      
      switch (e.id) {
        case CaptureEventIds.DeviceArrival:
          DeviceArrival({e, devices, setStatus, setDevices, capture:captureRegistry.capture(ref)})
            .then(deviceEntry => getBattery(deviceEntry))
            .then(({battery, deviceEntry}) => {
              setStatus(`${deviceEntry.name} battery = ${battery}`)
              setDevices(entries => {
                return entries.map((x) => {
                  if (x.guid === deviceEntry.guid) {
                    x.battery = battery
                  }
                  return x
                }) 
              })
            })
            .catch(err => {
              logger.error('error getting device or battery', err)
            })
          break;
        
        case CaptureEventIds.DeviceRemoval:
          DeviceRemoval({e, devices, setDevices, setStatus});
          break;
        
        case CaptureEventIds.DecodedData:
          DecodedData({e, handle, devices, decodedDataList, setStatus, setDecodedDataList, setValue})
          break;

          default:
            //TODO: take care of the rest
      }
    },
    [devices, decodedDataList],
  );

  const closeCapture = useCallback(() => {
    logger.log('close Capture');
    captureRegistry
      .close(ref)
      .then(result => {
        logger.log('result closing Capture: ', result);
      })
      .catch(err => {
        logger.log(`failed to close Capture: ${err}`);
      });
  }, []);


  useEffect(() => {
    logger.debug('useEffect')
    captureRegistry
      .open(ref, onCaptureEvent)
      .then(({action, result}) => {
        if (action === 'open') {
          setStatus('capture open success');
        } else {
          logger.debug('back from open', {action, result})
        }    
      })
      .catch(err => {
        logger.error(err);
        setStatus(`failed to open Capture: ${err}`);
        // this is mostly for Android platform which requires
        // Socket Mobile Companion app to be installed
        if (err === SktErrors.ESKT_UNABLEOPENDEVICE) {
          setStatus('Is Socket Mobile Companion app installed?');
        }
      });
    return closeCapture;
  }, [onCaptureEvent, closeCapture, devices]);

  const clearHandler = () => {
    setDecodedDataList([]);
    setMessages([])
  };

  return (
    <div>
      <h3>Devices</h3>
      <DeviceList devices={devices} />
      {devices.length ? null : <p>NO DEVICES AVAILABLE</p>}
      Current Scan: <input value={value} readOnly/>
      <h3>Recent Scans</h3>
      <ul>
        {decodedDataList.map(x=>{
          return <li key={x.id}>{x.name} ({x.length}): {x.data}</li>  
        })}
        {decodedDataList.length ? null : <p>NO SCANS AVAILABLE</p>}
      </ul>
      <h3>Recent status (latest on top)</h3>
      <MessageList messages={messages} />
      <button onClick={clearHandler}>CLEAR</button>
    </div>
  );
}

export default App;
