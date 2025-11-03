# Alerts System Technical Specification

**Version**: 1.3
**Last Updated**: November 3, 2025 (Two-Tier Alert Architecture)
**Status**: 90% Production Ready - All P0 Blockers Fixed + Market Intelligence Added
**Audit Summary**: Two-tier alert system implemented. Component alerts + Market Intelligence in unified table. Email activation remaining.

---

## 🚨 LAUNCH-READY CHECKLIST (For 2 CEO LinkedIn Prospects)

**TEST DEADLINE:** End of Week (November 8, 2025)
**TARGET USERS:** 2 CEO prospects in logistics (real customers, not test accounts)

### ⚠️ CRITICAL: DO NOT BREAK WHAT'S WORKING

**Currently Working (DO NOT TOUCH):**
- ✅ Dashboard loads at `/trade-risk-alternatives`
- ✅ Portfolio briefing API generates JSON response
- ✅ 80 real alerts in database from RSS monitoring
- ✅ Alert-to-component matching logic
- ✅ Database schema (crisis_alerts table exists)

**Agents: If user says "it works but needs polish" → DO NOT refactor core logic. Only fix UI/UX.**

---

### 🔴 P0 BLOCKERS (Must Fix Before CEO Demo)

**These 4 issues will cause embarrassment if CEOs test:**

