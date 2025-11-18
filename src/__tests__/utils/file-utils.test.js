/**
 * Tests for file-utils module
 */

import { promises as fs } from 'fs';
import {
  ensureDir,
  safeReadFile,
  safeWriteFile,
  fileExists,
  listFiles,
  safeDeleteFile,
  getFileStats,
  validatePath,
  readJsonFile,
  writeJsonFile,
} from '../../utils/file-utils.js';

const TEST_DIR = '/tmp/file-utils-test';

describe('file-utils', () => {
  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('ensureDir', () => {
    test('creates directory recursively', async () => {
      const testPath = `${TEST_DIR}/nested/dir`;

      await ensureDir(testPath);

      const stats = await fs.stat(testPath);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('safeWriteFile and safeReadFile', () => {
    test('writes and reads file successfully', async () => {
      const testPath = `${TEST_DIR}/test-file.txt`;
      const content = 'Hello, World!';

      await safeWriteFile(testPath, content);
      const readContent = await safeReadFile(testPath);

      expect(readContent).toBe(content);
    });

    test('writes file non-atomically when requested', async () => {
      const testPath = `${TEST_DIR}/non-atomic.txt`;

      await safeWriteFile(testPath, 'content', { atomic: false });

      const exists = await fileExists(testPath);
      expect(exists).toBe(true);
    });

    test('respects custom encoding', async () => {
      const testPath = `${TEST_DIR}/encoding-test.txt`;

      await safeWriteFile(testPath, 'test', { encoding: 'utf8' });
      const content = await safeReadFile(testPath, { encoding: 'utf8' });

      expect(content).toBe('test');
    });

    test('throws error when reading non-existent file', async () => {
      await expect(safeReadFile(`${TEST_DIR}/non-existent.txt`)).rejects.toThrow();
    });
  });

  describe('fileExists', () => {
    test('returns true if file exists', async () => {
      const testPath = `${TEST_DIR}/exists-test.txt`;
      await safeWriteFile(testPath, 'test');

      const exists = await fileExists(testPath);

      expect(exists).toBe(true);
    });

    test('returns false if file does not exist', async () => {
      const exists = await fileExists(`${TEST_DIR}/does-not-exist.txt`);

      expect(exists).toBe(false);
    });
  });

  describe('listFiles', () => {
    beforeAll(async () => {
      const listDir = `${TEST_DIR}/list-test`;
      await ensureDir(listDir);
      await safeWriteFile(`${listDir}/file1.js`, 'test');
      await safeWriteFile(`${listDir}/file2.txt`, 'test');
      await safeWriteFile(`${listDir}/file3.js`, 'test');
    });

    test('lists all files in directory', async () => {
      const files = await listFiles(`${TEST_DIR}/list-test`);

      expect(files).toContain('file1.js');
      expect(files).toContain('file2.txt');
      expect(files).toContain('file3.js');
    });

    test('filters files by extension', async () => {
      const files = await listFiles(`${TEST_DIR}/list-test`, { extension: '.js' });

      expect(files).toContain('file1.js');
      expect(files).toContain('file3.js');
      expect(files).not.toContain('file2.txt');
    });

    test('handles extension without dot', async () => {
      const files = await listFiles(`${TEST_DIR}/list-test`, { extension: 'js' });

      expect(files.length).toBe(2);
    });

    test('throws error for non-existent directory', async () => {
      await expect(listFiles(`${TEST_DIR}/non-existent-dir`)).rejects.toThrow();
    });
  });

  describe('safeDeleteFile', () => {
    test('deletes file successfully', async () => {
      const testPath = `${TEST_DIR}/delete-test.txt`;
      await safeWriteFile(testPath, 'test');

      const result = await safeDeleteFile(testPath);

      expect(result).toBe(true);
      expect(await fileExists(testPath)).toBe(false);
    });

    test('returns false if file does not exist', async () => {
      const result = await safeDeleteFile(`${TEST_DIR}/non-existent-delete.txt`);

      expect(result).toBe(false);
    });
  });

  describe('getFileStats', () => {
    test('returns file stats', async () => {
      const testPath = `${TEST_DIR}/stats-test.txt`;
      await safeWriteFile(testPath, 'test content');

      const stats = await getFileStats(testPath);

      expect(stats.size).toBeGreaterThan(0);
      expect(stats.mtime).toBeDefined();
      expect(typeof stats.mtime.getTime).toBe('function');
    });

    test('throws error for non-existent file', async () => {
      await expect(getFileStats(`${TEST_DIR}/non-existent-stats.txt`)).rejects.toThrow();
    });
  });

  describe('validatePath', () => {
    test('allows valid path within base', () => {
      const result = validatePath('/base', 'subdir/file.txt');

      expect(result).toContain('/base');
      expect(result).toContain('subdir');
    });

    test('prevents path traversal attack', () => {
      expect(() => {
        validatePath('/base', '../etc/passwd');
      }).toThrow('Path traversal detected');
    });

    test('handles absolute paths correctly', () => {
      expect(() => {
        validatePath('/base', '/etc/passwd');
      }).toThrow('Path traversal detected');
    });
  });

  describe('readJsonFile and writeJsonFile', () => {
    test('writes and reads JSON file', async () => {
      const testPath = `${TEST_DIR}/test.json`;
      const data = { key: 'value', number: 42, nested: { prop: 'test' } };

      await writeJsonFile(testPath, data);
      const readData = await readJsonFile(testPath);

      expect(readData).toEqual(data);
    });

    test('respects custom spacing', async () => {
      const testPath = `${TEST_DIR}/spaced.json`;

      await writeJsonFile(testPath, { key: 'value' }, { spaces: 4 });

      const content = await safeReadFile(testPath);
      expect(content).toContain('    '); // 4 spaces
    });

    test('throws error on invalid JSON', async () => {
      const testPath = `${TEST_DIR}/invalid.json`;
      await safeWriteFile(testPath, 'invalid json');

      await expect(readJsonFile(testPath)).rejects.toThrow();
    });
  });
});
