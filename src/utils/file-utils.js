/**
 * File system utilities with safety checks
 * @module utils/file-utils
 */

import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';
import logger from './logger.js';

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
export async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    logger.debug(`Directory ensured: ${dirPath}`);
  } catch (error) {
    logger.error(`Failed to create directory ${dirPath}: ${error.message}`);
    throw error;
  }
}

/**
 * Safely reads a file with error handling
 * @param {string} filePath - File path to read
 * @param {Object} options - Read options
 * @param {string} [options.encoding='utf8'] - File encoding
 * @returns {Promise<string|Buffer>} File contents
 * @throws {Error} If file cannot be read
 */
export async function safeReadFile(filePath, options = {}) {
  const { encoding = 'utf8' } = options;

  try {
    const content = await fs.readFile(filePath, encoding);
    logger.debug(`Successfully read file: ${filePath}`);
    return content;
  } catch (error) {
    logger.error(`Failed to read file ${filePath}: ${error.message}`);
    throw new Error(`Cannot read file ${filePath}: ${error.message}`);
  }
}

/**
 * Safely writes a file with error handling and atomic writes
 * @param {string} filePath - File path to write
 * @param {string|Buffer} content - Content to write
 * @param {Object} options - Write options
 * @param {string} [options.encoding='utf8'] - File encoding
 * @param {boolean} [options.atomic=true] - Use atomic writes
 * @returns {Promise<void>}
 * @throws {Error} If file cannot be written
 */
export async function safeWriteFile(filePath, content, options = {}) {
  const { encoding = 'utf8', atomic = true } = options;

  try {
    // Ensure directory exists
    await ensureDir(dirname(filePath));

    if (atomic) {
      // Write to temporary file first
      const tempPath = `${filePath}.tmp`;
      await fs.writeFile(tempPath, content, encoding);
      // Atomic rename
      await fs.rename(tempPath, filePath);
      logger.debug(`Atomically wrote file: ${filePath}`);
    } else {
      await fs.writeFile(filePath, content, encoding);
      logger.debug(`Wrote file: ${filePath}`);
    }
  } catch (error) {
    logger.error(`Failed to write file ${filePath}: ${error.message}`);
    throw new Error(`Cannot write file ${filePath}: ${error.message}`);
  }
}

/**
 * Checks if a file exists
 * @param {string} filePath - File path to check
 * @returns {Promise<boolean>} True if file exists
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lists files in a directory
 * @param {string} dirPath - Directory path
 * @param {Object} options - Options
 * @param {string} [options.extension] - Filter by extension
 * @returns {Promise<string[]>} Array of file names
 */
export async function listFiles(dirPath, options = {}) {
  const { extension } = options;

  try {
    let files = await fs.readdir(dirPath);

    if (extension) {
      const ext = extension.startsWith('.') ? extension : `.${extension}`;
      files = files.filter((file) => file.endsWith(ext));
    }

    logger.debug(`Listed ${files.length} files in ${dirPath}`);
    return files;
  } catch (error) {
    logger.error(`Failed to list files in ${dirPath}: ${error.message}`);
    throw new Error(`Cannot list files in ${dirPath}: ${error.message}`);
  }
}

/**
 * Safely deletes a file
 * @param {string} filePath - File path to delete
 * @returns {Promise<boolean>} True if deleted, false if didn't exist
 */
export async function safeDeleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    logger.debug(`Deleted file: ${filePath}`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.debug(`File does not exist: ${filePath}`);
      return false;
    }
    logger.error(`Failed to delete file ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Gets file stats
 * @param {string} filePath - File path
 * @returns {Promise<Object>} File stats
 */
export async function getFileStats(filePath) {
  try {
    return await fs.stat(filePath);
  } catch (error) {
    logger.error(`Failed to get stats for ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Validates and resolves a file path to prevent traversal attacks
 * @param {string} basePath - Base directory path
 * @param {string} userPath - User-provided path
 * @returns {string} Resolved safe path
 * @throws {Error} If path traversal detected
 */
export function validatePath(basePath, userPath) {
  const resolvedBase = resolve(basePath);
  const resolvedUser = resolve(basePath, userPath);

  if (!resolvedUser.startsWith(resolvedBase)) {
    throw new Error('Path traversal detected');
  }

  return resolvedUser;
}

/**
 * Reads a JSON file safely
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Object>} Parsed JSON object
 */
export async function readJsonFile(filePath) {
  const content = await safeReadFile(filePath);
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON in file ${filePath}: ${error.message}`);
  }
}

/**
 * Writes a JSON file safely
 * @param {string} filePath - Path to JSON file
 * @param {Object} data - Data to write
 * @param {Object} options - Write options
 * @param {number} [options.spaces=2] - JSON indentation spaces
 * @returns {Promise<void>}
 */
export async function writeJsonFile(filePath, data, options = {}) {
  const { spaces = 2 } = options;
  const content = JSON.stringify(data, null, spaces);
  await safeWriteFile(filePath, content);
}
