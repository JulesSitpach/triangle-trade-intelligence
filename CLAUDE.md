# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Triangle Intelligence is a sophisticated tariff volatility tracking and trade optimization platform that delivers $100K-$300K+ annual savings through USMCA triangle routing strategies. The platform's core innovation is intelligent separation of volatile vs stable data to maximize intelligence while minimizing API costs.

**🚀 STATUS: FULLY OPERATIONAL** - Beast Master Controller, Goldmine Intelligence, RSS monitoring, Redis rate limiting, and optimization systems are active with compound intelligence generation from 500K+ database records.

**Core Value Proposition**: While bilateral tariffs (China: 30%, India: 50%) change daily with political decisions, USMCA triangle routing rates remain stable at 0% - providing predictable savings in volatile markets through real-time intelligence.

**Tech Stack**: Next.js 13.5, React 18, Supabase, i18next, Anthropic Claude API, Jest, Node.js, Redis, RSS Parser, ioredis

## Development Commands

```bash
# Development
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production  
npm start           # Start production server

# Testing
npm test            # Run Jest tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:ci     # CI/CD optimized run

# Code Quality
npm run lint        # ESLint with Next.js config
npm run type-check  # TypeScript type checking

# System Verification
curl http://localhost:3000/api/status                      # Check API configuration
curl http://localhost:3000/api/database-structure-test     # Test database architecture
curl http://localhost:3000/api/dashboard-hub-intelligence  # Test Beast Master & Goldmine
Navigate to /dashboard-hub                                  # Bloomberg Terminal-style dashboard
Navigate to /api-test                                      # Interactive API dashboard

# Bundle Analysis
ANALYZE=true npm run build  # Generate bundle analyzer report
```

## Core Architecture: Volatile vs Stable Data Strategy

The platform's competitive advantage comes from intelligently separating **volatile data** (requiring API calls) from **stable data** (cached forever).

### Volatile Data (API Updates Required)
- **Tariff rates**: China (30%), India (50%) - change daily with political decisions
- **Shipping costs**: Port congestion, fuel surcharges, carrier capacity
- **Country risk scores**: Political stability, supply chain disruptions

**Tables**: `current_market_alerts`, `api_cache`, `country_risk_scores`
**Cache Duration**: 1-4 hours depending on volatility
**Cost**: API calls required when data expires

### Stable Data (Cache Forever - Zero API Costs) 
- **USMCA rates**: 0% Mexico/Canada (treaty-locked, never change)
- **Port locations**: Infrastructure doesn't move
- **Trade routes**: Geographic routing logic
- **HS code classifications**: Annual updates maximum

**Tables**: `usmca_tariff_rates`, `us_ports`, `comtrade_reference`, `hindsight_pattern_library`
**Cache Duration**: FOREVER
**Cost**: Zero API calls - query database directly

### Database Intelligence Bridge

**Critical Architecture**: All intelligence flows through `lib/intelligence/database-intelligence-bridge.js` which implements the volatile/stable strategy:

```javascript
// STABLE DATA - Instant responses, zero API costs
const usmcaRate = await StableDataManager.getUSMCARates('CN-MX-US')  // Always 0%
const ports = await StableDataManager.getPortInfo('west_coast')      // Static data

// VOLATILE DATA - API calls only when cache expires  
const currentRate = await VolatileDataManager.getOrFetchAPIData('comtrade', params)
const shipping = await VolatileDataManager.getOrFetchAPIData('shippo', params)
```

**Result**: 80%+ API call reduction while maintaining real-time market intelligence.

## Intelligence Platform Architecture

### RSS-Driven Market Monitoring System ✨ OPERATIONAL
**Real-time Market Intelligence** with automated RSS monitoring:
- **Live RSS Feeds**: Automated monitoring every 15 minutes via Vercel cron
- **Market Alert Generation**: Real-time tariff and trade policy changes
- **Redis Rate Limiting**: Enterprise-grade request throttling and caching
- **Background Services**: Automated data collection and processing

### Dashboard Hub (`/dashboard-hub`) ✨ ACTIVE
**Executive Intelligence Hub** powered by Beast Master Controller and Goldmine Intelligence:
- **Real-time Compound Insights**: 6 intelligence systems working together
- **Multi-view Dashboard**: Executive, Intelligence, Financial, Implementation, Partnership
- **Live Performance Monitoring**: System health and intelligence quality metrics
- **Network Effects Tracking**: Database growth from user interactions

