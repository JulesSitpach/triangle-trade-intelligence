# Triangle Intelligence Platform - Agent Prompts (Concise)

## 🛠️ AGENT 1: INFRASTRUCTURE SPECIALIST

```
I need help testing my Triangle Intelligence Platform's core systems for launch.

Focus: Database, APIs, Beast Master Controller (6 systems), RSS monitoring, performance
Goal: All systems operational, <1000ms responses, 500K+ records accessible

Test these key endpoints:
- /api/status
- /api/database-structure-test  
- /api/dashboard-hub-intelligence
- /api/cron/rss-monitor (RSS feeds)
- /api/redis-rate-limiting-demo

Verify:
- Supabase connection working (500K+ trade flows)
- Beast Master Controller (6 intelligence systems) operational
- Database Intelligence Bridge functional
- RSS monitoring active (15-min intervals)
- Redis rate limiting working
- Performance targets met
- Trilingual support (EN/ES/FR)

Bloomberg CSS only, no inline styles, production logging throughout.
Tech Stack: Next.js 13.5, React 18, Supabase, Redis, RSS Parser, ioredis
```

## 👥 AGENT 2: USER JOURNEY SPECIALIST

```
I need help testing my Triangle Intelligence Platform's user journey for launch.

Focus: Complete 6-page flow works without getting stuck, multilingual support
Journey: /foundation → /product → /routing → /partnership → /hindsight → /alerts → /dashboard-hub

Test:
- Each page loads and functions properly
- Data persists between pages (localStorage with validation)
- Navigation works smoothly across all 6 pages
- Bloomberg-style professional UI maintained
- Language switching works (EN/ES/FR)
- State management functioning (TriangleStateContext)
- Executive demo ready with real data

Verify:
- Form validation and error handling
- Responsive design on desktop/mobile
- Professional appearance throughout
- No broken links or missing translations

Goal: Smooth user experience, no broken functionality, production-ready interface.
```

## 🧠 AGENT 3: INTELLIGENCE SYSTEMS SPECIALIST

```
I need help testing my Triangle Intelligence Platform's AI systems for launch.

Focus: Compound intelligence accuracy, calculations, data quality, RSS integration
Systems: Beast Master (6 systems), triangle routing, HS classifications, market monitoring

Test Beast Master Intelligence:
- Similarity Intelligence (205+ sessions)
- Seasonal Intelligence (Q4_HEAVY patterns)
- Market Intelligence (volatility tracking)
- Success Pattern Intelligence (33+ patterns)
- Alert Generation Intelligence
- Shipping Intelligence

Verify:
- Compound intelligence generation works
- Triangle routing calculations accurate (USMCA 0% vs 30-50% bilateral tariffs)
- HS code lookups return real results from 17,500+ codes
- Geographic intelligence responds correctly
- Dashboard Hub shows live data from 500K+ records
- RSS market alerts generating properly
- Marcus AI consultation system functional

Test Data Sources:
- trade_flows: 500,800+ records
- comtrade_reference: 17,500+ HS codes
- translations: 700+ trilingual entries
- Real-time RSS feeds active

Goal: All intelligence systems generating accurate, compound insights with network effects.
```

## 🚀 AGENT 4: PRODUCTION READINESS SPECIALIST

```
I need help testing my Triangle Intelligence Platform for production launch readiness.

Focus: Security, performance, monitoring, deployment configuration
Tech: Next.js 13.5, Vercel deployment, Redis caching, automated RSS monitoring

Test Production Systems:
- Security headers (CSP, HSTS, X-Frame-Options)
- Environment validation (all required env vars)
- Vercel cron jobs working (/api/cron/rss-monitor every 15min)
- Redis rate limiting operational
- Bundle optimization and compression
- Error handling and logging
- Database connection pooling

Performance Targets:
- Page load: <1.2s (68% improvement)
- Query response: <0.3s (85% improvement)
- API calls reduced by 80% (volatile/stable separation)

Verify:
- All 500K+ database records accessible
- No exposed API keys client-side
- Production logging filters sensitive data
- RSS monitoring generates real alerts
- Trilingual support working (EN/ES/FR)
- Mobile responsive design

Goal: Production-ready deployment with enterprise-grade performance and security.
```

---

## 🎯 USAGE INSTRUCTIONS

**Copy the specific agent prompt you want to use and paste it directly into a new Claude conversation.**

**Recommended testing order:**
1. **Infrastructure Specialist** (fix core systems first)
2. **User Journey Specialist** (test complete user flow)
3. **Intelligence Systems Specialist** (verify AI accuracy)
4. **Production Readiness Specialist** (final launch prep)

**Current Platform Status:**
- ✅ 500K+ trade flow records operational
- ✅ 6-page intelligence journey functional
- ✅ Beast Master Controller (6 systems) active
- ✅ RSS monitoring every 15 minutes
- ✅ Redis rate limiting implemented
- ✅ Trilingual support (EN/ES/FR)
- ✅ Database Intelligence Bridge optimized

**Key Testing URLs:**
- Foundation: `http://localhost:3000/foundation`
- Status Check: `http://localhost:3000/api/status`
- Database Test: `http://localhost:3000/api/database-structure-test`
- Dashboard Hub: `http://localhost:3000/dashboard-hub`

**Environment Required:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://mrwitpgbcaxgnirqtavt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
COMTRADE_API_KEY=4cc45d91763040439c2740a846bd7c53
ANTHROPIC_API_KEY=sk-ant-api03-...
CRON_SECRET=generate-new-32-byte-hex-secret
```

---

**Triangle Intelligence: $100K-$300K+ annual savings through USMCA triangle routing with compound intelligence.**