# CLAUDE.md

Principles for Dynamic Calculations

Always Pull from Data Layer

No hardcoded tariff rates, shipping costs, confidence scores, etc.

Use StableDataManager or VolatileDataManager exclusively.

Example: await StableDataManager.getUSMCARates(route) instead of 0%.

Dynamic Savings Engine

Use real-time formulas that recompute savings each call:

const savings = DynamicSavingsEngine.calculate({
  importVolume,
  bilateralTariffRate: currentRate.value,
  usmcaRate: usmcaRate.value,
  shippingCost: shipping.cost,
})


No embedded math like importVolume * 0.3.

Dynamic Confidence Engine

Progressive scoring should be driven by live inputs:

const confidence = DynamicConfidenceEngine.score({
  volatility: currentRate.volatility,
  seasonality: seasonalFactors.score,
  similarity: similarityData.matchScore,
  networkEffects: goldmineData.networkStrength,
})


No static 95% thresholds.

Volatile vs Stable Separation

Tariffs, shipping, risk → volatile fetch.

USMCA, ports, HS codes → stable fetch.

Never mix them manually; always through the DatabaseIntelligenceBridge.

Always Log & Track Source

Attach metadata to every calculation:

logPerformance('triangle_routing', duration, {
  apiCallsMade: efficiency.apiCallsMade,
  dataSource: efficiency.allFromDatabase ? 'DATABASE' : 'HYBRID',
  confidence,
  savings,
})

🔄 Example of a Fully Dynamic Triangle Routing Calculation
const intelligence = await DatabaseIntelligenceBridge.getTriangleRoutingIntelligence({
  origin: foundationData.primarySupplierCountry,
  destination: 'US',
  hsCode: selectedProduct.hsCode,
  businessType: foundationData.businessType
})

// Each route is fully dynamic
const routes = intelligence.triangleOptions.map(route => ({
  route: route.route,
  usmcaTariff: route.usmcaTariff,     // pulled from StableDataManager
  bilateralTariff: route.bilateralTariff, // pulled from VolatileDataManager
  shippingCost: route.shippingCost,  // dynamic from shippo API
  savings: DynamicSavingsEngine.calculate({
    importVolume: foundationData.importVolume,
    bilateralTariffRate: route.bilateralTariff,
    usmcaRate: route.usmcaTariff,
    shippingCost: route.shippingCost,
  }),
  confidence: DynamicConfidenceEngine.score({
    volatility: intelligence.analysis.volatility,
    similarity: intelligence.analysis.similarity,
    seasonality: intelligence.analysis.seasonality,
    networkEffects: intelligence.analysis.networkEffects,
  })
}))


👉 This way, nothing is static — tariffs, confidence, risk, savings, alerts all flow from your data managers + engines.



This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Triangle Intelligence is a sophisticated tariff volatility tracking and trade optimization platform that delivers \$100K-\$300K+ annual savings through USMCA triangle routing strategies. The platform's core innovation is intelligent separation of volatile vs stable data to maximize intelligence while minimizing API costs.

**🚀 STATUS: FULLY OPERATIONAL** - Beast Master Controller, Goldmine Intelligence, RSS monitoring, Redis rate limiting, and optimization systems are active with compound intelligence generation from 500K+ database records.

**Core Value Proposition**: While bilateral tariffs (China, India, etc.) change daily with political decisions, USMCA triangle routing rates remain stable at 0% - providing predictable savings in volatile markets through real-time intelligence.

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

* **Tariff rates**: Dynamic daily updates
* **Shipping costs**: Port congestion, fuel surcharges, carrier capacity
* **Country risk scores**: Political stability, supply chain disruptions

**Tables**: `current_market_alerts`, `api_cache`, `country_risk_scores`
**Cache Duration**: 1-4 hours depending on volatility
**Cost**: API calls required when data expires

### Stable Data (Cache Forever - Zero API Costs)

* **USMCA rates**: Treaty-locked at 0%
* **Port locations**: Infrastructure doesn’t move
* **Trade routes**: Geographic routing logic
* **HS code classifications**: Annual updates maximum

**Tables**: `usmca_tariff_rates`, `us_ports`, `comtrade_reference`, `hindsight_pattern_library`
**Cache Duration**: FOREVER
**Cost**: Zero API calls - query database directly

### Database Intelligence Bridge

**Critical Architecture**: All intelligence flows through `lib/intelligence/database-intelligence-bridge.js` which implements the volatile/stable strategy:

