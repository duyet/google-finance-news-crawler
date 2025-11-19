/**
 * Tests for retry utility
 */

import { retryWithBackoff, isRetriableHttpError, retryHttpRequest } from '../../utils/retry.js';

describe('retry', () => {
  describe('retryWithBackoff', () => {
    test('succeeds on first attempt', async () => {
      let callCount = 0;
      const fn = () => {
        callCount++;
        return 'success';
      };

      const result = await retryWithBackoff(fn, { maxRetries: 3 });

      expect(result).toBe('success');
      expect(callCount).toBe(1);
    });

    test('retries on failure and eventually succeeds', async () => {
      let callCount = 0;
      const fn = () => {
        callCount++;
        if (callCount < 3) {
          throw new Error(`fail ${callCount}`);
        }
        return 'success';
      };

      const result = await retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 10,
      });

      expect(result).toBe('success');
      expect(callCount).toBe(3);
    });

    test('throws error after max retries', async () => {
      let callCount = 0;
      const fn = () => {
        callCount++;
        throw new Error('always fails');
      };

      await expect(
        retryWithBackoff(fn, {
          maxRetries: 2,
          initialDelay: 10,
        })
      ).rejects.toThrow('always fails');

      expect(callCount).toBe(3); // Initial + 2 retries
    });

    test('respects shouldRetry function', async () => {
      let callCount = 0;
      let shouldRetryCallCount = 0;

      const fn = () => {
        callCount++;
        throw new Error('non-retriable');
      };

      const shouldRetry = () => {
        shouldRetryCallCount++;
        return false;
      };

      await expect(
        retryWithBackoff(fn, {
          maxRetries: 3,
          shouldRetry,
        })
      ).rejects.toThrow('non-retriable');

      expect(callCount).toBe(1);
      expect(shouldRetryCallCount).toBe(1);
    });

    test('applies exponential backoff', async () => {
      let callCount = 0;
      const fn = () => {
        callCount++;
        if (callCount < 3) {
          throw new Error(`fail ${callCount}`);
        }
        return 'success';
      };

      const startTime = Date.now();
      await retryWithBackoff(fn, {
        maxRetries: 2,
        initialDelay: 50,
        factor: 2,
      });
      const duration = Date.now() - startTime;

      // Should wait at least 50ms (first retry) + 100ms (second retry)
      expect(duration).toBeGreaterThanOrEqual(100);
    });

    test('respects max delay', async () => {
      let callCount = 0;
      const fn = () => {
        callCount++;
        if (callCount < 2) {
          throw new Error('fail');
        }
        return 'success';
      };

      await retryWithBackoff(fn, {
        maxRetries: 1,
        initialDelay: 1000,
        maxDelay: 50,
      });

      expect(callCount).toBe(2);
    });

    test('uses custom operation name in logs', async () => {
      const fn = () => 'success';

      const result = await retryWithBackoff(fn, {
        operationName: 'Custom Operation',
      });

      expect(result).toBe('success');
    });
  });

  describe('isRetriableHttpError', () => {
    test('returns true for network errors', () => {
      const errors = [{ code: 'ECONNRESET' }, { code: 'ETIMEDOUT' }, { code: 'ENOTFOUND' }];

      errors.forEach((error) => {
        expect(isRetriableHttpError(error)).toBe(true);
      });
    });

    test('returns true for retriable status codes', () => {
      const statusCodes = [408, 429, 500, 502, 503, 504];

      statusCodes.forEach((statusCode) => {
        expect(isRetriableHttpError({ statusCode })).toBe(true);
      });
    });

    test('returns false for non-retriable status codes', () => {
      const statusCodes = [200, 201, 400, 401, 403, 404];

      statusCodes.forEach((statusCode) => {
        expect(isRetriableHttpError({ statusCode })).toBe(false);
      });
    });

    test('returns false for errors without retriable indicators', () => {
      expect(isRetriableHttpError(new Error('generic error'))).toBe(false);
      expect(isRetriableHttpError({ code: 'OTHER' })).toBe(false);
      expect(isRetriableHttpError({})).toBe(false);
    });
  });

  describe('retryHttpRequest', () => {
    test('calls function and returns result', async () => {
      const fn = () => 'http result';

      const result = await retryHttpRequest(fn, 'Test HTTP Request');

      expect(result).toBe('http result');
    });

    test('retries on network errors', async () => {
      let callCount = 0;
      const fn = () => {
        callCount++;
        if (callCount < 2) {
          const error = new Error('Network error');
          error.code = 'ECONNRESET';
          throw error;
        }
        return 'success';
      };

      const result = await retryHttpRequest(fn, 'Test');

      expect(result).toBe('success');
      expect(callCount).toBe(2);
    });

    test('does not retry on non-retriable errors', async () => {
      let callCount = 0;
      const fn = () => {
        callCount++;
        const error = new Error('Not found');
        error.statusCode = 404;
        throw error;
      };

      await expect(retryHttpRequest(fn, 'Test')).rejects.toThrow('Not found');

      expect(callCount).toBe(1);
    });
  });
});
