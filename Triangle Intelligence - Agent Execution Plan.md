# Triangle Intelligence - Agent Execution Plan

## Stage 1: Critical Infrastructure Fixes (Days 1-3)

### Context
Your platform has broken authentication for translations and security vulnerabilities in API routes. These must be fixed before any other work.

### Tasks for Agent

**Task 1.1: Fix Supabase Translations Authentication** done
```
File: lib/i18n-database-backend.js
Issue: Database backend failing, falling back to static files
Fix: Verify and fix Supabase service key permissions
Test: Ensure translations load from database, not fallback
```

**Task 1.2: Standardize API Client Usage** 
```
Files: All files in pages/api/
Issue: Some routes use createClient instead of getServerSupabaseClient()
Fix: Replace all createClient calls with getServerSupabaseClient()
Critical: pages/api/intelligence/routing.js line 28
```

**Task 1.3: Replace Console.log with Production Logger**
```
Files: 15+ files in pages/api/
Issue: console.log statements exposing sensitive data
Fix: Replace with logInfo, logError, logAPICall from lib/production-logger
Pattern: import { logInfo } from '../lib/production-logger'
```

**Task 1.4: Add Emergency Test Coverage**
```
Files: Create tests for lib/intelligence/database-intelligence-bridge.js
Target: Triangle routing calculations and savings estimates
Framework: Use existing Jest setup, aim for 30% coverage minimum
Critical: Test the $100K+ savings calculations
```

**Validation Commands:**
```bash
grep -r "createClient" pages/api/ | grep -v "getServerSupabaseClient"
grep -r "console.log" pages/api/
npm run test:coverage
```

## Stage 2: Architecture Simplification (Days 4-7)

### Context
Your platform has 6 intelligence systems creating maintenance burden. Simplify while preserving core competitive advantages.

### Tasks for Agent

**Task 2.1: Consolidate Intelligence Systems**
```
Files: lib/intelligence/beast-master-controller.js
Current: 6 systems (Similarity, Seasonal, Market, Success, Alert, Shipping)
Target: 3 core systems (Similarity + Market + Success)
Keep: Core compound intelligence generation
Remove: Redundant seasonal and shipping subsystems
```

**Task 2.2: Reduce Feature Flag Complexity**
```
Files: Look for NEXT_PUBLIC_USE_* environment variables
Current: 15+ optimization flags
Target: Keep only Phase 2 and Phase 3 optimizations
Remove: Unnecessary experimental flags
```

**Task 2.3: Convert Beast Master to Async**
```
File: lib/intelligence/beast-master-controller.js
Issue: Synchronous processing patterns won't scale
Fix: Convert BeastMasterController.activateAllBeasts to async/await
Pattern: Use Promise.all for parallel intelligence generation
```

**Task 2.4: Fix N+1 Query Patterns**
```
Files: All files using supabase queries in loops
Issue: Multiple database calls in loops
Fix: Use batch queries with .in() operator
Pattern: Replace forEach(async) with single query
```

## Stage 3: CSS Architecture Fix (Days 8-10)

### Context  
Your CSS is in a 1,833-line monolithic file creating maintenance issues.

### Tasks for Agent

**Task 3.1: Split CSS into Modules**
```
File: styles/globals.css (1,833 lines)
Target Structure:
- styles/foundations/variables.css (colors, typography)
- styles/components/dashboard.css (dashboard-specific)
- styles/components/forms.css (form styling)
- styles/utilities/spacing.css (utility classes)
Import order in globals.css
```

**Task 3.2: Remove Hardcoded Breakpoints**
```
Files: All CSS files with @media queries
Issue: Hardcoded pixel values
Fix: Use CSS custom properties for breakpoints
Pattern: --breakpoint-md: 768px
```

**Task 3.3: Eliminate Inline Styles**
```
Files: All .jsx files with style={{}}
Fix: Move to CSS classes or styled-components
Use existing Tailwind classes where possible
```

## Stage 4: Database Resilience (Days 11-14)

### Context
Heavy Supabase dependency without backup strategy for 519K+ critical records.

### Tasks for Agent

**Task 4.1: Add Connection Pool Monitoring**
```
File: lib/supabase-client.js
Add: Connection pool health checks
Add: Automatic retry logic with exponential backoff
Pattern: Track active connections, warn at 80% capacity
```

