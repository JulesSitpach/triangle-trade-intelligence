/**
 * COMPONENT TRANSFORMER - Enforces the Data Contract
 *
 * Uses COMPONENT_DATA_CONTRACT to safely transform data between layers.
 * Every transformation goes through here - eliminates field name mismatches.
 *
 * PROBLEM THIS SOLVES:
 *   - Database sends: { mfn_rate: "25.00" }
 *   - Frontend expects: { mfnRate: 25.0 }
 *   - Without this: Data arrives as undefined in frontend
 *   - With this: Automatic transformation + validation
 */

import COMPONENT_DATA_CONTRACT from './COMPONENT_DATA_CONTRACT.js';

/**
 * Transform a single component from database format to API format
 * Renames fields, converts types, validates
 *
 * @param {Object} dbComponent - Raw database record
 * @returns {Object} API-ready component with all transformations applied
 *
 * @example
 *   const dbRecord = {
 *     description: 'Microprocessor',
 *     mfn_rate: '25.00',      // String from database
 *     origin_country: 'cn',   // Lowercase
 *     value_percentage: '35'  // String number
 *   };
 *
 *   const apiComponent = transformDatabaseToAPI(dbRecord);
 *   // Result:
 *   // {
 *   //   description: 'Microprocessor',
 *   //   mfn_rate: 25,           // Number (not string)
 *   //   origin_country: 'CN',   // Uppercase (normalized)
 *   //   value_percentage: 35    // Number
 *   // }
 */
export function transformDatabaseToAPI(dbComponent) {
  if (!dbComponent || typeof dbComponent !== 'object') {
    throw new Error(`Invalid database component: ${JSON.stringify(dbComponent)}`);
  }

  const apiComponent = {};
  const errors = [];

  // Transform each field in the contract
  Object.entries(COMPONENT_DATA_CONTRACT.fields).forEach(([dbFieldName, fieldDef]) => {
    const dbValue = dbComponent[dbFieldName];

    // Skip fields not present in database record
    if (dbValue === undefined) {
      if (fieldDef.required) {
        errors.push(`Missing required field: ${dbFieldName}`);
      }
      return;
    }

    // Transform value from database format to API format
    try {
      const apiValue = COMPONENT_DATA_CONTRACT.transform(
        dbValue,
        'database',
        'api',
        dbFieldName
      );

      // API uses same field name as database
      apiComponent[dbFieldName] = apiValue;

      // Validate the transformed value
      const validation = COMPONENT_DATA_CONTRACT.validate(dbFieldName, apiValue);
      if (!validation.valid) {
        errors.push(`${dbFieldName}: ${validation.errors.join('; ')}`);
      }
    } catch (error) {
      errors.push(`${dbFieldName}: ${error.message}`);
    }
  });

  if (errors.length > 0) {
    console.error('❌ DATABASE TO API TRANSFORMATION ERRORS:', errors);
    throw new Error(`Transformation failed: ${errors.join('; ')}`);
  }

  return apiComponent;
}

/**
 * Transform a single component from API format to frontend format
 * Renames fields (mfn_rate → mfnRate), converts types for display
 *
 * @param {Object} apiComponent - API response component
 * @returns {Object} Frontend-ready component with camelCase fields
 *
 * @example
 *   const apiComponent = {
 *     mfn_rate: 25,
 *     usmca_rate: 0,
 *     origin_country: 'CN',
 *     value_percentage: 35
 *   };
 *
 *   const frontendComponent = transformAPIToFrontend(apiComponent);
 *   // Result:
 *   // {
 *   //   mfnRate: 25,          // Field renamed + type preserved
 *   //   usmcaRate: 0,
 *   //   originCountry: 'CN',
 *   //   valuePercentage: 35
 *   // }
 */
export function transformAPIToFrontend(apiComponent) {
  if (!apiComponent || typeof apiComponent !== 'object') {
    throw new Error(`Invalid API component: ${JSON.stringify(apiComponent)}`);
  }

  const frontendComponent = {};
  const errors = [];

  Object.entries(COMPONENT_DATA_CONTRACT.fields).forEach(([dbFieldName, fieldDef]) => {
    const apiValue = apiComponent[dbFieldName];

    // Skip missing optional fields
    if (apiValue === undefined) {
      if (fieldDef.required) {
        errors.push(`Missing required field: ${dbFieldName}`);
      }
      return;
    }

    try {
      // Transform to frontend value
      const frontendValue = COMPONENT_DATA_CONTRACT.transform(
        apiValue,
        'api',
        'frontend',
        dbFieldName
      );

      // Use frontend field name (e.g., mfn_rate → mfnRate)
      const frontendFieldName = fieldDef.names.frontend;
      frontendComponent[frontendFieldName] = frontendValue;
    } catch (error) {
      errors.push(`${dbFieldName}: ${error.message}`);
    }
  });

  if (errors.length > 0) {
    console.error('❌ API TO FRONTEND TRANSFORMATION ERRORS:', errors);
    // Don't throw - return what we have, but log the errors
  }

  return frontendComponent;
}

/**
 * Transform AI response component to database format
 * Validates that AI response has all required fields with correct types
 *
 * @param {Object} aiComponent - Component returned by AI analysis
 * @returns {Object} Database-ready component
 *
 * @example
 *   const aiComponent = {
 *     component_name: 'Microprocessor',
 *     base_mfn_rate: 25,
 *     usmca_rate: 0,
 *     section_301_tariff: 25,
 *     // ... more AI fields
 *   };
 *
 *   const dbComponent = transformAIToDatabase(aiComponent);
 */
