const logger = require('./logger');

// Figured out my Mac Address by putting the container on idle and running `bluetoothctl | grep Polar`
const h10MacAddr = process.env.H10_MAC_ADDR || 'E8:78:8D:A0:03:CA';

// Gatttool command line args
const gatttoolArgs = [
  '-t',
  'random',
  '-b',
  h10MacAddr,
  '--char-write-req',
  '--handle=0x0011',
  '--value=0100',
  '--listen',
];

const supervisorAddr = process.env.BALENA_SUPERVISOR_ADDRESS || '';
const supervisorApiKey = process.env.BALENA_SUPERVISOR_API_KEY || '';
let fleetName = process.env.BALENA_APP_NAME || '';

// TODO: Figure out how to run the mqtt service in local mode to avoid this
if (fleetName === 'localapp') fleetName = process.env.FLEET_NAME || 'Home-MS-2';

const config = {
  h10MacAddr: h10MacAddr,
  gatttoolArgs: gatttoolArgs,
  supervisorAddr: supervisorAddr,
  supervisorApiKey: supervisorApiKey,
  fleetName: fleetName,
  restartTimeCheckInSecs: 30,
};

logger.info('Applying Config: ' + JSON.stringify(config));

module.exports = config;
