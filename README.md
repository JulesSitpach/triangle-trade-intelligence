# Triangle Intelligence Platform

Global SaaS for international trade compliance automation. Supporting USMCA, EU-UK TCA, CPTPP, and bilateral trade agreements.

**Live**: https://triangle-trade-intelligence.vercel.app

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
# Fill in: OPENROUTER_API_KEY, ANTHROPIC_API_KEY, Supabase keys, Stripe key

# 3. Run development server
npm run dev:3001          # Port 3001 for Claude Code agents

# 4. Open browser
open http://localhost:3001
```

## 📋 What This Platform Does

**Input**: Company info + Product components (descriptions, origins, percentages)
**Processing**: AI-powered HS code classification + tariff rate lookup + USMCA qualification analysis
**Output**: USMCA eligibility assessment + tariff savings calculation + official certificate

### Four-Step Workflow
1. **Company Information** - Business profile and destination market
2. **Component Details** - Product components with AI classification
3. **Results & Alerts** - USMCA qualification status, tariff analysis, policy alerts
4. **Certificate Preview & Download** - Official USMCA form with editable fields + responsibility confirmation

### Key Features
- 🤖 AI-powered HS code classification (OpenRouter + Anthropic 2-tier fallback)
- 📊 Real-time tariff rate lookup with Section 301/232 policy adjustments
- 💰 Automatic savings calculation (MFN vs USMCA rates with financial impact analysis)
- 📝 Editable official USMCA certificate preview (light blue input boxes)
- ⚠️ Clear user responsibility messaging with confirmation checkboxes
- 🔐 Secure authentication with JWT cookies
- 📱 Responsive design (mobile, tablet, desktop)
- 🎯 **NEW (Nov 4-5):** 3-layer subscription limit enforcement (page/component/API blocking)
- 🚨 **NEW (Nov 2):** Real-time policy alert system using crisis_alerts database

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (Pages Router), React 18
- **Database**: Supabase PostgreSQL
- **AI**: OpenRouter API (Claude models)
- **Hosting**: Vercel (auto-deploy on git push)
- **Auth**: Cookie-based sessions (httpOnly)

### Core Workflow
```
User Form Input
    ↓
AI Classification (OpenRouter)
    ↓
Cache Check (Database)
    ↓
Tariff Lookup (4-tier fallback)
    ↓
Enrichment Data Saved to DB
    ↓
Results Displayed
```

### Database Schema (Key Tables)
- `auth.users` - Supabase authentication
- `user_profiles` - Subscription tier (Trial/Starter/Professional/Premium), analysis counts
- `workflow_sessions` - In-progress USMCA workflows (194 active as of Nov 2025)
- `workflow_completions` - Completed certificates (20 as of Nov 2025)
- `tariff_intelligence_master` - 12,118 HS codes with tariff rates (database-first approach)
- `crisis_alerts` - Real-time policy alerts (RSS-detected Section 301/232 changes)
- `tariff_changes_log` - Daily digest change tracking (Nov 1, ready to activate)

## 📁 Project Structure

```
pages/
  ├── index.js                    # Homepage
  ├── usmca-workflow.js           # Main 4-step workflow
  ├── usmca-certificate-completion.js  # Authorization + editable preview
  ├── pricing.js                  # Subscription plans
  ├── dashboard.js                # User dashboard
  └── api/
      ├── auth/                   # Login/register/logout
      ├── agents/classification   # HS code classification
      ├── ai-usmca-complete-analysis.js  # Main tariff endpoint
      └── generate-certificate.js # Certificate generation

components/workflow/
  ├── CompanyInformationStep.js
  ├── ComponentOriginsStepEnhanced.js
  ├── WorkflowResults.js
  └── EditableCertificatePreview.js  # Official USMCA form preview

