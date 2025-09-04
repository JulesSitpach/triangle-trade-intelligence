/**
 * TRIANGLE INTELLIGENCE DATABASE SCHEMA
 * VERIFIED SCHEMA FROM ACTUAL SUPABASE DATABASE - 2025-08-28
 * 
 * This file documents the ACTUAL database structure to prevent schema mismatches.
 * Generated from database inspection: node inspect-supabase.js
 */

/**
 * VERIFIED DATABASE TABLES AND COLUMNS
 * Based on actual Supabase inspection results
 */
export const DATABASE_SCHEMA = {
  // ❌ DEPRECATED TABLES - Use hs_master_rebuild instead
  // comtrade_reference: 5,751 rows (REPLACED)
  // tariff_rates: 14,486 rows (REPLACED) 
  // NEW: hs_master_rebuild: 34,476 rows (US + Canada + Mexico comprehensive data)

  // ✅ VERIFIED: 10 rows
  usmca_qualification_rules: {
    tableName: 'usmca_qualification_rules',
    rowCount: 10,
    columns: [
      'id',                              // UUID primary key
      'hs_code',                        // Specific HS code (nullable)
      'hs_chapter',                     // HS chapter (nullable)
      'product_category',               // Product category (7 unique values)
      'rule_type',                      // Type of rule
      'regional_content_threshold',     // Regional content percentage
      'tariff_shift_rule',             // Tariff shift requirements
      'specific_process_requirements',  // Specific processing requirements
      'required_documentation',        // Required documents array
      'is_default',                    // Boolean - is default rule
      'created_at',                    // Creation timestamp
      'updated_at'                     // Update timestamp
    ],
    indexes: {
      primary: 'id',
      searchable: ['product_category', 'hs_chapter']
    },
    businessLogic: {
      businessTypes: 'Select distinct product_category',
      defaultRules: 'Filter by is_default = true',
      categoryRules: 'Match by product_category or hs_chapter'
    },
    verifiedData: {
      productCategories: [
        'Electronics & Technology',
        'Automotive', 
        'Machinery & Equipment',
        'Textiles & Apparel',
        'Agriculture & Food',
        'General',
        'Energy Equipment'
      ]
    }
  },

  // ✅ VERIFIED: 12 rows
  triangle_routing_opportunities: {
    tableName: 'triangle_routing_opportunities', 
    rowCount: 12,
    columns: [
      'id',                              // UUID primary key
      'hs_code',                        // HS code
      'product_description',            // Product description
      'us_origin_rate',                 // US origin rate
      'canada_route_rate',              // Canada route rate
      'mexico_route_rate',              // Mexico route rate
      'optimal_route',                  // Optimal routing option
      'max_savings_percentage',         // Maximum savings percentage
      'max_savings_amount',             // Maximum savings amount
      'canada_route_feasible',          // Boolean - Canada feasible
      'mexico_route_feasible',          // Boolean - Mexico feasible
      'route_complexity_score',         // Complexity score
      'additional_processing_required',  // Additional processing needed
      'minimum_order_value',            // Minimum order value
      'lead_time_impact_days',          // Lead time impact
      'recommended_for_volume',         // Recommended volume
      'risk_level',                     // Risk assessment
      'implementation_complexity',       // Implementation complexity
      'usage_count',                    // Usage statistics
      'success_rate',                   // Success rate
      'last_accessed',                  // Last access timestamp
      'created_at',                     // Creation timestamp
      'updated_at',                     // Update timestamp
      'origin_country',                 // Origin country
      'transit_country',                // Transit country
      'destination_country',            // Destination country
      'hs_codes_applicable',            // Applicable HS codes
      'avg_implementation_time',        // Average implementation time
      'regional_value_content',         // Regional value content
      'qualification_difficulty',       // Qualification difficulty
      'industry_success_stories',       // Success stories
      'compliance_requirements',        // Compliance requirements
      'last_verified'                   // Last verification timestamp
    ],
    indexes: {
      primary: 'id',
      searchable: ['origin_country', 'hs_code']
    },
    businessLogic: {
      routingOptions: 'Group by origin_country, transit_country',
      savingsCalculations: 'Use max_savings_percentage and max_savings_amount',
      feasibilityCheck: 'Check canada_route_feasible OR mexico_route_feasible'
    }
  },

  // ✅ VERIFIED: 39 rows
  countries: {
    tableName: 'countries',
    rowCount: 39,
    columns: [
      'code',           // Country code (2-letter ISO)
      'name',           // Country name
      'region',         // Geographic region
      'trade_agreements', // Trade agreements (array/JSON)
      'risk_factors',   // Risk factors
      'created_at'      // Creation timestamp
    ],
    indexes: {
      primary: 'code',
      searchable: ['name', 'region']
    },
    businessLogic: {
      usmcaMembers: 'code IN (\'US\', \'CA\', \'MX\') OR trade_agreements CONTAINS \'USMCA\'',
      allCountries: 'ORDER BY name ASC',
      regionGroups: 'GROUP BY region'
    },
    verifiedData: {
      usmcaCountries: ['US', 'CA', 'MX'],
      totalCount: 39,
      hasTradeAgreements: true
    }
  },

  // ✅ VERIFIED: 6 rows  
  trade_volume_mappings: {
    tableName: 'trade_volume_mappings',
    rowCount: 6,
    columns: [
      'id',              // Primary key
      'volume_range',    // Volume range string (e.g., "Under $100K")
      'numeric_value',   // Numeric value for calculations
      'display_order',   // Display order
      'created_at'       // Creation timestamp
    ],
    indexes: {
      primary: 'id',
      ordering: 'display_order'
    },
    businessLogic: {
      dropdownOptions: 'ORDER BY display_order ASC',
      numericCalculations: 'Use numeric_value for calculations'
    },
    verifiedData: {
      ranges: [
        'Under $100K',
        '$100K - $500K', 
        '$500K - $1M',
        '$1M - $5M',
        '$5M - $10M',
        '$10M+'
      ]
    }
  },

  // ✅ VERIFIED: 0 rows (empty table)
  hs_codes: {
    tableName: 'hs_codes',
    rowCount: 0,
    columns: [], // Empty table - use comtrade_reference instead
    status: 'EMPTY - Use comtrade_reference for HS code data'
  },

  // ❌ DOES NOT EXIST
  classification_logs: {
    tableName: 'classification_logs',
    status: 'DOES_NOT_EXIST',
    note: 'Table does not exist in database'
  }
};

