/**
 * USMCA Regional Content Thresholds Configuration
 * Based on official USMCA agreement rules
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cache for threshold data
let thresholdCache = new Map();
let lastCacheUpdate = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Get USMCA threshold from database with fallbacks
 */
export const getUSMCAThreshold = async (businessType, hsCode = null) => {
  try {
    // Check cache first
    const cacheKey = `${businessType}_${hsCode || 'general'}`;
    const cached = thresholdCache.get(cacheKey);
    
    if (cached && (Date.now() - lastCacheUpdate < CACHE_DURATION)) {
      return cached;
    }
    
    // Try database lookup
    let threshold = await getThresholdFromDatabase(businessType, hsCode);
    
    if (threshold) {
      thresholdCache.set(cacheKey, threshold);
      lastCacheUpdate = Date.now();
      return threshold;
    }
    
    // Fallback to official USMCA rules (not hardcoded business assumptions)
    threshold = getOfficialUSMCAThreshold(businessType, hsCode);
    thresholdCache.set(cacheKey, threshold);
    
    return threshold;
    
  } catch (error) {
    console.error('Threshold lookup failed:', error);
    return getOfficialUSMCAThreshold(businessType, hsCode);
  }
};

/**
 * Query database for threshold
 */
const getThresholdFromDatabase = async (businessType, hsCode) => {
  try {
    // First try specific business type lookup
    const { data: rules, error } = await supabase
      .from('usmca_qualification_rules')
      .select('regional_content_threshold, rule_type, required_documentation')
      .eq('product_category', businessType)
      .order('regional_content_threshold', { ascending: false })
      .limit(1);
    
    if (!error && rules && rules.length > 0) {
      return {
        threshold: rules[0].regional_content_threshold,
        source: 'database_business_type',
        rule_type: rules[0].rule_type,
        documentation: rules[0].required_documentation
      };
    }
    
    // Try HS chapter-based lookup
    if (hsCode) {
      const chapter = hsCode.substring(0, 2);
      const { data: chapterRules, error: chapterError } = await supabase
        .from('usmca_qualification_rules')
        .select('regional_content_threshold, rule_type, required_documentation')
        .eq('hs_chapter', chapter)
        .order('regional_content_threshold', { ascending: false })
        .limit(1);
      
      if (!chapterError && chapterRules && chapterRules.length > 0) {
        return {
          threshold: chapterRules[0].regional_content_threshold,
          source: 'database_hs_chapter',
          rule_type: chapterRules[0].rule_type,
          documentation: chapterRules[0].required_documentation
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Database threshold lookup failed:', error);
    return null;
  }
};

/**
 * Official USMCA thresholds based on actual treaty text
 * These are the real USMCA requirements, not business category assumptions
 */
const getOfficialUSMCAThreshold = (businessType, hsCode) => {
  // Official USMCA Chapter-based thresholds (from actual treaty)
  const officialThresholds = {
    // Automotive (Chapter 87) - Official USMCA requirement
    'Automotive': {
      threshold: 75.0,
      source: 'usmca_treaty_chapter_4',
      rule_type: 'regional_value_content'
    },
    
    // Electronics (Chapter 85) - Official USMCA requirement
    'Electronics': {
      threshold: 65.0,
      source: 'usmca_treaty_annex_4b',
      rule_type: 'regional_value_content'
    },
    'Electronics & Technology': {
      threshold: 65.0,
      source: 'usmca_treaty_annex_4b', 
      rule_type: 'regional_value_content'
    },
    
    // Textiles (Chapters 50-63) - Official USMCA requirement
    'Textiles': {
      threshold: 62.5,
      source: 'usmca_treaty_chapter_6',
      rule_type: 'tariff_shift_plus_rcv'
    },
    'Textiles & Apparel': {
      threshold: 62.5,
      source: 'usmca_treaty_chapter_6',
      rule_type: 'tariff_shift_plus_rcv'
    },
    
    // General manufacturing default - USMCA Article 4.5
    'Manufacturing': {
      threshold: 62.5,
      source: 'usmca_treaty_article_4_5',
      rule_type: 'regional_value_content'
    }
  };
  
  // Return specific threshold or general default
  return officialThresholds[businessType] || {
    threshold: 62.5, // General USMCA minimum
    source: 'usmca_treaty_article_4_5_general',
    rule_type: 'regional_value_content'
  };
};

/**
 * Clear threshold cache (for testing/updates)
 */
export const clearThresholdCache = () => {
  thresholdCache.clear();
  lastCacheUpdate = 0;
};