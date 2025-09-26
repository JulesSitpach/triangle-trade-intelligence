# CLAUDE.md - Triangle Intelligence Platform

## 📋 Project Overview

**Triangle Intelligence Platform** - A professional USMCA compliance and certificate generation platform with hybrid SaaS + expert services model.

**Core Value**: AI-enhanced expert services for Mexico/Latin America trade bridge serving North American importers/exporters.

**Business Model**: Tiered subscriptions ($99-599/month) + Professional services ($200-650 per service) with AI acceleration.

---

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 (Pages Router), React 18
- **Database**: Supabase PostgreSQL (34,476+ HS codes)
- **AI Integration**: Enhanced Classification Agent with web search, Claude API for content generation
- **Styling**: Existing CSS classes only (NO Tailwind, NO inline styles)

### Core Principles
- **Enhanced Classification Agent**: Web search verification + database validation
- **AI + Human Hybrid**: AI research/drafts → Human validation/relationships
- **Mexico Trade Bridge**: Bilingual team advantage, cultural understanding
- **Database-Driven**: NO hardcoded data, configuration-driven

---

## 👤 User Experience & Workflow

### Main User Journey
```
1. Homepage → USMCA Workflow (2 steps)
2. Company Info + Product Analysis → Results
3. Two paths: Certificate Generation OR Trade Alerts
4. Professional Services: /services/logistics-support
```

### Key User Pages
- **`/`** - Homepage with value proposition
- **`/usmca-workflow`** - Main 2-step compliance analysis
- **`/usmca-results`** - Analysis results with dual paths
- **`/usmca-certificate-completion`** - Optional certificate generation
- **`/trade-risk-alternatives`** - Crisis monitoring and alerts
- **`/services/logistics-support`** - Professional services selection

### User Workflow Components
```
components/workflow/
├── USMCAWorkflowOrchestrator.js    # Main workflow controller
├── CompanyInformationStep.js       # Step 1: Company data
├── ComponentOriginsStepEnhanced.js # Step 2: Product analysis
├── WorkflowResults.js              # Results display
└── AuthorizationStep.js            # Certificate completion
```

### Critical User Data Flow
- **Step 1-2**: localStorage (immediate storage)
- **Results**: User chooses Certificate OR Alerts path
- **Database**: Only saves when user selects professional services
- **No automatic tracking**: Users control data sharing

---

## 👨‍💼 Admin Dashboard Architecture

### Dashboard Access
- **Cristina**: `/admin/broker-dashboard` - Compliance Services (3 services)
- **Jorge**: `/admin/jorge-dashboard` - Mexico/Latin America Services (3 services)

### Service Implementation Patterns

#### Pattern 1: 2-Stage Quick Validation (Cristina - Same Day)
```javascript
// For: USMCA Certificates, HS Classification
const workflowStages = {
  1: 'Data Review',           // Review subscriber workflow data
  2: 'AI + Expert Validation' // Generate/validate + deliver
};
```

#### Pattern 2: 3-Stage Research Services (Multi-Day)
```javascript
// For: Crisis Response, Manufacturing Feasibility, Market Entry, Supplier Sourcing
const workflowStages = {
  1: 'Requirements Collection', // Minimal 3-5 question intake
  2: 'AI Analysis',            // Automated research + drafts
  3: 'Expert Validation'       // Human review + final deliverable
};
```

### Service Definitions (6 Total)

#### Cristina's Services (3)
**🔄 USMCA Certificates ($250) - 2-Stage Workflow**
- **Stage 1**: Data Review - Display existing subscriber data, no new forms
- **Stage 2**: Certificate Generation - Enhanced Classification Agent + PDF generation
- **Component**: `components/cristina/USMCACertificateTab.js`
- **API**: `/api/generate-usmca-certificate.js`

**🔄 HS Classification ($200) - 2-Stage Workflow**
- **Stage 1**: Product Review - Display subscriber product + component data
- **Stage 2**: Expert Validation - Enhanced Classification Agent web search + validation
- **Component**: `components/cristina/HSClassificationTab.js`
- **API**: `/api/validate-hs-classification.js`

**🔄 Crisis Response ($500) - 3-Stage Workflow**
- **Stage 1**: Crisis Description - 4 question intake form
- **Stage 2**: Analysis - AI impact analysis using subscriber trade profile
- **Stage 3**: Action Plan - Cristina creates specific action plan + prevention
- **Component**: `components/cristina/CrisisResponseTab.js`
- **API**: `/api/crisis-response-analysis.js`

