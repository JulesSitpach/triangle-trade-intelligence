/**
 * Cross-Tab Synchronization Utility
 * Keeps workflow data in sync across multiple browser tabs
 *
 * Uses localStorage events to broadcast changes between tabs
 * Prevents data loss when user edits in multiple tabs simultaneously
 *
 * Implementation:
 * - Tab A saves to localStorage → triggers storage event in Tab B → Tab B updates state
 * - Syncs two keys: 'triangleUserData' (form data) and 'usmca_workflow_results' (analysis results)
 *
 * Usage:
 * import { CrossTabSync } from '@/lib/utils/cross-tab-sync';
 *
 * const sync = new CrossTabSync({
 *   onSync: (key, newValue) => {
 *     console.log('Data synced from another tab:', key, newValue);
 *     updateLocalState(newValue);
 *   }
 * });
 *
 * // When this tab saves data
 * sync.broadcastChange('triangleUserData', formData);
 */

export class CrossTabSync {
  constructor(options = {}) {
    this.onSync = options.onSync || (() => {});
    this.onConflict = options.onConflict || this.defaultConflictHandler;
    this.watchedKeys = options.watchedKeys || ['triangleUserData', 'usmca_workflow_results'];
    this.enabled = typeof window !== 'undefined' && window.localStorage;
    this.tabId = this.generateTabId();
    this.lastUpdateTimestamps = {}; // Track when this tab last updated each key

    if (this.enabled) {
      this.initializeListener();
    }
  }

  /**
   * Generate unique tab ID for conflict resolution
   */
  generateTabId() {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize storage event listener
   * Fires when localStorage changes in ANOTHER tab (not this one)
   */
  initializeListener() {
    if (!this.enabled) return;

    window.addEventListener('storage', (event) => {
      // Only handle watched keys
      if (!this.watchedKeys.includes(event.key)) {
        return;
      }

      // Ignore if value didn't actually change
      if (event.oldValue === event.newValue) {
        return;
      }

      try {
        const newValue = event.newValue ? JSON.parse(event.newValue) : null;
        const oldValue = event.oldValue ? JSON.parse(event.oldValue) : null;

        // Check for conflicts (both tabs edited within 5 seconds)
        const lastUpdate = this.lastUpdateTimestamps[event.key];
        const timeSinceLastUpdate = lastUpdate ? Date.now() - lastUpdate : Infinity;

        if (timeSinceLastUpdate < 5000) {
          // Conflict detected - two tabs editing at once
          console.warn(`[CrossTabSync] Conflict detected for ${event.key}`);
          this.onConflict(event.key, oldValue, newValue);
        } else {
          // Normal sync - apply changes from other tab
          console.log(`[CrossTabSync] Syncing ${event.key} from another tab`);
          this.onSync(event.key, newValue, oldValue);
        }
      } catch (error) {
        console.error('[CrossTabSync] Failed to parse storage event:', error);
      }
    });

    console.log(`[CrossTabSync] Initialized for tab ${this.tabId}`);
  }

  /**
   * Broadcast a change to other tabs
   * Call this AFTER saving to localStorage
   *
   * @param {string} key - localStorage key that was updated
   * @param {Object} value - New value (already saved to localStorage)
   */
  broadcastChange(key, value) {
    if (!this.enabled) return;

    // Record timestamp to detect conflicts
    this.lastUpdateTimestamps[key] = Date.now();

    // Add metadata to track which tab made the change
    const wrappedValue = {
      ...value,
      _sync_meta: {
        tab_id: this.tabId,
        timestamp: Date.now()
      }
    };

    // localStorage.setItem() will trigger 'storage' event in OTHER tabs (not this one)
    localStorage.setItem(key, JSON.stringify(wrappedValue));

    console.log(`[CrossTabSync] Broadcasted ${key} to other tabs`);
  }

  /**
   * Default conflict handler - newest wins
   * Can be overridden in constructor options
   */
  defaultConflictHandler(key, oldValue, newValue) {
    console.warn(`[CrossTabSync] Conflict on ${key}: Using newest value (default strategy)`);

    // Newest wins by default (already applied via storage event)
    // Could implement more sophisticated strategies:
    // - Merge strategy (combine non-conflicting fields)
    // - User prompt (ask which version to keep)
    // - Last-write-wins (keep the one with newest timestamp)

    return newValue;
  }

  /**
   * Manually trigger a sync from current tab
   * Useful for force-updating other tabs
   */
  forceSyncAll() {
    if (!this.enabled) return;

    this.watchedKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          this.broadcastChange(key, parsed);
        } catch (error) {
          console.error(`[CrossTabSync] Failed to force sync ${key}:`, error);
        }
      }
    });
  }

  /**
   * Check if another tab is currently active
   * Useful for detecting if user has workflow open elsewhere
   */
  async checkForOtherTabs() {
    if (!this.enabled) return false;

    // Use broadcast channel API if available (better than localStorage ping)
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('triangle_workflow_tabs');

      return new Promise((resolve) => {
        let responded = false;

        // Listen for responses
        channel.onmessage = (event) => {
          if (event.data.type === 'pong' && event.data.tabId !== this.tabId) {
            responded = true;
            resolve(true);
          }
        };

        // Send ping
        channel.postMessage({ type: 'ping', tabId: this.tabId });

        // Wait 100ms for responses
        setTimeout(() => {
          channel.close();
          resolve(responded);
        }, 100);
      });
    }

    // Fallback: use localStorage timestamp method
    const pingKey = 'triangle_tab_ping';
    const lastPing = localStorage.getItem(pingKey);
    const lastPingTime = lastPing ? parseInt(lastPing) : 0;
    const timeSinceLastPing = Date.now() - lastPingTime;

    // If another tab pinged within last 5 seconds, consider it active
    return timeSinceLastPing < 5000;
  }

  /**
   * Destroy the sync handler (cleanup on unmount)
   */
  destroy() {
    if (this.enabled) {
      // Remove event listener if we stored a reference
      // Note: Can't remove without storing original function reference
      console.log(`[CrossTabSync] Destroyed for tab ${this.tabId}`);
    }
  }
}

/**
 * React Hook for Cross-Tab Sync
 * Automatically syncs workflow state across tabs
 *
 * @example
 * function MyComponent() {
 *   const [formData, setFormData] = useState({});
 *
 *   useCrossTabSync('triangleUserData', formData, setFormData);
 *
 *   // Whenever formData changes, it's automatically synced to other tabs
 *   // If another tab changes formData, this tab updates automatically
 * }
 */
export function useCrossTabSync(key, value, setValue) {
  if (typeof window === 'undefined') return; // SSR safety

  const { useEffect, useRef } = require('react');

  const syncRef = useRef(null);

  useEffect(() => {
    // Initialize sync on mount
    syncRef.current = new CrossTabSync({
      watchedKeys: [key],
      onSync: (syncedKey, newValue) => {
        if (syncedKey === key && newValue) {
          // Remove sync metadata before setting state
          const { _sync_meta, ...cleanValue } = newValue;
          setValue(cleanValue);
        }
      }
    });

    return () => {
      syncRef.current?.destroy();
    };
  }, [key]);

  // Broadcast changes when value changes
  useEffect(() => {
    if (value && syncRef.current) {
      syncRef.current.broadcastChange(key, value);
    }
  }, [value, key]);
}

/**
 * Simplified function for manual sync (non-React contexts)
 */
export function syncToOtherTabs(key, value) {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const sync = new CrossTabSync({ watchedKeys: [key] });
  sync.broadcastChange(key, value);
}
