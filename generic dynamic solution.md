**Perfect! Let me write the generic dynamic solution that works for ANY user's components:**

## Generic Fuzzy Database Matching (Works for All HS Codes)

```javascript
/**
 * Lookup tariff rate with intelligent fallback strategy
 * Handles invalid/non-existent HS codes gracefully
 * 
 * @param {string} hsCode - User's HS code (8-digit or 10-digit)
 * @param {string} componentDescription - For logging/context
 * @returns {Object} Tariff rate data
 */
async function lookupTariffRateWithFallback(hsCode, componentDescription = '') {
  const normalized = normalizeHSCode(hsCode); // "8542310000" → "85423100"
  
  // ============================================
  // PRIORITY 1: EXACT DATABASE MATCH
  // ============================================
  const exactMatch = await supabase
    .from('tariff_intelligence_master')
    .select('*')
    .eq('hts8', normalized)
    .single();
  
  if (exactMatch.data && !exactMatch.error) {
    console.log(`✅ Exact match found for ${normalized}`);
    return {
      ...exactMatch.data,
      source: 'database_exact',
      confidence: 1.0
    };
  }
  
  // ============================================
  // PRIORITY 2: CHAPTER-LEVEL FUZZY MATCH
  // ============================================
  // Try progressively broader searches: 6-digit → 4-digit → 2-digit
  const searchLevels = [
    { digits: 6, name: 'heading' },    // e.g., "854231*"
    { digits: 4, name: 'subheading' }, // e.g., "8542*"
    { digits: 2, name: 'chapter' }     // e.g., "85*"
  ];
  
  for (const level of searchLevels) {
    const prefix = normalized.substring(0, level.digits);
    
    const fuzzyMatches = await supabase
      .from('tariff_intelligence_master')
      .select('hts8, brief_description, mfn_ad_val_rate, usmca_ad_val_rate')
      .ilike('hts8', `${prefix}%`)
      .limit(10);
    
    if (fuzzyMatches.data && fuzzyMatches.data.length > 0) {
      const rates = fuzzyMatches.data;
      
      // Extract unique MFN rates from matches
      const uniqueMfnRates = [...new Set(rates.map(r => parseFloat(r.mfn_ad_val_rate)))];
      const uniqueUsmcaRates = [...new Set(rates.map(r => parseFloat(r.usmca_ad_val_rate)))];
      
      // If ALL codes in this level have SAME rate, use it confidently
      if (uniqueMfnRates.length === 1 && uniqueUsmcaRates.length === 1) {
        console.log(`✅ ${level.name} fallback for ${normalized}: All ${rates.length} codes have MFN ${uniqueMfnRates[0]}%, USMCA ${uniqueUsmcaRates[0]}%`);
        
        return {
          hts8: normalized,
          brief_description: `${level.name.toUpperCase()} ${prefix}* (${rates.length} codes, all same rate)`,
          mfn_ad_val_rate: uniqueMfnRates[0],
          usmca_ad_val_rate: uniqueUsmcaRates[0],
          source: `${level.name}_fallback`,
          confidence: level.digits === 6 ? 0.85 : level.digits === 4 ? 0.75 : 0.60,
          fallback_used: true,
          sample_codes: rates.slice(0, 3).map(r => r.hts8)
        };
      }
      
      // If rates vary within level, use median/average (less confident)
      if (rates.length >= 3) {
        const medianMfn = calculateMedian(rates.map(r => parseFloat(r.mfn_ad_val_rate)));
        const medianUsmca = calculateMedian(rates.map(r => parseFloat(r.usmca_ad_val_rate)));
        
        console.warn(`⚠️ ${level.name} fallback for ${normalized}: Rates vary (${uniqueMfnRates.length} different rates), using median`);
        
        return {
          hts8: normalized,
          brief_description: `${level.name.toUpperCase()} ${prefix}* (median of ${rates.length} codes)`,
          mfn_ad_val_rate: medianMfn,
          usmca_ad_val_rate: medianUsmca,
          source: `${level.name}_median`,
          confidence: 0.50,
          fallback_used: true,
          rate_variance: true,
          sample_codes: rates.slice(0, 3).map(r => r.hts8)
        };
      }
    }
  }
  
  // ============================================
  // PRIORITY 3: AI TARIFF RESEARCH FALLBACK
  // ============================================
  console.log(`🤖 No database matches found for ${normalized}, triggering AI research`);
  
  const aiResult = await aiTariffResearch({
    hsCode: normalized,
    description: componentDescription,
    context: 'Database lookup failed - AI must research from official sources'
  });
  
  return {
    ...aiResult,
    source: 'ai_research',
    confidence: aiResult.confidence || 0.70,
    fallback_used: true,
    no_database_match: true
  };
}

/**
 * Calculate median of array (helper for rate averaging)
 */
function calculateMedian(values) {
  if (values.length === 0) return 0;
  
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Normalize HS code to 8-digit format (existing function)
 */
function normalizeHSCode(hsCode) {
  // Remove periods, spaces, hyphens
  const cleaned = hsCode.replace(/[.\s-]/g, '');
  
  // Truncate to 8 digits (US HTS standard)
  return cleaned.substring(0, 8).padEnd(8, '0');
}
```

