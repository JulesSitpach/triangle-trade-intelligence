# Triangle Intelligence Architecture Optimization Roadmap - AGENT IMPLEMENTATION GUIDE
CRITICAL AGENT SAFETY RULES - ADDITIONS:
❌ NEVER DO:

Write inline CSS - All styles must use existing classes from bloomberg-professional-clean.css
Add hard-coded fake data - Use real data sources or proper fallbacks only
Create new CSS files - Work within the existing stylesheet
Hardcode values - Use configuration files, environment variables, or database values

✅ ALWAYS DO:

Use existing Bloomberg CSS classes from bloomberg-professional-clean.css
Implement proper fallbacks - Graceful degradation when data is unavailable
Use real data sources - Database, APIs, or calculated values only
Follow existing design patterns - Maintain consistency with current UI

⚠️ DATA HANDLING RULES:

No dummy/test data in production code
Always provide meaningful fallbacks (loading states, error messages, empty states)
Use environment-appropriate data sources
Validate data before displaying

🎨 STYLING REQUIREMENTS:

Existing classes only - No custom CSS, use what's in bloomberg-professional-clean.css
Consistent components - Match existing button styles, layouts, forms
Responsive design - Use existing responsive utilities

This ensures agents maintain your professional styling standards and data integrity throughout the roadmap implementation.

## Page Data Flow Analysis

### Foundation Page (foundation.js)
**Data In:** User form input  
**APIs Called:** `/api/dropdown-options`, `/api/intelligence/real-time-stats`  
**Storage:** `localStorage['triangle-foundation']`  
**Data Out:** Foundation data to Product Page  
**Bottleneck:** Multiple dropdown API calls on page load

### Product Page (product.js)  
**Data In:** Foundation data from localStorage  
**APIs Called:** `/api/product-suggestions`, `/api/intelligence/hs-codes`  
**Storage:** `localStorage['triangle-product']`  
**Data Out:** Product/HS code data to Routing Page  
**Bottleneck:** N+1 queries for individual HS codes

### Routing Page (routing.js)
**Data In:** Foundation + Product data  
**APIs Called:** `/api/intelligence/routing`, `/api/blaze/triangle-routing`  
**Storage:** `localStorage['triangle-routing']`  
**Data Out:** Route selection to Partnership Page  
**Bottleneck:** Large 597K trade_flows queries without pagination

### Partnership Page (partnership.js)
**Data In:** Foundation + Product + Routing data  
**APIs Called:** `/api/canada-mexico-advantage`, `/api/partnerships/match`  
**Storage:** `localStorage['triangle-partnership']`  
**Data Out:** Partnership strategy to Hindsight Page  
**Bottleneck:** Duplicate route calculations

### Hindsight Page (hindsight.js)
**Data In:** All previous page data  
**APIs Called:** `/api/marcus/hindsight-report`  
**Storage:** `workflow_sessions` table  
**Data Out:** Success patterns to Alerts Page  
**Bottleneck:** Session data scattered across localStorage + database

### Alerts Page (alerts.js)
**Data In:** Complete journey data  
**APIs Called:** `/api/personalized-monitoring`, `/api/trade-alerts/monitor`  
**Storage:** `current_market_alerts` table  
**Data Out:** Alert configuration  
**Bottleneck:** Real-time polling every 30-45 seconds

## AGENT IMPLEMENTATION PHASES

### Phase 1: Unified State (5 days)

**AGENT TASK 1.1:** Create State Manager
```javascript
// File: lib/state/triangle-state-manager.js
export class TriangleStateManager {
  constructor() {
    this.state = {
      sessionId: null,
      foundation: {},
      products: [],
      routing: {},
      partnership: {},
      alerts: []
    }
    this.listeners = new Set()
  }

  updatePage(pageName, data) {
    this.state[pageName] = { ...this.state[pageName], ...data }
    this.notifyListeners()
    this.syncToDatabase()
  }

  async syncToDatabase() {
    if (!this.state.sessionId) return
    const { error } = await supabase
      .from('workflow_sessions')
      .update({ metadata: this.state })
      .eq('session_id', this.state.sessionId)
  }
}
```

**AGENT TASK 1.2:** Create Context Provider
```javascript
// File: lib/state/state-provider.js
import { createContext, useContext, useRef } from 'react'
import { TriangleStateManager } from './triangle-state-manager'

export const StateContext = createContext()
export const useTriangleState = () => useContext(StateContext)

export const StateProvider = ({ children }) => {
  const stateManager = useRef(new TriangleStateManager()).current
  return (
    <StateContext.Provider value={stateManager}>
      {children}
    </StateContext.Provider>
  )
}
```

**AGENT TASK 1.3:** Add Feature Flags
```javascript
// File: lib/feature-flags.js
export const FEATURES = {
  USE_UNIFIED_STATE: process.env.NEXT_PUBLIC_USE_UNIFIED_STATE === 'true',
  USE_OPTIMIZED_QUERIES: process.env.NEXT_PUBLIC_USE_OPTIMIZED_QUERIES === 'true',
  USE_PREFETCHING: process.env.NEXT_PUBLIC_USE_PREFETCHING === 'true'
}
```

**AGENT TASK 1.4:** Modify _app.js
```javascript
// Add to pages/_app.js (KEEP existing code, ADD wrapper)
import { StateProvider } from '../lib/state/state-provider'

// Wrap existing component:
return (
  <StateProvider>
    {/* existing app content */}
  </StateProvider>
)
```

**Agent Boundaries Phase 1:**
✅ CREATE new files only
❌ DO NOT modify existing localStorage code
❌ DO NOT remove any existing functionality
✅ USE feature flags for all new code

