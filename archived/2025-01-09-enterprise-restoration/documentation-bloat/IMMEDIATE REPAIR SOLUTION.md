// COMPLETE REPAIR SOLUTION
// Add these methods to your /lib/database/supabase-client.js file

// Add these methods to your ServerDatabaseService class:

class ServerDatabaseService {
  // ... existing methods ...

  /**
   * CRITICAL MISSING METHOD: Search products by keyword
   * This is what the classification engine needs but was missing
   */
  async searchProducts(searchTerm, limit = 10) {
    try {
      console.log(`🔍 Database search for: "${searchTerm}"`);
      
      const { data, error } = await this.client
        .from('comtrade_reference')
        .select('hs_code, product_description, mfn_tariff_rate, usmca_tariff_rate, product_category, usmca_eligible')
        .ilike('product_description', `%${searchTerm}%`)
        .limit(limit);

      if (error) {
        console.error('❌ Database search error:', error);
        throw error;
      }

      const results = data || [];
      console.log(`✅ Found ${results.length} products for "${searchTerm}"`);
      
      // Ensure usmca_eligible is properly set
      return results.map(item => ({
        ...item,
        usmca_eligible: item.usmca_eligible || (parseFloat(item.usmca_tariff_rate) === 0)
      }));

    } catch (error) {
      console.error(`❌ Product search failed for "${searchTerm}":`, error);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Get HS code reference data
   */
  async getHSCodeReference(hsCode) {
    try {
      const { data, error } = await this.client
        .from('comtrade_reference')
        .select('*')
        .eq('hs_code', hsCode)
        .single();

      if (error) {
        console.error('HS code lookup error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`HS code lookup failed for ${hsCode}:`, error);
      return null;
    }
  }

  /**
   * Log classification attempts
   */
  async logClassification(productDescription, hsCode, confidence, method) {
    try {
      // Try to log, but don't fail if table doesn't exist
      const { error } = await this.client
        .from('classification_logs')
        .insert({
          product_description: productDescription,
          hs_code: hsCode,
          confidence_score: confidence,
          classification_method: method,
          timestamp: new Date().toISOString()
        });

      if (error && !error.message.includes('relation "classification_logs" does not exist')) {
        console.error('Classification logging failed:', error);
      }
    } catch (error) {
      console.log('Classification logging skipped (table may not exist)');
    }
  }

  /**
   * Get USMCA qualification rules
   */
  async getUSMCAQualificationRules(hsCode = null, businessType = null) {
    try {
      let query = this.client.from('usmca_qualification_rules').select('*');
      
      if (hsCode) {
        query = query.eq('hs_code', hsCode);
      }
      
      if (businessType) {
        query = query.eq('business_type', businessType);
      }

      const { data, error } = await query.limit(10);

      if (error) {
        console.error('USMCA rules lookup error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('USMCA rules lookup failed:', error);
      return [];
    }
  }
}

// TEST YOUR REPAIR with this direct database query:

async function testDatabaseRepair() {
  console.log('🧪 Testing Database Repair...');
  
  // Test 1: Direct database search
  try {
    const response = await fetch('/api/database-driven-usmca-compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'classify_product',
        data: {
          product_description: 'leather handbags',
          business_type: 'importer',
          source_country: 'CN'
        }
      })
    });

    const data = await response.json();
    console.log('📊 Classification result:', data);
    
    if (data.success && data.results && data.results.length > 0) {
      console.log('✅ REPAIR SUCCESSFUL!');
      console.log('📦 Found results:', data.results.length);
      console.log('🎯 First result:', data.results[0].hs_code, '-', data.results[0].product_description);
      
      // Check for leather handbag specifically
      const leatherBag = data.results.find(r => r.hs_code === '420221');
      if (leatherBag) {
        console.log('🎉 LEATHER HANDBAG FOUND!', leatherBag);
      } else {
        console.log('⚠️ Leather handbag (420221) not found, but classification is working');
      }
    } else {
      console.log('❌ Repair incomplete - no results returned');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// VERIFY YOUR DATABASE HAS THE DATA:
// Run this SQL query in your database:
/*
SELECT hs_code, product_description, mfn_tariff_rate, usmca_tariff_rate 
FROM comtrade_reference 
WHERE LOWER(product_description) LIKE '%handbag%' 
AND LOWER(product_description) LIKE '%leather%'
LIMIT 5;
*/

// ALTERNATIVE: If the above doesn't work, create a simple bypass classification:

/**
 * EMERGENCY BYPASS: Simple keyword-based classifier
 * Use this if the sophisticated engine is still broken
 */
async function simpleClassificationBypass(productDescription) {
  try {
    // Extract key terms
    const description = productDescription.toLowerCase();
    const terms = [];
    
    if (description.includes('handbag') && description.includes('leather')) {
      terms.push('handbag', 'leather');
    } else if (description.includes('shirt') && description.includes('cotton')) {
      terms.push('shirt', 'cotton');
    } else if (description.includes('avocado')) {
      terms.push('avocado');
    } else {
      // Extract meaningful words
      const words = description.split(' ').filter(w => w.length > 3);
      terms.push(...words.slice(0, 3));
    }
    
    // Search database directly
    const results = [];
    for (const term of terms) {
      const { data } = await serverDatabaseService.client
        .from('comtrade_reference')
        .select('*')
        .ilike('product_description', `%${term}%`)
        .limit(5);
      
      if (data) results.push(...data);
    }
    
    // Remove duplicates and format
    const uniqueResults = results
      .filter((item, index, self) => 
        index === self.findIndex(t => t.hs_code === item.hs_code)
      )
      .slice(0, 8)
      .map(item => ({
        hs_code: item.hs_code,
        product_description: item.product_description,
        usmca_eligible: parseFloat(item.usmca_tariff_rate) === 0,
        mfn_tariff_rate: parseFloat(item.mfn_tariff_rate) || 0,
        usmca_tariff_rate: parseFloat(item.usmca_tariff_rate) || 0,
        confidenceScore: 75 // Default confidence
      }));
    
    return {
      success: true,
      results: uniqueResults,
      method: 'simple_bypass'
    };
    
  } catch (error) {
    console.error('Simple bypass failed:', error);
    return { success: false, results: [], error: error.message };
  }
}

// IMPLEMENTATION STEPS:
// 1. Add the missing methods to your ServerDatabaseService class
// 2. Test with testDatabaseRepair() function
// 3. Verify "leather handbags" returns HS 420221
// 4. If it still doesn't work, use the simpleClassificationBypass as a temporary solution