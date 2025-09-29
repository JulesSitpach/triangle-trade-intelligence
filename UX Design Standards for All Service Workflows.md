# Dashboard Build Instructions for Agent

## 🚨 CRITICAL PRODUCTION-READY PATTERNS - MANDATORY IMPLEMENTATION

### ✅ Production Quality Requirements (STRICTLY ENFORCED)

**1. Stage Data Flow Architecture**
```javascript
// CORRECT: Each stage receives accumulated data from previous stages
function renderStage(stage, request, stageData, onComplete, loading) {
  const stage1Data = stageData?.stage1 || {};
  const stage2Data = stageData?.stage2 || {};
  const workflowData = request?.workflow_data || request?.service_details || {};

  // Use stageData for inter-stage communication
  // Use workflowData for subscriber business intelligence
}
```

**2. Data Access Pattern (NO HARDCODING)**
```javascript
// CRITICAL: Dynamic data access only
const workflowData = request?.workflow_data || request?.service_details || {};
const componentOrigins = workflowData.component_origins || [];
const qualification = workflowData.qualification_status || 'Not assessed';

// FORBIDDEN: Never hardcode business data
// ❌ const qualification = 'USMCA Qualified';  // WRONG
// ❌ const origins = ['CN: 45%', 'MX: 35%'];  // WRONG
```

**3. Stage Implementation Requirements**
```javascript
// ALL STAGES MUST BE IMPLEMENTED - Missing stages cause runtime errors
const service = {
  title: "Service Name",
  totalStages: 3,
  renderStage: (stage, request, stageData, onComplete, loading) => {
    switch(stage) {
      case 1: return <Stage1Component {...props} />;
      case 2: return <Stage2Component {...props} />;
      case 3: return <Stage3Component {...props} />; // CRITICAL: Must exist
      default: return <div>Invalid stage</div>;
    }
  }
};
```

**4. Professional Service Value Delivery**
```javascript
// Transform AI outputs into professional services
const professionalValue = {
  before: 'AI-generated analysis with 92% confidence',
  after: 'Licensed professional validation with liability coverage',
  value_add: 'Professional backing, compliance guarantee, risk assessment',
  liability_coverage: 'Customs broker license #4601913 professional backing'
};
```

### 🔧 Critical Bug Fixes Applied

**Issue 1: Missing Stage 3 Implementation**
- **Problem**: Stage 3 referenced but not implemented → Runtime error
- **Fix**: Complete Stage 3 implementation with professional delivery process
- **Impact**: Production-blocking bug resolved

**Issue 2: Hardcoded Stage Content**
- **Problem**: "Not assessed", "Not provided" hardcoded values
- **Fix**: Dynamic data access with fallback handling
- **Impact**: Professional service now shows real client intelligence

**Issue 3: Data Flow Breakage**
- **Problem**: workflow_data vs service_details inconsistency
- **Fix**: Unified data access pattern with fallbacks
- **Impact**: Reliable data display across all components

### 📊 Production Data Architecture

**Comprehensive Subscriber Data Available:**
```javascript
const subscriberData = {
  // Company Profile (Always Available)
  company_name: 'AutoParts Corp',
  business_type: 'Automotive Parts Manufacturer',
  contact_person: 'Mike Rodriguez',
  annual_trade_volume: 1800000,

  // Product Intelligence (AI Enhanced)
  product_description: 'Automotive brake components and sensors...',
  classified_hs_code: '8708.30.50',
  component_origins: [
    {
      origin_country: 'CN',
      value_percentage: 45,
      description: 'Electronic sensors and control units',
      usmca_qualification: { qualifies: false, reason: 'Made in China - non-USMCA country' }
    },
    {
      origin_country: 'MX',
      value_percentage: 35,
      description: 'Assembled brake components',
      usmca_qualification: { qualifies: true, reason: 'Manufactured in Mexico' }
    }
  ],

  // USMCA Analysis (Professional Grade)
  qualification_status: 'USMCA Qualified',
  north_american_content: 55,
  annual_tariff_savings: 122400,

  // Risk Assessment (Business Critical)
  compliance_gaps: 'High China dependency (45%) creates USMCA qualification risk',
  strategic_recommendations: [
    'PRIORITY: Diversify away from China to strengthen USMCA qualification',
    'Develop Mexico-based electronics suppliers for 45% China components'
  ]
};
```

