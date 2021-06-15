import {useEffect, useCallback } from 'react';
import {Capture, CaptureEventIds} from "socketmobile-capturejs";

const ACTIONS = {
  ARRIVAL: 1,
  REMOVAL: 2,
  DECODED_DATA: 3,
  STATUS: 4,
  OWNERSHIP_GAIN: 5,
  OWNERSHIP_LOST: 6,
  ERROR: 7
}
const OWNERSHIP_LOST = '00000000-0000-0000-0000-000000000000';
const capture = new Capture();
const devices = [];
function arrayToString(dataArray) {
  return String.fromCharCode.apply(null, dataArray);
}


const useCapture = (dispatch) => {
  const onCaptureEvent = useCallback((e, handle) => {
    if(!e){
      return;
    }
    console.log('onCaptureEvent: ', e);
    switch(e.id) {
      case CaptureEventIds.DecodedData:
        dispatch({
          type: ACTIONS.DECODED_DATA,
          payload: {
            decodedData: arrayToString(e.value.data)
          }
        });
        break;
      case CaptureEventIds.DeviceArrival:
        {
          const { guid, name } = e.value;
          const newDevice = new Capture();
          newDevice.openDevice(guid, capture)
          .then(result => {
            const device = { 
              name, 
              guid, 
              handle: newDevice.clientOrDeviceHandle, 
              captureDevice: newDevice
            }
            devices.push(device);
            console.log('devices: ', devices);
            dispatch({
              type: ACTIONS.ARRIVAL,
              payload: {
                device,
                devices
              }
            });
          })
          .catch(err => {
            dispatch({
              type: ACTIONS.ERROR,
              payload: {
                message:`Error ${err} while opening ${name}`
              }
            });
          });
        }
        break;
      case CaptureEventIds.DeviceRemoval:
        {
          const { guid, name } = e.value;

          const removedIndex = devices.findIndex(d => d.guid === guid);
          if(removedIndex === -1){
            dispatch({
              type: ACTIONS.ERROR,
              payload: {
                message: `No matching device found for ${name}`
              }
            });
            return;
          }
          const removedDevices = devices.splice(removedIndex,1);
          removedDevices[0].captureDevice.close()
          .then(() => {
            dispatch({
              type: ACTIONS.REMOVAL,
              payload: {
                device: {
                  guid,
                  name
                },
                devices
              }
            })
          })
          .catch(err => {
            dispatch({
              type: ACTIONS.ERROR,
              payload: {
                message: `Error ${err} while closing the device ${name}`
              }
            });
          });
        }
        break;
      case CaptureEventIds.Terminate:
        break;
      case CaptureEventIds.DeviceOwnership:
        let type = ACTIONS.OWNERSHIP_GAIN;
        if(e.value === OWNERSHIP_LOST){
          type = ACTIONS.OWNERSHIP_LOST;
        }
        dispatch({type})
        break;
      case CaptureEventIds.Error:
        dispatch({ 
          type: ACTIONS.ERROR,
          payload:{
            message: `Receive an Error ${e.value}`
          }
        });
        break;
      default:
        dispatch({ 
          type: ACTIONS.ERROR,
          payload:{
            message: `Unknown event id: ${e.id}`
          }
        });
        break;
    }
  },[dispatch]);
  
  useEffect(() => {
      const appInfo = {
      appId: 'web:com.socketmobile.singleentry-react',
      developerId: 'bb57d8e1-f911-47ba-b510-693be162686a', 
      appKey: 'MCwCFCuLEUn8hf+hSBkBdzDrG2YU2107AhRv1QNFpaH/6gI3j/vx9wz4tuE+Ow=='
    };
    console.log('about to open Capture');
    capture.open(appInfo, onCaptureEvent)
    .then(() => {
      dispatch({ 
        type: ACTIONS.STATUS,
        payload: {
          message: 'Capture opened successfully'
        }
      });
    })
    .catch(err => {
      console.error(err);
      let message = `Error ${err} while opening Capture`;
      if(err === -27){
        message = `Error ${err}. Companion Service not running? Please run Socket Mobile Companion.`;
      }
      dispatch({
        type: ACTIONS.ERROR,
        payload: {
          message
        }
      });
    });
    return () => {
      console.log('Cleanup Capture...');
      devices.forEach(d => d.captureDevice.close());
      devices.splice(0, devices.length);
      capture.close();
    };
  },[onCaptureEvent, dispatch]);
};

export { useCapture, ACTIONS };