### 6-Page Intelligence Journey
1. **Foundation** (`/foundation`) - Business intake with geographic intelligence derivation
2. **Product** (`/product`) - Product intelligence with HS code mapping via server-side APIs  
3. **Routing** (`/routing`) - Triangle routing using Database Intelligence Bridge
4. **Partnership** (`/partnership`) - Strategic partner ecosystem and connections
5. **Hindsight** (`/hindsight`) - Hindsight pattern extraction to institutional memory
6. **Alerts** (`/alerts`) - Predictive alerts based on volatility tracking

**Navigation Flow**: Streamlined 6-page journey with Dashboard Hub for executive oversight.

## Database Schema (Supabase)

### Institutional Intelligence (500K+ Trade Flows)
```sql
comtrade_reference: 17,500+ rows        # Enhanced HS code classifications
trade_flows: 500,800+ rows              # Massive bilateral trade analysis
workflow_sessions: 205+ rows            # User journey patterns for learning
hindsight_pattern_library: 33+ rows     # Extracted success patterns
marcus_consultations: 20+ rows          # AI analysis history
translations: 700+ rows                 # Trilingual support (EN/ES/FR)
```

### Volatile Market Data & RSS Monitoring
```sql
current_market_alerts: Real-time        # Live tariff changes via RSS
api_cache: TTL-based                    # Cached API responses with expiry
country_risk_scores: Dynamic            # Risk volatility tracking
network_intelligence_events: Logging    # Market change events
rss_monitoring_events: Real-time        # RSS feed monitoring logs
```

### Stable Treaty Data  
```sql
usmca_tariff_rates: 48 rows            # 0% rates, treaty-locked forever
us_ports: 10 rows                      # Port infrastructure (static)
countries: 30+ rows                    # Enhanced geographic coverage
trade_routes: 8 rows                   # Routing logic (stable)
```

## API Routes Architecture

### Core Intelligence APIs
```javascript
// Triangle Routing - Uses 597K trade flows
POST /api/intelligence/routing  
{
  "origin": "CN",
  "destination": "US",
  "products": [...],
  "businessProfile": {...}
}

// HS Code Intelligence - Product classification
POST /api/intelligence/hs-codes
{
  "productDescription": "Ball bearings", 
  "businessType": "Manufacturing"
}

// Tariff Analysis - Volatility tracking
GET /api/intelligence/tariffs?origin=CN&destination=US

// Shipping Optimization
POST /api/intelligence/shipping
```

### System APIs
```javascript
GET /api/status                        // Production health monitoring
GET /api/database-structure-test       // Architecture validation
GET /api-test                          // Interactive testing dashboard
```

### Advanced APIs
```javascript
POST /api/blaze/triangle-routing      // High-performance routing engine
POST /api/goldmine/page-submit       // Advanced analytics
POST /api/specialist-leads            // Professional services integration
POST /api/marcus/hindsight-report     // AI-powered analysis reports
POST /api/clean-routing               // Cleaned routing data
POST /api/clean-products              // Product classification cleanup
POST /api/clean-stats                 // Statistics cleanup
POST /api/live-market-intelligence    // Real-time market monitoring
POST /api/canada-mexico-advantage     // USMCA advantage calculator
POST /api/intelligent-classification  // AI-powered product classification
POST /api/product-suggestions         // Smart product suggestions
POST /api/personalized-monitoring     // Custom alert monitoring
```

### Partnership & Professional Services APIs
```javascript
POST /api/alerts-specialist-connection // Connect to trade specialists
POST /api/partnership-ecosystem        // Partner network management
POST /api/contact-request             // Professional consultation requests
POST /api/retention-tracking          // User engagement analytics
```

### Development & Testing APIs
```javascript
GET /api/status                       // Production health monitoring
GET /api/database-structure-test      // Validate database architecture
GET /api/production-data-quality-check // Data quality verification
GET /api/dropdown-options            // Dynamic form options
GET /api/phase2-optimization-test     // Phase 2 optimization testing
GET /api/phase3-prefetch-test         // Phase 3 prefetching testing
GET /api/test-volatile-stable-separation // Test data separation logic
GET /api/redis-rate-limit-test        // Redis rate limiting testing
POST /api/detect-location             // Geographic intelligence testing
```

