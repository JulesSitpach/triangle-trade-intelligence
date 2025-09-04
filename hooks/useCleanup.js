import { useEffect, useRef, useCallback } from 'react';

/**
 * useCleanup Hook
 * Provides utilities for proper cleanup and memory leak prevention
 * Handles timers, intervals, promises, abort controllers, and event listeners
 */
export const useCleanup = () => {
  const timeoutsRef = useRef(new Set());
  const intervalsRef = useRef(new Set());
  const abortControllersRef = useRef(new Set());
  const eventListenersRef = useRef(new Map());
  const promisesRef = useRef(new Set());
  const cleanupFunctionsRef = useRef(new Set());

  // Register a timeout for cleanup
  const registerTimeout = useCallback((timeoutId) => {
    timeoutsRef.current.add(timeoutId);
    return timeoutId;
  }, []);

  // Register an interval for cleanup
  const registerInterval = useCallback((intervalId) => {
    intervalsRef.current.add(intervalId);
    return intervalId;
  }, []);

  // Register an abort controller for cleanup
  const registerAbortController = useCallback((controller) => {
    abortControllersRef.current.add(controller);
    return controller;
  }, []);

  // Register an event listener for cleanup
  const registerEventListener = useCallback((element, event, handler, options) => {
    const key = `${element}-${event}`;
    const listenerData = { element, event, handler, options };
    
    if (!eventListenersRef.current.has(key)) {
      eventListenersRef.current.set(key, []);
    }
    
    eventListenersRef.current.get(key).push(listenerData);
    element.addEventListener(event, handler, options);
    
    return () => {
      element.removeEventListener(event, handler, options);
      const listeners = eventListenersRef.current.get(key);
      if (listeners) {
        const index = listeners.indexOf(listenerData);
        if (index > -1) {
          listeners.splice(index, 1);
        }
        if (listeners.length === 0) {
          eventListenersRef.current.delete(key);
        }
      }
    };
  }, []);

  // Register a promise for potential cancellation
  const registerPromise = useCallback((promise) => {
    promisesRef.current.add(promise);
    
    // Remove from set when promise settles
    promise.finally(() => {
      promisesRef.current.delete(promise);
    });
    
    return promise;
  }, []);

  // Register a custom cleanup function
  const registerCleanup = useCallback((cleanupFn) => {
    if (typeof cleanupFn === 'function') {
      cleanupFunctionsRef.current.add(cleanupFn);
      
      // Return a function to unregister this cleanup
      return () => {
        cleanupFunctionsRef.current.delete(cleanupFn);
      };
    }
  }, []);

  // Safe setTimeout with automatic cleanup
  const safeSetTimeout = useCallback((callback, delay) => {
    const timeoutId = setTimeout(() => {
      timeoutsRef.current.delete(timeoutId);
      callback();
    }, delay);
    
    return registerTimeout(timeoutId);
  }, [registerTimeout]);

  // Safe setInterval with automatic cleanup
  const safeSetInterval = useCallback((callback, interval) => {
    const intervalId = setInterval(callback, interval);
    return registerInterval(intervalId);
  }, [registerInterval]);

  // Create abort controller with automatic cleanup
  const createAbortController = useCallback(() => {
    const controller = new AbortController();
    return registerAbortController(controller);
  }, [registerAbortController]);

  // Safe fetch with abort controller
  const safeFetch = useCallback(async (url, options = {}) => {
    const controller = createAbortController();
    
    const fetchOptions = {
      ...options,
      signal: controller.signal
    };
    
    try {
      const response = await fetch(url, fetchOptions);
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted:', url);
      }
      throw error;
    }
  }, [createAbortController]);

  // Manual cleanup functions
  const cleanupTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    timeoutsRef.current.clear();
  }, []);

  const cleanupIntervals = useCallback(() => {
    intervalsRef.current.forEach(intervalId => {
      clearInterval(intervalId);
    });
    intervalsRef.current.clear();
  }, []);

  const cleanupAbortControllers = useCallback(() => {
    abortControllersRef.current.forEach(controller => {
      try {
        controller.abort();
      } catch (error) {
        console.warn('Error aborting controller:', error);
      }
    });
    abortControllersRef.current.clear();
  }, []);

  const cleanupEventListeners = useCallback(() => {
    eventListenersRef.current.forEach(listeners => {
      listeners.forEach(({ element, event, handler, options }) => {
        try {
          element.removeEventListener(event, handler, options);
        } catch (error) {
          console.warn('Error removing event listener:', error);
        }
      });
    });
    eventListenersRef.current.clear();
  }, []);

  const cleanupCustomFunctions = useCallback(() => {
    cleanupFunctionsRef.current.forEach(cleanupFn => {
      try {
        cleanupFn();
      } catch (error) {
        console.warn('Error in custom cleanup function:', error);
      }
    });
    cleanupFunctionsRef.current.clear();
  }, []);

  // Master cleanup function
  const cleanupAll = useCallback(() => {
    cleanupTimeouts();
    cleanupIntervals();
    cleanupAbortControllers();
    cleanupEventListeners();
    cleanupCustomFunctions();
    
    // Clear promise references (they can't be cancelled, but we can stop tracking them)
    promisesRef.current.clear();
  }, [
    cleanupTimeouts,
    cleanupIntervals,
    cleanupAbortControllers,
    cleanupEventListeners,
    cleanupCustomFunctions
  ]);

  // Automatic cleanup on unmount
  useEffect(() => {
    return cleanupAll;
  }, [cleanupAll]);

  // Get current state (useful for debugging)
  const getCleanupState = useCallback(() => {
    return {
      timeouts: timeoutsRef.current.size,
      intervals: intervalsRef.current.size,
      abortControllers: abortControllersRef.current.size,
      eventListeners: eventListenersRef.current.size,
      promises: promisesRef.current.size,
      customCleanups: cleanupFunctionsRef.current.size
    };
  }, []);

  return {
    // Registration functions
    registerTimeout,
    registerInterval,
    registerAbortController,
    registerEventListener,
    registerPromise,
    registerCleanup,
    
    // Safe utilities
    safeSetTimeout,
    safeSetInterval,
    createAbortController,
    safeFetch,
    
    // Manual cleanup functions
    cleanupTimeouts,
    cleanupIntervals,
    cleanupAbortControllers,
    cleanupEventListeners,
    cleanupCustomFunctions,
    cleanupAll,
    
    // Debug utilities
    getCleanupState
  };
};

/**
 * useDebounce Hook with cleanup
 * Provides debounced functions with automatic cleanup
 */
export const useDebounce = (callback, delay, deps = []) => {
  const { safeSetTimeout, cleanupTimeouts } = useCleanup();
  const callbackRef = useRef(callback);
  
  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);
  
  const debouncedCallback = useCallback((...args) => {
    cleanupTimeouts(); // Clear any existing timeout
    
    safeSetTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay, safeSetTimeout, cleanupTimeouts]);
  
  return debouncedCallback;
};

/**
 * useAsyncEffect Hook with cleanup
 * Provides async effects with automatic cleanup and cancellation
 */
export const useAsyncEffect = (asyncFn, deps = []) => {
  const { createAbortController, registerPromise } = useCleanup();
  
  useEffect(() => {
    const controller = createAbortController();
    
    const runAsyncEffect = async () => {
      try {
        const promise = asyncFn(controller.signal);
        registerPromise(promise);
        await promise;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Async effect error:', error);
        }
      }
    };
    
    runAsyncEffect();
  }, deps);
};

export default useCleanup;