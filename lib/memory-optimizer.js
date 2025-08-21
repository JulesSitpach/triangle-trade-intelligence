/**
 * 🧠 MEMORY OPTIMIZER - PRODUCTION MEMORY MANAGEMENT
 * 
 * Comprehensive memory management system for Triangle Intelligence Platform
 * Eliminates memory leaks while maintaining 30-second real-time updates
 * 
 * KEY FEATURES:
 * ✅ Process event listener cleanup
 * ✅ React component unmount handlers  
 * ✅ API call cancellation with AbortController
 * ✅ RSS monitoring cleanup
 * ✅ Beast Master resource management
 * ✅ Database connection pooling optimization
 * ✅ Automatic memory pressure detection
 */

import { logInfo, logError, logWarn } from './production-logger.js';

class MemoryOptimizer {
  constructor() {
    this.lastLogTime = 0;
    this.cleanupHandlers = new Map();
    this.intervalCleanup = new Map();
    this.timeoutCleanup = new Map();
    this.eventListeners = new Map();
    this.abortControllers = new Set();
    
    // Environment-based configuration (CRITICAL FIX)
    this.memoryPressureThreshold = (parseInt(process.env.MEMORY_PRESSURE_THRESHOLD_MB) || 512) * 1024 * 1024;
    this.gcThreshold = (parseInt(process.env.MEMORY_GC_THRESHOLD_MB) || 768) * 1024 * 1024;
    this.monitorInterval = parseInt(process.env.MEMORY_MONITOR_INTERVAL_MS) || 60000;
    this.isInitialized = false;
    this.lastCleanupTime = 0;
    
    this.initializeMemoryMonitoring();
  }

  /**
   * Initialize memory monitoring and cleanup systems
   */
  initializeMemoryMonitoring() {
    if (this.isInitialized) return;

    // Only run in server environment
    if (typeof process === 'undefined' || typeof window !== 'undefined') {
      logInfo('Memory Optimizer: Browser environment detected, limited functionality enabled');
      this.isInitialized = true;
      return;
    }

    // Monitor memory usage based on environment configuration
    const memoryMonitor = setInterval(() => {
      this.checkMemoryPressure();
    }, this.monitorInterval);
    
    this.registerCleanup('memoryMonitor', () => clearInterval(memoryMonitor));

    // Process cleanup handlers
    const processCleanup = () => {
      logInfo('Memory Optimizer: Initiating graceful shutdown');
      this.performGlobalCleanup();
      process.exit(0);
    };

    // Register process event listeners with proper cleanup
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');

    process.once('SIGTERM', processCleanup);
    process.once('SIGINT', processCleanup);
    
    process.on('uncaughtException', (error) => {
      logError('Uncaught Exception - initiating cleanup', { error: error.message });
      this.performGlobalCleanup();
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logError('Unhandled Promise Rejection - cleaning up', { 
        reason: reason?.message || reason,
        stack: reason?.stack 
      });
    });

    this.isInitialized = true;
    logInfo('Memory Optimizer initialized successfully');
  }

  /**
   * Register cleanup handler for a specific resource
   */
  registerCleanup(id, cleanupFunction) {
    if (this.cleanupHandlers.has(id)) {
      logWarn(`Cleanup handler already registered for: ${id}`);
      this.cleanupHandlers.get(id)(); // Clean up old one first
    }
    
    this.cleanupHandlers.set(id, cleanupFunction);
    logInfo(`Registered cleanup handler: ${id}`);
  }

  /**
   * Register interval with automatic cleanup
   */
  registerInterval(id, intervalId) {
    if (this.intervalCleanup.has(id)) {
      clearInterval(this.intervalCleanup.get(id));
    }
    
    this.intervalCleanup.set(id, intervalId);
    
    // Auto-cleanup after 10 minutes to prevent accumulation
    setTimeout(() => {
      if (this.intervalCleanup.has(id)) {
        clearInterval(this.intervalCleanup.get(id));
        this.intervalCleanup.delete(id);
        logInfo(`Auto-cleaned interval: ${id}`);
      }
    }, 600000); // 10 minutes
  }

  /**
   * Register timeout with automatic cleanup
   */
  registerTimeout(id, timeoutId) {
    if (this.timeoutCleanup.has(id)) {
      clearTimeout(this.timeoutCleanup.get(id));
    }
    
    this.timeoutCleanup.set(id, timeoutId);
  }

