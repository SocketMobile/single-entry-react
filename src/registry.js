import { Capture } from "socketmobile-capturejs";
import CREDENTIALS from "./credentials";
import MyLogger from "./MyLogger";

const logger = new MyLogger('CaptureRegistry');
let refId = 1;
const {appId, appKey, developerId} = CREDENTIALS;
const appInfo = {
  appId,
  developerId,
  appKey,
};

function noop() {}

class CaptureRegistry {
  registry = {}

  /**
   * 
   * @param {React.MutableRefObject} ref 
   * @param {EventNotification} eventHandler 
   * @returns {Promise<{action:string, result:number }>}
   */
  open(ref, eventHandler) {
    if (ref in this.registry) {
      const x = this.registry[ref];
      logger.debug('existing ref in registry, updating eventhandler', x.refId)
      x.eventHandler = eventHandler
      x.cancelClose() //cancel close if any outstanding
      this.registry[ref]=x
      return Promise.resolve({action:'reopen', result: 0})
    }  
    const capture = new Capture();
    const entry = {t: null, eventHandler, capture, cancelClose: noop, refId: refId++ }
    logger.info('new capture', entry.refId)
    this.registry[ref] = entry
    return capture
      .open(appInfo, (e, handle) => {
        this._onCaptureEvent(ref, e, handle)
      })
      .then((result) => {
        return {action:'open', result};
      })
  }

  close(ref) {
    if (!this.registry.hasOwnProperty(ref)) {
      logger.log('close: no such ref in registry')
      return Promise.reject(Error('nothing to close'))
    }
    return new Promise((resolve, reject) => {
      const x = this.registry[ref]
      logger.debug('requesting to close ref', x.refId)
      if (x.t) {
        x.cancelClose()
        x.t = null
      }
      x.cancelClose = () => {
        resolve({action:'cancel'})
        clearTimeout(x.t);
        logger.debug('canceling timeout for closing ref', x.refId)
      }
      x.t = setTimeout(() => {
        x.capture.close()
        .then((result)=> {
          logger.log('success closing', x.refId)
          return resolve({result, action:'close'})
        })
        .catch(err => {
          logger.log('failed to close capture', err, x.refId)
          return reject(err)
        })
        delete this.registry[ref]
      }, 5000)
    })
    
  }

  capture(ref) {
    return this.registry[ref].capture
  }
  
  _onCaptureEvent(ref, e, handle) {
    if (!this.registry.hasOwnProperty(ref)) {
      console.log('_onCaptureEvent: no such ref in registry')
    }
    this.registry[ref].eventHandler(e, handle);
  }
}

const captureRegistry = new CaptureRegistry()

export default captureRegistry;