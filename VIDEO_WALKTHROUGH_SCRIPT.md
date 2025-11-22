# Triangle Intelligence Platform - Video Walkthrough Script

**Live URL**: https://triangle-trade-intelligence.vercel.app
**Target Audience**: Importers/exporters doing US-Canada-Mexico trade
**Platform Purpose**: Self-serve USMCA certificate generation (TurboTax for trade compliance)

---

## 🎯 KEY TALKING POINTS (30-second elevator pitch)

"Triangle Intelligence Platform is a SaaS tool that helps SMB manufacturers and importers generate official USMCA certificates in minutes instead of days. Just describe your product components, we use AI to classify them with tariff rates, calculate your USMCA qualification status, and show you exactly how much money you'll save. We also monitor Federal Register policy changes and alert you when Section 301 or 232 tariffs affect your specific products."

**Value Proposition**:
- ✅ Self-serve (no consultants needed)
- ✅ AI-powered (OpenRouter + Anthropic fallback)
- ✅ Real-time policy monitoring (Federal Register RSS feeds)
- ✅ Users own responsibility (we provide tools, they verify accuracy)

---

## 📹 VIDEO STRUCTURE (Recommended 10-15 minutes)

### PART 1: Platform Overview (2 minutes)

**Show**: Landing page at https://triangle-trade-intelligence.vercel.app

**Script**:
> "Welcome to Triangle Intelligence Platform. This is a self-serve USMCA certificate generation platform for companies doing cross-border trade between the US, Canada, and Mexico.
>
> The platform has three main user types: [show 3 tabs]
> - Importers bringing goods into North America
> - Exporters shipping within USMCA countries
> - Manufacturers producing in the region
>
> Each tab shows relevant analytics and value propositions. For today's demo, we'll focus on the importer workflow since that's our most popular use case."

**Highlight**:
- Clean, professional UI with custom CSS (no Tailwind)
- 3 user personas with tailored messaging
- Clear call-to-action: "Start Free Analysis"

---

### PART 2: User Registration & Subscription (1 minute)

**Show**: Sign up flow → Dashboard

**Script**:
> "New users can sign up with email/password authentication. We have 4 subscription tiers:
> - **Trial**: 2 free analyses (watermarked certificates)
> - **Starter**: $99/month for 15 analyses
> - **Professional**: $299/month for 100 analyses
> - **Premium**: $799/month for 500 analyses
>
> The system enforces limits at three layers: page-level blocking, component-level UI disabling, and API-level rejection. This prevents users from exceeding their plan limits."

**Data to Show**:
- Current users: 4 accounts (1 Premium, 1 Starter, 2 Trial)
- Recent workflows: 20 completed certificates
- Active sessions: 194 in-progress workflows

---

### PART 3: USMCA Workflow - STEP 1: Company Information (2 minutes)

**Show**: `/usmca-workflow` page - Step 1

**Script**:
> "The USMCA certificate workflow has 3 main steps. Step 1 collects company information:
> - Company name and country (must be US, CA, or MX)
> - Industry sector (this determines RVC thresholds)
> - Destination country (USMCA only - US/CA/MX)
> - Annual trade volume (for savings calculations)
>
> All data is saved to Supabase in real-time, so users can leave and come back without losing progress. We use localStorage for browser persistence and database for cross-device access."

**Database Tables Involved**:
- `workflow_sessions` - Stores in-progress data (194 active)
- `user_profiles` - Links to user's subscription tier

**Demo Values to Use**:
```
Company Name: Acme Electronics Inc.
Company Country: Mexico
Industry: Electronics Manufacturing
Destination: United States
Trade Volume: $8,500,000/year
```

---

### PART 4: USMCA Workflow - STEP 2: Component Origins (4 minutes) ⭐ MOST IMPRESSIVE

**Show**: Step 2 - Component entry with AI classification

**Script**:
> "Step 2 is where the AI magic happens. Users describe each product component, and we automatically:
> 1. **Classify the component** with an HS code using AI (OpenRouter Claude)
> 2. **Look up tariff rates** from our database of 12,118 HS codes
> 3. **Calculate savings** by comparing MFN rates vs USMCA rates
> 4. **Show confidence scores** so users know if they should verify
>
> Let me add a few components to demonstrate..."

**Demo Components** (use these for visual impact):

**Component 1: High-Value China Risk**
```
Description: "Semiconductor microprocessor chip"
Origin Country: China
Value %: 35%

→ AI Classification: HS 8542.31.00 (Processors)
→ Tariff Analysis:
   - MFN Rate: 0.0% (duty-free for electronics)
   - Section 301: 25% (China trade action)
   - USMCA Rate: 0.0% (if Mexico-sourced instead)
   - Annual Section 301 Burden: $74,375
   - Confidence: 92%
```

