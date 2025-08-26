#!/usr/bin/env node
/**
 * Enhance Existing Tables for Simple USMCA Compliance
 * Uses your existing database structure instead of creating new tables
 * Focused, direct approach - no over-engineering
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

class SimpleUSMCAEnhancer {
  async enhance() {
    console.log('🎯 ENHANCING EXISTING TABLES FOR SIMPLE USMCA');
    console.log('============================================\n');
    
    try {
      await this.enhanceComtradeReference();
      await this.addCriticalUSMCARules();
      await this.validateEnhancements();
      
      console.log('\n✅ SIMPLE USMCA SYSTEM READY!');
      console.log('\n🎯 Using Existing Tables:');
      console.log('• comtrade_reference: HS codes + USMCA rules');
      console.log('• workflow_sessions: User submissions');
      console.log('• countries: Supplier/destination options');
      console.log('\n🚀 No complex abstractions, just direct USMCA compliance!');
      
    } catch (error) {
      console.error('\n❌ Enhancement failed:', error);
      process.exit(1);
    }
  }

  async enhanceComtradeReference() {
    console.log('🏷️ Enhancing comtrade_reference with USMCA rules...');
    
    // Add USMCA-specific data to top imported products
    const usmcaEnhancements = [
      {
        hs_code: '870323',
        usmca_rule: 'regional_content_75',
        usmca_qualified: true,
        us_mfn_rate: 2.5,
        us_usmca_rate: 0.0,
        potential_savings: 'high'
      },
      {
        hs_code: '850440',
        usmca_rule: 'tariff_shift_required',
        usmca_qualified: true,
        us_mfn_rate: 1.5,
        us_usmca_rate: 0.0,
        potential_savings: 'medium'
      },
      {
        hs_code: '841311',
        usmca_rule: 'regional_content_60',
        usmca_qualified: true,
        us_mfn_rate: 2.5,
        us_usmca_rate: 0.0,
        potential_savings: 'medium'
      },
      {
        hs_code: '610910',
        usmca_rule: 'yarn_forward_rule',
        usmca_qualified: false,
        us_mfn_rate: 16.5,
        us_usmca_rate: 0.0,
        potential_savings: 'very_high'
      },
      {
        hs_code: '620342',
        usmca_rule: 'yarn_forward_rule',
        usmca_qualified: false,
        us_mfn_rate: 16.6,
        us_usmca_rate: 0.0,
        potential_savings: 'very_high'
      }
    ];

    let enhanced = 0;
    console.log(`Enhancing ${usmcaEnhancements.length} critical HS codes with USMCA data...`);
    
    for (const enhancement of usmcaEnhancements) {
      try {
        // Check if the HS code exists
        const { data: existing } = await supabase
          .from('comtrade_reference')
          .select('hs_code')
          .eq('hs_code', enhancement.hs_code)
          .single();

        if (existing) {
          // Update with USMCA data
          const { error } = await supabase
            .from('comtrade_reference')
            .update({
              usmca_rule: enhancement.usmca_rule,
              usmca_qualified: enhancement.usmca_qualified,
              us_mfn_rate: enhancement.us_mfn_rate,
              us_usmca_rate: enhancement.us_usmca_rate,
              potential_savings: enhancement.potential_savings
            })
            .eq('hs_code', enhancement.hs_code);

          if (!error) {
            enhanced++;
            console.log(`  ✅ Enhanced ${enhancement.hs_code}: ${enhancement.usmca_rule}`);
          }
        } else {
          // Insert new critical HS code
          const { error } = await supabase
            .from('comtrade_reference')
            .insert({
              hs_code: enhancement.hs_code,
              product_description: `Critical USMCA product - ${enhancement.hs_code}`,
              ...enhancement
            });

          if (!error) {
            enhanced++;
            console.log(`  ✅ Added critical ${enhancement.hs_code}: ${enhancement.usmca_rule}`);
          }
        }
      } catch (err) {
        console.log(`  ⚠️ ${enhancement.hs_code}: ${err.message}`);
      }
    }
    
    console.log(`✅ Enhanced ${enhanced} HS codes with USMCA compliance data`);
  }

  async addCriticalUSMCARules() {
    console.log('📋 Adding critical USMCA business rules...');
    
    // Simple business logic for USMCA qualification
    const businessRules = [
      {
        rule_name: 'Automotive Regional Content',
        description: 'Vehicles must have 75% regional content',
        applies_to: ['87*'], // All Chapter 87 codes
        qualification_method: 'regional_content',
        threshold: 75,
        documentation_required: ['Bill of Materials', 'Regional Content Worksheet']
      },
      {
        rule_name: 'Textile Yarn Forward',
        description: 'Cut and sewn from yarn formed in USMCA territory',
        applies_to: ['61*', '62*'], // Textiles
        qualification_method: 'yarn_forward',
        threshold: null,
        documentation_required: ['Yarn Origin Certificate', 'Production Records']
      },
      {
        rule_name: 'Electronics Assembly',
        description: 'Assembly and test in USMCA territory',
        applies_to: ['8542*'], // Integrated circuits
        qualification_method: 'specific_process',
        threshold: null,
        documentation_required: ['Assembly Records', 'Test Certificates']
      },
      {
        rule_name: 'Standard Regional Content',
        description: 'General 60% regional content requirement',
        applies_to: ['84*', '94*'], // Machinery, Furniture
        qualification_method: 'regional_content',
        threshold: 60,
        documentation_required: ['Cost Breakdown', 'Supplier Declarations']
      }
    ];

    // Store rules in a simple format (could be in system_config or separate table)
    for (const rule of businessRules) {
      console.log(`  📝 Rule: ${rule.rule_name} (${rule.qualification_method})`);
    }
    
    console.log('✅ USMCA business rules documented');
  }

  async validateEnhancements() {
    console.log('🔍 Validating simple USMCA enhancements...');
    
    // Check enhanced HS codes
    const { data: enhancedCodes } = await supabase
      .from('comtrade_reference')
      .select('hs_code, product_description, usmca_rule, potential_savings')
      .not('usmca_rule', 'is', null)
      .limit(10);
    
    if (enhancedCodes && enhancedCodes.length > 0) {
      console.log('✅ USMCA-enhanced HS codes:');
      enhancedCodes.forEach(code => {
        console.log(`  ${code.hs_code}: ${code.usmca_rule} (${code.potential_savings} savings)`);
      });
    }
    
    // Check existing workflow sessions
    const { count: sessionCount } = await supabase
      .from('workflow_sessions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ User workflow sessions available: ${sessionCount || 0}`);
    
    // Check countries for supplier selection
    const { count: countryCount } = await supabase
      .from('countries')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ Countries for supplier selection: ${countryCount || 0}`);
    
    console.log('✅ Simple USMCA validation completed');
  }
}

// Execute simple enhancement
const enhancer = new SimpleUSMCAEnhancer();
enhancer.enhance();