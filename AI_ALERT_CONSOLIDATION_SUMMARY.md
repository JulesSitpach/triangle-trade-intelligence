# Intelligent Alert Consolidation System

**Problem Solved**: Alert fatigue from redundant "URGENT" messages about the same underlying issues.

## Before vs. After

### BEFORE (The Problem)
```
❌ Section 301 Tariffs on Chinese Imports (8/10 relevance, URGENT)
   - Impact: $500K annually
   - Action: "Contact Crisis Navigator team" (generic)

❌ Port Fee Increases for Chinese Vessels (8/10 relevance, URGENT)
   - Impact: $300K annually
   - Action: "Find alternative suppliers" (obvious)

❌ Transshipment Investigation: Vietnam/Thailand (8/10 relevance, URGENT)
   - Impact: $200K annually
   - Action: "Evaluate Mexico-based suppliers" (duh)

ISSUES:
- 3 separate alerts about the same Chinese component issue
- All marked "URGENT" (alert fatigue)
- Unclear if costs stack ($500K? $1M total?)
- Generic recommendations everyone already knows
- Links dump to massive government PDFs
```

### AFTER (The Solution)
```
✅ China Component Risk (Consolidated from 3 related policies)
   Urgency: HIGH (not everything is 10/10)
   Timeline: Policy effective Oct 31, affects 40% of supply chain

   💰 Total Financial Impact: ~$550K annually
   Breakdown: 25% Section 301 tariff on $2.2M Chinese components
   How costs stack: Section 301 (25%) applies on top of MFN rate (0%).
                    Port fees (3%) are separate vessel charges.

   💡 What You Might NOT Know:
   - Section 301 tariffs stack on MFN rates (total 25% for these HS codes)
   - Vietnam/Thailand suppliers also under investigation for transshipment
   - Exemption requests due by Oct 15 deadline (only 2 weeks left!)

   ✅ Specific Actions:
   1. Review HS 8542.31.00 classification - some subcategories may have lower rates
   2. Check if your Vietnam supplier is manufacturing or just transshipping Chinese goods
   3. File Section 301 exemption request before Oct 15 (tight deadline)

   [Toggle to show] What You Probably Already Know:
   - Need to diversify from China
   - Mexico manufacturing could help USMCA qualification
```

## New System Architecture

### 1. Alert Consolidation API (`/api/consolidate-alerts`)

**Groups related alerts by:**
- Same country/region (e.g., all China-related)
- Same component types (e.g., microcontrollers)
- Related policy types (Section 301 + Port Fees = one China issue)

**AI Consolidation Prompt:**
```javascript
// Tells AI to:
- Group related issues (don't treat Section 301 + Port Fees as 3 separate crises)
- Calibrate urgency (not everything is 10/10)
- Clarify cost math (one total impact, not duplicated amounts)
- Skip obvious advice ("find other suppliers" - they know!)
- Extract specifics (what's ACTUALLY new and actionable)
```

### 2. Consolidated Alert Display Component

**New component: `ConsolidatedPolicyAlert.js`**

Shows:
- **Consolidated title** ("China Component Risk" not "Section 301 Tariffs")
- **Calibrated urgency** (URGENT/HIGH/MEDIUM/LOW with reasoning)
- **Total financial impact** (clear cost calculation, explains stacking)
- **What you might NOT know** (skip obvious advice)
- **Specific action items** (deadlines, HS code subcategories, exemption windows)
- **Related alerts** (collapsed - shows what was consolidated)

### 3. Trade Risk Alternatives Page Integration

**Workflow:**
```
1. Load real policy alerts from database
2. Filter alerts relevant to user's components
3. Call consolidation API → Groups related alerts
4. Display consolidated alerts (reduces 10 alerts → 3 smart groups)
5. Fallback to individual alerts if consolidation fails
```

**User sees:**
```
"Consolidated 10 related policies → 3 actionable alerts"
```

## Key Improvements

