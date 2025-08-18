# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Triangle Intelligence is a sophisticated tariff volatility tracking and trade optimization platform that delivers $100K-$300K+ annual savings through USMCA triangle routing strategies. The platform's core innovation is intelligent separation of volatile vs stable data to maximize intelligence while minimizing API costs.

**Core Value Proposition**: While bilateral tariffs (China: 30%, India: 50%) change daily with political decisions, USMCA triangle routing rates remain stable at 0% - providing predictable savings in volatile markets.

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

**Critical Architecture**: All intelligence flows through `lib/database-intelligence-bridge.js` which implements the volatile/stable strategy:

```javascript
// STABLE DATA - Instant responses, zero API costs
const usmcaRate = await StableDataManager.getUSMCARates('CN-MX-US')  // Always 0%
const ports = await StableDataManager.getPortInfo('west_coast')      // Static data

// VOLATILE DATA - API calls only when cache expires  
const currentRate = await VolatileDataManager.getOrFetchAPIData('comtrade', params)
const shipping = await VolatileDataManager.getOrFetchAPIData('shippo', params)
```

**Result**: 80%+ API call reduction while maintaining real-time market intelligence.

## 6-Page Intelligence Journey

1. **Foundation** (`/foundation`) - Business intake with geographic intelligence derivation
2. **Product** (`/product`) - Product intelligence with HS code mapping via server-side APIs  
3. **Routing** (`/routing`) - Triangle routing using Database Intelligence Bridge
4. **Partnership** (`/partnership`) - Strategic partner ecosystem and connections
5. **Hindsight** (`/hindsight`) - Hindsight pattern extraction to institutional memory
6. **Alerts** (`/alerts`) - Predictive alerts based on volatility tracking

**Navigation Flow**: Streamlined 6-page journey for optimal user experience and completion rates.

## Database Schema (Supabase)

### Institutional Intelligence (597K+ Trade Flows)
```sql
comtrade_reference: 15,079 rows         # Core trade intelligence dataset
trade_flows: 597,000+ rows              # Massive bilateral trade analysis
workflow_sessions: 240+ rows            # User journey patterns for learning
hindsight_pattern_library: 33+ rows     # Extracted success patterns
marcus_consultations: 70+ rows          # AI analysis history
```

### Volatile Market Data
```sql
current_market_alerts: Real-time        # Live tariff changes
api_cache: TTL-based                    # Cached API responses with expiry
country_risk_scores: Dynamic            # Risk volatility tracking
network_intelligence_events: Logging    # Market change events
```

### Stable Treaty Data  
```sql
usmca_tariff_rates: 48 rows            # 0% rates, treaty-locked forever
us_ports: 10 rows                      # Port infrastructure (static)
countries: 23 rows                     # Geographic data (stable)
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
GET /api/database-intelligence-test   // Test intelligence bridge
GET /api/database-explorer            // Interactive database browser
GET /api/test-apis                   // API integration testing
GET /api/test-page-flow             // Page progression testing
GET /api/test-routes                 // Route testing
GET /api/test-claude                 // AI integration testing
GET /api/debug-routing                // Routing debugging tools
GET /api/dropdown-options            // Dynamic form options
GET /api/real-hindsight-intelligence // Hindsight analysis testing
```

### Chat & Intelligence APIs
```javascript
POST /api/trade-intelligence-chat     // Marcus AI conversation system
GET /api/marcus-intelligence-dashboard // Marcus AI dashboard data
```

## Beast Master Intelligence System

The platform implements six interconnected intelligence systems:

1. **Trade Flow Intelligence** - 597K bilateral trade records
2. **Pattern Intelligence** - Success patterns from 240+ sessions  
3. **Similarity Intelligence** - Learn from similar business profiles
4. **Seasonal Intelligence** - Q4_HEAVY, SUMMER_PEAK timing
5. **Marcus AI Intelligence** - Anthropic Claude for analysis
6. **Network Intelligence** - Each user improves future intelligence

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

# API Strategy Control
USE_MOCK_APIS=false                                     # Enable real API calls
```

## Critical Development Patterns

### Always Use Database Intelligence Bridge
```javascript
// CORRECT - Uses volatile/stable optimization with proper imports
import DatabaseIntelligenceBridge, { StableDataManager, VolatileDataManager } from '../lib/database-intelligence-bridge'

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

- **Database Queries**: Optimized indexes for 597K+ trade flow records
- **API Call Reduction**: 80%+ savings through volatile/stable separation
- **Smart Caching**: TTL-based caching with 1-4 hour expiry for volatile data
- **Network Effects**: Each of 240+ user sessions improves future intelligence
- **Bundle Optimization**: Production builds with compression and splitting

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

- **API Key Validation**: All external API calls validated
- **Security Headers**: Comprehensive headers in next.config.js
- **Client Protection**: Sensitive data never exposed client-side
- **Request Monitoring**: IP-based tracking and rate limiting
- **Environment Validation**: Startup checks for required configuration

## Competitive Advantages

1. **Volatility Protection**: USMCA rates stay 0% while bilateral tariffs fluctuate wildly
2. **Cost Optimization**: 80%+ API savings through intelligent volatile/stable separation  
3. **Institutional Learning**: 597K trade flows + 240+ sessions create unbeatable intelligence
4. **Real-Time Alerts**: Immediate notification when tariffs change (India: 25% → 50% overnight)
5. **Network Effects**: Each user improves intelligence for all future users

**Market Position**: While competitors waste money calling APIs for static data, Triangle Intelligence provides superior intelligence at lower cost through database-driven architecture.
- claud.md