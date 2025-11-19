/**
 * Data validation utilities
 * @module utils/validator
 */

/**
 * Validates a news item structure
 * @param {Object} item - News item to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validateNewsItem(item) {
  const errors = [];

  if (!item || typeof item !== 'object') {
    return { valid: false, errors: ['Item must be an object'] };
  }

  // Required fields
  if (!item.title || typeof item.title !== 'string') {
    errors.push('Title is required and must be a string');
  }

  if (!item.url || typeof item.url !== 'string') {
    errors.push('URL is required and must be a string');
  } else if (!isValidUrl(item.url)) {
    errors.push(`Invalid URL format: ${item.url}`);
  }

  // Optional but should be strings if present
  if (item.s !== undefined && typeof item.s !== 'string') {
    errors.push('Source (s) must be a string');
  }

  if (item.sp !== undefined && typeof item.sp !== 'string') {
    errors.push('Snippet (sp) must be a string');
  }

  if (item.date !== undefined && typeof item.date !== 'string') {
    errors.push('Date must be a string');
  }

  if (item.timestamp !== undefined && typeof item.timestamp !== 'string') {
    errors.push('Timestamp must be a string');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
export function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitizes a string by removing potentially dangerous characters
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }

  // Remove control characters (0x00-0x1F, 0x7F)
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

/**
 * Validates configuration object
 * @param {Object} config - Configuration to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validateConfig(config) {
  const errors = [];

  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['Config must be an object'] };
  }

  // Validate CID
  if (config.cid !== undefined) {
    if (typeof config.cid !== 'string' || !/^\d+$/.test(config.cid)) {
      errors.push('CID must be a numeric string');
    }
  }

  // Validate EI
  if (config.ei !== undefined) {
    if (typeof config.ei !== 'string' || config.ei.length === 0) {
      errors.push('EI must be a non-empty string');
    }
  }

  // Validate output directory
  if (config.outputDir !== undefined) {
    if (typeof config.outputDir !== 'string' || config.outputDir.length === 0) {
      errors.push('Output directory must be a non-empty string');
    }
    // Check for path traversal attempts
    if (config.outputDir.includes('..')) {
      errors.push('Output directory cannot contain ".." (path traversal attempt)');
    }
  }

  // Validate delay
  if (config.delay !== undefined) {
    if (typeof config.delay !== 'number' || config.delay < 0) {
      errors.push('Delay must be a non-negative number');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates news data array
 * @param {Array} data - Array of news items
 * @param {Object} options - Validation options
 * @param {boolean} [options.strict=false] - If true, throw on first error
 * @returns {{valid: boolean, validItems: number, invalidItems: number, errors: Array}}
 *   Validation result
 */
export function validateNewsData(data, options = {}) {
  const { strict = false } = options;

  if (!Array.isArray(data)) {
    return {
      valid: false,
      validItems: 0,
      invalidItems: 0,
      errors: ['Data must be an array'],
    };
  }

  let validItems = 0;
  let invalidItems = 0;
  const errors = [];

  for (const [index, item] of data.entries()) {
    const validation = validateNewsItem(item);

    if (validation.valid) {
      validItems++;
    } else {
      invalidItems++;
      errors.push({
        index,
        item,
        errors: validation.errors,
      });

      if (strict) {
        break;
      }
    }
  }

  return {
    valid: invalidItems === 0,
    validItems,
    invalidItems,
    errors,
  };
}

/**
 * Validates JSON schema for news items
 * @param {Object} item - News item to validate
 * @returns {boolean} True if valid
 */
export function validateNewsSchema(item) {
  const requiredFields = ['title', 'url'];
  const optionalFields = ['s', 'sp', 'date', 'timestamp'];
  const allowedFields = new Set([...requiredFields, ...optionalFields]);

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in item)) {
      return false;
    }
  }

  // Check for unknown fields
  for (const field of Object.keys(item)) {
    if (!allowedFields.has(field)) {
      return false;
    }
  }

  return true;
}
