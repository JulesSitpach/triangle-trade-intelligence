/**
 * HS Code Verification API
 * Verifies HS codes against database and returns verification status
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { hs_code } = req.body;

  if (!hs_code) {
    return res.status(400).json({ error: 'HS code is required' });
  }

  try {
    // Normalize HS code format - remove dots, spaces, dashes
    const normalizeHSCode = (code) => code.toString().replace(/[\.\s\-]/g, '');
    const normalizedInputCode = normalizeHSCode(hs_code);
    
    console.log(`🔍 HS Code Lookup: Input "${hs_code}" -> Normalized "${normalizedInputCode}"`);
    
    const { serverDatabaseService } = await import('../../../lib/database/supabase-client.js');
    
    // STEP 1: Try exact match with normalized code
    let { data: hsCodeData, error } = await serverDatabaseService.client
      .from('hs_master_rebuild')
      .select('*')
      .eq('hs_code', normalizedInputCode)
      .limit(1);

    // STEP 2: If no exact match, try progressive fuzzy matching
    if (!hsCodeData || hsCodeData.length === 0) {
      console.log(`❌ Exact match failed for ${normalizedInputCode}, trying fuzzy matching...`);
      
      // ENHANCED FUZZY PATTERNS: More comprehensive matching strategies
      const fuzzyPatterns = [
        normalizedInputCode.substring(0, 8),  // 85444290 -> 85444290
        normalizedInputCode.substring(0, 7),  // 85444290 -> 8544429  
        normalizedInputCode.substring(0, 6),  // 85444290 -> 854442
        normalizedInputCode.substring(0, 5),  // 85444290 -> 85444 (this should catch 85444930!)
        normalizedInputCode.substring(0, 4)   // 85444290 -> 8544 (broader fallback)
      ];
      
      // COLLECT ALL CANDIDATES from all patterns, then find best match
      let allCandidates = [];
      
      for (const pattern of fuzzyPatterns) {
        const { data: fuzzyData } = await serverDatabaseService.client
          .from('hs_master_rebuild')
          .select('*')
          .ilike('hs_code', `${pattern}%`)
          .limit(15); // Get more candidates from each pattern
          
        if (fuzzyData && fuzzyData.length > 0) {
          console.log(`✅ Pattern ${pattern}% found ${fuzzyData.length} matches:`, fuzzyData.map(d => d.hs_code));
          allCandidates.push(...fuzzyData);
        }
      }
      
      if (allCandidates.length > 0) {
        // Remove duplicates
        const uniqueCandidates = allCandidates.filter((candidate, index, self) => 
          index === self.findIndex(c => c.hs_code === candidate.hs_code)
        );
        
        console.log(`🔍 Total unique candidates: ${uniqueCandidates.length}`);
        
        // SMART MATCHING: Prioritize by length similarity, functional relevance, and numeric closeness
        const scoredMatches = uniqueCandidates.map(record => {
          const lengthScore = 1 - Math.abs(record.hs_code.length - normalizedInputCode.length) / 10;
          const prefixMatchLength = getLongestCommonPrefix(record.hs_code, normalizedInputCode);
          const prefixScore = prefixMatchLength / Math.max(record.hs_code.length, normalizedInputCode.length);
          
          // FUNCTIONAL RELEVANCE BONUS: Prioritize functionally related subcategories
          const inputSubcategory = normalizedInputCode.substring(0, 4); // e.g., "8544" for cables
          const recordSubcategory = record.hs_code.substring(0, 4);
          const functionalBonus = inputSubcategory === recordSubcategory ? 0.15 : 0;
          
          // TARIFF RELEVANCE BONUS: Favor codes with meaningful tariff rates
          const tariffBonus = record.mfn_rate > 0 ? 0.1 : 0;
          
          // WEIGHTED SCORING: Functional match > Prefix match > Length > Tariff
          const totalScore = (functionalBonus * 0.4) + (prefixScore * 0.3) + (lengthScore * 0.2) + tariffBonus;
          
          console.log(`   ${record.hs_code}: prefix=${prefixMatchLength}, functional=${functionalBonus > 0 ? 'YES' : 'NO'}, score=${totalScore.toFixed(3)} (MFN: ${record.mfn_rate}%)`);
          return { record, score: totalScore };
        });
        
        // Sort by score and take the best match
        scoredMatches.sort((a, b) => b.score - a.score);
        const bestMatch = scoredMatches[0];
        
        console.log(`🎯 BEST MATCH: ${bestMatch.record.hs_code} (score: ${bestMatch.score.toFixed(3)}, MFN: ${bestMatch.record.mfn_rate}%)`);
        hsCodeData = [bestMatch.record];
      }
      
      // Helper function to get longest common prefix
      function getLongestCommonPrefix(str1, str2) {
        let i = 0;
        while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
          i++;
        }
        return i;
      }
    } else {
      console.log(`✅ Exact match found: ${hsCodeData[0].hs_code}`);
    }

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (hsCodeData && hsCodeData.length > 0) {
      const hsRecord = hsCodeData[0];
      
      // Calculate trust score based on data availability
      const trustScore = calculateTrustScore({
        hsCodeExists: true,
        hasDescription: !!hsRecord.description,
        hasTariffData: !!(hsRecord.mfn_rate || hsRecord.usmca_rate),
        dataSource: hsRecord.country_source || 'hs_master_rebuild'
      });

      return res.json({
        success: true,
        verified: true,
        hs_code: hsRecord.hs_code, // Use the actual matched HS code from database
        input_code: hs_code,       // Original user input for reference
        description: hsRecord.description,
        source: `Official ${hsRecord.country_source} Database`,
        trust_score: trustScore,
        verification_timestamp: new Date().toISOString(),
        match_type: hsRecord.hs_code === normalizedInputCode ? 'exact' : 'fuzzy',
        tariff_info: {
          mfn_rate: hsRecord.mfn_rate,
          usmca_rate: hsRecord.usmca_rate,
          usmca_eligible: hsRecord.usmca_rate !== null,
          rates: [{
            country: hsRecord.country_source,
            mfn_rate: hsRecord.mfn_rate,
            usmca_rate: hsRecord.usmca_rate
          }]
        },
        alternatives: await findAlternativeHsCodes(hsRecord.hs_code)
      });
    } else {
      // HS code not found
      const trustScore = calculateTrustScore({
        hsCodeExists: false,
        requiresManualVerification: true
      });

      return res.json({
        success: true,
        verified: false,
        error: 'HS code not found in database',
        trust_score: trustScore,
        recommendation: 'Manual verification with customs broker recommended'
      });
    }
  } catch (error) {
    console.error('HS code verification failed:', error);
    
    return res.json({
      success: false,
      verified: false,
      error: 'Verification service unavailable',
      trust_score: 0.0,
      fallback: 'Contact licensed customs broker for verification'
    });
  }
}

/**
 * Calculate trust score based on data quality
 */
