const logger = require('./logger');
const { config, gatttoolArgs } = require('./config');
const { sleep, getMqttClient } = require('./utils');

const { spawn } = require('child_process');
const readline = require('readline');
const { clearTimeout } = require('timers');

// Ensure that any thrown error that I don't handle gets logged
process.on('unhandledRejection', (reason, p) => logger.error('Unhandled Promise Rejection: ' + reason.stack));

logger.info('Applying Config: ' + JSON.stringify(config));

// Global objects
let mqttClient = undefined;
let gatttool = undefined;
let gatttoolActive = false;
let lastBpmPacket = undefined;

const restartBpmMonitor = async () => {
  try {
    gatttoolHeartBeat = setTimeout(restartBpmMonitor, config.bluetoothRetryPeriod * 1000);
    logger.warn('gatttool is not active, trying again');
    gatttool?.kill();
    sleep(1000);
    await readBPM();
  } catch (err) {
    logger.error(err?.message);
  }
};

// Create a heartbeat monitor for gatttool so if no stdout for some time, re-spawn it
let gatttoolHeartBeat = setTimeout(restartBpmMonitor, config.bluetoothRetryPeriod * 1000);

const readBPM = async () => {
  logger.info('Attempting to read your heart rate');
  gatttool = spawn('gatttool', gatttoolArgs);

  const rl = readline.createInterface({ input: gatttool.stdout });
  rl.on('line', (line) => {
    gatttoolActive = true;
    clearTimeout(gatttoolHeartBeat);
    gatttoolHeartBeat = setTimeout(restartBpmMonitor, config.bluetoothRetryPeriod * 1000);

    const lineStr = line.toString();
    const byteArray = lineStr.substring(lineStr.indexOf(': ') + 2).split(' ');

    if (byteArray.length > 1) {
      const bpmInt = parseInt(Number('0x' + byteArray[1]), 10);
      if (bpmInt && !isNaN(bpmInt)) {
        lastBpmPacket = JSON.stringify({ date: new Date().toISOString(), bpm: bpmInt });
      }
    }
  });

  gatttool.stderr.on('data', (data) => {
    logger.error('gatttool stderr: ' + data.toString());
  });

  gatttool.on('close', (code) => {
    gatttoolActive = false;
    if (!code) logger.info('gatttool was killed (no stdout for ' + config.bluetoothRetryPeriod + ' seconds');
    else logger.info('gatttool process exited with code ' + code?.toString());
  });
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
    if (lastBpmPacket && gatttoolActive) mqttClient?.publish('balena', lastBpmPacket);
  }, config.mqttPubInterval * 1000);

  // Connect to the BLE Heart Rate Sensor and send the values (if MQTT enabled)
  try {
    await readBPM();
  } catch (err) {
    logger.error(err?.message);
  }
})();
