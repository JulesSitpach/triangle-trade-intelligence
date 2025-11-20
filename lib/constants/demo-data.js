/**
 * DEMO DATA - Pre-filled Company for Quick Testing
 *
 * Purpose: Allow trial users and sales demos to see platform results
 * without gathering real data first. This demo workflow does NOT count
 * against subscription limits.
 *
 * Use Case: Mexican automotive parts manufacturer exporting to USA
 * Result: Qualifies for USMCA (75% regional content)
 */

export const DEMO_COMPANY_DATA = {
  // Company Information (Step 1)
  company_name: 'Industrias del Norte S.A. de C.V.',
  manufacturing_location: 'Mexico',
  destination_country: 'United States',
  industry: 'Automotive',
  product_description: 'Automotive brake pad assemblies for US market',

  // Component Data (Step 2) - 5 components showing good mix of origins
  components: [
    {
      name: 'Friction Material (Brake Pads)',
      origin: 'Mexico',
      description: 'Ceramic composite brake friction material manufactured in Monterrey',
      cost_percentage: 40,
      suggested_hs_code: '6813.20.00',
      // Pre-filled tariff data (would normally come from AI/database)
      mfn_rate: 0.0,
      usmca_rate: 0.0,
      section_301: 0.0,
      section_232: 0.0
    },
    {
      name: 'Steel Backing Plate',
      origin: 'United States',
      description: 'Stamped steel backing plates from Ohio supplier',
      cost_percentage: 25,
      suggested_hs_code: '7326.90.85',
      mfn_rate: 2.9,
      usmca_rate: 0.0,
      section_301: 0.0,
      section_232: 0.0
    },
    {
      name: 'Industrial Adhesive',
      origin: 'Mexico',
      description: 'High-temperature bonding adhesive produced locally',
      cost_percentage: 10,
      suggested_hs_code: '3506.91.00',
      mfn_rate: 6.5,
      usmca_rate: 0.0,
      section_301: 0.0,
      section_232: 0.0
    },
    {
      name: 'Hardware Kit (Shims, Clips)',
      origin: 'China',
      description: 'Anti-rattle shims and spring clips imported from Guangzhou',
      cost_percentage: 15,
      suggested_hs_code: '7318.29.00',
      mfn_rate: 6.2,
      usmca_rate: 6.2, // No USMCA benefit for China origin
      section_301: 25.0, // Section 301 tariffs on Chinese steel products
      section_232: 0.0
    },
    {
      name: 'Retail Packaging',
      origin: 'Mexico',
      description: 'Cardboard retail box and inserts printed in Mexico City',
      cost_percentage: 10,
      suggested_hs_code: '4819.10.00',
      mfn_rate: 0.0,
      usmca_rate: 0.0,
      section_301: 0.0,
      section_232: 0.0
    }
  ],

  // Expected Analysis Results
  expected_results: {
    qualifies_for_usmca: true,
    regional_value_content: 75, // Mexico (40% + 10% + 10%) + USA (25%) = 85% North American
    required_threshold: 65, // Automotive industry threshold
    estimated_annual_savings: 8200,
    total_tariff_without_usmca: 10.2, // Weighted average with Section 301
    total_tariff_with_usmca: 1.5, // Only non-qualifying component (China hardware)
    preference_criterion: 'B' // RVC calculation
  }
};

/**
 * Alternative demo scenarios for different industries
 */
export const DEMO_SCENARIOS = {
  automotive: DEMO_COMPANY_DATA, // Default

  electronics: {
    company_name: 'TechMex Electronics Manufacturing',
    manufacturing_location: 'Mexico',
    destination_country: 'United States',
    industry: 'Electronics',
    product_description: 'Consumer electronics assembly',
    components: [
      { name: 'PCB Assembly', origin: 'Mexico', cost_percentage: 35, suggested_hs_code: '8542.31.00' },
      { name: 'Display Panel', origin: 'China', cost_percentage: 30, suggested_hs_code: '8524.99.00' },
      { name: 'Plastic Housing', origin: 'Mexico', cost_percentage: 20, suggested_hs_code: '3926.90.99' },
      { name: 'Power Supply', origin: 'United States', cost_percentage: 10, suggested_hs_code: '8504.40.95' },
      { name: 'Packaging', origin: 'Mexico', cost_percentage: 5, suggested_hs_code: '4819.10.00' }
    ]
  },

  furniture: {
    company_name: 'Muebles del Sur Exports',
    manufacturing_location: 'Mexico',
    destination_country: 'United States',
    industry: 'Furniture',
    product_description: 'Wooden office furniture',
    components: [
      { name: 'Hardwood Lumber', origin: 'United States', cost_percentage: 45, suggested_hs_code: '4407.11.00' },
      { name: 'Metal Hardware', origin: 'China', cost_percentage: 10, suggested_hs_code: '8302.42.00' },
      { name: 'Upholstery Fabric', origin: 'Mexico', cost_percentage: 25, suggested_hs_code: '5515.11.00' },
      { name: 'Foam Padding', origin: 'Mexico', cost_percentage: 15, suggested_hs_code: '3926.90.99' },
      { name: 'Packaging', origin: 'Mexico', cost_percentage: 5, suggested_hs_code: '4819.10.00' }
    ]
  }
};

/**
 * Helper function to check if workflow is using demo data
 */
export function isDemoWorkflow(workflowData) {
  return workflowData?.is_demo === true ||
         workflowData?.company_name === DEMO_COMPANY_DATA.company_name;
}

/**
 * Helper function to mark workflow as demo
 */
export function markAsDemoWorkflow(workflowData) {
  return {
    ...workflowData,
    is_demo: true,
    demo_scenario: 'automotive'
  };
}
