/**
 * Tests for date-utils module
 */

import {
  isValidDateFormat,
  isValidDateRange,
  formatDate,
  parseDate,
  addDays,
  getDaysDifference,
  getDateRange,
  dateToTimestamp,
  timestampToDate,
  getCurrentDate,
  isToday,
  validateDateRange,
} from '../../utils/date-utils.js';

describe('date-utils', () => {
  describe('isValidDateFormat', () => {
    test('returns true for valid date format', () => {
      expect(isValidDateFormat('2023-01-15')).toBe(true);
      expect(isValidDateFormat('2011-06-24')).toBe(true);
    });

    test('returns false for invalid date format', () => {
      expect(isValidDateFormat('2023/01/15')).toBe(false);
      expect(isValidDateFormat('15-01-2023')).toBe(false);
      expect(isValidDateFormat('2023-1-15')).toBe(false);
      expect(isValidDateFormat('invalid')).toBe(false);
    });
  });

  describe('isValidDateRange', () => {
    test('returns true for valid date range', () => {
      expect(isValidDateRange('2023-01-15')).toBe(true);
      expect(isValidDateRange('2011-06-24')).toBe(true);
    });

    test('returns false for dates out of range', () => {
      expect(isValidDateRange('1989-01-01')).toBe(false);
      expect(isValidDateRange('2100-01-01')).toBe(false);
    });

    test('returns false for invalid dates', () => {
      expect(isValidDateRange('2023-13-01')).toBe(false);
      expect(isValidDateRange('2023-01-32')).toBe(false);
    });
  });

  describe('formatDate', () => {
    test('formats date correctly', () => {
      const date = new Date('2023-01-15');
      expect(formatDate(date)).toBe('2023-01-15');
    });

    test('pads single digit month and day', () => {
      const date = new Date('2023-03-05');
      expect(formatDate(date)).toBe('2023-03-05');
    });
  });

  describe('parseDate', () => {
    test('parses valid date string', () => {
      const date = parseDate('2023-01-15');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(0); // January is 0
      expect(date.getDate()).toBe(15);
    });

    test('throws error for invalid format', () => {
      expect(() => parseDate('2023/01/15')).toThrow();
      expect(() => parseDate('invalid')).toThrow();
    });
  });

  describe('addDays', () => {
    test('adds days correctly', () => {
      const date = new Date('2023-01-15');
      const result = addDays(date, 5);
      expect(formatDate(result)).toBe('2023-01-20');
    });

    test('handles negative days', () => {
      const date = new Date('2023-01-15');
      const result = addDays(date, -5);
      expect(formatDate(result)).toBe('2023-01-10');
    });
  });

  describe('getDaysDifference', () => {
    test('calculates difference correctly', () => {
      const date1 = new Date('2023-01-15');
      const date2 = new Date('2023-01-20');
      expect(getDaysDifference(date1, date2)).toBe(5);
    });
  });

  describe('getDateRange', () => {
    test('generates date range correctly', () => {
      const range = getDateRange('2023-01-15', '2023-01-17');
      expect(range).toEqual(['2023-01-15', '2023-01-16', '2023-01-17']);
    });

    test('handles single day range', () => {
      const range = getDateRange('2023-01-15', '2023-01-15');
      expect(range).toEqual(['2023-01-15']);
    });

    test('throws error if start > end', () => {
      expect(() => getDateRange('2023-01-20', '2023-01-15')).toThrow();
    });
  });

  describe('dateToTimestamp', () => {
    test('converts date to timestamp', () => {
      const date = new Date('2023-01-15T00:00:00Z');
      const timestamp = dateToTimestamp(date);
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });
  });

  describe('timestampToDate', () => {
    test('converts timestamp to date', () => {
      const timestamp = 1673740800000;
      const date = timestampToDate(timestamp);
      expect(date).toBeInstanceOf(Date);
    });
  });

  describe('getCurrentDate', () => {
    test('returns current date in YYYY-MM-DD format', () => {
      const current = getCurrentDate();
      expect(isValidDateFormat(current)).toBe(true);
    });
  });

  describe('isToday', () => {
    test('returns true for today', () => {
      const today = getCurrentDate();
      expect(isToday(today)).toBe(true);
    });

    test('returns false for other dates', () => {
      expect(isToday('2023-01-15')).toBe(false);
    });
  });

  describe('validateDateRange', () => {
    test('validates correct date range', () => {
      const result = validateDateRange('2023-01-15', '2023-01-20');
      expect(result.valid).toBe(true);
    });

    test('rejects invalid start date format', () => {
      const result = validateDateRange('2023/01/15', '2023-01-20');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid start date format');
    });

    test('rejects start date after end date', () => {
      const result = validateDateRange('2023-01-20', '2023-01-15');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('before or equal');
    });
  });
});