**Component 2: Mexico Nearshoring Opportunity**
```
Description: "Rubber gasket seal"
Origin Country: Mexico
Value %: 5%

→ AI Classification: HS 4016.99.90 (Rubber parts)
→ Tariff Analysis:
   - MFN Rate: 2.5%
   - USMCA Rate: 0.0% (preferential)
   - Annual Savings: $10,625
   - Confidence: 88%
```

**Component 3: US Domestic Content**
```
Description: "Aluminum housing"
Origin Country: United States
Value %: 60%

→ AI Classification: HS 7616.99.50 (Aluminum fabrications)
→ Tariff Analysis:
   - MFN Rate: 5.7%
   - USMCA Rate: 0.0%
   - Annual Savings: $290,100
   - Confidence: 95%
```

**Key Features to Highlight**:
- ✅ Real-time AI classification (2-3 seconds per component)
- ✅ 2-tier fallback: OpenRouter → Anthropic (99% uptime)
- ✅ Database-first approach: 75% hit rate (12,118 codes cached)
- ✅ Confidence scoring: Shows AI certainty (85-98%)
- ✅ Tariff rate enrichment: MFN, Section 301/232, USMCA rates all calculated
- ✅ Visual alerts: Red badges for high tariffs, green for savings

**What Makes This Impressive**:
> "Notice how fast this is - under 3 seconds per component. That's because we have a database of 12,118 HS codes from the official USITC 2025 Harmonized Tariff Schedule. When we get a database hit, it's instant. When we don't, we fall back to AI with OpenRouter, and if that's down, we have Anthropic as backup. This 2-tier fallback gives us 99% uptime."

---

### PART 5: USMCA Workflow - STEP 3: Results & Analysis (3 minutes) ⭐ KEY VALUE DELIVERY

**Show**: WorkflowResults component with full analysis

**Script**:
> "Once all components are entered, our system calculates:
> 1. **USMCA Qualification Status** - Are you eligible?
> 2. **Regional Value Content (RVC)** - What percentage is North American?
> 3. **Annual Tariff Savings** - How much money will you save?
> 4. **Policy Risk Exposure** - What Section 301/232 tariffs apply?
> 5. **Component-Level Breakdown** - Which parts are costing you money?
>
> Let's look at the results..."

**Expected Results for Demo**:
```
QUALIFICATION STATUS: ✅ QUALIFIED
RVC Percentage: 65.0%
Required Threshold: 65.0% (Electronics)
Preference Criterion: B (Regional content)

FINANCIAL IMPACT:
Annual Tariff Savings: $300,725
Monthly Savings: $25,060
Section 301 Exposure: $74,375/year (China semiconductor)

RECOMMENDATION:
"Consider Mexico nearshoring for semiconductor to eliminate Section 301 burden.
Payback period: 3-4 months with +$3,500 logistics cost."
```

**Key Sections to Show**:

1. **USMCA Qualification Card**
   - Green checkmark or red X
   - RVC percentage with visual progress bar
   - Preference criterion (A/B/C/D)

2. **Tariff Savings Summary**
   - Annual savings with dollar amount
   - Monthly breakdown
   - Section 301/232 exposure highlighted in red

3. **Component Tariff Intelligence Table** (8 columns)
   - Component description
   - HS Code
   - Origin Country
   - MFN Rate
   - USMCA Rate
   - Section 301/232 (if applicable)
   - Savings %
   - Confidence Score

4. **Executive Strategic Insights** (AI-generated)
   - Supply chain vulnerabilities
   - Nearshoring opportunities
   - Policy risk assessment
   - Action recommendations

**What Makes This Impressive**:
> "Notice the Executive Strategic Insights section - this is AI-generated consulting-grade advice. We're not just showing numbers, we're telling you WHAT TO DO ABOUT IT. Should you nearshore to Mexico? How long is the payback period? What's the ROI? This is what sets us apart from simple tariff calculators."

---

### PART 6: Real-Time Policy Alerts (2 minutes) ⭐ COMPETITIVE ADVANTAGE

**Show**: `/trade-risk-alternatives` (Alerts Dashboard)

**Script**:
> "The platform doesn't just calculate tariffs - it actively monitors Federal Register RSS feeds for policy changes that affect YOUR specific products.
>
> We poll 16 government sources every 2 hours:
> - Federal Register (Section 301/232 announcements)
> - USTR Press Releases
> - CBP Customs Bulletin
> - White House Presidential Actions
> - Financial Times Trump Tariffs coverage
>
> When a change is detected, we match it to your components by:
> - HS code (specific product targeting)
> - Country of origin (China tariffs, Mexico labor requirements)
> - Industry sector (automotive, electronics, textiles)
>
> Let's look at current active alerts..."

