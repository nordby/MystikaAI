// bot/src/utils/logger.js
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

class BotLogger {
  constructor() {
    this.logDir = process.env.BOT_LOG_DIR || './logs/bot';
    this.logLevel = process.env.BOT_LOG_LEVEL || 'info';
    this.logger = this.createLogger();
  }

  createLogger() {
    const format = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let logMessage = `${timestamp} [BOT][${level.toUpperCase()}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
          logMessage += ` ${JSON.stringify(meta)}`;
        }
        
        return logMessage;
      })
    );

    const transports = [];

    // Console transport
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

    // File transports
    if (process.env.BOT_LOG_FILE_ENABLED !== 'false') {
      transports.push(
        new DailyRotateFile({
          level: 'error',
          filename: path.join(this.logDir, 'bot-error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format
        })
      );

      transports.push(
        new DailyRotateFile({
          filename: path.join(this.logDir, 'bot-combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format
        })
      );
    }

    return winston.createLogger({
      level: this.logLevel,
      format,
      transports,
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

  log(level, message, meta = {}) {
    this.logger.log(level, message, meta);
  }
}

module.exports = new BotLogger();