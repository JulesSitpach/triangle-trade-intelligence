# Alerts System Technical Specification

**Version**: 1.0
**Last Updated**: November 3, 2025
**Status**: Production Ready

---

## 1. System Overview

### Purpose
Provide users with personalized trade intelligence through a two-tier alert system that monitors global trade policy changes and delivers relevant insights based on each user's specific supply chain portfolio.

### Core Components
1. **Individual Alerts** - Browsable table of trade policy changes affecting user's components
2. **AI Strategic Summary** - Personalized briefing analyzing impact on user's USMCA strategy

### Retention Model
Email notifications alert users to new policy changes → Users return to platform → Regenerate analysis with latest intelligence → Stay engaged with evolving trade landscape

---

## 2. Architecture - Data Flow

### Stage 1: RSS Monitoring → Universal Alerts Database

**Process Flow:**
```
RSS Feeds (every 2 hours) → Content Extraction → AI Scoring (1-10) → Score 5+? → crisis_alerts table
```

**Details:**
- **Frequency**: Every 2 hours via Vercel Cron
- **RSS Sources**: 13 active feeds (Federal Register, USTR, Financial Times, etc.)
- **AI Model**: Claude Haiku via OpenRouter ($0.0001/call)
- **Storage**: Items scoring 5+ stored in `crisis_alerts` table
- **Nature**: Alerts are UNIVERSAL (not user-specific)
- **Tagging**: Countries, HS codes, industries, policy categories

### Stage 2: User Views Alerts Page

**Process Flow:**
```
User Loads Page → Fetch ALL crisis_alerts → Match to User Portfolio → Display Matched Alerts
```

**Details:**
- Query `crisis_alerts WHERE is_active = true`
- Filter alerts by user's component origins and HS codes
- Display in expandable table format
- Show "Generate AI Summary" button (always visible)

### Stage 3: AI Summary Generation

**Process Flow:**
```
User Clicks Button → Fetch Portfolio + Alerts → AI Analysis → Strategic Briefing Display
```

**Modes:**
- **Without Alerts**: Portfolio analysis + USMCA 2026 renegotiation context
- **With Alerts**: Above + cherry-picked relevant alerts with impact analysis

**Details:**
- Works with 0 to 100+ alerts
- AI cherry-picks only relevant alerts
- Ranks by portfolio impact percentage
- Generates 4-section strategic briefing

### Stage 4: Email Notifications & User Return

**Process Flow:**
```
New Alert Created → Match to Users → Send Email → User Returns → Views Alerts → Regenerates Summary
```

**Trigger Conditions:**
- New alert matches user's component countries
- New alert matches user's HS codes (first 6 digits)
- Alert severity is HIGH or CRITICAL

---

## 3. Database Schema

### crisis_alerts table

```sql
CREATE TABLE crisis_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    alert_type TEXT CHECK (alert_type IN (
        'tariff_announcement',
        'emergency_tariff',
        'trade_disruption',
        'policy_update',
        'crisis_escalation'
    )),
    severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    affected_hs_codes TEXT[],  -- Array of HS codes like ['8542.31.00', '8504.40.00']
    affected_countries TEXT[],  -- ISO codes like ['CN', 'MX', 'CA', 'US']
    relevant_industries TEXT[], -- ['electronics', 'automotive', 'textiles']
    agreement_type TEXT,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    detection_source TEXT DEFAULT 'rss_polling',
    source_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_crisis_alerts_active ON crisis_alerts(is_active);
CREATE INDEX idx_crisis_alerts_countries ON crisis_alerts USING GIN(affected_countries);
CREATE INDEX idx_crisis_alerts_hs_codes ON crisis_alerts USING GIN(affected_hs_codes);
```

---

## 4. AI Scoring Prompt (Stage 1)

### Complete Prompt Structure

```javascript
const prompt = `You are a STRICT trade policy analyst for Triangle Trade Intelligence. ONLY create alerts for articles with explicit trade/tariff keywords.

OUR VALUE PROPOSITION:
- Mexico triangle routing (Canada→Mexico→US) as USMCA advantage
- AI-powered USMCA certificate generation and compliance
- Target users: North American SMB manufacturers/importers doing cross-border trade

RSS ITEM TO ANALYZE:
Title: ${title}
Description: ${description}

KEYWORD-DRIVEN SCORING (STRICT):
✅ Score 5+ ONLY if article explicitly contains ONE OR MORE of these keywords:
- "tariff" OR "duty" OR "customs" (specific rate changes)
- "trade" (in context of international commerce, not "trade show")
- "import" OR "export" (cross-border movement)
- "USMCA" OR "CUSMA" OR "T-MEC" OR "NAFTA" (agreements)
- "Section 301" OR "Section 232" OR "anti-dumping" OR "countervailing" (trade remedies)
- "rules of origin" OR "regional value content" OR "RVC" (USMCA compliance)
- "Mexico" + ("manufacturing" OR "labor" OR "nearshoring" OR "supply chain")
- "Canada" + ("trade" OR "supply chain" OR "critical minerals")
- "China" + ("tariff" OR "trade" OR "import") (US trade actions)
- "port fees" OR "border delay" OR "customs procedure" (logistics costs)

