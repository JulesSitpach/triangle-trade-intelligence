/**
 * ENHANCED DATABASE CLIENT (CommonJS)
 * Node.js compatible version for testing and validation scripts
 * Focuses on connectivity improvements and field mapping reliability
 */

import { createClient } from '@supabase/supabase-js';

class EnhancedDatabaseClient {
  constructor() {
    this.client = null;
    this.isHealthy = false;
    this.lastHealthCheck = null;
    this.connectionRetries = 0;
    this.maxRetries = 3;
    
    this.initializeClient();
  }

  initializeClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Database configuration missing. Check environment variables.');
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          'X-Client-Info': 'enhanced-database-client-cjs'
        }
      }
    });
  }

  /**
   * Database Connection Health Check
   * Tests connectivity and measures latency
   */
  async testDatabaseConnection() {
    const startTime = performance.now();
    
    try {
      const { data, error } = await this.client
        .from('hs_master_rebuild')
        .select('count(*)', { count: 'exact', head: true })
        .limit(1);
      
      const latency = performance.now() - startTime;
      
      if (error) {
        this.isHealthy = false;
        return { 
          healthy: false, 
          latency, 
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }

      this.isHealthy = true;
      this.lastHealthCheck = Date.now();
      
      return { 
        healthy: true, 
        latency, 
        recordCount: data?.length || 0,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.isHealthy = false;
      return { 
        healthy: false, 
        latency: performance.now() - startTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Retry Logic with Exponential Backoff
   * Improves reliability for transient connection issues
   */
  async retryDatabaseQuery(queryFn, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await queryFn();
        this.connectionRetries = 0; // Reset on success
        return result;
        
      } catch (error) {
        this.connectionRetries = attempt + 1;
        
        if (attempt === maxRetries - 1) {
          // Log final failure
          console.error(`Database query failed after ${maxRetries} attempts:`, error.message);
          throw error;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt) * 1000;
        console.warn(`Database query attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * Schema Validation Layer
   * Validates that database results contain expected fields
   */
  validateFieldMapping(dbResult, expectedFields) {
    if (!dbResult || typeof dbResult !== 'object') {
      return {
        valid: false,
        error: 'Invalid database result object',
        missing: expectedFields,
        available: []
      };
    }

    const available = Object.keys(dbResult);
    const missing = expectedFields.filter(field => !(field in dbResult));
    
    if (missing.length > 0) {
      console.error('Missing database fields:', { 
        missing, 
        available, 
        resultSample: Object.keys(dbResult).slice(0, 5)
      });
    }
    
    return {
      valid: missing.length === 0,
      missing,
      available,
      completeness: ((expectedFields.length - missing.length) / expectedFields.length) * 100
    };
  }

  /**
   * Dynamic Field Mapping System
   * Maps database fields to standardized API response format
   */
  createFieldMapper() {
    return {
      // Standard HS Code mapping with multiple fallbacks
      mapHSCode: (row) => {
        if (!row) return null;

        const mapped = {
          hs_code: row.hs_code || row.hscode || row.code || row.classification_code,
          description: row.description || row.desc || row.product_description || row.hs_description,
          mfn_rate: this.parseRate(row.mfn_rate || row.mfn || row.mfn_tariff_rate),
          usmca_rate: this.parseRate(row.usmca_rate || row.usmca || row.usmca_tariff_rate),
          country_source: row.country_source || row.country || row.source_country || 'US',
          chapter: row.chapter || (row.hs_code ? parseInt(row.hs_code.substring(0, 2)) : null)
        };

        // Calculate savings percentage
        mapped.savings_percent = Math.max(0, (mapped.mfn_rate || 0) - (mapped.usmca_rate || 0));

        // Add confidence score based on data completeness
        mapped.confidence = this.calculateConfidence(mapped);

        // Add API compatibility aliases
        mapped.product_description = mapped.description;
        mapped.mfn_tariff_rate = mapped.mfn_rate;
        mapped.usmca_tariff_rate = mapped.usmca_rate;

        return mapped;
      }
    };
  }

  /**
   * Parse rate values with fallbacks
   * Handles various numeric formats and null values
   */
  parseRate(value) {
    if (value === null || value === undefined || value === '') return 0;
    
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }

  /**
   * Calculate confidence score based on data completeness
   */
  calculateConfidence(mappedData) {
    let score = 0.6; // Base confidence
    
    if (mappedData.hs_code && mappedData.hs_code.length >= 6) score += 0.2;
    if (mappedData.description && mappedData.description.length > 10) score += 0.1;
    if (mappedData.mfn_rate !== null && mappedData.mfn_rate !== undefined) score += 0.05;
    if (mappedData.usmca_rate !== null && mappedData.usmca_rate !== undefined) score += 0.05;
    if (mappedData.country_source && mappedData.country_source !== 'US') score += 0.05; // Bonus for international data
    
    return Math.min(0.95, score); // Cap at 95%
  }

  /**
   * Enhanced Product Search with Reliability Improvements
   */
  async searchProducts(searchTerm, businessType = null, limit = 10) {
    const queryFn = async () => {
      // Health check before major operations
      if (!this.isHealthy && (!this.lastHealthCheck || Date.now() - this.lastHealthCheck > 60000)) {
        await this.testDatabaseConnection();
      }

      let query = this.client
        .from('hs_master_rebuild')
        .select('hs_code, description, mfn_rate, usmca_rate, country_source, chapter')
        .ilike('description', `%${searchTerm}%`);

      // Business type filtering with chapter mapping
      if (businessType) {
        const chapterMap = {
          'Fashion Accessories': [39, 41, 42, 46, 64, 71, 73, 74, 91, 95, 97, 99],
          'Electronics': [85, 90],
          'Automotive': [87],
          'Textiles': [42, 43, 61, 62, 63, 64],
          'Agriculture': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
          'Chemicals': [28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38]
        };
        
        const chapters = chapterMap[businessType] || [];
        if (chapters.length > 0) {
          query = query.in('chapter', chapters);
        }
      }

      query = query
        .order('mfn_rate', { ascending: false })
        .limit(limit);

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    };

    try {
      const rawResults = await this.retryDatabaseQuery(queryFn, this.maxRetries);
      
      // Apply field mapping and validation
      const mapper = this.createFieldMapper();
      const mappedResults = rawResults.map(row => mapper.mapHSCode(row)).filter(Boolean);
      
      // Validate at least one result has required fields
      if (mappedResults.length > 0) {
        const validation = this.validateFieldMapping(mappedResults[0], 
          ['hs_code', 'description', 'mfn_rate', 'usmca_rate']);
        
        if (!validation.valid) {
          console.warn('Field mapping validation failed:', validation);
        }
      }
      
      return {
        success: true,
        results: mappedResults,
        totalMatches: mappedResults.length,
        method: 'enhanced_database_search',
        healthStatus: this.isHealthy,
        connectionRetries: this.connectionRetries
      };
      
    } catch (error) {
      console.error('Enhanced database search failed:', error.message);
      
      return {
        success: false,
        results: [],
        error: error.message,
        totalMatches: 0,
        method: 'enhanced_database_search',
        healthStatus: this.isHealthy,
        connectionRetries: this.connectionRetries
      };
    }
  }

  /**
   * Get Database Health Status
   * For monitoring and diagnostics
   */
  async getHealthStatus() {
    const connectionTest = await this.testDatabaseConnection();
    
    return {
      isHealthy: this.isHealthy,
      lastHealthCheck: this.lastHealthCheck,
      connectionRetries: this.connectionRetries,
      latestTest: connectionTest,
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    };
  }
}

// Export singleton instance for CommonJS
const enhancedDatabaseClient = new EnhancedDatabaseClient();

module.exports = { enhancedDatabaseClient, EnhancedDatabaseClient };