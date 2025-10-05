# CLAUDE.md - Triangle Intelligence Platform

## 📋 Project Overview

**Triangle Intelligence Platform** - A professional USMCA compliance and certificate generation platform with hybrid SaaS + expert services model.

**Core Value**: AI-enhanced expert services for Mexico/Latin America trade bridge serving North American importers/exporters.

**Business Model**: SMB-focused tiered subscriptions ($99-599/month) + Professional services ($200-650 per service) with automatic subscriber discounts (15-25% off).

---

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 (Pages Router), React 18
- **Database**: Supabase PostgreSQL (34,476+ HS codes)
- **AI Integration**: OpenRouter API with Claude models for all AI functionality
- **Styling**: Existing CSS classes only (NO Tailwind, NO inline styles)

### Development Server Port Assignment
- **Port 3000**: Reserved for USER - main development server for direct testing and console visibility
- **Port 3001**: Reserved for CLAUDE CODE agents - testing, debugging, and automated validation
- **Rationale**: User needs direct console visibility on port 3000 to see errors and debug output in real-time. Claude Code agents must use port 3001 to avoid interference.
- **Usage**: All Claude Code sessions should run `npm run dev:3001` for testing (never use `npm run dev` which uses port 3000)

### Core Principles
- **USMCA Optimization Focus**: Help North American companies maximize USMCA benefits and prepare for potential agreement changes
- **AI + Human Hybrid**: AI strategic analysis → Human execution and relationship building
- **Mexico Trade Bridge**: Bilingual team advantage, cultural understanding, B2B sales expertise
- **Hybrid Architecture**: AI for context analysis, Config file for industry thresholds, Database for user data only - NO hardcoded fallbacks
- **Cookie-Based Auth**: HttpOnly cookies for secure session management (NOT Supabase auth tokens in localStorage)

---

## 💰 SMB-Focused Pricing Structure

### Subscription Tiers (Updated January 2025)

**Starter ($99/month)**
- 10 USMCA analyses per month
- Basic trade alerts
- Email support
- Certificate generation
- AI HS code suggestions
- No service discounts

**Professional ($299/month) ← Most SMBs land here**
- Unlimited USMCA analyses
- Real-time crisis alerts (tariff changes, trade disputes)
- **15% discount on all professional services**
- Priority support (48hr response)
- Advanced trade policy analysis

**Premium ($599/month) ← For high-volume SMBs**
- Everything in Professional
- **25% discount on all professional services**
- Quarterly 1-on-1 strategy calls with Jorge & Cristina
- Dedicated Slack/email support
- Custom trade intelligence reports

### Professional Service Pricing (All 6 Services)

**Compliance Services (Cristina) - 3 Services:**
1. **USMCA Certificate**: $250 base / $212 Professional / $188 Premium
2. **HS Classification**: $200 base / $170 Professional / $150 Premium
3. **Crisis Response**: $500 base / $425 Professional / $375 Premium

**Mexico Trade Services (Jorge) - 3 Services:**
4. **Supplier Sourcing**: $450 base / $383 Professional / $338 Premium
5. **Manufacturing Feasibility**: $650 base / $552 Professional / $488 Premium
6. **Market Entry Strategy**: $550 base / $467 Professional / $412 Premium

### Automatic Discount Logic

**Implementation** (`pages/api/stripe/create-service-checkout.js`):
```javascript
const TIER_DISCOUNTS = {
  'Starter': 0,          // No discount
  'Professional': 0.15,  // 15% off
  'Premium': 0.25        // 25% off
};

// Calculate price with subscriber discount
const basePrice = SERVICE_PRICES[service_id];
const userTier = user.subscription_tier || 'Trial';
const discount = TIER_DISCOUNTS[userTier] || 0;

// Apply discount automatically
let servicePrice = basePrice;
if (discount > 0) {
  servicePrice = Math.round(basePrice * (1 - discount));
}
```

**Non-subscribers** pay base price (same as Starter tier).

---

## 👤 User Experience & Workflow

### Main User Journey
```
1. Homepage → USMCA Workflow (2 steps)
2. Company Info + Product Analysis → Results
3. Two paths: Certificate Generation OR Trade Alerts
4. Professional Services: /services/mexico-trade-services
```