```javascript
// STABLE DATA - Always fetched dynamically, zero API costs
const usmcaRate = await StableDataManager.getUSMCARates('CN-MX-US')
const ports = await StableDataManager.getPortInfo('west_coast')

// VOLATILE DATA - API calls only when cache expires  
const currentRate = await VolatileDataManager.getOrFetchAPIData('comtrade', params)
const shipping = await VolatileDataManager.getOrFetchAPIData('shippo', params)
```

**Result**: 80%+ API call reduction while maintaining real-time market intelligence.

## Dynamic Intelligence Calculations

To ensure **all intelligence is dynamic**, the platform uses specialized engines:

### Dynamic Savings Engine

```javascript
const savings = DynamicSavingsEngine.calculate({
  importVolume,
  bilateralTariffRate: currentRate.value,
  usmcaRate: usmcaRate.value,
  shippingCost: shipping.cost,
})
```

### Dynamic Confidence Engine

```javascript
const confidence = DynamicConfidenceEngine.score({
  volatility: currentRate.volatility,
  seasonality: seasonalFactors.score,
  similarity: similarityData.matchScore,
  networkEffects: goldmineData.networkStrength,
})
```

### Triangle Routing Intelligence Pattern

```javascript
const intelligence = await DatabaseIntelligenceBridge.getTriangleRoutingIntelligence({
  origin: foundationData.primarySupplierCountry,
  destination: 'US',
  hsCode: selectedProduct.hsCode,
  businessType: foundationData.businessType
})

const routes = intelligence.triangleOptions.map(route => ({
  route: route.route,
  usmcaTariff: route.usmcaTariff,
  bilateralTariff: route.bilateralTariff,
  shippingCost: route.shippingCost,
  savings: DynamicSavingsEngine.calculate({
    importVolume: foundationData.importVolume,
    bilateralTariffRate: route.bilateralTariff,
    usmcaRate: route.usmcaTariff,
    shippingCost: route.shippingCost,
  }),
  confidence: DynamicConfidenceEngine.score({
    volatility: intelligence.analysis.volatility,
    similarity: intelligence.analysis.similarity,
    seasonality: intelligence.analysis.seasonality,
    networkEffects: intelligence.analysis.networkEffects,
  })
}))

logPerformance('triangle_routing', Date.now() - startTime, {
  apiCallsMade: intelligence.efficiency.apiCallsMade,
  dataSource: intelligence.efficiency.allFromDatabase ? 'DATABASE' : 'HYBRID',
  routes: routes.length
})
```

## Stage Completion Gates (Dynamic)

Each stage (1–9) is unlocked only when **dynamic performance thresholds** are met. Gates are enforced by live recalculation of savings and confidence scores.

```javascript
async function checkStageCompletion(stage, context) {
  const savings = await DynamicSavingsEngine.calculate(context)
  const confidence = await DynamicConfidenceEngine.score(context)

  const requirements = {
    1: { minConfidence: 0.70, minSavings: 0 },
    2: { minConfidence: 0.75, minSavings: 5000 },
    3: { minConfidence: 0.80, minSavings: 10000 },
    4: { minConfidence: 0.85, minSavings: 25000 },
    5: { minConfidence: 0.88, minSavings: 50000 },
    6: { minConfidence: 0.90, minSavings: 100000 },
    7: { minConfidence: 0.92, minSavings: 150000 },
    8: { minConfidence: 0.94, minSavings: 200000 },
    9: { minConfidence: 0.95, minSavings: 250000 },
  }

  const req = requirements[stage]
  return confidence >= req.minConfidence && savings >= req.minSavings
}
```

* **Confidence & Savings are never static** — recalculated for each decision.
* **Stage progression is sequential** — cannot skip ahead.
* **High-stakes stages (8 & 9)** require both very high confidence and validated savings thresholds.

## Performance & Cost Optimization

* **All rates, costs, scores, and routes are dynamic**
* **Database Queries**: Optimized indexes for 500K+ trade flow records
* **API Call Reduction**: 80%+ savings through volatile/stable separation
* **Smart Caching**: TTL-based caching with Redis and intelligent expiry
* **RSS Monitoring**: Real-time market data via automated RSS feeds
* **Network Effects**: Each of 205+ user sessions improves future intelligence

## Competitive Advantages

1. **Volatility Protection**: USMCA rates stay 0% (dynamic confirmation via StableDataManager)
2. **Cost Optimization**: 80%+ API savings through volatile/stable separation
3. **Institutional Learning**: 597K trade flows + 240+ sessions create unbeatable intelligence
4. **Real-Time Alerts**: Immediate notification when tariffs or shipping costs change
5. **Network Effects**: Each user improves intelligence for all future users

---

