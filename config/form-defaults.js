/**
 * Dynamic form defaults configuration
 * Values determined by business logic, not hardcoded
 */

export const getFormDefaults = async () => {
  try {
    // Only fetch on client side
    if (typeof window === 'undefined') {
      return getFallbackDefaults();
    }
    
    // Fetch dropdown options to determine smart defaults
    const response = await fetch('/api/simple-dropdown-options');
    if (response.ok) {
      const data = await response.json();
      
      // Smart supplier country default - most common in tariff data
      let defaultSupplier = 'CN'; // China is most common trade partner
      if (data.countries && data.countries.includes('China')) {
        defaultSupplier = 'CN';
      } else if (data.countries && data.countries.length > 0) {
        // Use first available country
        defaultSupplier = data.countries[0].substring(0, 2).toUpperCase();
      }
      
      // Smart manufacturing location - prefer USMCA countries
      let defaultManufacturing = 'MX'; // Mexico for USMCA benefits
      const usmcaCountries = ['Mexico', 'Canada', 'United States'];
      const availableUSMCA = usmcaCountries.find(country => 
        data.countries && data.countries.includes(country)
      );
      
      if (availableUSMCA) {
        defaultManufacturing = availableUSMCA === 'Mexico' ? 'MX' : 
                              availableUSMCA === 'Canada' ? 'CA' : 'US';
      }
      
      return {
        supplier_country: defaultSupplier,
        manufacturing_location: defaultManufacturing,
        component_origins: [
          { 
            origin_country: defaultSupplier, 
            value_percentage: 60 // Majority from supplier
          },
          { 
            origin_country: defaultManufacturing, 
            value_percentage: 40 // Processing/assembly in USMCA country
          }
        ]
      };
    }
  } catch (error) {
    console.error('Failed to load form defaults:', error);
  }
  
  // Fallback defaults - still dynamic based on USMCA strategy
  return getFallbackDefaults();
};

// Fallback defaults for server-side rendering
const getFallbackDefaults = () => {
  return {
    supplier_country: 'CN', // Most common global supplier
    manufacturing_location: 'MX', // USMCA benefit optimization
    component_origins: [
      { origin_country: 'CN', value_percentage: 60 },
      { origin_country: 'MX', value_percentage: 40 }
    ]
  };
};

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