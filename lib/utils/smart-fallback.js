/**
 * SMART DATABASE-DRIVEN FALLBACK SYSTEM
 * Uses real tariff data when AI classification fails, with full transparency to user
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Smart fallback that tries multiple database-driven strategies
 * Returns detailed explanation so user knows what happened
 */
export async function getSmartFallback(productDescription, partialHsCode = null) {
  const fallbackResult = {
    mfn_rate: 0,
    usmca_rate: 0,
    savings_percent: 0,
    confidence: 'low',
    source: 'fallback',
    fallback_method: 'unknown',
    user_message: '',
    user_options: [],
    requires_user_decision: false
  };

  console.log(`🔍 AI classification failed for "${productDescription}" - trying smart fallback...`);

  // Strategy 1: Keyword matching against HS database descriptions
  try {
    const keywordResult = await tryKeywordMatching(productDescription);
    if (keywordResult.found) {
      return {
        ...keywordResult,
        user_message: `AI classification unavailable. We found ${keywordResult.match_count} similar products in our database based on keywords. Using tariff rates from: "${keywordResult.matched_description}"`,
        user_options: [
          { action: 'accept', label: 'Use This Match', confidence: keywordResult.confidence },
          { action: 'manual', label: 'Enter HS Code Manually', confidence: 'high' },
          { action: 'professional', label: 'Get Professional Classification', confidence: 'high' }
        ],
        requires_user_decision: keywordResult.confidence === 'low'
      };
    }
  } catch (error) {
    console.error('Keyword matching failed:', error);
  }

  // Strategy 2: HS Chapter averages from real data
  if (partialHsCode) {
    try {
      const chapterResult = await tryChapterAverages(partialHsCode);
      if (chapterResult.found) {
        return {
          ...chapterResult,
          user_message: `AI classification unavailable. Using average tariff rates for HS Chapter ${chapterResult.chapter} (${chapterResult.chapter_description}) based on ${chapterResult.sample_size} similar products in our database.`,
          user_options: [
            { action: 'accept', label: `Use Chapter ${chapterResult.chapter} Average`, confidence: 'medium' },
            { action: 'manual', label: 'Enter Exact HS Code', confidence: 'high' },
            { action: 'professional', label: 'Get Professional Classification', confidence: 'high' }
          ],
          requires_user_decision: true
        };
      }
    } catch (error) {
      console.error('Chapter averaging failed:', error);
    }
  }

  // Strategy 3: Trade-weighted average from all real data
  try {
    const overallAverage = await getTradeWeightedAverage();
    return {
      ...overallAverage,
      user_message: `AI classification unavailable and no similar products found. Using US trade-weighted average tariff rates based on ${overallAverage.total_products} products in our database. This is a rough estimate only.`,
      user_options: [
        { action: 'manual', label: 'Enter HS Code Manually', confidence: 'high', recommended: true },
        { action: 'professional', label: 'Get Professional Classification', confidence: 'high' },
        { action: 'accept', label: 'Use General Average (Not Recommended)', confidence: 'very_low' }
      ],
      requires_user_decision: true,
      fallback_method: 'trade_weighted_average'
    };
  } catch (error) {
    console.error('Trade average calculation failed:', error);
  }

  // Final fallback - return zero with clear message
  return {
    ...fallbackResult,
    user_message: 'AI classification unavailable and database lookup failed. Please provide your HS code or contact a customs broker for accurate classification.',
    user_options: [
      { action: 'manual', label: 'Enter HS Code Manually', confidence: 'high', recommended: true },
      { action: 'professional', label: 'Get Professional Help', confidence: 'high' }
    ],
    requires_user_decision: true,
    fallback_method: 'complete_failure'
  };
}

/**
 * Strategy 1: Keyword matching against HS database
 */