❌ If NONE of these keywords present → AUTOMATIC Score 1 (SKIP - don't create alert)

CRITICAL AUTOMATIC REJECTIONS (Score 0):
If title/description contains: postal, disaster, healthcare, TRICARE, Medicare, patent, housing, committee, advisory, tip wage → Score 0 immediately

ALERT SEVERITY MAPPING:
- Score 9-10: CRITICAL (China Section 301 escalation, immediate USMCA threat, port crisis)
- Score 7-8: HIGH (Tariff changes affecting SMB sourcing, Mexico/Canada policy shifts)
- Score 5-6: MEDIUM (Monitoring interest, potential impact on supply chain)
- Score 1-4: SKIP (No alert created)

EXAMPLES OF CORRECT SCORING:
✅ "US increases Section 301 tariffs on Chinese semiconductors to 60%" → Score 9
   (Keywords: "Section 301", "tariff", "Chinese", "semiconductors")
✅ "USMCA regional content threshold for automotive increased to 75%" → Score 8
   (Keywords: "USMCA", "regional content", "automotive")
✅ "Mexico increases labor standards for manufacturing exports" → Score 7
   (Keywords: "Mexico", "manufacturing", "labor")
✅ "Port of Long Beach increases container handling fees 25%" → Score 6
   (Keywords: "port fees", "import cost impact")

❌ "New Postal Products" → Score 1 (keyword: "postal" = automatic reject)
❌ "TRICARE health plan changes" → Score 0 (keyword: "TRICARE" = automatic reject)
❌ "Presidential disaster declaration" → Score 1 (keyword: "disaster" = automatic reject)
❌ "China GDP growth slows to 4%" → Score 1 (no trade keywords)

Return ONLY valid JSON:
{
  "score": 8,
  "keywords": ["tariff", "china", "semiconductors"],
  "affected_countries": ["CN", "US"],
  "affected_industries": ["electronics"],
  "reasoning": "Explicit 60% Section 301 tariff increase on semiconductors directly impacts sourcing decisions for SMBs"
}`;
```

---

## 5. AI Summary Prompt (Stage 3)

### Portfolio Briefing Generation Prompt

```javascript
const aiPrompt = `You are a Trade Compliance Director at a global supply chain consultancy.

You are analyzing ${companyName}'s supply chain positioning ahead of the USMCA 2026 renegotiation review.

COMPANY PROFILE:
- Annual Import Volume: $${totalVolume.toLocaleString()}
- Current USMCA RVC: ${rvc.toFixed(1)}%
- USMCA Status: ${qualificationStatus}
- Component Count: ${components.length}
- Origin Countries: ${uniqueCountries.join(', ')}

COMPONENT PORTFOLIO:
${components.map(c => `- ${c.component_type} (${c.origin_country}, HS ${c.hs_code}, $${c.annual_volume.toLocaleString()}, ${c.percentage}% of costs)`).join('\n')}

USMCA 2026 RENEGOTIATION CONTEXT:
The USMCA trade agreement enters formal review in 2026. Key uncertainty areas:
- Rules of Origin requirements could increase (RVC thresholds may go up)
- Labor provisions could expand (all three countries pressuring)
- China cumulation proposals being discussed (could disqualify Chinese components)
- Energy sector rules under review (especially Mexican energy policies)

${alertContext} // Either real alerts or monitoring status

YOUR ANALYSIS TASK:
Create a strategic briefing with exactly 4 sections:

1. BOTTOM LINE (1-2 sentences)
What is the single most important thing ${companyName} needs to know about their USMCA position?

2. COMPONENT RISK ASSESSMENT (3-4 bullets)
For each major component origin:
- Current exposure level
- 2026 renegotiation vulnerability
- Specific concern if applicable

3. STRATEGIC CONSIDERATIONS (2-3 bullets)
- Primary strategic option
- Alternative approach
- Timeline consideration

4. WHAT WE'RE MONITORING (2-3 bullets)
- Most critical policy to track
- Key date or milestone
- Industry-specific concern

Keep analysis focused on actionable intelligence. No generic advice.
Use actual component data and real percentages.
Reference specific USMCA articles (Annex 4-B, Chapter 4, etc.) when relevant.
Avoid speculation - use "could", "may", "monitoring" language.
${matchedAlerts.length > 0 ? 'Incorporate the real policy alerts into your assessment.' : 'Note that no specific policy changes have been announced yet.'}

Format response in clean markdown with clear section headers.`;
```

### Output Requirements
- **Length**: 800-1200 characters total
- **Tone**: Professional Trade Compliance Director
- **Focus**: Actionable intelligence, not education
- **Structure**: Exactly 4 sections as specified
- **Data Usage**: Must reference actual portfolio percentages

### What NOT to Include
- ❌ Broker contact information
- ❌ Tariff calculations (handled elsewhere)
- ❌ Generic USMCA education
- ❌ Hypothetical scenarios without basis
- ❌ Recommendations to "consult an expert"

---

## 6. User Matching Logic

### Alert-to-User Matching Algorithm

```javascript
function matchAlertsToUser(allAlerts, userProfile) {
  const userComponentOrigins = userProfile.components.map(c =>
    (c.origin_country || c.country || '').toUpperCase()
  );

  const userComponentHS = userProfile.components.map(c =>
    (c.hs_code || '').replace(/\./g, '') // Remove periods for comparison
  );

  return allAlerts.filter(alert => {
    // Match by country
    const countryMatch = alert.affected_countries?.some(country =>
      userComponentOrigins.includes(country.toUpperCase())
    );

    // Match by HS code (first 6 digits)
    const hsMatch = alert.affected_hs_codes?.some(alertCode => {
      const normalizedAlertCode = alertCode.replace(/\./g, '').substring(0, 6);
      return userComponentHS.some(userCode =>
        userCode.startsWith(normalizedAlertCode)
      );
    });

    // Match by industry
    const industryMatch = alert.relevant_industries?.some(industry =>
      userProfile.industries?.includes(industry)
    );

    return countryMatch || hsMatch || industryMatch;
  });
}
```

### Email Notification Triggers
- New alert created with severity >= 'high'
- Alert matches user's portfolio (country OR HS code)
- User has email notifications enabled
- User hasn't been emailed in last 24 hours (rate limit)

---

## 7. Subscription Tiers & Limits

### Tier Structure

| Tier | Price | AI Summaries/Month | Alert Access | Email Notifications |
|------|-------|-------------------|--------------|-------------------|
| Trial | Free | 0 | View only | No |
| Starter | $99/mo | 2 | Full access | Weekly digest |
| Professional | $299/mo | 5 | Full access | Daily digest |
| Premium | $599/mo | Unlimited | Full access | Real-time |

### Enforcement Logic

```javascript
function canGenerateSummary(userTier, summariesThisMonth) {
  const limits = {
    'Trial': 0,
    'Starter': 2,
    'Professional': 5,
    'Premium': Infinity
  };

  return summariesThisMonth < limits[userTier];
}
```

---

## 8. API Endpoints

### `/api/cron/rss-polling`
**Method**: GET
**Schedule**: Every 2 hours
**Authentication**: Vercel Cron secret
**Process**:
1. Fetch RSS feeds from all sources
2. Extract content from items
3. Score each item with AI (1-10)
4. Store score 5+ items in crisis_alerts
5. Trigger email notifications if matches

**Response**:
```json
{
  "success": true,
  "feeds_processed": 13,
  "items_analyzed": 245,
  "alerts_created": 3,
  "emails_queued": 12
}
```

### `/api/get-crisis-alerts`
**Method**: GET
**Authentication**: Session cookie
**Parameters**: None (uses session user_id)
**Process**:
1. Get all active alerts from crisis_alerts table
2. No filtering (UI handles matching)

**Response**:
```json
{
  "success": true,
  "alerts": [
    {
      "id": "uuid",
      "title": "US increases Section 301 tariffs",
      "description": "Tariffs on Chinese semiconductors...",
      "severity": "high",
      "affected_countries": ["CN", "US"],
      "affected_hs_codes": ["8542.31.00"],
      "created_at": "2025-11-03T00:00:00Z"
    }
  ]
}
```

### `/api/generate-portfolio-briefing`
**Method**: POST
**Authentication**: Session cookie
**Request Body**:
```json
{
  "workflow_data": {
    "company": { "name": "Acme Corp", "country": "US" },
    "components": [
      {
        "component_type": "PCB Assembly",
        "hs_code": "8542.31.00",
        "origin_country": "CN",
        "annual_volume": 250000
      }
    ],
    "usmca": {
      "regional_content_percentage": 65.5,
      "qualification_status": "QUALIFIED"
    }
  },
  "user_id": "user_uuid"
}
```

**Response**:
```json
{
  "success": true,
  "briefing": "## Bottom Line\n\nYour 35% China exposure...",
  "real_alerts_matched": 3,
  "alerts_analyzed": 80
}
```

---

## 9. UI Components

### Alerts Table Display

```jsx
<div className="component-table">
  {components.map(component => (
    <ComponentRow key={component.id}>
      <ComponentDetails>{component.name}</ComponentDetails>
      <AlertBadge count={component.matchedAlerts.length} />
      {expandedComponent === component.id && (
        <AlertsList>
          {component.matchedAlerts.map(alert => (
            <AlertCard
              severity={alert.severity}
              title={alert.title}
              impact={alert.impactScore}
            />
          ))}
        </AlertsList>
      )}
    </ComponentRow>
  ))}
</div>
```

### Generate AI Summary Button

```jsx
<button
  onClick={() => loadPortfolioBriefing(userProfile)}
  className="btn-primary"
  disabled={isLoading || userTier === 'Trial'}
>
  {isLoading ? '⏳ Analyzing...' : '📊 USMCA 2026 Impact Analysis'}
</button>
```

### AI Summary Display Format

```markdown
## Bottom Line
Your 35% China sourcing creates critical USMCA vulnerability if cumulation rules change.

## Component Risk Assessment
- **China PCBs (35%)**: HIGH RISK - Proposed cumulation would disqualify
- **Mexico Plastics (55%)**: SAFE - Benefits from any USMCA strengthening
- **Canada Screws (10%)**: SAFE - Fully compliant, no concerns

## Strategic Considerations
- Primary: Begin Mexico PCB supplier qualification (6-month timeline)
- Alternative: Explore Vietnam as non-USMCA hedge
- Timeline: Decision needed by Q2 2026 before rules finalize

## What We're Monitoring
- China cumulation proposal vote (expected March 2026)
- Labor value content calculation changes
- Electronics sector RVC threshold discussions
```

### Email Notification Template

```html
Subject: 🚨 3 New Trade Alerts for Your Components

Hi {{userName}},

We've detected 3 new trade policy announcements affecting your supply chain:

1. 🔴 HIGH: Section 301 tariffs on Chinese semiconductors increased to 60%
   → Affects your PCB Assembly component (35% of costs)

2. 🟡 MEDIUM: Mexico announces new labor certification requirements
   → Affects your Plastic Housing component (55% of costs)

3. 🟢 LOW: Canada-US critical minerals agreement expanded
   → May benefit your Metal Screws component (10% of costs)

[View Alerts & Generate Analysis →]

These changes could impact your USMCA qualification status.
Log in to see your updated strategic position.

Best regards,
Triangle Trade Intelligence
```

---

## 10. Critical Requirements

### System Invariants
1. **NO hardcoded dates or fake policy announcements** - All alerts from real RSS data
2. **AI Summary works with zero alerts** - Shows monitoring status if no alerts
3. **Alerts are universal** - Not user-specific in database
4. **Matching is dynamic** - Calculated at request time
5. **Results Page ≠ Alerts Page** - Different content and purpose

### Data Quality Rules
1. **Stage 1 scoring must filter garbage**:
   - Postal products → Score 0
   - Disaster declarations → Score 0
   - Healthcare programs → Score 0
   - Patent procedures → Score 0
   - Committee meetings → Score 0

2. **Keywords are mandatory**:
   - No trade keywords → No alert
   - Must contain: tariff, trade, USMCA, import, export, etc.

3. **HS Code normalization**:
   - Remove periods before matching
   - Match on first 6 digits only
   - Handle both formats: "8542.31.00" and "854231"

### Performance Requirements
- RSS polling: < 60 seconds for all feeds
- AI scoring: < 500ms per item
- Alert matching: < 100ms for 100 alerts
- Portfolio briefing: < 3 seconds total

### Security Requirements
- Validate all user input
- Sanitize HTML in alert descriptions
- Rate limit API calls (100/minute)
- Require authentication for briefing generation
- Log all AI usage for cost tracking

---

## Implementation Checklist

- [ ] RSS polling cron job scheduled (every 2 hours)
- [ ] AI scoring prompt filters non-trade content
- [ ] Crisis alerts table has proper indexes
- [ ] Alert matching uses normalized HS codes
- [ ] Email notifications respect rate limits
- [ ] Portfolio briefing works with 0 alerts
- [ ] Subscription tier enforcement active
- [ ] UI shows proper loading states
- [ ] Error handling for API failures
- [ ] Monitoring for AI costs

---

## Testing Scenarios

### Scenario 1: Zero Alerts
- Database has no crisis_alerts
- User clicks "Generate AI Summary"
- Should show monitoring status, no errors

### Scenario 2: 100+ Alerts
- Database has 100+ alerts
- User has 5 components
- Only 3 alerts match user's portfolio
- Summary should mention only those 3

### Scenario 3: Email Trigger
- New alert created for China electronics
- User has China PCB component
- Email should be queued within 5 minutes

### Scenario 4: Subscription Limit
- Starter user (2 summaries/month)
- Already generated 2 summaries
- Button should be disabled with upgrade message

---

**END OF SPECIFICATION**

This document contains all information needed to implement the Alerts System from scratch. Any deviations from this specification should be documented and justified.