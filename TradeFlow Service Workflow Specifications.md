# TradeFlow Service Workflow Specifications

## Design Pattern
All workflows follow the established Supplier Verification pattern:
- **4-stage progress indicator** at top
- **Clear stage headers** with descriptive titles
- **Client/project details** prominently displayed
- **Structured document/data collection** with upload buttons
- **Professional styling** with consistent blue buttons
- **Stage 4 always has AI Report generation** button

---

## Jorge's Mexico/Latin America Services

### 1. Supplier Sourcing Workflow
**Database Tables**:
- PRIMARY: `supplier_introduction_requests`, `suppliers`, `partner_suppliers`
- SUPPORTING: `naics_codes` (for product categories dropdown), `service_requests`, `service_pricing`
- INTELLIGENCE: `market_intelligence`, `supplier_risk_profiles`, `supplier_performance_metrics`

**Progress Steps**: Requirements → Research → Analysis → Report

**Stage 1: Requirements Collection**
- Client: [Company Name]
- Project: [Project Description]
- Contact: [email]

**Required Information:**
- Product Category (dropdown from NAICS codes)
- Volume Requirements (quantity/month)
- Quality Standards (certifications needed)
- Budget Range (price per unit range)
- Timeline (when needed by)
- Special Requirements (text area)

**Stage 2: Market Research**
- Supplier Database Search Results
- Industry Analysis
- Market Conditions Assessment
- Regional Capabilities Review

**Stage 3: Supplier Analysis**
- Capability Matching
- Risk Assessment
- Cost Analysis
- Compliance Verification

**Stage 4: Final Report**
- **AI Report ($500)** button → Generates comprehensive supplier report with 5-7 pre-screened contacts

---

### 2. Manufacturing Feasibility Workflow  
**Database Tables**:
- PRIMARY: `market_consultations`, `us_business_requirements`
- COST ANALYSIS: `triangle_routing_opportunities`, `usmca_industry_advantages`, `trade_routes`
- INTELLIGENCE: `usmca_business_intelligence`, `policy_business_opportunities`

**Progress Steps**: Requirements → Location Analysis → Cost Analysis → Report

**Stage 1: Requirements Collection**
- Product Details
- Manufacturing Requirements
- Investment Budget (linked to `policy_business_opportunities`)
- Timeline Requirements
- Regulatory Considerations

**Stage 2: Location Analysis**
- Regional Assessment (using `trade_routes` data)
- Infrastructure Evaluation
- Labor Market Analysis
- Proximity to Markets (leveraging `triangle_routing_opportunities`)

**Stage 3: Cost Analysis**
- Setup Costs
- Operating Expenses
- USMCA Benefits Assessment (from `usmca_industry_advantages`)
- ROI Projections (using `policy_business_opportunities`)

**Stage 4: Final Report**
- **AI Report (Dynamic Pricing from `service_pricing`)** button → Location recommendations, regulatory overview, cost analysis

---

### 3. Market Entry Workflow
**Database Tables**:
- PRIMARY: `market_consultations`, `us_regulatory_requirements`
- POLICY INTELLIGENCE: `trump_policy_events`, `customer_policy_impacts`, `trade_policy_calendar`
- MARKET DATA: `market_intelligence`, `usmca_business_intelligence`

**Progress Steps**: Requirements → Market Research → Strategy → Report

**Stage 1: Requirements Collection**
- Target Market
- Product/Service Description  
- Entry Timeline
- Investment Capacity
- Risk Tolerance

**Stage 2: Market Research**
- Market Size Analysis (from `usmca_business_intelligence`)
- Competition Assessment
- Regulatory Landscape (using `trump_policy_events`)
- Cultural Considerations

**Stage 3: Strategy Development**
- Entry Strategy Options
- Partnership Opportunities
- Regulatory Compliance Plan (incorporating `customer_policy_impacts`)
- Marketing Approach