#### Jorge's Services (3)
**✅ Supplier Sourcing ($500) - 3-Stage Workflow** (IMPLEMENTED)
- **Stage 1**: Sourcing Requirements - 5 question intake
- **Stage 2**: AI Supplier Discovery - Automated supplier research
- **Stage 3**: Network Validation - Jorge validates + adds Mexico contacts
- **Component**: `components/jorge/SupplierSourcingTab.js` ✅
- **API**: `/api/supplier-sourcing-discovery.js` ✅

**🔄 Manufacturing Feasibility ($650) - 3-Stage Workflow**
- **Stage 1**: Manufacturing Context - 5 question intake
- **Stage 2**: AI Analysis - Location analysis + cost estimates
- **Stage 3**: Jorge's Recommendation - Go/No-Go + location + next steps
- **Component**: `components/jorge/ManufacturingFeasibilityTab.js`
- **API**: `/api/manufacturing-feasibility-analysis.js`

**🔄 Market Entry ($450) - 3-Stage Workflow**
- **Stage 1**: Market Goals - 4 question intake
- **Stage 2**: Market Analysis - AI market research + opportunities
- **Stage 3**: Jorge's Strategy - Partnership recommendations + contacts
- **Component**: `components/jorge/MarketEntryTab.js`
- **API**: `/api/market-entry-analysis.js`

### Service Status Summary
**✅ Implemented:**
- Supplier Sourcing (Jorge) - Complete 3-stage workflow
- Enhanced Classification Agent - Web search + database validation

**🔄 Priority Build Order:**
1. **USMCA Certificates** (Cristina) - Highest volume, uses Enhanced Classification Agent
2. **HS Classification** (Cristina) - Uses existing web search agent
3. **Crisis Response** (Cristina) - New workflow
4. **Manufacturing Feasibility** (Jorge) - Copy supplier sourcing pattern
5. **Market Entry** (Jorge) - Copy supplier sourcing pattern

### Shared Components
```
components/shared/
└── ServiceWorkflowModal.js    # Reusable modal for all 6 services
```

### Data Flow Architecture
**All services use existing subscriber workflow data:**
- No duplicate data entry
- Pre-populated analysis from user's comprehensive profile
- Minimal new data collection (3-5 questions max per service)
- Professional delivery with subscriber context

### Expert Capacity Management
**Cristina's Services (Same Day):**
- USMCA Certificates: 40/month at $250 = $10,000 potential
- HS Classification: 60/month at $200 = $12,000 potential
- Crisis Response: 15/month at $500 = $7,500 potential

**Jorge's Services (2-5 Days):**
- Supplier Sourcing: 8/month at $500 = $4,000 potential
- Manufacturing Feasibility: 4/month at $650 = $2,600 potential
- Market Entry: 6/month at $450 = $2,700 potential

**Total Monthly Potential**: $38,800

---

## 🤖 AI Integration Strategy

### Enhanced Classification Agent (Competitive Advantage)
**6-Step Workflow with Web Search Verification:**
1. **Database First** → Query 34K+ HS codes (hs_master_rebuild table)
2. **Web Verification** → Real-time tariff rate validation via web search
3. **Compare & Flag** → Database vs web discrepancy analysis
4. **Update Database** → tariff_rates_staging table for review
5. **Context-Aware Response** → User-friendly vs Admin-technical responses
6. **Proactive Maintenance** → Automated data freshness monitoring

### Technology Choices by Service

**Enhanced Classification Agent (Primary):**
- USMCA certificate generation
- HS Code classification with web verification
- Real-time tariff rate validation
- Database learning and improvement

**AI Content Generation ($0.05-0.15):**
- Crisis analysis reports
- Supplier discovery research
- Manufacturing feasibility reports
- Market entry strategies

### AI API Endpoints
```
/api/generate-usmca-certificate.js     # USMCA certificate generation
/api/validate-hs-classification.js     # HS classification validation
/api/crisis-response-analysis.js       # Crisis analysis
/api/supplier-sourcing-discovery.js    # ✅ Supplier research (implemented)
/api/manufacturing-feasibility-analysis.js # Location analysis
/api/market-entry-analysis.js          # Market intelligence
```

### AI + Human Value Proposition
- **67% time reduction**: AI handles research, humans provide validation
- **Professional liability**: Licensed expert backing for all deliverables
- **Cultural bridge**: Mexico-based bilingual team advantage
- **Learning through service**: Jorge builds expertise with each project

---

## 🗄️ Database Schema

### Primary Tables
```
hs_master_rebuild          # 34,476 HS codes (PRIMARY tariff source)
tariff_rates              # 14,486 records (fallback - many 0% rates)
usmca_tariff_rates        # 48 records (limited but high-quality)
service_requests          # Professional service bookings
workflow_completions      # Completed user workflows
partner_suppliers         # AI-discovered suppliers for Jorge
user_profiles            # User accounts (empty = sample data mode)
```

