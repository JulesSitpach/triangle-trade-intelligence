/**
 * TABLE CONSTANTS - Standalone Configuration
 * Breaking circular import dependency between system-config.js and database-schema.js
 * 
 * This file contains only table name constants to avoid circular dependencies
 */

export const VERIFIED_TABLE_CONFIG = {
  comtradeReference: 'hs_master_rebuild',
  tariffRates: 'hs_master_rebuild', 
  usmcaRules: 'usmca_qualification_rules',
  triangleRouting: 'triangle_routing_opportunities',
  countries: 'countries',
  tradeVolumeMappings: 'trade_volume_mappings'
};

export const TABLE_CONFIG = VERIFIED_TABLE_CONFIG;