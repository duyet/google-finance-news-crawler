/**
 * Logger utility using Winston
 * @module utils/logger
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom log format
 */
const customFormat = printf(({ level, message, timestamp: ts, stack }) => {
  if (stack) {
    return `${ts} [${level}]: ${message}\n${stack}`;
  }
  return `${ts} [${level}]: ${message}`;
});

/**
 * Creates a logger instance
 * @param {Object} options - Logger options
 * @param {string} [options.level='info'] - Log level
 * @param {boolean} [options.silent=false] - Silent mode
 * @returns {winston.Logger} Logger instance
 */
export function createLogger(options = {}) {
  const { level = 'info', silent = false } = options;

  return winston.createLogger({
    level,
    silent,
    format: combine(
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      customFormat
    ),
    transports: [
      new winston.transports.Console({
        format: combine(colorize(), customFormat),
      }),
    ],
  });
}

/**
 * Default logger instance
 */
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  silent: process.env.NODE_ENV === 'test',
});

export default logger;