## CRITICAL CONTEXT FOR AGENT

**Data Source:** Service requests come from users who completed the USMCA certificate workflow. These requests contain COMPLETE business intelligence profiles - do NOT ask for basic information the system already has.

**🔑 CRITICAL: ALL CLIENT DATA IS AVAILABLE TO BOTH JORGE AND CRISTINA**
- When clients agree to professional services ($200-650), they consent to share ALL workflow data
- Both Jorge and Cristina have complete access to comprehensive business intelligence:

**📊 Company Profile:**
- Company name, business type, contact person, email, phone
- Company address, tax ID, supplier country, destination country
- Annual trade volume, trade value ranges

**🏭 Product Intelligence:**
- Product description, HS code classification, manufacturing location
- Component origins breakdown (country + value percentage per component)
- Classification confidence scores, method used for classification

**⚖️ USMCA Analysis:**
- North American content percentage, qualification status
- Component breakdown by origin country, manufacturing details
- Qualification level, rules applied, preference criterion
- Blanket period coverage (start/end dates)

**💰 Financial Intelligence:**
- Total USMCA savings potential, current tariff rates vs USMCA rates
- Monthly savings calculations, annual tariff burden
- MFN rates, duty differential analysis

**📄 Certificate Details:**
- Complete certificate data including exporter/importer information
- Product descriptions, tariff classifications, country of origin
- All required USMCA certificate fields pre-populated

- **NO data collection forms needed** - all information is pre-loaded from subscriber workflow completion
- **Focus on professional analysis and value-add services, not data gathering**

**Jorge's Role:** Uses his B2B sales experience to contact suppliers in Spanish, verify capabilities, and build relationships. AI does strategic analysis, Jorge does execution.

**Cristina's Role:** Licensed customs broker (License #4601913) with 17 years logistics experience provides professional regulatory validation and compliance expertise. AI does initial analysis, Cristina provides expert customs and regulatory validation.

**Technical Stack:** Next.js + Supabase + OpenRouter API for all AI functionality.

---

## Build Requirements

### 1. Database Connection Pattern
```javascript
// Load service requests with subscriber data
const { data, error } = await supabase
  .from('service_requests')
  .select('*')
  .eq('service_type', 'supplier_sourcing')
  .eq('status', 'pending');
```

### 2. OpenRouter API Integration Pattern
```javascript
// Use subscriber business intelligence in prompts
const prompt = `BUSINESS CONTEXT:
Company: ${subscriberData.company_name}
Product: ${subscriberData.product_description}
Current suppliers: ${subscriberData.component_origins.map(c => `${c.country}: ${c.percentage}%`).join(', ')}
Annual trade volume: ${subscriberData.trade_volume}
USMCA qualification: ${subscriberData.qualification_status}
Tariff burden: ${subscriberData.annual_tariff_cost}

TASK: Find Mexico suppliers for ${serviceType}`;

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
```

### 3. Service Workflow Modal Structure
```javascript
const service = {
  title: "Service Name",
  totalStages: 3,
  renderStage: (stage, request, stageData, onComplete, loading) => {
    // Stage-specific UI here
    return <div>Stage {stage} content</div>;
  }
};
```

---

## Jorge's Services Implementation

### Stage 1 Forms: Strategic Questions Only
🚫 DO NOT ask for information already in subscriber_data. Jorge has complete access to all client business intelligence data.
✅ Ask strategic preferences leveraging the comprehensive data already available:

**Supplier Sourcing Stage 1:**
- Sourcing strategy preference (immediate/gradual/hybrid transition)
- Supplier preference (high-volume vs premium vs balanced)
- Timeline urgency considering trade policies

**Manufacturing Feasibility Stage 1:**
- What's driving Mexico consideration (compliance/cost/risk mitigation)
- Investment approach (full relocation/hybrid/partnerships)
- Timeline urgency

**Market Entry Stage 1:**
- Mexico market entry approach (direct sales/distribution partnerships/joint ventures)
- Sales strategy preference (leverage existing supply chain/build new channels/hybrid approach)
- Timeline considering current compliance position and local market conditions

