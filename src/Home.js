import { useReducer } from 'react';
import { useCapture, ACTIONS} from './useCapture';

function reducer(state, action) {
  switch(action.type) {
    case ACTIONS.STATUS:
      state.status = action.payload.message;
      if(state.devices.length > 0) {
        state.status += `, ${state.devices.map(d=> d.name).join(', ')}`;
      }
      return {...state};
    case ACTIONS.ARRIVAL:
      state.devices = action.payload.devices;
      state.status = 'New device';
      if(state.devices.length > 0) {
        state.status += `, ${state.devices.map(d=> d.name).join(', ')}`;
      }
      return {...state};
      // return state;
    case ACTIONS.REMOVAL:
      state.devices = action.payload.devices;
      state.status = 'Device removed';
      if(state.devices.length > 0) {
        state.status += `, ${state.devices.map(d=> d.name).join(', ')}`;
      }
      return {...state};
    case ACTIONS.DECODED_DATA:
      state.decodedData = action.payload.decodedData;
      return {...state};
    case ACTIONS.OWNERSHIP_GAIN:
      if(state.ownership === false){
        state.ownership = true;
        return {...state}
      }
      return state;
    case ACTIONS.OWNERSHIP_LOST:
      if(state.ownership === true){
        state.ownership = false;
        return {...state}
      }
      return state;
    case ACTIONS.ERROR:
      state.status = action.payload.message;
      if(state.devices.length > 0) {
        state.status += `, ${state.devices.map(d => d.name).join(', ')}`;
      }
      return {...state};
    default:
      return state;
  }
}

const Home = () => {

  const [state, dispatch] = useReducer(reducer, 
    { 
      devices: [], 
      status: 'Ready', 
      decodedData: '', 
      decodedDataList: [],
      ownership: true
    });
  
  useCapture(dispatch);
  
  return (
    <div className="home">
      <h2>Status: {state.status} {state.ownership ? '' : '⚠️'}</h2>
      <input type="text" readOnly value={state.decodedData} />
      <div className="decodeddatalist">
        <ul>
        {state.decodedDataList.map(d => {
          return <li>{d}</li>
        })}
        </ul>
      </div>
    </div>
  );
}
 
export default Home;



// const capture = Capture.AppInfo(myAppInfo).builder();
// const deviceType = Capture.DeviceType(Capture.BarcodeScanner+Capture.Nfc);
// const scannerType = Capture.DeviceType(Capture.BarcodeScanner);
// const nfcType = Capture.DeviceType(Capture.Nfc);
// const unsubscribeDevicePresence = 
//   capture.subscribe(deviceType, Capture.DevicePresence,onDevicePresence);
// const unsubscribeScannerDecodedData = 
//   capture.subscribe(scannerType, Capture.DecodedData,onScannerDecodedData);
// const unsubscribeNfcDecodedData = 
//   capture.subscribe(nfcType, Capture.DecodedData,onNfcDecodedData);  