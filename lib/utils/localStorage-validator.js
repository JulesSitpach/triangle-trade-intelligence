/**
 * LOCAL STORAGE DATA VALIDATION & SECURITY
 * Prevents data corruption and ensures data integrity across Triangle Intelligence pages
 * Security-focused validation with expiry timestamps and data structure validation
 */

// Data schemas for validation
const DATA_SCHEMAS = {
  'triangle-foundation': {
    required: ['companyName', 'businessType', 'zipCode', 'primarySupplierCountry', 'importVolume'],
    optional: ['timelinePriority', 'secondarySupplierCountries', 'seasonalPatterns', 'currentShippingPorts', 'specialRequirements'],
    types: {
      companyName: 'string',
      businessType: 'string',
      zipCode: 'string',
      primarySupplierCountry: 'string',
      importVolume: 'string',
      timelinePriority: 'string',
      secondarySupplierCountries: 'array',
      seasonalPatterns: 'string',
      currentShippingPorts: 'array',
      specialRequirements: 'array'
    }
  },
  'triangle-product': {
    required: ['products'],
    optional: ['analysisResults', 'timestamp'],
    types: {
      products: 'array',
      analysisResults: 'object',
      timestamp: 'string'
    }
  },
  'triangle-routing': {
    required: ['selectedRoute'],
    optional: ['routes', 'analysisData', 'timestamp'],
    types: {
      selectedRoute: 'object',
      routes: 'array',
      analysisData: 'object',
      timestamp: 'string'
    }
  },
  'triangle-partnership': {
    required: ['selectedStrategy'],
    optional: ['partnershipAnalysis', 'timestamp'],
    types: {
      selectedStrategy: 'string',
      partnershipAnalysis: 'object',
      timestamp: 'string'
    }
  },
  'triangle-signup': {
    required: ['email'],
    optional: ['companyName', 'industry', 'importVolume', 'timestamp'],
    types: {
      email: 'string',
      companyName: 'string',
      industry: 'string',
      importVolume: 'string',
      timestamp: 'string'
    }
  }
}

// Data expiry times (in milliseconds)
const EXPIRY_TIMES = {
  'triangle-foundation': 24 * 60 * 60 * 1000, // 24 hours
  'triangle-product': 12 * 60 * 60 * 1000,    // 12 hours
  'triangle-routing': 12 * 60 * 60 * 1000,    // 12 hours
  'triangle-partnership': 24 * 60 * 60 * 1000, // 24 hours
  'triangle-signup': 7 * 24 * 60 * 60 * 1000   // 7 days
}

/**
 * Validates the type of a value against expected type
 */
function validateType(value, expectedType) {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number' && !isNaN(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'array':
      return Array.isArray(value)
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value)
    default:
      return false
  }
}

/**
 * Validates data structure against schema
 */
function validateDataStructure(data, schema) {
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Data must be an object'] }
  }

  const errors = []

  // Check required fields
  for (const field of schema.required) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`)
    } else if (!validateType(data[field], schema.types[field])) {
      errors.push(`Invalid type for ${field}: expected ${schema.types[field]}, got ${typeof data[field]}`)
    }
  }

  // Check optional fields types if they exist
  for (const field of schema.optional) {
    if (field in data && !validateType(data[field], schema.types[field])) {
      errors.push(`Invalid type for ${field}: expected ${schema.types[field]}, got ${typeof data[field]}`)
    }
  }

  // Check for unexpected fields (security measure)
  const allowedFields = [...schema.required, ...schema.optional, 'timestamp', '_version']
  for (const field in data) {
    if (!allowedFields.includes(field)) {
      errors.push(`Unexpected field: ${field}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Adds timestamp to data for expiry tracking
 */
function addTimestamp(data) {
  return {
    ...data,
    timestamp: new Date().toISOString(),
    _version: '2.1' // Version for future migration compatibility
  }
}

/**
 * Checks if data has expired
 */
function isExpired(data, key) {
  if (!data.timestamp) {
    return true // No timestamp = expired
  }

  const expiryTime = EXPIRY_TIMES[key] || 24 * 60 * 60 * 1000 // Default 24 hours
  const dataAge = Date.now() - new Date(data.timestamp).getTime()
  
  return dataAge > expiryTime
}

/**
 * Sanitizes data to remove potentially harmful content
 */
function sanitizeData(data) {
  if (typeof data === 'string') {
    // Remove potential XSS patterns
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeData)
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {}
    for (const [key, value] of Object.entries(data)) {
      // Sanitize key names
      const cleanKey = key.replace(/[^\w\-_]/g, '')
      sanitized[cleanKey] = sanitizeData(value)
    }
    return sanitized
  }
  
  return data
}

/**
 * Safely stores data to localStorage with validation
 */
