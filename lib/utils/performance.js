/**
 * performance.js - Production performance optimization utilities
 * Provides caching, memoization, and performance monitoring
 * Optimizes React components and API calls for production
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

// API Response Caching
class APICache {
  constructor(maxSize = 100, ttlMs = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.data;
  }

  set(key, data) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl
    });
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0
    };
  }
}

// Global API cache instance
export const apiCache = new APICache();

// Cached fetch wrapper
export const cachedFetch = async (url, options = {}) => {
  const cacheKey = `${url}:${JSON.stringify(options)}`;

  // Check cache first for GET requests
  if (!options.method || options.method === 'GET') {
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Cache successful GET responses
    if (response.ok && (!options.method || options.method === 'GET')) {
      apiCache.set(cacheKey, { response, data });
    }

    return { response, data };
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
  }

  startTiming(name) {
    const start = performance.now();
    return {
      end: () => {
        const duration = performance.now() - start;
        this.recordMetric(name, duration);
        return duration;
      }
    };
  }

  recordMetric(name, value, type = 'timing') {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metric = {
      value,
      type,
      timestamp: Date.now()
    };

    this.metrics.get(name).push(metric);

    // Keep only last 100 measurements
    const measurements = this.metrics.get(name);
    if (measurements.length > 100) {
      measurements.splice(0, measurements.length - 100);
    }

    // Notify observers
    this.observers.forEach(observer => observer(name, metric));
  }

  getMetrics(name) {
    const measurements = this.metrics.get(name) || [];
    if (measurements.length === 0) return null;

    const values = measurements.map(m => m.value);
    return {
      count: values.length,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      recent: values.slice(-10) // Last 10 measurements
    };
  }

  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  reportToConsole() {
    console.group('📊 Performance Metrics');
    for (const [name, _] of this.metrics) {
      const stats = this.getMetrics(name);
      if (stats) {
        console.log(`${name}:`, {
          avg: `${stats.average.toFixed(2)}ms`,
          min: `${stats.min.toFixed(2)}ms`,
          max: `${stats.max.toFixed(2)}ms`,
          count: stats.count
        });
      }
    }
    console.groupEnd();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React hooks for performance optimization

// Debounced state hook
export const useDebouncedState = (initialValue, delay = 300) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timeoutRef = useRef();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return [debouncedValue, setValue];
};

// Optimized search hook with caching
export const useOptimizedSearch = (searchFunction, dependencies = []) => {
  const cache = useRef(new Map());
  const lastSearch = useRef('');

  return useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm === lastSearch.current) {
      return cache.current.get(lastSearch.current) || [];
    }

    // Check cache
    if (cache.current.has(searchTerm)) {
      lastSearch.current = searchTerm;
      return cache.current.get(searchTerm);
    }

    // Perform search with timing
    const timer = performanceMonitor.startTiming('search');
    try {
      const results = await searchFunction(searchTerm);

      // Cache results
      cache.current.set(searchTerm, results);

      // Limit cache size
      if (cache.current.size > 50) {
        const firstKey = cache.current.keys().next().value;
        cache.current.delete(firstKey);
      }

      lastSearch.current = searchTerm;
      timer.end();

      return results;
    } catch (error) {
      timer.end();
      throw error;
    }
  }, dependencies);
};

// Virtual scrolling hook for large lists
export const useVirtualScrolling = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = useMemo(() => {
    return items.slice(visibleStart, visibleEnd).map((item, index) => ({
      ...item,
      index: visibleStart + index
    }));
  }, [items, visibleStart, visibleEnd]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
};

// Performance-optimized component wrapper
export const withPerformanceMonitoring = (Component, componentName) => {
  return function MonitoredComponent(props) {
    useEffect(() => {
      const timer = performanceMonitor.startTiming(`${componentName}_mount`);
      return timer.end;
    }, []);

    const renderTimer = performanceMonitor.startTiming(`${componentName}_render`);

    useEffect(() => {
      renderTimer.end();
    });

    return <Component {...props} />;
  };
};

// Lazy loading utilities
export const createLazyComponent = (importFn, fallback = null) => {
  return React.lazy(() => {
    const timer = performanceMonitor.startTiming('lazy_load');
    return importFn().then(module => {
      timer.end();
      return module;
    });
  });
};

// Memory usage monitoring
export const useMemoryMonitoring = (interval = 30000) => {
  const [memoryInfo, setMemoryInfo] = useState(null);

  useEffect(() => {
    if (!performance.memory) return;

    const updateMemoryInfo = () => {
      const memory = performance.memory;
      const info = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
        timestamp: Date.now()
      };

      setMemoryInfo(info);
      performanceMonitor.recordMetric('memory_usage', info.used, 'memory');
    };

    updateMemoryInfo();
    const intervalId = setInterval(updateMemoryInfo, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return memoryInfo;
};

// Bundle size optimization helpers
export const preloadRoute = (routePath) => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = routePath;
    document.head.appendChild(link);
  }
};

export const preloadImage = (src) => {
  if (typeof window !== 'undefined') {
    const img = new Image();
    img.src = src;
  }
};

// Development performance helpers
export const logRenderInfo = (componentName, props) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 ${componentName} rendered`, {
      props: Object.keys(props),
      timestamp: new Date().toISOString()
    });
  }
};

export const warnSlowRender = (componentName, startTime) => {
  if (process.env.NODE_ENV === 'development') {
    const renderTime = performance.now() - startTime;
    if (renderTime > 16) { // Longer than one frame
      console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  }
};

// Initialize performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  // Log performance metrics every 30 seconds
  setInterval(() => {
    performanceMonitor.reportToConsole();
  }, 30000);

  // Monitor memory usage
  if (performance.memory) {
    setInterval(() => {
      const memory = performance.memory;
      console.log('💾 Memory usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1048576)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1048576)}MB`
      });
    }, 60000);
  }
}