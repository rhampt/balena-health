const logger = require('./logger');
const { config } = require('./config');
const { sleep, getMqttClient } = require('./utils');

// Ensure that any thrown error that I don't handle gets logged
process.on('unhandledRejection', (reason, p) => logger.error('Unhandled Promise Rejection: ' + reason.stack));

logger.info('Applying Config: ' + JSON.stringify(config));

// Global objects
let mqttClient = undefined;

let fetchCount = 0;
const getRandomBPM = async () => {
  fetchCount++;

  logger.info('Creating a random BPM value in the range 60:90');

  // Every so often, report a trigger value
  if (fetchCount % Math.floor(Math.random() * 3 + 3) === 0) {
    return JSON.stringify({ date: new Date().toISOString(), bpm: Math.floor(Math.random() * 11 + 80) });
  } else {
    return JSON.stringify({ date: new Date().toISOString(), bpm: Math.floor(Math.random() * 15 + 65) });
  }
};

// Main
(async () => {
  //sleep for a few seconds so that device state settles
  sleep(1000 * 5);

  // Connect to the MQTT broker
  try {
    mqttClient = await getMqttClient();
  } catch (err) {
    mqttClient = undefined;
    logger.error('Failed to connect to the mqtt-broker service');
    logger.error(err?.message);
  }

  // Set polling interval
  setInterval(async () => {
    mqttClient?.publish('balena', await getRandomBPM());
  }, config.mqttPubInterval * 1000);
})();
