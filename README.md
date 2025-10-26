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
**Processing**: AI-powered HS code classification + tariff rate lookup
**Output**: USMCA eligibility assessment + tariff savings calculation

### Four-Step Workflow
1. **Company Information** - Business profile and destination market
2. **Component Details** - Product components with AI classification
3. **Results & Alerts** - USMCA qualification status, tariff analysis, policy alerts
4. **Certificate Preview & Download** - Official USMCA form with editable fields + responsibility confirmation

### Key Features
- 🤖 AI-powered HS code classification (OpenRouter + Anthropic fallback)
- 📊 Real-time tariff rate lookup with policy adjustments
- 💰 Automatic savings calculation (MFN vs USMCA rates)
- 📝 **NEW:** Editable official USMCA certificate preview (light blue input boxes)
- ⚠️ **NEW:** Clear user responsibility messaging with confirmation checkboxes
- 🔐 Secure authentication with JWT cookies
- 📱 Responsive design (mobile, tablet, desktop)

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

### Database Schema
- `auth.users` - Supabase authentication
- `user_profiles` - Subscription tier, trial dates
- `workflow_sessions` - Completed USMCA workflows
- `tariff_rates_cache` - AI classifications + tariff rates (unified Oct 22, 2025)

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
  ├── agents/classification-agent.js
  ├── ai-helpers.js
  └── tariff/enrichment-router.js

config/
  ├── usmca-thresholds.js         # Eligibility rules
  └── system-config.js             # Global constants

styles/
  ├── globals.css                 # Main styles
  └── admin-workflows.css         # Admin-specific styles
```

## 🔌 API Endpoints (Fully Documented & Tested)

### Endpoint Status Summary

**✅ PRIMARY**: `/api/ai-usmca-complete-analysis` - **FULLY IMPLEMENTED**
- Tariff enrichment, component analysis, financial impact, RVC qualification
- Request: Company info + components with origins
- Response: USMCA qualification + component tariff breakdown + certificate data

**✅ SECONDARY**: `/api/executive-trade-alert` - **FULLY IMPLEMENTED** (Oct 25, 2025)
- Financial scenarios (Section 301 escalation, nearshoring ROI)
- CBP compliance strategy (Form 29 binding ruling, audit prevention)
- 3-phase strategic roadmap
- Regulatory calendar and contacts

**✅ TERTIARY**: `/api/generate-personalized-alerts` - **FULLY IMPLEMENTED**
- Filters static alerts by relevance to user's products
- Relevance scoring: Industry (+40), Geography (+30), Product (+30), Destination (+20)
- Returns max 3 most relevant alerts

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
- **Regional value content**: Meets industry-specific threshold (Textiles 55%, Electronics 65%, Auto 75%)
- **No tariff escalation**: RVC must not be achieved through tariff evasion

### Tariff Rate Cache (4-Tier System)
1. **Database** (persistent, indexed) - Latest: ~200ms
2. **In-Memory** (session) - Repeat lookups: <50ms
3. **OpenRouter API** (primary) - Fresh data: ~2-3 seconds
4. **Anthropic Direct** (backup) - If OpenRouter down
5. **Stale Database** (last resort) - Clearly marked as outdated

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
- ✅ **P0-1**: Destination country field implemented
- ✅ **P0-2**: Component data restoration on navigation (fixed data loss bug)
- ✅ **P0-3**: USMCA eligibility gate added (destination validation)
- ✅ **P0-4**: Tariff data verified current (not stale)
- ✅ **P0-5**: Cache consolidation (unified tariff_rates_cache table)

### Phase 2 Complete (Oct 24-25, 2025)
**Business Intelligence Enhancement**
- ✅ **Executive Trade Alert API** - Enhanced from basic policy detection to consulting-grade strategic advisory
  - Financial scenarios: Section 301 escalation (what if increases 20%?), nearshoring ROI, exemption scenarios
  - CBP compliance strategy: Form 29 binding ruling guidance, immediate actions, risk management
  - 3-phase strategic roadmap: Supplier Assessment → Trial Shipment → Gradual Migration
  - Regulatory calendar: USTR cycles, CBP decision milestones, audit risk assessment

- ✅ **Enhanced USMCA AI Prompt** - Transforms compliance checking to strategic business intelligence
  - Financial impact analysis: Annual/monthly tariff savings, Section 301 exposure in dollars
  - Supply chain vulnerabilities: Identifies Chinese components, policy risk assessment
  - Strategic alternatives: Mexico sourcing with cost/benefit analysis and payback period

- ✅ **Personalized Alert Filtering** - Filters static policy alerts by user relevance
  - Relevance scoring system (Industry +40, Geography +30, Product +30, Destination +20)
  - Top 3 most relevant alerts instead of all 5 generic policies

### Commits
```
0940b0a - feat: Add business intelligence enhancements to USMCA analysis
de6c134 - feat: Implement executive-trade-alert and generate-personalized-alerts APIs
110f6ce - feat: Enhance executive summary display with business advisory formatting
```

## 🔮 Roadmap

### Phase 3 (Next - P1 Fixes)
- Error handling + dev_issues logging (track failures in dev_issues table)
- Cross-tab workflow synchronization (prevent data conflicts when editing in multiple tabs)
- Cost optimization (A/B test Haiku vs Sonnet for tariff analysis)
- API rate limiting (100 req/min per user)

### Phase 4 (Q1 2026)
- EU-UK TCA agreement support (separate codebase)
- CPTPP agreement support (separate codebase)
- Multi-agreement dashboard

### Phase 5 (Q2+ 2026)
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

**Latest Update**: October 25, 2025 | **Status**: Production Ready (Phase 1 & 2 Complete - Business Intelligence Enhanced)