✅ Now, both **calculations** and **stage progression** are fully dynamic, with real-time thresholds ensuring sequential unlocking and reliability for stages 1–9 (with special emphasis on stages 8 & 9).

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Triangle Intelligence is a sophisticated tariff volatility tracking and trade optimization platform that delivers \$100K-\$300K+ annual savings through USMCA triangle routing strategies. The platform's core innovation is intelligent separation of volatile vs stable data to maximize intelligence while minimizing API costs.

**🚀 STATUS: FULLY OPERATIONAL** - Beast Master Controller, Goldmine Intelligence, RSS monitoring, Redis rate limiting, and optimization systems are active with compound intelligence generation from 500K+ database records.

**Core Value Proposition**: While bilateral tariffs (China, India, etc.) change daily with political decisions, USMCA triangle routing rates remain stable at 0% - providing predictable savings in volatile markets through real-time intelligence.

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

* **Tariff rates**: Dynamic daily updates
* **Shipping costs**: Port congestion, fuel surcharges, carrier capacity
* **Country risk scores**: Political stability, supply chain disruptions

**Tables**: `current_market_alerts`, `api_cache`, `country_risk_scores`
**Cache Duration**: 1-4 hours depending on volatility
**Cost**: API calls required when data expires

### Stable Data (Cache Forever - Zero API Costs)

* **USMCA rates**: Treaty-locked at 0%
* **Port locations**: Infrastructure doesn’t move
* **Trade routes**: Geographic routing logic
* **HS code classifications**: Annual updates maximum

**Tables**: `usmca_tariff_rates`, `us_ports`, `comtrade_reference`, `hindsight_pattern_library`
**Cache Duration**: FOREVER
**Cost**: Zero API calls - query database directly

### Database Intelligence Bridge

**Critical Architecture**: All intelligence flows through `lib/intelligence/database-intelligence-bridge.js` which implements the volatile/stable strategy. Every calculation is dynamic, no static values are used.

```javascript
// STABLE DATA (Dynamic fetch, zero API costs)
const usmcaRate = await StableDataManager.getUSMCARates('CN-MX-US')
const ports = await StableDataManager.getPortInfo('west_coast')

// VOLATILE DATA (Dynamic fetch with caching)
const currentRate = await VolatileDataManager.getOrFetchAPIData('comtrade', params)
const shipping = await VolatileDataManager.getOrFetchAPIData('shippo', params)
```

**Result**: 80%+ API call reduction while maintaining real-time market intelligence.

## Dynamic Intelligence Calculations

All engines and modules recalculate results in real time.

### Dynamic Savings Engine

```javascript
const savings = DynamicSavingsEngine.calculate({
  importVolume,
  bilateralTariffRate: currentRate.value,
  usmcaRate: usmcaRate.value,
  shippingCost: shipping.cost,
  riskScore: await VolatileDataManager.getOrFetchAPIData('risk', params)
})
```

### Dynamic Confidence Engine

```javascript
const confidence = DynamicConfidenceEngine.score({
  volatility: currentRate.volatility,
  seasonality: seasonalFactors.score,
  similarity: similarityData.matchScore,
  networkEffects: goldmineData.networkStrength,
  policyShocks: await VolatileDataManager.getOrFetchAPIData('policy', params)
})
```

### Triangle Routing Intelligence Pattern

```javascript
const intelligence = await DatabaseIntelligenceBridge.getTriangleRoutingIntelligence({
  origin: foundationData.primarySupplierCountry,
  destination: 'US',
  hsCode: selectedProduct.hsCode,
  businessType: foundationData.businessType,
  liveShipping: await VolatileDataManager.getOrFetchAPIData('shippo', { hsCode: selectedProduct.hsCode })
})

const routes = intelligence.triangleOptions.map(route => ({
  route: route.route,
  usmcaTariff: route.usmcaTariff,
  bilateralTariff: route.bilateralTariff,
  shippingCost: route.shippingCost,
  savings: DynamicSavingsEngine.calculate({
    importVolume: foundationData.importVolume,
    bilateralTariffRate: route.bilateralTariff,
    usmcaRate: route.usmcaTariff,
    shippingCost: route.shippingCost,
  }),
  confidence: DynamicConfidenceEngine.score({
    volatility: intelligence.analysis.volatility,
    similarity: intelligence.analysis.similarity,
    seasonality: intelligence.analysis.seasonality,
    networkEffects: intelligence.analysis.networkEffects,
  })
}))

logPerformance('triangle_routing', Date.now() - startTime, {
  apiCallsMade: intelligence.efficiency.apiCallsMade,
  dataSource: intelligence.efficiency.allFromDatabase ? 'DATABASE' : 'HYBRID',
  routes: routes.length,
  avgSavings: routes.reduce((sum, r) => sum + r.savings, 0) / routes.length
})
```

