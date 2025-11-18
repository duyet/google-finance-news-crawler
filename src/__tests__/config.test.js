/**
 * Tests for config module
 */

import { promises as fs } from 'fs';
import {
  loadConfigFile,
  mergeConfigs,
  getConfig,
  validateConfiguration,
  saveConfigFile,
  createDefaultConfigFile,
  DEFAULT_CONFIG,
} from '../config.js';

const TEST_CONFIG_DIR = '/tmp/config-test';

describe('config', () => {
  beforeAll(async () => {
    await fs.mkdir(TEST_CONFIG_DIR, { recursive: true });
  });

  afterAll(async () => {
    try {
      await fs.rm(TEST_CONFIG_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('DEFAULT_CONFIG', () => {
    test('exports default configuration', () => {
      expect(DEFAULT_CONFIG).toBeDefined();
      expect(DEFAULT_CONFIG.outputDir).toBe('output');
      expect(DEFAULT_CONFIG.outputFile).toBe('pandora.json');
    });

    test('has sensible defaults', () => {
      expect(DEFAULT_CONFIG.delay).toBe(1000);
      expect(DEFAULT_CONFIG.maxRetries).toBe(4);
      expect(DEFAULT_CONFIG.validate).toBe(true);
      expect(DEFAULT_CONFIG.deduplicate).toBe(true);
      expect(DEFAULT_CONFIG.sort).toBe(true);
    });
  });

  describe('mergeConfigs', () => {
    test('merges multiple configs with precedence', () => {
      const config1 = { cid: 'config1', delay: 1000 };
      const config2 = { cid: 'config2', maxRetries: 5 };
      const config3 = { cid: 'config3' };

      const merged = mergeConfigs(config1, config2, config3);

      expect(merged.cid).toBe('config3'); // Last one wins
      expect(merged.delay).toBe(1000); // From config1
      expect(merged.maxRetries).toBe(5); // From config2
    });

    test('includes default config values', () => {
      const merged = mergeConfigs({ cid: 'test' });

      expect(merged.outputDir).toBe('output');
      expect(merged.outputFile).toBe('pandora.json');
    });

    test('handles null/undefined configs', () => {
      const merged = mergeConfigs(null, undefined, { cid: 'test' });

      expect(merged.cid).toBe('test');
      expect(merged.outputDir).toBe('output');
    });

    test('returns default config when no configs provided', () => {
      const merged = mergeConfigs();

      expect(merged).toEqual(expect.objectContaining(DEFAULT_CONFIG));
    });
  });

  describe('getConfig', () => {
    test('returns config with overrides', () => {
      const config = getConfig({ cid: 'override-cid', delay: 2000 });

      expect(config.cid).toBe('override-cid');
      expect(config.delay).toBe(2000);
      expect(config.outputDir).toBe('output'); // Default value
    });

    test('returns default config when no overrides', () => {
      const config = getConfig();

      expect(config).toEqual(expect.objectContaining(DEFAULT_CONFIG));
    });
  });

  describe('validateConfiguration', () => {
    test('validates valid configuration', () => {
      const result = validateConfiguration({
        cid: '123456',
        ei: 'test-ei',
        outputDir: 'output',
        delay: 1000,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('rejects invalid cid', () => {
      const result = validateConfiguration({
        cid: 'not-numeric',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('saveConfigFile and loadConfigFile', () => {
    test('saves and loads config file', async () => {
      const testPath = `${TEST_CONFIG_DIR}/test-config.json`;
      const config = { cid: 'test-cid', ei: 'test-ei', delay: 2000 };

      await saveConfigFile(testPath, config);
      const loaded = await loadConfigFile(testPath);

      expect(loaded).toEqual(config);
    });

    test('returns empty object when file does not exist', async () => {
      const config = await loadConfigFile(`${TEST_CONFIG_DIR}/non-existent.json`);

      expect(config).toEqual({});
    });

    test('throws error on invalid JSON', async () => {
      const testPath = `${TEST_CONFIG_DIR}/invalid.json`;
      await fs.writeFile(testPath, 'invalid json', 'utf8');

      await expect(loadConfigFile(testPath)).rejects.toThrow();
    });
  });

  describe('createDefaultConfigFile', () => {
    test('creates file with default config', async () => {
      const testPath = `${TEST_CONFIG_DIR}/default-config.json`;

      await createDefaultConfigFile(testPath);

      const loaded = await loadConfigFile(testPath);
      expect(loaded).toEqual(DEFAULT_CONFIG);
    });
  });
});
