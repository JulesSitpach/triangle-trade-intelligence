/**
 * SIMPLE DYNAMIC HS CODE MATCHER
 * API-based classification for browser compatibility
 * Follows Triangle Intelligence architecture: client calls API, API accesses database
 */

/**
 * Use improved classification API with business context and intelligent analysis
 */
export async function findHSCodes(productDescription, businessType = null) {
  if (!productDescription || productDescription.length < 3) {
    return [];
  }

  try {
    // Use our improved classification API instead of direct database queries
    const response = await fetch('/api/simple-classification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        product_description: productDescription,
        business_type: businessType 
      })
    });

    const data = await response.json();

    if (data.success && data.results) {
      return data.results.map(result => ({
        hsCode: result.hs_code,
        description: result.description || result.product_description,
        confidence: Math.round((result.confidence || 0.5) * 100),
        matchType: result.contextAnalysis ? 'intelligent_context' : 'database_match',
        mfnRate: result.mfn_tariff_rate || result.mfn_rate || 0,
        usmcaRate: result.usmca_tariff_rate || result.usmca_rate || 0,
        country: result.country_source,
        displayText: `${result.hs_code} - ${(result.description || result.product_description || '').substring(0, 100)}${(result.description || result.product_description || '').length > 100 ? '...' : ''}`,
        confidenceText: getConfidenceText(Math.round((result.confidence || 0.5) * 100)),
        contextAnalysis: result.contextAnalysis || null,
        hsChapter: result.hsChapter || parseInt(result.hs_code?.substring(0, 2)) || null
      }));
    }

    // Fallback if API fails - use simplified fallback search
    console.warn('Classification API failed, using fallback search');
    return await fallbackHSSearch(productDescription);

  } catch (error) {
    console.error('HS code search API error:', error);
    return await fallbackHSSearch(productDescription);
  }
}

/**
 * Fallback search for when API is unavailable
 */
async function fallbackHSSearch(productDescription) {
  try {
    // Use simple dropdown API as fallback
    const response = await fetch('/api/simple-dropdown-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search: productDescription })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.hsCodes) {
        return data.hsCodes.slice(0, 5).map(match => ({
          hsCode: match.hs_code,
          description: match.description,
          confidence: 75,
          matchType: 'fallback_search',
          mfnRate: match.mfn_rate || 0,
          usmcaRate: match.usmca_rate || 0,
          country: match.country_source,
          displayText: `${match.hs_code} - ${match.description.substring(0, 100)}${match.description.length > 100 ? '...' : ''}`,
          confidenceText: 'Good match'
        }));
      }
    }
  } catch (error) {
    console.error('Fallback search error:', error);
  }
  
  return [];
}

/**
 * Get business chapters dynamically from database
 * Falls back to known mappings if no database config
 */
async function getBusinessChapters(businessType) {
  try {
    // Try to get from database first (if we have a business_chapters table)
    const { data } = await supabase
      .from('business_type_chapters')
      .select('hs_chapters')
      .eq('business_type', businessType.toLowerCase())
      .single();

    if (data && data.hs_chapters) {
      return data.hs_chapters;
    }
  } catch (error) {
    // Table doesn't exist or no data - use fallback
  }

  // Fallback to basic known chapters
  const knownChapters = {
    'automotive': [87],
    'electronics': [85, 90],
    'textiles': [42, 61, 62, 63],
    'chemicals': [28, 29, 30],
    'food': [16, 17, 18, 19, 20],
    'machinery': [84, 85],
    'metals': [72, 73, 74, 76]
  };

  return knownChapters[businessType?.toLowerCase()] || [];
}

/**
 * Simple confidence text
 */
function getConfidenceText(confidence) {
  if (confidence >= 90) return 'Excellent match';
  if (confidence >= 75) return 'Good match';
  if (confidence >= 60) return 'Possible match';
  if (confidence >= 40) return 'Partial match';
  return 'Low confidence';
}

/**
 * Look up specific HS code by exact match with format flexibility
 */
export async function lookupHSCode(hsCode) {
  if (!hsCode) return null;
  
  const normalizedCode = hsCode.replace(/[^0-9]/g, ''); // Remove dots, spaces, etc.
  
  try {
    // Try exact match first
    let { data } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
      .eq('hs_code', normalizedCode)
      .single();
    
    if (data) {
      return {
        hsCode: data.hs_code,
        description: data.description,
        confidence: 100,
        matchType: 'exact',
        mfnRate: data.mfn_rate || 0,
        usmcaRate: data.usmca_rate || 0,
        country: data.country_source,
        displayText: `${data.hs_code} - ${data.description}`,
        confidenceText: 'Exact match'
      };
    }

    // Try prefix match for different HS code lengths (6, 8, 10 digit)
    const { data: prefixMatches } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
      .ilike('hs_code', `${normalizedCode}%`)
      .order('mfn_rate', { ascending: false })
      .limit(1);

    if (prefixMatches && prefixMatches.length > 0) {
      const match = prefixMatches[0];
      return {
        hsCode: match.hs_code,
        description: match.description,
        confidence: 90,
        matchType: 'prefix',
        mfnRate: match.mfn_rate || 0,
        usmcaRate: match.usmca_rate || 0,
        country: match.country_source,
        displayText: `${match.hs_code} - ${match.description}`,
        confidenceText: 'Close match'
      };
    }

    // Try reverse lookup - if input is long, try shorter versions
    if (normalizedCode.length > 6) {
      const shortCode = normalizedCode.substring(0, 6);
      const { data: shortMatches } = await supabase
        .from('hs_master_rebuild')
        .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
        .ilike('hs_code', `${shortCode}%`)
        .order('mfn_rate', { ascending: false })
        .limit(1);

      if (shortMatches && shortMatches.length > 0) {
        const match = shortMatches[0];
        return {
          hsCode: match.hs_code,
          description: match.description,
          confidence: 80,
          matchType: 'category',
          mfnRate: match.mfn_rate || 0,
          usmcaRate: match.usmca_rate || 0,
          country: match.country_source,
          displayText: `${match.hs_code} - ${match.description}`,
          confidenceText: 'Category match'
        };
      }
    }
    
    return null;

  } catch (error) {
    console.error('HS code lookup error:', error);
    return null;
  }
}

/**
 * Batch search for multiple components
 */
export async function findHSCodesForComponents(components) {
  const results = [];
  
  for (const component of components) {
    const matches = await findHSCodes(component.description);
    results.push({
      component: component.description,
      matches: matches,
      bestMatch: matches[0] || null
    });
  }
  
  return results;
}