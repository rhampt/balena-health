const logger = require('./logger');
const config = require('./config');
const { sleep, getMqttClient, isMqttBrokerActive } = require('./utils');

const { spawn } = require('child_process');
const readline = require('readline');
const { clearTimeout } = require('timers');

// Ensure that any thrown error that I don't handle gets logged
process.on('unhandledRejection', (reason, p) => logger.error('Unhandled Promise Rejection: ' + reason.stack));

// Global mqttClient Object
let mqttClient = undefined;
let gatttool = undefined;

const restartBpmMonitor = async () => {
  try {
    gatttoolHeartBeat = setTimeout(restartBpmMonitor, config.restartTimeCheckInSecs * 1000);
    logger.warn('gatttool is not active, trying again');
    gatttool?.kill();
    sleep(1000);
    await readBPM();
  } catch (err) {
    logger.error(err?.message);
  }
};

// Create a heartbeat monitor for gatttool so if no stdout for some time, respawn it
let gatttoolHeartBeat = setTimeout(restartBpmMonitor, config.restartTimeCheckInSecs * 1000);

const readBPM = async () => {
  logger.info('Attempting to read your HR BPM');
  gatttool = spawn('gatttool', config.gatttoolArgs);

  const rl = readline.createInterface({ input: gatttool.stdout });
  rl.on('line', (line) => {
    clearTimeout(gatttoolHeartBeat);
    gatttoolHeartBeat = setTimeout(restartBpmMonitor, config.restartTimeCheckInSecs * 1000);

    const lineStr = line.toString();
    const byteArray = lineStr.substring(lineStr.indexOf(': ') + 2).split(' ');

    if (byteArray.length > 1) {
      const bpmInt = parseInt(Number('0x' + byteArray[1]), 10);
      if (bpmInt && !isNaN(bpmInt)) {
        // logger.debug('BPM: ' + bpmInt);
        const jsonDataPacket = JSON.stringify({ date: new Date().toISOString(), bpm: bpmInt });
        mqttClient?.publish('balena', jsonDataPacket);
      }
    }
  });

  gatttool.stderr.on('data', (data) => {
    logger.error('gatttool stderr: ' + data.toString());
  });

  gatttool.on('close', (code) => {
    logger.info('gatttool process exited with code ' + code?.toString());
  });
};

// Main
(async () => {
  //sleep for a few seconds so that device state settles
  sleep(1000 * 5);

  // First check if the mqtt-broker service is active
  try {
    await isMqttBrokerActive();
  } catch (err) {
    logger.error(err?.message);
  }

  // Connect to the MQTT broker
  try {
    mqttClient = await getMqttClient();
  } catch (err) {
    mqttClient = undefined;
    logger.error('Failed to connect to the mqtt-broker service');
    logger.error(err?.message);
  }

  // Connect to the BLE Heart Rate Sensor and send the values (if MQTT enabled)
  try {
    await readBPM();
  } catch (err) {
    logger.error(err?.message);
  }
})();