### Chat & Intelligence APIs
```javascript
POST /api/trade-intelligence-chat     // Marcus AI conversation system
GET /api/marcus-intelligence-dashboard // Marcus AI dashboard data
POST /api/dashboard-hub-intelligence  // Bloomberg Terminal-style dashboard intelligence
```

### Beast Master & Goldmine Intelligence APIs
```javascript
// Core Intelligence Generation
BeastMasterController.activateAllBeasts(userProfile, currentPage, options)
// Orchestrates all 6 intelligence systems for compound insights

UnifiedGoldmineIntelligence.getFoundationIntelligence(userProfile)
// Database-powered intelligence from 519,341+ records

// Real-time Dashboard Intelligence  
POST /api/dashboard-hub-intelligence
{
  "dashboardView": "executive|intelligence|financial|implementation|partnership",
  "mockUserProfile": {
    "businessType": "Electronics",
    "primarySupplierCountry": "China", 
    "importVolume": "$1M - $5M"
  }
}

// RSS & Background Monitoring
GET /api/cron/rss-monitor              // RSS feed monitoring endpoint
POST /api/rss-trigger-test             // Manual RSS monitoring test
GET /api/redis-rate-limiting-demo      // Redis rate limiting demo

// Returns compound intelligence with:
// - Beast Master status (all 6 systems)
// - Real-time compound insights
// - RSS monitoring status
// - Intelligence source metrics
// - Performance characteristics
```

## Beast Master Intelligence System - FULLY OPERATIONAL ✅

The platform implements **6 interconnected intelligence systems** that generate **compound insights** impossible with individual systems:

### Core Intelligence Architecture
```javascript
🦾 Beast Master Controller (Orchestrates all systems)
├── 🧠 Similarity Intelligence - 240+ workflow sessions for pattern matching
├── 📅 Seasonal Intelligence - Q4_HEAVY, SUMMER_PREPARATION timing optimization  
├── 📊 Market Intelligence - Real-time volatility (China: 85%, Mexico: 25%)
├── 🏆 Success Pattern Intelligence - 33+ hindsight patterns from database
├── 🚨 Alert Generation Intelligence - Multi-system alert prioritization
└── 🚢 Shipping Intelligence - Capacity constraints, carrier performance, route complexity
```

### Compound Intelligence Generation
The Beast Master generates insights **only possible by combining multiple systems**:

**Perfect Storm Detection**: Similarity + Seasonal + Market = 95% confidence insights  
**Network Effects Intelligence**: Growing database improves all future analysis  
**Institutional Learning**: 240+ sessions create institutional memory  
**Timing Optimization**: Seasonal + Market alignment for maximum impact

### Goldmine Intelligence Integration
Beast Master integrates with **Goldmine Intelligence** for database-powered insights:

```javascript
🏆 Goldmine Intelligence Database (500K+ Records)
├── 📊 Comtrade Reference: 17,500+ HS classifications
├── 🌐 Trade Flows: 500,800+ bilateral trade records
├── 👥 Workflow Sessions: 240+ user journey patterns
├── 🤖 Marcus Consultations: 20+ AI analysis records
├── 📈 Hindsight Patterns: 33+ proven success strategies
├── 🌍 Translations: 700+ trilingual entries (EN/ES/FR)
└── 📡 RSS Events: Real-time market monitoring
```

### Dashboard Hub Integration
Beast Master powers the **Bloomberg Terminal-style Executive Dashboard** with:
- Real-time compound insights updating every 30 seconds
- Multi-view intelligence (Executive, Financial, Implementation, Partnership)
- Performance monitoring with intelligence quality metrics
- Live alert generation with intelligent prioritization

## Environment Configuration

Required in `.env.local`:
```bash
# Supabase (Database Intelligence)
NEXT_PUBLIC_SUPABASE_URL=https://mrwitpgbcaxgnirqtavt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... # For server-side database queries

# External APIs (Volatile Data Only)
COMTRADE_API_KEY=4cc45d91763040439c2740a846bd7c53      # UN trade data
SHIPPO_API_KEY=shippo_test_c09be9af54350a63230d86cb    # Shipping rates
ANTHROPIC_API_KEY=sk-ant-api03-kOw...                  # Marcus AI reports

# RSS & Background Services
CRON_SECRET=generate-new-32-byte-hex-secret            # RSS cron authentication

# API Strategy Control
USE_MOCK_APIS=false                                     # Enable real API calls
NEXT_PUBLIC_USE_PREFETCHING=true                       # Phase 3 prefetching
NEXT_PUBLIC_USE_OPTIMIZED_QUERIES=true                 # Phase 2 optimization
```

