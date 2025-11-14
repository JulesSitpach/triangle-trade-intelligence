/**
 * CRITICAL: Safe Tariff Rate Display Helpers
 *
 * Distinguishes between:
 * - null/undefined = "Pending verification" (data not yet fetched)
 * - 0 = "Free" or "Duty-free" (verified zero tariff)
 * - X% = Actual tariff rate
 *
 * This prevents the || 0 bug that was showing null as "0.0%"
 */

/**
 * Format tariff rate for display with proper null handling
 * @param {number|null|undefined} rate - Tariff rate as decimal (0.057 = 5.7%)
 * @param {object} options - Display options
 * @returns {object} { text, color, title, isPending }
 */
export function formatTariffRate(rate, options = {}) {
  const { showPercent = true, shortForm = false } = options;

  // Case 1: Pending verification (null or undefined)
  if (rate === null || rate === undefined) {
    return {
      text: shortForm ? 'Pending' : 'Pending verification',
      color: '#f59e0b', // Amber warning
      title: 'Tariff verification in progress',
      isPending: true
    };
  }

  // Case 2: Duty-free (verified zero)
  if (rate === 0) {
    return {
      text: 'Free',
      color: '#059669', // Green success
      title: 'Duty-free (0.0% tariff rate)',
      isPending: false
    };
  }

  // Case 3: Actual tariff rate
  const percentText = showPercent ? '%' : '';
  return {
    text: `${(rate * 100).toFixed(1)}${percentText}`,
    color: '#dc2626', // Red for tariff cost
    title: `${(rate * 100).toFixed(1)}% tariff rate`,
    isPending: false
  };
}

/**
 * Calculate savings with proper null handling
 * @param {number|null} mfnRate - MFN tariff rate
 * @param {number|null} usmcaRate - USMCA preferential rate
 * @returns {object} { text, color, isPending }
 */
export function formatSavings(mfnRate, usmcaRate) {
  // If either rate is pending, can't calculate savings
  if (mfnRate === null || mfnRate === undefined ||
      usmcaRate === null || usmcaRate === undefined) {
    return {
      text: 'Pending',
      color: '#f59e0b',
      title: 'Awaiting tariff verification',
      isPending: true
    };
  }

  const savings = mfnRate - usmcaRate;

  // No savings case
  if (savings <= 0) {
    return {
      text: '0.0%',
      color: '#6b7280', // Gray
      title: 'No tariff savings available',
      isPending: false
    };
  }

  // Positive savings
  return {
    text: `${(savings * 100).toFixed(1)}%`,
    color: '#059669', // Green
    title: `${(savings * 100).toFixed(1)}% tariff savings with USMCA`,
    isPending: false
  };
}

/**
 * Check if component has verified tariff data
 * @param {object} component - Component object
 * @returns {boolean} True if all critical rates are verified (not null)
 */
export function hasVerifiedRates(component) {
  return (
    component.mfn_rate !== null &&
    component.mfn_rate !== undefined &&
    component.usmca_rate !== null &&
    component.usmca_rate !== undefined
  );
}

/**
 * Get data source badge for display
 * @param {string} dataSource - Source of tariff data
 * @returns {object} { text, color, icon }
 */
export function getDataSourceBadge(dataSource) {
  if (!dataSource) {
    return { text: 'Unknown', color: '#6b7280', icon: '❓' };
  }

  if (dataSource.includes('USITC')) {
    return { text: 'Official USITC', color: '#059669', icon: '🏛️' };
  }

  if (dataSource.includes('AI Research')) {
    return { text: 'AI Research', color: '#f59e0b', icon: '🤖' };
  }

  if (dataSource.includes('User Input')) {
    return { text: 'User Provided', color: '#3b82f6', icon: '👤' };
  }

  return { text: dataSource, color: '#6b7280', icon: '📋' };
}