/**
 * COLUMN MAPPING - Maps expected columns to actual columns
 * Use this to fix queries that assume wrong column names
 */
export const COLUMN_MAPPINGS = {
  countries: {
    // WRONG → RIGHT
    'usmca_member': 'trade_agreements', // Check if contains 'USMCA'
    'country_code': 'code',
    'country_name': 'name'
  },
  
  // DEPRECATED: comtrade_reference table - use hs_master_rebuild instead
  // Original: 5,751 rows - now integrated into comprehensive dataset

  trade_volume_mappings: {
    // WRONG → RIGHT
    'min_value': 'numeric_value', // Use numeric_value instead
    'max_value': 'numeric_value', // Single numeric value, not range
    'label': 'volume_range',
    'order': 'display_order'
  }
};

/**
 * SAFE QUERY PATTERNS
 * Use these verified patterns to avoid schema errors
 */
export const SAFE_QUERIES = {
  // Get all countries with USMCA status
  getAllCountries: `
    SELECT 
      code,
      name,
      region,
      CASE 
        WHEN code IN ('US', 'CA', 'MX') THEN true
        WHEN trade_agreements::text LIKE '%USMCA%' THEN true  
        ELSE false
      END as usmca_member
    FROM countries 
    ORDER BY name
  `,

  // Get HS chapters from comtrade_reference
  getHSChapters: `
    SELECT 
      DISTINCT SUBSTRING(hs_code, 1, 2) as chapter,
      COUNT(*) as product_count
    FROM comtrade_reference 
    WHERE hs_code IS NOT NULL 
      AND LENGTH(hs_code) >= 2
    GROUP BY SUBSTRING(hs_code, 1, 2)
    ORDER BY chapter
  `,

  // Get business types from qualification rules
  getBusinessTypes: `
    SELECT DISTINCT product_category
    FROM usmca_qualification_rules
    WHERE product_category IS NOT NULL
    ORDER BY product_category
  `,

  // Get trade volume ranges
  getTradeVolumeRanges: `
    SELECT 
      volume_range,
      numeric_value,
      display_order
    FROM trade_volume_mappings
    ORDER BY display_order
  `,

  // Get product categories with counts
  getProductCategories: `
    SELECT 
      product_category,
      COUNT(*) as product_count
    FROM comtrade_reference
    WHERE product_category IS NOT NULL
    GROUP BY product_category
    ORDER BY product_count DESC
  `
};

