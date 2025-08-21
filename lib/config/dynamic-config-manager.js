/**
 * Dynamic Configuration Manager
 * Loads configuration from environment variables with caching and hot-reloading
 * Eliminates hardcoded values throughout the application
 */

import { logInfo, logError, logWarn } from '../production-logger.js';

class DynamicConfigManager {
  constructor() {
    this.config = new Map();
    this.lastLoaded = 0;
    this.reloadInterval = 300000; // 5 minutes
    this.configDirty = false;
    
    // Initialize configuration
    this.loadConfiguration();
    
    // Set up periodic reload in production
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        this.reloadConfigurationIfNeeded();
      }, this.reloadInterval);
    }
  }
  
  /**
   * Load configuration from environment variables
   */
  loadConfiguration() {
    const startTime = Date.now();
    
    try {
      // Memory Management Configuration
      this.config.set('memory', {
        pressureThreshold: parseInt(process.env.MEMORY_PRESSURE_THRESHOLD_MB) || 512,
        gcThreshold: parseInt(process.env.MEMORY_GC_THRESHOLD_MB) || 768,
        monitorInterval: parseInt(process.env.MEMORY_MONITOR_INTERVAL_MS) || 60000
      });
      
      // Cache Configuration
      this.config.set('cache', {
        volatileDataTTL: parseInt(process.env.CACHE_TTL_VOLATILE_DATA) || 3600,
        stableDataTTL: parseInt(process.env.CACHE_TTL_STABLE_DATA) || 86400,
        apiResponsesTTL: parseInt(process.env.CACHE_TTL_API_RESPONSES) || 1800,
        userSessionsTTL: parseInt(process.env.CACHE_TTL_USER_SESSIONS) || 7200
      });
      
      // API Timeout Configuration
      this.config.set('timeouts', {
        default: parseInt(process.env.API_TIMEOUT_DEFAULT) || 30000,
        database: parseInt(process.env.API_TIMEOUT_DATABASE) || 10000,
        external: parseInt(process.env.API_TIMEOUT_EXTERNAL) || 20000,
        intelligence: parseInt(process.env.API_TIMEOUT_INTELLIGENCE) || 15000
      });
      
      // Database Configuration
      this.config.set('database', {
        queryBatchSize: parseInt(process.env.DB_QUERY_BATCH_SIZE) || 50,
        connectionPoolSize: parseInt(process.env.DB_CONNECTION_POOL_SIZE) || 10,
        queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT_MS) || 5000
      });
      
      // Business Logic Configuration
      this.config.set('business', {
        similarityThreshold: parseFloat(process.env.SIMILARITY_MATCH_THRESHOLD) || 0.8,
        confidenceMultiplier: parseFloat(process.env.CONFIDENCE_SCORE_MULTIPLIER) || 1.0,
        networkGrowthCap: parseFloat(process.env.NETWORK_GROWTH_CAP) || 3.0,
        seasonalPatternWeight: parseFloat(process.env.SEASONAL_PATTERN_WEIGHT) || 0.7
      });
      
      // Shipping Intelligence Configuration
      this.config.set('shipping', {
        capacityHighThreshold: parseInt(process.env.SHIPPING_CAPACITY_HIGH_THRESHOLD) || 85,
        capacityMediumThreshold: parseInt(process.env.SHIPPING_CAPACITY_MEDIUM_THRESHOLD) || 65,
        updateInterval: parseInt(process.env.SHIPPING_CONSTRAINT_UPDATE_INTERVAL) || 300000,
        defaultTransitTime: 28,
        defaultReliabilityScore: 87,
        defaultCostEfficiency: 78
      });
      
      // Beast Master Configuration
      this.config.set('beastMaster', {
        timeoutSimilarity: parseInt(process.env.BEAST_MASTER_TIMEOUT_SIMILARITY) || 1500,
        timeoutSeasonal: parseInt(process.env.BEAST_MASTER_TIMEOUT_SEASONAL) || 500,
        timeoutMarket: parseInt(process.env.BEAST_MASTER_TIMEOUT_MARKET) || 500,
        timeoutPatterns: parseInt(process.env.BEAST_MASTER_TIMEOUT_PATTERNS) || 1000,
        timeoutShipping: parseInt(process.env.BEAST_MASTER_TIMEOUT_SHIPPING) || 2000,
        maxActiveRequests: parseInt(process.env.BEAST_MASTER_MAX_ACTIVE_REQUESTS) || 10,
        cacheTimeout: 300000 // 5 minutes
      });
      
      // Performance Configuration
      this.config.set('performance', {
        useOptimizedQueries: process.env.NEXT_PUBLIC_USE_OPTIMIZED_QUERIES === 'true',
        useBatchOperations: process.env.NEXT_PUBLIC_USE_BATCH_OPERATIONS === 'true',
        useQueryCaching: process.env.NEXT_PUBLIC_USE_QUERY_CACHING === 'true',
        usePrefetching: process.env.NEXT_PUBLIC_USE_PREFETCHING === 'true',
        enablePerformanceMonitoring: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true'
      });
      
      this.lastLoaded = Date.now();
      this.configDirty = false;
      
      const loadTime = Date.now() - startTime;
      logInfo('Dynamic configuration loaded successfully', {
        categories: this.config.size,
        loadTime: `${loadTime}ms`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logError('Failed to load dynamic configuration', { error: error.message });
      this.loadFallbackConfiguration();
    }
  }
  
  /**
   * Load fallback configuration with safe defaults
   */
  loadFallbackConfiguration() {
    logWarn('Loading fallback configuration with safe defaults');
    
    this.config.clear();
    
    // Safe defaults for all categories
    this.config.set('memory', {
      pressureThreshold: 512,
      gcThreshold: 768,
      monitorInterval: 60000
    });
    
    this.config.set('cache', {
      volatileDataTTL: 3600,
      stableDataTTL: 86400,
      apiResponsesTTL: 1800,
      userSessionsTTL: 7200
    });
    
    this.config.set('timeouts', {
      default: 30000,
      database: 10000,
      external: 20000,
      intelligence: 15000
    });
    
    this.config.set('database', {
      queryBatchSize: 50,
      connectionPoolSize: 10,
      queryTimeout: 5000
    });
    
    this.config.set('business', {
      similarityThreshold: 0.8,
      confidenceMultiplier: 1.0,
      networkGrowthCap: 3.0,
      seasonalPatternWeight: 0.7
    });
    
    this.config.set('shipping', {
      capacityHighThreshold: 85,
      capacityMediumThreshold: 65,
      updateInterval: 300000,
      defaultTransitTime: 28,
      defaultReliabilityScore: 87,
      defaultCostEfficiency: 78
    });
    
    this.config.set('beastMaster', {
      timeoutSimilarity: 1500,
      timeoutSeasonal: 500,
      timeoutMarket: 500,
      timeoutPatterns: 1000,
      timeoutShipping: 2000,
      maxActiveRequests: 10,
      cacheTimeout: 300000
    });
    
    this.config.set('performance', {
      useOptimizedQueries: true,
      useBatchOperations: true,
      useQueryCaching: true,
      usePrefetching: true,
      enablePerformanceMonitoring: true
    });
  }
  
  /**
   * Get configuration for a specific category
   * @param {string} category - Configuration category
   * @returns {Object} Configuration object
   */
  get(category) {
    if (!this.config.has(category)) {
      logWarn(`Configuration category '${category}' not found, using empty object`);
      return {};
    }
    
    return this.config.get(category);
  }
  
  /**
   * Get a specific configuration value
   * @param {string} category - Configuration category
   * @param {string} key - Configuration key
   * @param {any} defaultValue - Default value if not found
   * @returns {any} Configuration value
   */
  getValue(category, key, defaultValue = null) {
    const categoryConfig = this.get(category);
    
    if (categoryConfig.hasOwnProperty(key)) {
      return categoryConfig[key];
    }
    
    if (defaultValue !== null) {
      logWarn(`Configuration ${category}.${key} not found, using default: ${defaultValue}`);
      return defaultValue;
    }
    
    logError(`Configuration ${category}.${key} not found and no default provided`);
    return null;
  }
  
  /**
   * Reload configuration if needed
   */
  reloadConfigurationIfNeeded() {
    const now = Date.now();
    
    // Check if configuration should be reloaded
    if (now - this.lastLoaded > this.reloadInterval || this.configDirty) {
      logInfo('Reloading dynamic configuration', { reason: this.configDirty ? 'marked_dirty' : 'periodic' });
      this.loadConfiguration();
    }
  }
  
  /**
   * Mark configuration as dirty for next reload
   */
  markDirty() {
    this.configDirty = true;
    logInfo('Configuration marked as dirty, will reload on next check');
  }
  
  /**
   * Get all configuration categories
   * @returns {Array} Array of category names
   */
  getCategories() {
    return Array.from(this.config.keys());
  }
  
  /**
   * Get configuration summary for debugging
   * @returns {Object} Configuration summary
   */
  getSummary() {
    const summary = {};
    
    for (const [category, config] of this.config.entries()) {
      summary[category] = {
        keys: Object.keys(config),
        keyCount: Object.keys(config).length
      };
    }
    
    return {
      categories: this.config.size,
      lastLoaded: new Date(this.lastLoaded).toISOString(),
      isDirty: this.configDirty,
      details: summary
    };
  }
  
  /**
   * Validate configuration values
   * @returns {Object} Validation results
   */
  validateConfiguration() {
    const errors = [];
    const warnings = [];
    
    // Validate memory configuration
    const memory = this.get('memory');
    if (memory.pressureThreshold >= memory.gcThreshold) {
      errors.push('Memory pressure threshold should be less than GC threshold');
    }
    
    // Validate cache TTLs
    const cache = this.get('cache');
    if (cache.volatileDataTTL >= cache.stableDataTTL) {
      warnings.push('Volatile data TTL should typically be less than stable data TTL');
    }
    
    // Validate timeouts
    const timeouts = this.get('timeouts');
    if (timeouts.database > timeouts.default) {
      warnings.push('Database timeout should typically be less than default timeout');
    }
    
    // Validate business logic
    const business = this.get('business');
    if (business.similarityThreshold < 0 || business.similarityThreshold > 1) {
      errors.push('Similarity threshold should be between 0 and 1');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date().toISOString()
    };
  }
}

// Create and export singleton instance
export const configManager = new DynamicConfigManager();
export default configManager;

// Export helper functions for common use cases
export const getMemoryConfig = () => configManager.get('memory');
export const getCacheConfig = () => configManager.get('cache');
export const getTimeoutConfig = () => configManager.get('timeouts');
export const getDatabaseConfig = () => configManager.get('database');
export const getBusinessConfig = () => configManager.get('business');
export const getShippingConfig = () => configManager.get('shipping');
export const getBeastMasterConfig = () => configManager.get('beastMaster');
export const getPerformanceConfig = () => configManager.get('performance');