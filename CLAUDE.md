# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Triangle Intelligence: USMCA Compliance Platform

## Overview
Triangle Intelligence is a **database-driven USMCA compliance platform** providing businesses with professional-grade tools for trade classification, qualification checking, tariff savings calculation, and certificate generation. The platform features **zero hardcoded values** - every piece of compliance data comes from the database or configuration.

## Current Status - PRODUCTION READY (September 2025)
- **Platform**: Fully operational with **42 API endpoints** + **AI-contextualized classification system**
- **Database**: 34,476 comprehensive government records with **5 performance indexes**
- **AI Innovation**: ✅ **BREAKTHROUGH** - Function-first AI classification with universal industry flexibility
- **Architecture**: Complete end-to-end workflow with **validated PDF certificate generation**
- **Build Status**: ✅ **Working** - All critical dependencies resolved
- **Testing Status**: ✅ **End-to-end validated** - Real $650K savings demonstrated
- **Production Ready**: ✅ **Enterprise APIs functional** - Ready for $299/month tier

## Technology Stack

### Core Framework
- **Next.js 14.2.5** - Pages Router architecture (not App Router)
- **React 18.3.1** - Component-based UI with custom hooks
- **Supabase PostgreSQL** - Primary database with 34,476+ HS code records
- **Anthropic AI SDK 0.59.0** - AI-enhanced classification system
- **jsPDF 3.0.2** - PDF certificate generation
- **Playwright** - E2E testing and visual validation

### Key Dependencies
```json
{
  "next": "^14.2.5",
  "react": "^18.3.1", 
  "@supabase/supabase-js": "^2.57.0",
  "@anthropic-ai/sdk": "^0.59.0",
  "jspdf": "^3.0.2",
  "lucide-react": "^0.539.0"
}
```

## Build & Development Commands

### Essential Commands
```bash
# Development
npm run dev          # Start dev server on port 3000
npm run build        # Production build (skip lint for speed)
npm run start        # Start production server

# Testing
npm test             # Run Jest unit tests
npm run test:watch   # Watch mode for TDD
npm run test:coverage # Coverage report (75% threshold required)
npm run test:ci      # CI-optimized test run
npm run test:playwright # E2E tests with Playwright

# Quality & Validation
npm run lint         # ESLint check
npm run type-check   # TypeScript validation
npm run check-hardcoding    # Validate no hardcoded values (CRITICAL)
npm run validate-enterprise # Full enterprise readiness check

# CSS Protection (CRITICAL)
npm run css:check    # Check CSS violations - blocks commits if found
npm run css:approve  # Approve CSS changes and update protection
npm run css:status   # Show CSS protection status
npm run css:lock     # Lock CSS files with cryptographic protection
npm run protection:full # Full protection check (CSS + hardcoding)

# Database Operations
npm run ingest:all          # Populate database with HS codes
```

### Port & Process Management (Windows)
```bash
# Clean stuck processes
npm run clean        # Kill node processes
npm run clean:port   # Free port 3000
npm run dev:fresh    # Clean restart
```

## Project Architecture

### High-Level Structure
```
triangle-simple/
├── pages/
│   ├── api/                    # 42 API endpoints
│   │   ├── trust/             # 11 trust microservices
│   │   ├── simple-*.js        # Core workflow APIs (<400ms)
│   │   └── database-driven-*.js # Enterprise APIs
│   ├── index.js               # Landing page with video hero
│   └── usmca-workflow.js      # Main workflow orchestrator
├── components/
│   ├── workflow/              # Multi-step workflow components
│   │   ├── USMCAWorkflowOrchestrator.js # Main controller
│   │   ├── CompanyInformationStep.js
│   │   ├── ComponentOriginsStepEnhanced.js
│   │   └── WorkflowResults.js
│   └── [UI components]
├── lib/
│   ├── core/                  # Business logic engines
│   ├── services/              # Service layer (trust, validation)
│   ├── classification/        # AI-enhanced HS classification
│   └── database/             # Database utilities & clients
├── config/                    # Configuration management
│   ├── system-config.js       # Main system configuration
│   ├── table-constants.js     # Database table names
│   └── trust-config.js        # Trust system settings
└── styles/
    └── globals.css           # LOCKED - Custom CSS only
```