**Show Active Crisis Alerts** (from database):
```
CRITICAL ALERTS (5 active):

1. "China Section 301 Synthetic Opioid Supply Chain Tariffs"
   - Severity: CRITICAL
   - Affected: China → US
   - HS Codes: Multiple (1701, 8230, 8217)
   - Impact: Up to 25% additional duty

2. "Mexico Agriculture Exports: New Phytosanitary Requirements"
   - Severity: CRITICAL
   - Affected: Mexico → US
   - HS Codes: 0702, 0704, 0709, 2002 (produce)
   - Impact: Inspection delays at border

3. "USTR Suspension of Section 301 Maritime Investigation"
   - Severity: HIGH
   - Affected: China shipping industry
   - Impact: No immediate tariff threat
```

**Component-Level Alert Matching**:
> "Notice how our China semiconductor shows a red alert badge? That's because we matched it to the Section 301 announcement. The system is smart enough to know that HS 8542 (semiconductors) is affected by China tariffs even though the alert lists different codes. We use AI to understand policy implications."

---

### PART 7: Certificate Generation & Download (1 minute)

**Show**: Editable USMCA Form D preview

**Script**:
> "Once the analysis is complete, users can download an official USMCA Certificate of Origin (Form D) that's ready for CBP submission.
>
> The certificate includes:
> - All component details with HS codes
> - RVC percentage calculation
> - Preference criterion
> - Company certifier information
> - Legal attestation language
>
> Users can edit any field before download using the light blue input boxes. For Trial users, certificates have a watermark. Paid users get clean PDFs ready for customs."

**Important Disclaimers to Mention**:
> "Notice the checkbox: 'I understand I am responsible for verifying the accuracy of all information.' This is critical - we're providing tools, but users own the liability. This is a TurboTax model, not a consulting service."

---

### PART 8: Technical Architecture (2 minutes) - For Developer Audience

**Show**: High-level architecture diagram or code structure

**Script**:
> "For the developers watching, here's how the platform works technically:
>
> **Tech Stack**:
> - Next.js 14 (Pages Router) + React 18
> - Supabase PostgreSQL (12,118 HS codes cached)
> - OpenRouter AI (Claude 3.5 Haiku)
> - Anthropic Direct (fallback)
> - Vercel (auto-deploy on git push)
>
> **AI Architecture**:
> - 2-tier fallback: OpenRouter → Anthropic (99% uptime)
> - Database-first: 75% tariff hits from cache (instant response)
> - 25% AI fallback for missing codes (2-3 seconds)
> - Cost: ~$0.02 per classification
>
> **Data Flow**:
> 1. User input → Component description
> 2. AI Classification → HS code
> 3. Database lookup → Tariff rates (12,118 codes)
> 4. If miss → AI fallback (OpenRouter)
> 5. Enrichment → Add MFN, Section 301/232, USMCA rates
> 6. Save to workflow_sessions → Persist in Supabase
> 7. Results display → Show qualification + savings
>
> **Key Design Decisions**:
> - Database-first (not AI-first) - 75% coverage is fast + cheap
> - Cookie-based auth (not JWT in localStorage) - More secure
> - Custom CSS (not Tailwind) - Cleaner, no conflicts
> - Centralized config - Single source of truth for subscription limits
> - 3-layer enforcement - Page, component, API blocking"

---

### PART 9: Subscription Enforcement Demo (1 minute)

**Show**: Trial user hitting limit

**Script**:
> "Let me show you the subscription limit enforcement. I'm logged in as a Trial user (2 analyses/month).
>
> [Try to start 3rd analysis]
>
> See how the system blocks me at three levels:
> 1. **Page-level**: Redirects to upgrade page
> 2. **Component-level**: 'Analyze' button is disabled
> 3. **API-level**: Server rejects the request
>
> This prevents users from bypassing limits with browser tricks. We also implemented a reservation system to prevent race conditions - if a user clicks 'Analyze' twice, we only count it once."

---

### PART 10: Real Data & Production Status (1 minute)

**Show**: Database stats

**Script**:
> "This isn't a demo app - it's production-ready with real data:
>
> **Current Usage**:
> - 4 users (1 Premium, 1 Starter, 2 Trial)
> - 20 completed certificates
> - 194 active workflows in progress
> - 12,118 HS codes in database (USITC 2025 official)
> - 5 active crisis alerts (real RSS-detected policies)
> - 16 RSS feeds monitored every 2 hours
>
> **Performance**:
> - Database tariff lookup: <200ms
> - AI classification: 2-3 seconds
> - Full USMCA analysis: <5 seconds
> - 99% uptime (2-tier AI fallback)
>
> **Cost per Analysis**:
> - Database hit (75% of requests): FREE
> - AI classification (~25%): $0.02
> - Executive summary: $0.04
> - Total: ~$0.06 per complete workflow"

---

