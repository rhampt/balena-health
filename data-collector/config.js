// Figured out my Mac Address by putting the container on idle and running `hcitool lescan | grep Polar`
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

const isSimulationMode = process.env.SIMULATION_MODE === 'true' || false;

let config;
if (isSimulationMode) {
  config = {
    simulationMode: isSimulationMode,
    fleetName: fleetName,
    isLocalMode: fleetName === 'localapp',
    mqttPubInterval: process.env.MQTT_PUB_INTERVAL || 30, // In Seconds
  };
} else {
  config = {
    simulationMode: isSimulationMode,
    h10MacAddr: h10MacAddr,
    fleetName: fleetName,
    isLocalMode: fleetName === 'localapp',
    bluetoothRetryPeriod: process.env.BLUETOOTH_RETRY || 30, // In Seconds
    mqttPubInterval: process.env.MQTT_PUB_INTERVAL || 30, // In Seconds
  };
}

module.exports = { config, gatttoolArgs };
