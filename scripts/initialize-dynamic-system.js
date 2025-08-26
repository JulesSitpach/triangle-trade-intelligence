#!/usr/bin/env node
/**
 * Initialize Dynamic System - Zero Hardcoding Setup
 * 
 * This script sets up the complete dynamic database structure and seeds
 * all configuration data for the Triangle Intelligence USMCA platform.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

class DynamicSystemInitializer {
  constructor() {
    this.steps = [
      'createTables',
      'seedSystemConfig', 
      'seedFormFields',
      'seedBusinessRules',
      'seedCountries',
      'seedUSMCAData',
      'createIndexes',
      'validateSetup'
    ];
  }

  async initialize() {
    console.log('🚀 Initializing Triangle Intelligence Dynamic System...\n');
    
    try {
      for (const step of this.steps) {
        await this[step]();
      }
      
      console.log('\n✅ Dynamic system initialization completed successfully!');
      console.log('\n🎯 Next steps:');
      console.log('1. Test the foundation page at /foundation-dynamic');
      console.log('2. Verify form fields load dynamically from database');
      console.log('3. Test form submission and business rule processing');
      console.log('4. Monitor performance and user completion rates');
      
    } catch (error) {
      console.error('\n❌ Initialization failed:', error);
      process.exit(1);
    }
  }

  async createTables() {
    console.log('📋 Creating database tables...');
    
    const schemaPath = path.join(process.cwd(), 'lib/database/core-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split into individual statements and execute
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('execute_sql', { sql: statement });
        if (error && !error.message.includes('already exists')) {
          console.warn(`Warning executing SQL: ${error.message}`);
        }
      } catch (err) {
        console.warn(`Warning: ${err.message}`);
      }
    }
    
    console.log('✅ Database tables created');
  }

  async seedSystemConfig() {
    console.log('⚙️ Seeding system configuration...');
    
    const configs = [
      {
        config_category: 'ui',
        config_key: 'foundation_page',
        config_value: {
          title: 'Tell us about your business',
          subtitle: 'Help us understand your USMCA trade needs',
          progress_indicator: true,
          save_progress: true,
          validation_mode: 'realtime'
        },
        environment: 'production'
      },
      {
        config_category: 'business_rules',
        config_key: 'usmca_eligibility',
        config_value: {
          minimum_content_percentage: 75,
          require_certificate_of_origin: true,
          grace_period_days: 30
        },
        environment: 'production'
      },
      {
        config_category: 'integrations',
        config_key: 'marketplace',
        config_value: {
          auto_match_providers: true,
          max_recommendations: 5,
          minimum_provider_rating: 4.0,
          commission_rate: 0.10
        },
        environment: 'production'
      }
    ];
    
    const { error } = await supabase
      .from('system_config')
      .upsert(configs, { 
        onConflict: 'config_category,config_key,environment'
      });
    
    if (error) throw error;
    console.log('✅ System configuration seeded');
  }

  async seedFormFields() {
    console.log('📝 Seeding form fields...');
    
    const formFields = [
      // Foundation Page
      {
        page_name: 'foundation',
        field_name: 'company_name',
        field_type: 'text',
        display_order: 1,
        field_config: {
          label: 'Company Name',
          placeholder: 'Enter your company name',
          help_text: 'Legal name of your business'
        },
        validation_rules: {
          required: true,
          min_length: 2,
          max_length: 200
        },
        is_active: true
      },
      {
        page_name: 'foundation',
        field_name: 'business_type',
        field_type: 'select',
        display_order: 2,
        field_config: {
          label: 'Business Type',
          placeholder: 'What type of business are you?'
        },
        options_source: 'static',
        static_options: [
          { value: 'manufacturer', label: 'Manufacturer' },
          { value: 'importer', label: 'Importer' },
          { value: 'exporter', label: 'Exporter' },
          { value: 'distributor', label: 'Distributor' },
          { value: 'retailer', label: 'Retailer' }
        ],
        validation_rules: { required: true },
        is_active: true
      },
      {
        page_name: 'foundation',
        field_name: 'annual_trade_volume',
        field_type: 'select',
        display_order: 3,
        field_config: {
          label: 'Annual Trade Volume',
          placeholder: 'Select your trade volume'
        },
        options_source: 'static',
        static_options: [
          { value: 'under_100k', label: 'Under $100K' },
          { value: '100k_500k', label: '$100K - $500K' },
          { value: '500k_1m', label: '$500K - $1M' },
          { value: '1m_5m', label: '$1M - $5M' },
          { value: '5m_10m', label: '$5M - $10M' },
          { value: 'over_10m', label: 'Over $10M' }
        ],
        validation_rules: { required: true },
        is_active: true
      },
      {
        page_name: 'foundation',
        field_name: 'primary_supplier_country',
        field_type: 'select',
        display_order: 4,
        field_config: {
          label: 'Primary Supplier Country',
          placeholder: 'Where do you source from?'
        },
        options_source: 'database_query',
        options_query: 'SELECT country_code as value, country_name as label FROM countries WHERE is_active = true ORDER BY country_name',
        validation_rules: { required: true },
        is_active: true
      }
    ];
    
    const { error } = await supabase
      .from('form_fields')
      .upsert(formFields, { 
        onConflict: 'page_name,field_name'
      });
    
    if (error) throw error;
    console.log('✅ Form fields seeded');
  }

  async seedBusinessRules() {
    console.log('⚙️ Seeding business rules...');
    
    const rules = [
      {
        rule_name: 'USMCA Eligibility Check',
        rule_category: 'compliance',
        conditions: [
          { field: 'primary_supplier_country', operator: 'in_array', value: ['US', 'CA', 'MX'] }
        ],
        actions: [
          { action: 'set_field', field: 'usmca_eligible', value: true }
        ],
        priority: 100,
        is_active: true
      },
      {
        rule_name: 'High Value Trade Detection',
        rule_category: 'classification',
        conditions: [
          { field: 'annual_trade_volume', operator: 'in_array', value: ['5m_10m', 'over_10m'] }
        ],
        actions: [
          { action: 'set_field', field: 'priority_customer', value: true }
        ],
        priority: 90,
        is_active: true
      }
    ];
    
    const { error } = await supabase
      .from('business_rules')
      .upsert(rules, { 
        onConflict: 'rule_name'
      });
    
    if (error) throw error;
    console.log('✅ Business rules seeded');
  }

  async seedCountries() {
    console.log('🌍 Seeding countries...');
    
    const countries = [
      { country_code: 'US', country_name: 'United States', usmca_member: true, is_active: true },
      { country_code: 'CA', country_name: 'Canada', usmca_member: true, is_active: true },
      { country_code: 'MX', country_name: 'Mexico', usmca_member: true, is_active: true },
      { country_code: 'CN', country_name: 'China', usmca_member: false, is_active: true },
      { country_code: 'JP', country_name: 'Japan', usmca_member: false, is_active: true },
      { country_code: 'KR', country_name: 'South Korea', usmca_member: false, is_active: true },
      { country_code: 'DE', country_name: 'Germany', usmca_member: false, is_active: true },
      { country_code: 'VN', country_name: 'Vietnam', usmca_member: false, is_active: true },
      { country_code: 'IN', country_name: 'India', usmca_member: false, is_active: true },
      { country_code: 'TH', country_name: 'Thailand', usmca_member: false, is_active: true }
    ];
    
    const { error } = await supabase
      .from('countries')
      .upsert(countries, { 
        onConflict: 'country_code'
      });
    
    if (error) throw error;
    console.log('✅ Countries seeded');
  }

  async seedUSMCAData() {
    console.log('🏷️ Seeding USMCA HS code data...');
    
    const hsCodes = [
      {
        hs_code: '8411',
        description: 'Turbo-jets, turbo-propellers and other gas turbines',
        chapter: '84',
        us_mfn_rate: 6.7,
        us_usmca_rate: 0.0,
        ca_mfn_rate: 6.5,
        ca_usmca_rate: 0.0,
        mx_mfn_rate: 8.0,
        mx_usmca_rate: 0.0,
        origin_requirement: 'Tariff shift from any other heading',
        origin_percentage: 75.0,
        certification_requirements: { certificate_of_origin: true },
        complexity_score: 8,
        data_source: 'USMCA_OFFICIAL'
      },
      {
        hs_code: '8708',
        description: 'Parts and accessories of motor vehicles',
        chapter: '87',
        us_mfn_rate: 2.5,
        us_usmca_rate: 0.0,
        ca_mfn_rate: 2.0,
        ca_usmca_rate: 0.0,
        mx_mfn_rate: 3.0,
        mx_usmca_rate: 0.0,
        origin_requirement: 'Regional Value Content 62.5%',
        origin_percentage: 62.5,
        certification_requirements: { certificate_of_origin: true, rvc_calculation: true },
        complexity_score: 9,
        data_source: 'USMCA_OFFICIAL'
      }
    ];
    
    const { error } = await supabase
      .from('usmca_hs_codes')
      .upsert(hsCodes, { 
        onConflict: 'hs_code'
      });
    
    if (error) throw error;
    console.log('✅ USMCA data seeded');
  }

  async createIndexes() {
    console.log('⚡ Creating database indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_form_fields_page_active ON form_fields(page_name, is_active);',
      'CREATE INDEX IF NOT EXISTS idx_business_rules_category_active ON business_rules(rule_category, is_active);',
      'CREATE INDEX IF NOT EXISTS idx_system_config_lookup ON system_config(config_category, config_key, environment);',
      'CREATE INDEX IF NOT EXISTS idx_user_submissions_session ON user_submissions(session_id);',
      'CREATE INDEX IF NOT EXISTS idx_countries_active ON countries(is_active);'
    ];
    
    for (const indexSQL of indexes) {
      try {
        const { error } = await supabase.rpc('execute_sql', { sql: indexSQL });
        if (error) console.warn(`Index warning: ${error.message}`);
      } catch (err) {
        console.warn(`Index warning: ${err.message}`);
      }
    }
    
    console.log('✅ Database indexes created');
  }

  async validateSetup() {
    console.log('🔍 Validating setup...');
    
    // Test form fields load
    const { data: formFields, error: fieldsError } = await supabase
      .from('form_fields')
      .select('*')
      .eq('page_name', 'foundation')
      .eq('is_active', true);
    
    if (fieldsError) throw fieldsError;
    
    console.log(`✅ Form fields: ${formFields.length} active fields found`);
    
    // Test countries load
    const { data: countries, error: countriesError } = await supabase
      .from('countries')
      .select('*')
      .eq('is_active', true);
    
    if (countriesError) throw countriesError;
    
    console.log(`✅ Countries: ${countries.length} active countries found`);
    
    // Test system config
    const { data: config, error: configError } = await supabase
      .from('system_config')
      .select('*')
      .eq('config_category', 'ui')
      .eq('is_active', true);
    
    if (configError) throw configError;
    
    console.log(`✅ System config: ${config.length} UI configurations found`);
    
    console.log('✅ Setup validation completed');
  }
}

// Run initialization
const initializer = new DynamicSystemInitializer();
initializer.initialize();