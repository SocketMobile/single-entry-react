const LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG'];

function noop() {}

function _log(level, key, index, name) {
    if (index > level) {
        return noop
    }
    let logger = console.log;
    if (key === 'ERROR') {
        logger = console.error;
    }
    const prefix = `${key}\t SingleEntryRN${name}:\t `
    
    return function log(message, ...args) {
        if (typeof message !== 'string') {
            args.unshift(args)
            message = ''
        }
        logger(`${prefix} ${message}`, ...args)
    }
}



// The logger can help to troubleshoot the communication
// with Capture, this is totally optional and Capture
// can be instantiated directly without any argument
// or an optional context name.
class MyLogger {
    level = LEVELS.indexOf('INFO') // change to DEBUG to get more information
    constructor(name='') {
        if (name !== '') {
            name=`.${name}`
        }
        LEVELS.forEach((key, index) => {
            this[key.toLowerCase()] = _log(this.level, key, index, name)
        })
    }

    //default log event
    log(message, ...args) {
      this.debug(message, ...args)
    }
    
  }

export default MyLogger