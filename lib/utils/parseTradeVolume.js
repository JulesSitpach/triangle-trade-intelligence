/**
 * Parse trade volume from any format (number, string, null, undefined)
 * Handles all edge cases: commas, decimals, null values
 * USE THIS EVERYWHERE instead of custom parseFloat calls
 *
 * @param {number|string|null|undefined} value - Trade volume value
 * @returns {number|null} Parsed numeric value or null
 */
export function parseTradeVolume(value) {
  // Null/undefined → null
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Already a number → return as-is
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  // String → parse it
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  // Unknown type → null
  return null;
}
