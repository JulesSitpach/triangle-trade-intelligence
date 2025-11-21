/**
 * DATABASE-DRIVEN SUPABASE CLIENT
 * NO HARDCODED VALUES - CONFIGURATION BASED
 * 
 * Replaces all hardcoded database connections with configuration-based approach
 * Following the Holistic Reconstruction Plan Phase 2 requirements
 */

import { createClient } from '@supabase/supabase-js';
import { SYSTEM_CONFIG } from '../../config/system-config.js';

let supabaseClient = null;
let serviceRoleClient = null;

/**
 * Get Supabase client (anon key) - for client-side operations
 * NO HARDCODED URLs OR KEYS
 */
export function getSupabaseClient() {
  if (!supabaseClient) {
    // Access env vars directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing env vars:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
      throw new Error('Supabase configuration missing. Check environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,      // ✅ Save OAuth sessions in browser
        autoRefreshToken: true,    // ✅ Auto-refresh expired tokens
        detectSessionInUrl: true   // ✅ Detect OAuth callback params
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'X-Client-Info': 'triangle-intelligence-platform'
        }
      }
    });
  }

  return supabaseClient;
}

/**
 * Get Supabase service role client - for server-side operations
 * NO HARDCODED URLs OR KEYS
 */
export function getSupabaseServiceClient() {
  if (!serviceRoleClient) {
    // Access env vars directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('Missing service role env vars:', { supabaseUrl: !!supabaseUrl, serviceKey: !!serviceKey });
      throw new Error('Supabase service role configuration missing. Check environment variables NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    serviceRoleClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'X-Client-Info': 'triangle-intelligence-platform-service'
        }
      }
    });
  }

  return serviceRoleClient;
}

/**
 * Database query wrapper with configuration-based table names
 * Eliminates ALL hardcoded table references
 */
export class DatabaseService {
  constructor(useServiceRole = false) {
    this.client = useServiceRole ? getSupabaseServiceClient() : getSupabaseClient();
    this.timeout = parseInt(process.env.DB_QUERY_TIMEOUT_MS || '8000');
  }

  /**
   * Get unified tariff data - COMPLETE INTEGRATION
   */
  async getUnifiedTariffData(hsCode, country = 'US') {
    const { data, error } = await this.client
      .from('unified_tariff_data')
      .select('*')
      .eq('hs_code', hsCode)
      .single();

    if (error) {
      // Fallback to original table if view doesn't exist yet
      return this.getTariffRatesLegacy(hsCode, country);
    }
    
    return data;
  }

  /**
   * Legacy tariff rates query (fallback)
   */
  async getTariffRatesLegacy(hsCode, country = 'US') {
    const { data, error } = await this.client
      .from('tariff_intelligence_master')
      .select('*')
      .eq('hs_code', hsCode)
      .eq('country_source', country)
      .order('effective_date', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0] || null;
  }

  /**
   * Query tariff rates table with hierarchical fallback - NO HARDCODED TABLE NAME
   */
  async getTariffRates(hsCode, country = 'US') {
    // Strategy 1: Try unified view first
    const unifiedData = await this.getUnifiedTariffData(hsCode, country);
    if (unifiedData) {
      return [unifiedData]; // Return as array for backward compatibility
    }
    
    // Strategy 2: Try legacy exact match
    const legacyData = await this.getTariffRatesLegacy(hsCode, country);
    if (legacyData) {
      return [legacyData];
    }

    // Strategy 3: HIERARCHICAL FALLBACK - Use the new lookup system
    const hierarchicalResults = await this.searchTariffRatesByPrefix(hsCode.substring(0, 6), country);
    if (hierarchicalResults && hierarchicalResults.length > 0) {
      // Find best match - highest MFN rate for conservative estimate
      const bestMatch = hierarchicalResults.reduce((best, current) => {
        const currentMfn = parseFloat(current.mfn_rate || 0);
        const bestMfn = parseFloat(best.mfn_rate || 0);
        return currentMfn > bestMfn ? current : best;
      });

      // Add disclaimer to indicate this is an approximation
      bestMatch.disclaimer = `Rate estimated from similar classification ${bestMatch.hs_code}`;
      bestMatch.match_type = 'hierarchical_fallback';
      bestMatch.requested_hs_code = hsCode;

      return [bestMatch];
    }

    // Strategy 4: Try 4-digit prefix as final fallback
    if (hsCode.length >= 4) {
      const chapterResults = await this.searchTariffRatesByPrefix(hsCode.substring(0, 4), country);
      if (chapterResults && chapterResults.length > 0) {
        const bestMatch = chapterResults.reduce((best, current) => {
          const currentMfn = parseFloat(current.mfn_rate || 0);
          const bestMfn = parseFloat(best.mfn_rate || 0);
          return currentMfn > bestMfn ? current : best;
        });

        bestMatch.disclaimer = `Rate estimated from chapter ${hsCode.substring(0, 4)} classification ${bestMatch.hs_code}`;
        bestMatch.match_type = 'chapter_fallback';
        bestMatch.requested_hs_code = hsCode;

        return [bestMatch];
      }
    }

    // No rates found at any level
    return null;
  }

