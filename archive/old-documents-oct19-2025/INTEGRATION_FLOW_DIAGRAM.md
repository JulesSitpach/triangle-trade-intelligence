# INTEGRATION FLOW DIAGRAM
**Triangle Intelligence Platform - Critical Data Flows**

---

## FLOW 1: USA Destination Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│ USER INPUT (Step 1 - CompanyInformationStep.js)                 │
├──────────────────────────────────────────────────────────────────┤
│ business_type: "Exporter"                                        │
│ destination_country: "United States"                             │
│ company_name: "Acme Corp"                                        │
│ product_description: "Industrial control modules"                │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Auto-calculate (lines 33-58)
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ CALCULATED VALUES                                                │
├──────────────────────────────────────────────────────────────────┤
│ trade_flow_type: "CA→US"                                         │
│ tariff_cache_strategy: "ai_24hr"                                 │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Pass to Step 2
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ COMPONENT INPUT (Step 2 - ComponentOriginsStepEnhanced.js)      │
├──────────────────────────────────────────────────────────────────┤
│ Component 1:                                                     │
│   description: "Microcontroller circuit board"                  │
│   origin_country: "China"                                        │
│   value_percentage: 35                                           │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ AI Classification Request
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ CLASSIFICATION AGENT (/api/agents/classification)               │
├──────────────────────────────────────────────────────────────────┤
│ Input: Component + Business Context                             │
│ Output: HS Code 8542.31.00 (95% confidence)                     │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ HS Code assigned
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ ENRICHMENT ROUTER (lib/tariff/enrichment-router.js)             │
├──────────────────────────────────────────────────────────────────┤
│ getCacheStrategy("US") → "ai_24hr"                               │
│ enrichWithAI_24HrCache() called                                  │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Cache check (24hr TTL)
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ CACHE CHECK (tariff_cache table)                                │
├──────────────────────────────────────────────────────────────────┤
│ Query: origin=CN, destination=US, hs=8542.31.00                 │
│ Result: MISS (no entry or expired)                              │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Cache MISS → AI lookup
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ TARIFF RESEARCH AGENT (lib/agents/tariff-research-agent.js)     │
├──────────────────────────────────────────────────────────────────┤
│ AI Prompt: "Research US tariff rates for HS 8542.31.00          │
│             imported from China. Include all policy layers:      │
│             - Base MFN rate                                      │
│             - Section 301 tariffs (China-specific)               │
│             - Section 232 tariffs (steel/aluminum)               │
│             - IEEPA emergency tariffs                            │
│             - Port fees (Trump administration)                   │
│             Return total effective rate and USMCA rate"          │
│                                                                  │
│ AI Response:                                                     │
│   base_mfn_rate: 0% (semiconductors duty-free)                  │
│   section_301: 25% (China-origin electronics)                   │
│   section_232: 0% (not applicable)                              │
│   port_fees: 0.125%                                             │
│   total_rate: 25.125%                                           │
│   usmca_rate: 0%                                                │
│   policy_adjustments: ["Section 301 List 4A"]                   │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Store in cache (24hr expiry)
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ ENRICHED COMPONENT                                               │
├──────────────────────────────────────────────────────────────────┤
│ hs_code: "8542.31.00"                                           │
│ hs_description: "Microcontrollers - processors"                 │
│ mfn_rate: 0%                                                    │
│ total_rate: 25.125% (includes Section 301)                      │
│ usmca_rate: 0%                                                  │
│ savings_percentage: 100% of 25.125% = 25.125%                  │
│ data_source: "ai_fresh_24hr"                                    │
│ policy_layers_checked: [Base MFN, 301, 232, IEEPA, Port Fees]  │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Save to workflow
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ WORKFLOW RESULTS                                                 │
├──────────────────────────────────────────────────────────────────┤
│ Component 1:                                                     │
│   Origin: China                                                  │
│   Value: 35%                                                     │
│   Tariff WITHOUT USMCA: 25.125%                                 │
│   Tariff WITH USMCA: 0%                                         │
│   Savings: $8,794 annually (35% × $100k × 25.125%)             │
│                                                                  │
│ Certificate Type: EXPORTER (mapped from business_type)          │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Dashboard data fetch
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ ALERT FILTERING (/api/dashboard-data.js)                        │
├──────────────────────────────────────────────────────────────────┤
│ User's destination: "US"                                         │
│ User's HS codes: ["8542.31.00"]                                 │
│                                                                  │
│ Crisis Alerts Fetched:                                           │
│   Alert 1: "Section 301 Tariffs Increased to 100%"              │
│     affected_destinations: ["US"]                                │
│     affected_hs_codes: ["8542"] → MATCH ✓                       │
│     Show to user: YES                                            │
│                                                                  │
│   Alert 2: "CBSA Rate Change for Electronics"                   │
│     affected_destinations: ["CA"]                                │
│     Show to user: NO (filtered out)                             │
└──────────────────────────────────────────────────────────────────┘
```

**Cost**: ~$0.02 per component (AI lookup with 24hr cache)
**Speed**: ~2.5s first time, ~200ms cached

---

## FLOW 2: Canada Destination Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│ USER INPUT                                                       │
├──────────────────────────────────────────────────────────────────┤
│ business_type: "Manufacturer"                                    │
│ destination_country: "Canada"                                    │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Auto-calculate
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ CALCULATED VALUES                                                │
├──────────────────────────────────────────────────────────────────┤
│ trade_flow_type: "MX→CA"                                         │
│ tariff_cache_strategy: "ai_90day"                                │
│ certificate_type: "PRODUCER" (from business_type)                │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Component enrichment
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ ENRICHMENT ROUTER                                                │
├──────────────────────────────────────────────────────────────────┤
│ getCacheStrategy("CA") → "ai_90day"                              │
│ enrichWithAI_90DayCache() called                                 │
│ Cache TTL: 90 days (2160 hours)                                 │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Cache check (90-day TTL)
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ CACHE CHECK                                                      │
├──────────────────────────────────────────────────────────────────┤
│ Query: origin=MX, destination=CA, hs=8542.31.00                 │
│ Result: HIT (cached 15 days ago, still valid)                   │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Cache HIT → return cached data
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ CACHED TARIFF DATA                                               │
├──────────────────────────────────────────────────────────────────┤
│ mfn_rate: 0% (Canada promotes electronics)                       │
│ cusma_rate: 0%                                                  │
│ savings_percentage: 0% (already duty-free)                       │
│ data_source: "ai_cached_90day"                                   │
│ cache_age_days: 15                                              │
│ policy_adjustments: []                                           │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Alert filtering
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ ALERT FILTERING                                                  │
├──────────────────────────────────────────────────────────────────┤
│ User's destination: "CA"                                         │
│                                                                  │
│ Crisis Alerts:                                                   │
│   Alert 1: "Section 301 Tariffs Increased to 100%"              │
│     affected_destinations: ["US"]                                │
│     Show to user: NO (filtered out) ✓                           │
│                                                                  │
│   Alert 2: "CBSA Rate Change for Electronics"                   │
│     affected_destinations: ["CA"]                                │
│     Show to user: YES ✓                                         │
└──────────────────────────────────────────────────────────────────┘
```

