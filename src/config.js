/**
 * Configuration management
 * @module config
 */

import { promises as fs } from 'fs';
import { fileExists } from './utils/file-utils.js';
import { validateConfig } from './utils/validator.js';
import logger from './utils/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  // Google Finance API tokens
  cid: process.env.GF_CID || '4592563',
  ei: process.env.GF_EI || 'y-xVWLGBJImv0ASYibfABg',

  // Date range
  startDate: process.env.START_DATE || '2011-06-24',
  endDate: process.env.END_DATE || new Date().toISOString().split('T')[0],

  // Output settings
  outputDir: process.env.OUTPUT_DIR || 'output',
  outputFile: process.env.OUTPUT_FILE || 'pandora.json',

  // Crawler settings
  delay: parseInt(process.env.DELAY, 10) || 1000,
  maxRetries: parseInt(process.env.MAX_RETRIES, 10) || 4,

  // Converter settings
  validate: process.env.VALIDATE !== 'false',
  deduplicate: process.env.DEDUPLICATE !== 'false',
  sort: process.env.SORT !== 'false',
};

/**
 * Loads configuration from a JSON file
 * @param {string} configPath - Path to config file
 * @returns {Promise<Object>} Configuration object
 */
export async function loadConfigFile(configPath) {
  try {
    if (!(await fileExists(configPath))) {
      logger.warn(`Config file not found: ${configPath}`);
      return {};
    }

    const content = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(content);

    logger.info(`Loaded configuration from ${configPath}`);
    return config;
  } catch (error) {
    logger.error(`Failed to load config file ${configPath}: ${error.message}`);
    throw error;
  }
}

/**
 * Merges configurations with precedence: CLI > File > Env > Default
 * @param {...Object} configs - Configuration objects to merge
 * @returns {Object} Merged configuration
 */
export function mergeConfigs(...configs) {
  const merged = { ...DEFAULT_CONFIG };

  for (const config of configs) {
    if (config) {
      Object.assign(merged, config);
    }
  }

  return merged;
}

/**
 * Gets the current configuration
 * @param {Object} [overrides={}] - Configuration overrides
 * @returns {Object} Configuration object
 */
export function getConfig(overrides = {}) {
  return mergeConfigs(DEFAULT_CONFIG, overrides);
}

/**
 * Validates configuration
 * @param {Object} config - Configuration to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validateConfiguration(config) {
  return validateConfig(config);
}

/**
 * Saves configuration to a JSON file
 * @param {string} configPath - Path to save config
 * @param {Object} config - Configuration object
 * @returns {Promise<void>}
 */
export async function saveConfigFile(configPath, config) {
  try {
    const content = JSON.stringify(config, null, 2);
    await fs.writeFile(configPath, content, 'utf8');
    logger.info(`Saved configuration to ${configPath}`);
  } catch (error) {
    logger.error(`Failed to save config file ${configPath}: ${error.message}`);
    throw error;
  }
}

/**
 * Creates a default config file
 * @param {string} configPath - Path to save config
 * @returns {Promise<void>}
 */
export async function createDefaultConfigFile(configPath) {
  await saveConfigFile(configPath, DEFAULT_CONFIG);
  logger.info(`Created default config file at ${configPath}`);
}

export { DEFAULT_CONFIG };
