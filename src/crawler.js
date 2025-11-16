/**
 * Google Finance News Crawler
 * @module crawler
 */

import https from 'https';
import { getDateRange, formatDate, addDays, dateToTimestamp } from './utils/date-utils.js';
import { retryHttpRequest } from './utils/retry.js';
import { safeWriteFile, ensureDir } from './utils/file-utils.js';
import logger from './utils/logger.js';

/**
 * Makes HTTP GET request
 * @param {string} url - URL to fetch
 * @param {Object} headers - Request headers
 * @returns {Promise<string>} Response body
 */
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          const error = new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`);
          error.statusCode = res.statusCode;
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      error.code = error.code || 'ENETWORK';
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      const error = new Error('Request timeout');
      error.code = 'ETIMEDOUT';
      reject(error);
    });
  });
}

/**
 * Fetches news data for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} config - Crawler configuration
 * @returns {Promise<Object>} News data
 */
async function fetchNewsForDate(date, config) {
  const { cid, ei } = config;
  const dateObj = new Date(date);
  const nextDateObj = addDays(dateObj, 1);

  const startTimestamp = dateToTimestamp(dateObj);
  const endTimestamp = dateToTimestamp(nextDateObj);

  const url =
    `https://www.google.com/finance/kd?output=json&keydevs=1` +
    `&st=${startTimestamp}&et=${endTimestamp}` +
    `&recnews=0&cid=${cid}&ei=${ei}`;

  const headers = {
    Referer: 'https://www.google.com/finance',
    'User-Agent':
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Encoding': 'gzip, deflate, br',
    Accept: '*/*',
  };

  logger.debug(`Fetching news for ${date} (${startTimestamp} - ${endTimestamp})`);

  return retryHttpRequest(async () => httpsGet(url, headers), `Fetch news for ${date}`);
}

/**
 * Saves raw news data to file
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} data - Raw data
 * @param {string} outputDir - Output directory
 * @returns {Promise<void>}
 */
async function saveRawData(date, data, outputDir) {
  const fileName = `${date}.js`;
  const filePath = `${outputDir}/${fileName}`;

  // Wrap in module.exports for backward compatibility
  const content = `module.exports = ${data}`;

  await safeWriteFile(filePath, content);
  logger.debug(`Saved data to ${filePath}`);
}

/**
 * Sleeps for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Crawls news data for a date range
 * @param {Object} options - Crawl options
 * @param {string} options.startDate - Start date (YYYY-MM-DD)
 * @param {string} options.endDate - End date (YYYY-MM-DD)
 * @param {string} options.cid - Google Finance CID token
 * @param {string} options.ei - Google Finance EI token
 * @param {string} [options.outputDir='output'] - Output directory
 * @param {number} [options.delay=1000] - Delay between requests (ms)
 * @param {Function} [options.onProgress] - Progress callback (current, total, date)
 * @param {boolean} [options.dryRun=false] - Dry run mode (no actual requests)
 * @returns {Promise<Object>} Crawl statistics
 */
export async function crawlNews(options) {
  const {
    startDate,
    endDate,
    cid,
    ei,
    outputDir = 'output',
    delay = 1000,
    onProgress,
    dryRun = false,
  } = options;

  // Ensure output directory exists
  await ensureDir(outputDir);

  // Get date range
  const dates = getDateRange(startDate, endDate);
  const total = dates.length;

  logger.info(`Starting crawl from ${startDate} to ${endDate} (${total} days)`);

  if (dryRun) {
    logger.info('DRY RUN MODE - No actual requests will be made');
  }

  const stats = {
    total,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  for (const [index, date] of dates.entries()) {
    const current = index + 1;

    if (onProgress) {
      onProgress(current, total, date);
    }

    logger.info(`[${current}/${total}] Processing ${date}...`);

    if (dryRun) {
      logger.info(`Would fetch news for ${date}`);
      stats.skipped++;
      await sleep(100); // Small delay even in dry run
      continue;
    }

    try {
      const data = await fetchNewsForDate(date, { cid, ei });
      await saveRawData(date, data, outputDir);
      stats.successful++;
      logger.info(`Successfully crawled ${date}`);
    } catch (error) {
      stats.failed++;
      stats.errors.push({
        date,
        error: error.message,
      });
      logger.error(`Failed to crawl ${date}: ${error.message}`);
      // Continue with next date instead of failing completely
    }

    // Rate limiting
    if (current < total && delay > 0) {
      logger.debug(`Waiting ${delay}ms before next request...`);
      await sleep(delay);
    }
  }

  logger.info('Crawl completed');
  logger.info(
    `Successful: ${stats.successful}, Failed: ${stats.failed}, Skipped: ${stats.skipped}`
  );

  if (stats.errors.length > 0) {
    logger.warn(`Errors occurred for ${stats.errors.length} dates`);
  }

  return stats;
}