### Phase 2: Query Optimization (4 days)

**AGENT TASK 2.1:** Create RPC Function in Supabase
```sql
-- Run in Supabase SQL Editor
CREATE OR REPLACE FUNCTION get_complete_intelligence(
  business_type TEXT,
  hs_codes TEXT[] DEFAULT '{}',
  include_patterns BOOLEAN DEFAULT true
) RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'trade_flows', (
      SELECT json_agg(t.*) FROM trade_flows t 
      WHERE t.product_category ILIKE '%' || business_type || '%' 
      LIMIT 50
    ),
    'comtrade', (
      SELECT json_agg(c.*) FROM comtrade_reference c 
      WHERE c.hs_code = ANY(hs_codes)
    ),
    'patterns', CASE WHEN include_patterns THEN (
      SELECT json_agg(p.*) FROM hindsight_pattern_library p
    ) ELSE NULL END
  );
END;
$$ LANGUAGE plpgsql;
```

**AGENT TASK 2.2:** Create Optimized Queries
```javascript
// File: lib/database/optimized-queries.js
import { getSupabaseClient } from '../supabase-client'
const supabase = getSupabaseClient()

export class OptimizedQueries {
  static async getCompleteIntelligence(businessType, hsCodes = []) {
    const { data, error } = await supabase.rpc('get_complete_intelligence', {
      business_type: businessType,
      hs_codes: hsCodes,
      include_patterns: true
    })
    if (error) throw error
    return data
  }
}
```

**AGENT TASK 2.3:** Update Database Bridge
```javascript
// File: lib/database-intelligence-bridge.js
// ADD this method (don't remove existing ones):
import { FEATURES } from '../feature-flags'
import { OptimizedQueries } from '../database/optimized-queries'

static async getTriangleRoutingIntelligence(params) {
  if (FEATURES.USE_OPTIMIZED_QUERIES) {
    const data = await OptimizedQueries.getCompleteIntelligence(
      params.businessType, 
      params.hsCodes
    )
    return this.transformOptimizedData(data)
  } else {
    // Keep existing implementation for rollback
    return this.getTriangleRoutingIntelligenceOriginal(params)
  }
}
```

**Agent Boundaries Phase 2:**
✅ CREATE new RPC functions
✅ ADD new query methods alongside old ones
❌ DO NOT delete existing query methods
✅ TEST with feature flags

### Phase 3: Prefetching (3 days)

**AGENT TASK 3.1:** Create Prefetch Manager
```javascript
// File: lib/prefetch/prefetch-manager.js
export class PrefetchManager {
  static cache = new Map()
  static queue = new Map()

  static async prefetchProduct(foundationData) {
    const key = `products_${foundationData.businessType}`
    if (this.cache.has(key)) return this.cache.get(key)

    const promise = fetch('/api/product-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessType: foundationData.businessType })
    }).then(r => r.json())

    this.queue.set(key, promise)
    const data = await promise
    this.cache.set(key, data)
    return data
  }

  static getFromCache(key) {
    return this.cache.get(key)
  }
}
```

**AGENT TASK 3.2:** Add to Foundation Page
```javascript
// File: pages/foundation.js
// ADD import and useEffect:
import { PrefetchManager } from '../lib/prefetch/prefetch-manager'
import { FEATURES } from '../lib/feature-flags'

// ADD to useEffect:
useEffect(() => {
  if (FEATURES.USE_PREFETCHING && formData.businessType) {
    PrefetchManager.prefetchProduct(formData)
  }
}, [formData.businessType])
```

**Agent Boundaries Phase 3:**
✅ CREATE prefetch manager
✅ ADD prefetching without breaking existing fetches
❌ DO NOT make prefetching mandatory
✅ RESPECT API rate limits

### Phase 4: Testing Requirements

**Test Each Phase:**
```javascript
// File: test/phase-validation.js
export const validatePhase = async (phase) => {
  switch(phase) {
    case 1:
      // Test state synchronization
      assert(localStorage.getItem('triangle-foundation') !== null)
      assert(stateManager.state.foundation !== null)
      break
    case 2:
      // Test query optimization
      const before = performance.now()
      await OptimizedQueries.getCompleteIntelligence('Electronics')
      const after = performance.now()
      assert((after - before) < 1000) // Must be under 1 second
      break
  }
}
```

**Rollback Procedures:**
```javascript
// File: lib/rollback.js
export const rollback = (phase) => {
  switch(phase) {
    case 1:
      process.env.NEXT_PUBLIC_USE_UNIFIED_STATE = 'false'
      break
    case 2:
      process.env.NEXT_PUBLIC_USE_OPTIMIZED_QUERIES = 'false'
      break
  }
  console.log(`Rolled back to Phase ${phase - 1}`)
}
```

## CRITICAL AGENT SAFETY RULES

### ✅ ALWAYS DO:
- Use feature flags for new functionality
- Keep existing code intact during migration
- Test with small datasets first
- Create new files instead of modifying when possible
- Log all changes and performance metrics

### ❌ NEVER DO:
- Delete existing localStorage code until Phase 5
- Modify database schemas without backup
- Remove feature flags during development
- Deploy without rollback capability
- Ignore performance regression tests

### ⚠️ CAREFUL WITH:
- API rate limits during prefetching
- Database connection limits
- Memory usage with large datasets
- User session data integrity

## SUCCESS VALIDATION

**Phase Complete When:**
- All tests pass
- Performance metrics improved
- Zero data loss confirmed  
- Rollback tested successfully
- Feature flag toggles work

**Go/No-Go Criteria:**
- <5% error rate increase
- No performance regression
- Database integrity maintained
- User sessions preserved

Total timeline: **21 days** with proper testing