**Stage 4: Final Report**
- **AI Report (Dynamic Pricing from `service_pricing`)** button → Market entry strategy with regulatory requirements and partnership recommendations

---

## Cristina's Compliance Services

### 1. USMCA Certificate Generation Workflow
**Database Table**: `usmca_certificates`, `certificates_generated`, `workflow_sessions`

**Progress Steps**: Product Info → Classification → Validation → Generation

**Stage 1: Product Information**
- Product Description
- Manufacturing Details
- Component Sources
- Value Content

**Stage 2: Classification**
- HS Code Verification
- Origin Determination
- Component Analysis
- Trade Agreement Rules

**Stage 3: Validation**
- Compliance Check
- Documentation Review
- Qualification Verification
- Error Resolution

**Stage 4: Certificate Generation**
- **AI Report ($200)** button → Professional USMCA certificate with expert validation

---

### 2. HS Classification Workflow
**Database Table**: `product_classification_help`, `user_contributed_hs_codes`, `hs_master_rebuild`

**Progress Steps**: Product Details → Analysis → Verification → Classification

**Stage 1: Product Details**
- Product Description
- Technical Specifications
- Intended Use
- Material Composition

**Stage 2: Analysis**
- HS Code Research
- Classification Logic
- Tariff Implications
- Trade Agreement Benefits

**Stage 3: Verification**
- Cross-Reference Check
- Expert Review
- Compliance Confirmation
- Alternative Classifications

**Stage 4: Final Classification**
- **AI Report ($150)** button → Professional HS classification with justification and tariff implications

---

### 3. Document Review Workflow
**Database Table**: `verification_documents`, `verification_reports`, `professional_validation_requests`

**Progress Steps**: Upload → Analysis → Review → Recommendations

**Stage 1: Document Upload**
- Document Type Selection
- File Upload (PDF/Excel/Word)
- Review Scope Definition
- Priority Level

**Stage 2: Analysis**
- Document Structure Review
- Compliance Gap Analysis
- Risk Assessment
- Industry Standards Check

**Stage 3: Expert Review**
- Professional Evaluation
- Error Identification
- Improvement Opportunities
- Best Practices Application

**Stage 4: Recommendations**
- **AI Report ($250)** button → Comprehensive review with actionable recommendations

---

### 4. Monthly Support Workflow
**Database Table**: `client_assignments`, `professional_validation_requests`

**Progress Steps**: Session Setup → Q&A → Documentation → Follow-up

**Stage 1: Session Setup**
- Meeting Scheduling
- Agenda Preparation
- Document Collection
- Priority Topics

**Stage 2: Q&A Session**
- Live Consultation (timer tracking)
- Question Resolution
- Guidance Provision
- Action Items

**Stage 3: Documentation**
- Session Summary
- Recommendations
- Action Items
- Resource Links

**Stage 4: Follow-up Plan**
- **AI Report ($99/month)** button → Monthly support summary with next steps

---

### 5. Crisis Response Workflow
**Database Tables**:
- PRIMARY: `crisis_responses`, `crisis_calculations`, `crisis_alerts`
- TEMPLATES: `crisis_response_templates`, `crisis_messages`, `trump_policy_alert_templates`
- INTELLIGENCE: `trump_policy_events`, `customer_policy_impacts`, `policy_business_opportunities`
- CONFIG: `crisis_config` (eliminates hardcoded values)

**Progress Steps**: Assessment → Analysis → Resolution → Prevention

**Stage 1: Crisis Assessment - ENHANCED**
- Issue Description
- Impact Evaluation (using `customer_policy_impacts` data)
- Urgency Level (from `crisis_config` table)
- Affected Shipments
- **Policy Context** (from `trump_policy_events`)
- **Business Impact Assessment** (from `policy_business_opportunities`)

**Stage 2: Root Cause Analysis**
- Problem Investigation
- Contributing Factors
- System Failures
- Process Gaps
- **Policy Triggers** (leveraging `trump_policy_events`)

