const { createLogger, format, transports } = require('winston');
const { config } = require('./config');

let logger = undefined;

if (config.isLocalMode) {
  logger = createLogger({
    level: 'debug',
    format: format.combine(format.colorize(), format.simple()),
    transports: [new transports.Console()],
  });
} else {
  logger = createLogger({
    level: 'info',
    format: format.combine(format.colorize(), format.simple()),
    transports: [new transports.Console()],
  });
}
module.exports = logger;
