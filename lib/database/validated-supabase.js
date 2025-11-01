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
  validateColumn
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

    // Wrap select() method
    const originalSelect = queryBuilder.select.bind(queryBuilder);
    queryBuilder.select = function(columns = '*') {
      if (!skipValidation && columns !== '*') {
        const validation = validateSelectColumns(tableName, columns);
        if (!validation.valid) {
          throw new Error(`[SCHEMA VALIDATION] SELECT query on "${tableName}":\n${validation.error}`);
        }
      }
      return originalSelect(columns);
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
  validateQuery
};
