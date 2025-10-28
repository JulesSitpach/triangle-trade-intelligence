/**
 * COMPONENT DATA CONTRACT - SINGLE SOURCE OF TRUTH
 *
 * THIS FILE PREVENTS THE "ZERO COMMUNICATION" BUG
 *
 * Problem: Every layer uses different field names
 *   Database: mfn_rate, section_301, usmca_rate
 *   API: mfn_rate, mfnRate, tariff_rate (inconsistent!)
 *   Frontend: mfnRate, savingsPercentage, section301
 *   AI: tariffRate, appliedDuties, savings_percentage
 *
 * Result: Developers add a field name and break 15 files
 *         Frontend expects "mfnRate" but API sends "mfn_rate" = undefined
 *         Database returns string "25.00" but calculator expects number 25
 *
 * Solution: ONE file defines:
 *   1. What the REAL field name is (database source of truth)
 *   2. How each layer names it (API, frontend, AI)
 *   3. How to transform between them
 *   4. What type it should be
 *   5. Validation rules for that field
 *
 * USAGE:
 *   const schema = COMPONENT_DATA_CONTRACT.fields.mfn_rate;
 *   const apiValue = transform(dbValue, 'database', 'api');
 *   const validated = schema.validate(value);
 */

export const COMPONENT_DATA_CONTRACT = {
  /**
   * All component fields with their transformations across layers
   * THIS IS THE SINGLE SOURCE OF TRUTH
   */
  fields: {
    // ==================== IDENTIFICATION FIELDS ====================
    description: {
      // What the field represents
      label: 'Component Description',
      category: 'identification',

      // How each layer names this field
      names: {
        database: 'description',      // Table column name
        api: 'description',           // API request/response
        frontend: 'description',      // React component prop
        ai: 'component_name',         // What AI calls it in prompt
      },

      // Data type in each layer
      types: {
        database: 'TEXT',
        api: 'string',
        frontend: 'string',
        ai: 'string',
      },

      // Validation rules
      required: true,
      minLength: 3,
      maxLength: 255,

      // Transformation functions if needed
      transform: {
        database_to_api: (val) => val?.trim() || '',
        api_to_frontend: (val) => val || 'Unknown Component',
        ai_to_database: (val) => val?.substring(0, 255) || '',
      },
    },

    // ==================== TARIFF RATE FIELDS ====================
    mfn_rate: {
      label: 'Most Favored Nation Rate',
      category: 'tariff',
      description: 'Base duty rate before any tariffs/agreements applied',

      names: {
        database: 'mfn_rate',
        api: 'mfn_rate',
        frontend: 'mfnRate',
        ai: 'base_mfn_rate',
      },

      types: {
        database: 'NUMERIC(5,2)',     // 25.00 as percentage string
        api: 'number',                 // 0.25 as decimal in API!
        frontend: 'number',            // 0.25 - frontend multiplies by 100 for display
        ai: 'number',                  // 25 as percentage (from AI prompt)
      },

      required: true,
      minValue: 0,
      maxValue: 1,  // 0-1 range (0.25 = 25%)

      transform: {
        database_to_api: (val) => {
          // Database: "25.00" → API: 0.25 (divide by 100)
          const num = parseFloat(val);
          if (isNaN(num)) throw new Error(`Invalid MFN rate: ${val}`);
          return num / 100;  // Convert percentage to decimal for API
        },
        api_to_frontend: (val) => {
          // API: 0.25 → Frontend: 0.25 (no change, frontend multiplies by 100 for display)
          if (val === undefined || val === null) return 0;
          const num = parseFloat(val);
          return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 1);  // Clamp 0-1
        },
        ai_to_database: (val) => {
          // AI: 25 → Database: 25.00 (AI sends percentages, database stores percentages)
          const num = parseFloat(val);
          if (isNaN(num)) return 0;
          return Math.min(Math.max(num, 0), 100);  // Clamp 0-100 percentages
        },
      },

      example: 0.025,  // 0.025 = 2.5% in API format
      fallback: 0,
      cache: true,  // Can be cached after lookup
      note: 'CRITICAL: Frontend expects decimal (0.25 = 25%), multiplies by 100 for display'
    },

    usmca_rate: {
      label: 'USMCA Preferential Rate',
      category: 'tariff',
      description: 'Duty rate after USMCA qualification (usually lower than MFN)',

      names: {
        database: 'usmca_rate',
        api: 'usmca_rate',
        frontend: 'usmcaRate',
        ai: 'usmca_rate',
      },

      types: {
        database: 'NUMERIC(5,2)',
        api: 'number',
        frontend: 'number',
        ai: 'number',
      },

      required: true,
      minValue: 0,
      maxValue: 1,  // 0-1 range (0.25 = 25%)

      transform: {
        database_to_api: (val) => {
          // Database: "25.00" → API: 0.25 (divide by 100)
          const num = parseFloat(val);
          if (isNaN(num)) throw new Error(`Invalid USMCA rate: ${val}`);
          return num / 100;
        },
        api_to_frontend: (val) => {
          // API: 0.25 → Frontend: 0.25 (no change)
          if (val === undefined || val === null) return 0;
          const num = parseFloat(val);
          return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 1);
        },
        ai_to_database: (val) => {
          // AI: 25 → Database: 25.00
          const num = parseFloat(val);
          if (isNaN(num)) return 0;
          return Math.min(Math.max(num, 0), 100);
        },
      },

      example: 0,
      fallback: 0,
      cache: true,
      note: 'API format is decimal (0-1), frontend multiplies by 100 for display'
    },

    section_301: {
      label: 'Section 301 Tariff',
      category: 'policy',
      description: 'Additional punitive tariff on China-origin components (25% typical)',

      names: {
        database: 'section_301',
        api: 'section_301',
        frontend: 'section301',
        ai: 'section_301_tariff',
      },

      types: {
        database: 'NUMERIC(5,2)',
        api: 'number',
        frontend: 'number',
        ai: 'number',
      },

      required: false,  // Not always applicable
      minValue: 0,
      maxValue: 1,  // 0-1 range (0.25 = 25%)

      transform: {
        database_to_api: (val) => {
          // Database: "25.00" → API: 0.25 (divide by 100)
          const num = parseFloat(val || 0);
          return isNaN(num) ? 0 : num / 100;
        },
        api_to_frontend: (val) => {
          // API: 0.25 → Frontend: 0.25 (no change, frontend multiplies by 100 for display)
          if (val === undefined || val === null) return 0;
          const num = parseFloat(val);
          return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 1);  // Clamp 0-1
        },
        ai_to_database: (val) => {
          // AI: 25 → Database: 25.00 (AI sends percentages, database stores percentages)
          const num = parseFloat(val || 0);
          return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 100);
        },
      },

      example: 0.25,  // 0.25 = 25% in API format
      fallback: 0,
      cache: true,
      applies_when: 'origin_country === "CN" && destination_country === "US"',
      note: 'CRITICAL: Frontend expects decimal (0.25 = 25%), multiplies by 100 for display',
    },

    section_232: {
      label: 'Section 232 Steel/Aluminum Tariff',
      category: 'policy',
      description: 'Additional tariff on steel/aluminum safeguard (varies by material)',

      names: {
        database: 'section_232',
        api: 'section_232',
        frontend: 'section232',
        ai: 'section_232_tariff',
      },

      types: {
        database: 'NUMERIC(5,2)',
        api: 'number',
        frontend: 'number',
        ai: 'number',
      },

      required: false,
      minValue: 0,
      maxValue: 1,  // 0-1 range (0.25 = 25%)

      transform: {
        database_to_api: (val) => {
          // Database: "25.00" → API: 0.25 (divide by 100)
          const num = parseFloat(val || 0);
          return isNaN(num) ? 0 : num / 100;
        },
        api_to_frontend: (val) => {
          // API: 0.25 → Frontend: 0.25 (no change, frontend multiplies by 100 for display)
          if (val === undefined || val === null) return 0;
          const num = parseFloat(val);
          return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 1);  // Clamp 0-1
        },
        ai_to_database: (val) => {
          // AI: 25 → Database: 25.00 (AI sends percentages, database stores percentages)
          const num = parseFloat(val || 0);
          return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 100);
        },
      },

      example: 0.25,  // 0.25 = 25% in API format
      fallback: 0,
      cache: true,
      note: 'CRITICAL: Frontend expects decimal (0.25 = 25%), multiplies by 100 for display',
    },

    total_rate: {
      label: 'Total Applied Rate',
      category: 'tariff',
      description: 'Sum of all duties: MFN + Section 301 + Section 232 + other policies',

      names: {
        database: 'total_rate',
        api: 'total_rate',
        frontend: 'totalRate',
        ai: 'total_tariff_rate',
      },

      types: {
        database: 'NUMERIC(5,2)',
        api: 'number',
        frontend: 'number',
        ai: 'number',
      },

      required: true,
      calculated: true,  // Always calculated from components
      formula: 'mfn_rate + section_301 + section_232 + other_policies',
      minValue: 0,
      maxValue: 1,  // 0-1 range (0.25 = 25%)

      transform: {
        database_to_api: (val) => {
          // Database: "25.00" → API: 0.25 (divide by 100)
          const num = parseFloat(val || 0);
          return isNaN(num) ? 0 : num / 100;
        },
        api_to_frontend: (val) => {
          // API: 0.25 → Frontend: 0.25 (no change, frontend multiplies by 100 for display)
          if (val === undefined || val === null) return 0;
          const num = parseFloat(val);
          return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 1);  // Clamp 0-1
        },
        ai_to_database: (val) => {
          // AI: 25 → Database: 25.00 (AI sends percentages, database stores percentages)
          const num = parseFloat(val || 0);
          return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 100);
        },
      },

      example: 0.275,  // 0.275 = 27.5% in API format
      fallback: 0,
      note: 'CRITICAL: Frontend expects decimal (0.275 = 27.5%), multiplies by 100 for display',
    },

    savings_percentage: {
      label: 'Tariff Savings %',
      category: 'financial',
      description: 'Percentage savings from USMCA qualification: (MFN - USMCA) / MFN × 100',

      names: {
        database: 'savings_percentage',
        api: 'savings_percentage',
        frontend: 'savingsPercentage',
        ai: 'tariff_savings_percent',
      },

      types: {
        database: 'NUMERIC(5,2)',
        api: 'number',
        frontend: 'number',
        ai: 'number',
      },

      required: true,
      calculated: true,
      formula: '(mfn_rate - usmca_rate) / mfn_rate × 100',
      minValue: 0,
      maxValue: 1,  // 0-1 range (1.0 = 100% savings)

      transform: {
        database_to_api: (val) => {
          // Database: "100.00" → API: 1.0 (divide by 100)
          const num = parseFloat(val || 0);
          return isNaN(num) ? 0 : num / 100;
        },
        api_to_frontend: (val) => {
          // API: 1.0 → Frontend: 1.0 (no change, frontend multiplies by 100 for display)
          if (val === undefined || val === null) return 0;
          const num = parseFloat(val);
          return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 1);  // Clamp 0-1
        },
        ai_to_database: (val) => {
          // AI: 100 → Database: 100.00 (AI sends percentages, database stores percentages)
          const num = parseFloat(val || 0);
          return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 100);
        },
      },

      example: 1.0,  // 1.0 = 100% savings in API format
      fallback: 0,
      note: 'CRITICAL: Frontend expects decimal (1.0 = 100%), multiplies by 100 for display',
    },

    // ==================== COMPONENT INFO FIELDS ====================
    origin_country: {
      label: 'Country of Origin',
      category: 'location',

      names: {
        database: 'origin_country',
        api: 'origin_country',
        frontend: 'originCountry',
        ai: 'origin_country',
      },

      types: {
        database: 'VARCHAR(2)',  // ISO country codes
        api: 'string',
        frontend: 'string',
        ai: 'string',
      },

      required: true,
      pattern: /^[A-Z]{2}$/,  // ISO 3166-1 alpha-2

      transform: {
        database_to_api: (val) => val?.toUpperCase() || '',
        api_to_frontend: (val) => val?.toUpperCase() || 'UNKNOWN',
        ai_to_database: (val) => val?.toUpperCase().substring(0, 2) || '',
      },

      example: 'CN',
      fallback: 'XX',
    },

    value_percentage: {
      label: 'Component Value %',
      category: 'composition',
      description: 'What percentage of product value is this component',

      names: {
        database: 'value_percentage',
        api: 'value_percentage',
        frontend: 'valuePercentage',
        ai: 'component_value_percentage',
      },

      types: {
        database: 'NUMERIC(5,2)',
        api: 'number',
        frontend: 'number',
        ai: 'number',
      },

      required: true,
      minValue: 0,
      maxValue: 100,

      transform: {
        database_to_api: (val) => parseFloat(val || 0),
        api_to_frontend: (val) => parseFloat(val || 0),
        ai_to_database: (val) => {
          const num = parseFloat(val || 0);
          return Math.min(Math.max(num, 0), 100);
        },
      },

      example: 35,  // 35% of product value
      fallback: 0,
    },

    hs_code: {
      label: 'HS Code',
      category: 'classification',
      description: 'Harmonized System code (10-digit tariff classification)',

      names: {
        database: 'hs_code',
        api: 'hs_code',
        frontend: 'hsCode',
        ai: 'hs_code',
      },

      types: {
        database: 'VARCHAR(10)',
        api: 'string',
        frontend: 'string',
        ai: 'string',
      },

      required: true,
      pattern: /^\d{10}$/,  // 10 digits (after normalization)

      transform: {
        database_to_api: (val) => {
          // Database: "8542.31.00" → API: "8542310000" (remove dots, pad to 10)
          const clean = val?.replace(/\D/g, '') || '0000000000';
          // Pad with zeros if less than 10 digits
          return clean.padEnd(10, '0').substring(0, 10);
        },
        api_to_frontend: (val) => {
          // ✅ FIX (Oct 28): Keep 10-digit format without adding dots
          // Dots are added only for DISPLAY via CSS/formatting, not in data
          // This prevents validation failures: /^\d{10}$/ expects pure digits
          if (!val) return '';
          const clean = val.replace(/\D/g, '').padEnd(10, '0').substring(0, 10);
          return clean;  // Return as 10 digits, no dots
        },
        ai_to_database: (val) => {
          // AI: "85423100" or "8542.31.00" → Database: "8542310000" (10-digit, no dots)
          const clean = val?.replace(/\D/g, '') || '0000000000';
          // Pad with zeros if less than 10 digits (AI sometimes returns 8-digit)
          return clean.padEnd(10, '0').substring(0, 10);
        },
      },

      example: '8542.31.00',
      fallback: '0000000000',
    },

    ai_confidence: {
      label: 'AI Confidence Score',
      category: 'metadata',
      description: 'How confident the AI is in this classification (0.0-1.0)',

      names: {
        database: 'ai_confidence',
        api: 'ai_confidence',
        frontend: 'confidence',
        ai: 'confidence_score',
      },

      types: {
        database: 'NUMERIC(3,2)',  // 0.00 to 1.00
        api: 'number',
        frontend: 'number',
        ai: 'number',
      },

      required: false,
      minValue: 0,
      maxValue: 1,

      transform: {
        database_to_api: (val) => parseFloat(val || 0),
        api_to_frontend: (val) => {
          const num = parseFloat(val || 0);
          // Display as percentage (0.85 → 85%)
          return Math.round(num * 100);
        },
        ai_to_database: (val) => {
          const num = parseFloat(val || 0);
          return Math.min(Math.max(num, 0), 1);
        },
      },

      example: 0.92,
      fallback: 0.5,
    },

    // ==================== CRITICAL MISSING FIELDS ====================
    // THESE ARE USED BY FRONTEND BUT NOT RETURNED BY API
    // Bug discovered Oct 26, 2025: Frontend expects 29 fields, API returns 13
    // This caused undefined values displayed as empty/0

    base_mfn_rate: {
      label: 'Base MFN Rate (Before Policy)',
      category: 'tariff',
      description: 'MFN rate BEFORE Section 301/232 applied (for savings calculation)',

      names: {
        database: 'base_mfn_rate',
        api: 'base_mfn_rate',
        frontend: 'baseMfnRate',
        ai: 'base_mfn_rate',
      },

      types: {
        database: 'NUMERIC(5,2)',
        api: 'number',
        frontend: 'number',
        ai: 'number',
      },

      required: true,
      minValue: 0,
      maxValue: 1,  // 0-1 range (0.25 = 25%)

      transform: {
        database_to_api: (val) => {
          // Database: "25.00" → API: 0.25 (divide by 100)
          const num = parseFloat(val || 0);
          return isNaN(num) ? 0 : num / 100;
        },
        api_to_frontend: (val) => {
          // API: 0.25 → Frontend: 0.25 (no change, frontend multiplies by 100 for display)
          if (val === undefined || val === null) return 0;
          const num = parseFloat(val);
          return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 1);  // Clamp 0-1
        },
        ai_to_database: (val) => {
          // AI: 25 → Database: 25.00 (AI sends percentages, database stores percentages)
          const num = parseFloat(val || 0);
          return isNaN(num) ? 0 : Math.min(Math.max(num, 0), 100);
        },
      },

      note: 'CRITICAL: Should be same as mfn_rate in most cases, separated for clarity on savings. Frontend expects decimal (0.25 = 25%), multiplies by 100 for display',
      example: 0.025,  // 0.025 = 2.5% in API format
      fallback: 0,
    },

    rate_source: {
      label: 'Rate Data Source',
      category: 'metadata',
      description: 'Where the tariff rate came from (AI research vs database fallback vs stale)',

      names: {
        database: 'rate_source',
        api: 'rate_source',
        frontend: 'rate_source',
        ai: 'data_source',
      },

      types: {
        database: 'VARCHAR(50)',
        api: 'string',
        frontend: 'string',
        ai: 'string',
      },

      required: true,
      enum: [
        'openrouter_current',
        'anthropic_current',
        'database_cache_current',
        'database_fallback',  // Data from Jan 2025 or older
        'ai_enriched',
        'ai_research'
      ],

      transform: {
        database_to_api: (val) => val || 'database_cache',
        api_to_frontend: (val) => val || 'unknown',
        ai_to_database: (val) => val || 'ai_research',
      },

      example: 'openrouter_current',
      fallback: 'database_fallback',
      frontend_display: {
        'openrouter_current': { color: '#059669', label: '✓ Current 2025 (OpenRouter)' },
        'anthropic_current': { color: '#059669', label: '✓ Current 2025 (Anthropic)' },
        'database_cache_current': { color: '#059669', label: '✓ Current 2025 (Database)' },
        'database_fallback': { color: '#d97706', label: '⚠️ Jan 2025 data (cached)' },
        'ai_enriched': { color: '#059669', label: '✓ AI enhanced data' },
        'ai_research': { color: '#059669', label: '✓ AI research' }
      }
    },

    stale: {
      label: 'Data Is Stale',
      category: 'metadata',
      description: 'Flag indicating if data is from old cache (>6 months old)',

      names: {
        database: 'stale',
        api: 'stale',
        frontend: 'stale',
        ai: 'is_stale',
      },

      types: {
        database: 'BOOLEAN',
        api: 'boolean',
        frontend: 'boolean',
        ai: 'boolean',
      },

      required: true,

      transform: {
        database_to_api: (val) => !!val,
        api_to_frontend: (val) => !!val,
        ai_to_database: (val) => !!val,
      },

      note: 'Automatically calculated: rate_source === "database_fallback" || last_updated < 6 months ago',
      example: false,
      fallback: false,
    },

    data_source: {
      label: 'Complete Data Source Metadata',
      category: 'metadata',
      description: 'Detailed source of this record (USITC, USTR, database, AI analysis)',

      names: {
        database: 'data_source',
        api: 'data_source',
        frontend: 'dataSource',
        ai: 'data_source',
      },

      types: {
        database: 'TEXT',
        api: 'string',
        frontend: 'string',
        ai: 'string',
      },

      required: false,

      example: 'USITC October 2025 | USTR List 4A | Database cache',
      fallback: 'Unknown source',
    },

    ai_reasoning: {
      label: 'AI Reasoning for Classification',
      category: 'metadata',
      description: 'Explanation of why AI assigned this HS code and tariff rates',

      names: {
        database: 'ai_reasoning',
        api: 'ai_reasoning',
        frontend: 'ai_reasoning',
        ai: 'reasoning',
      },

      types: {
        database: 'TEXT',
        api: 'string',
        frontend: 'string',
        ai: 'string',
      },

      required: false,

      example: 'Classified as semiconductor based on function and complexity. MFN rate 0% under ITA agreement.',
      fallback: '',
    },

    alternative_codes: {
      label: 'Alternative HS Codes',
      category: 'classification',
      description: 'Other possible HS codes if classification is uncertain',

      names: {
        database: 'alternative_codes',
        api: 'alternative_codes',
        frontend: 'alternative_codes',
        ai: 'alternative_codes',
      },

      types: {
        database: 'JSONB',
        api: 'array',
        frontend: 'array',
        ai: 'array',
      },

      required: false,

      example: ['8542.32.00', '8542.39.00'],
      fallback: [],
    },

    classified_hs_code: {
      label: 'AI Classified HS Code',
      category: 'classification',
      description: 'HS code assigned by AI (may differ from user input)',

      names: {
        database: 'classified_hs_code',
        api: 'classified_hs_code',
        frontend: 'classified_hs_code',
        ai: 'assigned_hs_code',
      },

      types: {
        database: 'VARCHAR(10)',
        api: 'string',
        frontend: 'string',
        ai: 'string',
      },

      required: false,
      pattern: /^\d{10}$/,

      transform: {
        database_to_api: (val) => {
          // Database: "8542.31.00" → API: "8542310000" (remove dots, pad to 10)
          if (!val) return '';
          const clean = val.replace(/\D/g, '') || '0000000000';
          return clean.padEnd(10, '0').substring(0, 10);
        },
        api_to_frontend: (val) => {
          // API: "8542310000" → Frontend: "8542.31.00" (add dots for display)
          if (!val) return '';
          const clean = val.replace(/\D/g, '').padEnd(10, '0').substring(0, 10);
          return `${clean.substring(0, 4)}.${clean.substring(4, 6)}.${clean.substring(6, 10)}`;
        },
        ai_to_database: (val) => {
          // AI: "85423100" or "8542.31.00" → Database: "8542310000" (10-digit, no dots)
          if (!val) return '';
          const clean = val.replace(/\D/g, '') || '0000000000';
          return clean.padEnd(10, '0').substring(0, 10);
        },
      },

      example: '8542.31.00',
      fallback: '',
    },

    hs_description: {
      label: 'HS Code Description',
      category: 'classification',
      description: 'Official description of what this HS code covers',

      names: {
        database: 'hs_description',
        api: 'hs_description',
        frontend: 'hs_description',
        ai: 'hs_description',
      },

      types: {
        database: 'TEXT',
        api: 'string',
        frontend: 'string',
        ai: 'string',
      },

      required: false,

      example: 'Integrated circuits and microelectronic assemblies',
      fallback: '',
    },

    is_usmca_member: {
      label: 'Is USMCA Country',
      category: 'location',
      description: 'Quick check: is origin_country a USMCA member (US, CA, MX)',

      names: {
        database: 'is_usmca_member',
        api: 'is_usmca_member',
        frontend: 'is_usmca_member',
        ai: 'is_usmca_country',
      },

      types: {
        database: 'BOOLEAN',
        api: 'boolean',
        frontend: 'boolean',
        ai: 'boolean',
      },

      required: false,

      transform: {
        database_to_api: (val) => !!val,
        api_to_frontend: (val) => !!val,
        ai_to_database: (val) => !!val,
      },

      note: 'Automatically calculated from origin_country in [US, CA, MX]',
      example: true,
      fallback: false,
    },

    policy_adjustments: {
      label: 'Applied Tariff Policies',
      category: 'policy',
      description: 'List of policies applied (Section 301, 232, etc)',

      names: {
        database: 'policy_adjustments',
        api: 'policy_adjustments',
        frontend: 'policy_adjustments',
        ai: 'policy_adjustments',
      },

      types: {
        database: 'JSONB',
        api: 'array',
        frontend: 'array',
        ai: 'array',
      },

      required: false,

      example: ['Section 301 (China)', 'ITA exemption'],
      fallback: [],
    },
  },

  /**
   * Transform a value from one layer to another
   * @param {*} value - The value to transform
   * @param {string} fromLayer - Source layer (database, api, frontend, ai)
   * @param {string} toLayer - Target layer
   * @param {string} fieldName - Name of the field (database name)
   * @returns {*} Transformed value
   *
   * @example
   *   // Database returned "25.00", convert to frontend number
   *   transform("25.00", "database", "frontend", "mfn_rate")
   *   // Returns: 25.0
   */
  transform(value, fromLayer, toLayer, fieldName) {
    if (!this.fields[fieldName]) {
      throw new Error(`Unknown field: ${fieldName}`);
    }

    const field = this.fields[fieldName];
    const key = `${fromLayer}_to_${toLayer}`;

    if (!field.transform || !field.transform[key]) {
      // No transformation needed, return as-is
      return value;
    }

    try {
      return field.transform[key](value);
    } catch (error) {
      console.error(
        `❌ TRANSFORMATION FAILED: ${fieldName} from ${fromLayer} to ${toLayer}`,
        { value, error: error.message }
      );
      // Return fallback value
      return field.fallback !== undefined ? field.fallback : null;
    }
  },

  /**
   * Get the field name for a specific layer
   * @param {string} fieldName - Database field name
   * @param {string} layer - Target layer (api, frontend, ai)
   *
   * @example
   *   getFieldName("mfn_rate", "frontend")  // Returns "mfnRate"
   */
  getFieldName(fieldName, layer) {
    if (!this.fields[fieldName]) {
      return fieldName;  // Unknown field, return as-is
    }
    return this.fields[fieldName].names[layer] || fieldName;
  },

  /**
   * Validate a field value
   * @param {string} fieldName - Database field name
   * @param {*} value - Value to validate
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate(fieldName, value) {
    if (!this.fields[fieldName]) {
      return { valid: false, errors: [`Unknown field: ${fieldName}`] };
    }

    const field = this.fields[fieldName];
    const errors = [];

    // Check required
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field.label} is required`);
    }

    // Skip further validation if not required and empty
    if (!field.required && (value === undefined || value === null || value === '')) {
      return { valid: true, errors: [] };
    }

    // Check pattern
    if (field.pattern && typeof value === 'string') {
      if (!field.pattern.test(value)) {
        errors.push(
          `${field.label} does not match pattern ${field.pattern}. Got: "${value}"`
        );
      }
    }

    // Check min/max for numbers
    if (field.minValue !== undefined && typeof value === 'number') {
      if (value < field.minValue) {
        errors.push(
          `${field.label} must be >= ${field.minValue}. Got: ${value}`
        );
      }
    }

    if (field.maxValue !== undefined && typeof value === 'number') {
      if (value > field.maxValue) {
        errors.push(
          `${field.label} must be <= ${field.maxValue}. Got: ${value}`
        );
      }
    }

    // Check string lengths
    if (field.minLength !== undefined && typeof value === 'string') {
      if (value.length < field.minLength) {
        errors.push(
          `${field.label} must be at least ${field.minLength} characters. Got: ${value.length}`
        );
      }
    }

    if (field.maxLength !== undefined && typeof value === 'string') {
      if (value.length > field.maxLength) {
        errors.push(
          `${field.label} must be at most ${field.maxLength} characters. Got: ${value.length}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * DEBUG: Print the entire contract
   */
  print() {
    console.log('📋 COMPONENT DATA CONTRACT');
    console.log('===========================\n');

    Object.entries(this.fields).forEach(([key, field]) => {
      console.log(`Field: ${key}`);
      console.log(`  Label: ${field.label}`);
      console.log(`  Category: ${field.category}`);
      console.log(`  Names:`, field.names);
      console.log(`  Types:`, field.types);
      console.log(`  Required: ${field.required}`);
      if (field.example !== undefined) {
        console.log(`  Example: ${field.example}`);
      }
      console.log();
    });
  },
};

export default COMPONENT_DATA_CONTRACT;
