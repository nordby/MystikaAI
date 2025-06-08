// server/src/utils/logger.js
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = process.env.LOG_DIR || './logs';
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFormat = this.createFormat();
    this.transports = this.createTransports();
    this.logger = this.createLogger();
  }

  createFormat() {
    return winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
          logMessage += ` ${JSON.stringify(meta)}`;
        }
        
        return logMessage;
      })
    );
  }

  createTransports() {
    const transports = [];

    if (process.env.NODE_ENV !== 'test') {
      transports.push(
        new winston.transports.Console({
          level: this.logLevel,
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      );
    }

    if (process.env.LOG_FILE_ENABLED !== 'false') {
      transports.push(
        new DailyRotateFile({
          level: 'error',
          filename: path.join(this.logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: this.logFormat
        })
      );

      transports.push(
        new DailyRotateFile({
          filename: path.join(this.logDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: this.logFormat
        })
      );
    }

    return transports;
  }

  createLogger() {
    return winston.createLogger({
      level: this.logLevel,
      format: this.logFormat,
      transports: this.transports,
      exitOnError: false,
      silent: process.env.NODE_ENV === 'test'
    });
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  http(message, meta = {}) {
    this.logger.http(message, meta);
  }

  log(level, message, meta = {}) {
    this.logger.log(level, message, meta);
  }

  child(defaultMeta) {
    return {
      info: (message, meta = {}) => this.info(message, { ...defaultMeta, ...meta }),
      error: (message, meta = {}) => this.error(message, { ...defaultMeta, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { ...defaultMeta, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { ...defaultMeta, ...meta }),
      http: (message, meta = {}) => this.http(message, { ...defaultMeta, ...meta }),
      log: (level, message, meta = {}) => this.log(level, message, { ...defaultMeta, ...meta })
    };
  }

  setLevel(level) {
    this.logger.level = level;
    this.transports.forEach(transport => {
      if (transport.level !== 'error') {
        transport.level = level;
      }
    });
  }

  getLevel() {
    return this.logger.level;
  }
}

const logger = new Logger();
module.exports = logger;