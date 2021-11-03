const logger = require('./logger');
const { spawn } = require('child_process');
const readline = require('readline');

// Ensure that anything unhandled gets logged
process.on('unhandledRejection', (reason, p) => logger.error('Unhandled Promise Rejection: ' + reason.stack));

// Figured out my Mac Address by putting the container on idle and running `bluetoothctl | grep Polar`
const MAC_ADDR = 'E8:78:8D:A0:03:CA';

// Gatttool command line args
const GATTTOOL_ARGS = [
  '-t',
  'random',
  '-b',
  MAC_ADDR,
  '--char-write-req',
  '--handle=0x0011',
  '--value=0100',
  '--listen',
];

// TODO: Detect if no stdout for 30 seconds; (such as periferal goes out of range)

// Global state
let GATTTOOL_ACTIVE = false;

const Main = async () => {
  try {
    const gatttool = spawn('gatttool', GATTTOOL_ARGS);

    const rl = readline.createInterface({ input: gatttool.stdout });
    rl.on('line', (line) => {
      GATTTOOL_ACTIVE = true;
      let lineStr = line.toString();

      logger.debug(lineStr);

      lineStr = lineStr.substring(lineStr.indexOf(': ') + 2);
      const valueArray = lineStr.split(' ');
      if (valueArray.length > 1) {
        const bpm = parseInt(Number('0x' + valueArray[1]), 10);
        if (bpm && bpm !== NaN) {
          logger.info('BPM: ' + parseInt(Number('0x' + valueArray[1]), 10));
          // TODO: Report this out to MQTT
        }
      }
    });

    gatttool.stderr.on('data', (data) => {
      logger.error(data.toString());
    });

    gatttool.on('close', (code) => {
      logger.debug('gatttool process exited with code ' + code?.toString());
      GATTTOOL_ACTIVE = false;
    });
  } catch (err) {
    logger.error(err?.message);
    GATTTOOL_ACTIVE = false;
  }
};

(async () => {
  logger.info('Attempting to read heart rate values...');
  await Main();
  setInterval(async () => {
    if (!GATTTOOL_ACTIVE) {
      logger.info('Attempting to read heart rate values...');
      await Main();
    }
  }, 60 * 1000); // Try again in 1 min
})();
