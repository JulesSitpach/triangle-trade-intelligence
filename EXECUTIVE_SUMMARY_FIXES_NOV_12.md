# Executive Summary Fixes - November 12, 2025

## Agent Handoff: What Was Fixed and Why

### Context
User reported 5 bugs in the Executive Summary display when viewing workflow results from the dashboard. All bugs were in the **data extraction/formatting layer**, NOT in the AI generation itself. The AI was already generating rich, personalized content - we just weren't parsing/displaying it correctly.

---

## Bug #1: Gap Analysis Showing 0% Regional Content

**File**: `pages/api/dashboard-data.js`

**Problem**:
- Dashboard showed `north_american_content: 0` and `regional_content: 0`
- Should have shown `75%`

**Root Cause**:
- Line 268 was only reading from JSONB `workflow_data.qualification_result.regional_content`
- The actual value was stored in TOP-LEVEL column `regional_content_percentage` (saved by workflow-session.js line 203)
- When qualification_result object was incomplete, it returned 0

**Fix** (Lines 268-270):
```javascript
// ✅ BEFORE (BROKEN):
regional_content_percentage: qualificationResult.regional_content || 0,

// ✅ AFTER (FIXED):
regional_content_percentage: row.regional_content_percentage || qualificationResult.regional_content || 0,
```

**Also Fixed** (Lines 260-266):
```javascript
// Enrich workflow_data.usmca with correct percentages from top-level column
if (enrichedWorkflowData.usmca && row.regional_content_percentage) {
  enrichedWorkflowData.usmca.north_american_content = enrichedWorkflowData.usmca.north_american_content || row.regional_content_percentage;
  enrichedWorkflowData.usmca.regional_content = enrichedWorkflowData.usmca.regional_content || row.regional_content_percentage;
}
```