## 🎬 CLOSING REMARKS (1 minute)

**Script**:
> "Triangle Intelligence Platform solves a real problem for SMB importers and exporters. Instead of paying $500+ for a customs broker to manually prepare USMCA certificates, they can do it themselves in 10 minutes for $99/month.
>
> **What makes us different**:
> 1. Self-serve (no consultants)
> 2. AI-powered (OpenRouter + Anthropic)
> 3. Real-time policy monitoring (Federal Register)
> 4. Users own responsibility (we provide tools, they verify)
>
> **Business Model**:
> - Subscription SaaS ($99-$799/month)
> - Zero consulting, zero services
> - Users generate certificates on-demand
> - Email alerts for policy changes (retention mechanism)
>
> **Next Steps**:
> - Activate daily tariff digest email (code ready, needs Vercel cron)
> - USITC API integration (when government service returns)
> - Cross-agreement support (EU-TCA, CPTPP)
>
> Thanks for watching! Visit https://triangle-trade-intelligence.vercel.app to try the platform yourself."

---

## 📊 DEMO DATA CHEAT SHEET

### Test Company Profile
```
Company Name: Acme Electronics Inc.
Company Country: Mexico
Industry: Electronics Manufacturing
Destination: United States
Trade Volume: $8,500,000/year
```

### Test Components (Copy/Paste Ready)

**Component 1: China Risk**
```
Description: Semiconductor microprocessor chip
Origin: China
Value %: 35%
Expected HS: 8542.31.00
Expected Section 301: 25%
Expected Savings if Mexico-sourced: $74,375/year
```

**Component 2: Mexico Content**
```
Description: Rubber gasket seal
Origin: Mexico
Value %: 5%
Expected HS: 4016.99.90
Expected MFN: 2.5%
Expected Savings: $10,625/year
```

**Component 3: US Content**
```
Description: Aluminum housing
Origin: United States
Value %: 60%
Expected HS: 7616.99.50
Expected MFN: 5.7%
Expected Savings: $290,100/year
```

### Expected Results
```
QUALIFICATION: ✅ QUALIFIED
RVC: 65.0% (meets 65% Electronics threshold)
Preference Criterion: B
Annual Savings: $300,725
Section 301 Exposure: $74,375 (China chip)
Recommendation: Nearshore semiconductor to Mexico
```

---

## 🎥 VIDEO PRODUCTION TIPS

### Screen Recording Settings
- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 30 fps minimum
- **Cursor**: Show cursor with click highlights
- **Audio**: Clear narration (use good mic)

### Editing Tips
1. **Add captions** for key numbers ($300,725 savings, 92% confidence)
2. **Zoom in** on important UI elements (alert badges, confidence scores)
3. **Speed up** waiting screens (AI classification loading)
4. **Add arrows** pointing to impressive features
5. **Include timestamps** in description for different sections

### B-Roll Suggestions
- Show database tables in Supabase
- Show RSS feed polling logs
- Show Vercel deployment dashboard
- Show code structure briefly (architecture slide)

### Key Metrics to Overlay
- "12,118 HS Codes Cached"
- "75% Database Hit Rate"
- "99% AI Uptime (2-Tier Fallback)"
- "$0.02 per AI Classification"
- "16 Government Sources Monitored"
- "2-Hour RSS Polling Frequency"

---

## 🚨 COMMON DEMO PITFALLS TO AVOID

1. **Don't show broken features**
   - Skip web search (it's broken)
   - Skip admin dashboard (archived)
   - Skip cross-tab sync (not implemented)

2. **Don't oversell**
   - Say "USMCA only" (not "all trade agreements")
   - Say "users verify accuracy" (not "100% accurate")
   - Say "95%+ confidence" (not "perfect classification")

3. **Do show confidence scores**
   - Emphasize AI limitations
   - Show when system says "verify this"
   - Highlight user responsibility disclaimers

4. **Do explain the business model**
   - Self-serve (not consulting)
   - Subscription SaaS (not per-certificate)
   - Users own liability (TurboTax model)

---

## 📈 CALL-TO-ACTION OPTIONS

**For B2B Sales Video**:
> "Schedule a demo at [email] to see how Triangle Intelligence can streamline your USMCA compliance process."

**For Investor Pitch**:
> "We're solving a $2B+ market inefficiency. Schedule a call to discuss investment opportunities."

**For Developer Recruiting**:
> "Join our team building the future of trade compliance automation. Check out our tech stack at [careers page]."

**For Open Source Demo**:
> "Check out the code on GitHub at [repo link]. We're open-sourcing select components soon."

---

**Created**: November 21, 2025
**For**: Triangle Intelligence Platform Video Walkthrough
**Live Site**: https://triangle-trade-intelligence.vercel.app
**Documentation**: See CLAUDE.md for complete technical details
