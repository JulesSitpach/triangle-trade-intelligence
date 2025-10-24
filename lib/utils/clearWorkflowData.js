/**
 * Clear all workflow data from localStorage
 * Called on logout to respect user privacy when they didn't consent to save to database
 *
 * IMPORTANT: This must be called CLIENT-SIDE after logout API call succeeds
 */

const WORKFLOW_STORAGE_KEYS = [
  'usmca_workflow_data',
  'usmca_company_data',
  'usmca_workflow_results',
  'usmca_alerts_subscription',
  'user_subscription_status',
  'workflow_session_id',
  'save_data_consent',
  'triangle-dev-mode'
];

/**
 * Clear all USMCA workflow data from browser localStorage
 * @returns {Object} - Summary of cleared keys
 */
export function clearWorkflowLocalStorage() {
  const clearedKeys = [];
  const notFoundKeys = [];

  WORKFLOW_STORAGE_KEYS.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      clearedKeys.push(key);
    } else {
      notFoundKeys.push(key);
    }
  });

  console.log('🗑️ Workflow localStorage cleared:', {
    cleared: clearedKeys.length,
    clearedKeys,
    notFound: notFoundKeys.length
  });

  return {
    success: true,
    cleared: clearedKeys,
    notFound: notFoundKeys,
    timestamp: new Date().toISOString()
  };
}

/**
 * Clear ALL localStorage (nuclear option)
 * Use sparingly - only if user requests full data wipe
 */
export function clearAllLocalStorage() {
  const allKeys = Object.keys(localStorage);
  localStorage.clear();

  console.warn('🗑️ ALL localStorage cleared:', {
    count: allKeys.length,
    clearedKeys: allKeys,
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    count: allKeys.length,
    clearedKeys: allKeys,
    timestamp: new Date().toISOString()
  };
}

/**
 * Selective clear: only clear if user didn't consent to save
 * @returns {Object} - Status of whether data was cleared
 */
export function clearUnsavedWorkflowData() {
  const saveConsent = localStorage.getItem('save_data_consent');

  if (saveConsent === 'erase' || !saveConsent) {
    // User explicitly chose "erase" OR no consent was recorded
    // → Clear their unsaved data
    clearWorkflowLocalStorage();
    return {
      cleared: true,
      reason: saveConsent === 'erase' ? 'User chose to erase' : 'No consent recorded',
      timestamp: new Date().toISOString()
    };
  } else if (saveConsent === 'save') {
    // User chose to save → leave localStorage intact (data is in database)
    console.log('✅ User data saved to database - localStorage left intact');
    return {
      cleared: false,
      reason: 'User chose to save to database',
      timestamp: new Date().toISOString()
    };
  }

  return {
    cleared: false,
    reason: 'Unknown consent status',
    timestamp: new Date().toISOString()
  };
}