## Critical Development Patterns

### Always Use Beast Master & Goldmine Intelligence Systems
```javascript
// CORRECT - Uses Beast Master Controller for compound intelligence
import { BeastMasterController } from '../lib/intelligence/beast-master-controller'
import UnifiedGoldmineIntelligence from '../lib/intelligence/goldmine-intelligence'

// Generate compound insights from all 6 intelligence systems
const beastResults = await BeastMasterController.activateAllBeasts(
  userProfile, 
  currentPage,
  { source: 'dashboard_hub', realTime: true }
);

// Get database intelligence from 500K+ records
const goldmineData = await UnifiedGoldmineIntelligence.getFoundationIntelligence(userProfile);

// Access compound insights (only possible with multiple systems)
const compoundInsights = beastResults.unified?.insights?.compound || [];
const networkEffects = goldmineData.volatile?.networkEffectsEnabled;

// WRONG - Using individual systems without Beast Master orchestration
const similarityData = await SimilarityIntelligence.getSimilarCompanies(profile)
// This misses compound insights that require multiple systems
```

### Database Intelligence Bridge Integration
```javascript
// Beast Master integrates with Database Intelligence Bridge for optimal performance
import DatabaseIntelligenceBridge, { StableDataManager, VolatileDataManager } from '../lib/intelligence/database-intelligence-bridge'

// Get stable data (instant responses, zero API costs)
const usmcaRate = await StableDataManager.getUSMCARates('CN-MX-US')
const ports = await StableDataManager.getPortInfo('west_coast')
const patterns = await StableDataManager.getSuccessPatterns(businessType)

// Get volatile data (API calls only when cache expires)
const currentRate = await VolatileDataManager.getOrFetchAPIData('comtrade', params)

// WRONG - Direct API calls waste money on static data
const response = await fetch('api.example.com/static-data')
```

### Supabase Client Pattern (Singleton)
```javascript
// Always use the shared singleton instance
import { getSupabaseClient } from '../lib/supabase-client'
const supabase = getSupabaseClient()

// Never create multiple instances - causes conflicts
// WRONG: const supabase = createClient(url, key)
```

### Production Logging Pattern 
```javascript
import { logInfo, logError, logDBQuery, logAPICall, logPerformance } from '../lib/production-logger'

// Comprehensive logging with automatic sensitive data filtering
logDBQuery('trade_flows', 'SELECT', duration, data?.length)
logAPICall('GET', 'comtrade', apiDuration, 'success')
logPerformance('getTriangleRoutingIntelligence', totalDuration, metadata)

// Automatically filters API keys, JWT tokens, passwords, secrets
```

### Page Data Flow Pattern
```javascript
// Page-to-page data persistence via localStorage with error handling
try {
  const foundationData = JSON.parse(localStorage.getItem('triangle-foundation') || '{}')
  const productData = JSON.parse(localStorage.getItem('triangle-product') || '{}')
  
  // Always validate data structure before use
  if (!foundationData.companyName) {
    router.push('/foundation') // Redirect to missing page
    return
  }
} catch (error) {
  logError('Failed to parse page data', { error })
  localStorage.clear() // Clear corrupted data
}
```

### Triangle Routing Intelligence Pattern
```javascript
// Use the unified bridge for complete triangle routing analysis
const intelligence = await DatabaseIntelligenceBridge.getTriangleRoutingIntelligence({
  origin: foundationData.primarySupplierCountry || 'CN',
  destination: 'US',
  hsCode: selectedProduct.hsCode,
  businessType: foundationData.businessType
})

// Process results with efficiency tracking
const routes = intelligence.triangleOptions.map(route => ({
  route: route.route,
  usmcaTariff: route.usmcaTariff, // Always 0%
  savings: calculateSavings(foundationData.importVolume, route),
  confidence: intelligence.analysis.confidence
}))

// Always log efficiency metrics
logPerformance('triangle_routing', Date.now() - startTime, {
  apiCallsMade: intelligence.efficiency.apiCallsMade,
  dataSource: intelligence.efficiency.allFromDatabase ? 'DATABASE' : 'HYBRID'
})
```