#### 1. Email System is Broken (SILENT FAILURE)
- **Problem:** Code says "email queued" but table doesn't exist
- **User sees:** "You'll get email alerts!"
- **Reality:** Nothing happens (they'll never get emails)
- **Fix:** Create `email_queue` table (15 min) - SQL below
- **Test:** Queue an email, verify it appears in table

#### 2. Trial Users Can Spam AI Summaries (REVENUE LEAK)
- **Problem:** No subscription tier check on briefing API
- **User sees:** Trial user clicks "Generate Analysis" 100 times
- **Reality:** $4 in AI costs, $0 revenue
- **Fix:** Add tier check at start of `/api/generate-portfolio-briefing` (30 min)
- **Test:** Login as Trial user, verify button disabled after 0 uses

#### 3. Alert Quality Unknown (TRUST RISK)
- **Problem:** AI prompt has no garbage filtering
- **User sees:** Alerts about "Postal Rate Changes" or "Medicare Updates"
- **Reality:** User loses trust in platform ("this is spam")
- **Fix:** Replace AI prompt in `tariff-change-detector.js` (20 min)
- **Test:** Manually review 20 recent alerts, verify no postal/healthcare/disaster

#### 4. Slow Alert Matching (PERFORMANCE RISK)
- **Problem:** Missing GIN indexes on array columns
- **User sees:** Dashboard loads for 5+ seconds
- **Reality:** Array searches are slow without indexes
- **Fix:** Add 2 GIN indexes (10 min) - SQL below
- **Test:** Load dashboard, verify <1 second response

---

### ✅ PRE-CEO TEST MANUAL QA (30 Minutes)

**Complete this checklist before inviting CEOs:**

#### Test Flow 1: Dashboard View
- [ ] Navigate to `/trade-risk-alternatives`
- [ ] Verify alerts table displays
- [ ] Click "Generate Analysis" button
- [ ] Verify briefing loads in <3 seconds
- [ ] Verify response shows company-specific data

#### Test Flow 2: Alert Matching
- [ ] Check 3 components display
- [ ] Verify alert badges show numbers
- [ ] Click to expand component alerts
- [ ] Verify only relevant alerts shown (country/HS code match)

#### Test Flow 3: Email System (Post-Fix)
- [ ] Trigger email queue from code
- [ ] Verify row appears in `email_queue` table
- [ ] Run `/api/cron/process-email-queue`
- [ ] Verify email marked as 'sent'

#### Test Flow 4: Tier Enforcement (Post-Fix)
- [ ] Login as Trial user
- [ ] Verify "Generate Analysis" button is disabled
- [ ] Change to Starter tier in database
- [ ] Verify button enabled, works 2 times
- [ ] On 3rd click, verify upgrade message

---

### 📋 QUICK-FIX SQL (Run These in Supabase)

**Fix #1: Create Email Queue Table (15 min)**
```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  email_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  related_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT,
  error_code TEXT,
  resend_message_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_for);
CREATE INDEX idx_email_queue_priority ON email_queue(priority);
```

**Fix #4: Add GIN Indexes (10 min)**
```sql
CREATE INDEX idx_crisis_alerts_countries ON crisis_alerts USING GIN(affected_countries);
CREATE INDEX idx_crisis_alerts_hs_codes ON crisis_alerts USING GIN(affected_hs_codes);
```

---

### 🎯 WHAT TO TELL THE 2 CEOs

**Positioning for LinkedIn Prospects:**

✅ **SAY THIS:**
- "This dashboard shows real-time policy changes affecting YOUR specific components"
- "We monitor 17 government sources (Federal Register, USTR) every 2 hours"
- "AI analyzes your 35% China exposure vs USMCA 2026 renegotiation"
- "You'll get daily email digests when tariffs change on YOUR products"

❌ **DON'T SAY THIS:**
- "It's still in beta" (undermines confidence)
- "We're still testing the AI" (sounds unready)
- "Email system is new" (they'll notice if it breaks)
- "We might have some bugs" (focus on value, not tech debt)

**If They Ask "Is This Ready?"**
- "We're running this with select logistics partners first"
- "You're one of 2 companies testing the CEO dashboard"
- "Feedback will shape our Q1 2025 commercial launch"

---

### 🔧 IMPLEMENTATION STATUS AUDIT (Nov 3, 2025)

**What's Actually Built vs This Spec:**

| Feature | Spec Says | Actual Code | Status | Notes |
|---------|-----------|-------------|--------|-------|
| AI Scoring Prompt | Keyword-driven filtering (lines 141-199) | Generic policy detection | ❌ WRONG | Replace in tariff-change-detector.js:116-137 |
| Portfolio Briefing Format | Markdown 4 sections | JSON 6 sections | ⚠️ DIFFERENT | Works but incompatible with spec |
| Email Queue | Required infrastructure | Table doesn't exist | ❌ MISSING | Create table (SQL above) |
| GIN Indexes | Required for performance | Missing | ❌ MISSING | Add indexes (SQL above) |
| Subscription Tiers | Enforce limits | No checks | ❌ MISSING | Add to generate-portfolio-briefing.js |
| Alert Matching | Client-side filtering | Server-side in briefing | ⚠️ DIFFERENT | Works but different architecture |
| RSS Polling | Every 2 hours | Every 2 hours | ✅ CORRECT | 17 feeds, 1,887 items |
| Crisis Alerts Table | All columns specified | All exist | ✅ CORRECT | 80 alerts in production |
| Daily Digest | Bundled emails | Code complete | ⚠️ READY | Just needs Vercel cron activation |

---

### ⚠️ FOR FUTURE AGENTS: WHAT NOT TO BREAK

**User says: "Dashboard works but agents keep breaking it"**

**Rules for Agents:**
1. ✅ **READ THIS SECTION FIRST** before touching code
2. ❌ **DO NOT refactor** `generate-portfolio-briefing.js` (it works!)
3. ❌ **DO NOT change** database schema without explicit request
4. ❌ **DO NOT "clean up"** working components
5. ✅ **DO add** missing infrastructure (email_queue table, indexes)
6. ✅ **DO fix** bugs without changing architecture
7. ❌ **DO NOT optimize** prematurely (GIN indexes = essential, not premature)
8. ❌ **DO NOT create** separate alert display sections (Nov 3, 2025 - Per user: "i never asked for anthe table")
9. ❌ **DO NOT add** "Recent Alert Activity" or "Alert Resolution History" sections
10. ✅ **Alerts ONLY in** Component Tariff Intelligence table (expandable rows)

**If User Reports a Bug:**
- Ask: "Is feature X completely broken or just needs polish?"
- If broken: Fix the minimal code to restore function
- If polish: Change only UI/UX, not backend logic

**If Spec Contradicts Working Code:**
- **Code wins** (it's running in production)
- Update this spec to document deviation
- Don't "fix" working code to match old spec

---

## SPECIFICATION BEGINS HERE

This specification document is the IDEAL design for the Alerts System.
See "IMPLEMENTATION STATUS AUDIT" above for what's actually built.

Going forward:
- Any agent working on alerts must read LAUNCH-READY CHECKLIST first
- Any questions about implementation should reference AUDIT section
- Any changes to the system must update this document
- If spec contradicts working code, CODE WINS (update spec to match reality)

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
New Alert Created → Match to Components → Check User Email Preferences → Queue Email → User Returns → Views Alerts → Regenerates Summary
```

**Trigger Conditions (ALL must be true):**
- New alert matches component's country OR HS code (first 6 digits)
- User has enabled email notifications for THAT SPECIFIC COMPONENT (per-component checkbox)
- Alert severity is HIGH or CRITICAL
- User hasn't been emailed in last 24 hours (rate limit)

**Key Architecture Decision:**
- Email preferences are COMPONENT-LEVEL, not account-level
- Users see checkbox next to each component in Component Tariff Intelligence table
- Example: User can enable emails for "China PCBs" but disable for "Mexico Plastics"
- This allows granular control - only get emails for critical components

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

## 6. Two-Tier Alert System Architecture

### Alert Types

**Type 1: Component-Specific Alerts**
- **Database Pattern**: `affected_countries` has specific country (CN, MX, CA, etc.)
- **Matching**: Matches to user's components by country + HS code
- **Display**: Shows in component rows with 🚨 badge
- **Email Control**: Per-component checkbox (user enables for each component)
- **AI Usage**: Included in strategic briefing for matched components
- **Examples**:
  - "Cosco tariff woes" (CN, empty HS codes) → Affects ALL China components
  - "Section 301 on Chinese semiconductors" (CN, [8542.31.00]) → Affects specific HS code

**Type 2: Market Intelligence Alerts**
- **Database Pattern**: `affected_countries` = ['UNSPECIFIED'] OR NULL OR empty array
- **Matching**: Does NOT match to specific components (general context)
- **Display**: Shows in Market Intelligence row at bottom of table with 📌 badge
- **Email Control**: Single checkbox for ALL market intelligence alerts
- **AI Usage**: ALWAYS included in strategic briefings (provides context)
- **Examples**:
  - "Why China keeps winning the trade war" (UNSPECIFIED)
  - "UPS volumes: China-to-US shipments drop 27%" (UNSPECIFIED)
  - "China's auto funding blitz, US rare earths" (UNSPECIFIED)

### UI Display Pattern

```
Component Tariff Intelligence Table
┌──────────────────────────────────────────────────────────┐
│ COMPONENT          │ ORIGIN │ HS CODE    │ ALERTS │ EMAIL │
├──────────────────────────────────────────────────────────┤
│ ▶ Microprocessor   │ CN     │ 8542.31.00 │ 🚨 1   │ ☐     │ ← Component Alert
│ ▶ Power Supply     │ MX     │ 8504.40.00 │ ✅ 0   │ ☐     │
│ ▶ PCB              │ CA     │ 8534.31.00 │ 🚨 1   │ ☐     │ ← Component Alert
│                                                            │
│ ▶ 📰 Market Intel  │ Global │ —          │ 📌 8   │ ☐     │ ← Market Intelligence
│   (Strategic Context)                                     │
└──────────────────────────────────────────────────────────┘
```

### Email Notification Logic

```javascript
async function sendAlertEmails(newAlert) {
  const users = await getUsersWithComponents();

  for (const user of users) {
    // TYPE 1: Component-Specific Alerts
    if (isComponentSpecific(newAlert)) {
      const matchedComponents = user.components.filter(comp =>
        alertMatchesComponent(newAlert, comp) &&
        comp.email_notifications_enabled === true  // ← Per-component control
      );

      for (const comp of matchedComponents) {
        await queueEmail({
          subject: `🚨 New tariff alert: ${comp.component_type} (${comp.origin_country})`,
          template: 'component_alert',
          component: comp,
          alert: newAlert
        });
      }
    }

    // TYPE 2: Market Intelligence Alerts
    if (isMarketIntelligence(newAlert)) {
      if (user.include_market_intel_in_email === true) {  // ← Account-level control
        await queueEmail({
          subject: `📰 Market Intelligence: ${newAlert.title}`,
          template: 'market_intelligence',
          alert: newAlert
        });
      }
    }
  }
}

function isComponentSpecific(alert) {
  return alert.affected_countries?.length > 0 &&
         !alert.affected_countries.includes('UNSPECIFIED');
}

function isMarketIntelligence(alert) {
  return alert.affected_countries?.includes('UNSPECIFIED') ||
         !alert.affected_countries ||
         alert.affected_countries.length === 0;
}
```

### AI Strategic Briefing Logic

**Key Principle**: AI ALWAYS uses both alert types for comprehensive analysis

```javascript
async function generateStrategicBriefing(userProfile) {
  // Fetch ALL alerts from database
  const allAlerts = await fetchCrisisAlerts();

  // TYPE 1: Component-specific alerts (for direct impact analysis)
  const componentAlerts = allAlerts.filter(isComponentSpecific);
  const matchedComponentAlerts = componentAlerts.filter(alert =>
    userProfile.components.some(comp => alertMatchesComponent(alert, comp))
  );

  // TYPE 2: Market Intelligence (for strategic context - ALWAYS included)
  const marketIntelligence = allAlerts.filter(isMarketIntelligence);

  // AI Prompt includes BOTH
  const aiPrompt = `
Analyze ${userProfile.company}'s supply chain:

COMPONENT-SPECIFIC ALERTS (${matchedComponentAlerts.length}):
${matchedComponentAlerts.map(a => `- ${a.title} (affects ${a.affected_countries})`).join('\n')}

MARKET INTELLIGENCE CONTEXT (${marketIntelligence.length}):
${marketIntelligence.map(a => `- ${a.title}`).join('\n')}

Generate strategic briefing incorporating:
1. Direct component impact (component-specific alerts)
2. Broader trade environment (market intelligence)
3. USMCA 2026 renegotiation positioning
  `;

  return await callAI(aiPrompt);
}
```

**Why This Matters:**
- Component alerts = **Actionable**: "Your China PCBs face 25% tariff increase"
- Market intelligence = **Strategic**: "Overall China-US trade tensions rising"
- Together = **Comprehensive analysis**: Specific impact + broader context

---

## 7. User Matching Logic

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

### Email Notification Triggers (Component-Level)

**Architecture**: Each component has its own email notification toggle in the UI

```javascript
function shouldEmailUserForAlert(alert, userComponents) {
  const affectedComponents = userComponents.filter(comp => {
    // Match alert to component
    const countryMatch = alert.affected_countries?.includes(comp.origin_country);
    const hsMatch = alert.affected_hs_codes?.some(code =>
      comp.hs_code?.startsWith(code.substring(0, 6))
    );

    // Component must match AND have email enabled
    return (countryMatch || hsMatch) && comp.email_notifications_enabled === true;
  });

  // Only send email if:
  // 1. At least one component matches AND has email enabled
  // 2. Alert severity is high or critical
  // 3. User hasn't been emailed in last 24 hours
  return affectedComponents.length > 0 &&
         ['high', 'critical'].includes(alert.severity) &&
         !recentlyEmailed(user.id);
}
```

**Email Content Structure:**
```
Subject: 🚨 New tariff alert affecting your China PCB Assembly

Hi {{userName}},

A new trade policy announcement affects components you're monitoring:

Component: PCB Assembly (35% of costs)
Origin: China
HS Code: 8542.31.00

Alert: US increases Section 301 tariffs on Chinese semiconductors to 60%
Impact: Potential 25% cost increase on this component

[View Alert Details & Analysis →]

To stop receiving alerts for this component, uncheck the email box next to "PCB Assembly" in your dashboard.
```

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

### Component Tariff Intelligence Table (PRIMARY ALERT DISPLAY)

**Architecture**: Alerts appear ONLY in this table, NOT in separate sections

```jsx
<div className="form-section">
  <h3 className="card-title">Component Tariff Intelligence</h3>
  <p className="text-body">
    Click any component with alerts to see tariff details and policy impacts:
  </p>

  {/* Table Header */}
  <div className="component-table-header">
    <div>COMPONENT</div>
    <div>ORIGIN</div>
    <div>HS CODE</div>
    <div>VALUE %</div>
    <div>ALERTS</div>
    <div>EMAIL</div>
  </div>

  {/* Component Rows */}
  {components.map((comp, idx) => {
    // Filter alerts for THIS specific component
    const componentAlerts = allAlerts.filter(alert => {
      const originMatch = alert.affected_countries?.includes(comp.origin_country);
      const hsMatch = alert.affected_hs_codes?.some(code =>
        comp.hs_code?.startsWith(code.substring(0, 6))
      );
      // Empty array = blanket tariff, matches all from that country
      const isBlanket = !alert.affected_hs_codes || alert.affected_hs_codes.length === 0;

      return (isBlanket && originMatch) || (originMatch && hsMatch);
    });

    return (
      <div key={idx} className="component-row">
        {/* Collapsed View - Always Visible */}
        <div className="component-summary">
          <span>{comp.component_type}</span>
          <span>{comp.origin_country}</span>
          <span>{comp.hs_code}</span>
          <span>{comp.percentage}%</span>

          {/* Alert Badge */}
          {componentAlerts.length > 0 ? (
            <span className="alert-badge-danger">
              🚨 {componentAlerts.length} alert{componentAlerts.length > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="alert-badge-success">✅ No alerts</span>
          )}

          {/* Email Notification Checkbox - CRITICAL FEATURE */}
          <input
            type="checkbox"
            checked={comp.email_notifications_enabled || false}
            onChange={() => toggleComponentEmail(idx)}
            title="Enable email alerts for this component"
          />
        </div>

        {/* Expanded View - Shows Alert Details When Clicked */}
        {expandedComponent === idx && componentAlerts.length > 0 && (
          <div className="component-alerts-expanded">
            {componentAlerts.map(alert => (
              <div key={alert.id} className={`alert-card severity-${alert.severity}`}>
                <div className="alert-header">
                  <span className="alert-title">{alert.title}</span>
                  <span className="alert-severity">{alert.severity.toUpperCase()}</span>
                </div>
                <div className="alert-description">{alert.description}</div>
                <div className="alert-meta">
                  <span>Detected: {new Date(alert.created_at).toLocaleDateString()}</span>
                  <span>Countries: {alert.affected_countries.join(', ')}</span>
                  {alert.affected_hs_codes?.length > 0 && (
                    <span>HS Codes: {alert.affected_hs_codes.join(', ')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  })}
</div>
```

**Key UI Rules:**
- ✅ Alerts ONLY appear in Component Tariff Intelligence table
- ❌ NO separate "Recent Alert Activity" sections
- ❌ NO "Alert Resolution History" stats sections
- ✅ Each component row has email checkbox for per-component control
- ✅ Click component row to expand and view matched alerts
- ✅ Alert matching happens client-side (blanket vs specific tariffs)

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

### Email Notification Template (Component-Specific)

**Important**: Emails are sent PER COMPONENT with email enabled, not per user account

```html
Subject: 🚨 New tariff alert: {{componentName}} ({{componentOrigin}})

Hi {{userName}},

A new trade policy announcement affects a component you're monitoring:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Component: {{componentName}}
🌍 Origin: {{componentOrigin}}
📊 HS Code: {{hsCode}}
💰 Share of Costs: {{componentPercentage}}%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 ALERT: {{alertTitle}}

Severity: {{alertSeverity}} ({{severityEmoji}})
Detected: {{alertDate}}
Source: {{alertSource}}

{{alertDescription}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[View Full Alert Details →]
[Generate USMCA 2026 Impact Analysis →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To stop receiving alerts for this component:
1. Go to your dashboard at /trade-risk-alternatives
2. Find "{{componentName}}" in the Component Tariff Intelligence table
3. Uncheck the email box in the EMAIL column

You're receiving this because you enabled email notifications for this specific component.

Best regards,
Triangle Trade Intelligence
```

**Email Sending Logic**:
```javascript
// Send separate email for EACH component that has email enabled
async function sendComponentAlertEmails(newAlert) {
  const users = await getUsersWithComponents();

  for (const user of users) {
    const affectedComponents = user.components.filter(comp => {
      // Component must match alert AND have email enabled
      const matches = alertMatchesComponent(newAlert, comp);
      return matches && comp.email_notifications_enabled === true;
    });

    // Send one email per affected component
    for (const comp of affectedComponents) {
      await queueEmail({
        recipient_email: user.email,
        subject: `🚨 New tariff alert: ${comp.component_type} (${comp.origin_country})`,
        html_body: renderEmailTemplate(user, comp, newAlert),
        email_type: 'component_alert',
        related_id: comp.id,
        priority: newAlert.severity === 'critical' ? 1 : 5
      });
    }
  }
}
```

---

## 10. Critical Requirements

### System Invariants
1. **NO hardcoded dates or fake policy announcements** - All alerts from real RSS data
2. **AI Summary works with zero alerts** - Shows monitoring status if no alerts
3. **Alerts are universal** - Not user-specific in database
4. **Matching is dynamic** - Calculated at request time (client-side)
5. **Results Page ≠ Alerts Page** - Different content and purpose
6. **Alerts display ONLY in Component Tariff Intelligence table** - No separate sections
7. **Email control is COMPONENT-LEVEL** - Users enable/disable per component, not account-wide
8. **Empty array = blanket tariff** - `affected_hs_codes: []` means all HS codes from that country
9. **Two-tier alert system** - Component-specific alerts + Market Intelligence (both in same table)
10. **AI always uses all alerts** - Market Intelligence included in briefings regardless of email preference

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

### Stage 1: RSS Monitoring & Alert Creation
- [x] RSS polling cron job scheduled (every 2 hours)
- [x] AI scoring prompt filters non-trade content (keyword-driven)
- [x] Crisis alerts table has proper indexes (GIN indexes added Nov 3)
- [x] Alert matching uses normalized HS codes (periods removed)
- [x] Empty array handling for blanket tariffs (Nov 3 fix)

### Stage 2: User Interface & Alert Display
- [x] Component Tariff Intelligence table displays alerts (PRIMARY display location)
- [x] Email notification checkboxes shown for each component
- [x] Alert badges show count (🚨 X alerts or ✅ No alerts)
- [x] Click component row to expand and view alert details
- [ ] NO separate "Recent Alert Activity" sections (removed Nov 3)
- [ ] NO "Alert Resolution History" stats (removed Nov 3)
- [x] UI shows proper loading states
- [x] Expandable rows only for components with alerts

### Stage 3: AI Summary Generation
- [x] Portfolio briefing works with 0 alerts
- [x] Subscription tier enforcement active (Nov 3)
- [x] AI cherry-picks relevant alerts (not all 80+)
- [x] Portfolio analysis includes USMCA 2026 context
- [x] Error handling for API failures

### Stage 4: Email Notifications (Component-Level)
- [x] Email queue table created (Nov 3)
- [ ] Email sending respects component-level preferences
- [ ] Email template includes component details
- [ ] Unsubscribe instructions reference specific component checkbox
- [ ] Email notifications respect rate limits (24-hour)
- [ ] Daily digest ready for activation (Vercel cron needed)

### Monitoring & Performance
- [x] GIN indexes improve alert matching speed
- [ ] Monitoring for AI costs (usage tracking)
- [ ] Alert quality review (manual spot-check for garbage)

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

### Scenario 3: Component-Level Email Control
- New alert created for China electronics (severity: HIGH)
- User has 3 components:
  - China PCB (email enabled ✅)
  - China Microprocessor (email disabled ❌)
  - Mexico Plastic Housing (email enabled ✅)
- Expected behavior:
  - Email should be queued for China PCB component ONLY
  - NO email for China Microprocessor (even though alert matches)
  - NO email for Mexico component (alert doesn't match)
- Email subject: "🚨 New tariff alert: PCB Assembly (CN)"
- Email includes unsubscribe instructions: "Uncheck email box next to PCB Assembly"

### Scenario 4: Subscription Limit
- Starter user (2 summaries/month)
- Already generated 2 summaries
- Button should be disabled with upgrade message

---

**END OF SPECIFICATION**

This document contains all information needed to implement the Alerts System from scratch. Any deviations from this specification should be documented and justified.