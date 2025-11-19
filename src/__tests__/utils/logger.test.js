/**
 * Tests for logger module
 */

import { createLogger } from '../../utils/logger.js';
import logger from '../../utils/logger.js';

describe('logger', () => {
  describe('createLogger', () => {
    test('creates logger with default options', () => {
      const log = createLogger();

      expect(log).toBeDefined();
      expect(log.level).toBe('info');
    });

    test('creates logger with custom level', () => {
      const log = createLogger({ level: 'debug' });

      expect(log.level).toBe('debug');
    });

    test('creates silent logger', () => {
      const log = createLogger({ silent: true });

      expect(log.silent).toBe(true);
    });

    test('has standard logging methods', () => {
      const log = createLogger();

      expect(typeof log.error).toBe('function');
      expect(typeof log.warn).toBe('function');
      expect(typeof log.info).toBe('function');
      expect(typeof log.debug).toBe('function');
    });
  });

  describe('default logger', () => {
    test('exports default logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });

    test('has correct level from environment', () => {
      // Logger uses process.env.LOG_LEVEL or defaults to 'info'
      expect(['error', 'warn', 'info', 'debug']).toContain(logger.level);
    });

    test('is silent in test environment', () => {
      // In test environment, logger should be silent
      expect(logger.silent).toBe(true);
    });
  });
});
