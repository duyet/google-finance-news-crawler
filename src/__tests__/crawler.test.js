/**
 * Tests for crawler module
 */

import { promises as fs } from 'fs';
import { crawlNews } from '../crawler.js';
import { ensureDir } from '../utils/file-utils.js';

const TEST_DIR = '/tmp/crawler-test';

describe('crawler', () => {
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

  describe('crawlNews', () => {
    test('handles dry run mode', async () => {
      const outputDir = `${TEST_DIR}/dry-run`;

      const stats = await crawlNews({
        startDate: '2024-01-01',
        endDate: '2024-01-02',
        cid: 'test-cid',
        ei: 'test-ei',
        outputDir,
        dryRun: true,
      });

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.skipped).toBe(stats.total);
      expect(stats.successful).toBe(0);
      expect(stats.failed).toBe(0);
    });

    test('creates output directory', async () => {
      const outputDir = `${TEST_DIR}/output-dir-test`;

      await crawlNews({
        startDate: '2024-01-01',
        endDate: '2024-01-01',
        cid: 'test-cid',
        ei: 'test-ei',
        outputDir,
        dryRun: true,
      });

      const dirStats = await fs.stat(outputDir);
      expect(dirStats.isDirectory()).toBe(true);
    });

    test('calls progress callback with correct parameters', async () => {
      let progressCalls = 0;
      let lastTotal = 0;

      const onProgress = (current, total, date) => {
        progressCalls++;
        lastTotal = total;
        expect(current).toBeGreaterThan(0);
        expect(current).toBeLessThanOrEqual(total);
        expect(date).toMatch(/\d{4}-\d{2}-\d{2}/);
      };

      await crawlNews({
        startDate: '2024-01-01',
        endDate: '2024-01-03',
        cid: 'test-cid',
        ei: 'test-ei',
        outputDir: `${TEST_DIR}/progress-test`,
        dryRun: true,
        onProgress,
      });

      expect(progressCalls).toBe(lastTotal);
    });

    test('returns statistics with correct structure', async () => {
      const stats = await crawlNews({
        startDate: '2024-01-01',
        endDate: '2024-01-01',
        cid: 'test-cid',
        ei: 'test-ei',
        outputDir: `${TEST_DIR}/stats-test`,
        dryRun: true,
      });

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('successful');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('skipped');
      expect(stats).toHaveProperty('errors');
      expect(Array.isArray(stats.errors)).toBe(true);
    });

    test('handles single date range', async () => {
      const stats = await crawlNews({
        startDate: '2024-01-01',
        endDate: '2024-01-01',
        cid: 'test-cid',
        ei: 'test-ei',
        outputDir: `${TEST_DIR}/single-date`,
        dryRun: true,
      });

      expect(stats.total).toBe(1);
    });

    test('handles multiple dates', async () => {
      const stats = await crawlNews({
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        cid: 'test-cid',
        ei: 'test-ei',
        outputDir: `${TEST_DIR}/multi-date`,
        dryRun: true,
      });

      expect(stats.total).toBeGreaterThan(1);
    });

    test('uses default output directory when not specified', async () => {
      const stats = await crawlNews({
        startDate: '2024-01-01',
        endDate: '2024-01-01',
        cid: 'test-cid',
        ei: 'test-ei',
        dryRun: true,
      });

      expect(stats).toBeDefined();
    });

    test('respects delay parameter in dry run', async () => {
      const startTime = Date.now();

      await crawlNews({
        startDate: '2024-01-01',
        endDate: '2024-01-03',
        cid: 'test-cid',
        ei: 'test-ei',
        outputDir: `${TEST_DIR}/delay-test`,
        delay: 50,
        dryRun: true,
      });

      const elapsed = Date.now() - startTime;
      // Should have some delays even in dry run
      expect(elapsed).toBeGreaterThan(100);
    });
  });
});
