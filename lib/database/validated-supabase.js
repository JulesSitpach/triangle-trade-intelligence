/**
 * Validated Supabase Wrapper
 *
 * Wraps Supabase queries to validate column/table names before execution.
 * This catches schema mismatches immediately instead of silently failing.
 *
 * Usage:
 *   const { createValidatedClient } = require('./lib/database/validated-supabase');
 *   const supabase = createValidatedClient(supabaseUrl, supabaseKey);
 *
 *   // This will throw an error if 'workflow_data' doesn't exist in 'workflow_sessions'
 *   const { data } = await supabase.from('workflow_sessions').select('workflow_data');
 *
 * Benefits:
 *   - Immediate, descriptive errors instead of silent failures
 *   - Catches typos in column/table names at runtime
 *   - Helps prevent data loss from querying wrong columns
 */

const { createClient } = require('@supabase/supabase-js');
const {
  validateTable,
  validateSelectColumns,
  validateUpdateColumns,
  validateColumn,
  validateJsonbField,
  TABLES
} = require('./schema');

/**
 * Create a validated Supabase client
 *
 * @param {string} supabaseUrl - Supabase project URL
 * @param {string} supabaseKey - Supabase API key
 * @param {object} options - Optional Supabase client options
 * @param {boolean} options.skipValidation - Skip validation (useful for debugging)
 * @returns {object} Validated Supabase client
 */
function createValidatedClient(supabaseUrl, supabaseKey, options = {}) {
  const baseClient = createClient(supabaseUrl, supabaseKey, options);
  const skipValidation = options.skipValidation || false;

  // Wrap the from() method to intercept table name and validate queries
  const originalFrom = baseClient.from.bind(baseClient);

  baseClient.from = function(tableName) {
    // Validate table exists
    if (!skipValidation) {
      const tableValidation = validateTable(tableName);
      if (!tableValidation.valid) {
        throw new Error(`[SCHEMA VALIDATION] ${tableValidation.error}`);
      }
    }

    // Get the base query builder
    const queryBuilder = originalFrom(tableName);

    // Wrap select() method with automatic JSONB validation
    const originalSelect = queryBuilder.select.bind(queryBuilder);
    queryBuilder.select = function(columns = '*') {
      if (!skipValidation && columns !== '*') {
        const validation = validateSelectColumns(tableName, columns);
        if (!validation.valid) {
          throw new Error(`[SCHEMA VALIDATION] SELECT query on "${tableName}":\n${validation.error}`);
        }
      }

      // Execute the original select
      const selectPromise = originalSelect(columns);

      // Wrap the promise to intercept and validate JSONB data
      const wrappedPromise = selectPromise.then(result => {
        if (!result || !result.data || skipValidation) {
          return result;
        }

        // Get table schema to find JSONB columns
        const tableSchema = TABLES[tableName];
        if (!tableSchema || !tableSchema.jsonbColumns) {
          return result;
        }

        // Wrap JSONB columns in the returned data
        const wrappedData = Array.isArray(result.data) ? result.data : [result.data];
        const processedData = wrappedData.map(row => {
          if (!row || typeof row !== 'object') return row;

          const wrappedRow = { ...row };
          for (const jsonbColumn of tableSchema.jsonbColumns) {
            if (wrappedRow[jsonbColumn] !== undefined) {
              wrappedRow[jsonbColumn] = wrapJsonbData(
                wrappedRow[jsonbColumn],
                tableName,
                jsonbColumn,
                skipValidation
              );
            }
          }
          return wrappedRow;
        });

        // Return original structure (single object or array)
        return {
          ...result,
          data: Array.isArray(result.data) ? processedData : processedData[0]
        };
      });

      // Preserve the original query builder methods
      Object.setPrototypeOf(wrappedPromise, Object.getPrototypeOf(selectPromise));
      return wrappedPromise;
    };

    // Wrap update() method
    const originalUpdate = queryBuilder.update.bind(queryBuilder);
    queryBuilder.update = function(updateObject) {
      if (!skipValidation) {
        const validation = validateUpdateColumns(tableName, updateObject);
        if (!validation.valid) {
          throw new Error(`[SCHEMA VALIDATION] UPDATE query on "${tableName}":\n${validation.error}`);
        }
      }
      return originalUpdate(updateObject);
    };

    // Wrap insert() method
    const originalInsert = queryBuilder.insert.bind(queryBuilder);
    queryBuilder.insert = function(insertObject) {
      if (!skipValidation) {
        const validation = validateUpdateColumns(tableName, insertObject);
        if (!validation.valid) {
          throw new Error(`[SCHEMA VALIDATION] INSERT query on "${tableName}":\n${validation.error}`);
        }
      }
      return originalInsert(insertObject);
    };

    // Wrap eq() method to validate column names
    const originalEq = queryBuilder.eq.bind(queryBuilder);
    queryBuilder.eq = function(column, value) {
      if (!skipValidation) {
        const validation = validateColumn(tableName, column);
        if (!validation.valid) {
          throw new Error(`[SCHEMA VALIDATION] WHERE clause on "${tableName}":\n${validation.error}`);
        }
      }
      return originalEq(column, value);
    };

    // Wrap not() method
    const originalNot = queryBuilder.not ? queryBuilder.not.bind(queryBuilder) : null;
    if (originalNot) {
      queryBuilder.not = function(column, operator, value) {
        if (!skipValidation) {
          const validation = validateColumn(tableName, column);
          if (!validation.valid) {
            throw new Error(`[SCHEMA VALIDATION] NOT clause on "${tableName}":\n${validation.error}`);
          }
        }
        return originalNot(column, operator, value);
      };
    }

    return queryBuilder;
  };

  return baseClient;
}

