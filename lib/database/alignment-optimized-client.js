
/**
 * ALIGNMENT-OPTIMIZED DATABASE CLIENT
 * Handles all database operations with proper field mapping and error handling
 */
import { createClient } from '@supabase/supabase-js';

class AlignmentOptimizedClient {
  constructor() {
    this.client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    this.tableName = 'hs_master_rebuild'; // Single source of truth
  }

  async query(options = {}) {
    try {
      const { select = '*', limit = 10, filters = {} } = options;
      
      let query = this.client
        .from(this.tableName)
        .select(select)
        .limit(limit);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'ilike') {
          query = query.ilike(value.column, value.pattern);
        } else if (key === 'in') {
          query = query.in(value.column, value.values);
        }
      });

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Ensure all required fields are present
      return this.normalizeFields(data);
      
    } catch (error) {
      console.error('Database query error:', error);
      return [];
    }
  }

  normalizeFields(records) {
    if (!records) return [];
    
    return records.map(record => ({
      ...record,
      // Ensure consistent field naming
      product_description: record.description || record.product_description,
      mfn_tariff_rate: record.mfn_rate || 0,
      usmca_tariff_rate: record.usmca_rate || 0,
      savings_percent: Math.max(0, (record.mfn_rate || 0) - (record.usmca_rate || 0)),
      // Add computed confidence based on data completeness
      confidence: this.calculateConfidence(record)
    }));
  }

  calculateConfidence(record) {
    let score = 0.7; // Base confidence
    
    if (record.description && record.description.length > 10) score += 0.1;
    if (record.mfn_rate !== null && record.mfn_rate !== undefined) score += 0.1;
    if (record.usmca_rate !== null && record.usmca_rate !== undefined) score += 0.1;
    if (record.country_source) score += 0.05;
    
    return Math.min(0.95, score); // Cap at 95%
  }

  async searchProducts(searchTerm, businessType = null, limit = 10) {
    const filters = {
      ilike: { column: 'description', pattern: `%${searchTerm}%` }
    };

    // Add business type filtering if provided
    if (businessType) {
      const chapterMap = {
        'Fashion Accessories': [39, 41, 42, 46, 64, 71, 73, 74, 91, 95, 97, 99],
        'Electronics': [85, 90],
        'Automotive': [87],
        'Textiles': [42, 43, 61, 62, 63, 64]
      };
      
      const chapters = chapterMap[businessType] || [];
      if (chapters.length > 0) {
        filters.in = { column: 'chapter', values: chapters };
      }
    }

    return this.query({
      select: 'hs_code, description, mfn_rate, usmca_rate, country_source, chapter',
      limit,
      filters
    });
  }
}

export default new AlignmentOptimizedClient();
