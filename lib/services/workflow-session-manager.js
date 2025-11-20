/**
 * Workflow Session Manager
 *
 * Manages isolated workflow sessions using unique session IDs.
 * Each workflow gets its own namespace in localStorage, preventing
 * data leakage between workflows.
 *
 * Industry-standard approach:
 * - Session ID per workflow (not global keys)
 * - Clean separation of data
 * - Easy cleanup when starting new workflow
 */

const CURRENT_SESSION_KEY = 'triangle_current_session';
const SESSION_PREFIX = 'triangle_session_';

/**
 * Generate unique session ID
 */
function generateSessionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `session_${timestamp}_${random}`;  // ✅ FIX (Nov 6): Add "session_" prefix
}

/**
 * Get current session ID (or create new one)
 */
export function getCurrentSessionId() {
  if (typeof window === 'undefined') return null;

  let sessionId = localStorage.getItem(CURRENT_SESSION_KEY);

  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
    console.log('📝 Created new workflow session:', sessionId);
  }

  return sessionId;
}

/**
 * Start a new workflow session (clears old session)
 */
export function startNewSession() {
  if (typeof window === 'undefined') return null;

  // Clear old session data
  const oldSessionId = localStorage.getItem(CURRENT_SESSION_KEY);
  if (oldSessionId) {
    clearSessionData(oldSessionId);
    console.log('🗑️ Cleared old session:', oldSessionId);
  }

  // ✅ FIX (Nov 7): CLEAR ALL WORKFLOW DATA - no old workflow data should carry over
  // Only remove workflow-related keys, keep user preferences and auth
  const workflowKeys = [
    'workflow_session_id',
    'triangleUserData',
    'usmca_workflow_results',
    'workflow_current_step',
    'usmca_authorization_data',
    'workflow_form_data',
    'component_origins',
    'certificate_data',
    'analysis_results',
    // ✅ FIX (Nov 20): Clear demo mode flags (prevent "Demo Mode Active" persisting)
    'demo_mode_active',
    'demo_company_data',
    'workflowSession',
    'workflowData',
    'demoMode'
  ];

  workflowKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log('🗑️ Cleared workflow key:', key);
  });

  // Create new session
  const newSessionId = generateSessionId();
  localStorage.setItem(CURRENT_SESSION_KEY, newSessionId);
  localStorage.setItem('workflow_session_id', newSessionId); // ✅ Sync both keys
  console.log('✨ Started new workflow session:', newSessionId);

  return newSessionId;
}

/**
 * Save data to current session
 */
export function saveToSession(key, data) {
  if (typeof window === 'undefined') return;

  const sessionId = getCurrentSessionId();
  const storageKey = `${SESSION_PREFIX}${sessionId}_${key}`;

  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
    console.log(`💾 Saved ${key} to session ${sessionId}`);
  } catch (error) {
    console.error(`❌ Failed to save ${key}:`, error);
  }
}

/**
 * Load data from current session
 */
export function loadFromSession(key) {
  if (typeof window === 'undefined') return null;

  const sessionId = getCurrentSessionId();
  const storageKey = `${SESSION_PREFIX}${sessionId}_${key}`;

  try {
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`❌ Failed to load ${key}:`, error);
    return null;
  }
}

/**
 * Remove specific key from current session
 */
export function removeFromSession(key) {
  if (typeof window === 'undefined') return;

  const sessionId = getCurrentSessionId();
  const storageKey = `${SESSION_PREFIX}${sessionId}_${key}`;
  localStorage.removeItem(storageKey);
  console.log(`🗑️ Removed ${key} from session ${sessionId}`);
}

/**
 * Clear all data for a specific session
 */
export function clearSessionData(sessionId) {
  if (typeof window === 'undefined') return;

  const prefix = `${SESSION_PREFIX}${sessionId}_`;
  const keysToRemove = [];

  // Find all keys for this session
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  // Remove them
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`🗑️ Cleared ${keysToRemove.length} items from session ${sessionId}`);
}

/**
 * Clear current session
 */
export function clearCurrentSession() {
  const sessionId = getCurrentSessionId();
  if (sessionId) {
    clearSessionData(sessionId);
  }
}

/**
 * Get all session keys for current session
 */
export function getSessionKeys() {
  if (typeof window === 'undefined') return [];

  const sessionId = getCurrentSessionId();
  const prefix = `${SESSION_PREFIX}${sessionId}_`;
  const keys = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      // Extract the actual key name (remove prefix)
      const keyName = key.replace(prefix, '');
      keys.push(keyName);
    }
  }

  return keys;
}

/**
 * Check if session has data
 */
export function hasSessionData() {
  return getSessionKeys().length > 0;
}

export default {
  getCurrentSessionId,
  startNewSession,
  saveToSession,
  loadFromSession,
  removeFromSession,
  clearSessionData,
  clearCurrentSession,
  getSessionKeys,
  hasSessionData
};