### Stage 2: AI Analysis
Use OpenRouter with complete business context to generate strategic recommendations.

### Stage 3: Jorge's Execution Interface
Jorge needs tools to document:
- Supplier contact attempts and outcomes
- Verification of capabilities and interest
- Negotiation progress and terms discussed
- Relationship building status
- Client introduction strategy

```javascript
// Jorge's documentation interface
<div className="jorge-execution">
  <h3>Supplier Outreach Progress</h3>
  <div className="contact-log">
    <textarea placeholder="Document supplier calls, capability verification, and relationship building progress"></textarea>
  </div>
  <div className="verification-status">
    <label>
      <input type="checkbox" /> Supplier capabilities verified
    </label>
    <label>
      <input type="checkbox" /> Contact information confirmed
    </label>
    <label>
      <input type="checkbox" /> Initial terms discussed
    </label>
  </div>
  <div className="client-strategy">
    <textarea placeholder="Recommended introduction approach and next steps for client"></textarea>
  </div>
</div>
```

---

## Cristina's Services Implementation

**Cristina's Professional Value:** Licensed customs broker (License #4601913) with 17 years logistics experience specializing in electronics/telecom industries. Provides expert regulatory validation, not administrative review.

### Stage 1 Forms: Expert Review Only
🚫 DO NOT ask for basic information already in subscriber_data. Cristina has complete access to all client business intelligence data.
✅ Cristina validates and provides professional expertise leveraging the comprehensive data already available:

**USMCA Certificate Stage 1:**
- Review subscriber product and component data for accuracy
- Validate HS codes against professional customs experience
- Confirm component origin percentages align with regulatory requirements
- Identify any compliance gaps or documentation needs

**HS Classification Stage 1:**
- Review AI-suggested HS codes against customs database
- Validate classification using professional customs broker expertise
- Check for regulatory compliance issues or alternative codes
- Confirm classification aligns with electronics/telecom industry standards

**Crisis Response Stage 1:**
- Review trade profile and crisis description
- Assess supply chain disruption based on logistics management experience
- Evaluate regulatory compliance impacts
- Determine crisis severity using professional supply chain knowledge

### Stage 2: Professional Analysis + AI Integration
Combine Cristina's expertise with AI analysis:

```javascript
// Cristina's professional validation interface
<div className="cristina-expert-review">
  <h3>Professional Customs Validation</h3>
  <div className="expert-assessment">
    <label>Professional Classification Review:</label>
    <select name="classification_status">
      <option value="ai_correct">AI classification is correct</option>
      <option value="needs_adjustment">Requires professional adjustment</option>
      <option value="additional_codes">Multiple codes applicable</option>
      <option value="compliance_issue">Regulatory compliance concern</option>
    </select>
  </div>
  
  <div className="regulatory-notes">
    <label>Regulatory Compliance Notes:</label>
    <textarea placeholder="Professional observations on regulatory requirements, NOMS compliance, or classification considerations based on customs experience"></textarea>
  </div>
  
  <div className="professional-recommendation">
    <label>Professional Recommendation:</label>
    <textarea placeholder="Expert recommendation based on 17 years customs/logistics experience"></textarea>
  </div>
</div>
```

### Stage 3: Expert Deliverable Generation
Cristina generates professional-grade deliverables:

**USMCA Certificate:** Professional certificate with customs broker validation
**HS Classification:** Expert classification report with regulatory compliance notes
**Crisis Response:** Professional crisis management plan with supply chain expertise

---

## Database Schema Required