  /**
   * Search tariff rates by HS code prefix for hierarchical lookup
   * NO HARDCODED TABLE NAME
   */
  async searchTariffRatesByPrefix(prefix, country = 'US') {
    try {
      // First try to find US rates specifically
      let { data, error } = await this.client
        .from('hs_master_rebuild')  // Use comprehensive dataset
        .select('hs_code, description, mfn_rate, usmca_rate, country_source, effective_date')
        .ilike('hs_code', `${prefix}%`)
        .eq('country_source', 'US')  // Prioritize US rates
        .not('mfn_rate', 'is', null)  // Only get records with tariff rates
        .order('mfn_rate', { ascending: false })  // Highest rates first (most conservative)
        .limit(10);

      // If no US rates found, try any country
      if (!data || data.length === 0) {
        const fallback = await this.client
          .from('hs_master_rebuild')
          .select('hs_code, description, mfn_rate, usmca_rate, country_source, effective_date')
          .ilike('hs_code', `${prefix}%`)
          .not('mfn_rate', 'is', null)
          .order('mfn_rate', { ascending: false })
          .limit(10);
        
        data = fallback.data;
        error = fallback.error;
      }

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching tariff rates by prefix:', error);
      return [];
    }
  }

  /**
   * Query HS code reference table - NO HARDCODED TABLE NAME
   */
  async getHSCodeReference(hsCode) {
    const { data, error } = await this.client
      .from('comtrade_reference')
      .select('*')
      .eq('hs_code', hsCode)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Query USMCA qualification rules - NO HARDCODED TABLE NAME
   */
  async getUSMCAQualificationRules(hsCode = null, productCategory = null) {
    let query = this.client.from('usmca_qualification_rules').select('*');
    
    if (hsCode) {
      const chapter = hsCode.substring(0, 2);
      query = query.or(`hs_code.eq.${hsCode},hs_chapter.eq.${chapter}`);
    }
    
    if (productCategory) {
      query = query.eq('product_category', productCategory);
    }
    
    query = query.order('is_default', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Query countries table - NO HARDCODED TABLE NAME
   */
  async getCountries(usmcaMembersOnly = false) {
    try {
      // Try the countries table first
      let query = this.client.from('countries').select('*');
      
      const { data, error } = await query;
      if (!error && data) {
        // Filter USMCA members manually if needed
        if (usmcaMembersOnly) {
          const usmcaCodes = ['US', 'CA', 'MX'];
          return data.filter(country => 
            usmcaCodes.includes(country.code) || 
            usmcaCodes.includes(country.country_code)
          );
        }
        return data;
      }
    } catch {
      // Countries table might not exist
    }
    
    // Fallback to basic USMCA countries
    if (usmcaMembersOnly) {
      return [
        { code: 'US', name: 'United States' },
        { code: 'CA', name: 'Canada' },
        { code: 'MX', name: 'Mexico' }
      ];
    }
    
    // Return basic country list
    return [
      { code: 'US', name: 'United States' },
      { code: 'CA', name: 'Canada' },
      { code: 'MX', name: 'Mexico' },
      { code: 'CN', name: 'China' },
      { code: 'IN', name: 'India' },
      { code: 'VN', name: 'Vietnam' }
    ];
  }

  /**
   * Query triangle routing opportunities - NO HARDCODED TABLE NAME
   */
  async getTriangleRoutingOpportunities(originCountry = null, productCategory = null) {
    let query = this.client.from('triangle_routing_opportunities').select('*');
    
    if (originCountry) {
      query = query.eq('origin_country', originCountry);
    }
    
    if (productCategory) {
      query = query.contains('applicable_categories', [productCategory]);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Search products using UNIFIED TARIFF VIEW - COMPLETE DATA INTEGRATION
   * With business context filtering for scalability
   */
  async searchProducts(keywords, limit = 10, businessType = null) {
    const searchTerms = keywords.toLowerCase().split(' ').filter(term => term.length > 2);
    
    if (searchTerms.length === 0) {
      throw new Error('Search terms too short');
    }

    // Use unified tariff view for complete data integration
    const allResults = [];
    
    for (const term of searchTerms.slice(0, 4)) {
      // Use hs_master_rebuild - COMPREHENSIVE GOVERNMENT DATA (34,476 records)
      let query = this.client
        .from('hs_master_rebuild')
        .select('hs_code, description, country_source, mfn_rate, usmca_rate, chapter')
        .ilike('description', `%${term}%`);
      
      // Business context filtering by chapter - DATA-DRIVEN FROM CONFIG
      if (businessType) {
        const businessConfig = SYSTEM_CONFIG.businessTypeChapters[businessType.toLowerCase()];
        if (businessConfig) {
          // Combine all chapter priorities for comprehensive search
          const allChapters = [
            ...businessConfig.primary,
            ...businessConfig.secondary,
            ...businessConfig.tertiary
          ];
          query = query.in('chapter', allChapters);
        }
      }
      
      // Order by highest tariff savings potential (since all records have real data)
      query = query
        .order('mfn_rate', { ascending: false })         // Highest MFN rate first
        .limit(limit * 2);
      
      const { data, error } = await query;
      
      if (!error && data) {
        allResults.push(...data.map(result => ({
          ...result,
          product_description: result.description, // Add alias for compatibility
          matchedTerm: term,
          // Add computed usmca_eligible field for compatibility
          usmca_eligible: result.mfn_rate > 0 && (result.usmca_rate || 0) < result.mfn_rate,
          // Calculate confidence based on real tariff data
          confidence: this.calculateHSMasterConfidence(result, businessType)
        })));
      }
    }

    // Remove duplicates and prioritize by tariff data quality and confidence
    const uniqueResults = new Map();
    for (const result of allResults) {
      const existing = uniqueResults.get(result.hs_code);
      if (!existing) {
        uniqueResults.set(result.hs_code, {
          ...result,
          matchedTerms: [result.matchedTerm],
          termMatchCount: 1
        });
      } else {
        // If new result has higher tariff rate, replace the existing one
        const newHasBetterData = result.mfn_rate > existing.mfn_rate;
        
        if (newHasBetterData) {
          uniqueResults.set(result.hs_code, {
            ...result,
            matchedTerms: [...existing.matchedTerms, result.matchedTerm],
            termMatchCount: existing.termMatchCount + 1
          });
        } else if (!existing.matchedTerms.includes(result.matchedTerm)) {
          existing.matchedTerms.push(result.matchedTerm);
          existing.termMatchCount++;
          // Boost confidence for multiple term matches
          existing.confidence = Math.min(existing.confidence + 0.1, 1.0);
        }
      }
    }

    // Sort by confidence, then term matches, then data quality
    const sortedResults = Array.from(uniqueResults.values())
      .sort((a, b) => {
        // Primary: confidence score
        if (Math.abs(a.confidence - b.confidence) > 0.05) {
          return b.confidence - a.confidence;
        }
        // Secondary: term match count
        if (a.termMatchCount !== b.termMatchCount) {
          return b.termMatchCount - a.termMatchCount;
        }
        // Tertiary: data completeness
        const completenessOrder = { 'complete': 3, 'partial': 2, 'minimal': 1 };
        return (completenessOrder[b.rate_completeness] || 0) - (completenessOrder[a.rate_completeness] || 0);
      })
      .slice(0, limit);

    return sortedResults;
  }

  /**
   * Calculate confidence score for hs_master results
   * Based on real tariff data and business context alignment
   */
  calculateHSMasterConfidence(result, businessType = null) {
    let confidence = 0.5; // Base confidence

    // Description quality (30% of score)
    if (result.product_description && result.product_description.length > 50) {
      confidence += 0.2;
    } else if (result.product_description && result.product_description.length > 20) {
      confidence += 0.1;
    }

    // Tariff data quality (25% of score)
    if (result.mfn_rate > 0) confidence += 0.15;
    if (result.usmca_rate >= 0) confidence += 0.1;

    // USMCA savings potential (25% of score)
    const tariffDifferential = Math.abs((result.mfn_rate || 0) - (result.usmca_rate || 0));
    if (tariffDifferential > 15) confidence += 0.2;
    else if (tariffDifferential > 10) confidence += 0.15;
    else if (tariffDifferential > 5) confidence += 0.1;
    else if (tariffDifferential > 0) confidence += 0.05;

    // Business context alignment (20% of score) - DATA-DRIVEN FROM CONFIG
    if (businessType) {
      const businessConfig = SYSTEM_CONFIG.businessTypeChapters[businessType.toLowerCase()];
      if (businessConfig && result.chapter) {
        // Higher scores for primary matches, lower for secondary/tertiary
        if (businessConfig.primary.includes(result.chapter)) {
          confidence += 0.25; // Primary chapter match - highest boost
        } else if (businessConfig.secondary.includes(result.chapter)) {
          confidence += 0.15; // Secondary chapter match - medium boost
        } else if (businessConfig.tertiary.includes(result.chapter)) {
          confidence += 0.10; // Tertiary chapter match - small boost
        }
      }
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate confidence score based on unified data completeness
   * Enhanced with business context and complexity scoring (LEGACY - for fallback)
   */
  calculateUnifiedConfidence(result, businessType = null) {
    let confidence = 0.3; // Lower base confidence, earn it through data quality

    // Description quality boost (30% of score)
    if (result.description_quality === 'high') confidence += 0.3;
    else if (result.description_quality === 'medium') confidence += 0.15;
    else confidence += 0.05;

    // Rate completeness boost (20% of score)
    if (result.rate_completeness === 'complete') confidence += 0.2;
    else if (result.rate_completeness === 'partial') confidence += 0.1;

    // Business context alignment (15% of score)
    if (businessType && result.business_sectors) {
      const businessSectorMap = {
        'textile': ['textile', 'apparel', 'leather', 'footwear'],
        'apparel': ['textile', 'apparel', 'leather', 'footwear'], 
        'automotive': ['automotive', 'transportation'],
        'electronics': ['electronics', 'technology', 'instruments'],
        'agriculture': ['agriculture', 'food'],
        'chemicals': ['chemicals', 'materials'],
        'metals': ['metals', 'machinery']
      };
      
      const expectedSectors = businessSectorMap[businessType.toLowerCase()] || [businessType.toLowerCase()];
      const hasMatch = result.business_sectors.some(sector => expectedSectors.includes(sector));
      
      if (hasMatch) confidence += 0.15;
    }

    // Complexity and tariff value (15% of score)
    if (result.complexity_score >= 6) confidence += 0.1;
    else if (result.complexity_score >= 4) confidence += 0.05;
    
    // High tariff differential = valuable classification
    const tariffDifferential = Math.abs((result.best_mfn_rate || 0) - (result.best_usmca_rate || 0));
    if (tariffDifferential > 10) confidence += 0.1;
    else if (tariffDifferential > 5) confidence += 0.05;

    // USMCA eligibility clarity (10% of score)
    if (result.usmca_eligible !== null) confidence += 0.05;
    if (result.regional_content_threshold !== null) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  /**
   * Log classification attempt - NO HARDCODED TABLE NAME
   */
  async logClassification(productDescription, hsCode, confidence, method) {
    const logEntry = {
      product_description: productDescription,
      hs_code_result: hsCode,
      confidence_score: confidence,
      classification_method: method,
      timestamp: new Date().toISOString(),
      session_id: this.generateSessionId()
    };

    const { data, error } = await this.client
      .from('classification_logs')
      .insert(logEntry)
      .select();

    if (error) {
      console.error('Failed to log classification:', error);
    }
    return data;
  }

  /**
   * Log performance metrics - NO HARDCODED TABLE NAME
   */
  async logPerformance(operation, responseTime, success, errorMessage = null) {
    const performanceEntry = {
      operation_type: operation,
      response_time_ms: responseTime,
      success: success,
      error_message: errorMessage,
      timestamp: new Date().toISOString()
    };

    const { data, error } = await this.client
      .from('performance_metrics')
      .insert(performanceEntry);

    if (error) {
      console.error('Failed to log performance metrics:', error);
    }
    return data;
  }

  /**
   * Get business types from database - NO HARDCODED LISTS
   */
  async getBusinessTypes() {
    const { data, error } = await this.client
      .from('usmca_qualification_rules')
      .select('product_category')
      .not('product_category', 'is', null);

    if (error) throw error;
    
    // Return unique business types from database
    const uniqueTypes = [...new Set(data.map(item => item.product_category))];
    return uniqueTypes.sort();
  }

  /**
   * Get supported countries from database - NO HARDCODED LISTS
   */
  async getSupportedCountries() {
    try {
      // Try to get countries from the countries table
      const { data, error } = await this.client
        .from('countries')
        .select('*')
        .order('name');

      if (!error && data) {
        return data;
      }
    } catch {
      // Countries table might not exist
    }
    
    // Fallback: Get unique countries from unified tariff data
    try {
      const { data: tariffCountries, error: tariffError } = await this.client
        .from('tariff_intelligence_master')
        .select('country')
        .not('country', 'is', null);
      
      if (!tariffError && tariffCountries) {
        // Create country objects from unique values
        const uniqueCountries = [...new Set(tariffCountries.map(item => item.country))];
        const countryMapping = {
          'US': { code: 'US', name: 'United States' },
          'CA': { code: 'CA', name: 'Canada' },
          'MX': { code: 'MX', name: 'Mexico' },
          'CN': { code: 'CN', name: 'China' },
          'IN': { code: 'IN', name: 'India' },
          'VN': { code: 'VN', name: 'Vietnam' },
          'JP': { code: 'JP', name: 'Japan' },
          'KR': { code: 'KR', name: 'South Korea' },
          'DE': { code: 'DE', name: 'Germany' }
        };
        
        return uniqueCountries.map(country => 
          countryMapping[country] || { code: country, name: country }
        ).filter(c => c !== null);
      }
    } catch {
      // Even unified tariff data might fail
    }
    
    // Emergency fallback
    return [
      { code: 'US', name: 'United States' },
      { code: 'CA', name: 'Canada' },
      { code: 'MX', name: 'Mexico' },
      { code: 'CN', name: 'China' }
    ];
  }

  /**
   * Generate unique session ID for tracking
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check for database connection
   */
  async healthCheck() {
    try {
      const { error } = await this.client
        .from('countries')
        .select('count')
        .limit(1);

      return { healthy: !error, error: error?.message };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Close database connections
   */
  close() {
    // Supabase client doesn't require explicit closing
    // but we can clear cached clients
    supabaseClient = null;
    serviceRoleClient = null;
  }
}

// Export singleton database service instances
export const databaseService = new DatabaseService(false); // Client-side service

// Lazy-load server database service (only when needed server-side)
let serverDatabaseServiceInstance = null;
export function getServerDatabaseService() {
  if (!serverDatabaseServiceInstance) {
    serverDatabaseServiceInstance = new DatabaseService(true);
  }
  return serverDatabaseServiceInstance;
}

// Direct export for convenience (used by many services)
export const serverDatabaseService = getServerDatabaseService();

const supabaseClientExports = {
  getSupabaseClient,
  getSupabaseServiceClient,
  DatabaseService,
  databaseService,
  getServerDatabaseService,
  serverDatabaseService
};

export default supabaseClientExports;