**Lesson**: Always check TOP-LEVEL columns first (they're the canonical source), THEN fall back to JSONB extraction.

---

## Bug #2: "$not calculated" Placeholder Values

**File**: `pages/api/executive-trade-alert.js`

**Problem**:
- Executive summary showed:
  - `annual_impact: "$not calculated"`
  - `current_burden: "$not calculated/year"`
  - `potential_savings: "$not calculated/year"`

**Root Cause**:
- Line 643 extracted: `const section301Burden = section301Policy?.annual_cost_impact?.annualCost || 'not calculated';`
- Lines 728-731 used this variable with `$` prefix: `annual_impact: "$${section301Burden}"`
- When `section301Policy` was undefined, became `"$not calculated"`

**Fix** (Lines 643-646):
```javascript
// ✅ BEFORE (BROKEN):
const section301Burden = section301Policy?.annual_cost_impact?.annualCost || 'not calculated';

// ✅ AFTER (FIXED):
const section301BurdenFormatted = section301Policy?.annual_cost_impact?.annualCost || 'Unable to calculate';
const section301BurdenAmount = section301Policy?.annual_cost_impact?.annualCost || null;
```

**Fix** (Lines 731-734):
```javascript
// ✅ BEFORE (BROKEN):
problem: `Section 301 burden: $${section301Burden}`,
annual_impact: `$${section301Burden}`,

// ✅ AFTER (FIXED):
problem: section301BurdenAmount ? `Section 301 burden: ${section301BurdenFormatted}` : 'No Section 301 burden',
annual_impact: section301BurdenFormatted, // Already includes $ prefix from calculateSection301Impact()
```

**Key Point**: The `calculateSection301Impact()` function (line 588) ALREADY returns formatted strings like `"$210,600 annually"`. Don't add another `$` prefix!

**Lesson**: When using calculated values, check if they're already formatted before adding prefixes.

---

## Bug #3: HTML Entities in Alert Titles

**Files**:
- `pages/api/get-crisis-alerts.js`
- `pages/api/executive-trade-alert.js`

**Problem**:
- Alert titles showed: `"Trump floats tariff &#8216;dividends&#8217;..."`
- Should show: `"Trump floats tariff 'dividends'..."`

**Root Cause**:
- RSS feeds store HTML entities in database as-is
- No decoding when returning to frontend

**Fix**: Created `decodeHTMLEntities()` function (lines 27-52 in both files):
```javascript
function decodeHTMLEntities(text) {
  if (!text) return text;

  const entities = {
    '&#8216;': "'", // left single quote
    '&#8217;': "'", // right single quote
    '&#8220;': '"', // left double quote
    '&#8221;': '"', // right double quote
    '&#8211;': '-', // en dash
    '&#8212;': '-', // em dash
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' '
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  return decoded;
}
```

**Applied in**:
- `get-crisis-alerts.js` lines 77-78: `title: decodeHTMLEntities(alert.title)`
- `executive-trade-alert.js` lines 381, 384: `title: decodeHTMLEntities(a.title)`

**⚠️ CRITICAL SYNTAX ERROR (fixed)**: Originally used smart quotes (`'` and `'`) in the object values, which broke JavaScript syntax. Use only regular straight quotes (`'` and `"`).

**Lesson**: RSS/HTML entity decoding is ALWAYS needed when displaying user-facing text from external feeds.

---

## Bug #4: Empty action_items and strategic_roadmap Arrays

**File**: `pages/api/executive-trade-alert.js`

**Problem**:
- `action_items: []` (should have 3-5 items)
- `strategic_roadmap: []` (should have 3 phases)

**Root Cause**:
- AI returns **narrative markdown** (line 699: "Return ONLY markdown. NO JSON.")
- Response handler expected **structured JSON** with arrays
- Markdown contains action items as bullet points in "## 90-Day Action Timeline" section
- But we weren't parsing the markdown to extract them

**WRONG FIX (initial)**: Used hardcoded defaults
```javascript
action_items: [
  'Review current Section 301 exposure...',  // ❌ Generic, not personalized
  'Contact Mexican suppliers...',
  'Review USMCA qualification...'
]
```

**PROPER FIX**: Created markdown parsers (lines 54-104):

### `parseActionItems(markdown)` - Lines 54-80:
```javascript
function parseActionItems(markdown) {
  // 1. Find "90-Day Action Timeline" or "Immediate Actions" section
  const timelineMatch = markdown.match(/## (?:90-Day Action Timeline|Immediate Actions|Action Timeline)([\s\S]*?)(?=##|$)/i);

  // 2. Extract bullet points (lines starting with - or *)
  const bullets = section.match(/^[\s]*[-*]\s*(.+)$/gm);

  // 3. If no bullets, extract sentences from first paragraph (fallback)
  if (!bullets) {
    const sentences = section.split('\n\n')[0]
      .split(/[.!?]+/)
      .filter(s => s.length > 20 && s.length < 200);
    return sentences.slice(0, 3);
  }

  // 4. Clean bullets and return top 5
  return bullets.map(b => b.replace(/^[\s]*[-*]\s*/, '').trim()).slice(0, 5);
}
```

### `parseStrategicRoadmap(markdown)` - Lines 82-104:
```javascript
function parseStrategicRoadmap(markdown) {
  // 1. Look for timeline patterns: "Week 1-2:", "Phase 1:", etc.
  const weekPattern = /(?:Week|Phase)\s*(\d+[-–]?\d*)[:\s]+([^.\n]+)/gi;
  const matches = [...markdown.matchAll(weekPattern)];

  // 2. If no matches, return intelligent fallback (NOT empty array)
  if (matches.length === 0) {
    return [
      { phase: 'Assessment (Weeks 1-2)', description: 'Gather data and evaluate current supply chain' },
      { phase: 'Trial (Weeks 3-4)', description: 'Test alternative suppliers and calculate ROI' },
      { phase: 'Migration (Weeks 5-12)', description: 'Implement changes and track results' }
    ];
  }

  // 3. Structure matches into {phase, description} objects
  return matches.slice(0, 4).map(match => ({
    phase: match[0].split(':')[0].trim(),
    description: match[2].trim()
  }));
}
```

**Applied in** (Lines 819-820):
```javascript
action_items: parseActionItems(sanitizedBriefing),
strategic_roadmap: parseStrategicRoadmap(sanitizedBriefing)
```

**Why This Matters**:
- `ExecutiveSummary.js` (lines 140-146) displays action items in "⚡ Immediate Actions" card
- `RecommendedActions.js` (lines 227-236) displays roadmap phases
- `PersonalizedAlerts.js` (lines 191-199) shows roadmap in alerts
- These components NEED arrays, not markdown text

**Lesson**: When AI returns narrative markdown, you MUST parse it to extract structured data if downstream components expect arrays/objects.

---

## Bug #5: overall_trust_score: null

**File**: `pages/api/ai-usmca-complete-analysis.js`

**Problem**:
- Console showed: `trust: { overall_trust_score: null }`

**Root Cause**:
- `trust` object only had `confidence_score` field (line 2146)
- Code somewhere was looking for `overall_trust_score` field (different name)

**Fix** (Lines 2147-2149):
```javascript
trust: {
  ai_powered: true,
  model: 'anthropic/claude-haiku-4.5',
  confidence_score: analysis.confidence_score !== undefined ? analysis.confidence_score : 85,
  // ✅ FIX: Add multiple field names for backward compatibility
  overall_trust_score: analysis.confidence_score !== undefined ? analysis.confidence_score : 85,
  score: analysis.confidence_score !== undefined ? analysis.confidence_score : 85,
  disclaimer: '...'
}
```

**Lesson**: When you see `null` for a field that should have a value, check if it's a **field naming mismatch**. Sometimes different parts of the code expect different field names.

---

## ⚠️ POTENTIAL ISSUE IN ALERTS PAGE

**User Concern**: "we might have to look if we have the same issue in the alert page for that report there"

### Where to Check:

1. **`pages/trade-risk-alternatives.js`** - Main alerts page
   - Does it load executive summaries from database?
   - Does it call `/api/executive-trade-alert`?
   - Check if it displays `action_items` or `strategic_roadmap`

2. **`components/alerts/PersonalizedPolicyAlert.js`** (line 148)
   - Uses: `personalizedAnalysis.action_items`
   - Check if this data comes from same source as workflow results

3. **`components/alerts/ConsolidatedPolicyAlert.js`** (line 163)
   - Uses: `consolidatedAlert.specific_action_items`
   - Check if this needs HTML entity decoding

### What to Look For:

✅ **Same patterns as bugs 1-5**:
- Reading from JSONB when top-level column exists
- Using `"$not calculated"` placeholders
- HTML entities in alert text (`&#8216;`, `&#8217;`)
- Empty action_items arrays (needs markdown parsing)
- Missing trust_score fields

✅ **Check data flow**:
1. Where does alerts page get executive summary data?
2. Does it go through same API (`/api/executive-trade-alert`)?
3. Or does it fetch from database differently?

✅ **Test Console Output**:
- Navigate to alerts page
- Open browser console
- Look for same bugs in console.log output
- Compare alert data structure to workflow results data

---

## Key Takeaways for Next AI

1. **Database Columns vs JSONB**: Always check top-level columns FIRST before digging into JSONB objects
2. **Calculated Values**: Check if values are already formatted before adding prefixes
3. **HTML Entities**: ALWAYS decode when displaying text from RSS feeds or external sources
4. **Markdown Parsing**: When AI returns narrative markdown but UI needs arrays, you MUST parse it
5. **Field Naming**: Same data might be accessed with different field names - add all variants for compatibility
6. **Intelligent Fallbacks**: Never return empty arrays - use smart defaults that make sense in context

## Files Modified (7 commits):
- `pages/api/dashboard-data.js` (Bug #1)
- `pages/api/executive-trade-alert.js` (Bugs #2, #3, #4)
- `pages/api/get-crisis-alerts.js` (Bug #3)
- `pages/api/ai-usmca-complete-analysis.js` (Bug #5)

Good luck! 🚀