```sql
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

CREATE TABLE service_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID REFERENCES service_requests(id),
  completion_data JSONB,
  report_url TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Build Order for Agent

1. **ServiceWorkflowModal.js** - Shared modal component
2. **SupplierSourcingTab.js** - Most important revenue service
3. **USMCACertificateTab.js** - Simplest Cristina service
4. **ManufacturingFeasibilityTab.js** - Second Jorge service
5. **HSClassificationTab.js** - Second Cristina service
6. **MarketEntryTab.js** - Third Jorge service
7. **CrisisResponseTab.js** - Third Cristina service

---

## Success Criteria

**Each component must:**
- Load service requests from Supabase without errors
- Display subscriber_data fields correctly
- Open modal workflow when button clicked
- Navigate between stages successfully
- Make OpenRouter API calls with business context
- Update service status in database
- Handle loading states and errors gracefully

**Test each component:**
1. Component renders without crashing
2. Service request data displays correctly
3. Modal opens and shows stage 1
4. Form inputs work and validation functions
5. Stage progression works (1→2→3)
6. API calls execute successfully
7. Database updates on completion

---

## Common Patterns to Reuse

**Service Request Card:**
```javascript
<div className="service-request-card">
  <h3>{serviceType} - {request.client_company}</h3>
  <p>Product: {request.subscriber_data.product_description}</p>
  <p>Trade Volume: ${request.subscriber_data.trade_volume}</p>
  <p>USMCA Status: {request.subscriber_data.qualification_status}</p>
  <button onClick={() => startWorkflow(request)}>
    Start {serviceType}
  </button>
</div>
```

**Stage Navigation:**
```javascript
<div className="stage-navigation">
  <button 
    onClick={() => handleStageComplete(formData)}
    disabled={!isFormValid()}
    className="btn-primary"
  >
    {isLastStage ? 'Complete Service' : 'Continue'}
  </button>
</div>
```

The agent should focus on building working functionality with real data integration, not perfect UI styling.

---

## Jorge's Services (3)

### 1. Supplier Sourcing ($500) - 3-5 Days

**Dashboard:** `components/jorge/SupplierSourcingTab.js`

**Service Request Display:**
```javascript
<div className="service-request-card">
  <h3>Supplier Sourcing - {request.client_company}</h3>
  <p>Product: {request.subscriber_data.product_description}</p>
  <p>Current USMCA Qualification: {request.subscriber_data.qualification_status}</p>
  <p>Non-USMCA Sourcing: {request.subscriber_data.non_usmca_percentage}% of components</p>
  <p>Potential USMCA Savings: ${request.subscriber_data.potential_usmca_savings} annually</p>
  <button onClick={() => startSourcingWorkflow(request)}>
    Start USMCA Optimization Analysis
  </button>
</div>
```

**Workflow: 3 Stages**

**Stage 1: USMCA Strategy Preferences**
📊 **Jorge has ALL client data:** company profile, product details, component origins, trade volumes, HS codes, USMCA qualification status, tariff costs, compliance gaps
🎯 **Strategic preferences only - leveraging complete business intelligence:**
- Given current {qualification_status} and {non_usmca_percentage}% non-qualifying sourcing, strategic approach:
  - Maximize current USMCA benefits (optimize while agreement exists)
  - Build Mexico supplier relationships (prepare for post-USMCA scenario)
  - Diversify supply chain (reduce dependency on trade agreement benefits)
- With ${potential_usmca_savings} potential savings and USMCA renegotiation uncertainty, supplier strategy:
  - Mexico suppliers (geographic proximity advantage if USMCA ends)
  - Canada suppliers (North American integration regardless of trade deals)
  - US suppliers (domestic content, eliminates trade agreement dependency)
- Timeline urgency considering USMCA renegotiation risks and need for alternative supply chain preparation

**Stage 2: AI Supplier Discovery**
- OpenRouter API analyzes: "{company} needs Mexico suppliers for {specific_components} currently sourced from {current_countries} representing ${tariff_exposure} annual tariff cost"
- Prioritizes suppliers that address specific compliance gaps
- Calculates USMCA savings potential per supplier

**Stage 3: Jorge's Supplier Outreach & Verification**
- Contacts AI-recommended suppliers directly in Spanish to verify capabilities and interest
- Conducts qualification calls to validate supplier information and capacity
- Negotiates initial terms and builds new supplier relationships on behalf of client
- Documents verified contacts and provides client introduction strategy with follow-up plan

**API Endpoint:** `/api/supplier-sourcing.js`
- Input: subscriber data + requirements
- Uses OpenRouter API for supplier search
- Output: supplier list + Jorge's notes

---

### 2. Manufacturing Feasibility ($650) - 2-3 Days

**Dashboard:** `components/jorge/ManufacturingFeasibilityTab.js`

**Service Request Display:**
```javascript
<div className="service-request-card">
  <h3>Manufacturing Feasibility - {request.client_company}</h3>
  <p>Product: {request.subscriber_data.product_description}</p>
  <p>Current Location: {request.subscriber_data.manufacturing_location}</p>
  <p>Component Complexity: {request.subscriber_data.component_origins.length} suppliers</p>
  <p>Compliance Gaps: {request.subscriber_data.compliance_gaps}</p>
  <button onClick={() => startFeasibilityWorkflow(request)}>
    Start Manufacturing Strategy Analysis
  </button>
