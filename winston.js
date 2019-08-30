var appRoot = require('app-root-path');
var winston = require('winston');
require('winston-daily-rotate-file')

const DAILY_LOG_NAME = `${appRoot}/logs/` + Config.winston_daily_file;
const ERR_LOG_NAME = `${appRoot}/logs/` + Config.winston_err_file;

const formatter = winston.format.combine(
    winston.format.json(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => {
        const showInfo = { time: info.timestamp, pid: process.pid, level: info.level, message: info.message };
        return JSON.stringify(showInfo)
    })
)

const levels = {
  logs: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  silly: 5
}

var options = {
    err_file: {
        level: 'error',
        timestamp: true,
        filename: ERR_LOG_NAME,
        handleExceptions: true,
        json: true,
        maxsize: 5214726, // 5MB
        maxFiles: 5,
        colorize: false,
    },
    daily_file: {
        filename: DAILY_LOG_NAME,
        zippedArchive: true,
        maxFiles: Config.winston_save_days
    },
    console: {
        level: 'info',
        handleExceptions: true,
        json: false,
        colorize: true,
    },
};

var logger = winston.createLogger({
    format: formatter,
    transports: [
        new winston.transports.File(options.err_file),
        new(winston.transports.DailyRotateFile)(options.daily_file),
        new winston.transports.Console(options.console)
    ],
    exitOnError: false, // do not exit on handled exceptions
});

logger.stream = {
    write: function(message, encoding) {
        logger.info(message);
    },
};

module.exports = logger;