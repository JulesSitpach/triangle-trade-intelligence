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

### Three-Step Workflow
1. **Company Information** - Business profile and destination market
2. **Component Details** - Product components with AI classification
3. **Results** - USMCA qualification status and tariff analysis

### Key Features
- 🤖 AI-powered HS code classification (OpenRouter + Anthropic fallback)
- 📊 Real-time tariff rate lookup with policy adjustments
- 💰 Automatic savings calculation (MFN vs USMCA rates)
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
  ├── usmca-workflow.js           # Main 3-step workflow
  ├── pricing.js                  # Subscription plans
  ├── dashboard.js                # User dashboard
  └── api/
      ├── auth/                   # Login/register/logout
      ├── agents/classification   # HS code classification
      └── ai-usmca-complete-analysis.js  # Main tariff endpoint

components/workflow/
  ├── CompanyInformationStep.js
  ├── ComponentOriginsStepEnhanced.js
  └── WorkflowResults.js

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

## 📊 Recent Changes (Oct 22, 2025)

### Phase 1 Complete
- ✅ **P0-1**: Destination country field implemented
- ✅ **P0-2**: Component data restoration on navigation (fixed data loss bug)
- ✅ **P0-3**: USMCA eligibility gate added (destination validation)
- ✅ **P0-4**: Tariff data verified current (not stale)
- ✅ **P0-5**: Cache consolidation (unified tariff_rates_cache table)

### Commits
```
7aa37de - fix: P0-5 Cache table consolidation
2d2b9c6 - fix: P0 critical fixes - Component data loss + USMCA gate
```

## 🔮 Roadmap

### Phase 2 (Next - P1 Fixes)
- Error handling + dev_issues logging
- Cross-tab workflow synchronization
- Cost optimization (Haiku vs Sonnet)

### Phase 3 (Q1 2026)
- EU-UK TCA agreement support
- CPTPP agreement support
- Multi-agreement dashboard

### Phase 4 (Q2+ 2026)
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

**Latest Update**: October 22, 2025 | **Status**: Production Ready (Phase 1 Complete)