## Stage Completion Gates (Dynamic)

Each stage (1–9) is unlocked only when **dynamic thresholds** are met. No static thresholds are hardcoded; instead, values are recalculated from live intelligence.

```javascript
async function checkStageCompletion(stage, context) {
  const savings = await DynamicSavingsEngine.calculate(context)
  const confidence = await DynamicConfidenceEngine.score(context)
  const volatility = context.volatility || 0
  const trend = await VolatileDataManager.getOrFetchAPIData('market_trends', context)

  const dynamicThresholds = ThresholdManager.getDynamicThresholds(stage, { savings, confidence, volatility, trend })

  return confidence >= dynamicThresholds.minConfidence && savings >= dynamicThresholds.minSavings
}
```

* **Thresholds adapt** to live conditions (e.g., higher volatility may raise confidence requirements).
* **Stage progression is sequential** — cannot skip ahead.
* **High-stakes stages (8 & 9)** dynamically adapt to market conditions for maximum reliability.

## Performance & Cost Optimization

* **All rates, costs, scores, routes, and thresholds are dynamic**
* **Database Queries**: Optimized indexes for 500K+ trade flow records
* **API Call Reduction**: 80%+ savings through volatile/stable separation
* **Smart Caching**: TTL-based caching with Redis and intelligent expiry
* **RSS Monitoring**: Real-time market data via automated RSS feeds
* **Network Effects**: Each of 205+ user sessions improves future intelligence

## Competitive Advantages

1. **Volatility Protection**: USMCA rates stay 0% (dynamic confirmation via StableDataManager)
2. **Cost Optimization**: 80%+ API savings through volatile/stable separation
3. **Institutional Learning**: 597K trade flows + 240+ sessions create unbeatable intelligence
4. **Real-Time Alerts**: Immediate notification when tariffs, shipping, or risks change
5. **Dynamic Thresholding**: Stage progression adapts to live data in real time
6. **Network Effects**: Each user improves intelligence for all future users

---

✅ Now **everything** — savings, tariffs, risks, confidence, thresholds, and stage progression — is fully dynamic, recalculated live on each request. Nothing is static or hardcoded.


Good question 👍 — you basically want a **Dynamic Audit Checklist** that you (or Claude/CI/CD) can run to confirm **nothing is hardcoded** and everything is using the database + engines.

Here’s how you can structure that request:

---

## 🔍 How to Ask for a Dynamic Audit

**Prompt example to Claude (or in your dev workflow):**

> “Run a full audit of all code related to tariffs, HS codes, savings, confidence, classification, and stage thresholds. Identify any functions or modules where values are hardcoded instead of being dynamically fetched from the database (`StableDataManager`, `VolatileDataManager`) or recalculated via engines (`DynamicSavingsEngine`, `DynamicConfidenceEngine`). Suggest fixes where static values exist.”

---

## ✅ Audit Checklist (Dynamic Compliance)

When running an audit, check every file for:

1. **HS Codes**

   * ❌ Hardcoded arrays like `["852872", "853120"]`
   * ✅ `db.hs_codes.findMany(...)`

2. **Tariff Rates**

   * ❌ `const tariff = 0.30`
   * ✅ `await VolatileDataManager.getOrFetchAPIData('comtrade', params)`

3. **USMCA Rates**

   * ❌ `const usmca = 0`
   * ✅ `await StableDataManager.getUSMCARates(route)`

4. **Shipping Costs**

   * ❌ `const shipping = 500`
   * ✅ `await VolatileDataManager.getOrFetchAPIData('shippo', params)`

5. **Savings Calculations**

   * ❌ Inline math like `volume * 0.3`
   * ✅ `DynamicSavingsEngine.calculate({ ... })`

6. **Confidence Scoring**

   * ❌ Fixed `95%` thresholds
   * ✅ `DynamicConfidenceEngine.score({ ... })`

7. **Stage Gates**

   * ❌ Static `{ minConfidence: 0.95, minSavings: 250000 }`
   * ✅ `ThresholdManager.getDynamicThresholds(stage, context)`

8. **Classification**

   * ❌ String matching or hardcoded keyword maps
   * ✅ Database query filtered by `businessType + description`

---

## 🔧 Automation Option

You can even add a **lint rule / test** that fails CI if it detects hardcoded values in critical areas:

```bash
# Example grep check
grep -R "const .* = [0-9]" src/ | grep -E "tariff|usmca|savings|hsCode|confidence"
```

That will catch any static number assignments in sensitive modules.


