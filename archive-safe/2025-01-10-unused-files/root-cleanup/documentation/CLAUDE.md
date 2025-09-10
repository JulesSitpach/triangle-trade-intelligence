# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Triangle Intelligence is a database-driven USMCA compliance platform for trade classification, tariff calculation, and certificate generation. Built with Next.js 14 (Pages Router), React 18, and Supabase PostgreSQL with 34,476+ HS code records.

## Essential Commands

```bash
# Development
npm run dev                    # Start dev server on port 3000
npm run build                  # Production build (skips lint)
npm run start                  # Start production server

# Testing
npm test                       # Run all Jest tests
npm run test:watch            # TDD watch mode
npm run test:coverage         # Coverage report (75% threshold)
npm run test:playwright       # E2E tests

# Validation & Quality
npm run lint                  # ESLint check
npm run type-check           # TypeScript validation
npm run check-hardcoding     # Verify no hardcoded values
npm run validate-enterprise  # Full enterprise validation
npm run css:check           # Check CSS violations (blocks commits)
npm run protection:full     # Full protection check

# Database
npm run ingest:all          # Populate HS codes database

# Windows Process Management
npm run clean               # Kill node processes
npm run clean:port         # Free port 3000
npm run dev:fresh          # Clean restart
```

## High-Level Architecture

### API Structure (51 endpoints)
```
pages/api/
├── simple-*.js              # Core workflow APIs (<400ms response)
│   ├── simple-classification.js    # AI-enhanced HS classification
│   ├── simple-usmca-compliance.js  # Compliance checking (complex routing)
│   └── simple-savings.js           # Tariff savings calculator
├── admin/                   # Admin management (9 endpoints)
│   ├── users.js            # Falls back to sample data if empty
│   ├── suppliers.js        # Supplier management
│   └── rss-feeds.js        # Crisis monitoring feeds
├── trust/                   # Trust microservices (11 endpoints)
│   ├── complete-workflow.js
│   └── complete-certificate.js
└── database-driven-*.js    # Enterprise APIs
```

### Key Architectural Patterns

#### 1. Database Connection & Fallback Pattern
All admin APIs intelligently fall back to sample data when tables are empty:
```javascript
const { data, error } = await supabase.from('table').select('*');
if (error || !data || data.length === 0) {
  console.log('Using sample data for demo');
  return sampleData;
}
```

#### 2. API Response Structure
Admin APIs return standardized responses:
```javascript
{
  [main_data]: [...],        // Primary data (e.g., users, feeds)
  summary: { ... },          // Aggregate metrics
  data_status: { ... },      // Metadata
  timeframe: "30days"        // Query parameters
}
```

#### 3. HS Code Normalization
Critical for classification - handles multiple formats:
```javascript
// User input: "8544.42.90" → Database: "85444290"
const normalized = input.replace(/[\.\s\-]/g, '');
// Progressive fallback matching with 8, 6, 4 digit patterns
```

#### 4. AI Classification Integration
Two-phase approach:
- Phase 1: AI provides context once per company
- Phase 2: Database handles all runtime queries

### Critical Configuration Files

- `config/system-config.js` - Central system configuration
- `config/table-constants.js` - Database table names (never hardcode)
- `config/trust-config.js` - Trust system settings
- `.env.local` - Environment variables (Supabase, Anthropic, etc.)

### CSS Architecture Rules (STRICTLY ENFORCED)

**NEVER modify `styles/globals.css` or `styles/dashboard.css`**
- NO inline styles (`style={{}}` or `style=""`)
- NO Tailwind CSS classes
- Use existing CSS classes only
- Run `npm run css:check` before commits

### Database Schema

Primary tables (Supabase PostgreSQL):
- `hs_master_rebuild` - 34,476 HS codes (critical)
- `user_profiles` - User accounts (empty = sample data)
- `workflow_completions` - Completed workflows
- `rss_feeds` - Crisis monitoring feeds
- `usmca_qualification_rules` - Qualification logic

### Testing Strategy

Tests located in `__tests__/` directory:
- Unit tests: 75% coverage required
- Integration tests: API endpoint testing
- E2E tests: Playwright for visual validation

Run specific test:
```bash
npm test -- __tests__/api/simple-classification.test.js
```

### Common Issues & Solutions

#### "Database connected but using sample data"
- `user_profiles` table is empty (0 records)
- APIs correctly fall back to demo data
- Add real users to switch from sample data

#### "405 Method Not Allowed"
- Check HTTP method in API handler
- Admin APIs expect GET, not POST

#### "HS Code not found"
- Format mismatch between input and database
- Use normalization utilities in `lib/utils/hs-code-normalizer.js`

#### "CSS violation detected"
- Remove inline styles
- Use existing classes from `styles/globals.css`
- Never add new styles without approval

### Performance Targets
- API Response: <400ms
- Database Queries: <200ms
- Page Load: <3s
- Classification Accuracy: 85%+

### Workflow Components

Main orchestrator: `components/workflow/USMCAWorkflowOrchestrator.js`
Steps flow:
1. `CompanyInformationStep.js` - Company profile
2. `ComponentOriginsStepEnhanced.js` - Component tracking
3. `WorkflowResults.js` - Results & certificate

### Environment Requirements

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

### Monitoring & Status

- System Status API: `/api/system-status`
- Visual Dashboard: `/system-status`
- Health check shows database connectivity, table records, API status

### Development Workflow

1. Check database connection: `node test-database-connection.js`
2. Start dev server: `npm run dev`
3. Monitor status: http://localhost:3000/system-status
4. Test APIs: Use curl or browser dev tools
5. Before commit: `npm run protection:full`

### Key Implementation Notes

- Platform uses Pages Router, not App Router
- All data configuration-driven (no hardcoding)
- Admin dashboards gracefully handle empty tables
- AI classification caches context per company
- PDF certificates generated with jsPDF
- Crisis monitoring via RSS feed integration
- Sample data ensures platform demos well