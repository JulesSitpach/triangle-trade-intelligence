# 6 Service Dashboards - Build Specification
**For Subscription Users Only - Using Existing Workflow Data**

**All 6 Services Follow: AI Agent + Human Expert Pattern**
- AI handles web scraping, data analysis, and draft generation
- Human expert adds professional judgment, validation, and recommendations
- Subscriber workflow data pre-populates analysis
- Minimal new data collection (3-5 questions per service)

---

## Jorge's Services (3)

### 1. Supplier Sourcing ($500) - 3-5 Days
### 2. Manufacturing Feasibility ($650) - 2-3 Days  
### 3. Market Entry ($450) - 3-5 Days

## Cristina's Services (3)

### 4. USMCA Certificates ($250) - Same Day Delivery

### Dashboard: `components/cristina/USMCACertificateTab.js`

**Service Request Display:**
```javascript
<div className="service-request">
  <h3>USMCA Certificate - {request.client_company}</h3>
  <p>Product: {request.subscriber_data.product_description}</p>
  <p>Origin: {request.subscriber_data.manufacturing_location}</p>
  <button onClick={() => startCertificateWorkflow(request)}>
    Start Certificate Generation
  </button>
</div>
```

**Workflow Modal: 2 Stages**

**Stage 1: Data Review**
- Display existing subscriber data (product, components, origins)
- No new forms - just review and confirm
- Button: "Data looks good - Generate Certificate"

**Stage 2: Certificate Generation**
- Call Enhanced Classification Agent with subscriber data
- Generate PDF certificate or flag compliance issues
- If issues: show what needs fixing
- If success: download PDF + email to client

**API Endpoint:**
```javascript
// /api/generate-usmca-certificate.js
// Input: subscriber workflow data
// Output: PDF certificate or compliance issues
```

---

## 2. HS Classification ($200) - Same Day Delivery

### Dashboard: `components/cristina/HSClassificationTab.js`

**Service Request Display:**
```javascript
<div className="service-request">
  <h3>HS Classification - {request.client_company}</h3>
  <p>Product: {request.subscriber_data.product_description}</p>
  <p>Components: {request.subscriber_data.component_origins.length} items</p>
  <button onClick={() => startClassificationWorkflow(request)}>
    Start Classification Review
  </button>
</div>
```

**Workflow Modal: 2 Stages**

**Stage 1: Product Review**
- Display subscriber product data and component breakdown
- Show existing HS code if available
- Button: "Verify Classification"

**Stage 2: Expert Validation** 
- Run Enhanced Classification Agent web search
- Show confidence score and alternative codes
- Cristina approves or adjusts
- Generate classification report PDF

**API Endpoint:**
```javascript
// /api/validate-hs-classification.js
// Input: subscriber product data
// Output: validated HS code + confidence + alternatives
```

---

## 3. Manufacturing Feasibility ($650) - 2-3 Days

### Dashboard: `components/jorge/ManufacturingFeasibilityTab.js`

**Service Request Display:**
```javascript
<div className="service-request">
  <h3>Manufacturing Feasibility - {request.client_company}</h3>
  <p>Product: {request.subscriber_data.product_description}</p>
  <p>Current Volume: {request.subscriber_data.trade_volume}</p>
  <p>USMCA Status: {request.subscriber_data.qualification_status}</p>
  <button onClick={() => startFeasibilityWorkflow(request)}>
    Start Feasibility Analysis
  </button>
</div>
```

**Workflow Modal: 3 Stages**

**Stage 1: Manufacturing Context (5 questions)**
```javascript
const contextQuestions = [
  "Why considering Mexico move?",
  "Current manufacturing challenges?", 
  "Timeline expectations?",
  "Quality certifications required?",
  "Budget range for setup?"
];
```

**Stage 2: AI Analysis**
- Use subscriber data + context answers
- AI analyzes locations based on product type and volume
- Generate 2-3 location options with cost estimates

**Stage 3: Jorge's Recommendation**
- Review AI analysis
- Add local knowledge and contacts
- Final recommendation: Go/No-Go + location + costs + next steps
- Generate PDF report

