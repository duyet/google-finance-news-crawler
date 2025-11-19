/**
 * Converter module - Transforms raw data to structured JSON
 * @module converter
 */

import { listFiles, safeReadFile, writeJsonFile } from './utils/file-utils.js';
import { validateNewsItem, sanitizeString } from './utils/validator.js';
import logger from './utils/logger.js';
import vm from 'vm';

/**
 * Safely parses JavaScript module.exports file using VM
 * @param {string} content - File content
 * @param {string} fileName - File name for error reporting
 * @returns {Object} Parsed data
 * @throws {Error} If parsing fails
 */
function safeParseModuleExports(content, fileName) {
  try {
    // Create a sandbox context
    const sandbox = {
      module: { exports: {} },
      exports: {},
    };

    // Run code in sandbox with timeout
    const script = new vm.Script(content, {
      filename: fileName,
      timeout: 5000, // 5 second timeout
    });

    script.runInNewContext(sandbox, {
      timeout: 5000,
      displayErrors: true,
    });

    return sandbox.module.exports;
  } catch (error) {
    throw new Error(`Failed to parse ${fileName}: ${error.message}`);
  }
}

/**
 * Extracts news items from raw data structure
 * @param {Object} rawData - Raw data from Google Finance API
 * @returns {Array} Array of news items
 */
function extractNewsItems(rawData) {
  const items = [];

  if (!rawData || !rawData.clusters || !Array.isArray(rawData.clusters)) {
    logger.warn('Invalid data structure: missing clusters array');
    return items;
  }

  for (const cluster of rawData.clusters) {
    if (!cluster.a || !Array.isArray(cluster.a)) {
      continue;
    }

    for (const article of cluster.a) {
      if (!article) {
        continue;
      }

      // Transform and sanitize
      const item = {
        title: sanitizeString(article.t || ''),
        url: sanitizeString(article.u || ''),
        s: sanitizeString(article.s || ''),
        sp: sanitizeString(article.sp || ''),
        date: sanitizeString(article.d || ''),
        timestamp: sanitizeString(article.tt || ''),
      };

      // Only add if has minimum required fields
      if (item.title && item.url) {
        items.push(item);
      }
    }
  }

  return items;
}

/**
 * Deduplicates news items by URL
 * @param {Array} items - Array of news items
 * @returns {Array} Deduplicated array
 */
function deduplicateItems(items) {
  const seen = new Set();
  const deduplicated = [];

  for (const item of items) {
    if (!seen.has(item.url)) {
      seen.add(item.url);
      deduplicated.push(item);
    }
  }

  if (items.length !== deduplicated.length) {
    logger.info(`Removed ${items.length - deduplicated.length} duplicate items`);
  }

  return deduplicated;
}

/**
 * Sorts news items by timestamp
 * @param {Array} items - Array of news items
 * @returns {Array} Sorted array
 */
function sortByTimestamp(items) {
  return items.sort((a, b) => {
    const timestampA = parseInt(a.timestamp, 10) || 0;
    const timestampB = parseInt(b.timestamp, 10) || 0;
    return timestampA - timestampB;
  });
}

/**
 * Converts raw JavaScript files to structured JSON
 * @param {Object} options - Conversion options
 * @param {string} [options.inputDir='output'] - Input directory
 * @param {string} [options.outputFile='pandora.json'] - Output file path
 * @param {boolean} [options.validate=true] - Validate items
 * @param {boolean} [options.deduplicate=true] - Deduplicate items
 * @param {boolean} [options.sort=true] - Sort by timestamp
 * @param {Function} [options.onProgress] - Progress callback (current, total, file)
 * @returns {Promise<Object>} Conversion statistics
 */
export async function convertToJson(options = {}) {
  const {
    inputDir = 'output',
    outputFile = 'pandora.json',
    validate = true,
    deduplicate = true,
    sort = true,
    onProgress,
  } = options;

  logger.info(`Converting files from ${inputDir} to ${outputFile}`);

  // List all .js files in input directory
  const files = await listFiles(inputDir, { extension: '.js' });

  if (files.length === 0) {
    logger.warn(`No .js files found in ${inputDir}`);
    return {
      totalFiles: 0,
      processedFiles: 0,
      totalItems: 0,
      validItems: 0,
      invalidItems: 0,
    };
  }

  logger.info(`Found ${files.length} files to process`);

  const stats = {
    totalFiles: files.length,
    processedFiles: 0,
    failedFiles: 0,
    totalItems: 0,
    validItems: 0,
    invalidItems: 0,
    duplicatesRemoved: 0,
  };

  let allItems = [];

  // Process each file
  for (const [index, fileName] of files.entries()) {
    const current = index + 1;

    if (onProgress) {
      onProgress(current, files.length, fileName);
    }

    logger.debug(`[${current}/${files.length}] Processing ${fileName}...`);

    try {
      const filePath = `${inputDir}/${fileName}`;
      const content = await safeReadFile(filePath);

      // Parse the module.exports file safely
      const rawData = safeParseModuleExports(content, fileName);

      // Extract news items
      const items = extractNewsItems(rawData);

      logger.debug(`Extracted ${items.length} items from ${fileName}`);

      allItems = allItems.concat(items);
      stats.processedFiles++;
    } catch (error) {
      stats.failedFiles++;
      logger.error(`Failed to process ${fileName}: ${error.message}`);
      // Continue with other files
    }
  }

  stats.totalItems = allItems.length;
  logger.info(`Extracted ${stats.totalItems} total items`);

  // Validate items
  if (validate) {
    logger.info('Validating items...');
    const validatedItems = [];

    for (const item of allItems) {
      const validation = validateNewsItem(item);
      if (validation.valid) {
        validatedItems.push(item);
        stats.validItems++;
      } else {
        stats.invalidItems++;
        logger.debug(`Invalid item: ${validation.errors.join(', ')}`);
      }
    }

    allItems = validatedItems;
    logger.info(`Valid items: ${stats.validItems}, Invalid items: ${stats.invalidItems}`);
  } else {
    stats.validItems = stats.totalItems;
  }

  // Deduplicate
  if (deduplicate) {
    const beforeCount = allItems.length;
    allItems = deduplicateItems(allItems);
    stats.duplicatesRemoved = beforeCount - allItems.length;
  }

  // Sort
  if (sort) {
    logger.info('Sorting items by timestamp...');
    allItems = sortByTimestamp(allItems);
  }

  // Write output file
  logger.info(`Writing ${allItems.length} items to ${outputFile}...`);
  await writeJsonFile(outputFile, allItems, { spaces: 4 });

  logger.info('Conversion completed successfully');
  logger.info(
    `Processed: ${stats.processedFiles}/${stats.totalFiles} files, ` +
      `${stats.validItems} valid items, ` +
      `${stats.duplicatesRemoved} duplicates removed`
  );

  return stats;
}