lib/
  ├── agents/
  │   ├── base-agent.js              # 2-tier AI fallback (OpenRouter → Anthropic)
  │   └── classification-agent.js     # HS code classification
  ├── hooks/
  │   └── useSubscriptionLimit.js     # NEW Nov 4: React hook for limit checks
  ├── middleware/
  │   └── subscription-guard.js       # NEW Nov 4: API endpoint limit enforcement
  ├── ai-helpers.js
  └── tariff/enrichment-router.js

config/
  ├── usmca-thresholds.js         # Eligibility rules
  └── system-config.js             # Global constants

styles/
  ├── globals.css                 # Main styles
  └── admin-workflows.css         # Admin-specific styles
```

## 🔌 API Endpoints (90 Total, 76 Active)

### Core Production Endpoints

**✅ PRIMARY**: `/api/ai-usmca-complete-analysis` - **FULLY IMPLEMENTED**
- Tariff enrichment, component analysis, financial impact, RVC qualification
- **Enforces subscription limits** (Nov 4-5)
- Request: Company info + components with origins
- Response: USMCA qualification + component tariff breakdown + certificate data

**✅ CLASSIFICATION**: `/api/agents/classification` - **FULLY IMPLEMENTED**
- AI-powered HS code classification using OpenRouter/Anthropic
- **Enforces subscription limits** (Nov 4-5)
- Returns: HS code + confidence score + tariff rates

**✅ USAGE CHECK**: `/api/check-usage-limit` - **NEW Nov 4, 2025**
- Check user subscription tier and analysis count
- Returns: current usage, tier limit, limit reached status

**✅ SECONDARY**: `/api/executive-trade-alert` - **FULLY IMPLEMENTED** (Oct 25, 2025)
- Financial scenarios (Section 301 escalation, nearshoring ROI)
- CBP compliance strategy (Form 29 binding ruling, audit prevention)
- 3-phase strategic roadmap
- Regulatory calendar and contacts

**✅ TERTIARY**: `/api/generate-personalized-alerts` - **FULLY IMPLEMENTED**
- Filters alerts by relevance to user's products
- Relevance scoring: Industry (+40), Geography (+30), Product (+30), Destination (+20)

**✅ PORTFOLIO BRIEFING**: `/api/generate-portfolio-briefing` - **NEW Nov 2, 2025**
- Real-time policy monitoring using crisis_alerts table
- Component-to-policy matching by country/HS code/industry
- Strategic briefing with financial impact analysis

### Comprehensive Testing Guide

**See**: [`TEST_CHEAT_SHEET.md`](./TEST_CHEAT_SHEET.md) for complete API specifications:
- **Complete Request/Response Formats** - Actual API specifications with examples
- **4 Business Value Test Scenarios** - Real-world use cases with expected outputs
- **Component Specifications** - Real HS codes, tariff rates, financial impacts
- **Validation Checklist** - All 7 sections of AI response that must be present
- **Certificate Generation Requirements** - Field validation rules for PDF generation

### Quick API Test Examples

**Test 1: Section 301 Tariff Exposure Detection**
```bash
curl -X POST http://localhost:3001/api/ai-usmca-complete-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "TechFlow Electronics",
    "company_country": "US",
    "destination_country": "US",
    "component_origins": [{
      "description": "Microprocessor",
      "hs_code": "8542.31.00",
      "origin_country": "CN",
      "value_percentage": 35
    }],
    "trade_volume": 8500000
  }'
```

**Expected Response Includes:**
- ✅ Current Section 301 burden: $43,750/year
- ✅ Mexico nearshoring cost: +$3,500 (1-3 month payback)
- ✅ RVC impact: increases to 92%
- ✅ Financial impact section with savings calculations
- ✅ Supply chain vulnerability assessment

**Test 2: Executive Trade Alert for Policy Impact**
```bash
curl -X POST http://localhost:3001/api/executive-trade-alert \
  -H "Content-Type: application/json" \
  -d '{
    "user_profile": {
      "industry_sector": "Electronics",
      "destination_country": "US"
    },
    "workflow_intelligence": {
      "components": [{"hs_code": "8542.31.00", "origin_country": "CN"}],
      "north_american_content": 72.5,
      "annual_trade_volume": 8500000
    }
  }'
