/**
 * USMCA QUALIFICATION STATUS ENUMS
 * Centralized qualification status strings for flexible trade compliance
 *
 * Benefits:
 * - Single source of truth
 * - Easy to add nuanced statuses
 * - Consistent across entire platform
 * - Prevents typos in conditionals
 *
 * Updated: October 15, 2025
 */

/**
 * USMCA Qualification Statuses
 * Used across workflow, certificates, and admin dashboards
 */
export const USMCA_STATUSES = {
  // Primary Statuses
  QUALIFIED: 'QUALIFIED',
  NOT_QUALIFIED: 'NOT_QUALIFIED',
  PARTIAL: 'PARTIAL',

  // Nuanced Statuses (for future expansion)
  NEAR_QUALIFIED: 'NEAR_QUALIFIED',  // 1-2% away from threshold
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',  // Awaiting documentation
  CONDITIONAL: 'CONDITIONAL'  // Qualified if certain changes made
};

/**
 * Helper function to get human-readable qualification label
 */
export function getQualificationLabel(status) {
  const labels = {
    'QUALIFIED': '✓ QUALIFIED',
    'NOT_QUALIFIED': '✗ NOT QUALIFIED',
    'PARTIAL': '◐ PARTIAL QUALIFICATION',
    'NEAR_QUALIFIED': '⚠ NEAR QUALIFIED',
    'PENDING_VERIFICATION': '⏳ PENDING VERIFICATION',
    'CONDITIONAL': '⚡ CONDITIONALLY QUALIFIED'
  };

  return labels[status] || status;
}

/**
 * Helper function to get qualification status color class
 */
export function getQualificationColor(status) {
  const colors = {
    'QUALIFIED': 'text-green',
    'NOT_QUALIFIED': 'text-red',
    'PARTIAL': 'text-amber',
    'NEAR_QUALIFIED': 'text-amber',
    'PENDING_VERIFICATION': 'text-blue',
    'CONDITIONAL': 'text-amber'
  };

  return colors[status] || 'text-body';
}

/**
 * Helper function to get border color for status cards
 */
export function getQualificationBorderClass(status) {
  const borders = {
    'QUALIFIED': 'border-left-green',
    'NOT_QUALIFIED': 'border-left-red',
    'PARTIAL': 'border-left-amber',
    'NEAR_QUALIFIED': 'border-left-amber',
    'PENDING_VERIFICATION': 'border-left-blue',
    'CONDITIONAL': 'border-left-amber'
  };

  return borders[status] || 'border-left-gray';
}

/**
 * Helper function to check if status allows certificate download
 */
export function canDownloadCertificate(status) {
  return [
    USMCA_STATUSES.QUALIFIED,
    USMCA_STATUSES.CONDITIONAL
  ].includes(status);
}

/**
 * Helper function to check if status needs improvement
 */
export function needsImprovement(status) {
  return [
    USMCA_STATUSES.NOT_QUALIFIED,
    USMCA_STATUSES.NEAR_QUALIFIED,
    USMCA_STATUSES.PARTIAL
  ].includes(status);
}

export default {
  USMCA_STATUSES,
  getQualificationLabel,
  getQualificationColor,
  getQualificationBorderClass,
  canDownloadCertificate,
  needsImprovement
};