### Database Connection Pattern
```javascript
// All admin APIs intelligently fall back to sample data
const { data, error } = await supabase.from('table').select('*');
if (error || !data || data.length === 0) {
  console.log('Using sample data for demo');
  return sampleData;
}
```

---

## 🎨 Styling Rules (CRITICAL)

### CSS Compliance (STRICTLY ENFORCED)
- **❌ FORBIDDEN**: Inline styles (`style={{}}` or `style=""`)
- **❌ FORBIDDEN**: Tailwind CSS classes
- **❌ FORBIDDEN**: New CSS files without approval
- **❌ FORBIDDEN**: Modifying `styles/globals.css`

### Available CSS Classes
```css
/* Use these existing classes */
.card, .card-title, .card-description
.btn-primary, .btn-secondary
.text-body, .nav-link
.dashboard-header, .dashboard-tabs
.form-group, .form-input
.service-request-card
.hero-content, .section-header
```

### CSS Validation
```bash
npm run css:check          # Validate CSS compliance
npm run protection:full    # Full protection check
```

---

## 📊 Business Intelligence

### Mexico Team Advantage
- **Bilingual communication** (English/Spanish)
- **Cultural bridge** for North American companies
- **Local Mexico expertise** and ground access
- **Time zone alignment** with North American clients
- **Cost advantage** while maintaining professional quality

---

## 🚀 Development Workflow

### Essential Commands
```bash
# Development (AGENTS USE 3001+)
npm run dev:3001              # Safe development server
npm run build                 # Production build
npm run clean:safe           # Safe cleanup (no process killing)

# Testing & Validation
npm test                     # Run all tests
npm run lint                 # ESLint validation
npm run css:check           # CSS compliance check
npm run protection:full     # Complete validation

# Database
npm run ingest:all          # Populate HS codes database
```

### Git Workflow
```bash
# Current branches
main                        # Main branch (use for PRs)
agent-orchestration-phase1  # Current development branch
```

### Implementation Priority
1. **Phase 1**: Complete Cristina's services (high ROI)
2. **Phase 2**: Complete Jorge's services (market expansion)
3. **Phase 3**: Optimization and analytics

---

## 🔧 Configuration Files

### Critical Configuration
- **`config/system-config.js`** - Central system configuration
- **`config/table-constants.js`** - Database table names
- **`config/usmca-thresholds.js`** - Industry USMCA thresholds
- **`.env.local`** - Environment variables (Supabase, Anthropic)

### Anti-Hardcoding Rules (CRITICAL)
**⛔ NEVER HARDCODE:**
- Company names, country codes, business types
- Trade volumes, HS codes, tariff rates
- Product descriptions, addresses, phone numbers
- Any business data that should come from user input

**✅ CORRECT APPROACH:**
- Use configuration objects for thresholds
- Pull data from user's workflow input
- Reference localStorage: `workflowData?.company?.name`
- Database-driven for legitimate defaults

---

## 📈 Success Metrics

### Technical KPIs
- API Response: <400ms
- Database Queries: <200ms
- Page Load: <3s
- Classification Accuracy: 85%+
- CSS Compliance: 100%

### Business KPIs
- Service Completion Rate: 99%+
- Expert Capacity Utilization: 70%+
- Client Satisfaction: 4.5/5+
- Revenue Per Service: Target margins maintained

---

## 🚨 Common Issues & Solutions

### "Database connected but using sample data"
- `user_profiles` table is empty (0 records)
- Normal behavior - APIs fall back to demo data
- Add real users to switch from sample data

### "CSS violation detected"
- Remove inline styles immediately
- Use existing classes from `styles/globals.css`
- Never add new styles without approval

### "HS Code not found"
- Format mismatch between input and database
- Use normalization utilities in `lib/utils/hs-code-normalizer.js`
- Priority: `hs_master_rebuild` → `usmca_tariff_rates` → `tariff_rates`

---

## 📚 Implementation Templates

### Adding New Service Dashboard
1. **Copy appropriate pattern** (2-stage or 3-stage)
2. **Create intake form** in `config/service-intake-forms.js`
3. **Create AI endpoint** `/api/[service]-[action].js`
4. **Add to navigation** in admin dashboard
5. **Test workflow** end-to-end

### Service Request Flow
```javascript
// Standard service request card
<div className="service-request-card">
  <div className="request-header">
    <h3>{service.title}</h3>
    <span className="request-price">${service.price}</span>
  </div>
  <div className="request-actions">
    <button onClick={() => startWorkflow(request)}>
      Start Service Delivery
    </button>
  </div>
</div>
```

---

**This CLAUDE.md provides the complete reference for both user experience and admin service delivery architecture, reflecting the current Triangle Intelligence Platform implementation.**