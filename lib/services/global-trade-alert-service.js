/**
 * global-trade-alert-service.js - Global Trade Alert API Integration
 * Professional trade policy monitoring for real-time tariff intelligence
 *
 * GTA provides structured data on:
 * - Tariff changes by country and HS code
 * - Trade policy interventions (Section 301, antidumping, subsidies)
 * - Country-specific measures affecting imports/exports
 * - Historical policy data with effective dates
 *
 * This service queries GTA API and populates tariff_policy_updates table
 * which automatically updates AI classification prompts with current 2025 policy context.
 *
 * API Documentation: https://api.globaltradealert.org/api/doc/
 * Account/API Keys: https://globaltradealert.org/account/api-keys
 */

import { createClient } from '@supabase/supabase-js';

const GTA_API_BASE = 'https://api.globaltradealert.org/api';
const GTA_API_KEY = process.env.GTA_API_KEY; // Set in Vercel environment variables

class GlobalTradeAlertService {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Fetch recent trade interventions affecting specified countries
   * Focus on tariff increases, antidumping, and other import barriers
   */
  async fetchRecentInterventions(options = {}) {
    const {
      countries = ['CN', 'MX', 'CA', 'VN', 'TH'], // China, Mexico, Canada, Vietnam, Thailand
      implementer = 'USA', // US measures affecting these countries
      daysBack = 30,
      limit = 50
    } = options;

    try {
      console.log(`🌍 Fetching GTA interventions for ${implementer} affecting ${countries.join(', ')} (last ${daysBack} days)`);

      // GTA API endpoint for interventions
      // See: https://api.globaltradealert.org/api/doc/#tag/GTA-Data/paths/~1interventions/get
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const params = new URLSearchParams({
        api_key: GTA_API_KEY,
        implementer: implementer, // Country implementing the measure
        affected: countries.join(','), // Countries affected
        date_from: startDate,
        date_to: endDate,
        limit: limit,
        intervention_type: 'tariff,antidumping,countervailing,import_ban,import_quota' // Focus on tariff measures
      });

      const response = await fetch(`${GTA_API_BASE}/interventions?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Triangle-Trade-Intelligence/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`GTA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ GTA: Fetched ${data.interventions?.length || 0} interventions`);

      return {
        success: true,
        interventions: data.interventions || [],
        metadata: data.metadata || {}
      };
    } catch (error) {
      console.error('❌ GTA API fetch error:', error);
      return {
        success: false,
        error: error.message,
        interventions: []
      };
    }
  }

  /**
   * Fetch HS code-specific tariff changes
   * This is critical for component enrichment accuracy
   */
  async fetchHSCodeTariffChanges(hsCodes = [], options = {}) {
    const {
      implementer = 'USA',
      daysBack = 60
    } = options;

    try {
      console.log(`📊 Fetching GTA tariff changes for HS codes: ${hsCodes.join(', ')}`);

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const params = new URLSearchParams({
        api_key: GTA_API_KEY,
        implementer: implementer,
        hs_codes: hsCodes.join(','),
        date_from: startDate,
        date_to: endDate,
        intervention_type: 'tariff'
      });

      const response = await fetch(`${GTA_API_BASE}/interventions?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Triangle-Trade-Intelligence/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`GTA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ GTA: Fetched ${data.interventions?.length || 0} HS code-specific tariff changes`);

      return {
        success: true,
        interventions: data.interventions || []
      };
    } catch (error) {
      console.error('❌ GTA HS code fetch error:', error);
      return {
        success: false,
        error: error.message,
        interventions: []
      };
    }
  }

  /**
   * Process GTA interventions and create tariff policy updates
   * This populates the tariff_policy_updates table which feeds into AI prompts
   */
  async processInterventionsIntoPolicyUpdates(interventions) {
    console.log(`🔄 Processing ${interventions.length} GTA interventions into policy updates...`);

    const policyUpdates = [];

    for (const intervention of interventions) {
      try {
        // Convert GTA intervention to our policy update format
        const policyUpdate = {
          title: intervention.title || intervention.description?.substring(0, 200),
          description: intervention.description || '',
          effective_date: intervention.date_implemented || new Date().toISOString().split('T')[0],

          policy_type: this.mapInterventionTypeToPolicyType(intervention.intervention_type),

          affected_countries: this.extractAffectedCountries(intervention),
          affected_hs_codes: intervention.hs_codes || [],

          tariff_adjustment: this.generateTariffAdjustmentText(intervention),
          adjustment_percentage: this.extractAdjustmentPercentage(intervention),

          prompt_text: this.generatePromptText(intervention),

          is_active: false, // Require admin approval before activating
          priority: this.calculatePriority(intervention),
          status: 'pending', // Pending admin review

          source_url: intervention.url || `https://www.globaltradealert.org/intervention/${intervention.id}`,
          source_feed_name: 'Global Trade Alert API',

          admin_notes: `GTA Intervention ID: ${intervention.id}, Type: ${intervention.intervention_type}, Implementer: ${intervention.implementer}`
        };

        // Check if this policy update already exists (by title + effective_date)
        const { data: existing } = await this.supabase
          .from('tariff_policy_updates')
          .select('id')
          .eq('title', policyUpdate.title)
          .eq('effective_date', policyUpdate.effective_date)
          .single();

        if (!existing) {
          // Insert new policy update
          const { data, error } = await this.supabase
            .from('tariff_policy_updates')
            .insert(policyUpdate)
            .select()
            .single();

          if (error) {
            console.error(`❌ Failed to insert policy update: ${error.message}`);
          } else {
            policyUpdates.push(data);
            console.log(`✅ Created policy update: ${policyUpdate.title}`);
          }
        } else {
          console.log(`⏭️  Policy update already exists: ${policyUpdate.title}`);
        }
      } catch (error) {
        console.error(`❌ Error processing intervention ${intervention.id}:`, error);
      }
    }

    console.log(`✅ Created ${policyUpdates.length} new policy updates from GTA data`);

    return {
      success: true,
      created_count: policyUpdates.length,
      policy_updates: policyUpdates
    };
  }

