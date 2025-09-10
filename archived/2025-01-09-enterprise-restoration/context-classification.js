/**
 * CONTEXT-AWARE CLASSIFICATION API
 * Uses pre-analyzed company business context for ultra-fast, focused searches
 * No AI calls needed - pure database operations with business intelligence
 */

import { cacheGet, cacheSet, generateCacheKey } from '../../lib/cache/redis-cache.js';
import optimizedSupabase, { performQuery } from '../../lib/database/optimized-supabase-client.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      product_description, 
      company_id,
      use_context = true // Allow fallback to general search
    } = req.body;
    
    if (!product_description) {
      return res.status(400).json({ error: 'Product description required' });
    }

    // ENTERPRISE CACHING: Check cache first
    const cacheKey = generateCacheKey.classification(`${company_id || 'general'}_${product_description}`);
    const cachedResult = await cacheGet(cacheKey);
    
    if (cachedResult) {
      return res.status(200).json({
        ...cachedResult,
        cached: true,
        cache_key: cacheKey
      });
    }

    // GET COMPANY CONTEXT if available
    let companyContext = null;
    if (company_id && use_context) {
      companyContext = await getCompanyContext(company_id);
      
      if (companyContext) {
        console.log('Using company context:', {
          company: companyContext.company_name,
          primary_chapters: companyContext.primary_hs_chapters,
          focus: companyContext.application_focus
        });
      }
    }

    // EXTRACT SEARCH TERMS
    const searchTerms = extractSearchTerms(product_description, companyContext);

    // PERFORM CONTEXT-FOCUSED DATABASE SEARCH
    let results = [];
    
    if (companyContext && companyContext.primary_hs_chapters?.length > 0) {
      // FOCUSED SEARCH: Use company's primary chapters
      results = await performFocusedSearch(
        searchTerms, 
        companyContext.primary_hs_chapters,
        companyContext.keyword_priorities
      );
      
      // EXPAND SEARCH if needed
      if (results.length < 5 && companyContext.secondary_hs_chapters?.length > 0) {
        const secondaryResults = await performFocusedSearch(
          searchTerms,
          companyContext.secondary_hs_chapters,
          companyContext.keyword_priorities
        );
        results = [...results, ...secondaryResults];
      }
    }
    
    // FALLBACK: Broad search if no context or insufficient results
    if (results.length < 5) {
      const broadResults = await performBroadSearch(searchTerms, product_description);
      results = [...results, ...broadResults];
    }

    // SCORE AND RANK RESULTS
    const scoredResults = scoreResults(
      results, 
      searchTerms, 
      companyContext,
      product_description
    );

    // FORMAT RESPONSE
    const response = {
      success: true,
      results: scoredResults.slice(0, 10),
      total_matches: scoredResults.length,
      method: companyContext ? 'context_focused_search' : 'general_search',
      company_context: companyContext ? {
        company: companyContext.company_name,
        confidence: companyContext.analysis_confidence,
        chapters_used: companyContext.primary_hs_chapters
      } : null
    };
    
    // CACHE RESPONSE
    await cacheSet(cacheKey, response, 3600000); // 1 hour cache

    return res.status(200).json(response);

  } catch (error) {
    console.error('Classification error:', error);
    return res.status(500).json({ 
      error: 'Classification failed',
      message: error.message 
    });
  }
}

/**
 * GET COMPANY CONTEXT from database
 */
async function getCompanyContext(companyId) {
  try {
    const { data, error } = await optimizedSupabase
      .from('company_profiles')
      .select(`
        company_name,
        primary_hs_chapters,
        secondary_hs_chapters,
        keyword_priorities,
        material_focus,
        application_focus,
        analysis_confidence
      `)
      .eq('company_id', companyId)
      .single();
    
    if (error) {
      console.log('No company context found:', companyId);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching company context:', error);
    return null;
  }
}

/**
 * EXTRACT SEARCH TERMS with context awareness
 */
function extractSearchTerms(description, context) {
  const baseTerms = description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => word.length >= 3);

  // PRIORITIZE TERMS based on company context
  if (context && context.keyword_priorities) {
    const priorities = context.keyword_priorities;
    
    // Sort terms by priority
    baseTerms.sort((a, b) => {
      const priorityA = priorities[a] || 0;
      const priorityB = priorities[b] || 0;
      return priorityB - priorityA;
    });
  }

  return baseTerms.slice(0, 8); // Use top 8 terms
}

/**
 * PERFORM FOCUSED SEARCH within specific chapters
 */
