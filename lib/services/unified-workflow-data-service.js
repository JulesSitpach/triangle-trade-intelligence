/**
 * Unified Workflow Data Service - SIMPLIFIED
 *
 * Clean B2B SaaS architecture:
 * - Database is the single source of truth
 * - All data access goes through authenticated API endpoints
 * - localStorage used ONLY for temporary form state (not as a data source)
 *
 * Legal basis: Contract Performance + Legitimate Interest (GDPR compliant)
 * Users expect their workflow data to be saved for dashboard, alerts, and cross-device access.
 *
 * Usage:
 * ```javascript
 * import { getWorkflowData, saveWorkflowData } from '@/lib/services/unified-workflow-data-service';
 *
 * // Load workflow from database
 * const workflowData = await getWorkflowData(sessionId);
 *
 * // Save workflow to database
 * await saveWorkflowData(sessionId, workflowData);
 * ```
 */

/**
 * Get workflow data from database via API
 *
 * @param {string} sessionId - Workflow session ID
 * @returns {Object|null} Workflow data from database
 */
export async function getWorkflowData(sessionId) {
  if (!sessionId) {
    console.log('[WorkflowService] No sessionId provided');
    return null;
  }

  try {
    const response = await fetch(`/api/workflow-session?sessionId=${sessionId}`, {
      method: 'GET',
      credentials: 'include' // Send auth cookie
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('[WorkflowService] Not authenticated - no workflow data available');
        return null;
      }
      if (response.status === 404) {
        console.log('[WorkflowService] Workflow session not found');
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('[WorkflowService] ✅ Loaded workflow from database');
    return result.data;
  } catch (error) {
    console.error('[WorkflowService] Failed to load workflow:', error);
    return null;
  }
}

/**
 * Save workflow data to database via API
 *
 * @param {string} sessionId - Workflow session ID
 * @param {Object} workflowData - Workflow data to save
 * @param {string} action - Optional action ('complete' to save to workflow_completions)
 * @returns {boolean} Success status
 */
export async function saveWorkflowData(sessionId, workflowData, action = 'save') {
  if (!sessionId || !workflowData) {
    console.error('[WorkflowService] Missing required parameters');
    return false;
  }

  try {
    const response = await fetch('/api/workflow-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Send auth cookie
      body: JSON.stringify({
        sessionId,
        workflowData,
        action
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('[WorkflowService] Not authenticated - workflow not saved');
        return false;
      }
      throw new Error(`API error: ${response.status}`);
    }

    console.log('[WorkflowService] ✅ Workflow saved to database');
    return true;
  } catch (error) {
    console.error('[WorkflowService] Failed to save workflow:', error);
    return false;
  }
}

/**
 * Get user's components from workflow data
 *
 * @param {string} sessionId - Workflow session ID
 * @returns {Array} Array of components
 */
export async function getUserComponents(sessionId) {
  const workflowData = await getWorkflowData(sessionId);
  return workflowData?.components || workflowData?.component_origins || [];
}

/**
 * localStorage utilities (for temporary form state only)
 * NOT used as a data source - database is the single source of truth
 */

/**
 * Save form state to localStorage (temporary, until saved to database)
 */
export function saveFormStateToLocalStorage(key, data) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('[WorkflowService] Failed to save to localStorage:', error);
  }
}

/**
 * Get form state from localStorage (temporary form data)
 */
export function getFormStateFromLocalStorage(key) {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[WorkflowService] Failed to read from localStorage:', error);
    return null;
  }
}

/**
 * Clear form state from localStorage
 */
export function clearFormStateFromLocalStorage(key) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('[WorkflowService] Failed to clear localStorage:', error);
  }
}

export default {
  getWorkflowData,
  saveWorkflowData,
  getUserComponents,
  saveFormStateToLocalStorage,
  getFormStateFromLocalStorage,
  clearFormStateFromLocalStorage
};