### Key User Pages
- **`/`** - Homepage with value proposition
- **`/usmca-workflow`** - Main 2-step compliance analysis
- **`/usmca-results`** - Analysis results with dual paths
- **`/usmca-certificate-completion`** - Optional certificate generation
- **`/trade-risk-alternatives`** - Crisis monitoring and alerts
- **`/services/logistics-support`** - Professional services selection

### Service Selection Pricing (Current Reality)
- **Supplier Sourcing**: $450
- **Manufacturing Feasibility**: $650  
- **Market Entry**: $550

### User Workflow Components
```
components/workflow/
├── USMCAWorkflowOrchestrator.js    # Main workflow controller
├── CompanyInformationStep.js       # Step 1: Company data
├── ComponentOriginsStepEnhanced.js # Step 2: Product analysis
├── WorkflowResults.js              # Results display
└── AuthorizationStep.js            # Certificate completion
```

### Critical User Data Flow (Updated January 2025)
- **Step 1-2**: localStorage (immediate storage)
- **Results**: User chooses Certificate OR Alerts path
- **Auto-save to Database**: Workflow data automatically saved for alerts and services (with user consent)
- **Dashboard**: Dropdown + preview pattern for workflows and alerts
- **Privacy Controls**: Users can delete all workflow data from `/account/settings`

### Privacy Compliance Features (Added January 2025)
- **Privacy Policy**: Auto-save disclosure explaining what data is saved and why
- **Signup Consent**: Required checkbox agreeing to auto-save of workflow data
- **Account Settings**: `/account/settings` page with "Delete All Workflow Data" option
- **Delete API**: `/api/user/delete-workflow-data` permanently removes all user workflows and alerts
- **Double Confirmation**: Two-step process to prevent accidental data deletion

### Dashboard Experience (Updated January 2025)
**Dropdown + Preview Pattern:**
- **My Workflows**: Dropdown selector → Preview card with USMCA data → Action buttons
- **Trade Alerts**: Dropdown selector → Preview card with risk data → Action buttons
- **Monthly Usage**: Progress bar showing analyses used vs limit
- Auto-selects first workflow/alert on load

---

## 👨‍💼 Admin Dashboard Architecture

### Dashboard Access
- **Cristina**: `/admin/broker-dashboard` - Compliance Services (3 services)
- **Jorge**: `/admin/jorge-dashboard` - Mexico/Latin America Services (3 services)

### Team Expertise
**Jorge Ochoa**: B2B sales expert with 4+ years at CCVIAL, proven track record exceeding sales targets, consultative selling approach, bilingual (Spanish/English), experience in industrial/manufacturing sectors.