**API Endpoint:**
```javascript
// /api/manufacturing-feasibility-analysis.js
// Input: subscriber data + manufacturing context
// Output: location recommendations + cost estimates
```

---

## 4. Crisis Response ($500) - 24-48 Hours

### Dashboard: `components/cristina/CrisisResponseTab.js`

**Service Request Display:**
```javascript
<div className="service-request">
  <h3>Crisis Response - {request.client_company}</h3>
  <p>Trade Profile: {request.subscriber_data.trade_volume} annual</p>
  <p>Risk Factors: {request.subscriber_data.vulnerability_factors}</p>
  <button onClick={() => startCrisisWorkflow(request)}>
    Start Crisis Analysis
  </button>
</div>
```

**Workflow Modal: 3 Stages**

**Stage 1: Crisis Description**
```javascript
const crisisForm = [
  "What crisis occurred?",
  "When did it happen?",
  "Current impact on operations?",
  "Immediate concerns?"
];
```

**Stage 2: Analysis**
- Use subscriber trade profile + risk assessment data
- Analyze impact based on their specific situation
- AI suggests resolution approaches

**Stage 3: Action Plan**
- Cristina reviews AI analysis
- Creates specific action plan with timeline
- Includes prevention measures
- Generate PDF action plan

**API Endpoint:**
```javascript
// /api/crisis-response-analysis.js
// Input: subscriber trade data + crisis details
// Output: impact analysis + action plan
```

---

## 1. Supplier Sourcing ($500) - 3-5 Days

### Dashboard: `components/jorge/SupplierSourcingTab.js`

**Service Request Display:**
```javascript
<div className="service-request">
  <h3>Supplier Sourcing - {request.client_company}</h3>
  <p>Product: {request.subscriber_data.product_description}</p>
  <p>Current Origins: {request.subscriber_data.component_origins.map(c => c.country).join(', ')}</p>
  <p>Trade Volume: {request.subscriber_data.trade_volume}</p>
  <button onClick={() => startSourcingWorkflow(request)}>
    Start Supplier Research
  </button>
</div>
```

**Workflow Modal: 3 Stages**

**Stage 1: Sourcing Requirements (5 questions)**
```javascript
const sourcingQuestions = [
  "Why looking for new suppliers?",
  "Quality requirements/certifications?", 
  "Volume requirements (monthly)?",
  "Budget constraints?",
  "Timeline for supplier transition?"
];
```

**Stage 2: AI Supplier Discovery**
- Use subscriber product data + sourcing requirements
- AI scrapes supplier databases, trade directories, manufacturer listings
- Generate 5-7 potential supplier contacts with basic info

**Stage 3: Jorge's Network Validation**
- Review AI-generated supplier list
- Add Mexico-based suppliers from personal network
- Validate supplier capabilities and reliability
- Final recommendation: 2-3 best suppliers with contact strategy
- Generate PDF with supplier profiles and introduction approach

**API Endpoint:**
```javascript
// /api/supplier-sourcing-discovery.js
// Input: subscriber product data + sourcing requirements
// Output: validated supplier contacts + capabilities assessment
```

---

## 6. Market Entry ($450) - 3-5 Days

### Dashboard: `components/jorge/MarketEntryTab.js`

**Service Request Display:**
```javascript
<div className="service-request">
  <h3>Market Entry - {request.client_company}</h3>
  <p>Business: {request.subscriber_data.business_type}</p>
  <p>Product: {request.subscriber_data.product_description}</p>
  <button onClick={() => startMarketEntryWorkflow(request)}>
    Start Market Analysis
  </button>
</div>
```

**Workflow Modal: 3 Stages**

**Stage 1: Market Goals**
```javascript
const marketQuestions = [
  "Target market (Mexico/Canada/both)?",
  "Timeline for market entry?",
  "Sales approach (direct/distributor/partner)?",
  "Budget for market entry?"
];
```

**Stage 2: Market Analysis**
- Use subscriber company/product data + market goals
- AI research market opportunities and requirements
- Generate partnership opportunities

**Stage 3: Jorge's Strategy**
- Review AI analysis
- Add local market knowledge
- Provide partnership recommendations with contacts
- Generate market entry strategy PDF