/**
 * SCHEMA VALIDATION FUNCTIONS
 */
export class SchemaValidator {
  
  static validateTableExists(tableName) {
    const schema = DATABASE_SCHEMA[tableName];
    if (!schema) {
      throw new Error(`Table ${tableName} not documented in schema`);
    }
    if (schema.status === 'DOES_NOT_EXIST') {
      throw new Error(`Table ${tableName} does not exist in database`);
    }
    if (schema.status === 'EMPTY') {
      console.warn(`Warning: Table ${tableName} is empty - ${schema.note}`);
    }
    return schema;
  }

  static validateColumn(tableName, columnName) {
    const schema = this.validateTableExists(tableName);
    if (!schema.columns.includes(columnName)) {
      // Check if there's a mapping
      const mapping = COLUMN_MAPPINGS[tableName]?.[columnName];
      if (mapping) {
        console.warn(`Column ${tableName}.${columnName} mapped to ${mapping}`);
        return mapping;
      }
      throw new Error(
        `Column ${tableName}.${columnName} does not exist. ` +
        `Available columns: ${schema.columns.join(', ')}`
      );
    }
    return columnName;
  }

  static getTableRowCount(tableName) {
    const schema = this.validateTableExists(tableName);
    return schema.rowCount || 0;
  }

  static getVerifiedData(tableName, dataKey) {
    const schema = this.validateTableExists(tableName);
    return schema.verifiedData?.[dataKey];
  }
}

/**
 * CONFIGURATION FOR SYSTEM CONFIG
 * Use these verified table names in system configuration
 */
export const VERIFIED_TABLE_CONFIG = {
  // Core tables - UPDATED to use comprehensive dataset
  comtradeReference: 'hs_master_rebuild',      // 34,476 records - COMPREHENSIVE GOVERNMENT DATA
  tariffRates: 'hs_master_rebuild',            // 34,476 records - UNIFIED TARIFF DATA  
  usmcaRules: 'usmca_qualification_rules',     // 10 rows
  triangleRouting: 'triangle_routing_opportunities', // 12 rows
  countries: 'countries',                      // 39 rows
  tradeVolumeMappings: 'trade_volume_mappings', // 6 rows
  
  // Legacy tables - REPLACED by hs_master_rebuild
  // OLD: comtrade_reference: 5,751 rows
  // OLD: tariff_rates: 14,486 rows
  // NEW: hs_master_rebuild: 34,476 rows (US: 10,272 + CA: 12,855 + MX: 11,349)
};

const databaseSchemaExports = {
  DATABASE_SCHEMA,
  COLUMN_MAPPINGS,
  SAFE_QUERIES,
  SchemaValidator,
  VERIFIED_TABLE_CONFIG
};

export default databaseSchemaExports;