function calculateTrustScore(factors) {
  let score = 0.0;
  
  if (factors.hsCodeExists) score += 0.3;
  if (factors.hasDescription) score += 0.2;
  if (factors.hasTariffData) score += 0.2;
  if (factors.hasCompleteSupplyChain) score += 0.2;
  if (factors.hasManufacturingLocation) score += 0.1;
  if (factors.dataSourceReliability) score += 0.1;
  if (factors.requiresManualVerification) score = Math.max(0.1, score * 0.5);
  
  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Find functionally relevant alternative HS codes
 */
async function findAlternativeHsCodes(hsCode) {
  try {
    const { serverDatabaseService } = await import('../../../lib/database/supabase-client.js');
    
    const chapter = hsCode.substring(0, 2);
    const subcategory = hsCode.substring(0, 4); // e.g., "8544" for cables
    
    console.log(`🔍 Finding alternatives for ${hsCode} (chapter: ${chapter}, subcategory: ${subcategory})`);
    
    // PRIORITY 1: Same subcategory (most functionally relevant)
    let { data: sameSubcategory } = await serverDatabaseService.client
      .from('hs_master_rebuild')
      .select('hs_code, description, mfn_rate')
      .like('hs_code', `${subcategory}%`)
      .neq('hs_code', hsCode)
      .limit(5);
    
    // PRIORITY 2: Same chapter but different subcategory (if we need more)
    let alternatives = sameSubcategory || [];
    
    if (alternatives.length < 3) {
      const { data: sameChapter } = await serverDatabaseService.client
        .from('hs_master_rebuild')
        .select('hs_code, description, mfn_rate')
        .like('hs_code', `${chapter}%`)
        .not('hs_code', 'like', `${subcategory}%`)
        .neq('hs_code', hsCode)
        .limit(3 - alternatives.length);
      
      alternatives = [...alternatives, ...(sameChapter || [])];
    }

    // Score alternatives by functional relevance
    return alternatives.map(alt => {
      const altSubcategory = alt.hs_code.substring(0, 4);
      const isSameSubcategory = altSubcategory === subcategory;
      const confidence = isSameSubcategory ? 0.8 : 0.5;
      
      console.log(`   Alternative: ${alt.hs_code} (subcategory: ${altSubcategory}, confidence: ${confidence})`);
      
      return {
        hs_code: alt.hs_code,
        description: alt.description,
        confidence: confidence,
        functional_match: isSameSubcategory,
        mfn_rate: alt.mfn_rate
      };
    }).sort((a, b) => b.confidence - a.confidence);
    
  } catch (error) {
    console.error('Error finding alternatives:', error);
    return [];
  }
}