# Triangle Trade Intelligence Platform

**AI-Enhanced USMCA Compliance & Mexico Trade Services**

Professional trade compliance platform helping North American companies maximize USMCA benefits and build Mexico supply chain relationships.

---

## 🎯 Features

### Core Services
- **USMCA Analysis** - Instant qualification assessment and tariff savings calculator
- **Certificate Generation** - Professional USMCA certificates validated by licensed customs broker
- **Trade Alerts** - Real-time crisis monitoring and supply chain risk alerts
- **Mexico Services** - Supplier sourcing, manufacturing feasibility, market entry strategy

### Expert Team
- **Cristina Escalante** - Licensed customs broker (License #4601913), 17 years logistics experience
- **Jorge Ochoa** - B2B sales expert, 4+ years proven track record, bilingual (Spanish/English)

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (Pages Router), React 18
- **Database**: Supabase PostgreSQL (34,476+ HS codes)
- **Payments**: Stripe
- **AI**: OpenRouter API (Claude models)
- **Styling**: Custom CSS (no frameworks)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account
- OpenRouter API key

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_key

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

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

---

## 📊 Business Model

### Subscription Tiers

**Starter ($99/month)**
- 10 USMCA analyses per month
- Basic trade alerts
- Email support
- Certificate generation

**Professional ($299/month)** ← Most popular
- Unlimited USMCA analyses
- Real-time crisis alerts
- **15% discount on all professional services**
- Priority 48hr support

**Premium ($599/month)**
- Everything in Professional
- **25% discount on all professional services**
- Quarterly strategy calls
- Dedicated support

### Professional Services

**Cristina's Compliance Services:**
- USMCA Certificate: $250 ($212 Pro / $188 Premium)
- HS Classification: $200 ($170 Pro / $150 Premium)
- Crisis Response: $500 ($425 Pro / $375 Premium)

**Jorge's Mexico Trade Services:**
- Supplier Sourcing: $450 ($383 Pro / $338 Premium)
- Manufacturing Feasibility: $650 ($552 Pro / $488 Premium)
- Market Entry Strategy: $550 ($467 Pro / $412 Premium)

---

## 🗺️ User Journey

**Core Flow:**
```
Homepage (/)
  → Signup (/signup)
  → USMCA Workflow (/usmca-workflow)
  → Results
  → Two Paths:
     - Certificate (/usmca-certificate-completion)
     - Trade Alerts (/trade-risk-alternatives)
  → Services (/services)
  → Dashboard (/dashboard)
```

**Admin Dashboards:**
- Cristina: `/admin/broker-dashboard` (Compliance services)
- Jorge: `/admin/jorge-dashboard` (Mexico trade services)

---

## 📁 Project Structure

```
triangle-trade-intelligence/
├── components/
│   ├── cristina/          # Cristina's service components (5 files)
│   ├── jorge/             # Jorge's service components (4 files)
│   ├── shared/            # Shared utilities (8 files)
│   ├── workflow/          # Workflow components (13 files)
│   └── [core components]  # Layout, dashboard, etc.
│
├── config/
│   └── usmca-thresholds.js  # USMCA qualification rules
│
├── contexts/
│   └── SimpleAuthContext.js  # Authentication context
│
├── lib/
│   ├── database/
│   │   └── supabase.js
│   ├── utils/
│   │   ├── error-handler.js
│   │   └── logger.js
│   └── database-driven-usmca-engine.js
│
├── pages/
│   ├── api/               # API routes (50+ endpoints)
│   │   ├── auth/         # Authentication
│   │   ├── stripe/       # Stripe payments
│   │   └── admin/        # Admin endpoints
│   ├── admin/            # Admin dashboards
│   └── [core pages]      # User-facing pages
│
├── public/               # Static assets
├── styles/               # CSS files
│   ├── globals.css
│   ├── dashboard-user.css
│   └── admin-workflows.css
│
└── database/
    └── migrations/       # SQL migration files
```

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
- [ ] Next.js secret for sessions

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
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
```

### Key Implementation Details

**Authentication:**
- Cookie-based auth (HttpOnly cookies)
- SimpleAuthContext for session management
- No Supabase auth tokens in localStorage

**AI Integration:**
- All AI functionality uses OpenRouter API
- Claude models for analysis and recommendations
- ~$0.005 per workflow (half a cent)

**USMCA Compliance:**
- Config file for industry thresholds (treaty-defined)
- AI for context-dependent analysis
- Database for user data only

---

## 📚 Documentation

### Essential Files
- `PRE_LAUNCH_CHECKLIST.md` - Launch preparation checklist
- `DEPLOYMENT_READY_SUMMARY.md` - Deployment summary
- `STRIPE_CTA_ALIGNMENT.md` - Stripe integration notes

### Key Pages
- Homepage: `/` - Value proposition and calculator
- Workflow: `/usmca-workflow` - 2-step compliance analysis
- Certificate: `/usmca-certificate-completion` - Certificate generation
- Alerts: `/trade-risk-alternatives` - Crisis monitoring
- Services: `/services` - Professional service marketplace
- Dashboard: `/dashboard` - User account management

---

## 🔐 Security

- Environment variables never committed
- HttpOnly cookies for authentication
- Stripe webhooks validated
- API routes protected with middleware
- User data encrypted in Supabase

---

## 📈 Status

**Current Version:** 1.0.0 (Production Ready)
**Last Updated:** October 2025
**Build Status:** ✅ Passing
**Deployment:** Ready for Vercel

---

## 🤝 Contributing

This is a private production repository. For development work, use the development branch.

---

## 📞 Support

**Email:** support@triangletrade.com
**Admin Access:** Contact system administrator

---

## 📄 License

Proprietary - All Rights Reserved

---

**Built with ❤️ for North American trade professionals**