```

**Expected Response Includes:**
- ✅ Financial scenarios (if Section 301 increases 20% → +$8,750 burden)
- ✅ CBP Form 29 binding ruling guidance (90-day processing, 3-year lock-in)
- ✅ Immediate actions (supplier audit, documentation validation)
- ✅ Regulatory calendar (USTR cycles, CBP decision milestones)
- ✅ CBP Contacts: (877) CBP-5511, USMCA@cbp.dhs.gov

---

## 🔑 Key Concepts

### USMCA Eligibility
A component qualifies for USMCA benefits if:
- **Origin country**: One of US, Canada, or Mexico
- **Destination country**: One of US, Canada, or Mexico
- **Regional value content**: Meets industry-specific threshold (Textiles 55%, Electronics 65%, Auto 75%, Machinery 60%)
- **Preference Criterion**: Must be A, B, C, or D (never NULL for qualified products)
- **No tariff escalation**: RVC must not be achieved through tariff evasion

### Database-First Tariff Lookup (95% Coverage)
1. **Database** (tariff_intelligence_master: 12,118 HS codes) - Primary source: ~200ms
2. **OpenRouter API** (primary fallback for edge cases) - 5% of requests: ~2-3 seconds
3. **Anthropic Direct** (backup fallback) - If OpenRouter unavailable
4. **Note**: Database data updated regularly, AI used only for missing/new HS codes

### Subscription Tiers & Limits (Nov 4-5 Enforcement)
- **Trial**: 1 analysis/month (watermarked certificates)
- **Starter**: 15 analyses/month
- **Professional**: 100 analyses/month
- **Premium**: 500 analyses/month
- **Enforcement**: 3-layer blocking (page → component → API)

### AI Classification Flow
```
Component description → OpenRouter API → HS code + confidence
                           ↓
                    Save to tariff_rates_cache
                           ↓
                    Admin reviews (verified = false initially)
                           ↓
                    Builds knowledge base over time
```

## 🚀 Development

### Commands
```bash
npm run dev:3001      # Start dev server on port 3001
npm run build         # Production build
npm run start         # Run production build locally
npm run lint          # Manual ESLint
```

### Key Files for Development

**Authentication**:
- `pages/api/auth/login.js` - Cookie-based session
- `pages/api/auth/me.js` - Returns user with subscription tier
- `lib/middleware/auth-middleware.js` - Protected route wrapper

**Tariff Analysis**:
- `pages/api/ai-usmca-complete-analysis.js` - Main API (2000+ lines)
- `lib/ai-helpers.js` - Cache lookup logic
- `lib/agents/classification-agent.js` - HS code classification

**Workflow UI**:
- `components/workflow/USMCAWorkflowOrchestrator.js` - State management
- `components/workflow/CompanyInformationStep.js` - Step 1
- `components/workflow/ComponentOriginsStepEnhanced.js` - Step 2 (AI classification)
- `components/workflow/WorkflowResults.js` - Results

### Styling
- ✅ **DO**: Use existing CSS classes from `styles/globals.css`
- ❌ **DON'T**: Inline styles (`style={{}}`)
- ❌ **DON'T**: Tailwind CSS
- ❌ **DON'T**: Create new CSS files without approval

### Debugging

**Port already in use?**
```bash
taskkill /F /IM node.exe  # Windows
killall node              # macOS/Linux
```

**Database connection issues?**
- Check `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- Verify table names (case-sensitive on Linux/macOS)

**AI API timeout?**
- Check `OPENROUTER_API_KEY` is valid
- Verify rate limits haven't been exceeded
- Check network connectivity

## 📊 Recent Changes

### Phase 1 Complete (Oct 22, 2025)
- ✅ Destination country field + USMCA eligibility gate
- ✅ Component data restoration (fixed data loss bug)
- ✅ Database consolidation (unified tariff_rates_cache → tariff_intelligence_master)