**Stage 3: Resolution Strategy**
- Immediate Actions
- Corrective Measures
- Timeline Development
- Resource Allocation

**Stage 4: Prevention Plan**
- **AI Report (Dynamic Pricing from `service_pricing`)** button → Crisis resolution plan with prevention measures

---

## Component Architecture

### Jorge's Dashboard Components
**Main Dashboard**: `pages/admin/jorge-dashboard-clean.js` (120 lines - clean and modular)
**Component Directory**: `components/jorge/`

1. **ServiceQueueTab.js** - Service request management with detailed modals
2. **SupplierSourcingTab.js** - 4-stage supplier sourcing workflow  
3. **ManufacturingFeasibilityTab.js** - 4-stage manufacturing analysis workflow
4. **MarketEntryTab.js** - Market entry consultation with timer tracking

### Cristina's Dashboard Components  
**Main Dashboard**: `pages/admin/cristina-dashboard-clean.js` 
**Component Directory**: `components/cristina/`

1. **ServiceQueueTab.js** - Service request management with detailed modals
2. **USMCACertificatesTab.js** - Certificate generation workflow
3. **HSClassificationTab.js** - Product classification workflow  
4. **DocumentReviewTab.js** - Document analysis workflow
5. **MonthlySupportTab.js** - Ongoing support management with timer tracking
6. **CrisisResponseTab.js** - Emergency response workflow

### Shared Components
**Directory**: `components/shared/`

- **WorkflowModal.js** - 4-stage progress indicator and modal wrapper
- **DocumentUpload.js** - Drag/drop upload with AI extraction
- **TimerTracking.js** - Billable hours tracking for consultations
- **AIReportGenerator.js** - AI report generation with pricing
- **ClientCommunication.js** - Email templates and sending

### Database Integration
- All workflows pull client data from `user_profiles` and `company_profiles`
- Service requests stored in `service_requests` table
- Workflow progress tracked in `workflow_sessions`
- Document uploads stored in `verification_documents`
- AI reports generated and stored with completion tracking

### AI Report Generation
- Stage 4 always includes AI report button with service price
- Button triggers API call to generate professional report
- Reports stored in database for client access
- Email notification sent upon completion
- Download/copy functionality for reports

### Capacity Management
- Each service has monthly capacity limits
- Real-time tracking of service usage
- Automatic routing to available team members
- Queue management for overflow requests

---

## Service Queue Tables & Action Buttons

### Jorge's Service Queue Table - ENHANCED
**Columns:**
- Client Name
- Service Type (Supplier Sourcing | Manufacturing Feasibility | Market Entry)
- Status (New | In Progress | Analysis | Complete)
- Priority (High | Medium | Low)
- Due Date
- Progress (Stage 1/4, 2/4, etc.)
- **Policy Impact Level** (from `customer_policy_impacts`)
- **Intelligence Score** (from market analysis)
- **Revenue Potential** (from `policy_business_opportunities`)

**Action Buttons:**
- **Start Verification** (blue button) - Opens workflow modal
- **AI Report (Dynamic $)** (green button) - Generates final report with pricing from `service_pricing`
- **Review** (gray button) - View completed work

### Cristina's Service Queue Table - ENHANCED
**Columns:**
- Client Name  
- Service Type (USMCA Cert | HS Classification | Document Review | Monthly Support | Crisis Response)
- Status (New | In Review | Validation | Complete)
- Priority (Urgent | High | Medium | Low)
- Due Date
- Progress (Stage 1/4, 2/4, etc.)
- **Policy Risk Level** (from `trump_policy_events`)
- **Compliance Score** (from quality metrics)

**Action Buttons:**
- **Start Verification** (blue button) - Opens workflow modal
- **AI Report (Dynamic $)** (green button) - Generates final report with pricing from `service_pricing`
- **Review** (gray button) - View completed work

---

## Enhanced Shared Components

### Shared Components - ENHANCED
**Directory**: `components/shared/`