  /**
   * Map GTA intervention types to our policy types
   */
  mapInterventionTypeToPolicyType(gtaType) {
    const typeMap = {
      'tariff': 'section_301', // Most US tariff increases are Section 301
      'antidumping': 'antidumping',
      'countervailing': 'countervailing',
      'import_ban': 'investigation',
      'import_quota': 'investigation',
      'subsidy': 'bilateral_deal',
      'export_subsidy': 'bilateral_deal'
    };

    return typeMap[gtaType] || 'other';
  }

  /**
   * Extract affected countries from GTA intervention
   */
  extractAffectedCountries(intervention) {
    // GTA provides affected_jurisdictions array
    if (Array.isArray(intervention.affected_jurisdictions)) {
      return intervention.affected_jurisdictions.map(j => j.iso_code || j).filter(Boolean);
    }

    // Fallback to parsing description
    const countries = [];
    const countryKeywords = {
      'CN': ['china', 'chinese'],
      'MX': ['mexico', 'mexican'],
      'CA': ['canada', 'canadian'],
      'VN': ['vietnam', 'vietnamese'],
      'TH': ['thailand', 'thai'],
      'KR': ['korea', 'korean', 'south korea'],
      'JP': ['japan', 'japanese']
    };

    const text = (intervention.title + ' ' + intervention.description).toLowerCase();

    for (const [code, keywords] of Object.entries(countryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        countries.push(code);
      }
    }

    return countries.length > 0 ? countries : ['CN']; // Default to China if unclear
  }

  /**
   * Generate human-readable tariff adjustment text
   */
  generateTariffAdjustmentText(intervention) {
    const country = intervention.affected_jurisdictions?.[0] || 'Affected Countries';
    const type = intervention.intervention_type || 'tariff';

    if (intervention.tariff_rate_change) {
      return `${country}: ${type} +${intervention.tariff_rate_change}%`;
    }

    return `${country}: ${type} measure implemented`;
  }

  /**
   * Extract numeric adjustment percentage from intervention
   */
  extractAdjustmentPercentage(intervention) {
    if (intervention.tariff_rate_change) {
      return parseFloat(intervention.tariff_rate_change);
    }

    // Try parsing from description
    const percentMatch = intervention.description?.match(/(\d+(?:\.\d+)?)\s*%/);
    if (percentMatch) {
      return parseFloat(percentMatch[1]);
    }

    return null;
  }

  /**
   * Generate AI prompt text from intervention
   */
  generatePromptText(intervention) {
    const country = intervention.affected_jurisdictions?.[0] || 'target countries';
    const type = intervention.intervention_type || 'trade measure';
    const date = intervention.date_implemented || 'recently';

    return `${type.toUpperCase()}: ${intervention.title} - Effective ${date}, affects ${country}. ${intervention.description?.substring(0, 300)}`;
  }

  /**
   * Calculate priority based on intervention characteristics
   */
  calculatePriority(intervention) {
    // Priority 1-3: High impact measures (tariffs >25%, Section 301)
    if (intervention.tariff_rate_change > 25 || intervention.intervention_type === 'tariff') {
      return 1;
    }

    // Priority 4-6: Medium impact (antidumping, countervailing)
    if (['antidumping', 'countervailing'].includes(intervention.intervention_type)) {
      return 4;
    }

    // Priority 7-10: Low impact (investigations, quotas)
    return 7;
  }

  /**
   * Main polling function - call this from cron job
   */
  async pollAndUpdate(options = {}) {
    console.log('🌍 Starting GTA API poll for tariff policy updates...');

    try {
      // Fetch recent interventions
      const result = await this.fetchRecentInterventions(options);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Process into policy updates
      const processed = await this.processInterventionsIntoPolicyUpdates(result.interventions);

      return {
        success: true,
        message: `GTA poll complete: ${result.interventions.length} interventions fetched, ${processed.created_count} new policy updates created`,
        interventions_fetched: result.interventions.length,
        policy_updates_created: processed.created_count,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ GTA polling error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default new GlobalTradeAlertService();