### Internationalization Pattern (Database-Powered)
```javascript
// Database-powered translations with fallback to static JSON
import { getTranslation } from '../lib/i18n-database-backend'

// Load translations from Supabase with caching
const translations = await getTranslation('en', 'common')

// Use i18next with database backend
import { useTranslation } from 'react-i18next'
const { t, i18n } = useTranslation('common')

// Database translation structure
const translation = {
  key: 'foundation.title',
  language: 'en',
  value: 'Company Foundation Intelligence',
  context: 'Foundation'
}

// Language switching with database sync
const changeLanguage = async (lng) => {
  await i18n.changeLanguage(lng)
  // Database backend automatically loads new translations
}
```

## Performance & Cost Optimization

- **Database Queries**: Optimized indexes for 500K+ trade flow records
- **API Call Reduction**: 80%+ savings through volatile/stable separation
- **Smart Caching**: TTL-based caching with Redis and intelligent expiry
- **RSS Monitoring**: Real-time market data via automated RSS feeds
- **Network Effects**: Each of 205+ user sessions improves future intelligence
- **Bundle Optimization**: Production builds with compression and splitting
- **Rate Limiting**: Redis-powered enterprise-grade throttling

### Optimization Phases (Feature Flags in .env.local)
- **Phase 0**: `NEXT_PUBLIC_USE_CORRECTED_DATA_FLOW=true` - Data flow correction (active)
- **Phase 1**: `NEXT_PUBLIC_USE_UNIFIED_STATE=true` - Unified state management (active)
- **Phase 2**: `NEXT_PUBLIC_USE_OPTIMIZED_QUERIES=true` - Query optimization & batching (active)
- **Phase 3**: `NEXT_PUBLIC_USE_PREFETCHING=true` - Intelligent prefetching (active)

Expected improvements with all phases active:
- Query Response Time: 85% faster (2.5s → 0.3s)
- Page Load Time: 68% faster (3.8s → 1.2s)
- API Call Reduction: 80% fewer calls (15 → 3 per journey)

## Testing Strategy

### Test Coverage Requirements
- **Statements**: 70% minimum
- **Branches**: 70% minimum  
- **Functions**: 70% minimum
- **Lines**: 70% minimum

### Test Commands
```bash
npm test              # Run all tests  
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report with thresholds
npm run test:ci       # CI/CD optimized run (no watch, coverage)
```

### Jest Configuration Highlights
```javascript
// Coverage thresholds (jest.config.js)
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 80,
    statements: 80
  }
}

// Module mapping for absolute imports
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
  '^lib/(.*)$': '<rootDir>/lib/$1',
  '^components/(.*)$': '<rootDir>/components/$1'
}
```

### Test Patterns
```javascript
// API endpoint testing with proper error handling
describe('POST /api/intelligence/routing', () => {
  it('should return triangle routes with savings', async () => {
    const response = await request(app)
      .post('/api/intelligence/routing')
      .send({ origin: 'CN', destination: 'US' })
    
    expect(response.status).toBe(200)
    expect(response.body.routes).toHaveLength(3)
    expect(response.body.efficiency.apiCallsMade).toBeLessThan(5)
    expect(response.body.triangleOptions).toBeDefined()
  })
  
  it('should handle missing page data gracefully', async () => {
    const response = await request(app)
      .post('/api/intelligence/routing')
      .send({}) // Empty payload
      
    expect(response.status).toBe(400)
    expect(response.body.error).toContain('Missing required')
  })
})

// Database Intelligence Bridge testing
describe('DatabaseIntelligenceBridge', () => {
  it('should use stable data for USMCA rates', async () => {
    const result = await StableDataManager.getUSMCARates('MX-US')
    expect(result.rate).toBe(0)
    expect(result.apiCallNeeded).toBe(false)
    expect(result.status).toBe('TREATY_LOCKED')
  })
})
```

## Production Security

