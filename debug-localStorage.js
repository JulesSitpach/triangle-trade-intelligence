// Run this in the browser console to debug localStorage data
console.log('=== DEBUGGING LOCALSTORAGE FOR ALERTS ===');

// Check all localStorage keys
console.log('All localStorage keys:', Object.keys(localStorage));

// Check the main workflow results
const workflowResults = localStorage.getItem('usmca_workflow_results');
if (workflowResults) {
  console.log('📦 Raw usmca_workflow_results:', workflowResults.substring(0, 500) + '...');
  
  try {
    const parsed = JSON.parse(workflowResults);
    console.log('📊 Parsed structure:', {
      keys: Object.keys(parsed),
      company: parsed.company ? Object.keys(parsed.company) : 'none',
      product: parsed.product ? Object.keys(parsed.product) : 'none', 
      hasTradeVolume: !!parsed.company?.trade_volume,
      hasHSCode: !!parsed.product?.hs_code
    });
    
    // Test the exact parsing logic from alerts page
    let tradeVolume = 0;
    if (parsed.company?.trade_volume) {
      tradeVolume = parseFloat(parsed.company.trade_volume.toString().replace(/[,$]/g, ''));
    } else if (parsed.trade_volume) {
      tradeVolume = parseFloat(parsed.trade_volume.toString().replace(/[,$]/g, ''));
    }
    
    const profile = {
      companyName: parsed.company?.company_name || parsed.company?.name || parsed.company_name,
      tradeVolume: tradeVolume,
      businessType: parsed.company?.business_type || parsed.business_type,
      hsCode: parsed.product?.hs_code || parsed.hs_code,
      productDescription: parsed.product?.description || parsed.product_description,
      originCountry: parsed.component_origins?.[0]?.origin_country || parsed.supplier_country || 'CN'
    };
    
    console.log('🎯 Extracted profile for alerts:', profile);
    console.log('Crisis penalty ($):', (profile.tradeVolume * 0.25).toLocaleString());
    console.log('USMCA savings ($):', (profile.tradeVolume * 0.2).toLocaleString());
    
  } catch (error) {
    console.error('❌ Failed to parse localStorage data:', error);
  }
} else {
  console.log('❌ No usmca_workflow_results found in localStorage');
}

// Also check the certificate data
const certificateData = localStorage.getItem('usmca_workflow_data');
if (certificateData) {
  console.log('📋 Certificate data found:', certificateData.substring(0, 200) + '...');
}

// Generate fresh test data
console.log('\n=== GENERATING FRESH TEST DATA ===');
const testData = {
  company: {
    company_name: "Test Mango Corp",
    name: "Test Mango Corp", 
    business_type: "Food Manufacturing",
    trade_volume: 4800000,
    supplier_country: "MX"
  },
  product: {
    hs_code: "081190",
    description: "Frozen mango chunks for food service"
  },
  savings: {
    annual_savings: 960000,
    mfn_rate: 20,
    usmca_rate: 0
  },
  trust: {
    score: 99
  },
  component_origins: [
    { origin_country: "MX", value_percentage: 85 },
    { origin_country: "US", value_percentage: 15 }
  ]
};

localStorage.setItem('usmca_workflow_results', JSON.stringify(testData));
console.log('✅ Fresh test data saved to localStorage');
console.log('🔄 Now refresh the alerts page to see the changes');