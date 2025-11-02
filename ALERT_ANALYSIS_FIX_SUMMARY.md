# Alert Impact Analysis Fix - Make It "Amazing" (Nov 1-2, 2025)

## Problem
The "Generate Strategic Analysis" button on `/trade-risk-alternatives` was producing **generic placeholder output** instead of the detailed, company-specific analysis shown in the Results page (`result page ai report.md`).

### What Users Saw
```
Your Action: [empty or placeholder]
Cost Impact: [empty or placeholder]
Scenario A: Portfolio-wide response (generic)
Scenario B: Portfolio-wide response (generic)
```

### Root Cause
The alert impact analysis prompt had two problems:

1. **Empty Context**: `existingAnalysis` was being passed as `{}` (empty object) to the AI
   - No workflow intelligence loaded from database
   - No component details provided to AI
   - AI had no rich context to work with → generated generic placeholders

2. **Weak Prompt Requirements**: AI prompt had placeholder examples but didn't enforce specific output
   - JSON format showed examples like `"Portfolio-wide response"`
   - AI followed the examples instead of calculating specifics
   - No penalties for generic language

## Solution Implemented

### 1. Build Rich Context from Workflow Data
**File**: `pages/trade-risk-alternatives.js` (lines 850-928)

**Two-Path Logic**:

**Path A** (User generated executive summary):
```javascript
if (workflowIntelligence && workflowIntelligence.detailed_analysis) {
  // Use saved executive summary with rich USMCA context
  existingAnalysis = {
    situation_brief: analysis.situation_brief,
    problem: analysis.problem,
    root_cause: analysis.root_cause,
    annual_impact: analysis.annual_impact,
    // ... complete with all fields from executive summary
  };
}
```

**Path B** (No executive summary yet - calculate from components):
```javascript
else if (userProfile && userProfile.componentOrigins?.length > 0) {
  // Build detailed context from actual components

  // Identify highest-risk components
  const riskComponents = components.filter(c => c.section_301 || c.total_rate > 0.15);
  const highestRiskComponent = riskComponents[0] || components[0];

  // Calculate specific financial metrics
  const section301Burden = components.reduce((sum, c) => {
    const componentValue = tradeVolume * (c.value_percentage / 100);
    return sum + (componentValue * c.section_301);
  }, 0);

  const mfnCost = components.reduce((sum, c) => {
    const componentValue = tradeVolume * (c.value_percentage / 100);
    return sum + (componentValue * c.mfn_rate);
  }, 0);

  const usmcaCost = components.reduce((sum, c) => {
    const componentValue = tradeVolume * (c.value_percentage / 100);
    return sum + (componentValue * c.usmca_rate);
  }, 0);

  const annualSavings = mfnCost - usmcaCost;

  // Build specific context
  existingAnalysis = {
    situation_brief: `${companyName} has ${qualificationStatus} products with ${regionalContent}% regional content and $${tradeVolume.toLocaleString()} annual trade volume.`,
    problem: `Primary supply chain risk: ${highestRiskComponent.description} from ${highestRiskComponent.origin_country} creates $${Math.round(section301Burden).toLocaleString()} Section 301 exposure.`,
    root_cause: `Supply chain concentration: ${highestRiskComponent.value_percentage}% of product value sourced from ${highestRiskComponent.origin_country}, creating regulatory and tariff vulnerability.`,
    annual_impact: section301Burden,
    current_burden: section301Burden,
    potential_savings: annualSavings,
    // ...
  };
}
```

### 2. Strengthen AI Prompt Requirements
**File**: `lib/services/alert-impact-analysis-service.js` (lines 278-390)

**Added CRITICAL REQUIREMENTS Section** (lines 280-287):
```javascript
CRITICAL REQUIREMENTS:
- DO NOT use placeholder text like "Portfolio-wide response" - REPLACE with specific actions
- DO NOT use generic dollar amounts - CALCULATE from affected components
- DO NOT be vague - name specific suppliers, countries, dates, percentages
- DO NOT repeat existing strategic plan above - ADD incremental intelligence from alerts
- MUST ground all recommendations in the company's specific situation: ${userProfile.companyName}, ${userProfile.industry_sector}
- MUST use specific component names and origins from their portfolio
- MUST calculate financial impact in dollars (not percentages)
```

**Enhanced Task Definitions** (lines 289-337):

For companies WITH alerts:
```
1. PORTFOLIO IMPACT SUMMARY - Specific impact with component names and dollar amounts
2. UPDATED PRIORITIES - [URGENT - SPECIFIC DATE] Action for component X from country Y ($XXX,XXX protected)
3. MONITORING INTELLIGENCE - Name specific policy changes and trigger events with dates
```

For companies WITHOUT alerts (strong compliance):
```
1. STRONG COMPLIANCE STATUS - Confirm no threats with specific numbers
2. PROACTIVE OPTIMIZATION - Name component, origin country, provide specific ROI calculation
```

**Enhanced JSON Format Requirements** (lines 339-390):