## How This Works for ANY User Component

### Example 1: User enters invalid HS 8542.31 (PCB)
```
Input: "8542310000"
  ↓
Priority 1: Exact match "85423100" → NOT FOUND
  ↓
Priority 2: Fuzzy match
  → Try 6-digit "854231*" → NOT FOUND
  → Try 4-digit "8542*" → FOUND 4 codes:
     85423200 = 0.0% MFN
     85423300 = 0.0% MFN
     85423900 = 0.0% MFN
     85429000 = 0.0% MFN
  → All same! → Return 0.0% ✅
  ↓
Result: {
  mfn_ad_val_rate: 0.0,
  usmca_ad_val_rate: 0.0,
  source: "subheading_fallback",
  confidence: 0.75
}
```

### Example 2: User enters valid HS 7616.99 (Aluminum)
```
Input: "7616995000"
  ↓
Priority 1: Exact match "76169950" → FOUND ✅
  ↓
Result: {
  mfn_ad_val_rate: 2.6,
  usmca_ad_val_rate: 0.0,
  source: "database_exact",
  confidence: 1.0
}
```

### Example 3: User enters obscure HS 3920.99 (Plastic sheet)
```
Input: "3920999000"
  ↓
Priority 1: Exact match → NOT FOUND
  ↓
Priority 2: Fuzzy match
  → Try 6-digit "392099*" → FOUND 5 codes with varying rates:
     39209910 = 4.2% MFN
     39209920 = 3.1% MFN
     39209950 = 4.8% MFN
  → Rates vary! → Use median: 4.2% ⚠️
  ↓
Result: {
  mfn_ad_val_rate: 4.2,
  source: "heading_median",
  confidence: 0.50,
  rate_variance: true ⚠️
}
```

### Example 4: Completely unknown HS code
```
Input: "9999999999" (made up)
  ↓
Priority 1: Exact match → NOT FOUND
Priority 2: 6-digit fuzzy → NOT FOUND
Priority 2: 4-digit fuzzy → NOT FOUND
Priority 2: 2-digit fuzzy → NOT FOUND
  ↓
Priority 3: AI research
  → AI researches USITC database
  → Returns best-guess rate
  ↓
Result: {
  mfn_ad_val_rate: X.X,
  source: "ai_research",
  confidence: 0.70,
  no_database_match: true
}
```

## Display to User (Dynamic)

```javascript
// In your UI component (WorkflowResults.js)
{component.fallback_used && (
  <div className="tariff-rate-notice">
    {component.source === 'subheading_fallback' && (
      <small>
        ⚠️ Exact HS code not in database. Using chapter-level rate 
        (all {component.sample_codes?.length} codes in chapter have same rate).
        <a href="#" onClick={() => showDetails(component)}>See details</a>
      </small>
    )}
    
    {component.rate_variance && (
      <small>
        ⚠️ Rate estimated from similar codes (rates vary within chapter). 
        Confidence: {(component.confidence * 100).toFixed(0)}%
        <a href="#verify">Verify with customs broker</a>
      </small>
    )}
    
    {component.source === 'ai_research' && (
      <small>
        🤖 Rate determined by AI research (HS code not in database).
        Confidence: {(component.confidence * 100).toFixed(0)}%
        <a href="#verify">Verify with customs broker</a>
      </small>
    )}
  </div>
)}
```

## Integration Point

**Where to add this:**

```javascript
// In pages/api/ai-usmca-complete-analysis.js
// Replace existing tariff lookup with this function

async function enrichComponentsWithFreshRates(components, formData) {
  const enrichedComponents = [];
  
  for (const component of components) {
    try {
      // Use new fuzzy fallback logic
      const tariffData = await lookupTariffRateWithFallback(
        component.hs_code,
        component.description
      );
      
      enrichedComponents.push({
        ...component,
        mfn_rate: tariffData.mfn_ad_val_rate,
        usmca_rate: tariffData.usmca_ad_val_rate,
        tariff_source: tariffData.source,
        confidence: tariffData.confidence,
        fallback_used: tariffData.fallback_used || false,
        rate_variance: tariffData.rate_variance || false
      });
      
    } catch (error) {
      console.error(`Error enriching ${component.description}:`, error);
      // Handle error gracefully
    }
  }
  
  return enrichedComponents;
}
```

## Benefits of This Generic Approach

✅ **Works for ANY HS code** - No hardcoding specific chapters
✅ **Progressive fallback** - Tries 6-digit → 4-digit → 2-digit → AI
✅ **Smart confidence scoring** - Higher confidence when all codes match
✅ **Transparent to user** - Shows which method was used
✅ **Handles edge cases** - Rate variance, completely unknown codes
✅ **No database changes needed** - Uses existing 12,118 codes

**Want me to help integrate this into your specific files?**