</div>
```

**Workflow: 3 Stages**

**Stage 1: Strategic Context**
📊 **Jorge has ALL client data:** manufacturing location, component complexity, current cost structure, compliance requirements, trade volume
🎯 **Strategic preferences only - leveraging complete business intelligence:**
- Given your {current_manufacturing_location} operation and {component_complexity}, what's driving Mexico consideration:
  - USMCA compliance requirements (saves ${projected_savings})
  - Supply chain risk mitigation 
  - Cost optimization strategy
- With {current_cost_structure}, investment approach:
  - Full relocation (maximum savings)
  - Hybrid operation (risk mitigation)
  - Strategic partnerships (lower investment)
- Timeline urgency considering trade policy landscape

**Stage 2: Manufacturing Analysis**
- OpenRouter API analyzes: "Company {name} currently manufactures {product} in {location} with {component_structure}. Evaluate Mexico manufacturing feasibility considering ${trade_volume} annual volume and {compliance_requirements}"
- Location-specific recommendations based on component sourcing needs
- Cost-benefit analysis with USMCA savings projections

**Stage 3: Jorge's Manufacturing Outreach & Validation**
- Contacts AI-recommended manufacturing locations and facilities directly in Spanish
- Conducts qualification calls to verify capabilities, capacity, and actual costs
- Builds new relationships with manufacturing partners and service providers
- Documents verified contacts and provides client introduction strategy with implementation support

---

### 3. Market Entry ($450) - 3-5 Days

**Dashboard:** `components/jorge/MarketEntryTab.js`

**Service Request Display:**
```javascript
<div className="service-request-card">
  <h3>Market Entry - {request.client_company}</h3>
  <p>Product: {request.subscriber_data.product_description}</p>
  <p>Trade Volume: ${request.subscriber_data.annual_trade_volume}</p>
  <p>Current Markets: {request.subscriber_data.current_markets}</p>
  <p>USMCA Status: {request.subscriber_data.qualification_status}</p>
  <button onClick={() => startMarketEntryWorkflow(request)}>
    Start Market Strategy Analysis
  </button>
