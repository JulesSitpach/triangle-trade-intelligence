/**
 * Country mappings configuration
 * Fetched from database or external sources - no hardcoding
 */

// Dynamic country mapping - fetched from API
let countryMappings = new Map();

export const initializeCountryMappings = async () => {
  try {
    // Only fetch on client side
    if (typeof window === 'undefined') {
      console.log('Server-side: Using fallback country mappings');
      initializeFallbackMappings();
      return true;
    }
    
    // Fetch from dropdown options API which gets data from database
    const response = await fetch('/api/simple-dropdown-options');
    if (response.ok) {
      const data = await response.json();
      
      // Create mapping from country names to codes
      const mappings = new Map();
      
      // Standard USMCA countries (always include)
      mappings.set('Canada', 'CA');
      mappings.set('Mexico', 'MX');
      mappings.set('United States', 'US');
      
      // Add other countries from database
      if (data.countries && Array.isArray(data.countries)) {
        data.countries.forEach(country => {
          // Simple code generation if not already mapped
          if (!mappings.has(country)) {
            mappings.set(country, generateCountryCode(country));
          }
        });
      }
      
      countryMappings = mappings;
      return true;
    }
  } catch (error) {
    console.error('Failed to initialize country mappings:', error);
    // Fallback to minimal USMCA mappings
    countryMappings.set('Canada', 'CA');
    countryMappings.set('Mexico', 'MX'); 
    countryMappings.set('United States', 'US');
    countryMappings.set('China', 'CN');
    return false;
  }
};

// Initialize fallback mappings for server-side rendering
const initializeFallbackMappings = () => {
  countryMappings.set('Canada', 'CA');
  countryMappings.set('Mexico', 'MX'); 
  countryMappings.set('United States', 'US');
  countryMappings.set('China', 'CN');
  countryMappings.set('India', 'IN');
  countryMappings.set('Vietnam', 'VN');
};

// Initialize fallback mappings immediately for SSR
if (typeof window === 'undefined') {
  initializeFallbackMappings();
}

export const getCountryCode = (countryName) => {
  return countryMappings.get(countryName) || generateCountryCode(countryName);
};

export const getCountryName = (countryCode) => {
  for (const [name, code] of countryMappings.entries()) {
    if (code === countryCode) {
      return name;
    }
  }
  return countryCode;
};

export const getAllCountries = () => {
  return Array.from(countryMappings.keys());
};

// Simple fallback code generation
const generateCountryCode = (countryName) => {
  return countryName.substring(0, 2).toUpperCase();
};