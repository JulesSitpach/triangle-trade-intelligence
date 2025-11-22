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
  // Company Information (Step 1) - Complete form data
  company_name: 'Industrias del Norte S.A. de C.V.',
  business_type: 'Manufacturer',
  certifier_type: 'PRODUCER',
  industry_sector: 'automotive',
  tax_id: 'MX-RFC-123456789',
  company_address: 'Av. Industria 1000, Monterrey, Nuevo León',
  company_country: 'MX',
  contact_person: 'José García',
  contact_email: 'demo@industriasdelnorte.mx',
  contact_phone: '+52-81-1234-5678',
  trade_volume: 5000000, // $5M annual
  supplier_country: 'MX',
  manufacturing_location: 'MX',  // ✅ Country code for dropdown
  destination_country: 'US',  // ✅ Country code (was 'United States')
  industry: 'Automotive',
  product_description: 'Disc brake pad assemblies for light trucks and SUVs (F-150, Silverado, Ram 1500 applications). Ceramic friction material bonded to steel backing plates with hardware kit included. Designed for 3,500-6,000 lb vehicles. Meets FMVSS-135 standards and OEM performance specs. Low dust formula for cleaner wheels. Operating range -40°F to 600°F.',

  // ✅ Manufacturing & Labor Cost - SIMPLIFIED (Nov 21, 2025)
  substantial_transformation: true,  // Qualifies for USMCA (tariff classification changes during manufacturing)
  has_labor_cost_data: true,        // User has actual labor cost data
  labor_cost_annual: 900000,        // $900k annual labor = 18% of $5M trade volume

  // Component Data (Step 2) - ✅ REDUCED: 3 components (Trial tier limit)
  // ✅ Descriptions written like internal BOM/purchase order language (how manufacturing professionals describe components)
  // ⚠️ NO HARDCODED HS CODES OR TARIFF RATES - AI classifies fresh every time
  components: [
    {
      name: 'Friction Material (Brake Pads)',
      origin: 'MX',  // ✅ Country code for dropdown
      description: 'Ceramic friction material for disc brake pads, non-asbestos composite. Sourced from Monterrey facility.',
      cost_percentage: 50 // ✅ Adjusted from 40% to 50%
    },
    {
      name: 'Steel Backing Plate',
      origin: 'US',  // ✅ Country code for dropdown
      description: 'Cold-rolled steel backing plates, stamped and heat-treated.',
      cost_percentage: 30, // ✅ Adjusted from 25% to 30%
      contains_section_232_material: true, // ✅ NEW (Nov 21): Steel backing plates subject to Section 232
      material_notes: 'Supplied by Ohio Steel Corp.' // ✅ Supplier info goes in Material Notes (Section 232 field)
    },
    {
      name: 'Anti-Rattle Shims',
      origin: 'CN',  // ✅ Country code for dropdown
      description: 'Anti-rattle shims, stamped steel sheet metal, 0.5mm thickness.',
      cost_percentage: 20, // ✅ Adjusted from 15% to 20% (Total = 100%)
      contains_section_232_material: true, // ✅ NEW (Nov 21): Steel shims subject to Section 232
      material_notes: 'Sourced from Guangzhou supplier.' // ✅ Supplier info goes in Material Notes (Section 232 field)
      // Section 301 tariffs apply to Chinese steel products - AI will detect this
    }
  ],

  // Expected Analysis Results (Nov 21, 2025 - With legitimate labor credit)
  expected_results: {
    qualifies_for_usmca: true,
    component_rvc: 80, // MX (50%) + US (30%) = 80% North American components
    labor_credit: 18, // Automotive industry baseline (AI may adjust 16-20% based on process complexity)
    total_rvc: 98, // Component RVC (80%) + Labor credit (~18%) = ~98%
    required_threshold: 75, // Automotive (Chapter 87 vehicle parts)
    current_annual_savings: 100000, // $5M × 80% NA × 2.5% MFN avoided = $100k
    potential_additional_savings: 275000, // $5M × 20% CN × 27.5% (2.5% MFN + 25% Section 301) = $275k
    preference_criterion: 'B' // RVC calculation method
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
      { name: 'Upholstery Fabric', origin: 'Mexico', cost_percentage: 25, suggested_hs_code: '5515.11.00' },
      { name: 'Foam Padding', origin: 'Mexico', cost_percentage: 15, suggested_hs_code: '3926.90.99' },
      { name: 'Metal Hardware', origin: 'China', cost_percentage: 10, suggested_hs_code: '8302.42.00' },
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
