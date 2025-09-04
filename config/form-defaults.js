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

export const getDefaultTradeVolume = (businessType = '') => {
  // Smart defaults based on business type
  const volumeDefaults = {
    'Electronics': '$1M - $5M',
    'Automotive': '$5M - $25M', 
    'Medical': '$500K - $2M',
    'Manufacturing': '$1M - $5M',
    'Textiles': '$500K - $2M',
    'Other': 'Under $500K'
  };
  
  return volumeDefaults[businessType] || 'Under $500K';
};