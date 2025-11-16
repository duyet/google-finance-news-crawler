/**
 * TypeScript type definitions for Google Finance News Crawler
 */

export interface NewsItem {
  title: string;
  url: string;
  s?: string;
  sp?: string;
  date?: string;
  timestamp?: string;
}

export interface CrawlOptions {
  startDate: string;
  endDate: string;
  cid: string;
  ei: string;
  outputDir?: string;
  delay?: number;
  onProgress?: (current: number, total: number, date: string) => void;
  dryRun?: boolean;
}

export interface CrawlStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: Array<{
    date: string;
    error: string;
  }>;
}

export interface ConvertOptions {
  inputDir?: string;
  outputFile?: string;
  validate?: boolean;
  deduplicate?: boolean;
  sort?: boolean;
  onProgress?: (current: number, total: number, file: string) => void;
}

export interface ConvertStats {
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  totalItems: number;
  validItems: number;
  invalidItems: number;
  duplicatesRemoved: number;
}

export interface Config {
  cid?: string;
  ei?: string;
  startDate?: string;
  endDate?: string;
  outputDir?: string;
  outputFile?: string;
  delay?: number;
  maxRetries?: number;
  validate?: boolean;
  deduplicate?: boolean;
  sort?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface NewsDataValidationResult {
  valid: boolean;
  validItems: number;
  invalidItems: number;
  errors: Array<{
    index: number;
    item: unknown;
    errors: string[];
  }>;
}

/**
 * Crawls news data from Google Finance
 */
export function crawlNews(options: CrawlOptions): Promise<CrawlStats>;

/**
 * Converts raw JavaScript files to structured JSON
 */
export function convertToJson(options?: ConvertOptions): Promise<ConvertStats>;

/**
 * Gets the current configuration
 */
export function getConfig(overrides?: Partial<Config>): Config;

/**
 * Loads configuration from a JSON file
 */
export function loadConfigFile(configPath: string): Promise<Partial<Config>>;

/**
 * Merges multiple configuration objects
 */
export function mergeConfigs(...configs: Array<Partial<Config>>): Config;

/**
 * Date utility functions
 */
export namespace dateUtils {
  export function isValidDateFormat(dateString: string): boolean;
  export function isValidDateRange(dateString: string): boolean;
  export function formatDate(date: Date): string;
  export function parseDate(dateString: string): Date;
  export function addDays(date: Date, days: number): Date;
  export function getDaysDifference(date1: Date, date2: Date): number;
  export function getDateRange(startDate: string, endDate: string): string[];
  export function dateToTimestamp(date: Date): number;
  export function timestampToDate(timestamp: number): Date;
  export function getCurrentDate(): string;
  export function isToday(dateString: string): boolean;
  export function validateDateRange(startDate: string, endDate: string): ValidationResult;
}

/**
 * Validation utility functions
 */
export namespace validator {
  export function validateNewsItem(item: unknown): ValidationResult;
  export function isValidUrl(url: string): boolean;
  export function sanitizeString(str: string): string;
  export function validateConfig(config: unknown): ValidationResult;
  export function validateNewsData(
    data: unknown[],
    options?: { strict?: boolean }
  ): NewsDataValidationResult;
  export function validateNewsSchema(item: unknown): boolean;
}

/**
 * Winston logger instance
 */
export const logger: {
  error(message: string, ...meta: unknown[]): void;
  warn(message: string, ...meta: unknown[]): void;
  info(message: string, ...meta: unknown[]): void;
  debug(message: string, ...meta: unknown[]): void;
  level: string;
};