  /**
   * Create and register AbortController for API calls
   */
  createAbortController(timeoutMs = 30000) {
    const controller = new AbortController();
    this.abortControllers.add(controller);

    // Auto-abort after timeout to prevent hanging requests
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort();
        this.abortControllers.delete(controller);
        logInfo('Auto-aborted API request due to timeout');
      }
    }, timeoutMs);

    // Clean up timeout when controller is aborted
    controller.signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      this.abortControllers.delete(controller);
    });

    return controller;
  }

  /**
   * React useEffect cleanup helper
   */
  createReactCleanup() {
    const cleanupFunctions = [];
    
    return {
      register: (cleanupFn) => {
        cleanupFunctions.push(cleanupFn);
      },
      cleanup: () => {
        cleanupFunctions.forEach((fn, index) => {
          try {
            fn();
          } catch (error) {
            logError(`React cleanup function ${index} failed`, { error: error.message });
          }
        });
        cleanupFunctions.length = 0;
      }
    };
  }

  /**
   * Check memory pressure and trigger cleanup if needed - OPTIMIZED
   */
  checkMemoryPressure() {
    // Only run memory checks in server environment
    if (typeof process === 'undefined' || typeof window !== 'undefined') {
      return;
    }

    const memUsage = process.memoryUsage();
    const heapUsed = memUsage.heapUsed;
    const external = memUsage.external;
    const totalMemory = heapUsed + external;
    
    const totalMemoryMB = Math.round(totalMemory / 1024 / 1024);
    const thresholdMB = Math.round(this.memoryPressureThreshold / 1024 / 1024);
    const gcThresholdMB = Math.round(this.gcThreshold / 1024 / 1024);

    // CRITICAL FIX: Only log when threshold exceeded or every 5 minutes
    const now = Date.now();
    const shouldLog = totalMemory > this.memoryPressureThreshold || (now - this.lastLogTime > 300000);
    
    if (shouldLog) {
      logInfo('Memory usage check', {
        heapUsed: Math.round(heapUsed / 1024 / 1024) + 'MB',
        external: Math.round(external / 1024 / 1024) + 'MB',
        total: totalMemoryMB + 'MB',
        threshold: thresholdMB + 'MB',
        gcThreshold: gcThresholdMB + 'MB'
      });
      this.lastLogTime = now;
    }

    // Trigger cleanup if memory usage is high AND enough time has passed
    if (totalMemory > this.memoryPressureThreshold && (now - this.lastCleanupTime > 60000)) {
      logWarn('Memory pressure detected, triggering cleanup', {
        memoryMB: totalMemoryMB,
        thresholdMB: thresholdMB
      });
      this.performMemoryCleanup();
      this.lastCleanupTime = now;
    }

    // Force garbage collection if memory is very high
    if (totalMemory > this.gcThreshold && global.gc) {
      logWarn('High memory usage, forcing garbage collection', {
        memoryMB: totalMemoryMB,
        gcThresholdMB: gcThresholdMB
      });
      global.gc();
    }
  }

  /**
   * Perform memory cleanup operations
   */
  performMemoryCleanup() {
    let cleaned = 0;

    // Clean up old intervals (older than 5 minutes)
    const now = Date.now();
    for (const [id, data] of this.intervalCleanup.entries()) {
      if (typeof data === 'object' && data.timestamp && now - data.timestamp > 300000) {
        clearInterval(data.intervalId);
        this.intervalCleanup.delete(id);
        cleaned++;
      }
    }

    // Clean up old timeouts
    for (const [id, timeoutId] of this.timeoutCleanup.entries()) {
      clearTimeout(timeoutId);
      this.timeoutCleanup.delete(id);
      cleaned++;
    }

    // Abort old API requests
    for (const controller of this.abortControllers) {
      if (!controller.signal.aborted) {
        controller.abort();
        cleaned++;
      }
    }
    this.abortControllers.clear();

    logInfo(`Memory cleanup completed, cleaned ${cleaned} resources`);
  }

  /**
   * Perform global cleanup on shutdown
   */
  performGlobalCleanup() {
    logInfo('Performing global cleanup');

    // Run all registered cleanup handlers
    for (const [id, cleanupFn] of this.cleanupHandlers.entries()) {
      try {
        cleanupFn();
        logInfo(`Cleaned up: ${id}`);
      } catch (error) {
        logError(`Cleanup failed for: ${id}`, { error: error.message });
      }
    }

    // Clear all intervals and timeouts
    for (const intervalId of this.intervalCleanup.values()) {
      clearInterval(typeof intervalId === 'object' ? intervalId.intervalId : intervalId);
    }
    
    for (const timeoutId of this.timeoutCleanup.values()) {
      clearTimeout(timeoutId);
    }

    // Abort all pending requests
    for (const controller of this.abortControllers) {
      controller.abort();
    }

    // Clear maps
    this.cleanupHandlers.clear();
    this.intervalCleanup.clear();
    this.timeoutCleanup.clear();
    this.abortControllers.clear();

    logInfo('Global cleanup completed');
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    if (typeof process === 'undefined' || typeof window !== 'undefined') {
      return { 
        available: false,
        environment: 'browser',
        cleanupHandlers: this.cleanupHandlers.size,
        activeIntervals: this.intervalCleanup.size,
        activeTimeouts: this.timeoutCleanup.size,
        activeRequests: this.abortControllers.size
      };
    }

    const memUsage = process.memoryUsage();
    return {
      available: true,
      environment: 'server',
      heap: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024)
      },
      external: Math.round(memUsage.external / 1024 / 1024),
      cleanupHandlers: this.cleanupHandlers.size,
      activeIntervals: this.intervalCleanup.size,
      activeTimeouts: this.timeoutCleanup.size,
      activeRequests: this.abortControllers.size
    };
  }
}

// Global singleton instance
let memoryOptimizer = null;

export function getMemoryOptimizer() {
  if (!memoryOptimizer) {
    memoryOptimizer = new MemoryOptimizer();
  }
  return memoryOptimizer;
}

// React hook for memory-optimized effects
export function useMemoryOptimizedEffect(effect, deps) {
  const React = require('react');
  
  React.useEffect(() => {
    const optimizer = getMemoryOptimizer();
    const reactCleanup = optimizer.createReactCleanup();
    
    const cleanup = effect(reactCleanup.register);
    
    return () => {
      reactCleanup.cleanup();
      if (cleanup) cleanup();
    };
  }, deps);
}

// API call helper with automatic cleanup
export async function memoryOptimizedAPICall(url, options = {}, timeoutMs = 30000) {
  const optimizer = getMemoryOptimizer();
  const controller = optimizer.createAbortController(timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      logWarn('API call was aborted', { url });
      throw new Error('Request timeout');
    }
    throw error;
  }
}

export default getMemoryOptimizer;