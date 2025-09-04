/**
 * DATABASE SCHEMA VALIDATION UTILITY
 * Prevents schema mismatches by validating queries against actual database structure
 * 
 * Usage:
 *   import { validateQuery, safeQuery } from '../lib/database/validate-schema.js';
 *   
 *   // Validate before executing
 *   validateQuery('countries', ['usmca_member']); // Throws error - column doesn't exist
 *   
 *   // Get safe query pattern
 *   const query = safeQuery('getAllCountries'); // Returns verified SQL
 */

import { DATABASE_SCHEMA, COLUMN_MAPPINGS, SAFE_QUERIES, SchemaValidator } from './database-schema.js';
import { logError, logWarning } from '../utils/production-logger.js';

/**
 * Query Validator - Validates database queries against actual schema
 */
export class QueryValidator {
  
  /**
   * Validate a table and columns before executing query
   * Throws descriptive errors for schema mismatches
   */
  static validateQuery(tableName, columns = [], options = {}) {
    try {
      // Validate table exists
      const tableSchema = SchemaValidator.validateTableExists(tableName);
      
      // Validate each column
      const validatedColumns = [];
      const warnings = [];
      
      for (const column of columns) {
        try {
          const validColumn = SchemaValidator.validateColumn(tableName, column);
          validatedColumns.push(validColumn);
          
          // Check if column was mapped
          if (validColumn !== column) {
            warnings.push(`Column ${tableName}.${column} was mapped to ${validColumn}`);
          }
        } catch (error) {
          if (options.strict !== false) {
            throw error;
          }
          // In non-strict mode, log error and continue
          logError('Schema validation failed', {
            table: tableName,
            column: column,
            error: error.message,
            availableColumns: tableSchema.columns
          });
        }
      }
      
      // Log warnings
      warnings.forEach(warning => logWarning(warning));
      
      return {
        valid: true,
        tableName,
        columns: validatedColumns,
        warnings,
        schema: tableSchema
      };
      
    } catch (error) {
      logError('Query validation failed', {
        table: tableName,
        columns,
        error: error.message
      });
      
      if (options.strict !== false) {
        throw error;
      }
      
      return {
        valid: false,
        error: error.message,
        suggestions: this.getSuggestions(tableName, columns)
      };
    }
  }
  
  /**
   * Get suggestions for fixing schema mismatches
   */
  static getSuggestions(tableName) {
    const suggestions = [];
    
    // Suggest alternative tables
    const availableTables = Object.keys(DATABASE_SCHEMA);
    const similarTables = availableTables.filter(table => 
      table.toLowerCase().includes(tableName.toLowerCase()) ||
      tableName.toLowerCase().includes(table.toLowerCase())
    );
    
    if (similarTables.length > 0) {
      suggestions.push(`Similar tables available: ${similarTables.join(', ')}`);
    }
    
    // Suggest column mappings
    if (COLUMN_MAPPINGS[tableName]) {
      const mappings = Object.entries(COLUMN_MAPPINGS[tableName]);
      suggestions.push(`Column mappings available: ${mappings.map(([old, new_]) => `${old} → ${new_}`).join(', ')}`);
    }
    
    // Suggest safe queries
    const availableQueries = Object.keys(SAFE_QUERIES);
    const relevantQueries = availableQueries.filter(query =>
      query.toLowerCase().includes(tableName.toLowerCase())
    );
    
    if (relevantQueries.length > 0) {
      suggestions.push(`Safe query patterns available: ${relevantQueries.join(', ')}`);
    }
    
    return suggestions;
  }
  
  /**
   * Auto-fix common query issues
   */
  static autoFixQuery(tableName, columns, options = {}) {
    const fixes = [];
    let fixedTable = tableName;
    const fixedColumns = [];
    
    // Fix table name if it's a known mapping
    const tableMapping = {
      'classification_logs': 'comtrade_reference', // Use existing table instead
      'hs_codes': 'comtrade_reference'              // Use existing table instead
    };
    
    if (tableMapping[tableName]) {
      fixedTable = tableMapping[tableName];
      fixes.push(`Table ${tableName} → ${fixedTable}`);
    }
    
    // Fix column names using mappings
    for (const column of columns) {
      const mapping = COLUMN_MAPPINGS[fixedTable]?.[column];
      if (mapping) {
        fixedColumns.push(mapping);
        fixes.push(`Column ${column} → ${mapping}`);
      } else if (DATABASE_SCHEMA[fixedTable]?.columns.includes(column)) {
        fixedColumns.push(column);
      } else {
        // Column doesn't exist - suggest alternatives
        const schema = DATABASE_SCHEMA[fixedTable];
        if (schema && schema.columns) {
          const similarColumns = schema.columns.filter(col =>
            col.toLowerCase().includes(column.toLowerCase()) ||
            column.toLowerCase().includes(col.toLowerCase())
          );
          
          if (similarColumns.length > 0) {
            fixedColumns.push(similarColumns[0]);
            fixes.push(`Column ${column} → ${similarColumns[0]} (best match)`);
          } else if (options.dropInvalidColumns) {
            fixes.push(`Column ${column} dropped (not found)`);
          } else {
            fixes.push(`Column ${column} - NO MATCH FOUND`);
            fixedColumns.push(column); // Keep it to let query fail with descriptive error
          }
        }
      }
    }
    
    return {
      originalTable: tableName,
      originalColumns: columns,
      fixedTable,
      fixedColumns,
      fixes,
      autoFixed: fixes.length > 0
    };
  }
}