**Cost**: ~$0.01 per component (90-day amortized)
**Speed**: ~200ms (cache hit), ~2s (cache miss)

---

## FLOW 3: Mexico Destination Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│ USER INPUT                                                       │
├──────────────────────────────────────────────────────────────────┤
│ business_type: "Importer"                                        │
│ destination_country: "Mexico"                                    │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Auto-calculate
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ CALCULATED VALUES                                                │
├──────────────────────────────────────────────────────────────────┤
│ trade_flow_type: "US→MX"                                         │
│ tariff_cache_strategy: "database"                                │
│ certificate_type: "IMPORTER" (from business_type)                │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Component enrichment
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ ENRICHMENT ROUTER                                                │
├──────────────────────────────────────────────────────────────────┤
│ getCacheStrategy("MX") → "database"                              │
│ enrichFromDatabase() called                                      │
│ NO AI CALLS (cost optimization)                                 │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Database lookup ONLY
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ DATABASE QUERY (tariff_intelligence_master)                      │
├──────────────────────────────────────────────────────────────────┤
│ SELECT * FROM tariff_intelligence_master                         │
│ WHERE hts8 = '85423100'  -- Remove dots from HS code            │
│                                                                  │
│ Result:                                                          │
│   hts8: 85423100                                                │
│   brief_description: "Microcontrollers - processors"            │
│   mexico_ad_val_rate: 5.0  -- IGI rate (general import tax)     │
│   usmca_ad_val_rate: 0.0   -- T-MEC preferential rate           │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Calculate savings
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ ENRICHED COMPONENT                                               │
├──────────────────────────────────────────────────────────────────┤
│ hs_code: "8542.31.00"                                           │
│ hs_description: "Microcontrollers - processors"                 │
│ mfn_rate: 5.0% (Mexican IGI)                                    │
│ usmca_rate: 0%                                                  │
│ savings_percentage: 100% of 5% = 5%                             │
│ data_source: "database"                                          │
│ ai_confidence: 100 (database data is verified)                   │
│ tariff_policy: "Mexican T-MEC rates (stable)"                   │
└──────────────────────────────────────────────────────────────────┘
```

**Cost**: $0.00 per component (database lookup - FREE)
**Speed**: <50ms (instant)

---

## FLOW 4: Service Purchase with Subscriber Discount

```
┌──────────────────────────────────────────────────────────────────┐
│ USER ACTION                                                      │
├──────────────────────────────────────────────────────────────────┤
│ User clicks "Purchase USMCA Advantage Sprint"                   │
│ User subscription_tier: "Professional"                           │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ API request
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ DISCOUNT CALCULATION (/api/stripe/create-service-checkout.js)   │
├──────────────────────────────────────────────────────────────────┤
│ service_id: "usmca-advantage"                                    │
│ basePrice: $17500 (cents) = $175                                │
│                                                                  │
│ Get user subscription tier from database:                        │
│   subscription_tier: "Professional"                              │
│                                                                  │
│ Apply discount:                                                  │
│   TIER_DISCOUNTS["Professional"] = 0.15 (15%)                    │
│   servicePrice = Math.round(17500 * (1 - 0.15))                 │
│   servicePrice = Math.round(17500 * 0.85)                       │
│   servicePrice = 14875 cents = $148.75                          │
│                                                                  │
│ Check if service excluded from discounts:                        │
│   NO_DISCOUNT_SERVICES.includes("usmca-advantage") = false       │
│   Apply discount: YES                                            │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Create service request in database
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ DATABASE INSERT (service_requests)                               │
├──────────────────────────────────────────────────────────────────┤
│ INSERT INTO service_requests:                                    │
│   user_id: uuid                                                  │
│   service_type: "usmca-advantage"                                │
│   status: "pending_payment"                                      │
│   company_name: "Acme Corp"                                     │
│   price: 148.75                                                  │
│   subscriber_data: {                                             │
│     company_name: "Acme Corp",                                  │
│     business_type: "Exporter",                                  │
│     destination_country: "US",                                  │
│     component_origins: [                                         │
│       {                                                          │
│         description: "Microcontroller",                         │
│         origin_country: "China",                                │
│         value_percentage: 35,                                   │
│         hs_code: "8542.31.00",                                 │
│         mfn_rate: 0,                                            │
│         total_rate: 25.125,                                     │
│         usmca_rate: 0,                                          │
│         savings_percentage: 25.125                              │
│       }                                                          │
│     ]                                                            │
│   }                                                              │
│                                                                  │
│ Returns: service_request_id                                      │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Create Stripe checkout session
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ STRIPE CHECKOUT SESSION                                          │
├──────────────────────────────────────────────────────────────────┤
│ line_items: [                                                    │
│   {                                                              │
│     price_data: {                                                │
│       product_data: {                                            │
│         name: "USMCA Advantage Sprint"                          │
│       },                                                         │
│       unit_amount: 14875  -- $148.75 (15% discount applied)     │
│     },                                                           │
│     quantity: 1                                                  │
│   }                                                              │
│ ]                                                                │
│ metadata: {                                                      │
│   service_request_id: uuid                                       │
│ }                                                                │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ User completes payment
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ WEBHOOK UPDATE (on payment success)                             │
├──────────────────────────────────────────────────────────────────┤
│ UPDATE service_requests                                          │
│ SET status = 'pending_fulfillment'                              │
│ WHERE id = service_request_id                                    │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ Admin dashboard fetch
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ ADMIN DASHBOARD (Cristina)                                      │
├──────────────────────────────────────────────────────────────────┤
│ Service Request: USMCA Advantage Sprint                         │
│ Client: Acme Corp                                               │
│ Status: Pending Fulfillment                                     │
│ Price Paid: $148.75 (15% discount - Professional subscriber)    │
│                                                                  │
│ Enriched Components Table (8 columns):                          │
│ ┌────────┬────────┬───────┬─────┬──────┬─────┬──────┬──────┐  │
│ │ Desc   │ Origin │ Value │ HS  │ MFN  │ Tot │ USMCA│ Save │  │
│ ├────────┼────────┼───────┼─────┼──────┼─────┼──────┼──────┤  │
│ │ Micro  │ China  │ 35%   │8542 │ 0%   │25.1%│ 0%   │25.1% │  │
│ └────────┴────────┴───────┴─────┴──────┴─────┴──────┴──────┘  │
│                                                                  │
│ Full Business Context Available:                                │
│ - Complete USMCA workflow data                                  │
│ - Tariff intelligence with policy layers                        │
│ - AI confidence scores                                          │
│ - Savings calculations                                          │
└──────────────────────────────────────────────────────────────────┘
```

**Discount Examples:**
- Trade Health Check: $99 (NO discount for any tier)
- USMCA Advantage Sprint: $175 → $149 (Professional) / $131 (Premium)
- Supply Chain Optimization: $275 → $234 (Professional) / $206 (Premium)
- Crisis Navigator: $200 (NO discount for any tier)

---

## KEY INTEGRATION POINTS SUMMARY

### 1. Business Type → Certificate Type
```
BUSINESS_TYPES → mapBusinessTypeToCertifierType() → CERTIFIER_TYPE
Exporter → EXPORTER
Manufacturer → PRODUCER
Importer → IMPORTER
```

### 2. Destination → Cache Strategy
```
destination_country → getCacheStrategy() → cache_strategy
USA → ai_24hr (volatile policy)
Canada → ai_90day (stable policy)
Mexico → database (FREE lookup)
```

### 3. Subscription Tier → Service Discount
```
subscription_tier → TIER_DISCOUNTS → discount_percentage
Trial → 0%
Starter → 0%
Professional → 15%
Premium → 25%

EXCEPT: trade-health-check, crisis-navigator (no discount)
```

### 4. Workflow Data → Alert Filtering
```
workflow.destination_country → alert.affected_destinations → MATCH/FILTER
USA workflow → Show US alerts only
Canada workflow → Show CA alerts only (filter US)
Mexico workflow → Show MX alerts only
```

---

**Report Generated**: October 18, 2025
**Purpose**: Visual reference for manual testing and onboarding