export function setTriangleData(key, data) {
  try {
    if (!DATA_SCHEMAS[key]) {
      console.warn(`⚠️ No schema defined for key: ${key}`)
      return false
    }

    // Sanitize input data
    const sanitizedData = sanitizeData(data)

    // Validate data structure
    const validation = validateDataStructure(sanitizedData, DATA_SCHEMAS[key])
    if (!validation.valid) {
      console.error(`❌ Data validation failed for ${key}:`, validation.errors)
      return false
    }

    // Add timestamp for expiry tracking
    const timestampedData = addTimestamp(sanitizedData)

    // Store to localStorage
    localStorage.setItem(key, JSON.stringify(timestampedData))
    
    console.log(`✅ Data stored successfully: ${key}`)
    return true

  } catch (error) {
    console.error(`❌ Failed to store data for ${key}:`, error)
    return false
  }
}

/**
 * Safely retrieves data from localStorage with validation
 */
export function getTriangleData(key, options = {}) {
  try {
    const { allowExpired = false, returnErrors = false } = options
    
    const rawData = localStorage.getItem(key)
    if (!rawData) {
      return returnErrors ? { data: null, errors: ['No data found'] } : null
    }

    let parsedData
    try {
      parsedData = JSON.parse(rawData)
    } catch (parseError) {
      console.error(`❌ Failed to parse localStorage data for ${key}:`, parseError)
      // Clear corrupted data
      localStorage.removeItem(key)
      return returnErrors ? { data: null, errors: ['Corrupted data removed'] } : null
    }

    // Check expiry
    if (!allowExpired && isExpired(parsedData, key)) {
      console.log(`⏰ Data expired for ${key}, removing...`)
      localStorage.removeItem(key)
      return returnErrors ? { data: null, errors: ['Data expired'] } : null
    }

    // Validate data structure if schema exists
    if (DATA_SCHEMAS[key]) {
      const validation = validateDataStructure(parsedData, DATA_SCHEMAS[key])
      if (!validation.valid) {
        console.error(`❌ Retrieved data validation failed for ${key}:`, validation.errors)
        // Clear invalid data
        localStorage.removeItem(key)
        return returnErrors ? { data: null, errors: validation.errors } : null
      }
    }

    console.log(`✅ Data retrieved successfully: ${key}`)
    return returnErrors ? { data: parsedData, errors: [] } : parsedData

  } catch (error) {
    console.error(`❌ Failed to retrieve data for ${key}:`, error)
    return returnErrors ? { data: null, errors: [error.message] } : null
  }
}

/**
 * Checks if data exists and is valid
 */
export function hasValidTriangleData(key) {
  const data = getTriangleData(key)
  return data !== null
}

/**
 * Removes specific data from localStorage
 */
export function removeTriangleData(key) {
  try {
    localStorage.removeItem(key)
    console.log(`🗑️ Data removed: ${key}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to remove data for ${key}:`, error)
    return false
  }
}

/**
 * Clears all Triangle Intelligence data from localStorage
 */
export function clearAllTriangleData() {
  try {
    const triangleKeys = Object.keys(DATA_SCHEMAS)
    let removedCount = 0

    for (const key of triangleKeys) {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
        removedCount++
      }
    }

    console.log(`🧹 Cleared ${removedCount} Triangle Intelligence data items`)
    return true
  } catch (error) {
    console.error(`❌ Failed to clear Triangle data:`, error)
    return false
  }
}

/**
 * Gets data health status for all stored items
 */
export function getDataHealthStatus() {
  const status = {}
  
  for (const key of Object.keys(DATA_SCHEMAS)) {
    const result = getTriangleData(key, { returnErrors: true, allowExpired: true })
    
    if (result.data) {
      status[key] = {
        exists: true,
        valid: result.errors.length === 0,
        expired: isExpired(result.data, key),
        size: JSON.stringify(result.data).length,
        lastModified: result.data.timestamp || 'Unknown',
        errors: result.errors
      }
    } else {
      status[key] = {
        exists: false,
        valid: false,
        expired: true,
        size: 0,
        lastModified: null,
        errors: result.errors
      }
    }
  }
  
  return status
}

/**
 * Migrates data from old format to new format (version compatibility)
 */
export function migrateTriangleData() {
  console.log('🔄 Checking for data migration needs...')
  
  const migrationCount = {
    migrated: 0,
    skipped: 0,
    failed: 0
  }

  for (const key of Object.keys(DATA_SCHEMAS)) {
    try {
      const rawData = localStorage.getItem(key)
      if (!rawData) continue

      const data = JSON.parse(rawData)
      
      // Check if migration needed (no version or old version)
      if (!data._version || data._version !== '2.1') {
        // Add version and timestamp if missing
        const migratedData = addTimestamp(data)
        localStorage.setItem(key, JSON.stringify(migratedData))
        migrationCount.migrated++
        console.log(`✅ Migrated ${key} to version 2.1`)
      } else {
        migrationCount.skipped++
      }
    } catch (error) {
      migrationCount.failed++
      console.error(`❌ Migration failed for ${key}:`, error)
    }
  }

  console.log(`🔄 Migration complete:`, migrationCount)
  return migrationCount
}

// Auto-run migration on import (safe, only runs if needed)
if (typeof window !== 'undefined') {
  migrateTriangleData()
}