- **WorkflowModal.js** - 4-stage progress indicator and modal wrapper
- **DocumentUpload.js** - Drag/drop upload with AI extraction
- **TimerTracking.js** - Billable hours tracking for consultations
- **AIReportGenerator.js** - AI report generation with dynamic pricing from `service_pricing`
- **ClientCommunication.js** - Email templates and sending
- **PolicyIntelligence.js** - Real-time policy monitoring integration from `trump_policy_events`
- **RevenueTracking.js** - Service revenue and capacity monitoring via `revenue_attribution`
- **CrisisIntelligence.js** - Policy-driven crisis detection using `customer_policy_impacts`

### Intelligence Integration
**Policy Intelligence Workflows**:
- Real-time policy monitoring via `trump_policy_events` (5 active events)
- Customer impact assessment via `customer_policy_impacts` (14 tracked impacts)  
- Business opportunity identification via `policy_business_opportunities` (7 opportunities)

**Market Intelligence Integration**:
- Supplier risk assessment via `supplier_risk_profiles` (5 profiles)
- Performance tracking via `supplier_performance_metrics`
- Market analysis via `usmca_business_intelligence` (18 intelligence entries)

### AI Report Generation - ENHANCED
- Stage 4 includes AI report button with **DYNAMIC PRICING** from `service_pricing` table
- Button pricing updates automatically based on service complexity and market conditions
- Reports stored in database with completion tracking
- Revenue tracking via `revenue_attribution` table
- Service capacity management via `professional_services` table

---

## Individual Service Table Layouts

### 1. Supplier Sourcing Table
**Database**: `supplier_introduction_requests` + `suppliers`

| Client Name | Product Category | Volume Needed | Budget Range | Status | Progress | Actions |
|-------------|------------------|---------------|--------------|---------|----------|---------|
| Manufactura Electronica | Electronics Components | 10K/month | $2-5 per unit | In Progress | Stage 2/4 | [Start Verification] [Review] |
| Tijuana Automotive | Auto Parts | 5K/month | $10-20 per unit | New | Stage 1/4 | [Start Verification] [AI Report ($500)] |

**Action Buttons:**
- **Start Verification** - Opens Requirements → Research → Analysis → Report workflow
- **AI Report ($500)** - Generates supplier sourcing report with 5-7 contacts

### 2. Manufacturing Feasibility Table  
**Database**: `market_consultations`

| Client Name | Product Type | Investment Budget | Timeline | Status | Progress | Actions |
|-------------|--------------|-------------------|----------|---------|----------|---------|
| Mexico City Precision | Precision Tools | $2M | 12 months | Analysis | Stage 3/4 | [Start Verification] [Review] |
| Monterrey Industrial | Industrial Equipment | $5M | 18 months | New | Stage 1/4 | [Start Verification] [AI Report ($650)] |

**Action Buttons:**
- **Start Verification** - Opens Requirements → Location Analysis → Cost Analysis → Report workflow
- **AI Report ($650)** - Generates feasibility report with location recommendations

### 3. Market Entry Table
**Database**: `market_consultations`

| Client Name | Target Market | Product/Service | Entry Timeline | Status | Progress | Actions |
|-------------|---------------|-----------------|----------------|---------|----------|---------|
| Hermosillo Tech | US Software Market | SaaS Platform | 6 months | Strategy | Stage 3/4 | [Start Verification] [Review] |
| Test Company | US Manufacturing | Auto Components | 12 months | New | Stage 1/4 | [Start Verification] [AI Report ($400)] |

**Action Buttons:**
- **Start Verification** - Opens Requirements → Market Research → Strategy → Report workflow  
- **AI Report ($400)** - Generates market entry strategy report

### 4. USMCA Certificates Table
**Database**: `usmca_certificates` + `certificates_generated`