async function performFocusedSearch(searchTerms, chapters, keywordPriorities = {}) {
  try {
    // Build chapter filter
    const chapterFilter = chapters.map(ch => {
      if (typeof ch === 'number') {
        if (ch < 100) {
          // 2-digit chapter (e.g., 85)
          return `hs_code.like.${ch}%`;
        } else {
          // 4-digit heading (e.g., 8544)
          return `hs_code.like.${ch}%`;
        }
      }
      return `hs_code.like.${ch}%`;
    }).join(',');

    const { data, error } = await performQuery(
      (client) => client
        .from('hs_master_rebuild')
        .select('hs_code, description, mfn_rate, usmca_rate, country_source')
        .or(chapterFilter)
        .textSearch('description', searchTerms.join(' | '))
        .limit(20),
      'focused_chapter_search'
    );

    if (error) {
      console.error('Focused search error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

/**
 * PERFORM BROAD SEARCH across all chapters
 */
async function performBroadSearch(searchTerms, fullDescription) {
  try {
    // Try exact phrase match first
    const { data: exactData } = await performQuery(
      (client) => client
        .from('hs_master_rebuild')
        .select('hs_code, description, mfn_rate, usmca_rate, country_source')
        .ilike('description', `%${fullDescription}%`)
        .limit(10),
      'exact_phrase_search'
    );

    // Then broad term search
    const { data: broadData } = await performQuery(
      (client) => client
        .from('hs_master_rebuild')
        .select('hs_code, description, mfn_rate, usmca_rate, country_source')
        .textSearch('description', searchTerms.join(' | '))
        .limit(20),
      'broad_term_search'
    );

    // Combine and deduplicate
    const combined = [...(exactData || []), ...(broadData || [])];
    const seen = new Set();
    
    return combined.filter(item => {
      if (seen.has(item.hs_code)) return false;
      seen.add(item.hs_code);
      return true;
    });
  } catch (error) {
    console.error('Broad search error:', error);
    return [];
  }
}

/**
 * SCORE AND RANK RESULTS based on relevance
 */
function scoreResults(results, searchTerms, context, fullDescription) {
  return results.map((result, index) => {
    const description = result.description.toLowerCase();
    const hsChapter = parseInt(result.hs_code.substring(0, 2));
    
    // BASE SCORE: Position in results
    let score = 1 - (index * 0.05);
    
    // TERM COVERAGE: How many search terms match
    const matchedTerms = searchTerms.filter(term => description.includes(term));
    const termCoverage = matchedTerms.length / searchTerms.length;
    score += termCoverage * 0.3;
    
    // CONTEXT BONUS: Result is in company's primary chapters
    if (context && context.primary_hs_chapters) {
      const isPrimaryChapter = context.primary_hs_chapters.some(ch => {
        if (ch < 100) return hsChapter === ch;
        return result.hs_code.startsWith(ch.toString());
      });
      if (isPrimaryChapter) score += 0.3;
    }
    
    // MATERIAL MATCH: Result matches company's material focus
    if (context && context.material_focus) {
      const materialMatch = context.material_focus.some(material => 
        description.includes(material)
      );
      if (materialMatch) score += 0.15;
    }
    
    // APPLICATION MATCH: Result matches company's application focus
    if (context && context.application_focus) {
      const appMatch = context.application_focus.some(app => {
        const appTerms = app.replace(/_/g, ' ').split(' ');
        return appTerms.every(term => description.includes(term));
      });
      if (appMatch) score += 0.2;
    }
    
    // EXACT PHRASE BONUS
    if (description.includes(fullDescription.toLowerCase())) {
      score += 0.25;
    }
    
    return {
      ...result,
      product_description: result.description,
      mfn_tariff_rate: result.mfn_rate || 0,
      usmca_tariff_rate: result.usmca_rate || 0,
      savings_percent: Math.max(0, (result.mfn_rate || 0) - (result.usmca_rate || 0)),
      confidence: Math.min(0.95, Math.max(0.3, score)),
      matchedTerms: matchedTerms.length,
      termCoverage: termCoverage,
      hsChapter: hsChapter,
      contextMatch: context ? {
        isPrimaryChapter: context.primary_hs_chapters?.includes(hsChapter),
        materialMatch: context.material_focus?.some(m => description.includes(m)),
        applicationMatch: context.application_focus?.some(a => description.includes(a.replace(/_/g, ' ')))
      } : null
    };
  }).sort((a, b) => b.confidence - a.confidence);
}