**Task 4.2: Implement Circuit Breaker Pattern**
```
Files: All external API calls (Comtrade, Shippo, Anthropic)
Add: Circuit breaker for API failures
Pattern: Fail fast after 3 consecutive failures, retry after 30s
Fallback: Use cached data when APIs unavailable
```

**Task 4.3: Add Database Backup Strategy**
```
File: Create lib/backup/database-backup.js
Function: Export critical tables (trade_flows, comtrade_reference)
Schedule: Daily backups of 519K+ records
Storage: Compressed JSON with integrity checksums
```

## Stage 5: Translation System Restoration (Days 15-17)

### Context
Missing 100+ translation keys preventing international deployment.

### Tasks for Agent

**Task 5.1: Complete Missing Translation Keys**
```
Tables: translations table in Supabase
Missing: 100+ keys between English (1,354) vs Spanish/French (1,254)
Add: All foundation.*, product.*, routing.* keys
Pattern: {key, language, value, context}
```

**Task 5.2: Localize Beast Master Intelligence**
```
File: lib/intelligence/beast-master-controller.js
Issue: English-only intelligence outputs
Fix: Add translation layer for compound insights
Pattern: t('intelligence.compound.perfectStorm')
```

**Task 5.3: Add Real-time Translation Updates**
```
File: lib/i18n-database-backend.js
Add: WebSocket updates for translation changes
Cache: Reduce from 5 minutes to 30 seconds for critical updates
Pattern: Subscribe to translations table changes
```

## Stage 6: Security Hardening (Days 18-21)

### Context
Security score of 82/100 needs improvement for enterprise deployment.

### Tasks for Agent

**Task 6.1: Add Security Event Monitoring**
```
File: Create lib/security/event-monitor.js
Track: Failed login attempts, unusual API usage, rate limit hits
Alert: Email notifications for security events
Log: Security events to separate audit log
```

**Task 6.2: Implement Proper Secret Management**
```
File: lib/environment-validation.js
Add: Runtime validation of all environment variables
Add: Encrypted storage for sensitive configuration
Pattern: Validate API key formats and permissions
```

**Task 6.3: Add Input Validation**
```
Files: All API routes in pages/api/
Add: Zod schemas for request validation
Add: Rate limiting per endpoint
Pattern: Sanitize and validate all user inputs
```

## Stage 7: Performance Optimization (Days 22-24)

### Context
Target 85% faster queries and 68% faster page loads.

### Tasks for Agent

**Task 7.1: Implement Intelligent Caching**
```
Files: All database queries
Add: Redis caching for frequent queries
Pattern: Cache HS code lookups, tariff rates, success patterns
TTL: Volatile data (1 hour), Stable data (forever)
```

**Task 7.2: Add Database Query Optimization**
```
Files: Database queries with 500K+ records
Add: Proper indexing on frequently queried columns
Add: Query result pagination
Pattern: Use .range() for large result sets
```

**Task 7.3: Implement Bundle Code Splitting**
```
Files: pages/ directory
Add: Dynamic imports for intelligence systems
Pattern: const BeastMaster = lazy(() => import('../lib/intelligence/beast-master'))
Target: Reduce 4.9MB bundle to <1MB initial load
```

## Validation & Testing Protocol

After each stage, agent must run:

```bash
# Test coverage validation
npm run test:coverage
# Should show increasing coverage toward 70%

# Security validation  
npm run lint
# Should pass with no security warnings

# Performance validation
npm run build
npm run start
# Check bundle size and memory usage

# Translation validation
curl http://localhost:3000/api/test-translations
# Should return database translations, not fallback

# Database validation
curl http://localhost:3000/api/database-structure-test
# Should pass all integrity checks
```

## Success Criteria

**Stage 1 Complete:** Authentication fixed, security standardized, emergency tests passing
**Stage 2 Complete:** Intelligence systems simplified, async patterns implemented  
**Stage 3 Complete:** CSS modularized, no inline styles, responsive patterns fixed
**Stage 4 Complete:** Database resilience added, backup strategy implemented
**Stage 5 Complete:** 100% translation parity, localized intelligence
**Stage 6 Complete:** Security score >95/100, comprehensive monitoring
**Stage 7 Complete:** Performance targets achieved, bundle optimized

## Critical Constraints for Agent

- Never add new npm dependencies without explicit approval
- Always use existing patterns (getSupabaseClient, production-logger, etc.)
- Preserve Beast Master Controller and Database Intelligence Bridge architecture
- No magic numbers - use constants or environment variables
- Follow existing file naming and organization conventions
- Test all changes before marking stage complete