### API Architecture (42 Endpoints)

#### Core Workflow APIs
- `simple-classification.js` - AI-enhanced HS code classification (<400ms)
- `simple-usmca-compliance.js` - Basic compliance workflow
- `simple-savings.js` - Tariff savings calculator
- `database-driven-usmca-compliance-simple.js` - Enterprise workflow

#### Trust Microservices (`/api/trust/`)
- `complete-workflow.js` - Main workflow orchestration
- `complete-certificate.js` - PDF certificate generation
- `verify-hs-code.js` - HS code validation
- `calculate-qualification.js` - USMCA qualification rules

#### Crisis Monitoring
- `trump-tariff-monitoring.js` - Real-time tariff alerts
- `rss-monitoring.js` - RSS feed monitoring
- `crisis-calculator.js` - Impact calculator

## Database Schema

### Primary Tables
```sql
-- Main HS code data (34,476 records)
hs_master_rebuild (
    hs_code TEXT PRIMARY KEY,
    description TEXT,
    chapter INTEGER,        -- HS chapter (1-99)
    mfn_rate DECIMAL,      -- Most Favored Nation rate
    usmca_rate DECIMAL,    -- USMCA preferential rate
    country_source TEXT,   -- US, CA, or MX
    effective_date DATE
);

-- USMCA qualification rules
usmca_qualification_rules (
    id UUID PRIMARY KEY,
    product_category TEXT,
    hs_chapter TEXT,
    regional_content_threshold DECIMAL,
    required_documentation TEXT[]
);
```

### Performance Indexes
```sql
-- Optimized for <200ms queries
CREATE INDEX idx_hs_master_description_gin 
  ON hs_master_rebuild USING gin(to_tsvector('english', description));
CREATE INDEX idx_hs_master_chapter ON hs_master_rebuild(chapter);
CREATE INDEX idx_hs_master_rates ON hs_master_rebuild(mfn_rate, usmca_rate);
```

## Critical Architecture Rules

### 1. NO HARDCODED VALUES (Enterprise Requirement)
**ALWAYS validate before commits:**
```bash
npm run check-hardcoding
npm run validate-enterprise
```

**Rules:**
- All configuration from environment or `config/` files
- Database table names from `config/table-constants.js`
- Thresholds and rates from database or `system-config.js`
- NO hardcoded tariff rates, country codes, or HS codes

### 2. CSS Architecture (STRICTLY ENFORCED) - CLEAN & PROTECTED 
**STATUS: ✅ CLEANED (September 2025) - Production pages 100% violation-free**

#### CSS File Architecture
- **`styles/globals.css`**: 738 lines (was 1,403) - **Pre-signin pages only**
- **`styles/dashboard.css`**: 746 lines (was 1,215) - **Post-signin functionality** 
- **Both under 800 lines** - Massive 44% bloat reduction achieved

#### CSS Rules (IMMUTABLE)
- ❌ **NO TAILWIND CSS** - Completely removed from project
- ❌ **NO INLINE STYLES** - Never use `style={{}}` or `style` attributes  
- ✅ **CUSTOM CSS CLASSES ONLY** - All styling from protected CSS files
- ✅ **SEMANTIC NAMING** - `.hero-title`, `.btn-primary`, `.card`
- ✅ **SEPARATION RULE** - Pre-signin uses globals.css, Post-signin uses dashboard.css

#### CSS Protection System (ACTIVE)
**Automated protection prevents CSS bloat from returning:**
```bash
# CSS Protection Commands (npm scripts available)
npm run css:check     # Check for violations - blocks commits if found
npm run css:approve   # Approve changes and update protection hashes  
npm run css:status    # Show protection status
npm run css:lock      # Lock CSS files with cryptographic protection
```

### 3. AI-Database Hybrid System
**Key Pattern:** AI provides context once per company, database handles runtime queries