/**
 * Safe query executor - Uses pre-validated query patterns
 */
export class SafeQueryExecutor {
  
  /**
   * Get a safe, pre-validated query pattern
   */
  static getSafeQuery(queryName) {
    const query = SAFE_QUERIES[queryName];
    if (!query) {
      const available = Object.keys(SAFE_QUERIES).join(', ');
      throw new Error(`Safe query '${queryName}' not found. Available queries: ${available}`);
    }
    return query.trim();
  }
  
  /**
   * Execute a safe query with optional parameters
   */
  static async executeSafeQuery(client, queryName, params = {}) {
    const query = this.getSafeQuery(queryName);
    
    // Simple parameter substitution for safety
    let finalQuery = query;
    for (const [key, value] of Object.entries(params)) {
      const placeholder = `$${key}`;
      if (query.includes(placeholder)) {
        // Sanitize parameter value
        const sanitizedValue = this.sanitizeParameter(value);
        finalQuery = finalQuery.replace(new RegExp(`\\$${key}`, 'g'), sanitizedValue);
      }
    }
    
    try {
      const { data, error } = await client.rpc('exec_sql', { query: finalQuery });
      if (error) throw error;
      return data;
    } catch (error) {
      logError('Safe query execution failed', {
        queryName,
        query: finalQuery,
        params,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Sanitize parameters to prevent SQL injection
   */
  static sanitizeParameter(value) {
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }
    if (value === null || value === undefined) {
      return 'NULL';
    }
    throw new Error(`Unsupported parameter type: ${typeof value}`);
  }
}

/**
 * Schema-aware Supabase client wrapper
 */
export class SchemaAwareClient {
  
  constructor(supabaseClient) {
    this.client = supabaseClient;
  }
  
  /**
   * Schema-validated select query
   */
  select(table, columns = '*', options = {}) {
    if (columns !== '*') {
      const columnList = Array.isArray(columns) ? columns : columns.split(',').map(c => c.trim());
      const validation = QueryValidator.validateQuery(table, columnList, options);
      
      if (!validation.valid && options.autoFix) {
        const fix = QueryValidator.autoFixQuery(table, columnList, options);
        if (fix.autoFixed) {
          logWarning('Query auto-fixed', fix);
          return this.client.from(fix.fixedTable).select(fix.fixedColumns.join(', '));
        }
      }
      
      if (!validation.valid) {
        throw new Error(`Schema validation failed: ${validation.error}`);
      }
      
      return this.client.from(table).select(validation.columns.join(', '));
    }
    
    // Validate table at minimum
    SchemaValidator.validateTableExists(table);
    return this.client.from(table).select(columns);
  }
  
  /**
   * Get row count with schema validation
   */
  async getRowCount(table) {
    SchemaValidator.validateTableExists(table);
    const knownCount = SchemaValidator.getTableRowCount(table);
    
    if (knownCount !== undefined) {
      return knownCount;
    }
    
    // Fallback to actual query
    const { count, error } = await this.client
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count;
  }
  
  /**
   * Execute safe query by name
   */
  async executeSafeQuery(queryName, params = {}) {
    return await SafeQueryExecutor.executeSafeQuery(this.client, queryName, params);
  }
}

/**
 * Convenient validation functions for quick use
 */
export const validateQuery = (table, columns, options) => 
  QueryValidator.validateQuery(table, columns, options);

export const safeQuery = (queryName) => 
  SafeQueryExecutor.getSafeQuery(queryName);

export const createSchemaAwareClient = (supabaseClient) => 
  new SchemaAwareClient(supabaseClient);

/**
 * Development helper - Check if current queries match schema
 */
export const auditQueries = () => {
  
  // This would scan codebase files for database queries and validate them
  // For now, we'll provide a manual audit checklist
  
  const commonIssues = [
    'countries.usmca_member → Use trade_agreements field instead',
    'comtrade_reference.chapter → Extract from hs_code field',
    'trade_volume_mappings.min_value → Use numeric_value field',
    'classification_logs table → Does not exist, use alternative',
    'hs_codes table → Empty table, use comtrade_reference'
  ];
  
  return {
    issues: commonIssues,
    recommendations: [
      'Use SchemaAwareClient wrapper for all database operations',
      'Always validate queries in development using validateQuery()',
      'Use SAFE_QUERIES patterns for complex operations',
      'Check DATABASE_SCHEMA documentation before writing new queries'
    ]
  };
};

const validateSchemaExports = {
  QueryValidator,
  SafeQueryExecutor,
  SchemaAwareClient,
  validateQuery,
  safeQuery,
  createSchemaAwareClient,
  auditQueries
};

export default validateSchemaExports;