### Phase 2 Complete (Oct 24-25, 2025) - Business Intelligence
- ✅ Executive Trade Alert API with consulting-grade strategic advisory
- ✅ Enhanced USMCA AI Prompt with financial impact analysis
- ✅ Personalized alert filtering by relevance scoring

### Phase 2.5 Complete (Nov 1-2, 2025) - Real Alert System
- ✅ **Nov 1**: Daily tariff digest system (ready to activate with Vercel cron)
- ✅ **Nov 2**: Replaced fake template alerts with real crisis_alerts matching
- ✅ **Nov 2**: Portfolio briefing API using real RSS-detected policies
- ✅ **Nov 2**: HS code normalization (fixed China component alert matching)

### Phase 3 Complete (Nov 4-5, 2025) - Subscription Enforcement
- ✅ **3-layer subscription limit enforcement**:
  1. Page-level blocking (usmca-workflow.js)
  2. Component-level blocking (ComponentOriginsStepEnhanced.js)
  3. API-level blocking (classification.js + ai-usmca-complete-analysis.js)
- ✅ **New React hook**: useSubscriptionLimit (lib/hooks/)
- ✅ **New middleware**: subscription-guard (lib/middleware/)
- ✅ **Tier limits**: Trial (1), Starter (15), Professional (100), Premium (500)
- ✅ **Race condition handling**: Reservation system prevents double-counting

### Documentation Corrections (Nov 5, 2025)
- ✅ Corrected technical debt metrics (were overstated by 10-30x)
- ✅ Updated CLAUDE.md with Nov 4-5 subscription changes
- ✅ Updated README.md with current accurate information

### Recent Commits
```
d6001ab - fix: Block '+ New Analysis' button when Trial limit reached
c9009a3 - fix: Block workflow buttons when Trial limit reached (1/1 used)
0fbae2f - fix: Remove undefined setAlertImpactAnalysis call
01b86e8 - fix: Remove visual watermark from certificate preview
4e4bf12 - feat: Block certificate download for Trial users
```

## 🔮 Roadmap

### Phase 4 (Next - Ready to Activate)
- ✅ Daily tariff digest cron job (just needs Vercel config)
- ✅ Email queue processing (ready to activate)
- Delete web search + Redis dead code (P0 cleanup)
- Document subscription enforcement pattern

### Phase 5 (Q1 2026 - Maintenance & Optimization)
- Error handling + dev_issues logging improvements
- Cross-tab workflow synchronization
- Cost optimization (A/B test Haiku vs Sonnet)
- API rate limiting (100 req/min per user)
- Consolidate config files (33 → ~20)

### Phase 6 (Q2+ 2026 - New Agreements)
- EU-UK TCA agreement support
- CPTPP agreement support
- Multi-agreement dashboard
- Bilateral agreement templates (US-Japan, US-India, etc.)
- Advanced analytics and reporting
- Partner API

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Developer quick reference (for Claude Code agents)
- **[Database Schema](./database/schema/)** - Supabase table definitions
- Source files contain inline documentation

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/description`
2. Implement with tests
3. Commit: `git commit -m "feat: description"`
4. Push: `git push origin feature/description`
5. Create PR for review

## 📞 Support

- **Production Issues**: Check Vercel logs at https://vercel.com
- **Database Issues**: Log in to Supabase project (mrwitpgbcaxgnirqtavt)
- **AI Issues**: Check OpenRouter API status
- **Code Questions**: Check source file documentation

## 📄 License

Proprietary - Triangle Intelligence Platform

---

**Latest Update**: November 5, 2025 | **Status**: Production Ready
- Phase 1-3 Complete: Core workflow + Business intelligence + Subscription enforcement
- 70% production-ready, 25% ready-to-activate (daily digest cron), 5% future work
- 90 API endpoints (76 active, 14 deprecated), ~75% clean production code
- Technical debt corrected: 9 TODOs (not 300+), 14 deprecated files (not 42+), ~1,050 lines deprecated code (not ~7,900)