export function transformAIToDatabase(aiComponent) {
  if (!aiComponent || typeof aiComponent !== 'object') {
    throw new Error(`Invalid AI component: ${JSON.stringify(aiComponent)}`);
  }

  const dbComponent = {};
  const errors = [];

  Object.entries(COMPONENT_DATA_CONTRACT.fields).forEach(([dbFieldName, fieldDef]) => {
    const aiFieldName = fieldDef.names.ai;
    const aiValue = aiComponent[aiFieldName];

    // Skip missing optional fields
    if (aiValue === undefined) {
      if (fieldDef.required) {
        errors.push(`Missing required AI field: ${aiFieldName} (database: ${dbFieldName})`);
      }
      return;
    }

    try {
      // Transform from AI format to database format
      const dbValue = COMPONENT_DATA_CONTRACT.transform(
        aiValue,
        'ai',
        'database',
        dbFieldName
      );

      dbComponent[dbFieldName] = dbValue;

      // Validate
      const validation = COMPONENT_DATA_CONTRACT.validate(dbFieldName, dbValue);
      if (!validation.valid) {
        errors.push(`${dbFieldName}: ${validation.errors.join('; ')}`);
      }
    } catch (error) {
      errors.push(`${dbFieldName}: ${error.message}`);
    }
  });

  if (errors.length > 0) {
    console.error('❌ AI TO DATABASE TRANSFORMATION ERRORS:', errors);
    throw new Error(`AI transformation failed: ${errors.join('; ')}`);
  }

  return dbComponent;
}

/**
 * Validate a component has all required fields with correct types
 * Used before sending API response to catch data flow breaks
 *
 * @param {Object} component - Component to validate (any layer format)
 * @param {string} layer - Which layer this component comes from (api, frontend, database)
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateComponent(component, layer = 'api') {
  if (!component || typeof component !== 'object') {
    return {
      valid: false,
      errors: [`Invalid component object: ${JSON.stringify(component)}`],
    };
  }

  const errors = [];
  const warnings = [];

  Object.entries(COMPONENT_DATA_CONTRACT.fields).forEach(([dbFieldName, fieldDef]) => {
    // Determine the field name for this layer
    const layerFieldName = fieldDef.names[layer] || dbFieldName;
    const value = component[layerFieldName];

    // Check required fields
    if (fieldDef.required) {
      if (value === undefined || value === null || value === '') {
        errors.push(`Missing required field: ${layerFieldName} (${fieldDef.label})`);
      }
    }

    // If field exists, validate it
    if (value !== undefined && value !== null && value !== '') {
      const validation = COMPONENT_DATA_CONTRACT.validate(dbFieldName, value);
      if (!validation.valid) {
        errors.push(`${layerFieldName}: ${validation.errors.join('; ')}`);
      }
    }

    // Warn about suspiciously zero values (common bug)
    if (
      fieldDef.category === 'tariff' &&
      value === 0 &&
      fieldDef.required &&
      layer === 'api'
    ) {
      warnings.push(
        `${layerFieldName} is 0 - verify this is intentional (ITA exemption?) not a data loss bug`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Compare two components and show what changed
 * Useful for debugging data loss between layers
 *
 * @param {Object} before - Component before transformation
 * @param {Object} after - Component after transformation
 * @param {string} description - What transformation was done
 *
 * @example
 *   const before = { mfn_rate: "25.00", origin_country: "cn" };
 *   const after = { mfnRate: 25, originCountry: "CN" };
 *   compareComponents(before, after, "Database → API");
 *   // Output: Shows exactly what changed
 */
export function compareComponents(before, after, description = 'Transformation') {
  console.log(`\n📊 COMPONENT COMPARISON: ${description}`);
  console.log('='.repeat(60));

  const allKeys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);

  let changeCount = 0;

  allKeys.forEach((key) => {
    const beforeValue = before?.[key];
    const afterValue = after?.[key];

    if (beforeValue !== afterValue) {
      changeCount++;
      console.log(`  ${key}:`);
      console.log(`    Before: ${JSON.stringify(beforeValue)} (${typeof beforeValue})`);
      console.log(`    After:  ${JSON.stringify(afterValue)} (${typeof afterValue})`);
    }
  });

  console.log(`\nTotal changes: ${changeCount}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Batch transform multiple components (common when enriching BOM)
 * Returns array with detailed error reporting for each component
 *
 * @param {Array} components - Array of components to transform
 * @param {string} fromLayer - Source layer
 * @param {string} toLayer - Target layer
 * @returns {Object} { success: Array, errors: Array }
 */
export function transformBatch(components, fromLayer, toLayer) {
  const success = [];
  const errors = [];

  if (!Array.isArray(components)) {
    return {
      success: [],
      errors: ['Input must be an array of components'],
    };
  }

  components.forEach((component, index) => {
    try {
      let transformed;

      if (fromLayer === 'database' && toLayer === 'api') {
        transformed = transformDatabaseToAPI(component);
      } else if (fromLayer === 'api' && toLayer === 'frontend') {
        transformed = transformAPIToFrontend(component);
      } else if (fromLayer === 'ai' && toLayer === 'database') {
        transformed = transformAIToDatabase(component);
      } else {
        throw new Error(`Unsupported transformation: ${fromLayer} → ${toLayer}`);
      }

      success.push(transformed);
    } catch (error) {
      errors.push({
        index,
        component: component?.description || `Component ${index}`,
        error: error.message,
      });
    }
  });

  return {
    success,
    errors,
    transformedCount: success.length,
    failedCount: errors.length,
  };
}

export default {
  transformDatabaseToAPI,
  transformAPIToFrontend,
  transformAIToDatabase,
  validateComponent,
  compareComponents,
  transformBatch,
};