```javascript
// ✅ AI-contextualized search strategy
function buildContextualSearches(aiClassification, productDescription) {
  if (aiClassification.application?.includes('automotive') && 
      productDescription.includes('wire')) {
    searches.push({
      strategy: 'automotive_electrical_conductor_8544',
      chapter: 85,
      hsPattern: '8544%',
      keywords: ['electrical', 'wire', 'cable', 'conductor']
    });
  }
}
```

### 4. HS Code Format Handling (CRITICAL)
**Problem:** User inputs `8544.42.90` but database stores `85444930`

**Solution:**
```javascript
function smartHSCodeLookup(userInput) {
  const normalized = userInput.replace(/[\.\s\-]/g, '');
  
  // Progressive fallback matching
  const fallbacks = [
    normalized,                      // 85444290
    normalized.substring(0, 8),      // 85444290  
    normalized.substring(0, 6)       // 854442 + '%'
  ];
  
  for (const pattern of fallbacks) {
    const result = await findSimilarCodes(`${pattern}%`);
    if (result?.length > 0) return result[0];
  }
}
```

### 5. Configuration-Driven Development
```javascript
// ✅ Centralized configuration
import { SYSTEM_CONFIG, TABLE_CONFIG } from '../config/system-config.js';

const threshold = SYSTEM_CONFIG.usmca.defaultRegionalContentThreshold;
const tableName = TABLE_CONFIG.comtradeReference;

// ❌ Never hardcode
const tariffRate = 0.25; // FORBIDDEN
```

## Testing Strategy

### Test Structure
```
__tests__/
├── api/           # API endpoint tests
├── components/    # React component tests  
├── integration/   # End-to-end tests
└── lib/          # Business logic tests
```

### Testing Commands
```bash
npm test                     # All Jest tests
npm run test:coverage       # 75% threshold required
npm run test:playwright     # E2E tests
npm run test:visual         # Visual regression tests
```

### Coverage Requirements
- **Lines**: 75% minimum
- **Statements**: 75% minimum  
- **Branches**: 65% minimum
- **Functions**: 75% minimum

## Environment Configuration

### Required Environment Variables
```env
# Database (Supabase PostgreSQL)
NEXT_PUBLIC_SUPABASE_URL=https://mrwitpgbcaxgnirqtavt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[required for API routes]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[required for client-side]

# AI Services  
ANTHROPIC_API_KEY=[for AI-contextualized classification]
ANTHROPIC_MODEL=claude-3-haiku-20240307

# Performance Tuning
DATABASE_TIMEOUT_MS=10000
API_TIMEOUT_MS=30000
CACHE_DEFAULT_TTL_MS=900000
```

## Common Development Workflows

### Adding New Features
1. **Plan** - Use TodoWrite tool for complex features
2. **Configure** - Add settings to `config/system-config.js` 
3. **Test** - Write failing tests first (TDD approach)
4. **Implement** - Build feature with database integration
5. **Validate** - Run `npm run validate-enterprise`

### CSS Development Workflow (PROTECTED SYSTEM)
**MANDATORY process for any UI work:**

#### Before Making Changes
```bash
npm run css:status    # Check current protection status
npm run css:check     # Ensure no existing violations
```

#### During Development  
1. **Use existing CSS classes** - Check `styles/globals.css` or `styles/dashboard.css`
2. **Pre-signin pages** - Use classes from `styles/globals.css` only
3. **Post-signin pages** - Use classes from `styles/dashboard.css` only
4. **NO inline styles** - Never use `style={{}}` or `style=""`
5. **NO Tailwind classes** - Never use `bg-blue-500`, `p-4`, etc.

#### If You Need New Styles
```bash
# STOP - Ask for approval before modifying CSS files
# CSS files are LOCKED and protected
# Only modify after explicit user approval
```

#### After Making Changes
```bash
npm run css:check     # MUST pass - blocks commits if violations found
npm run css:approve   # Only run after user approval
git commit -m "..."   # Pre-commit hooks will run CSS protection
```

#### Emergency CSS Fixes
```bash
npm run css:check     # Identify violations
# Fix violations by using existing classes
# Never create new styles without approval
```

### Debugging Common Issues

#### Database Connection Issues
```javascript
// Check Supabase connection
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, 
                           process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await client.from('hs_master_rebuild').select('*').limit(1);
```

