/**
 * HS Code Formatting Utilities
 * Provides consistent HS code display formatting across the application
 */

/**
 * Format HS code for user display
 * Converts internal format (85423300) to user-friendly format (8542.33.00)
 * 
 * @param {string} hsCode - The HS code to format
 * @returns {string} Formatted HS code with dots
 */
export function formatHSCodeForDisplay(hsCode) {
  if (!hsCode || typeof hsCode !== 'string') return hsCode || '';
  
  // Remove any existing dots, spaces, or formatting
  const cleanCode = hsCode.replace(/[\.\s\-]/g, '');
  
  if (cleanCode.length < 4) return cleanCode;
  
  // Format based on length
  if (cleanCode.length >= 8) {
    // 8-digit: 85423300 → 8542.33.00
    return `${cleanCode.substring(0, 4)}.${cleanCode.substring(4, 6)}.${cleanCode.substring(6, 8)}`;
  } else if (cleanCode.length >= 6) {
    // 6-digit: 854233 → 8542.33
    return `${cleanCode.substring(0, 4)}.${cleanCode.substring(4, 6)}`;
  } else if (cleanCode.length >= 4) {
    // 4-digit: 8542 → 8542
    return cleanCode.substring(0, 4);
  } else {
    // 2-digit: 85 → 85
    return cleanCode;
  }
}

/**
 * Get HS code display with chapter information
 * 
 * @param {string} hsCode - The HS code
 * @returns {object} Formatted code with chapter info
 */
export function getHSCodeWithChapter(hsCode) {
  const formatted = formatHSCodeForDisplay(hsCode);
  const chapter = hsCode ? hsCode.substring(0, 2) : '';
  
  return {
    formatted,
    chapter,
    display: formatted,
    raw: hsCode
  };
}

/**
 * Validate HS code format for display purposes
 * 
 * @param {string} hsCode - The HS code to validate
 * @returns {boolean} True if valid for display
 */
export function isValidHSCodeForDisplay(hsCode) {
  if (!hsCode || typeof hsCode !== 'string') return false;
  
  const cleanCode = hsCode.replace(/[\.\s\-]/g, '');
  
  // Must be numeric and at least 2 digits
  return /^\d{2,8}$/.test(cleanCode);
}

/**
 * Get HS code length category for styling purposes
 * 
 * @param {string} hsCode - The HS code
 * @returns {string} Length category ('chapter', '4digit', '6digit', '8digit')
 */
export function getHSCodeCategory(hsCode) {
  if (!hsCode) return 'unknown';
  
  const cleanCode = hsCode.replace(/[\.\s\-]/g, '');
  
  if (cleanCode.length <= 2) return 'chapter';
  if (cleanCode.length <= 4) return '4digit';
  if (cleanCode.length <= 6) return '6digit';
  return '8digit';
}