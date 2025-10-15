# Triangle Trade Intelligence Platform

**AI-Enhanced USMCA Compliance & Mexico Trade Services**

Professional trade compliance platform helping North American companies maximize USMCA benefits and build Mexico supply chain relationships through AI-enhanced expert services.

**Positioning**: Canadian-owned platform with Mexico-based operations - North American business standards with Mexico market access and insights.

---

## 🎯 Features

### Core Services
- **USMCA Analysis** - AI-powered qualification assessment with automatic component enrichment
- **Certificate Generation** - Professional USMCA certificates validated by trade compliance experts
- **Trade Alerts** - Real-time crisis monitoring and supply chain risk alerts
- **Mexico Services** - Supplier sourcing, manufacturing feasibility, market entry strategy
- **Component Enrichment** - Automatic tariff intelligence with HS code classification

### Expert Team

**Founder (Canadian from Ottawa, living in Mexico)**:
- 15+ years high-tech experience (IBM, Cognos, Mitel, LinkedIn)
- Video production specialist and platform developer
- Bilingual: English/French (Quebec market access)
- **Trust Factor**: Canadian ownership with Mexico market access

**Cristina Escalante** - Trade Compliance Expert
- Professional Certification #4601913 (**NOT a licensed customs broker**)
- 17 years logistics experience (Motorola, Arris, Tekmovil)
- International Commerce degree, HTS codes and INCOTERMS specialist
- Native Spanish speaker with advanced English

**Jorge Ochoa** - B2B Sales Expert
- 7+ years as business owner (Art Printing)
- Consultative selling approach, bilingual (Spanish/English)
- Mexico supplier relationships and cultural bridge

---

## 📌 Current Status (October 2025)

**✅ Production-Ready Clean Codebase**
- All legacy/experimental code archived
- Single git repository: `triangle-trade-intelligence`
- Working on `main` branch only
- Auto-deploys to Vercel on push

**🔐 Admin Access**
- Email: triangleintel@gmail.com
- Password: Admin2025!
- Dashboards: `/admin/broker-dashboard`, `/admin/jorge-dashboard`, `/admin/analytics`

**🚀 Deployment**
- Production: https://triangle-trade-intelligence.vercel.app
- Auto-deploy: Push to `main` branch → Vercel deploys automatically
- Simple workflow: `git add . && git commit -m "message" && git push`

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (Pages Router), React 18
- **Database**: Supabase PostgreSQL (34,476+ HS codes)
- **AI**: OpenRouter API (Claude models)
- **Payments**: Stripe
- **Auth**: Cookie-based sessions (HttpOnly cookies)
- **Styling**: Custom CSS (NO Tailwind, NO inline styles)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account
- OpenRouter API key

### Development Server Ports
- **Port 3000**: Reserved for USER - main development server for direct testing
- **Port 3001**: Reserved for CLAUDE CODE agents - automated testing/validation

```bash
npm run dev        # User development (port 3000)
npm run dev:3001   # Claude Code agents (port 3001)
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# OpenRouter API (AI Services)
OPENROUTER_API_KEY=your_openrouter_api_key

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Product IDs
STRIPE_STARTER_PRICE_ID=price_starter_id
STRIPE_PROFESSIONAL_PRICE_ID=price_professional_id
STRIPE_PREMIUM_PRICE_ID=price_premium_id

# JWT Secret for Cookie Auth
JWT_SECRET=your_jwt_secret_here
```

### Installation

```bash
# Install dependencies
npm install

# Run development server (USER - port 3000)
npm run dev

# Run development server (CLAUDE CODE - port 3001)
npm run dev:3001
```

