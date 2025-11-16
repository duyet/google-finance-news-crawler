/**
 * Date utility functions for handling date operations
 * @module utils/date-utils
 */

/**
 * Validates if a date string is in valid format (YYYY-MM-DD)
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidDateFormat(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(dateString);
}

/**
 * Validates if a date is within a reasonable range (1990-2099)
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if within range, false otherwise
 */
export function isValidDateRange(dateString) {
  if (!isValidDateFormat(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  const year = date.getFullYear();

  // Reasonable range for financial data
  return year >= 1990 && year <= 2099 && !isNaN(date.getTime());
}

/**
 * Formats a Date object to YYYY-MM-DD string
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a date string to Date object
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} Parsed date object
 * @throws {Error} If date format is invalid
 */
export function parseDate(dateString) {
  if (!isValidDateFormat(dateString)) {
    throw new Error(`Invalid date format: ${dateString}. Expected YYYY-MM-DD`);
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  return date;
}

/**
 * Adds days to a date
 * @param {Date} date - Starting date
 * @param {number} days - Number of days to add
 * @returns {Date} New date with days added
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Gets the difference in days between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Number of days difference
 */
export function getDaysDifference(date1, date2) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((date2 - date1) / msPerDay);
}

/**
 * Generates array of date strings between start and end dates
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {string[]} Array of date strings
 * @throws {Error} If date formats are invalid or start > end
 */
export function getDateRange(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (start > end) {
    throw new Error(`Start date ${startDate} must be before end date ${endDate}`);
  }

  const dates = [];
  let currentDate = new Date(start);

  while (currentDate <= end) {
    dates.push(formatDate(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}

/**
 * Converts date to Unix timestamp in milliseconds
 * @param {Date} date - Date to convert
 * @returns {number} Unix timestamp in milliseconds
 */
export function dateToTimestamp(date) {
  return date.getTime();
}

/**
 * Converts Unix timestamp to Date object
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {Date} Date object
 */
export function timestampToDate(timestamp) {
  return new Date(timestamp);
}

/**
 * Gets current date in YYYY-MM-DD format
 * @returns {string} Current date string
 */
export function getCurrentDate() {
  return formatDate(new Date());
}

/**
 * Checks if date is today
 * @param {string} dateString - Date string to check
 * @returns {boolean} True if date is today
 */
export function isToday(dateString) {
  return dateString === getCurrentDate();
}

/**
 * Validates date range parameters
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateDateRange(startDate, endDate) {
  if (!isValidDateFormat(startDate)) {
    return { valid: false, error: `Invalid start date format: ${startDate}` };
  }

  if (!isValidDateFormat(endDate)) {
    return { valid: false, error: `Invalid end date format: ${endDate}` };
  }

  if (!isValidDateRange(startDate)) {
    return { valid: false, error: `Start date out of valid range: ${startDate}` };
  }

  if (!isValidDateRange(endDate)) {
    return { valid: false, error: `End date out of valid range: ${endDate}` };
  }

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (start > end) {
    return { valid: false, error: 'Start date must be before or equal to end date' };
  }

  return { valid: true };
}
