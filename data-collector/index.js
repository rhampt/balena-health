const logger = require('./logger');
const { spawn } = require('child_process');
const readline = require('readline');
const axios = require('axios').default;
const mqtt = require('mqtt');

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

let MQTT_CONNECTED = false;

// TODO: Detect if no stdout for 30 seconds; (such as periferal goes out of range)

// Global state
let GATTTOOL_ACTIVE = false;

const Main = async (mqttClient) => {
  try {
    const gatttool = spawn('gatttool', GATTTOOL_ARGS);

    const rl = readline.createInterface({ input: gatttool.stdout });
    rl.on('line', (line) => {
      GATTTOOL_ACTIVE = true;
      let lineStr = line.toString();

      // logger.debug(lineStr);

      lineStr = lineStr.substring(lineStr.indexOf(': ') + 2);
      const valueArray = lineStr.split(' ');
      if (valueArray.length > 1) {
        const bpm = parseInt(Number('0x' + valueArray[1]), 10);
        if (bpm && bpm !== NaN) {
          const bpmInt = parseInt(Number('0x' + valueArray[1]), 10);
          // logger.debug('BPM: ' + bpmInt);
          const jsonDataPacket = JSON.stringify({ date: new Date().toISOString(), bpm: bpmInt });
          if (MQTT_CONNECTED) mqttClient.publish('balena', jsonDataPacket);
        }
      }
    });

    gatttool.stderr.on('data', (data) => {
      logger.error(data.toString());
    });

    gatttool.on('close', (code) => {
      logger.info('gatttool process exited with code ' + code?.toString());
      GATTTOOL_ACTIVE = false;
    });
  } catch (err) {
    logger.error(err?.message);
    GATTTOOL_ACTIVE = false;
  }
};

const mqttConnect = async () => {
  try {
    const address = process.env?.BALENA_SUPERVISOR_ADDRESS || '';
    const apiKey = process.env?.BALENA_SUPERVISOR_API_KEY || '';
    let appName = process.env?.BALENA_APP_NAME || '';
    if (appName === 'localapp') appName = 'Home-MS-2';
    const url = `${address}/v2/applications/state?apikey=${apiKey}`;

    let response = await axios.get(url);
    const services = response.data[appName].services;

    if (Object.keys(services).includes('mqtt')) {
      logger.info('Success, MQTT is listed in services');
    } else {
      throw new Error("Boo, MQTT isn't listed for some reason");
    }

    const client = mqtt.connect('mqtt://localhost', 1883, 60);

    client.on('connect', function () {
      client.subscribe('balena', function (err) {
        if (!err) {
          MQTT_CONNECTED = true;
        }
      });
    });

    client.on('disconnect', function () {
      MQTT_CONNECTED = false;
    });

    client.on('message', function (topic, message) {
      logger.info('MQTT MESSAGE (subscribed to balena): ' + message.toString());
    });

    return client;
  } catch (err) {
    logger.error(err?.message);
    client.end();
    MQTT_CONNECTED = false;
  }
};

(async () => {
  // Try every 1 minute to connect to the MQTT broker in sibling container
  let mqttClient = await mqttConnect();
  setInterval(async () => {
    if (!MQTT_CONNECTED) mqttClient = await mqttConnect();
  }, 60 * 1000);

  logger.info('Attempting to read heart rate values...');
  await Main(mqttClient);
  setInterval(async (mqttClient) => {
    if (!GATTTOOL_ACTIVE) {
      logger.info('Attempting to read heart rate values...');
      await Main(mqttClient);
    }
  }, 60 * 1000); // Try again in 1 min
})();
