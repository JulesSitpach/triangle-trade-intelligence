/**
 * Test regional content calculation logic directly
 */

// Simple test without imports to isolate the calculation logic
function calculateRegionalContent(componentOrigins, manufacturingLocation) {
  if (!componentOrigins || !Array.isArray(componentOrigins) || componentOrigins.length === 0) {
    return {
      percentage: 0,
      breakdown: { northAmerican: 0, nonNorthAmerican: 100 },
      qualified_countries: [],
      non_qualified_countries: []
    };
  }

  const usmcaCountries = ['US', 'CA', 'MX', 'USA', 'CAN', 'MEX'];
  let totalValue = 0;
  let northAmericanValue = 0;
  const qualifiedCountries = [];
  const nonQualifiedCountries = [];

  console.log('🔍 Processing components:');
  
  // Calculate from component origins
  componentOrigins.forEach(component => {
    const value = parseFloat(component.value_percentage || component.percentage || 0);
    const country = (component.origin_country || component.country || '').toUpperCase();
    
    console.log(`  - ${component.description}: ${country} = ${value}%`);
    
    totalValue += value;
    
    if (usmcaCountries.includes(country)) {
      northAmericanValue += value;
      qualifiedCountries.push({ country, value });
      console.log(`    ✅ USMCA country: +${value}%`);
    } else {
      nonQualifiedCountries.push({ country, value });
      console.log(`    ❌ Non-USMCA: ${value}%`);
    }
  });

  // Manufacturing location adds value (typically 10-15% for assembly)
  if (manufacturingLocation && usmcaCountries.includes(manufacturingLocation.toUpperCase())) {
    const manufacturingValue = Math.min(15, 100 - totalValue); // Cap at available percentage
    northAmericanValue += manufacturingValue;
    totalValue += manufacturingValue;
    qualifiedCountries.push({ country: manufacturingLocation.toUpperCase(), value: manufacturingValue, type: 'manufacturing' });
    console.log(`  - Manufacturing in ${manufacturingLocation}: +${manufacturingValue}%`);
  }

  const percentage = totalValue > 0 ? (northAmericanValue / totalValue) * 100 : 0;
  
  console.log(`\n📊 Calculation:`);
  console.log(`Total North American: ${northAmericanValue}%`);
  console.log(`Total Components: ${totalValue}%`);
  console.log(`Regional Content: ${percentage.toFixed(1)}%`);

  return {
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
    breakdown: {
      northAmerican: Math.round(northAmericanValue * 10) / 10,
      nonNorthAmerican: Math.round((totalValue - northAmericanValue) * 10) / 10
    },
    qualified_countries: qualifiedCountries,
    non_qualified_countries: nonQualifiedCountries,
    total_analyzed: totalValue
  };
}

console.log('🧪 Testing Regional Content Calculation\n');

// Test case 1: Mexico components
const testComponents1 = [
  {
    description: 'smartphone components from Mexico',
    origin_country: 'Mexico',
    value_percentage: 75
  },
  {
    description: 'smartphone components from China',
    origin_country: 'China',
    value_percentage: 25
  }
];

console.log('Test 1: 75% Mexico, 25% China, manufactured in Mexico');
const result1 = calculateRegionalContent(testComponents1, 'Mexico');
console.log('Result:', JSON.stringify(result1, null, 2));

console.log('\n' + '='.repeat(60) + '\n');

// Test case 2: 100% China
const testComponents2 = [
  {
    description: 'smartphone components',
    origin_country: 'China',
    value_percentage: 100
  }
];

console.log('Test 2: 100% China, manufactured in China');
const result2 = calculateRegionalContent(testComponents2, 'China');
console.log('Result:', JSON.stringify(result2, null, 2));