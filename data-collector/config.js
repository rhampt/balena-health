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

const fleetName = process.env.BALENA_APP_NAME || '';

const config = {
  h10MacAddr: h10MacAddr,
  supervisorAddr: process.env.BALENA_SUPERVISOR_ADDRESS || '',
  supervisorApiKey: process.env.BALENA_SUPERVISOR_API_KEY || '',
  fleetName: fleetName,
  isLocalMode: fleetName === 'localapp',
  restartTimeCheckInSecs: process.env.BLUETOOTH_RETRY || 30,
  mqttPubIntervalInSecs: process.env.MQTT_PUB_INTERVAL || 10,
};

module.exports = { config, gatttoolArgs };
