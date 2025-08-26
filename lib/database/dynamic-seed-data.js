// Dynamic Database Seeding - Zero Hardcoded Data
// Seeds database with flexible, configurable data structure

import { supabase } from '../supabase-client';

class DynamicSeeder {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
  }

  async seedAll() {
    console.log('🌱 Starting dynamic database seeding...');
    
    try {
      await this.seedSystemConfig();
      await this.seedFormFields();
      await this.seedBusinessRules();
      await this.seedCountries();
      await this.seedUSMCAHSCodes();
      await this.seedCertificationTemplates();
      await this.seedCalculationRules();
      
      console.log('✅ Dynamic seeding completed successfully!');
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    }
  }

  // Seed dynamic system configuration
  async seedSystemConfig() {
    console.log('📋 Seeding system configuration...');
    
    const configs = [
      // UI Configuration
      {
        config_category: 'ui',
        config_key: 'foundation_page',
        config_value: {
          title: 'Tell us about your business',
          subtitle: 'Help us understand your trade needs',
          progress_indicator: true,
          save_progress: true,
          validation_mode: 'realtime'
        }
      },
      {
        config_category: 'ui', 
        config_key: 'product_page',
        config_value: {
          title: 'Describe your products',
          subtitle: 'We\'ll classify them for USMCA eligibility',
          show_hs_suggestions: true,
          enable_image_upload: false,
          max_products: 10
        }
      },
      {
        config_category: 'ui',
        config_key: 'routing_page', 
        config_value: {
          title: 'Optimize your shipping routes',
          subtitle: 'Find the best tariff savings and logistics',
          show_savings_calculator: true,
          enable_provider_matching: true,
          show_port_options: true
        }
      },

      // Business Rules Configuration
      {
        config_category: 'business_rules',
        config_key: 'usmca_eligibility',
        config_value: {
          minimum_content_percentage: 75,
          allowed_tariff_shift_codes: ['CC', 'CTH', 'CTSH'],
          require_certificate_of_origin: true,
          grace_period_days: 30
        }
      },
      {
        config_category: 'business_rules',
        config_key: 'savings_calculation',
        config_value: {
          include_duty_savings: true,
          include_processing_savings: true,
          annual_multiplier: 12,
          confidence_threshold: 0.8
        }
      },

      // Integration Configuration
      {
        config_category: 'integrations',
        config_key: 'marketplace',
        config_value: {
          auto_match_providers: true,
          max_recommendations: 5,
          minimum_provider_rating: 4.0,
          enable_direct_contact: true,
          commission_rate: 0.05
        }
      },
      {
        config_category: 'integrations',
        config_key: 'external_apis',
        config_value: {
          census_trade_api: {
            enabled: true,
            rate_limit: 100,
            timeout: 30000
          },
          exchange_rates: {
            provider: 'exchangerate-api',
            update_frequency: 'daily',
            base_currency: 'USD'
          }
        }
      }
    ];

    await this.batchInsert('system_config', configs);
  }

  // Seed dynamic form fields
  async seedFormFields() {
    console.log('📝 Seeding form fields...');

    const formFields = [
      // Foundation Page Fields
      {
        page_name: 'foundation',
        field_name: 'company_name',
        field_type: 'text',
        display_order: 1,
        field_config: {
          label: 'Company Name',
          placeholder: 'Enter your company name',
          css_class: 'form-control'
        },
        validation_rules: {
          required: true,
          min_length: 2,
          max_length: 200
        }
      },
      {
        page_name: 'foundation',
        field_name: 'business_type',
        field_type: 'select',
        display_order: 2,
        field_config: {
          label: 'Business Type',
          placeholder: 'Select your business type'
        },
        options_source: 'static',
        static_options: [
          { value: 'manufacturer', label: 'Manufacturer' },
          { value: 'importer', label: 'Importer' },
          { value: 'exporter', label: 'Exporter' },
          { value: 'distributor', label: 'Distributor' },
          { value: 'retailer', label: 'Retailer' },
          { value: 'service_provider', label: 'Service Provider' }
        ],
        validation_rules: { required: true }
      },
      {
        page_name: 'foundation',
        field_name: 'annual_trade_volume',
        field_type: 'select',
        display_order: 3,
        field_config: {
          label: 'Annual Trade Volume',
          placeholder: 'Select approximate volume'
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
        validation_rules: { required: true }
      },
      {
        page_name: 'foundation',
        field_name: 'primary_countries',
        field_type: 'select',
        display_order: 4,
        field_config: {
          label: 'Primary Trading Countries',
          placeholder: 'Select countries you trade with',
          multiple: true
        },
        options_source: 'database_query',
        options_query: 'SELECT country_code as value, country_name as label FROM countries WHERE is_active = true ORDER BY country_name',
        validation_rules: { required: true }
      },

      // Product Page Fields
      {
        page_name: 'product',
        field_name: 'product_description',
        field_type: 'textarea',
        display_order: 1,
        field_config: {
          label: 'Product Description',
          placeholder: 'Describe your main products in detail',
          rows: 4,
          help_text: 'Include materials, intended use, and key features'
        },
        validation_rules: {
          required: true,
          min_length: 20,
          max_length: 1000
        }
      },
      {
        page_name: 'product',
        field_name: 'product_category',
        field_type: 'select',
        display_order: 2,
        field_config: {
          label: 'General Product Category',
          placeholder: 'Select closest category'
        },
        options_source: 'static',
        static_options: [
          { value: 'machinery', label: 'Machinery & Equipment' },
          { value: 'electronics', label: 'Electronics & Technology' },
          { value: 'automotive', label: 'Automotive Parts' },
          { value: 'textiles', label: 'Textiles & Apparel' },
          { value: 'chemicals', label: 'Chemicals & Plastics' },
          { value: 'food_beverage', label: 'Food & Beverages' },
          { value: 'raw_materials', label: 'Raw Materials' },
          { value: 'other', label: 'Other' }
        ],
        validation_rules: { required: true }
      },
      {
        page_name: 'product',
        field_name: 'country_of_origin',
        field_type: 'select',
        display_order: 3,
        field_config: {
          label: 'Country of Origin',
          placeholder: 'Where are your products manufactured?'
        },
        options_source: 'database_query',
        options_query: 'SELECT country_code as value, country_name as label FROM countries WHERE is_active = true ORDER BY country_name',
        validation_rules: { required: true }
      },

      // Routing Page Fields
      {
        page_name: 'routing',
        field_name: 'destination_country',
        field_type: 'select',
        display_order: 1,
        field_config: {
          label: 'Destination Country',
          placeholder: 'Where do you ship to?'
        },
        options_source: 'database_query',
        options_query: 'SELECT country_code as value, country_name as label FROM countries WHERE usmca_member = true ORDER BY country_name',
        validation_rules: { required: true }
      },
      {
        page_name: 'routing',
        field_name: 'shipping_priority',
        field_type: 'radio',
        display_order: 2,
        field_config: {
          label: 'What\'s most important to you?'
        },
        options_source: 'static',
        static_options: [
          { value: 'cost', label: 'Lowest cost' },
          { value: 'speed', label: 'Fastest delivery' },
          { value: 'reliability', label: 'Most reliable' },
          { value: 'compliance', label: 'Easiest compliance' }
        ],
        validation_rules: { required: true }
      },
      {
        page_name: 'routing',
        field_name: 'needs_services',
        field_type: 'checkbox',
        display_order: 3,
        field_config: {
          label: 'I need help with trade services (customs brokerage, freight forwarding, etc.)'
        }
      }
    ];

    await this.batchInsert('form_fields', formFields);
  }

  // Seed dynamic business rules
  async seedBusinessRules() {
    console.log('⚙️ Seeding business rules...');

    const businessRules = [
      {
        rule_name: 'USMCA Eligibility Check',
        rule_category: 'compliance',
        conditions: [
          { field: 'country_of_origin', operator: 'in_array', value: ['US', 'CA', 'MX'] },
          { field: 'destination_country', operator: 'in_array', value: ['US', 'CA', 'MX'] }
        ],
        actions: [
          { action: 'set_field', field: 'usmca_eligible', value: true },
          { action: 'set_field', field: 'potential_savings', value: 'high' }
        ],
        priority: 100
      },
      {
        rule_name: 'High Value Trade Detection',
        rule_category: 'classification',
        conditions: [
          { field: 'annual_trade_volume', operator: 'in_array', value: ['5m_10m', 'over_10m'] }
        ],
        actions: [
          { action: 'set_field', field: 'priority_customer', value: true },
          { action: 'set_field', field: 'dedicated_support', value: true }
        ],
        priority: 90
      },
      {
        rule_name: 'Auto-recommend Services',
        rule_category: 'form_processing',
        applicable_pages: ['routing'],
        conditions: [
          { field: 'business_type', operator: 'in_array', value: ['importer', 'exporter'] },
          { field: 'annual_trade_volume', operator: 'in_array', value: ['1m_5m', '5m_10m', 'over_10m'] }
        ],
        actions: [
          { type: 'recommend_providers', config: { categories: ['customs_broker', 'freight_forwarder'] } }
        ],
        priority: 80
      }
    ];

    await this.batchInsert('business_rules', businessRules);
  }

  // Seed dynamic countries
  async seedCountries() {
    console.log('🌍 Seeding countries...');

    const countries = [
      {
        country_code: 'US',
        country_name: 'United States',
        region: 'North America',
        usmca_member: true,
        fta_agreements: [
          { name: 'USMCA', effective_date: '2020-07-01' },
          { name: 'US-Chile FTA', effective_date: '2004-01-01' },
          { name: 'US-Peru TPA', effective_date: '2009-02-01' }
        ],
        major_ports: [
          { name: 'Port of Los Angeles', code: 'USLAX' },
          { name: 'Port of Long Beach', code: 'USLGB' },
          { name: 'Port of New York/New Jersey', code: 'USNYC' }
        ]
      },
      {
        country_code: 'CA',
        country_name: 'Canada', 
        region: 'North America',
        usmca_member: true,
        fta_agreements: [
          { name: 'USMCA', effective_date: '2020-07-01' },
          { name: 'CETA', effective_date: '2017-09-21' }
        ],
        major_ports: [
          { name: 'Port of Vancouver', code: 'CAVAN' },
          { name: 'Port of Montreal', code: 'CAMTR' }
        ]
      },
      {
        country_code: 'MX',
        country_name: 'Mexico',
        region: 'North America', 
        usmca_member: true,
        fta_agreements: [
          { name: 'USMCA', effective_date: '2020-07-01' },
          { name: 'Pacific Alliance', effective_date: '2012-06-06' }
        ],
        major_ports: [
          { name: 'Port of Veracruz', code: 'MXVER' },
          { name: 'Port of Manzanillo', code: 'MXMAN' }
        ]
      },
      {
        country_code: 'CN',
        country_name: 'China',
        region: 'Asia',
        usmca_member: false,
        economic_indicators: {
          major_trading_partner: true,
          manufacturing_hub: true
        }
      },
      {
        country_code: 'CL',
        country_name: 'Chile',
        region: 'South America',
        usmca_member: false,
        fta_agreements: [
          { name: 'US-Chile FTA', effective_date: '2004-01-01' },
          { name: 'Pacific Alliance', effective_date: '2012-06-06' }
        ]
      },
      {
        country_code: 'PE',
        country_name: 'Peru',
        region: 'South America',
        usmca_member: false,
        fta_agreements: [
          { name: 'US-Peru TPA', effective_date: '2009-02-01' },
          { name: 'Pacific Alliance', effective_date: '2012-06-06' }
        ]
      }
    ];

    await this.batchInsert('countries', countries);
  }

  // Seed sample USMCA HS codes
  async seedUSMCAHSCodes() {
    console.log('🏷️ Seeding USMCA HS codes...');

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
        certification_requirements: {
          certificate_of_origin: true,
          producer_certification: true,
          importer_certification: true
        },
        trade_volume_rank: 1,
        complexity_score: 8
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
        tariff_shift_required: true,
        certification_requirements: {
          certificate_of_origin: true,
          regional_value_content_calculation: true
        },
        trade_volume_rank: 2,
        complexity_score: 9
      },
      {
        hs_code: '6109',
        description: 'T-shirts, singlets and other vests, knitted or crocheted',
        chapter: '61',
        us_mfn_rate: 16.5,
        us_usmca_rate: 0.0,
        ca_mfn_rate: 18.0,
        ca_usmca_rate: 0.0,
        mx_mfn_rate: 20.0,
        mx_usmca_rate: 0.0,
        origin_requirement: 'Yarn forward rule',
        origin_percentage: 75.0,
        specific_process_required: 'Yarn must originate in USMCA territory',
        certification_requirements: {
          certificate_of_origin: true,
          fiber_content_documentation: true
        },
        trade_volume_rank: 3,
        complexity_score: 7
      }
    ];

    await this.batchInsert('usmca_hs_codes', hsCodes);
  }

  // Seed certification templates
  async seedCertificationTemplates() {
    console.log('📋 Seeding certification templates...');

    const templates = [
      {
        certificate_type: 'USMCA Certificate of Origin',
        template_name: 'Standard USMCA COO',
        required_fields: [
          { field: 'exporter_name', type: 'text', validation: 'required' },
          { field: 'exporter_address', type: 'textarea', validation: 'required' },
          { field: 'producer_name', type: 'text', validation: 'required' },
          { field: 'importer_name', type: 'text', validation: 'required' },
          { field: 'description_of_goods', type: 'textarea', validation: 'required' },
          { field: 'hs_tariff_classification', type: 'text', validation: 'required' },
          { field: 'origin_criterion', type: 'select', validation: 'required' },
          { field: 'regional_value_content', type: 'number', validation: 'conditional' }
        ],
        optional_fields: [
          { field: 'invoice_numbers', type: 'text' },
          { field: 'purchase_order_numbers', type: 'text' }
        ],
        validation_rules: {
          origin_criterion: {
            options: ['A', 'B', 'C', 'D'],
            descriptions: {
              'A': 'Good is wholly obtained or produced entirely in one or more USMCA countries',
              'B': 'Good is produced entirely in one or more USMCA countries using non-originating materials',
              'C': 'Good is produced entirely in one or more USMCA countries using non-originating materials',
              'D': 'Good is produced in one or more USMCA countries but does not satisfy applicable rule of origin'
            }
          }
        },
        applicable_countries: ['US', 'CA', 'MX'],
        priority_order: 1
      }
    ];

    await this.batchInsert('usmca_certifications', templates);
  }

  // Seed calculation rules
  async seedCalculationRules() {
    console.log('🧮 Seeding calculation rules...');

    // Create calculation rules table if it doesn't exist
    await supabase.rpc('create_calculation_rules_table');

    const calcRules = [
      {
        calculation_type: 'savings',
        rule_name: 'USMCA Duty Savings',
        formula: 'trade_value * (mfn_rate - usmca_rate) / 100',
        conditions: [
          { field: 'usmca_eligible', operator: 'equals', value: true }
        ],
        priority: 100
      },
      {
        calculation_type: 'savings',
        rule_name: 'Processing Time Savings',
        formula: 'trade_value * 0.02', // 2% of trade value for faster processing
        conditions: [
          { field: 'usmca_eligible', operator: 'equals', value: true },
          { field: 'annual_trade_volume', operator: 'in_array', value: ['1m_5m', '5m_10m', 'over_10m'] }
        ],
        priority: 90
      }
    ];

    await this.batchInsert('calculation_rules', calcRules);
  }

  // Utility function for batch inserts
  async batchInsert(tableName, records) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .upsert(records, { 
          onConflict: this.getConflictColumns(tableName),
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Error seeding ${tableName}:`, error);
        throw error;
      }

      console.log(`✅ Seeded ${records.length} records in ${tableName}`);
      return data;
    } catch (error) {
      console.error(`Failed to seed ${tableName}:`, error);
      throw error;
    }
  }

  // Get conflict resolution columns for each table
  getConflictColumns(tableName) {
    const conflicts = {
      'system_config': 'config_category,config_key,environment',
      'form_fields': 'page_name,field_name',
      'business_rules': 'rule_name',
      'countries': 'country_code',
      'usmca_hs_codes': 'hs_code',
      'usmca_certifications': 'certificate_type,template_name',
      'calculation_rules': 'calculation_type,rule_name'
    };
    return conflicts[tableName] || 'id';
  }
}

// Export seeder instance
const dynamicSeeder = new DynamicSeeder();
export default dynamicSeeder;

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  dynamicSeeder.seedAll()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}