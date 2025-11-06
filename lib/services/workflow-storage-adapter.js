/**
 * Workflow Storage Adapter
 *
 * Provides backward-compatible localStorage API using SessionManager under the hood.
 * This allows gradual migration without breaking existing code.
 *
 * Usage:
 *   const storage = new WorkflowStorage();
 *   storage.setItem('key', value);  // Uses session manager internally
 *   storage.getItem('key');         // Returns value from current session
 */

import SessionManager from './workflow-session-manager.js';

class WorkflowStorage {
  /**
   * Save data (uses session manager)
   */
  setItem(key, value) {
    if (typeof window === 'undefined') return;

    // Parse value if it's a string (backwards compatibility with localStorage)
    let data = value;
    try {
      data = typeof value === 'string' ? JSON.parse(value) : value;
    } catch (e) {
      // If parsing fails, store as-is
      data = value;
    }

    SessionManager.saveToSession(key, data);
  }

  /**
   * Load data (uses session manager)
   */
  getItem(key) {
    if (typeof window === 'undefined') return null;

    const data = SessionManager.loadFromSession(key);

    // ✅ FIX (Nov 6): Don't double-stringify strings
    // If data is already a string (like session IDs), return as-is
    // Only stringify objects/arrays for backwards compatibility
    if (typeof data === 'string') {
      return data;
    }

    // Return as JSON string for backwards compatibility with localStorage (objects/arrays)
    return data ? JSON.stringify(data) : null;
  }

  /**
   * Remove data (uses session manager)
   */
  removeItem(key) {
    if (typeof window === 'undefined') return;

    SessionManager.removeFromSession(key);
  }

  /**
   * Clear all session data
   */
  clear() {
    if (typeof window === 'undefined') return;

    SessionManager.clearCurrentSession();
  }

  /**
   * Start new workflow session
   */
  startNewSession() {
    if (typeof window === 'undefined') return null;

    return SessionManager.startNewSession();
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId() {
    if (typeof window === 'undefined') return null;

    return SessionManager.getCurrentSessionId();
  }

  /**
   * Check if session has data
   */
  hasData() {
    if (typeof window === 'undefined') return false;

    return SessionManager.hasSessionData();
  }
}

// Create singleton instance
const workflowStorage = new WorkflowStorage();

export default workflowStorage;
export { WorkflowStorage };
