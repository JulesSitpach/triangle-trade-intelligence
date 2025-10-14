/**
 * TABLE CONSTANTS - Standalone Configuration
 * Breaking circular import dependency between system-config.js and database-schema.js
 * 
 * This file contains only table name constants to avoid circular dependencies
 */

export const VERIFIED_TABLE_CONFIG = {
  tariffIntelligence: 'tariff_intelligence_master',  // NEW: Consolidated master table
  comtradeReference: 'tariff_intelligence_master',   // Consolidated into master
  tariffRates: 'tariff_intelligence_master',         // Consolidated into master
  usmcaRules: 'usmca_qualification_rules',
  triangleRouting: 'triangle_routing_opportunities',
  countries: 'countries',
  tradeVolumeMappings: 'trade_volume_mappings'
};

export const TABLE_CONFIG = VERIFIED_TABLE_CONFIG;