/**
 * Wrap JSONB data with validation proxy
 *
 * Intercepts property access to validate field names against schema.
 * Throws descriptive errors for wrong field names.
 *
 * @param {any} data - JSONB data (object or array)
 * @param {string} tableName - Table containing the JSONB column
 * @param {string} columnName - JSONB column name
 * @param {boolean} skipValidation - Skip validation
 * @returns {any} Proxied data with field validation
 */
function wrapJsonbData(data, tableName, columnName, skipValidation = false) {
  if (skipValidation || !data || typeof data !== 'object') {
    return data;
  }

  // Handle arrays (like component_origins)
  if (Array.isArray(data)) {
    return data.map(item => wrapJsonbData(item, tableName, columnName, skipValidation));
  }

  // Check if this JSONB column has defined structure
  const tableSchema = TABLES[tableName];
  const jsonbStructure = tableSchema?.jsonbStructures?.[columnName];

  if (!jsonbStructure) {
    // No structure defined, return unwrapped
    return data;
  }

  // Wrap object with validation proxy
  return new Proxy(data, {
    get(target, property) {
      // Allow special properties
      if (property === 'toJSON' || property === 'toString' || property === 'valueOf' ||
          property === Symbol.iterator || property === Symbol.toStringTag ||
          typeof property === 'symbol') {
        return target[property];
      }

      // Validate property access
      const validation = validateJsonbField(tableName, columnName, String(property));
      if (!validation.valid) {
        console.warn(`[SCHEMA VALIDATION] JSONB field access on "${tableName}.${columnName}":\n${validation.error}`);
        // Return undefined instead of throwing to avoid breaking existing code
        // TODO: Change to throw error after validating all code paths
        return undefined;
      }

      // Return the actual value
      const value = target[property];

      // If value is an object/array, wrap it too (for nested structures)
      if (value && typeof value === 'object') {
        return wrapJsonbData(value, tableName, columnName, skipValidation);
      }

      return value;
    }
  });
}

/**
 * Helper: Validate a query before execution (for manual validation)
 *
 * @param {string} tableName - Table name
 * @param {string} operation - 'select', 'update', 'insert', 'eq'
 * @param {any} params - Query parameters
 * @returns {object} { valid: boolean, error?: string }
 */
function validateQuery(tableName, operation, params) {
  const tableValidation = validateTable(tableName);
  if (!tableValidation.valid) {
    return tableValidation;
  }

  switch (operation) {
    case 'select':
      return validateSelectColumns(tableName, params);
    case 'update':
    case 'insert':
      return validateUpdateColumns(tableName, params);
    case 'eq':
    case 'not':
      return validateColumn(tableName, params);
    default:
      return { valid: true };
  }
}

module.exports = {
  createValidatedClient,
  validateQuery,
  wrapJsonbData
};
