/**
 * Tests for validator module
 */

import {
  validateNewsItem,
  isValidUrl,
  sanitizeString,
  validateConfig,
  validateNewsData,
  validateNewsSchema,
} from '../../utils/validator.js';

describe('validator', () => {
  describe('validateNewsItem', () => {
    test('validates correct news item', () => {
      const item = {
        title: 'Test Title',
        url: 'https://example.com/news',
        s: 'Source',
        sp: 'Snippet',
        date: 'Jan 1, 2023',
        timestamp: '1672531200',
      };
      const result = validateNewsItem(item);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects item without title', () => {
      const item = {
        url: 'https://example.com/news',
      };
      const result = validateNewsItem(item);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title is required and must be a string');
    });

    test('rejects item without url', () => {
      const item = {
        title: 'Test Title',
      };
      const result = validateNewsItem(item);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('URL is required and must be a string');
    });

    test('rejects item with invalid url', () => {
      const item = {
        title: 'Test Title',
        url: 'not-a-url',
      };
      const result = validateNewsItem(item);
      expect(result.valid).toBe(false);
    });

    test('accepts item with only required fields', () => {
      const item = {
        title: 'Test Title',
        url: 'https://example.com/news',
      };
      const result = validateNewsItem(item);
      expect(result.valid).toBe(true);
    });
  });

  describe('isValidUrl', () => {
    test('validates http urls', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    test('validates https urls', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    test('rejects invalid urls', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    test('removes control characters', () => {
      const result = sanitizeString('hello\x00world');
      expect(result).toBe('helloworld');
    });

    test('trims whitespace', () => {
      const result = sanitizeString('  hello world  ');
      expect(result).toBe('hello world');
    });

    test('handles non-string input', () => {
      expect(sanitizeString(123)).toBe('');
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
    });
  });

  describe('validateConfig', () => {
    test('validates correct config', () => {
      const config = {
        cid: '123456',
        ei: 'abc123',
        outputDir: 'output',
        delay: 1000,
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });

    test('rejects non-numeric cid', () => {
      const config = {
        cid: 'abc',
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('CID must be a numeric string');
    });

    test('rejects path traversal in outputDir', () => {
      const config = {
        outputDir: '../etc/passwd',
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('path traversal');
    });

    test('rejects negative delay', () => {
      const config = {
        delay: -1000,
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Delay must be a non-negative number');
    });
  });

  describe('validateNewsData', () => {
    test('validates array of valid items', () => {
      const data = [
        { title: 'Title 1', url: 'https://example.com/1' },
        { title: 'Title 2', url: 'https://example.com/2' },
      ];
      const result = validateNewsData(data);
      expect(result.valid).toBe(true);
      expect(result.validItems).toBe(2);
      expect(result.invalidItems).toBe(0);
    });

    test('counts valid and invalid items', () => {
      const data = [
        { title: 'Title 1', url: 'https://example.com/1' },
        { title: 'Title 2' }, // Missing URL
      ];
      const result = validateNewsData(data);
      expect(result.valid).toBe(false);
      expect(result.validItems).toBe(1);
      expect(result.invalidItems).toBe(1);
    });

    test('rejects non-array input', () => {
      const result = validateNewsData('not-an-array');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Data must be an array');
    });
  });

  describe('validateNewsSchema', () => {
    test('validates correct schema', () => {
      const item = {
        title: 'Test',
        url: 'https://example.com',
      };
      expect(validateNewsSchema(item)).toBe(true);
    });

    test('accepts optional fields', () => {
      const item = {
        title: 'Test',
        url: 'https://example.com',
        s: 'Source',
        sp: 'Snippet',
        date: 'Jan 1',
        timestamp: '123456',
      };
      expect(validateNewsSchema(item)).toBe(true);
    });

    test('rejects missing required fields', () => {
      const item = {
        title: 'Test',
      };
      expect(validateNewsSchema(item)).toBe(false);
    });

    test('rejects unknown fields', () => {
      const item = {
        title: 'Test',
        url: 'https://example.com',
        unknownField: 'value',
      };
      expect(validateNewsSchema(item)).toBe(false);
    });
  });
});
