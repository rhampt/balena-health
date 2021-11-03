const { createLogger, format, transports } = require('winston');
const path = require('path');

let logger = createLogger({
  level: 'debug',
  format: format.combine(format.colorize(), format.simple()),
  transports: [new transports.Console()],
});

module.exports = logger;