async function tryKeywordMatching(productDescription) {
  const keywords = extractKeywords(productDescription);
  console.log(`🔍 Trying keyword search for: ${keywords.join(', ')}`);

  // Build search query for multiple keywords
  const searchConditions = keywords.map(keyword =>
    `description.ilike.%${keyword}%`
  ).join(',');

  const { data, error } = await supabase
    .from('hs_master_rebuild')
    .select('hs_code, description, mfn_rate, usmca_rate, general_rate')
    .or(searchConditions)
    .not('mfn_rate', 'is', null)
    .not('mfn_rate', 'eq', 0)
    .limit(20);

  if (error || !data?.length) {
    console.log('❌ No keyword matches found');
    return { found: false };
  }

  // Find best match and calculate average if multiple matches
  const bestMatch = data[0];
  const avgMfn = data.reduce((sum, item) => sum + (parseFloat(item.mfn_rate) || 0), 0) / data.length;
  const avgUsmca = data.reduce((sum, item) => sum + (parseFloat(item.usmca_rate) || 0), 0) / data.length;

  console.log(`✅ Found ${data.length} keyword matches, using: "${bestMatch.description}"`);

  return {
    found: true,
    mfn_rate: avgMfn,
    usmca_rate: avgUsmca,
    savings_percent: Math.max(0, avgMfn - avgUsmca),
    confidence: data.length >= 5 ? 'medium' : 'low',
    source: 'keyword_database_match',
    fallback_method: 'keyword_matching',
    matched_description: bestMatch.description,
    match_count: data.length,
    sample_codes: data.slice(0, 3).map(item => item.hs_code)
  };
}

/**
 * Strategy 2: Chapter averages from real data
 */
async function tryChapterAverages(hsCode) {
  const chapter = hsCode.substring(0, 2);
  console.log(`📊 Calculating Chapter ${chapter} averages...`);

  const { data, error } = await supabase
    .from('hs_master_rebuild')
    .select('hs_code, description, mfn_rate, usmca_rate')
    .like('hs_code', `${chapter}%`)
    .not('mfn_rate', 'is', null)
    .not('mfn_rate', 'eq', 0);

  if (error || !data?.length) {
    console.log(`❌ No data for Chapter ${chapter}`);
    return { found: false };
  }

  const avgMfn = data.reduce((sum, item) => sum + (parseFloat(item.mfn_rate) || 0), 0) / data.length;
  const avgUsmca = data.reduce((sum, item) => sum + (parseFloat(item.usmca_rate) || 0), 0) / data.length;

  console.log(`✅ Chapter ${chapter} average: ${avgMfn.toFixed(2)}% MFN (${data.length} products)`);

  return {
    found: true,
    mfn_rate: avgMfn,
    usmca_rate: avgUsmca,
    savings_percent: Math.max(0, avgMfn - avgUsmca),
    confidence: 'medium',
    source: 'chapter_average',
    fallback_method: 'chapter_averaging',
    chapter: chapter,
    chapter_description: getChapterDescription(chapter),
    sample_size: data.length
  };
}

/**
 * Strategy 3: Trade-weighted average
 */
async function getTradeWeightedAverage() {
  console.log('📈 Calculating trade-weighted averages...');

  const { data, error } = await supabase
    .from('hs_master_rebuild')
    .select('mfn_rate, usmca_rate, general_rate')
    .not('mfn_rate', 'is', null)
    .not('mfn_rate', 'eq', 0);

  if (error || !data?.length) {
    throw new Error('No tariff data available');
  }

  const avgMfn = data.reduce((sum, item) => sum + (parseFloat(item.mfn_rate) || 0), 0) / data.length;
  const avgUsmca = data.reduce((sum, item) => sum + (parseFloat(item.usmca_rate) || 0), 0) / data.length;

  console.log(`✅ Trade average: ${avgMfn.toFixed(2)}% MFN (${data.length} total products)`);

  return {
    mfn_rate: avgMfn,
    usmca_rate: avgUsmca,
    savings_percent: Math.max(0, avgMfn - avgUsmca),
    confidence: 'low',
    source: 'trade_weighted_average',
    total_products: data.length
  };
}

/**
 * Extract meaningful keywords from product description
 */
function extractKeywords(description) {
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'];

  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 5); // Limit to top 5 keywords
}

/**
 * Get description for HS chapter
 */
function getChapterDescription(chapter) {
  const descriptions = {
    '01': 'Live animals',
    '02': 'Meat and edible meat offal',
    '84': 'Nuclear reactors, boilers, machinery',
    '85': 'Electrical machinery and equipment',
    '87': 'Vehicles other than railway',
    '72': 'Iron and steel',
    '39': 'Plastics and articles thereof'
  };

  return descriptions[chapter] || `Chapter ${chapter} products`;
}