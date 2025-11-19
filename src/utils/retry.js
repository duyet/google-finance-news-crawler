/**
 * Retry utility with exponential backoff
 * @module utils/retry
 */

import logger from './logger.js';

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} [options.maxRetries=3] - Maximum number of retries
 * @param {number} [options.initialDelay=1000] - Initial delay in milliseconds
 * @param {number} [options.maxDelay=30000] - Maximum delay in milliseconds
 * @param {number} [options.factor=2] - Backoff factor
 * @param {Function} [options.shouldRetry] - Function to determine if should retry
 * @param {string} [options.operationName='Operation'] - Name for logging
 * @returns {Promise<*>} Result of the function
 * @throws {Error} If all retries fail
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    shouldRetry = () => true,
    operationName = 'Operation',
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) {
        logger.info(`${operationName} succeeded after ${attempt} retries`);
      }
      return result;
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      if (!shouldRetry(error)) {
        logger.warn(`${operationName} failed with non-retriable error: ${error.message}`);
        throw error;
      }

      logger.warn(
        `${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`
      );

      const jitter = Math.random() * 0.3 * delay; // Add up to 30% jitter
      const actualDelay = Math.min(delay + jitter, maxDelay);

      logger.debug(`Waiting ${Math.round(actualDelay)}ms before retry...`);
      await sleep(actualDelay);

      delay *= factor;
    }
  }

  logger.error(`${operationName} failed after ${maxRetries + 1} attempts`);
  throw lastError;
}

/**
 * Determines if an HTTP error is retriable
 * @param {Error} error - Error to check
 * @returns {boolean} True if retriable
 */
export function isRetriableHttpError(error) {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }

  // HTTP status codes that are retriable
  const retriableStatusCodes = [408, 429, 500, 502, 503, 504];
  if (error.statusCode && retriableStatusCodes.includes(error.statusCode)) {
    return true;
  }

  return false;
}

/**
 * Retry wrapper specifically for HTTP requests
 * @param {Function} fn - Async function to retry
 * @param {string} operationName - Name of the operation
 * @returns {Promise<*>} Result of the function
 */
export function retryHttpRequest(fn, operationName = 'HTTP request') {
  return retryWithBackoff(fn, {
    maxRetries: 4,
    initialDelay: 2000,
    maxDelay: 16000,
    factor: 2,
    shouldRetry: isRetriableHttpError,
    operationName,
  });
}
