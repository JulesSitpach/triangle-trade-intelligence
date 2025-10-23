# Alert Content Richness - Implementation Quick Reference

## TL;DR

**What**: Use AI-generated alert content (already being created) instead of hardcoded message templates
**Where**: `crisis-alert-service.js` lines 604-664 (`generateAlertMessage` function)
**Why**: Transforms alerts from 3-line generic spam into personalized subscriber-retention intelligence
**How**: Refactor to use `consolidatedAlert` fields instead of building own message
**Effort**: ~2-3 hours (mostly formatting, no new API calls)

---

## Current Architecture

```
consolidate-alerts.js (OpenRouter API)
  ↓
  Generates rich structured response:
  {
    broker_summary: "..150 words with calculations..",
    explanation: "..detailed analysis..",
    specific_action_items: ["..concrete steps.."],
    mitigation_scenarios: [{cost, timeline, benefit, recommended}],
    what_you_might_not_know: ["..non-obvious insights.."],
    consolidated_impact: {total_annual_cost, breakdown, confidence},
    affected_components: [{component, %, origin, hs_code}]
  }
  ↓
  ❌ This rich data is IGNORED
  ↓
crisis-alert-service.js
  ↓
  ❌ Builds generic message with hardcoded structure instead
  ↓
  Result: 3-line generic alert discards $50K worth of AI analysis
```

## What Needs to Change

### Current Function Signature
```javascript
generateAlertMessage(user, crisisAnalysis, crisisImpact, rssItem, workflowContext = null)
```

### New Function Signature
```javascript
generateAlertMessage(user, consolidatedAlert, workflowContext = null)
```

Where `consolidatedAlert` is the full object returned from `consolidate-alerts.js`.

### Current Return Format (Generic)
```
🚨 CRISIS ALERT: Acme Manufacturing

Your product is affected by:
Section 301 Tariffs...
[3 generic lines]
```

### New Return Format (Rich)
```markdown
🚨 CRISIS ALERT: Acme Manufacturing

[1] AI-generated broker_summary with personalized calculations
[2] YOUR AFFECTED COMPONENTS with actual percentages
[3] KEY INSIGHTS specific to this company
[4] SPECIFIC ACTIONS (not generic)
[5] OPTIONS with costs, timelines, recommendations
[6] DETAILED ANALYSIS with calculations shown
[7] TIMELINE AND SOURCES
```

---

## Implementation Checklist

### Phase 1: Refactor generateAlertMessage Function

**File**: `lib/services/crisis-alert-service.js` lines 604-664

**Old Code Pattern**:
```javascript
generateAlertMessage(user, crisisAnalysis, crisisImpact, rssItem, workflowContext = null) {
  let message = `${urgencyEmoji} CRISIS ALERT: ${user.companyName}\n\n`;
  message += `Your product...`; // Hardcoded pattern
  message += `FINANCIAL IMPACT...`; // Hardcoded calculation format
  // ... more hardcoded sections
  return message;
}
```