Open [http://localhost:3000](http://localhost:3000) for user development
Open [http://localhost:3001](http://localhost:3001) for Claude Code agent testing

### Build for Production

```bash
npm run build
npm start
```

---

## 💰 Business Model

### Subscription Tiers

**7-Day Free Trial ($0)**
- 1 USMCA analysis (max 3 components)
- Certificate preview only (watermarked)
- View crisis alerts in dashboard
- No credit card required

**Starter ($99/month)**
- 10 USMCA analyses per month (10 components each)
- Basic trade alerts
- Email support (high/critical alerts only)
- Full certificate download
- No service discounts

**Professional ($299/month)** ← Most SMBs land here
- Unlimited USMCA analyses
- Real-time crisis alerts
- **15% discount on all professional services**
- Priority 48hr support
- Advanced trade policy analysis

**Premium ($599/month)**
- Everything in Professional
- **25% discount on all professional services**
- Quarterly 1-on-1 strategy calls with Jorge & Cristina
- Dedicated Slack/email support
- Custom trade intelligence reports

### Professional Services (Team Collaboration Model)

**All services delivered collaboratively between Jorge and Cristina with different lead/support ratios:**

1. **🏥 Trade Health Check**: $99 (no subscriber discounts)
   - Team Lead: Jorge & Cristina (Equal 50% each)
   - Complete assessment with prioritized action plan

2. **📜 USMCA Advantage Sprint**: $175 base / $149 Professional / $131 Premium
   - Team Lead: Cristina (70% effort) / Jorge (30% support)
   - USMCA qualification assessment and optimization roadmap

3. **🔧 Supply Chain Optimization**: $275 base / $234 Professional / $206 Premium
   - Team Lead: Cristina (60% effort) / Jorge (40% support)
   - Complete supply chain efficiency audit and cost reduction

4. **🚀 Pathfinder Market Entry**: $350 base / $298 Professional / $263 Premium
   - Team Lead: Jorge (65% effort) / Cristina (35% support)
   - Mexico market analysis and distribution strategy

5. **🛡️ Supply Chain Resilience**: $450 base / $383 Professional / $338 Premium
   - Team Lead: Jorge (60% effort) / Cristina (40% support)
   - Alternative supplier research and USMCA qualification

6. **🆘 Crisis Navigator**: $200/month ongoing retainer
   - Team Lead: Cristina (60% effort) / Jorge (40% support)
   - Priority emergency response and regulatory monitoring

**Note:** All pricing reflects consulting and guidance scope. For official customs broker services (legal customs filings) and formal certifications, we partner with licensed customs brokers (separate fees apply).

### 🚨 Legal Service Scope & Disclaimers

**What We Provide:**
- ✅ Trade compliance consulting and optimization guidance
- ✅ USMCA qualification assessments and recommendations
- ✅ Logistics planning and strategic recommendations
- ✅ Supply chain analysis and process improvement
- ✅ Market entry strategy and business development support

**What We DO NOT Provide:**
- ❌ Licensed customs broker services (legal customs filings)
- ❌ Official USMCA certificate preparation (legal documents)
- ❌ Formal legal compliance certifications
- ❌ Official customs declarations

**Partner Network:**
For official customs broker services (legal customs filings) and formal legal certifications, we partner with licensed customs brokers. Our trade compliance experts provide consulting, guidance and assessments; official legal customs declarations require licensed customs brokers.

**Service Disclaimer:**
*"Triangle Trade Intelligence provides trade compliance consulting, optimization guidance, and strategic recommendations through experienced trade compliance professionals. We are NOT licensed customs brokers. Official customs declarations, formal legal certifications, and customs filings require partnership with licensed customs brokers. All recommendations are for consulting and guidance purposes and should be validated with licensed customs brokers when official filings are required."*

---

## 🗺️ User Journey

**Core Flow:**
```
Homepage (/)
  → Signup (/signup) - 7-day free trial
  → USMCA Workflow (/usmca-workflow) - Protected (requires subscription)
  → Results with component enrichment
  → Two Paths:
     - Certificate (/usmca-certificate-completion)
     - Trade Alerts (/trade-risk-alternatives)
  → Professional Services (/services)
  → Dashboard (/dashboard)
```

**Admin Dashboards:**
- Cristina: `/admin/broker-dashboard` - ALL 6 services visible (leads: Health Check 50%, USMCA Advantage 70%, Supply Chain Opt 60%, Crisis Navigator 60%)
- Jorge: `/admin/jorge-dashboard` - ALL 6 services visible (leads: Pathfinder 65%, Supply Chain Resilience 60%)
- Analytics: `/admin/analytics` - Revenue, user analytics, business intelligence

**Key Feature:** Both dashboards show ALL 6 services - the difference is WHO is the primary lead for each service based on skill allocation percentages.

---

## 📁 Project Structure

```
triangle-trade-intelligence/
├── components/
│   ├── shared/            # 6 team collaboration service tabs
│   ├── workflow/          # Workflow components (13 files)
│   ├── admin/             # Admin components
│   └── [core components]  # Layout, dashboard, etc.
│
├── config/
│   ├── service-configurations.js  # 6 active services (SINGLE SOURCE OF TRUTH)
│   ├── team-config.js            # Team member roles and expertise
│   ├── usmca-thresholds.js       # USMCA qualification rules
│   ├── business-types.js         # Dynamic business types (16 sectors)
│   └── workflow-statuses.js      # Centralized status enums
│
├── lib/
│   ├── database/
│   │   └── supabase.js
│   ├── utils/
│   │   ├── error-handler.js
│   │   └── logger.js
│   └── services/
│       └── workflow-service.js
│
├── pages/
│   ├── api/               # API routes (50+ endpoints)
│   │   ├── auth/         # Cookie-based authentication
│   │   ├── stripe/       # Stripe payments
│   │   ├── admin/        # Admin endpoints
│   │   └── services/     # Service APIs
│   ├── admin/            # Admin dashboards
│   └── [core pages]      # User-facing pages
│
├── public/               # Static assets
├── styles/               # CSS files (NO Tailwind)
│   ├── globals.css
│   ├── dashboard-user.css
│   └── admin-workflows.css
│
└── database/
    └── migrations/       # SQL migration files
```

---

## 🔑 Key Features

### User-Facing Features
- **Video Hero Section**: Professional earth loop video on homepage
- **Interactive Calculator**: Mexico savings calculator with real-time calculations
- **Protected Workflow**: Subscription-required USMCA analysis
- **Component Enrichment**: Automatic AI-powered tariff intelligence (NEW October 2025)
- **Dual Path Results**: Certificate generation OR trade alerts
- **Real-time Alerts**: Trade risk monitoring with crisis notifications
- **User Dashboard**: Workflow history with dropdown selector + preview cards
- **Privacy Controls**: Account settings with data deletion

### Admin Features
- **Team Collaboration**: Both dashboards see all 6 services with different lead ratios
- **Service Workflow Modals**: Reusable 3-stage workflow pattern
- **Component Tables**: 8-column enriched component display with tariff intelligence (NEW)
- **Admin Intelligence**: Client opportunity prioritization
- **Floating Team Chat**: Real-time inter-team communication
- **Business Analytics**: Revenue tracking and user metrics
- **Toast Notifications**: User feedback system
- **Error Boundaries**: Graceful error handling

### Component Enrichment (NEW - October 2025)
**Automatic AI-powered enrichment of component data:**
- HS code classification (via OpenRouter API)
- Tariff rate lookup (from database hs_master_rebuild table)
- MFN rate (Most Favored Nation)
- USMCA rate (preferential)
- Savings calculation (MFN - USMCA)
- AI confidence score
- Visual alerts for low confidence or Mexico opportunities

**Admin Dashboard Display:**
- 8-column component tables with complete tariff intelligence
- Real-time enrichment status indicators
- Automatic fallback to AI if database lookup fails
- Professional validation for low-confidence classifications

---

## 🚢 Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

**Environment Variables Checklist:**
- [ ] Supabase URL and keys
- [ ] OpenRouter API key
- [ ] Stripe keys and webhook secret
- [ ] Stripe product price IDs
- [ ] JWT_SECRET for cookie auth

### Configure Stripe Webhook

After deployment:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret
5. Add to Vercel: `STRIPE_WEBHOOK_SECRET`

---

## 🔧 Development

### Available Scripts

```bash
npm run dev              # Start development server (port 3000 - USER)
npm run dev:3001         # Start development server (port 3001 - CLAUDE CODE)
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
```

### Key Implementation Details

**Authentication:**
- Cookie-based auth (HttpOnly cookies)
- SimpleAuthContext for session management
- No Supabase auth tokens in localStorage
- JWT_SECRET for session signing

**AI Integration:**
- All AI functionality uses OpenRouter API
- Claude models for analysis and recommendations
- ~$0.005 per workflow (half a cent)
- Hybrid approach: Database first, AI fallback

**USMCA Compliance:**
- Config file for industry thresholds (treaty-defined)
- AI for context-dependent analysis (HS codes, recommendations)
- Database for user data only
- No hardcoded business data

**Anti-Hardcoding Architecture:**
- All services in `config/service-configurations.js`
- All business types in `config/business-types.js`
- All statuses in `config/workflow-statuses.js`
- Single source of truth for all business logic

---

## 📚 Documentation

### Essential Files
- `CLAUDE.md` - Complete project documentation (MASTER REFERENCE)
- `PRE_LAUNCH_CHECKLIST.md` - Launch preparation checklist
- `DEPLOYMENT_READY_SUMMARY.md` - Deployment summary

### Key Pages
- Homepage: `/` - Value proposition and calculator
- Workflow: `/usmca-workflow` - 2-step compliance analysis with component enrichment
- Certificate: `/usmca-certificate-completion` - Certificate generation
- Alerts: `/trade-risk-alternatives` - Crisis monitoring
- Services: `/services` - Professional service marketplace
- Dashboard: `/dashboard` - User account management

---

## 🔐 Security

- Environment variables never committed
- HttpOnly cookies for authentication
- JWT_SECRET for session signing
- Stripe webhooks validated
- API routes protected with middleware
- User data encrypted in Supabase

---

## 📈 Status

**Current Version:** 1.0.0 (Production Ready)
**Last Updated:** October 2025
**Build Status:** ✅ Passing
**Deployment:** Ready for Vercel

**Recent Updates:**
- ✅ Component Enrichment Feature (October 2025)
- ✅ Team Collaboration Services Model (6 active services)
- ✅ Anti-Hardcoding Architecture (Configuration-driven)
- ✅ Fixed False "Licensed Customs Broker" Claims (October 2025)
- ✅ Cookie-Based Authentication (HttpOnly cookies)
- ✅ Port Assignment Strategy (3000 user, 3001 agents)

---

## 🤝 Contributing

This is a private production repository. For development work, use the development branch.

---

## 📞 Support

**Email:** support@triangletrade.com
**Admin Access:** triangleintel@gmail.com / Admin2025!

---

## 📄 License

Proprietary - All Rights Reserved

---

**Built with ❤️ for North American trade professionals by a Canadian founder living in Mexico**