Old (generic):
```json
{
  "portfolio_impact_summary": "Portfolio-wide impact in 2-3 sentences",
  "updated_priorities": ["[URGENT - 30 days] Action"],
  "coordinated_action_this_week": {
    "action": "Contact all suppliers simultaneously"
  }
}
```

New (specific):
```json
{
  "portfolio_impact_summary": "2-3 sentences specific to ${userProfile.companyName}: name affected components, countries, and specific dollar amounts",
  "updated_priorities": [
    "[URGENT - SPECIFIC DATE] Specific action for specific component from specific country ($X,XXX,XXX protection)"
  ],
  "contingency_scenarios": [
    {
      "scenario": "A",
      "coordinated_action": "SPECIFIC actions for ${userProfile.companyName}: Name components (e.g., 'Shift microprocessor from China to Mexico'), suppliers, timeline",
      "portfolio_impact": "SPECIFIC financial impact: If this occurs, your $${tradeVolume.toLocaleString()} portfolio would see [dollar amount] additional cost/savings"
    }
  ],
  "coordinated_action_this_week": {
    "action": "SPECIFIC action naming components, countries, suppliers",
    "time_investment": "Specific estimate (e.g., '8 hours for customs broker calls')",
    "platform_value": "Reference the existing plan above - how does this week's action support it?"
  }
}
```

## Testing & Verification

### Context Building Test
Ran test with TechFlow Electronics scenario:

**Input**:
- Company: TechFlow Electronics, $8.5M annual trade volume, 65% RVC
- Components: China microprocessor (35%), Mexico power supply (30%)
- Tariffs: 60% Section 301 on China component

**Output Context Generated**:
```
situation_brief: "TechFlow Electronics has USMCA qualified products with 65% regional content and $8,500,000 annual trade volume."

problem: "Primary supply chain risk: Microprocessor (ARM-based) from CN creates $1,785,000 Section 301 exposure."

root_cause: "Supply chain concentration: 35% of product value sourced from CN, creating regulatory and tariff vulnerability."

annual_impact: 1,785,000
potential_savings: 1,041,250
payback_period: "3-6 months"
```

**Financial Calculations**:
- Section 301 Burden: **$1,785,000** (specific, not generic)
- MFN Cost: **$1,079,500** (calculated)
- USMCA Cost: **$38,250** (calculated)
- Annual Savings: **$1,041,250** (specific)

✅ **Result**: Rich, company-specific context ready for AI to generate detailed analysis

## Impact

### Before Fix
- Alert analysis produced generic text
- No specific dollar amounts
- Placeholder actions like "contact suppliers"
- No reference to user's actual components or tariff rates

### After Fix
- Alert analysis will produce **detailed, company-specific recommendations**
- All financial impacts calculated in dollars
- Specific component names and origins referenced
- Actionable timelines with supplier names
- USMCA 2026 scenarios tailored to company's RVC and qualification status
- Example: Instead of "Optimize sourcing," AI will say "Shift Microprocessor sourcing from China to Mexico suppliers (Heilind Mexico, Tech Data Mexico) at 2.5% cost premium ($74,375/year) with 3-week qualification timeline"

## Files Modified

1. **pages/trade-risk-alternatives.js** (lines 850-928)
   - Added two-path context building logic
   - Calculates financial metrics from components
   - Loads workflow intelligence from database if available
   - Added debug logging to diagnose context passing

2. **lib/services/alert-impact-analysis-service.js** (lines 278-390)
   - Strengthened prompt with CRITICAL REQUIREMENTS section
   - Enhanced task definitions with specific examples
   - Updated JSON format to demand detailed, company-specific output
   - Added sample output structure showing required format

## Testing Instructions

1. **Complete a USMCA workflow** on `/usmca-workflow`:
   - Company: Your Company
   - Components with tariff data loaded

2. **Navigate to** `/trade-risk-alternatives`

3. **Click "Generate Strategic Analysis"**

4. **Verify output includes**:
   - ✅ Company name and specific financial amounts
   - ✅ Named components from your BOM (e.g., "Microprocessor from China")
   - ✅ Specific dollar amounts for Section 301, savings, etc.
   - ✅ Dated action items with supplier names
   - ✅ USMCA 2026 scenarios with impact calculations for your RVC status
   - ✅ No placeholder text or generic responses

## What "Amazing" Looks Like

See `result page ai report.md` for example of desired output quality:

✅ **Specific situation brief**: "TechFlow Electronics Corp operates with zero RVC safety margin..."
✅ **Detailed problem**: "Your smartphone assembly qualifies for USMCA at exactly the 65% threshold..."
✅ **Quantified impact**: "$1,785,000 in current Section 301 tariff obligations..."
✅ **Actionable roadmap**: Phase 1 (Weeks 1-2), Phase 2 (Weeks 3-6), Phase 3 (Weeks 7-12)
✅ **Specific recommendations**: "Contact Heilind Mexico, Tech Data Mexico, Arrow Electronics Mexico..."
✅ **Financial analysis**: "Nearshoring investment $80,000-$150,000, payback 3-4 weeks"

## Deployment

✅ Committed to `main` (auto-deploys to Vercel)
✅ Changes backward compatible (doesn't break existing functionality)
✅ Debug logging added to help diagnose future issues
