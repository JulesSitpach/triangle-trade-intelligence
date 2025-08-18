/**
 * Environment Variable Validation and Configuration
 * Centralized validation for production readiness
 */

// Required environment variables for production
// Split by client/server because client can't see server-only vars
const CLIENT_REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

const SERVER_REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'NEXTAUTH_SECRET'
]

const SERVER_RECOMMENDED_ENV_VARS = [
  'ANTHROPIC_API_KEY',
  'COMTRADE_API_KEY', 
  'SHIPPO_API_KEY',
  'STRIPE_SECRET_KEY'
]

// Optional environment variables with defaults
const OPTIONAL_ENV_VARS = {
  NODE_ENV: 'development',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
}

/**
 * Validate all required environment variables are present
 * @throws {Error} If any required variable is missing
 */
export function validateEnvironment() {
  // Skip validation entirely on client-side to avoid errors
  if (typeof window !== 'undefined') {
    console.log('✅ Environment validation skipped on client-side')
    return
  }
  
  // Server-side validation
  const missing = SERVER_REQUIRED_ENV_VARS.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required server-side environment variables: ${missing.join(', ')}`)
  }
  
  // Note: Using console.log here as this runs before logger is initialized
  console.log('✅ All required environment variables are present')
}

/**
 * Get environment variable with validation
 * @param {string} key - Environment variable key
 * @param {boolean} required - Whether the variable is required
 * @returns {string} Environment variable value
 */
export function getEnvVar(key, required = true) {
  const value = process.env[key]
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  
  return value || OPTIONAL_ENV_VARS[key]
}

/**
 * Check if running in production
 */
export function isProduction() {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment() {
  return process.env.NODE_ENV === 'development'
}

/**
 * Safe logging that respects environment
 * Only logs in development unless force is true
 */
export function safeLog(message, data = null, force = false) {
  if (isDevelopment() || force) {
    if (data) {
      // Note: Using console.log here as this is used for bootstrap logging
      console.log(message, data)
    } else {
      console.log(message)
    }
  }
}

/**
 * Get Supabase configuration based on environment
 */
export function getSupabaseConfig() {
  const url = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
  
  // Use service role key on server, anon key on client
  const key = typeof window !== 'undefined'
    ? getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    : getEnvVar('SUPABASE_SERVICE_ROLE_KEY', false) || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  
  return { url, key }
}

/**
 * Validate API keys are not exposed and check for security issues
 */
export function validateAPIKeysSecurity() {
  const sensitiveKeys = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
    'STRIPE_SECRET_KEY',
    'COMTRADE_API_KEY',
    'SHIPPO_API_KEY',
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'ENTERPRISE_MASTER_KEY'
  ]
  
  if (typeof window !== 'undefined') {
    // Check if any sensitive keys are accessible on client
    const exposedKeys = sensitiveKeys.filter(key => window.process?.env?.[key])
    
    if (exposedKeys.length > 0) {
      throw new Error(`SECURITY VIOLATION: Sensitive keys exposed to client: ${exposedKeys.join(', ')}`)
    }
  }
}

/**
 * Check for dangerous default/template values
 */
export function validateSecretSecurity() {
  const dangerousPatterns = [
    { key: 'JWT_SECRET', patterns: ['your-super-secure', 'generate-new', 'REPLACE_WITH'] },
    { key: 'NEXTAUTH_SECRET', patterns: ['your-nextauth-secret', 'generate-new', 'REPLACE_WITH'] },
    { key: 'ENTERPRISE_MASTER_KEY', patterns: ['triangle-intelligence-enterprise', 'generate-new', 'REPLACE_WITH'] },
    { key: 'ANTHROPIC_API_KEY', patterns: ['your-key-here', 'REPLACE_WITH'] }
  ]

  const warnings = []
  
  dangerousPatterns.forEach(({ key, patterns }) => {
    if (process.env[key]) {
      patterns.forEach(pattern => {
        if (process.env[key].includes(pattern)) {
          warnings.push(`${key} appears to use default/template value`)
        }
      })
    }
  })

  // Check secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET is too short (minimum 32 characters)')
  }

  return warnings
}

/**
 * Get comprehensive security status
 */
export function getSecurityStatus() {
  const warnings = validateSecretSecurity()
  const requiredMissing = SERVER_REQUIRED_ENV_VARS.filter(key => !process.env[key])
  const recommendedMissing = SERVER_RECOMMENDED_ENV_VARS.filter(key => !process.env[key])
  
  return {
    status: requiredMissing.length === 0 && warnings.length === 0 ? 'secure' : 'needs_attention',
    requiredMissing,
    recommendedMissing,
    securityWarnings: warnings,
    lastChecked: new Date().toISOString()
  }
}

// Auto-validate on import in development (SERVER-SIDE ONLY)
if (isDevelopment() && typeof window === 'undefined') {
  try {
    validateEnvironment()
    validateAPIKeysSecurity()
  } catch (error) {
    // Note: Using console.error here as this is critical bootstrap error
    console.error('❌ Environment validation failed:', error.message)
  }
}