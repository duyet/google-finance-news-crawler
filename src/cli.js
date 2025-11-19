#!/usr/bin/env node

/**
 * CLI interface for Google Finance News Crawler
 * @module cli
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { crawlNews } from './crawler.js';
import { convertToJson } from './converter.js';
import { getConfig, loadConfigFile, mergeConfigs, validateConfiguration } from './config.js';
import { validateDateRange, getCurrentDate } from './utils/date-utils.js';
import { validateNewsData } from './utils/validator.js';
import { readJsonFile } from './utils/file-utils.js';
import logger from './utils/logger.js';

const program = new Command();

/**
 * Formats statistics for display
 * @param {Object} stats - Statistics object
 * @returns {string} Formatted string
 */
function formatStats(stats) {
  const parts = [];
  for (const [key, value] of Object.entries(stats)) {
    if (typeof value === 'number') {
      parts.push(`${key}: ${chalk.cyan(value)}`);
    }
  }
  return parts.join(', ');
}

/**
 * Crawl command
 */
program
  .command('crawl')
  .description('Crawl news data from Google Finance')
  .option('-s, --start-date <date>', 'Start date (YYYY-MM-DD)')
  .option('-e, --end-date <date>', 'End date (YYYY-MM-DD)')
  .option('--cid <cid>', 'Google Finance CID token')
  .option('--ei <ei>', 'Google Finance EI token')
  .option('-o, --output-dir <dir>', 'Output directory', 'output')
  .option('-d, --delay <ms>', 'Delay between requests (ms)', '1000')
  .option('-c, --config <file>', 'Config file path')
  .option('--dry-run', 'Dry run mode (no actual requests)')
  .option('--verbose', 'Verbose logging')
  .action(async (options) => {
    try {
      if (options.verbose) {
        logger.level = 'debug';
      }

      // Load config file if specified
      let fileConfig = {};
      if (options.config) {
        fileConfig = await loadConfigFile(options.config);
      }

      // Merge configurations
      const config = mergeConfigs(getConfig(), fileConfig, {
        startDate: options.startDate,
        endDate: options.endDate,
        cid: options.cid,
        ei: options.ei,
        outputDir: options.outputDir,
        delay: parseInt(options.delay, 10),
        dryRun: options.dryRun,
      });

      // Validate configuration
      const configValidation = validateConfiguration(config);
      if (!configValidation.valid) {
        console.error(chalk.red('Configuration errors:'));
        for (const error of configValidation.errors) {
          console.error(chalk.red(`  - ${error}`));
        }
        process.exit(1);
      }

      // Validate date range
      const dateValidation = validateDateRange(config.startDate, config.endDate);
      if (!dateValidation.valid) {
        console.error(chalk.red(`Date validation error: ${dateValidation.error}`));
        process.exit(1);
      }

      console.log(chalk.bold('\n🚀 Google Finance News Crawler\n'));
      console.log(chalk.gray('Configuration:'));
      console.log(`  Start Date: ${chalk.cyan(config.startDate)}`);
      console.log(`  End Date:   ${chalk.cyan(config.endDate)}`);
      console.log(`  Output Dir: ${chalk.cyan(config.outputDir)}`);
      console.log(`  Delay:      ${chalk.cyan(config.delay)}ms`);
      if (config.dryRun) {
        console.log(`  Mode:       ${chalk.yellow('DRY RUN')}`);
      }
      console.log();

      const spinner = ora('Starting crawler...').start();

      // Progress callback
      const onProgress = (current, total, date) => {
        const percentage = Math.round((current / total) * 100);
        spinner.text = `Crawling ${date} [${current}/${total}] ${percentage}%`;
      };

      const stats = await crawlNews({
        ...config,
        onProgress,
      });

      spinner.stop();

      console.log(chalk.bold('\n✅ Crawl completed!\n'));
      console.log(chalk.gray('Statistics:'));
      console.log(`  Total:      ${chalk.cyan(stats.total)}`);
      console.log(`  Successful: ${chalk.green(stats.successful)}`);
      console.log(`  Failed:     ${chalk.red(stats.failed)}`);
      console.log(`  Skipped:    ${chalk.yellow(stats.skipped)}`);

      if (stats.errors.length > 0) {
        console.log(chalk.yellow('\n⚠️  Some dates failed:'));
        for (const error of stats.errors.slice(0, 5)) {
          console.log(`  - ${error.date}: ${chalk.gray(error.error)}`);
        }
        if (stats.errors.length > 5) {
          console.log(chalk.gray(`  ... and ${stats.errors.length - 5} more`));
        }
      }

      console.log();
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

/**
 * Convert command
 */
program
  .command('convert')
  .description('Convert raw data to JSON')
  .option('-i, --input-dir <dir>', 'Input directory', 'output')
  .option('-o, --output-file <file>', 'Output file', 'pandora.json')
  .option('--no-validate', 'Skip validation')
  .option('--no-deduplicate', 'Skip deduplication')
  .option('--no-sort', 'Skip sorting')
  .option('--verbose', 'Verbose logging')
  .action(async (options) => {
    try {
      if (options.verbose) {
        logger.level = 'debug';
      }

      console.log(chalk.bold('\n📦 Converting raw data to JSON\n'));
      console.log(chalk.gray('Configuration:'));
      console.log(`  Input Dir:    ${chalk.cyan(options.inputDir)}`);
      console.log(`  Output File:  ${chalk.cyan(options.outputFile)}`);
      console.log(`  Validate:     ${chalk.cyan(options.validate)}`);
      console.log(`  Deduplicate:  ${chalk.cyan(options.deduplicate)}`);
      console.log(`  Sort:         ${chalk.cyan(options.sort)}`);
      console.log();

      const spinner = ora('Converting files...').start();

      const onProgress = (current, total, fileName) => {
        const percentage = Math.round((current / total) * 100);
        spinner.text = `Processing ${fileName} [${current}/${total}] ${percentage}%`;
      };

      const stats = await convertToJson({
        inputDir: options.inputDir,
        outputFile: options.outputFile,
        validate: options.validate,
        deduplicate: options.deduplicate,
        sort: options.sort,
        onProgress,
      });

      spinner.stop();

      console.log(chalk.bold('\n✅ Conversion completed!\n'));
      console.log(chalk.gray('Statistics:'));
      console.log(`  Files Processed:    ${chalk.cyan(stats.processedFiles)}/${stats.totalFiles}`);
      console.log(`  Total Items:        ${chalk.cyan(stats.totalItems)}`);
      console.log(`  Valid Items:        ${chalk.green(stats.validItems)}`);
      console.log(`  Invalid Items:      ${chalk.red(stats.invalidItems)}`);
      console.log(`  Duplicates Removed: ${chalk.yellow(stats.duplicatesRemoved)}`);
      console.log();
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

/**
 * Validate command
 */
program
  .command('validate <file>')
  .description('Validate JSON output file')
  .option('--verbose', 'Verbose output')
  .action(async (file, options) => {
    try {
      console.log(chalk.bold(`\n🔍 Validating ${file}\n`));

      const spinner = ora('Reading file...').start();
      const data = await readJsonFile(file);
      spinner.succeed(`Loaded ${data.length} items`);

      spinner.start('Validating items...');
      const validation = validateNewsData(data);
      spinner.stop();

      if (validation.valid) {
        console.log(chalk.green('\n✅ All items are valid!\n'));
      } else {
        console.log(chalk.yellow(`\n⚠️  Validation completed with issues\n`));
      }

      console.log(chalk.gray('Statistics:'));
      console.log(`  Total Items:   ${chalk.cyan(data.length)}`);
      console.log(`  Valid Items:   ${chalk.green(validation.validItems)}`);
      console.log(`  Invalid Items: ${chalk.red(validation.invalidItems)}`);

      if (options.verbose && validation.errors.length > 0) {
        console.log(chalk.yellow('\nInvalid items:'));
        for (const error of validation.errors.slice(0, 10)) {
          console.log(`  Item ${error.index}:`);
          for (const err of error.errors) {
            console.log(`    - ${chalk.gray(err)}`);
          }
        }
        if (validation.errors.length > 10) {
          console.log(chalk.gray(`  ... and ${validation.errors.length - 10} more`));
        }
      }

      console.log();

      if (!validation.valid) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

/**
 * Main program
 */
program
  .name('gfn-crawler')
  .description('Google Finance News Crawler - Elegant tool for crawling historical news data')
  .version('2.0.0');

program.parse();