**New Code Pattern**:
```javascript
generateAlertMessage(user, consolidatedAlert, workflowContext = null) {
  const urgencyEmoji = consolidatedAlert.urgency === 'URGENT' ? '🚨' :
                       consolidatedAlert.urgency === 'HIGH' ? '⚠️' : 'ℹ️';

  let message = `${urgencyEmoji} CRISIS ALERT: ${user.companyName}\n\n`;

  // 1. Use AI-generated broker_summary (rich, personalized)
  if (consolidatedAlert.broker_summary) {
    message += `${consolidatedAlert.broker_summary}\n\n`;
  }

  // 2. Show actual components with percentages from consolidatedAlert
  if (consolidatedAlert.affected_components?.length > 0) {
    message += `## YOUR AFFECTED COMPONENTS\n`;
    consolidatedAlert.affected_components.forEach(comp => {
      message += `- ${comp.component}: ${comp.percentage}% from ${comp.origin}\n`;
    });
    message += `\n`;
  }

  // 3. AI-generated insights specific to this company
  if (consolidatedAlert.what_you_might_not_know?.length > 0) {
    message += `## KEY INSIGHTS YOU MIGHT MISS\n`;
    consolidatedAlert.what_you_might_not_know.forEach(insight => {
      message += `- ${insight}\n`;
    });
    message += `\n`;
  }

  // 4. AI-generated action items (not hardcoded)
  if (consolidatedAlert.specific_action_items?.length > 0) {
    message += `## ACTIONS TO TAKE\n`;
    consolidatedAlert.specific_action_items.forEach(action => {
      message += `- ${action}\n`;
    });
    message += `\n`;
  }

  // 5. Mitigation scenarios with AI-calculated costs
  if (consolidatedAlert.mitigation_scenarios?.length > 0) {
    message += `## YOUR OPTIONS\n`;
    consolidatedAlert.mitigation_scenarios.forEach(scenario => {
      message += `\n### ${scenario.title}\n`;
      message += `- Cost: ${scenario.cost_impact}\n`;
      message += `- Timeline: ${scenario.timeline}\n`;
      if (scenario.recommended) {
        message += `✅ **RECOMMENDED**\n`;
      }
    });
    message += `\n`;
  }

  // 6. Detailed analysis from AI
  if (consolidatedAlert.explanation) {
    message += `## DETAILED ANALYSIS\n${consolidatedAlert.explanation}\n\n`;
  }

  // 7. Timeline and urgency reasoning
  message += `## TIMELINE\n`;
  message += `- Effective: ${consolidatedAlert.effective_date}\n`;
  message += `- Urgency: ${consolidatedAlert.urgency}\n`;
  message += `- Reason: ${consolidatedAlert.urgency_reasoning}\n\n`;

  message += `This alert combines official government data with your specific trade analysis.`;

  return message;
}
```

### Phase 2: Update All Call Sites

**Where `generateAlertMessage` is called:**

1. **In `createPersonalizedAlert` method** (line ~502):
   ```javascript
   // OLD:
   message: this.generateAlertMessage(user, crisisAnalysis, crisisImpact, rssItem, workflowContext)

   // NEW:
   message: this.generateAlertMessage(user, consolidatedAlertObject, workflowContext)
   ```

2. **Find all other call sites**:
   ```bash
   grep -r "generateAlertMessage" pages/ lib/ --include="*.js"
   ```

### Phase 3: Update Data Flow

**Current path**:
```
RSS feed → crisisCalculator → generateAlertMessage (loses consolidation)
```

**New path**:
```
RSS feed → consolidate-alerts.js (OpenRouter AI) → generateAlertMessage (uses full content)
```

### Phase 4: Test with Real Data

1. Create test alert with actual workflow:
   - Component: Mexican rubber (50%), Chinese electronics (20%), US steel (30%)
   - Tariff: Section 301 on China (25%)
   - USMCA: Qualified at 102.5%
   - Volume: $500K/year

2. Verify message includes:
   - ✅ Component percentages (50%, 20%, 30%)
   - ✅ Specific tariff rates (0% MFN + 25% Section 301 = 27.5%)
   - ✅ Personalized calculations ($27,500 exposure)
   - ✅ Non-obvious insights (tariff stacking, exemption deadlines)
   - ✅ Specific actions (contact suppliers, set calendar reminders)

---

## Code References

### Files to Modify
- `lib/services/crisis-alert-service.js` - Main change (generateAlertMessage function)
- `lib/services/crisis-alert-service.js` - Method signature updates
- Any files calling `generateAlertMessage` - Update parameters

### Files Already Correct
- ✅ `pages/api/consolidate-alerts.js` - Already generates rich content
- ✅ Database schemas - Already store rich data
- ✅ Workflow sessions - Already have component data

### Files to Create (Optional)
- Email template to render markdown alerts with CSS styling
- Dashboard alert component to display rich markdown

---

## Benefits Verification Checklist

After implementation, verify:

- [ ] Alert contains 600-1200 words (vs current 300)
- [ ] All numbers come from user's actual workflow data
- [ ] Zero hardcoded percentages, costs, or recommendations
- [ ] Component percentages match user's actual BOM
- [ ] Tariff rates match cached enrichment data
- [ ] Action items are specific (company names, deadlines)
- [ ] Cost calculations shown with math (Volume × % × Rate)
- [ ] Scenarios include recommended option with reasoning
- [ ] Markdown renders properly in email client
- [ ] No generic phrases like "find suppliers" or "negotiate"

---

## Why This Works Without Hardcoding

```
User Input:
- Components: Rubber (50% from Mexico), Electronics (20% from China), Steel (30% from USA)
- HS codes: 4016.99, 8542.31, 7318.15
- Annual volume: $500,000

consolidate-alerts.js takes this and asks AI:
"Here's actual component data with real tariff rates. Generate rich analysis."

AI generates (not hardcoded):
- Calculations using ACTUAL numbers: $500K × 20% × 27.5% = $27,500 exposure
- Scenarios using ACTUAL rates: USMCA option costs $2K/year but saves $11K/year in tariffs
- Actions using ACTUAL company data: "Contact your Chinese electronics supplier"
- Insights using ACTUAL analysis: "Your Mexican rubber is safe, but electronics are vulnerable"

Result: Every number, scenario, and action is personalized to THIS company's workflow.
Zero hardcoding.
```

---

## Quick Testing

### Test Email Alert
```
To: test@example.com
Alert Subject: Mexico Rubber Capacity Expansion

[Rich formatted message with sections]

Expected:
- 800+ words ✅
- Real component percentages ✅
- Calculated impact numbers ✅
- Specific action items ✅
```

### Test Dashboard Display
```
Alert Card:
[Title]
[broker_summary preview]
[Components list with %]
[Action items]
[Read more → expands to full message]
```

---

## Effort Estimate

| Task | Hours | Notes |
|------|-------|-------|
| Refactor generateAlertMessage | 1.0 | Straightforward function rewrite |
| Update call sites | 0.5 | Find and update parameter passing |
| Test with real workflows | 1.0 | Verify numbers match user data |
| Email/Dashboard formatting | 0.5 | Markdown to HTML rendering |
| Documentation updates | 0.5 | Comment existing alerts pattern |
| **Total** | **3.5 hours** | Low complexity, high impact |

---

## Success Criteria

After implementation, alerts should:

1. **Use 100% AI-generated content** (no hardcoded templates)
2. **Personalize using actual workflow data** (component %, volumes, HS codes, tariff rates)
3. **Show calculations transparently** (Volume × % × Rate = Impact)
4. **Provide specific action items** (not generic advice)
5. **Include non-obvious insights** (tariff stacking, exemption deadlines, supply chain opportunities)
6. **Include cost/benefit analysis** (scenarios with recommended option)
7. **Transform alerts from spam to intelligence** (subscribers actually read and act on them)

---

## Next Steps

1. Review `ALERT_CONTENT_RICHNESS_ANALYSIS.md` for full context
2. Schedule refactoring work (3.5 hour session)
3. Create test case with multi-component product
4. Implement new generateAlertMessage
5. Test end-to-end with real workflow
6. Deploy and monitor engagement metrics
7. Iterate based on subscriber feedback

This is subscriber retention gold. Rich, valuable alerts = lower churn.