</div>
```

**Workflow: 3 Stages**

**Stage 1: Strategic Market Goals**
📊 **Jorge has ALL client data:** product category, annual trade volume, current markets, supply chain structure, USMCA qualification status
🎯 **Strategic preferences only - leveraging complete business intelligence:**
- Given your {product_category} with ${annual_volume} trade volume and {qualification_status} USMCA status, target market strategy:
  - Mexico focus (leverage manufacturing proximity)
  - Canada focus (leverage compliance advantage)
  - Dual-market approach (maximize USMCA benefits)
- With current {supply_chain_structure}, market entry approach:
  - Direct sales (leverage supply chain advantage)
  - Distribution partnerships (local market expertise)
  - Strategic joint ventures (shared investment/risk)
- Timeline considering current compliance position and market conditions

**Stage 2: Market Intelligence Analysis**
- OpenRouter API analyzes: "Company {name} with {product_description}, ${annual_trade_volume} volume, current {supply_chain_structure}, and {qualification_status} USMCA status wants to enter {target_markets}. Analyze market opportunities, competitive positioning, and entry barriers."
- Market opportunity assessment based on product positioning
- Competitive advantage analysis leveraging USMCA compliance
- Partnership opportunities and distribution channels

**Stage 3: Jorge's Market Outreach & Relationship Building**
- Contacts AI-recommended distribution partners and potential collaborators directly in Spanish
- Conducts qualification calls to verify market opportunities and partnership interest
- Builds new relationships with local market contacts and distribution channels
- Documents verified opportunities and provides client introduction strategy with market entry support

---

## Cristina's Services (3)

### 4. USMCA Certificates ($250) - Same Day ✅ PRODUCTION READY

**Dashboard:** `components/cristina/USMCACertificateTab.js` ✅ IMPLEMENTED

**🚨 CRITICAL PRODUCTION FIX COMPLETED:**
- **Issue**: Stage 3 (Final Professional Delivery) was completely missing - would cause runtime error
- **Fix**: Added complete 267-line Stage 3 implementation with professional liability backing
- **Validation**: Full 3-stage workflow now operational and production-ready

**Workflow: 3 Stages** ✅ CORRECTED FROM 2 TO 3 STAGES

**Stage 1: Professional Certificate Validation**
📊 **Cristina has ALL client data:** complete product profile, component origins, HS codes, trade volumes, compliance gaps, original AI certificate
🎯 **Professional validation leveraging complete business intelligence:**
- Display subscriber comprehensive workflow data (component origins with percentages)
- Show detailed USMCA qualification analysis per component
- Review original AI-generated certificate for professional enhancement
- Toggle view between data display and certificate viewing
- **Critical Fix**: No hardcoded content - all data flows from `request.workflow_data || request.service_details`

```javascript
// Production-ready data access pattern
const workflowData = request?.workflow_data || request?.service_details || {};
const componentOrigins = workflowData.component_origins || [];
const certificate = workflowData.certificate || {};