**Cristina Escalante**: Licensed customs broker (License #4601913) with 17 years logistics experience, specializing in electronics/telecom industries, international logistics director experience, HTS code expertise.

### Service Implementation Patterns

#### 3-Stage Professional Service Workflow (All Services)
```javascript
// Universal pattern for all 6 professional services
const workflowStages = {
  1: 'Professional Assessment',  // Expert review with strategic context gathering
  2: 'AI-Enhanced Analysis',     // OpenRouter API analysis with business intelligence
  3: 'Expert Validation'         // Professional delivery with human expertise
};
```

**Workflow Architecture:**
- **Stage 1**: Professional reviews subscriber data, asks strategic questions, assesses requirements
- **Stage 2**: AI analysis using OpenRouter API (Claude models) with complete business context
- **Stage 3**: Expert validates AI recommendations, adds professional insight, delivers final service

**Implementation Details:**
- All stages use `ServiceWorkflowModal.js` for consistent UX
- Database updates at each stage for real-time progress tracking
- Toast notifications for user feedback and status updates
- Error boundaries for graceful error handling
- CSS-compliant styling using existing classes only

### Service Definitions (6 Total)

#### Cristina's Services (3)
**✅ USMCA Certificates - 3-Stage Workflow (COMPLETE)**
- **Pricing**: $250 base / $212 Professional (15% off) / $188 Premium (25% off)
- **Stage 1**: Regulatory Assessment - Professional compliance risk evaluation
- **Stage 2**: Expert Validation - Licensed customs broker detailed review
- **Stage 3**: Professional Certification - Final validation and PDF certificate generation
- **Component**: `components/cristina/USMCACertificateTab.js` ✅ **BUILT**
- **API**: `/api/regenerate-usmca-certificate.js`, `/api/add-certificate-data.js` ✅ **BUILT**
- **Features**: Full CRUD, search/filter, pagination, risk assessment, real-time status updates

**✅ HS Classification - 3-Stage Workflow (COMPLETE)**
- **Pricing**: $200 base / $170 Professional (15% off) / $150 Premium (25% off)
- **Stage 1**: Classification Review - AI-powered HS code analysis
- **Stage 2**: Regulatory Validation - Professional customs broker verification
- **Stage 3**: Professional Certification - Final classification with regulatory notes
- **Component**: `components/cristina/HSClassificationTab.js` ✅ **BUILT**
- **API**: `/api/validate-hs-classification.js` ✅ **BUILT**
- **Features**: Complete workflow integration, OpenRouter API integration, database-driven

**✅ Crisis Response - 3-Stage Workflow (COMPLETE)**
- **Pricing**: $500 base / $425 Professional (15% off) / $375 Premium (25% off)
- **Stage 1**: Crisis Assessment - Professional evaluation using logistics management experience
- **Stage 2**: Impact Analysis - AI analysis + Cristina's supply chain expertise
- **Stage 3**: Professional Action Plan - Expert crisis management plan with timeline
- **Component**: `components/cristina/CrisisResponseTab.js` ✅ **BUILT**
- **API**: `/api/crisis-response-analysis.js` ✅ **BUILT**
- **Features**: Real crisis scenario analysis, logistics expertise integration

#### Jorge's Services (3)
**✅ Supplier Sourcing - 3-Stage Workflow (COMPLETE)**
- **Pricing**: $450 base / $383 Professional (15% off) / $338 Premium (25% off)
- **Stage 1**: Strategic Priority Question - Single question: "What's your top priority for Mexico supplier sourcing?" (Cost Savings, Quality & Compliance, Fast Transition, or Balanced) + optional notes
- **Stage 2**: AI Supplier Discovery - OpenRouter API finds 5 Mexico suppliers with web search integration
- **Stage 3**: Jorge's Verification & Report - Jorge calls suppliers to verify capabilities, documents findings, generates client DIY plan + optional hourly services
- **Component**: `components/jorge/SupplierSourcingTab.js` ✅ **BUILT**
- **API**: `/api/supplier-sourcing-discovery.js`, `/api/generate-supplier-sourcing-report.js` ✅ **BUILT**
- **Deliverable**: ~500 word report with: 5 verified suppliers → 4-week DIY plan → Optional hourly support ($150-200/hr)

**✅ Manufacturing Feasibility - 3-Stage Workflow (COMPLETE)**
- **Pricing**: $650 base / $552 Professional (15% off) / $488 Premium (25% off)
- **Stage 1**: Strategic Priority Question - Single question: "What's your top priority for Mexico manufacturing?" (Cost Savings, Quality Control, Fast Setup, or Strategic Location) + optional notes
- **Stage 2**: AI Analysis - Location analysis + cost estimates for 3 Mexico manufacturing sites
- **Stage 3**: Jorge's Research & Report - Jorge researches viable locations, documents findings, generates client DIY plan + optional hourly services
- **Component**: `components/jorge/ManufacturingFeasibilityTab.js` ✅ **BUILT**
- **API**: `/api/manufacturing-feasibility-analysis.js`, `/api/generate-manufacturing-feasibility-report.js` ✅ **BUILT**
- **Deliverable**: ~500 word report with: 3 validated locations → 4-week DIY plan → Optional hourly support ($150-200/hr)

**✅ Market Entry Strategy - 3-Stage Workflow (COMPLETE)**
- **Pricing**: $550 base / $467 Professional (15% off) / $412 Premium (25% off)
- **Stage 1**: Strategic Priority Question - Single question: "What's your top priority for Mexico market entry?" (Revenue Growth, Market Share, Brand Presence, or Distribution Network) + optional notes
- **Stage 2**: AI Market Analysis - OpenRouter API researches 3-4 Mexico market opportunities
- **Stage 3**: Jorge's Research & Report - Jorge researches market opportunities, documents findings, generates client DIY plan + optional hourly services
- **Component**: `components/jorge/MarketEntryTab.js` ✅ **BUILT**
- **API**: `/api/market-entry-analysis.js`, `/api/generate-market-entry-report.js` ✅ **BUILT**
- **Deliverable**: ~500 word report with: 3-4 market opportunities → 4-week DIY plan → Optional hourly support ($150-200/hr)

### Service Status Summary
**✅ ALL 6 COMPONENTS COMPLETED - PRODUCTION READY**

All dashboard components and supporting API endpoints have been fully implemented and tested.

**✅ Completed Build Order:**
1. ✅ **ServiceWorkflowModal.js** - Shared reusable modal component for all services
2. ✅ **ToastNotification.js** - Toast notification system for user feedback
3. ✅ **ErrorBoundary.js** - Error handling component
4. ✅ **USMCACertificateTab.js** (Cristina) - Full 3-stage workflow with risk assessment
5. ✅ **HSClassificationTab.js** (Cristina) - Complete HS code validation workflow
6. ✅ **CrisisResponseTab.js** (Cristina) - Crisis management and response workflow
7. ✅ **SupplierSourcingTab.js** (Jorge) - Mexico supplier discovery with web search
8. ✅ **ManufacturingFeasibilityTab.js** (Jorge) - Comprehensive feasibility analysis
9. ✅ **MarketEntryTab.js** (Jorge) - Market entry strategy and intelligence

### Shared Components (All Built)
```
components/shared/
├── ServiceWorkflowModal.js    ✅ Reusable modal for all 6 services
├── ToastNotification.js       ✅ User feedback system
└── ErrorBoundary.js           ✅ Error handling component
```

### Key Implementation Achievements
- **Database-Driven**: All components use Supabase with real-time updates
- **OpenRouter Integration**: All services use Claude models via OpenRouter API
- **Type Safety**: Fixed runtime errors (volume.includes, null handling)
- **Professional UX**: Search, filtering, pagination, sorting on all dashboards
- **Risk Assessment**: Automated compliance risk scoring for USMCA certificates
- **Real-time Status**: Live progress tracking across all service workflows
- **CSS Compliant**: No inline styles, uses existing CSS classes only

### Data Flow Architecture
**All services leverage existing subscriber workflow data:**
- Complete business intelligence profile from USMCA workflow
- No duplicate data entry
- **Jorge's services: Single strategic priority question + optional notes (Stage 1)**
- AI does research/analysis (Stage 2)
- Jorge verifies/documents findings and generates ~500 word actionable report (Stage 3)
- Professional delivery with full business context

### Expert Value Proposition & Deliverables
**Jorge's Real Value (Updated Workflow):**
- **What's included in $450-650**: AI research + Jorge's verification calls/research + actionable report with DIY plan
- **Report structure**: Options/suppliers/locations found → 4-week client DIY plan → Optional hourly services
- **Optional hourly support**: $150-200/hr for Spanish negotiations, site visits, relationship building, implementation coordination
- **Client decides**: Get research & roadmap included, pay hourly only if they need Jorge's execution help

**Cristina's Real Value:**
- Licensed customs broker validation (Legal weight)
- 17 years electronics/telecom logistics experience
- Professional regulatory compliance expertise
- HTS code classification with professional backing

---

## 🤖 AI Integration Strategy

### OpenRouter API Integration (Current Reality)
**All AI functionality uses OpenRouter API with Claude models:**

```javascript
// Standard API pattern for all services
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "anthropic/claude-3-haiku",
    messages: [{
      role: "user", 
      content: `BUSINESS CONTEXT:
Company: ${subscriberData.company_name}
Product: ${subscriberData.product_description}
Current USMCA Qualification: ${subscriberData.qualification_status}
Annual Trade Volume: $${subscriberData.trade_volume}

TASK: ${serviceSpecificPrompt}`
    }]
  })
});
```

### AI Service Applications
**USMCA Certificate Generation**: OpenRouter API for classification verification
**HS Code Validation**: OpenRouter API for regulatory compliance analysis
**Crisis Response**: OpenRouter API for impact analysis and resolution strategies
**Supplier Sourcing**: OpenRouter API for Mexico supplier research and analysis
**Manufacturing Feasibility**: OpenRouter API for location analysis and cost estimates
**Market Entry**: OpenRouter API for Mexico market research and opportunity analysis

### AI + Human Value Proposition
- **Strategic AI Analysis**: Comprehensive research and recommendations using complete business context
- **Professional Human Execution**: Licensed expertise and relationship building AI cannot provide
- **Cultural Bridge**: Mexico-based bilingual team advantage for North American companies
- **Implementation Focus**: AI provides strategy, humans ensure execution and results

---

## 🔄 Hybrid Architecture (USMCA Workflow)

### Architecture Decision: AI + Config File + Database

**Updated January 2025**: Implemented hybrid approach for USMCA workflow optimization.

### What Uses What:

**🤖 AI (OpenRouter API):**
- HS code classification (context-dependent, changes frequently)
- Product-specific remediation recommendations (requires contextual analysis)
- Tariff rate lookups (will add when database is incomplete)
- Complex business logic requiring judgment

**📄 Config File (`config/usmca-thresholds.js`):**
- USMCA regional content thresholds by industry (fixed by treaty)
- Official threshold sources (yarn-forward, regional value content, etc.)
- Qualification rule types (tariff shift, wholly obtained, etc.)
- Industry-specific documentation requirements

**🗄️ Database (Supabase):**
- User data (companies, workflows, service requests)
- Component origins (user input from workflow)
- Historical workflow results for analytics
- Admin dashboard data (service completions, certificates)

### Why This Approach:

**For Early Stage (Current):**
- ✅ Correct thresholds from official USMCA treaty (no database sync needed)
- ✅ Product-specific AI recommendations (better than generic advice)
- ✅ Fast iteration (no database migrations for threshold updates)
- ✅ Low cost (~$0.005 per workflow = half a cent)

**For Scale (Future):**
- Cache common HS code requests when patterns emerge (>1000 users/month)
- Store AI-generated recommendations for reuse when costs increase
- Build Mexico supplier database when we have real usage data

### Data Flow Architecture:

```javascript
// USMCA Qualification Check Flow
1. User Input → ComponentOriginsStepEnhanced.js
   ↓
2. Form Data → useWorkflowState hook (localStorage + database)
   ↓
3. API Call → POST /api/database-driven-usmca-compliance
   ↓
4. Threshold Lookup → config/usmca-thresholds.js (NOT database)
   ↓ getUSMCAThreshold(businessType, hsCode)
   ↓ Returns: { threshold: 55, source: 'usmca_treaty_chapter_6_yarn_forward' }
   ↓
5. Calculation → database-driven-usmca-engine.js
   ↓ calculateRegionalContent(components, usmcaCountries, rules)
   ↓
6. If Not Qualified → AI Recommendations
   ↓ OpenRouter API with full business context
   ↓ Prompt includes: business type, product, component descriptions
   ↓ Returns: ["Replace India fabric with Mexico textile mills", ...]
   ↓
7. Results → WorkflowResults.js
```

### Critical Implementation Details:

**Threshold Lookup (Fixed January 2025):**
```javascript
// database-driven-usmca-engine.js lines 91-120
async getQualificationRules(hsCode = null, businessType = null) {
  // Import config file directly (NOT database query)
  const { getUSMCAThreshold } = await import('../../config/usmca-thresholds.js');

  // Get threshold based on business type
  const thresholdData = await getUSMCAThreshold(businessType, hsCode);

  // Textiles → 55%, Electronics → 65%, Automotive → 75%
  return {
    rule_type: thresholdData.rule_type,
    regional_content_threshold: thresholdData.threshold,
    source: thresholdData.source
  };
}
```

**AI Recommendations (Added January 2025):**
```javascript
// database-driven-usmca-compliance.js lines 750-859
async function generateWorkflowRecommendations(product, usmca, savings, formData) {
  if (!usmca.qualified && formData) {
    // Build component breakdown with descriptions
    const componentBreakdown = formData.component_origins
      ?.map(c => `- ${c.value_percentage}% from ${c.origin_country} (${c.description})`)
      .join('\n');

    const prompt = `You are a USMCA compliance expert...

    COMPANY CONTEXT:
    - Business Type: ${formData.business_type}
    - Product: ${formData.product_description}
    - Component Breakdown: ${componentBreakdown}

    Generate 3-4 specific recommendations to achieve USMCA qualification.
    Be specific to this product type (textiles, electronics, etc.)`;

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      model: 'anthropic/claude-3-haiku',
      messages: [{ role: 'user', content: prompt }]
    });

    // Parse AI recommendations
    const aiRecommendations = JSON.parse(response.choices[0].message.content);
    return aiRecommendations;
  }
}
```

**No Fallback Data (Critical Change):**
```javascript
// All emergency fallbacks REMOVED (January 2025)
// System now fails loudly to expose missing data

// BEFORE (Wrong):
if (!rules) {
  return { threshold: 62.5, source: 'emergency_fallback' };  // ❌ Fake data
}

// AFTER (Correct):
if (!rules) {
  throw new Error('USMCA rules not found - config file incomplete');  // ✅ Fail loudly
}
```

### Cost Analysis:

**Per Workflow:**
- HS code classification: ~$0.003 (Claude Haiku)
- AI recommendations (if not qualified): ~$0.002 (Claude Haiku)
- Total: **~$0.005 per workflow**

**Monthly Estimates:**
- 100 users: $0.50/month (negligible)
- 1,000 users: $5/month (still cheap)
- 10,000 users: $50/month (time to add caching)

**When to Migrate to Full Database:**
- Database caching when AI costs >$50/month
- Store common HS code patterns for reuse
- Cache AI recommendations for similar products

---

## 🗄️ Database Schema

### Primary Tables
```sql
-- Service requests table (CONFIRMED EXISTS)
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  client_company TEXT NOT NULL,
  service_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  price DECIMAL(10,2),
  subscriber_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service completions table (NEEDS CREATION)
CREATE TABLE service_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID REFERENCES service_requests(id),
  completion_data JSONB,
  report_url TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Subscriber Data Structure (From USMCA Workflow)
```javascript
// Expected structure in subscriber_data JSONB field
const subscriberDataStructure = {
  company_name: "string",
  business_type: "string",
  trade_volume: "string",
  manufacturing_location: "string",
  product_description: "string",
  component_origins: [{ 
    country: "string", 
    percentage: "number",
    component_type: "string" 
  }],
  qualification_status: "QUALIFIED" | "NOT_QUALIFIED" | "PARTIAL",
  annual_tariff_cost: "number",
  potential_usmca_savings: "number",
  compliance_gaps: "array",
  vulnerability_factors: "array"
};
```

### Database Connection Pattern
```javascript
// All admin APIs fall back to sample data if no real data
const { data, error } = await supabase
  .from('service_requests')
  .select('*')
  .eq('service_type', serviceType)
  .eq('status', 'pending');

if (error || !data || data.length === 0) {
  console.log('Using sample data for demo');
  return generateSampleServiceRequests();
}
```

---

## 🎨 Styling Rules (CRITICAL)

### CSS Compliance (STRICTLY ENFORCED)
- **❌ FORBIDDEN**: Inline styles (`style={{}}` or `style=""`)
- **❌ FORBIDDEN**: Tailwind CSS classes
- **❌ FORBIDDEN**: Creating new CSS files without approval
- **✅ REQUIRED**: Use existing classes from `styles/globals.css` and `styles/admin-workflows.css`

### Available CSS Classes
```css
/* Use these existing classes from styles/globals.css and styles/admin-workflows.css */
.card, .card-title, .card-description
.btn-primary, .btn-secondary
.text-body, .nav-link
.dashboard-header, .dashboard-tabs
.form-group, .form-input
.service-request-card
.hero-content, .section-header
.modal-overlay, .modal-content
.stage-progress, .workflow-actions
```

### CSS Validation
```bash
npm run css:check          # Validate CSS compliance
npm run protection:full    # Full protection check
```

---

## 📊 Business Intelligence Focus

### USMCA Optimization Strategy
**Current USMCA Benefits**: Maximize existing trade agreement advantages
**Renegotiation Preparation**: Build Mexico relationships for post-USMCA scenarios
**Geographic Advantage**: Mexico proximity benefits regardless of trade agreements
**Supply Chain Resilience**: Reduce dependency on distant suppliers

### Mexico Team Advantage
- **Jorge**: Proven B2B sales methodology, Spanish fluency, industrial sector experience
- **Cristina**: Licensed customs broker, 17 years logistics experience, electronics expertise
- **Cultural Bridge**: Direct access to Mexico business networks and practices
- **Time Zone Alignment**: Same business hours as North American clients
- **Cost Advantage**: Professional quality at competitive Mexico rates

---

## 🚀 Development Workflow

### Essential Commands
```bash
# Development
npm run dev                 # Development server (use port 3000)
npm run build              # Production build
npm run start              # Production server

# Testing & Validation
npm test                   # Run all tests
npm run lint              # ESLint validation
npm run css:check         # CSS compliance check
```

### Implementation Status
✅ **Phase 1 COMPLETE**: All 6 dashboard components and shared components built
✅ **Phase 2 COMPLETE**: All 6 supporting API endpoints implemented
✅ **Phase 3 COMPLETE**: Integration testing and optimization completed

### Recent Bug Fixes & Improvements (January 2025)

**🔥 CRITICAL: Hybrid Architecture Implementation**
- **Fixed wrong USMCA thresholds**: Textiles now show 55% (was 62.5%), Electronics 65%, Automotive 75%
- **Removed database threshold lookup**: Now uses `config/usmca-thresholds.js` directly (fixed by treaty)
- **Added AI-powered recommendations**: Product-specific advice using OpenRouter API with full business context
- **Removed all emergency fallbacks**: System fails loudly to expose missing data (no more fake results)
- **Fixed textile bug**: Recommendations now say "Replace India fabric" not "Replace TW sensor components"

**Data Flow Fixes:**
- Component descriptions now flow through entire system (preserved for AI recommendations)
- Threshold lookup uses config file → AI recommendations → database for user data only
- No hardcoded business data (all configuration-driven or AI-generated)

**Cost Optimization:**
- Hybrid approach: ~$0.005 per workflow (half a cent)
- AI only for context-dependent analysis (HS codes, recommendations)
- Config file for fixed industry thresholds (no API calls needed)
- Database for user data only (minimal query costs)

**Architecture Improvements (September 2025):**
- Standardized all services to 3-stage workflow pattern
- Created reusable ServiceWorkflowModal component
- Implemented ErrorBoundary for graceful error handling
- Added ToastNotification system for user feedback

**Runtime Error Fixes (September 2025):**
- Fixed `TypeError: volume.includes is not a function` in USMCACertificateTab
- Added type safety with `String()` conversion for all subscriber data fields
- Improved null/undefined handling across all components

**Database Integration (September 2025):**
- All admin components use real Supabase data (no mock data)
- Added CRUD operations for service requests
- Implemented real-time status tracking
- Sample data fallback for admin demo purposes only (user workflow has NO fallbacks)

---

## 🔧 Configuration Files

### Critical Configuration
- **`.env.local`** - Environment variables (Supabase, OpenRouter)
- **`styles/globals.css`** - Global styles
- **`styles/admin-workflows.css`** - Admin dashboard styles

### Anti-Hardcoding Rules (CRITICAL)
**⛔ NEVER HARDCODE:**
- Company names, country codes, business types
- Trade volumes, HS codes, tariff rates
- Product descriptions, addresses, phone numbers
- Any business data that should come from subscriber workflow

**✅ CORRECT APPROACH:**
- Use subscriber_data from service requests
- Pull data from localStorage: `workflowData?.company?.name`
- Configuration-driven defaults only

---

## 📈 Success Metrics

### Technical KPIs
- Component Rendering: No errors
- API Response: <400ms
- Database Queries: <200ms
- OpenRouter Integration: Successful responses
- CSS Compliance: 100%

### Business KPIs
- Service Request Processing: All 6 services functional
- Expert Workflow Completion: End-to-end functionality
- Data Integration: Subscriber context properly utilized
- Professional Delivery: Expert validation working

---

## 🚨 Implementation Requirements

### Dashboard Components Must:
1. **Load service requests** from Supabase without errors
2. **Display subscriber data** correctly from JSONB field
3. **Open modal workflows** when service buttons clicked
4. **Navigate between stages** successfully
5. **Make OpenRouter API calls** with business context
6. **Update service status** in database on completion
7. **Handle loading states** and errors gracefully
8. **Use existing CSS classes** only (no inline styles)

### API Endpoints Must:
1. **Accept service request data** with subscriber context
2. **Make OpenRouter API calls** with structured prompts
3. **Process AI responses** appropriately
4. **Return structured data** for dashboard display
5. **Update database records** on completion
6. **Handle errors gracefully** with meaningful messages

---

## 📚 Implementation Templates

### Service Request Card Template
```javascript
<div className="service-request-card">
  <h3>{serviceType} - {request.client_company}</h3>
  <p>Product: {request.subscriber_data.product_description}</p>
  <p>USMCA Status: {request.subscriber_data.qualification_status}</p>
  <p>Trade Volume: ${request.subscriber_data.trade_volume}</p>
  <button onClick={() => startWorkflow(request)} className="btn-primary">
    Start {serviceType}
  </button>
</div>
```

### OpenRouter API Call Template
```javascript
const analyzeWithAI = async (subscriberData, serviceContext) => {
  const prompt = `BUSINESS CONTEXT:
Company: ${subscriberData.company_name}
Product: ${subscriberData.product_description}
Current USMCA Status: ${subscriberData.qualification_status}
Annual Trade Volume: $${subscriberData.trade_volume}

SERVICE REQUEST: ${serviceContext}

Provide strategic analysis and recommendations.`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "anthropic/claude-3-haiku",
      messages: [{ role: "user", content: prompt }]
    })
  });

  return await response.json();
};
```

---

**This CLAUDE.md reflects the current reality of the Triangle Intelligence Platform and provides accurate guidance for building the dashboard components and supporting infrastructure.**

## SMB Pricing Value Proposition (Updated January 2025)

**Starter Tier ($99/month):**
- 10 USMCA analyses/month
- Basic trade alerts
- No service discounts
- Perfect for testing the platform

**Professional Tier ($299/month) ← Most SMBs land here:**
- Unlimited USMCA analyses
- Real-time crisis alerts
- **15% automatic discount on all services**
- Priority 48hr support

**Premium Tier ($599/month):**
- Everything in Professional
- **25% automatic discount on all services**
- Quarterly strategy calls with Jorge & Cristina
- Dedicated Slack/email support

**Non-subscribers:**
- One-off service requests
- Pay base price (no discount)
- Can use public intake forms

### When Do Users Need Services?

**Path 1: USMCA Analysis shows "NOT QUALIFIED"**
- User discovers they can't use USMCA benefits
- They need help: "How do I restructure my supply chain?"
- **Jorge's services:** Find Mexico suppliers, set up manufacturing there
- Goal: Restructure to BECOME qualified

**Path 2: Trade Risk Alerts trigger**
- User gets alert: "Tariffs increasing on Chinese components"
- They're currently qualified but at risk
- **Jorge's services:** Find alternative suppliers to maintain qualification
- **Cristina's services:** Crisis response, compliance help

**Path 3: User is qualified but wants optimization**
- Certificate generated successfully
- But they see potential savings with better sourcing
- **Jorge's services:** Find cheaper Mexico suppliers
- Maintain qualification while reducing costs

The services are for **fixing problems** or **optimization**, not for people who are already compliant and happy.

---

## 📚 Additional Documentation

### Hybrid Architecture Implementation (January 2025)
- **`HYBRID_FIXES_APPLIED.md`** - Complete documentation of hybrid approach implementation
  - All 4 fixes applied (thresholds, AI recommendations, component data, fallback removal)
  - Testing checklist with expected results
  - Cost analysis and migration strategy

### Data Flow & Bug Analysis
- **`USMCA_DATA_FLOW_BUGS.md`** - Detailed analysis of bugs found and fixed
  - Complete data flow from user input to results
  - All fallback data locations documented
  - Required fixes with before/after code examples

### Key Takeaways from Documentation:
1. **Config file is source of truth** for USMCA thresholds (not database)
2. **AI generates product-specific recommendations** using OpenRouter API
3. **No emergency fallbacks** - system fails loudly to expose missing data
4. **Component descriptions preserved** through entire flow for AI context
5. **Cost per workflow: ~$0.005** (half a cent per user)

---

## Recent Updates (January 2025)

### SMB-Focused Pricing Implementation
- **New Tier Structure**: Starter ($99) → Professional ($299) → Premium ($599)
- **Usage Limits**: Starter gets 10 analyses/month, Pro/Premium unlimited
- **Automatic Discounts**: Professional 15% off, Premium 25% off all services
- **Pricing APIs**: Updated checkout, service pricing, and Stripe configuration
- **Dashboard Updates**: Usage limits reflect new tier structure

### Privacy & Compliance Features
- **Privacy Policy**: Auto-save disclosure explaining data usage
- **Signup Consent**: Required checkbox for workflow data storage
- **Account Settings**: New `/account/settings` page with data deletion
- **Delete API**: Complete workflow data deletion endpoint
- **GDPR/CCPA Ready**: Double confirmation for data deletion

### Dashboard Improvements
- **Dropdown + Preview Pattern**: Clean UX for workflows and alerts
- **Auto-Save with Consent**: Workflow data saved for alerts and services
- **User Control**: Can delete all data from settings anytime
- **Better Navigation**: Clear action buttons based on qualification status

### Stripe Integration Updates
- **Tier Identifiers**: Changed from business/enterprise to starter/professional/premium
- **Discount Calculation**: Automatic tiered pricing based on user subscription
- **Service Checkout**: Returns discount info in API response
- **Public Checkout**: Non-subscribers pay base price

---

**This CLAUDE.md reflects the current reality of the Triangle Intelligence Platform (January 2025) with SMB-focused pricing, privacy compliance, and hybrid architecture.**