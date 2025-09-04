/**
 * Simple USMCA Classifier
 * Database-driven USMCA compliance classification
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Simple USMCA classifier for products
 */
export const usmcaClassifier = {
  async classifyProduct(productDescription, businessType = null) {
    if (!productDescription || productDescription.length < 3) {
      return { hsCode: null, description: null, confidence: 0 };
    }

    const searchText = productDescription.toLowerCase().trim();
    
    try {
      // Search for matching HS codes in database
      const { data: matches } = await supabase
        .from('hs_master_rebuild')
        .select('hs_code, description, chapter, mfn_rate, usmca_rate')
        .ilike('description', `%${searchText}%`)
        .limit(5);

      if (matches && matches.length > 0) {
        const bestMatch = matches[0];
        return {
          hsCode: bestMatch.hs_code,
          description: bestMatch.description,
          chapter: bestMatch.chapter,
          mfnRate: bestMatch.mfn_rate,
          usmcaRate: bestMatch.usmca_rate,
          confidence: 0.8
        };
      }

      return { hsCode: null, description: null, confidence: 0 };
    } catch (error) {
      console.error('Classification error:', error);
      return { hsCode: null, description: null, confidence: 0 };
    }
  },

  async calculateSavings(hsCode, importValue = 100000) {
    if (!hsCode) return { savings: 0, mfnRate: 0, usmcaRate: 0 };

    try {
      const { data: tariffData } = await supabase
        .from('hs_master_rebuild')
        .select('mfn_rate, usmca_rate')
        .eq('hs_code', hsCode)
        .single();

      if (tariffData) {
        const mfnTariff = (tariffData.mfn_rate || 0) * importValue;
        const usmcaTariff = (tariffData.usmca_rate || 0) * importValue;
        const savings = mfnTariff - usmcaTariff;

        return {
          savings: Math.max(0, savings),
          mfnRate: tariffData.mfn_rate || 0,
          usmcaRate: tariffData.usmca_rate || 0
        };
      }

      return { savings: 0, mfnRate: 0, usmcaRate: 0 };
    } catch (error) {
      console.error('Savings calculation error:', error);
      return { savings: 0, mfnRate: 0, usmcaRate: 0 };
    }
  },

  generateCertificateData(companyData, productsData) {
    const certificateId = `TI-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    return {
      success: true,
      certificateId,
      companyInfo: companyData || {},
      products: productsData || [],
      usmcaQualified: true,
      regionalContent: 75.0
    };
  }
};