- **API Key Validation**: All external API calls validated through `lib/security.js`
- **Security Headers**: Comprehensive headers in next.config.js (CSP, HSTS, X-Frame-Options)
- **Client Protection**: Sensitive data never exposed client-side - use `SUPABASE_SERVICE_ROLE_KEY` only server-side
- **Request Monitoring**: IP-based tracking and rate limiting via `lib/monitoring.js`
- **Environment Validation**: Startup checks in `lib/environment-validation.js` ensure all required keys exist

## Competitive Advantages

1. **Volatility Protection**: USMCA rates stay 0% while bilateral tariffs fluctuate wildly
2. **Cost Optimization**: 80%+ API savings through intelligent volatile/stable separation  
3. **Institutional Learning**: 597K trade flows + 240+ sessions create unbeatable intelligence
4. **Real-Time Alerts**: Immediate notification when tariffs change (India: 25% → 50% overnight)
5. **Network Effects**: Each user improves intelligence for all future users

**Market Position**: While competitors waste money calling APIs for static data, Triangle Intelligence provides superior intelligence at lower cost through database-driven architecture.

## Key Intelligence Engines

### Core Libraries (`/lib/`)
- **`supabase-client.js`**: Singleton Supabase client - always use `getSupabaseClient()`
- **`production-logger.js`**: Comprehensive logging with automatic sensitive data filtering
- **`environment-validation.js`**: Validates all required env vars on startup
- **`security.js`**: API key validation and security middleware

### Intelligence Systems (`/lib/intelligence/`) ✅ FULLY OPERATIONAL
- **`beast-master-controller.js`**: **RESTORED** - Orchestrates all 6 intelligence systems for compound insights
- **`goldmine-intelligence.js`**: **RESTORED** - Database intelligence from 519,341+ records with network effects
- **`database-intelligence-bridge.js`**: Volatile/stable data optimization for 80% API cost reduction
- **`dynamic-savings-engine.js`**: Calculates real-time savings based on market conditions
- **`dynamic-confidence-engine.js`**: Progressive confidence scoring (1.0 → 10.0)
- **`seasonal-intelligence.js`**: **RESTORED** - Q4_HEAVY, SUMMER_PREPARATION timing optimization
- **`similarity-intelligence.js`**: **RESTORED** - Finds similar business profiles from 205+ sessions
- **`unified-hs-classifier.js`**: Intelligent product classification with caching
- **`tariff-volatility-tracker.js`**: Monitors and alerts on tariff changes

### Beast Master Compound Intelligence Features
- **Perfect Storm Detection**: Similarity + Seasonal + Market = 95% confidence insights
- **Network Effects Intelligence**: Each user session improves all future analysis
- **Institutional Learning Integration**: 33+ success patterns + 70+ Marcus consultations
- **Real-time Dashboard Integration**: Powers Bloomberg Terminal-style executive hub

### RSS & Background Services (`/lib/background-services/`)
- **`rss-comtrade-trigger.js`**: Automated RSS feed monitoring and processing
- **`redis-client.js`**: Redis connection management and caching
- **`redis-rate-limiter.js`**: Enterprise-grade request throttling

### Performance Optimizers (`/lib/`)
- **`fast-hs-classifier.js`**: High-performance HS code classification
- **`dynamic-stats-engine.js`**: Real-time statistics and analytics
- **`workflow-analysis.js`**: Analyzes user journey patterns
- **`page-analytics-engine.js`**: Tracks page-level performance metrics
- **`progressive-geo-detection.js`**: Geographic intelligence and language detection

### State Management (`/lib/state/`)
- **`TriangleStateContext.js`**: Unified state management context
- **`pageStateHooks.js`**: Page-specific state hooks
- **`statePersistence.js`**: localStorage persistence with validation
- **`intelligenceIntegration.js`**: Intelligence system integration

## RSS Market Monitoring System

### Real-time Market Intelligence
The platform implements automated RSS monitoring for real-time market intelligence:

```javascript
// RSS monitoring configuration (vercel.json)
{
  "crons": [
    {
      "path": "/api/cron/rss-monitor",
      "schedule": "*/15 * * * *"  // Every 15 minutes
    }
  ]
}
```

