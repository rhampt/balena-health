const logger = require('./logger');

// Ensure that anything unhandled gets logged
process.on('unhandledRejection', (reason, p) => logger.error('Unhandled Promise Rejection: ' + reason.stack));

const Main = async () => {
  try {
    //TODO
  } catch (err) {
    logger.error('Unknown Error Caught in Main');
    logger.error(err?.message);
  }
};

(async () => {
  logger.info('Hello from index.js');
  await Main();
  //   setInterval(async () => {}, 5 * 60 * 1000); // Keep node alive
})();
