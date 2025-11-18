/**
 * Tests for converter module
 */

import { promises as fs } from 'fs';
import { convertToJson } from '../converter.js';
import { ensureDir } from '../utils/file-utils.js';

const TEST_DIR = '/tmp/converter-test';

describe('converter', () => {
  beforeAll(async () => {
    await ensureDir(TEST_DIR);
  });

  afterAll(async () => {
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('convertToJson', () => {
    test('returns early when no files found', async () => {
      const emptyDir = `${TEST_DIR}/empty`;
      await ensureDir(emptyDir);

      const stats = await convertToJson({
        inputDir: emptyDir,
        outputFile: `${TEST_DIR}/empty-output.json`,
      });

      expect(stats.totalFiles).toBe(0);
      expect(stats.processedFiles).toBe(0);
    });

    test('converts valid data file', async () => {
      const inputDir = `${TEST_DIR}/valid-data`;
      await ensureDir(inputDir);

      // Create a test data file
      const testData = `module.exports = {
        "clusters": [
          {
            "a": [
              {
                "t": "Test Article",
                "u": "http://test.com/article",
                "s": "Test Source",
                "sp": "Test Provider",
                "d": "2024-01-01",
                "tt": "1704067200"
              }
            ]
          }
        ]
      };`;

      await fs.writeFile(`${inputDir}/2024-01-01.js`, testData, 'utf8');

      const stats = await convertToJson({
        inputDir,
        outputFile: `${TEST_DIR}/valid-output.json`,
      });

      expect(stats.processedFiles).toBe(1);
      expect(stats.totalItems).toBeGreaterThan(0);
    });

    test('handles files with no clusters', async () => {
      const inputDir = `${TEST_DIR}/no-clusters`;
      await ensureDir(inputDir);

      const testData = 'module.exports = {};';
      await fs.writeFile(`${inputDir}/empty.js`, testData, 'utf8');

      const stats = await convertToJson({
        inputDir,
        outputFile: `${TEST_DIR}/no-clusters-output.json`,
      });

      expect(stats.processedFiles).toBe(1);
      expect(stats.totalItems).toBe(0);
    });

    test('handles malformed files gracefully', async () => {
      const inputDir = `${TEST_DIR}/malformed`;
      await ensureDir(inputDir);

      // Create a malformed file
      await fs.writeFile(`${inputDir}/bad.js`, 'this is not valid javascript;;;', 'utf8');

      const stats = await convertToJson({
        inputDir,
        outputFile: `${TEST_DIR}/malformed-output.json`,
      });

      expect(stats.failedFiles).toBe(1);
    });

    test('deduplicates items when enabled', async () => {
      const inputDir = `${TEST_DIR}/duplicates`;
      await ensureDir(inputDir);

      const testData = `module.exports = {
        "clusters": [
          {
            "a": [
              {
                "t": "Article 1",
                "u": "http://same-url.com",
                "s": "Source",
                "sp": "Provider",
                "d": "2024-01-01",
                "tt": "1704067200"
              },
              {
                "t": "Article 2",
                "u": "http://same-url.com",
                "s": "Source",
                "sp": "Provider",
                "d": "2024-01-01",
                "tt": "1704067200"
              }
            ]
          }
        ]
      };`;

      await fs.writeFile(`${inputDir}/dup.js`, testData, 'utf8');

      const stats = await convertToJson({
        inputDir,
        outputFile: `${TEST_DIR}/dup-output.json`,
        deduplicate: true,
      });

      expect(stats.duplicatesRemoved).toBeGreaterThan(0);
    });

    test('respects validate option', async () => {
      const inputDir = `${TEST_DIR}/validate`;
      await ensureDir(inputDir);

      const testData = `module.exports = {
        "clusters": [
          {
            "a": [
              {
                "t": "Valid Article",
                "u": "http://test.com",
                "s": "Source",
                "sp": "Provider",
                "d": "2024-01-01",
                "tt": "1704067200"
              }
            ]
          }
        ]
      };`;

      await fs.writeFile(`${inputDir}/validate.js`, testData, 'utf8');

      const stats = await convertToJson({
        inputDir,
        outputFile: `${TEST_DIR}/validate-output.json`,
        validate: true,
      });

      expect(stats.validItems).toBeGreaterThanOrEqual(0);
    });

    test('calls progress callback', async () => {
      const inputDir = `${TEST_DIR}/progress`;
      await ensureDir(inputDir);

      const testData = 'module.exports = {"clusters":[]};';
      await fs.writeFile(`${inputDir}/file1.js`, testData, 'utf8');
      await fs.writeFile(`${inputDir}/file2.js`, testData, 'utf8');

      let progressCalls = 0;
      const onProgress = () => {
        progressCalls++;
      };

      await convertToJson({
        inputDir,
        outputFile: `${TEST_DIR}/progress-output.json`,
        onProgress,
      });

      expect(progressCalls).toBe(2);
    });
  });
});