### Background Services Architecture
```javascript
// RSS trigger service
import RSSComtradeMonitor from '../lib/background-services/rss-comtrade-trigger'

// Automated market data collection
const rssResults = await RSSComtradeMonitor.processFeeds()
const alerts = await RSSComtradeMonitor.generateAlerts(rssResults)

// Redis-powered caching and rate limiting
import { redisClient } from '../lib/redis-client'
import { withRateLimit } from '../lib/middleware/redis-rate-limiter'
```

### RSS Monitoring Endpoints
```javascript
GET /api/cron/rss-monitor        // Automated RSS feed processing (Vercel cron)
POST /api/rss-trigger-test       // Manual RSS monitoring test
GET /api/redis-rate-limiting-demo // Rate limiting demonstration
```

## Multilingual Support (USMCA Markets)

### Trilingual Architecture
The platform supports English, Spanish, and French for comprehensive USMCA market coverage:

```javascript
// Database-powered translations
const translations = await supabase
  .from('translations')
  .select('*')
  .eq('language', currentLanguage)

// Geographic language detection
import { useProgressiveLanguage } from '../hooks/useProgressiveLanguage'
const { detectedLanguage, confidence } = useProgressiveLanguage()

// Safe translation pattern
import { useSafeTranslation } from '../hooks/useSafeTranslation'
const { t } = useSafeTranslation('common')
```

### Translation Management
- **700+ Translation Keys**: Comprehensive coverage across all pages
- **Database Storage**: Translations stored in Supabase for easy management
- **Fallback Support**: Graceful degradation to English if translations missing
- **Context-Aware**: Translations include business context for accuracy

## State Management & Optimization

### Unified State Architecture
```javascript
// Triangle State Context - Unified state management
import { TriangleStateProvider, useTriangleState } from '../lib/state'

// Page-specific state hooks
import { useFoundationState, useProductState } from '../lib/state/pageStateHooks'

// Persistent state with validation
import { setTriangleData, getTriangleData } from '../lib/utils/localStorage-validator'
```

### Optimization Phases
The platform implements progressive optimization phases controlled by feature flags:

```bash
# Phase 2: Query Optimization & Batching
NEXT_PUBLIC_USE_OPTIMIZED_QUERIES=true

# Phase 3: Intelligent Prefetching  
NEXT_PUBLIC_USE_PREFETCHING=true
```

**Performance Improvements**:
- Query Response Time: 85% faster (2.5s → 0.3s)
- Page Load Time: 68% faster (3.8s → 1.2s)
- API Call Reduction: 80% fewer calls

## Production Deployment Architecture

### Vercel Configuration
```javascript
// vercel.json - Production configuration
{
  "crons": [
    {
      "path": "/api/cron/rss-monitor",
      "schedule": "*/15 * * * *"
    }
  ],
  "env": {
    "CRON_SECRET": "@cron_secret"
  }
}
```

### Security Headers (next.config.js)
- **CSP**: Content Security Policy with restricted sources
- **HSTS**: HTTP Strict Transport Security
- **X-Frame-Options**: Clickjacking protection
- **Rate Limiting**: Redis-powered request throttling

### Production Monitoring
```javascript
// Health check endpoints
GET /api/status                    // System health and configuration
GET /api/database-structure-test   // Database connectivity and schema
GET /api/production-data-quality-check // Data quality verification
```

## Common Pitfalls to Avoid

1. **Never create new Supabase clients** - Always use `getSupabaseClient()` singleton
2. **Never expose service keys client-side** - Use `SUPABASE_SERVICE_ROLE_KEY` only in API routes
3. **Never make direct API calls for stable data** - Use Database Intelligence Bridge
4. **Never skip logging** - Use production-logger for all database queries and API calls
5. **Never store sensitive data in localStorage** - Only non-sensitive page flow data
6. **Never bypass RSS monitoring** - Use automated feeds for real-time market intelligence
7. **Never ignore rate limiting** - Use Redis rate limiter for production API calls
8. **Never hardcode translations** - Use database-powered i18n system
9. **Never skip optimization phases** - Enable feature flags for maximum performance

## Development vs Production Differences

### Development Environment
- Hot reload with Next.js dev server
- Mock APIs available via `USE_MOCK_APIS=true`
- Detailed logging and error reporting
- Redis optional (fallback to memory caching)

### Production Environment  
- Vercel deployment with cron jobs
- Real API integrations required
- RSS monitoring every 15 minutes
- Redis required for rate limiting and caching
- Security headers enforced
- Bundle optimization and compression