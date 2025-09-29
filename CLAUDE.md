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
- **AI Integration**: OpenRouter API with Claude models for all AI functionality
- **Styling**: Existing CSS classes only (NO Tailwind, NO inline styles)

### Core Principles
- **USMCA Optimization Focus**: Help North American companies maximize USMCA benefits and prepare for potential agreement changes
- **AI + Human Hybrid**: AI strategic analysis → Human execution and relationship building
- **Mexico Trade Bridge**: Bilingual team advantage, cultural understanding, B2B sales expertise
- **Database-Driven**: NO hardcoded data, configuration-driven

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
- **`/services/mexico-trade-services`** - Professional services selection

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

### Team Expertise
**Jorge Ochoa**: B2B sales expert with 4+ years at CCVIAL, proven track record exceeding sales targets, consultative selling approach, bilingual (Spanish/English), experience in industrial/manufacturing sectors.

**Cristina Escalante**: Licensed customs broker (License #4601913) with 17 years logistics experience, specializing in electronics/telecom industries, international logistics director experience, HTS code expertise.

### Service Implementation Patterns

#### Pattern 1: 2-Stage Professional Validation (Cristina - Same Day)
```javascript
// For: USMCA Certificates, HS Classification
const workflowStages = {
  1: 'Expert Review',          // Professional review of subscriber data
  2: 'Professional Validation' // Licensed customs broker validation + delivery
};
```

#### Pattern 2: 3-Stage Strategic Services (Multi-Day)
```javascript
// For: Crisis Response, Manufacturing Feasibility, Market Entry, Supplier Sourcing
const workflowStages = {
  1: 'Strategic Preferences', // Leverage business intelligence for strategic questions
  2: 'AI Analysis',          // OpenRouter API analysis with complete business context
  3: 'Expert Execution'      // Human relationship building and implementation
};
```

### Service Definitions (6 Total)

#### Cristina's Services (3)
**🔄 USMCA Certificates ($250) - 2-Stage Workflow**
- **Stage 1**: Expert Review - Cristina reviews subscriber data for accuracy and compliance
- **Stage 2**: Professional Validation - Licensed customs broker validation + PDF generation
- **Component**: `components/cristina/USMCACertificateTab.js` (NEEDS BUILD)
- **API**: `/api/generate-usmca-certificate.js` (NEEDS BUILD)

**🔄 HS Classification ($200) - 2-Stage Workflow**
- **Stage 1**: Professional Review - Cristina reviews AI-suggested classifications
- **Stage 2**: Expert Validation - Professional customs broker validation with regulatory notes
- **Component**: `components/cristina/HSClassificationTab.js` (NEEDS BUILD)
- **API**: `/api/validate-hs-classification.js` (NEEDS BUILD)

**🔄 Crisis Response ($500) - 3-Stage Workflow**
- **Stage 1**: Crisis Assessment - Professional evaluation using logistics management experience
- **Stage 2**: Impact Analysis - AI analysis + Cristina's supply chain expertise
- **Stage 3**: Professional Action Plan - Expert crisis management plan with timeline
- **Component**: `components/cristina/CrisisResponseTab.js` (NEEDS BUILD)
- **API**: `/api/crisis-response-analysis.js` (NEEDS BUILD)

#### Jorge's Services (3)
**🔄 Supplier Sourcing ($450) - 3-Stage Workflow**
- **Stage 1**: USMCA Strategy Preferences - Strategic questions leveraging business intelligence
- **Stage 2**: AI Supplier Discovery - OpenRouter API finds Mexico suppliers
- **Stage 3**: B2B Execution - Jorge contacts suppliers in Spanish, verifies capabilities, builds relationships
- **Component**: `components/jorge/SupplierSourcingTab.js` (NEEDS BUILD)
- **API**: `/api/supplier-sourcing-discovery.js` (NEEDS BUILD)

**🔄 Manufacturing Feasibility ($650) - 3-Stage Workflow**
- **Stage 1**: Strategic Context - Manufacturing strategy preferences
- **Stage 2**: AI Analysis - Location analysis + cost estimates
- **Stage 3**: Professional Validation - Jorge validates recommendations using B2B experience
- **Component**: `components/jorge/ManufacturingFeasibilityTab.js` (NEEDS BUILD)
- **API**: `/api/manufacturing-feasibility-analysis.js` (NEEDS BUILD)

**🔄 Market Entry ($550) - 3-Stage Workflow**
- **Stage 1**: Mexico Market Strategy - Market entry approach for Mexico focus
- **Stage 2**: Market Analysis - AI market research + opportunities
- **Stage 3**: Relationship Building - Jorge builds Mexico market relationships using sales expertise
- **Component**: `components/jorge/MarketEntryTab.js` (NEEDS BUILD)
- **API**: `/api/market-entry-analysis.js` (NEEDS BUILD)

### Service Status Summary
**🔄 ALL COMPONENTS NEED TO BE BUILT:**
All 6 dashboard components and supporting API endpoints need implementation from scratch.

**🔄 Priority Build Order:**
1. **ServiceWorkflowModal.js** (Shared component for all services)
2. **USMCACertificateTab.js** (Cristina) - Highest volume, simplest 2-stage
3. **SupplierSourcingTab.js** (Jorge) - Most important revenue service
4. **HSClassificationTab.js** (Cristina) - Second Cristina service
5. **ManufacturingFeasibilityTab.js** (Jorge) - Second Jorge service
6. **CrisisResponseTab.js** (Cristina) - Third Cristina service
7. **MarketEntryTab.js** (Jorge) - Third Jorge service

### Required Shared Components
```
components/shared/
└── ServiceWorkflowModal.js    # Reusable modal for all 6 services (NEEDS BUILD)
```

### Data Flow Architecture
**All services leverage existing subscriber workflow data:**
- Complete business intelligence profile from USMCA workflow
- No duplicate data entry
- Minimal new strategic questions (3-5 per service)
- Professional delivery with full business context

### Expert Value Proposition
**Jorge's Real Value:**
- B2B sales execution using proven consultative methodology
- Spanish-language supplier relationship building
- Professional verification of AI recommendations
- Implementation support and ongoing relationship management

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

### Implementation Priority
1. **Phase 1**: Build all 6 dashboard components and shared modal
2. **Phase 2**: Implement all 6 supporting API endpoints
3. **Phase 3**: Integration testing and optimization

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