#### HS Code Classification Issues  
```javascript
// Test AI classification
const response = await fetch('/api/simple-classification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    product_description: 'automotive electrical wire',
    business_type: 'manufacturing'
  })
});
```

#### API Performance Issues
- Check database query performance with `EXPLAIN ANALYZE`
- Verify indexes are being used
- Monitor query response times (<200ms target)

### File Modifications

#### When Creating API Endpoints
- Place in appropriate `/api/` subdirectory
- Follow naming: `simple-*.js` for core APIs, `database-driven-*.js` for enterprise
- Include error handling and response standardization
- Add corresponding test in `__tests__/api/`

#### When Modifying Components
- Keep components under 150 lines
- Use semantic CSS classes from `globals.css`
- Add PropTypes or TypeScript interfaces
- Test on multiple viewports

## Performance Targets

### Current Metrics (September 2025)
- **API Response**: <400ms (AI-enhanced classification)
- **Database Queries**: <200ms (with 5 performance indexes)  
- **Page Load Time**: <3s target
- **Classification Accuracy**: 85%+ (targeting 95%)

### Monitoring Tools Available
- `test-all-workflow-steps.js` - End-to-end validation
- `test-complete-workflow.js` - Full workflow testing
- `verify-crisis-readiness.js` - Crisis monitoring validation

## Business Context

### Revenue Tiers
- **Professional**: $299/month - Basic compliance workflows
- **Enterprise**: $799/month - Advanced features + API access
- **Enterprise+**: Custom pricing - White-label solutions

### Key Value Propositions
- **USMCA Compliance**: Automated qualification checking
- **Tariff Savings**: Real calculation engine (proven $650K+ savings)
- **Certificate Generation**: Professional PDF certificates
- **Crisis Monitoring**: Real-time tariff change alerts
- **AI Classification**: Context-aware HS code classification

## Key Files to Understand

### Essential Reading for New Contributors
1. **`pages/api/simple-classification.js`** - AI-enhanced HS classification
2. **`components/workflow/USMCAWorkflowOrchestrator.js`** - Main workflow controller  
3. **`lib/classification/simple-hs-matcher.js`** - Classification logic
4. **`config/system-config.js`** - Central configuration
5. **`pages/usmca-workflow.js`** - Main user workflow

### Configuration Files
- `config/system-config.js` - Main system settings
- `config/table-constants.js` - Database table references
- `config/trust-config.js` - Trust system configuration
- `jest.config.js` - Test configuration
- `playwright.config.js` - E2E test setup

## Troubleshooting Guide

### Common Error Patterns

#### "HS Code Not Found"
- Input format mismatch (`8544.42.90` vs `85444930`)
- Use progressive fallback matching
- Check database normalization

#### "Classification Too Generic"  
- Missing business context in AI classification
- Add industry-specific search strategies
- Verify company profile exists

#### "API Timeout"
- Database query too complex
- Check query execution plan
- Verify indexes are optimal

#### "Hardcoding Violation"
- Run `npm run check-hardcoding` to identify issues
- Move values to `config/system-config.js`
- Use environment variables for sensitive data

#### "CSS Protection Violation" (CRITICAL)
- **Inline styles detected**: Remove `style={{}}` or `style=""` attributes
- **Tailwind classes found**: Replace with existing custom CSS classes
- **Protected file modified**: CSS files are locked - requires explicit approval
- **Fix process**:
  ```bash
  npm run css:check                    # Identify specific violations
  # Fix violations using existing CSS classes only
  # Never modify styles/globals.css or styles/dashboard.css without approval
  npm run css:check                    # Verify fixes worked
  git commit -m "fix: remove CSS violations"
  ```

### Debug Commands
```bash
node test-frontend-ai-integration.js    # Test AI classification
node debug-database-search.js          # Debug database queries  
node test-balanced-classification.js    # Test classification balance
```

---

*Triangle Intelligence USMCA Compliance Platform*  
*Database-driven trade classification with zero hardcoded values*  
*Custom CSS styling system - NO Tailwind, NO inline styles*  
*Last Updated: September 5, 2025*