**API Endpoint:**
```javascript
// /api/market-entry-analysis.js
// Input: subscriber data + market goals
// Output: market analysis + partnership opportunities
```

---

## Database Schema Updates

### Add to service_requests table:
```sql
ALTER TABLE service_requests ADD COLUMN subscriber_data JSONB;
-- Stores complete workflow data for each request
```

### Service request creation:
```javascript
// When subscriber requests service
const serviceRequest = {
  client_company: userData.company.name,
  service_type: 'usmca_certificate',
  price: 250,
  subscriber_data: {
    // Full workflow data from subscription
    product_description: userData.product.description,
    component_origins: userData.product.components,
    qualification_status: userData.certificate.status,
    trade_volume: userData.company.trade_volume,
    // ... all other workflow data
  }
};
```

---

## Shared Components

### WorkflowModal Template:
```javascript
// components/shared/ServiceWorkflowModal.js
const ServiceWorkflowModal = ({
  isOpen,
  service,
  request,
  stages,
  onClose,
  onComplete
}) => {
  const [currentStage, setCurrentStage] = useState(1);
  const [stageData, setStageData] = useState({});
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="workflow-header">
        <h2>{service.title} - {request.client_company}</h2>
        <div className="stage-progress">
          Stage {currentStage} of {stages.length}
        </div>
      </div>
      
      <div className="stage-content">
        {renderCurrentStage()}
      </div>
      
      <div className="workflow-actions">
        <button onClick={handleStageComplete}>
          {currentStage === stages.length ? 'Complete Service' : 'Next Stage'}
        </button>
      </div>
    </Modal>
  );
};
```

### Pre-populated Data Display:
```javascript
// components/shared/SubscriberDataCard.js
const SubscriberDataCard = ({ data, title }) => (
  <div className="subscriber-data-card">
    <h4>{title}</h4>
    <div className="data-grid">
      <div>Company: {data.company_name}</div>
      <div>Product: {data.product_description}</div>
      <div>Trade Volume: {data.trade_volume}</div>
      <div>USMCA Status: {data.qualification_status}</div>
    </div>
  </div>
);
```

---

## File Structure

```
Essential Pages (5-6 files):
pages/
├── index.js                    # Landing page
├── pricing.js                  # Subscription tiers
├── usmca-workflow.js           # Main user workflow (existing)
├── services/logistics-support.js # Service selection (existing)
├── admin/broker-dashboard.js   # Cristina's services
└── admin/jorge-dashboard.js    # Jorge's services
Core APIs (8-10 files):
pages/api/
├── simple-workflow.js          # User workflow processing (existing)
├── service-requests.js         # Service request handling
├── agents/classification-upgraded.js # Enhanced agent (existing)
├── generate-certificate.js     # USMCA certificate generation
├── validate-classification.js  # HS code validation
├── crisis-response.js          # Crisis analysis
├── supplier-sourcing.js        # Supplier discovery
├── manufacturing-analysis.js   # Feasibility analysis
└── market-entry.js            # Market research
Components (6-8 files):
components/
├── ServiceCard.js              # Service selection cards
├── WorkflowModal.js            # Reusable service workflow
├── cristina/
│   ├── CertificateTab.js
│   ├── ClassificationTab.js
│   └── CrisisTab.js
└── jorge/
    ├── SourcingTab.js
    ├── ManufacturingTab.js
    └── MarketEntryTab.js
Database (3-4 tables):
sql- service_requests          # Service orders
- workflow_completions      # User workflow data  
- hs_master_rebuild         # Existing HS codes
- user_profiles            # Subscription data
---

## Build Order

1. **USMCACertificateTab.js** - Simplest (2 stages, uses existing Enhanced Classification Agent)
2. **HSClassificationTab.js** - Uses existing web search agent
3. **CrisisResponseTab.js** - New but straightforward workflow
4. **ManufacturingFeasibilityTab.js** - Simplify existing complex version
5. **MarketEntryTab.js** - Copy manufacturing feasibility pattern

**Each service takes subscriber data + minimal new input → generates focused recommendation PDF.**