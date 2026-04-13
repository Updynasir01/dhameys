// src/utils/logger.js
// Dhameys Airlines — Winston Logger

const winston = require('winston');
const path    = require('path');

const LOG_DIR   = path.join(process.cwd(), 'logs');
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom dev format
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  if (stack) log += `\n${stack}`;
  if (Object.keys(meta).length) log += `\n${JSON.stringify(meta, null, 2)}`;
  return log;
});

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  ),
  transports: [
    // Console — dev only
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: combine(colorize(), devFormat),
      }),
    ] : [
      new winston.transports.Console({
        format: combine(json()),
      }),
    ]),

    // Error log file
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level:    'error',
      format:   combine(json()),
      maxsize:  10 * 1024 * 1024,  // 10MB
      maxFiles: 5,
    }),

    // Combined log file
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format:   combine(json()),
      maxsize:  20 * 1024 * 1024,  // 20MB
      maxFiles: 10,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'exceptions.log'),
      format:   combine(json()),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'rejections.log'),
      format:   combine(json()),
    }),
  ],
});

// Create logs dir if missing
const fs = require('fs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

module.exports = logger;