| Client Name | Product Description | HS Code | Origin Country | Status | Progress | Actions |
|-------------|-------------------|---------|----------------|---------|----------|---------|
| Electronics Manufacturer | Circuit Boards | 8534.00 | Mexico | Validation | Stage 3/4 | [Start Verification] [Review] |
| Auto Parts Co | Brake Components | 8708.30 | Mexico | New | Stage 1/4 | [Start Verification] [AI Report ($200)] |

**Action Buttons:**
- **Start Verification** - Opens Product Info → Classification → Validation → Generation workflow
- **AI Report ($200)** - Generates professional USMCA certificate

### 5. HS Classification Table
**Database**: `product_classification_help` + `user_contributed_hs_codes`

| Client Name | Product Description | Proposed HS Code | Classification Status | Status | Progress | Actions |
|-------------|-------------------|------------------|---------------------|---------|----------|---------|
| Tech Components | Wireless Modules | 8517.62 | Under Review | Verification | Stage 3/4 | [Start Verification] [Review] |
| Industrial Parts | Hydraulic Pumps | 8413.70 | Pending | New | Stage 1/4 | [Start Verification] [AI Report ($150)] |

**Action Buttons:**
- **Start Verification** - Opens Product Details → Analysis → Verification → Classification workflow
- **AI Report ($150)** - Generates professional HS classification with justification

### 6. Document Review Table
**Database**: `verification_documents` + `verification_reports`

| Client Name | Document Type | File Name | Review Scope | Status | Progress | Actions |
|-------------|---------------|-----------|--------------|---------|----------|---------|
| Logistics Corp | Commercial Invoice | invoice_batch_Q3.pdf | Compliance Check | Review | Stage 3/4 | [Start Verification] [Review] |
| Export Services | Packing List | packing_lists_sept.xlsx | Full Review | New | Stage 1/4 | [Start Verification] [AI Report ($250)] |

**Action Buttons:**
- **Start Verification** - Opens Upload → Analysis → Review → Recommendations workflow
- **AI Report ($250)** - Generates comprehensive review with recommendations

### 7. Monthly Support Table
**Database**: `client_assignments` + `professional_validation_requests`

| Client Name | Support Plan | Hours Used | Hours Remaining | Next Session | Status | Actions |
|-------------|--------------|------------|-----------------|--------------|---------|---------|
| Trade Solutions | Premium (2hr/month) | 1.5 | 0.5 | Oct 15, 2024 | Active | [Schedule Session] [Session Notes] |
| Export Management | Standard (1hr/month) | 0 | 1.0 | Oct 20, 2024 | New | [Schedule Session] [AI Report ($99)] |

**Action Buttons:**
- **Schedule Session** - Opens Session Setup → Q&A → Documentation → Follow-up workflow
- **Session Notes** - View previous session documentation
- **AI Report ($99)** - Generates monthly support summary

### 8. Crisis Response Table
**Database**: `crisis_responses` + `crisis_calculations`

| Client Name | Crisis Type | Issue Description | Urgency Level | Response Time | Status | Actions |
|-------------|-------------|-------------------|---------------|---------------|---------|---------|
| Urgent Logistics | Rejected Certificate | USMCA cert rejected at border | Critical | 2 hours | Resolution | [Emergency Response] [Review] |
| Fast Shipping | Documentation Error | Missing origin documents | High | 8 hours | New | [Emergency Response] [AI Report ($450)] |

**Action Buttons:**
- **Emergency Response** - Opens Assessment → Analysis → Resolution → Prevention workflow
- **AI Report ($450)** - Generates crisis resolution plan with prevention measures

---

## Button Styling Standards

### Primary Action Buttons
- **Start Verification**: Blue background (#3B82F6), white text
- **Emergency Response**: Red background (#EF4444), white text  
- **Schedule Session**: Blue background (#3B82F6), white text

### Secondary Action Buttons  
- **Review**: Gray background (#6B7280), white text
- **Session Notes**: Gray background (#6B7280), white text

### AI Report Buttons
- **AI Report ($XXX)**: Green background (#10B981), white text
- Price displayed prominently in button text
- Only appears when workflow can be completed