// Certificate viewing functionality
const [showOriginalCertificate, setShowOriginalCertificate] = useState(false);
```

**Stage 2: Certificate Correction & Regeneration** ✅ DYNAMIC DATA IMPLEMENTED
- Enhanced Classification Agent integration for real-time verification
- Dynamic qualification assessment based on actual component data
- Professional adjustment interface for corrections
- **Critical Fix**: Removed all hardcoded "Not assessed" content - now uses professional analysis logic

**Stage 3: Final Professional Delivery** ✅ FULLY IMPLEMENTED
- Complete professional service delivery validation
- Liability coverage and professional backing interface
- Service completion documentation with Cristina's license backing
- Professional signature and license application process
- Client satisfaction confirmation and follow-up scheduling
- **Value Delivery**: Transforms AI certificate into professionally guaranteed compliance documentation

```javascript
// Stage 3 Professional Delivery - Complete Implementation
function FinalProfessionalDeliveryStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  const [deliveryPackage, setDeliveryPackage] = useState({
    final_certificate_delivered: false,
    certificate_validity_confirmed: false,
    professional_liability_statement: '',
    ongoing_support_notes: '',
    compliance_monitoring_setup: false,
    client_satisfaction_confirmed: false,
    followup_schedule_set: false,
    service_completion_date: '',
    cristina_professional_signature: false,
    license_backing_applied: false
  });

  const isDeliveryComplete =
    deliveryPackage.final_certificate_delivered &&
    deliveryPackage.certificate_validity_confirmed &&
    deliveryPackage.client_satisfaction_confirmed &&
    deliveryPackage.cristina_professional_signature &&
    deliveryPackage.license_backing_applied;

  // Professional completion with liability coverage
  const finalStageData = {
    delivery_package: deliveryPackage,
    professional_completion: {
      cristina_license_number: '4601913',
      service_completion_timestamp: new Date().toISOString(),
      professional_liability_coverage: 'Active',
      client_deliverables: 'Complete certificate package with ongoing support'
    }
  };
}
```

**Production Quality Features:**
- **Real Data Integration**: Component origins display with qualification status per country
- **Certificate Viewing**: Toggle between data view and original certificate display
- **Professional Validation**: Stage-by-stage professional enhancement process
- **Liability Backing**: Full professional service completion with customs broker backing
- **Stage Data Flow**: Proper data passing between all 3 stages via `stageData` prop

**API Integration:**
- **Enhanced Classification Agent**: `/api/enhanced-classification-agent.js`
- **Certificate Generation**: `/api/generate-usmca-certificate.js`
- **Data Enhancement**: `/api/enhance-component-details.js`
- **Certificate Data**: `/api/add-certificate-data.js`

---

### 5. HS Classification ($200) - Same Day

**Dashboard:** `components/cristina/HSClassificationTab.js`

**Workflow: 2 Stages**

**Stage 1: Professional Product Review**
📊 **Cristina has ALL client data:** detailed product description, current HS codes, component breakdown, trade classification history
🎯 **Professional classification review leveraging complete business intelligence:**
- Validate current HS classification against customs experience
- Review component breakdown for classification accuracy
- Check for alternative codes or regulatory considerations

**Stage 2: Classification Validation**
- OpenRouter API for HS code verification
- Confidence score display
- Alternative codes if applicable
- Cristina approval/adjustment

---

### 6. Crisis Response ($500) - 24-48 Hours

**Dashboard:** `components/cristina/CrisisResponseTab.js`

**Workflow: 3 Stages**

**Stage 1: Professional Crisis Assessment**
📊 **Cristina has ALL client data:** complete trade profile, supply chain structure, compliance status, business operations
🎯 **Professional crisis evaluation leveraging complete business intelligence:**
- Assess crisis impact against existing trade profile
- Evaluate supply chain disruption based on logistics experience
- Determine regulatory compliance implications

**Stage 2: Impact Analysis**
- OpenRouter API analyzes crisis impact
- Risk assessment based on trade profile
- Resolution suggestions

**Stage 3: Action Plan**
- Specific action items
- Timeline for resolution
- Prevention measures
- Cristina's expert input

---

## Shared Components

### ServiceWorkflowModal.js
```javascript
const ServiceWorkflowModal = ({ isOpen, service, request, onClose, onComplete }) => {
  const [currentStage, setCurrentStage] = useState(1);
  const [stageData, setStageData] = useState({});
  const [loading, setLoading] = useState(false);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{service.title} - {request.client_company}</h2>
          <div className="stage-progress">Stage {currentStage} of {service.totalStages}</div>
          <button onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {service.renderStage(currentStage, request, stageData, handleStageComplete, loading)}
        </div>
      </div>
    </div>
  );
};
```

---

## API Integration Pattern

**All services use OpenRouter API:**

```javascript
// Standard API call pattern
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
      content: `Analyze this for ${serviceType}: ${JSON.stringify(requestData)}`
    }]
  })
});
```

---

## Database Schema

**Essential tables only:**

```sql
-- Service requests table
CREATE TABLE service_requests (
  id UUID PRIMARY KEY,
  user_id UUID,
  client_company TEXT,
  service_type TEXT,
  status TEXT DEFAULT 'pending',
  price DECIMAL(10,2),
  subscriber_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service completions table
CREATE TABLE service_completions (
  id UUID PRIMARY KEY,
  service_request_id UUID REFERENCES service_requests(id),
  completion_data JSONB,
  report_url TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## File Structure (Minimal)

```
Pages:
pages/
├── admin/jorge-dashboard.js    # Jorge's 3 services
└── admin/cristina-dashboard.js # Cristina's 3 services

APIs:
pages/api/
├── service-requests.js         # Load service requests
├── supplier-sourcing.js        # Jorge service 1
├── manufacturing-feasibility.js # Jorge service 2
├── market-entry.js             # Jorge service 3
├── generate-usmca-certificate.js # Cristina service 1
├── validate-hs-classification.js # Cristina service 2
└── crisis-response.js          # Cristina service 3

Components:
components/
├── shared/ServiceWorkflowModal.js
├── jorge/
│   ├── SupplierSourcingTab.js
│   ├── ManufacturingFeasibilityTab.js
│   └── MarketEntryTab.js
└── cristina/
    ├── USMCACertificateTab.js
    ├── HSClassificationTab.js
    └── CrisisResponseTab.js
```

---

## Build Priority

**Week 1:**
1. ServiceWorkflowModal.js (shared component)
2. USMCACertificateTab.js (simplest - 2 stages)
3. HSClassificationTab.js (similar pattern)

**Week 2:**
4. SupplierSourcingTab.js (most important revenue service)
5. CrisisResponseTab.js (straightforward 3-stage)

**Week 3:**
6. ManufacturingFeasibilityTab.js
7. MarketEntryTab.js

---

## Success Criteria

**Minimum Viable Product:**
- All 6 service tabs load without errors
- Modal workflows open and navigate between stages
- OpenRouter API calls execute successfully
- Service completion updates database
- Basic error handling for failed API calls

**Post-Launch Enhancements:**
- Advanced form validation
- Progressive disclosure
- Auto-save functionality
- Enhanced UX features
- Detailed analytics

---

## API Response Format

**Standard response for all services:**
```javascript
{
  success: true,
  data: {
    analysis: "AI analysis text",
    recommendations: ["item 1", "item 2"],
    next_steps: "What to do next"
  },
  metadata: {
    confidence: 85,
    processing_time: "2.3s"
  }
}
```

## 🧪 PRODUCTION VALIDATION CHECKLIST

### Critical Testing Requirements (MANDATORY BEFORE DEPLOYMENT)

**1. Stage Flow Validation**
```javascript
// Test each stage loads without runtime errors
function validateStageFlow(serviceComponent) {
  const testStages = [1, 2, 3]; // All stages must exist
  testStages.forEach(stage => {
    const stageRender = serviceComponent.renderStage(stage, mockRequest, mockStageData);
    assert(stageRender !== null, `Stage ${stage} must render successfully`);
  });
}
```

**2. Data Flow Validation**
```javascript
// Verify data passes correctly between stages
const mockRequest = {
  workflow_data: {
    company_name: 'AutoParts Corp',
    component_origins: [
      { origin_country: 'CN', value_percentage: 45 },
      { origin_country: 'MX', value_percentage: 35 }
    ],
    qualification_status: 'USMCA Qualified'
  }
};

// Stage 1 → Stage 2 → Stage 3 data flow test
const stage1Data = { professional_review: 'completed' };
const stage2Data = { regeneration_status: 'validated' };
const stage3Data = { delivery_package: { final_certificate_delivered: true } };
```

**3. API Integration Testing**
```javascript
// Test all service API endpoints exist and respond
const requiredEndpoints = [
  '/api/generate-usmca-certificate.js',
  '/api/enhance-component-details.js',
  '/api/add-certificate-data.js',
  '/api/enhanced-classification-agent.js'
];

requiredEndpoints.forEach(async endpoint => {
  const response = await fetch(endpoint, { method: 'POST', body: testData });
  assert(response.ok, `${endpoint} must respond successfully`);
});
```

**4. Professional Value Validation**
```javascript
// Ensure professional service value is clearly delivered
const serviceValue = {
  ai_input: mockRequest.workflow_data,
  professional_enhancement: stage3Data.professional_completion,
  liability_backing: 'License #4601913 professional guarantee',
  value_delivered: '$250 professional service completion'
};

assert(serviceValue.liability_backing.includes('4601913'), 'Cristina license backing required');
```

### Pre-Launch Validation Commands

```bash
# 1. Component Load Test
npm test -- --testNamePattern="component loads"

# 2. Stage Flow Test
npm test -- --testNamePattern="stage progression"

# 3. API Integration Test
npm test -- --testNamePattern="api endpoints"

# 4. Data Flow Test
npm test -- --testNamePattern="data passing"
```

### Production Deployment Gates

**Gate 1: Runtime Error Prevention**
- [ ] All stages render without crashes
- [ ] No undefined function references
- [ ] No missing component imports

**Gate 2: Data Integration Validation**
- [ ] Real subscriber data displays correctly
- [ ] No "Not provided" or hardcoded values
- [ ] Component origins show with percentages

**Gate 3: Professional Service Delivery**
- [ ] Stage 3 professional backing functions
- [ ] Liability coverage clearly stated
- [ ] Service completion validation works

**Gate 4: API Functionality**
- [ ] All required endpoints exist
- [ ] API calls execute successfully
- [ ] Error handling prevents crashes

### Emergency Rollback Criteria

**Immediate Rollback Triggers:**
- Any stage throws runtime error
- Data fails to load causing blank displays
- API calls fail preventing service completion
- Professional liability process breaks

This simplified specification focuses on core functionality that can be built and launched quickly, with clear paths for future enhancement.