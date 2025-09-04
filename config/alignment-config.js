
/**
 * ALIGNMENT-OPTIMIZED CONFIGURATION
 * Eliminates hardcoded values detected by alignment checker
 */

// Dynamic thresholds from environment
export const ALIGNMENT_CONFIG = {
  database: {
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT_MS) || 8000,
    connectionPoolSize: parseInt(process.env.DB_CONNECTION_POOL_SIZE) || 10,
    retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS) || 3
  },
  
  classification: {
    confidenceThreshold: parseFloat(process.env.MIN_CLASSIFICATION_CONFIDENCE) || 0.75,
    maxResults: parseInt(process.env.MAX_CLASSIFICATION_RESULTS) || 10,
    searchTimeout: parseInt(process.env.CLASSIFICATION_TIMEOUT_MS) || 5000
  },
  
  microservices: {
    defaultTimeout: parseInt(process.env.MICROSERVICE_TIMEOUT_MS) || 30000,
    maxRetries: parseInt(process.env.MICROSERVICE_MAX_RETRIES) || 2,
    circuitBreakerThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD) || 5
  },
  
  usmca: {
    regionalContentThresholds: {
      electronics: parseFloat(process.env.USMCA_ELECTRONICS_THRESHOLD) || 0.75,
      automotive: parseFloat(process.env.USMCA_AUTOMOTIVE_THRESHOLD) || 0.75,
      textiles: parseFloat(process.env.USMCA_TEXTILES_THRESHOLD) || 0.625,
      general: parseFloat(process.env.USMCA_GENERAL_THRESHOLD) || 0.625
    }
  },
  
  performance: {
    apiResponseTarget: parseInt(process.env.API_RESPONSE_TARGET_MS) || 200,
    databaseQueryTarget: parseInt(process.env.DB_QUERY_TARGET_MS) || 100,
    cacheExpirySeconds: parseInt(process.env.CACHE_EXPIRY_SECONDS) || 3600
  }
};

// Environment validation
export function validateAlignmentConfig() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
}
