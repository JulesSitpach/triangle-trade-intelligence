# Testing Broker Summary Feature

## Overview
Test the new conversational broker summary feature added to consolidated policy alerts.

## Test Data Setup

### 1. Create Test User Profile
```javascript
const testUserProfile = {
  companyName: "Sample Electronics Inc",
  businessType: "Manufacturer",
  productDescription: "Industrial machinery with steel components",
  tradeVolume: "4800000",
  componentOrigins: [
    {
      component_type: "Steel Housing",
      percentage: 40,
      origin_country: "CN",
      hs_code: "7326.90.85"
    },
    {
      component_type: "Microcontroller",
      percentage: 25,
      origin_country: "CN",
      hs_code: "8542.31.00"
    }
  ]
};
```

### 2. Create Test Alerts
```javascript
const testAlerts = [
  {
    title: "Section 301 Tariffs on Chinese Steel Products",
    tariff_adjustment: "+100% tariff",
    category: "Trade Policy",
    affected_countries: ["CN"],
    affected_hs_codes: ["7326.90.85", "7326.90"]
  },
  {
    title: "China Port Fee Increases",
    tariff_adjustment: "+3% port fees",
    category: "Logistics",
    affected_countries: ["CN"],
    affected_hs_codes: ["7326"]
  }
];
```

## Testing Steps

### Test 1: API Response Structure
```bash
# Call consolidate-alerts API
curl -X POST http://localhost:3001/api/consolidate-alerts \
  -H "Content-Type: application/json" \
  -d '{
    "alerts": [testAlerts],
    "user_profile": testUserProfile
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "consolidated_alerts": [
    {
      "id": "consolidated-...",
      "title": "China Steel Component Risk (Consolidated)",
      "broker_summary": "Here's the situation: Section 301 tariffs...",
      "urgency": "HIGH",
      "timeline": "2-3 months",
      "effective_date": "January 1, 2025",
      "urgency_reasoning": "Requires strategic supplier changes...",
      "consolidated_impact": {
        "total_annual_cost": "$1.98M",
        "confidence": "high",
        "confidence_explanation": "High confidence because...",
        "breakdown": "100% Section 301 tariff...",
        "stack_explanation": "Section 301 (100%) applies..."
      },
      "mitigation_scenarios": [
        {
          "title": "Status Quo (Do Nothing)",
          "cost_impact": "+$1.98M annually",
          "timeline": "Immediate",
          "benefit": "No transition effort required",
          "tradeoffs": ["Double your component cost"],
          "recommended": false
        },
        {
          "title": "Switch to USMCA Suppliers",
          "cost_impact": "-$1.6M net savings",
          "timeline": "3-4 months transition",
          "benefit": "Eliminate $2M tariff",
          "tradeoffs": ["Material costs 15-20% more"],
          "recommended": true
        }
      ],
      "what_you_might_not_know": [...],
      "specific_action_items": [...]
    }
  ]
}
```

### Test 2: Visual Display
1. Navigate to user dashboard: `/dashboard`
2. Trigger consolidated alert display
3. Verify:
   - ✅ **Broker Summary** appears at top (blue card, collapsible)
   - ✅ **Urgency card** shows: Urgency, Timeline, Effective Date
   - ✅ **Financial Impact** shows confidence explanation (green card)
   - ✅ **Mitigation Scenarios** display side-by-side (recommended option has ⭐)

### Test 3: Broker Summary Content Quality
Check that AI-generated broker summary:
- ✅ Starts with plain bad news (no sugarcoating)
- ✅ Explains timeline realistically (not "urgent" if it's 3 months away)
- ✅ Gives clear recommendation
- ✅ Ends with specific action this week
- ✅ Tone is conversational (not corporate speak)
- ✅ Length is 4-6 sentences (~150 words)

### Test 4: Urgency/Timeline Alignment
Verify urgency matches timeline:
- ✅ URGENT → "Days to weeks" → Effective <30 days
- ✅ HIGH → "2-3 months" → Effective 30-90 days
- ✅ MEDIUM → "6-12 months" → Effective 3-12 months
- ✅ LOW → "Monitor ongoing" → No specific date

### Test 5: Confidence Explanation
Check confidence explanation:
- ✅ Explains WHY confidence is high/medium/low
- ✅ References specific data points (HS codes, trade volume, rates)
- ✅ Shows calculation logic if confidence is high
- ✅ Notes missing data if confidence is low

### Test 6: Mitigation Scenarios Comparison
Verify scenarios display:
- ✅ 2-4 options shown side-by-side
- ✅ Each shows: Cost Impact, Timeline, Benefit, Tradeoffs
- ✅ Recommended option has green background + ⭐ icon
- ✅ Cost impacts use consistent format (+$X or -$X)
- ✅ Timelines are realistic (not "immediate" for complex changes)

## Expected AI Quality Checks

### Broker Summary Example (Good)
```
"Here's the situation: Section 301 tariffs just doubled the cost of your Chinese
steel components. This adds roughly $2M to your annual costs - about 40% of your
total product value. The timeline here is important. This takes effect January 1st,
which gives you 8-10 weeks to plan your response. Not a fire drill, but you need
to move. I'd recommend getting quotes from USMCA suppliers immediately. Yes, the
material will cost 15-20% more, but you'll eliminate the $2M tariff hit AND
qualify for duty-free USMCA treatment. Net result: you're still significantly
ahead. Time to make some calls."
```

### Broker Summary Example (Bad - Too Corporate)
```
"The company is experiencing a significant tariff adjustment event affecting Chinese
steel components. It is recommended that stakeholders evaluate alternative sourcing
strategies in alignment with USMCA qualification requirements. Please contact your
account manager to discuss next steps."
```

## Success Criteria

✅ **All fields present**: broker_summary, effective_date, timeline, confidence_explanation, mitigation_scenarios
✅ **Urgency aligned**: Urgency level matches timeline and effective date
✅ **Conversational tone**: Broker summary sounds like a real person, not corporate AI
✅ **Actionable**: User knows exactly what to do this week
✅ **Visual clarity**: Side-by-side scenarios make comparison easy
✅ **Confidence transparency**: User understands why the numbers are reliable (or not)

## Troubleshooting

### Issue: Broker Summary Missing
- Check OpenRouter API key is configured
- Verify AI prompt includes broker_summary in example JSON
- Check response parsing includes broker_summary field

### Issue: Urgency/Timeline Mismatch
- AI may need refinement - check prompt emphasizes alignment
- Verify effective_date is being calculated correctly
- Timeline should match urgency level

### Issue: Generic Recommendations
- AI may be falling back to obvious advice
- Check that prompt includes "What You Probably Already Know" section
- Ensure "What You Might NOT Know" has specific, non-obvious insights

### Issue: Confidence Explanation Too Vague
- Prompt should request specific data points in explanation
- Example: "High confidence because we have exact HS code (7326.90.85), known Section 301 rate (100%)"
- Not: "High confidence because the data looks reliable"

## Files Modified
- `pages/api/consolidate-alerts.js` - AI prompt and response parsing
- `components/alerts/ConsolidatedPolicyAlert.js` - Visual display component