### 1. Reduced Alert Fatigue
- **Before**: 10+ alerts, all marked "URGENT"
- **After**: 3 consolidated groups with calibrated urgency

### 2. Clear Cost Calculations
- **Before**: "$500K Section 301 + $300K port fees + $200K transshipment" (confusing)
- **After**: "~$550K total (Section 301 25% on $2.2M components. Port fees separate operational cost)"

### 3. Skip Obvious Advice
- **Before**: "Contact Crisis Navigator", "Find alternative suppliers" (everyone knows this)
- **After**: "File exemption request before Oct 15", "Check HS 8542.31.00 subcategories"

### 4. Extract Specifics from Government Docs
- **Before**: Link to 50-page government PDF
- **After**: "Section 301 stacks on MFN rates", "Exemption deadline Oct 15"

### 5. Realistic Urgency Calibration
```javascript
URGENT: Immediate action required (days) - rare
HIGH: Address within 2-4 weeks - most policy changes
MEDIUM: Plan for next quarter - strategic shifts
LOW: Monitor for now - minimal impact
```

## AI Prompt Engineering

### Consolidation Prompt Strategy

**Critical rules sent to AI:**
```
1. ONE consolidated impact calculation (not 3 separate amounts)
2. Realistic urgency (not everything is URGENT)
3. Skip obvious recommendations
4. Focus on specific, actionable, non-obvious insights
5. Explain how tariffs/fees stack or don't stack
```

**Example AI reasoning:**
- Recognizes Section 301, Port Fees, and Transshipment all relate to China
- Groups into "China Component Risk (Consolidated)"
- Calculates total impact ONCE: $550K (not $500K+$300K+$200K)
- Explains stacking: "Section 301 applies on MFN. Port fees are separate."
- Extracts deadline: "Exemption requests due Oct 15 (2 weeks left)"

## Files Created/Modified

### New Files
1. `pages/api/consolidate-alerts.js` - Consolidation API endpoint
2. `components/alerts/ConsolidatedPolicyAlert.js` - Display component
3. `AI_ALERT_CONSOLIDATION_SUMMARY.md` - This documentation

### Modified Files
1. `pages/trade-risk-alternatives.js` - Integrated consolidation workflow

## Testing Scenario

**Input**: 3 alerts about Chinese microcontrollers
- Section 301 Tariffs (100% increase)
- Port Fee Increases (3% vessel charges)
- Transshipment Investigation (Vietnam/Thailand)

**Expected Output**: 1 consolidated alert
- Title: "China Component Risk (Consolidated)"
- Urgency: HIGH (not URGENT - policy effective in 2 weeks)
- Total Impact: ~$550K annually (clear calculation)
- Specific actions with deadlines
- Explains tariff stacking clearly

## Business Benefits

### For Users
- **Less noise**: 10 alerts → 3 consolidated (70% reduction)
- **Clear costs**: One total impact, not confusing duplicates
- **Actionable insights**: Specific steps, not generic advice
- **Better prioritization**: Calibrated urgency, not everything urgent

### For Triangle Intelligence
- **Reduced support burden**: Users have clear information
- **Higher trust**: Smart consolidation shows understanding
- **Better engagement**: Users act on specific advice vs. ignore generic alerts
- **Competitive advantage**: No other platform does intelligent alert consolidation

## Future Enhancements

### Phase 2 (Future)
1. **Alert history tracking**: Show how alerts change over time
2. **Exemption deadline tracking**: Countdown timers for critical deadlines
3. **Automated filing assistance**: Pre-fill exemption request forms
4. **Email digest**: Weekly consolidated summary instead of real-time spam
5. **Custom alert rules**: User-defined consolidation preferences

### Phase 3 (Future)
1. **Predictive alerts**: AI predicts policy changes before announcement
2. **Supplier-specific recommendations**: "Your Vietnam supplier likely affected"
3. **Cost scenario modeling**: "If tariff increases to 50%, impact is $1.1M"
4. **Integration with ERP**: Auto-update cost models in user's system
