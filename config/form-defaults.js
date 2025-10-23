/**
 * Dynamic form defaults configuration
 * Values determined by business logic, not hardcoded
 */

export const getFormDefaults = async () => {
  // ✅ NO DEFAULTS: Don't assume supplier country or manufacturing location
  // Users MUST explicitly select these values - supply chain assumptions destroy data accuracy
  // Every user has different sourcing strategy; defaulting to CN→MX forces wrong calculations

  return {
    // ✅ REQUIRED FIELDS - User must explicitly select
    supplier_country: null,  // User must select actual supplier country
    manufacturing_location: null,  // User must select actual manufacturing location
    component_origins: [],  // User must specify actual component origins

    // ✅ These fields have no defaults - user entry is required
    hs_code: null,
    product_description: '',
    company_country: null,
    destination_country: null
  };
};

// ✅ REMOVED: Fallback defaults function
// No more CN→MX assumptions for every user
// Users must explicitly provide their actual supply chain data

export const getDefaultTradeVolume = async (businessType = '') => {
  // Use centralized business type metadata for volume defaults
  try {
    const { getBusinessTypeDefaultVolume } = await import('./business-type-metadata.js');
    const defaultVolume = await getBusinessTypeDefaultVolume(businessType);
    console.log(`💰 Trade volume default: ${businessType} → ${defaultVolume} (database-driven)`);
    return defaultVolume;
  } catch (error) {
    console.warn(`⚠️ Volume defaults service unavailable: ${error.message}`);
    console.log(`💰 Using industry standards fallback for volume: ${businessType}`);
    
    // Transparent fallback based on industry standards and typical trade volumes
    const industryVolumeStandards = {
      'Electronics': '$1M - $5M',        // High-volume, competitive margins
      'Automotive': '$5M - $25M',        // Large parts orders, OEM relationships
      'Medical': '$500K - $2M',          // Specialty products, smaller volumes
      'Manufacturing': '$1M - $5M',      // Standard industrial volumes
      'Textiles': '$500K - $2M',         // Seasonal, batch production
      'Food': '$500K - $2M',             // Perishable, regular shipments  
      'Chemicals': '$1M - $5M',          // Bulk commodities
      'Construction': '$1M - $5M',       // Project-based, bulk materials
      'Energy': '$2M - $10M',            // Large infrastructure projects
      'Other': 'Under $500K'             // Conservative default
    };
    
    return industryVolumeStandards[businessType] || 'Under $500K';
  }
};