/**
 * 🧠 REACT MEMORY OPTIMIZATION HOOK
 * 
 * Production-ready React hook for memory management in Triangle Intelligence Platform
 * Automatically handles cleanup of intervals, timeouts, and API calls
 */

import { useEffect, useRef, useCallback } from 'react';
import { getMemoryOptimizer } from '../lib/memory-optimizer.js';
import { logInfo, logError, logWarn } from '../lib/production-logger.js';

export function useMemoryOptimization(componentName = 'UnknownComponent') {
  const cleanupRef = useRef(null);
  const mountedRef = useRef(true);
  const intervalRefs = useRef(new Set());
  const timeoutRefs = useRef(new Set());
  const abortControllersRef = useRef(new Set());

  useEffect(() => {
    // Initialize cleanup system
    const optimizer = getMemoryOptimizer();
    cleanupRef.current = optimizer.createReactCleanup();
    
    logInfo(`Memory optimization initialized for: ${componentName}`);

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      
      // Clear all intervals
      for (const intervalId of intervalRefs.current) {
        clearInterval(intervalId);
      }
      intervalRefs.current.clear();

      // Clear all timeouts  
      for (const timeoutId of timeoutRefs.current) {
        clearTimeout(timeoutId);
      }
      timeoutRefs.current.clear();

      // Abort all API requests
      for (const controller of abortControllersRef.current) {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      }
      abortControllersRef.current.clear();

      // Run component-specific cleanup
      if (cleanupRef.current) {
        cleanupRef.current.cleanup();
      }

      logInfo(`Memory cleanup completed for: ${componentName}`);
    };
  }, [componentName]);

  // Safe interval creation with automatic cleanup
  const setOptimizedInterval = useCallback((callback, delay, intervalName = 'unnamed') => {
    if (!mountedRef.current) {
      logWarn(`Attempted to create interval after unmount: ${componentName}.${intervalName}`);
      return null;
    }

    const intervalId = setInterval(() => {
      if (mountedRef.current) {
        try {
          callback();
        } catch (error) {
          logWarn(`Interval callback error in ${componentName}.${intervalName}`, { 
            error: error.message 
          });
        }
      } else {
        // Auto-cleanup if component unmounted
        clearInterval(intervalId);
        intervalRefs.current.delete(intervalId);
      }
    }, delay);

    intervalRefs.current.add(intervalId);
    
    // Register with global optimizer
    const optimizer = getMemoryOptimizer();
    optimizer.registerInterval(`${componentName}.${intervalName}`, intervalId);

    logInfo(`Created optimized interval: ${componentName}.${intervalName}`);
    return intervalId;
  }, [componentName]);

  // Safe timeout creation with automatic cleanup
  const setOptimizedTimeout = useCallback((callback, delay, timeoutName = 'unnamed') => {
    if (!mountedRef.current) {
      logWarn(`Attempted to create timeout after unmount: ${componentName}.${timeoutName}`);
      return null;
    }

    const timeoutId = setTimeout(() => {
      timeoutRefs.current.delete(timeoutId);
      
      if (mountedRef.current) {
        try {
          callback();
        } catch (error) {
          logWarn(`Timeout callback error in ${componentName}.${timeoutName}`, { 
            error: error.message 
          });
        }
      }
    }, delay);

    timeoutRefs.current.add(timeoutId);
    
    // Register with global optimizer
    const optimizer = getMemoryOptimizer();
    optimizer.registerTimeout(`${componentName}.${timeoutName}`, timeoutId);

    return timeoutId;
  }, [componentName]);

  // Memory-optimized API call
  const makeOptimizedAPICall = useCallback(async (url, options = {}, timeoutMs = 30000) => {
    if (!mountedRef.current) {
      throw new Error(`API call attempted after unmount: ${componentName}`);
    }

    const optimizer = getMemoryOptimizer();
    const controller = optimizer.createAbortController(timeoutMs);
    
    abortControllersRef.current.add(controller);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      // Remove from tracking after successful completion
      abortControllersRef.current.delete(controller);
      
      if (!mountedRef.current) {
        logWarn(`API response received after unmount: ${componentName}`);
        return null;
      }

      return response;
    } catch (error) {
      abortControllersRef.current.delete(controller);
      
      if (error.name === 'AbortError') {
        logInfo(`API call aborted: ${componentName} - ${url}`);
        return null;
      }
      
      throw error;
    }
  }, [componentName]);

  // Clear specific interval
  const clearOptimizedInterval = useCallback((intervalId) => {
    if (intervalId && intervalRefs.current.has(intervalId)) {
      clearInterval(intervalId);
      intervalRefs.current.delete(intervalId);
      logInfo(`Cleared interval in: ${componentName}`);
    }
  }, [componentName]);

  // Clear specific timeout
  const clearOptimizedTimeout = useCallback((timeoutId) => {
    if (timeoutId && timeoutRefs.current.has(timeoutId)) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(timeoutId);
    }
  }, [componentName]);

  // Register additional cleanup function
  const registerCleanup = useCallback((cleanupFunction) => {
    if (cleanupRef.current) {
      cleanupRef.current.register(cleanupFunction);
    }
  }, []);

  // Get memory statistics for this component
  const getComponentMemoryStats = useCallback(() => {
    return {
      component: componentName,
      mounted: mountedRef.current,
      activeIntervals: intervalRefs.current.size,
      activeTimeouts: timeoutRefs.current.size,
      pendingRequests: abortControllersRef.current.size
    };
  }, [componentName]);

  return {
    setOptimizedInterval,
    setOptimizedTimeout,
    makeOptimizedAPICall,
    clearOptimizedInterval,
    clearOptimizedTimeout,
    registerCleanup,
    getComponentMemoryStats,
    isMounted: () => mountedRef.current
  };
}

// Hook for real-time data fetching (like Dashboard Hub)
export function useMemoryOptimizedPolling(
  fetchFunction,
  interval = 30000,
  componentName = 'PollingComponent'
) {
  const { setOptimizedInterval, clearOptimizedInterval, makeOptimizedAPICall, isMounted } = useMemoryOptimization(componentName);
  const intervalRef = useRef(null);

  const startPolling = useCallback(async () => {
    if (!isMounted()) return;

    // Initial fetch
    try {
      await fetchFunction();
    } catch (error) {
      logWarn(`Initial fetch failed in ${componentName}`, { error: error.message });
    }

    // Start polling
    if (intervalRef.current) {
      clearOptimizedInterval(intervalRef.current);
    }

    intervalRef.current = setOptimizedInterval(async () => {
      try {
        await fetchFunction();
      } catch (error) {
        logWarn(`Polling fetch failed in ${componentName}`, { error: error.message });
      }
    }, interval, 'polling');

  }, [fetchFunction, interval, componentName, setOptimizedInterval, clearOptimizedInterval, isMounted]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearOptimizedInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [clearOptimizedInterval]);

  useEffect(() => {
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return {
    startPolling,
    stopPolling,
    isPolling: () => intervalRef.current !== null
  };
}

export default useMemoryOptimization;