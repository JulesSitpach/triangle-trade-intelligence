: product_description

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
  "What's driving the Mexico manufacturing consideration? (USMCA compliance, cost reduction, supply chain risk management)",
  "What's your manufacturing setup budget range and timeline for decision?", 
  "What are your current manufacturing challenges and costs per unit?",
  "What certifications or labor skills does your product require?",
  "How urgent is this move considering potential trade policy changes?"
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

**UX Implementation:**
- **Progressive disclosure**: 2 questions per screen maximum
- **Screen 1**: Questions 1-2 (driving factors + quality certs)
- **Screen 2**: Questions 3-4 (volume/MOQ + payment terms)  
- **Screen 3**: Question 5 (timeline urgency)
- **Progress indicator**: "Question 1-2 of 5" at top

**Input Type Specifications:**
```javascript
const sourcingQuestions = [
  {
    id: "driving_factors",
    question: "What's driving this supplier search?",
    type: "checkbox", // Multiple selection allowed
    options: [
      "USMCA compliance gaps",
      "Current supplier quality problems", 
      "Current supplier delivery issues",
      "Cost reduction needs",
      "Supply chain risk management",
      "Other (specify)"
    ],
    required: true,
    helpText: "Select all that apply. This helps Jorge prioritize suppliers."
  },
  {
    id: "quality_certs", 
    question: "What quality certifications do you actually need?",
    type: "select",
    options: ["ISO 9001", "ISO 14001", "IATF 16949", "FDA registered", "None required", "Other (specify)"],
    required: true,
    helpText: "Only certifications you actually require, not nice-to-haves."
  },
  {
    id: "volume_commitment",
    question: "What's your realistic monthly volume and minimum order quantities?",
    type: "structured_input",
    fields: [
      { label: "Monthly volume", type: "number", unit: "units" },
      { label: "Minimum order quantity you can commit to", type: "number", unit: "units" }
    ],
    required: true,
    validation: "Must be realistic numbers you can actually commit to"
  },
  {
    id: "payment_terms",
    question: "What payment terms can you handle and what's your per-unit cost target?",
    type: "structured_input", 
    fields: [
      { 
        label: "Payment terms", 
        type: "select", 
        options: ["Cash on delivery", "NET 15", "NET 30", "NET 60", "50% deposit + NET 30", "Other"]
      },
      { label: "Target cost per unit", type: "currency", currency: "USD" }
    ],
    required: true
  },
  {
    id: "timeline_urgency",
    question: "What's your timeline urgency?", 
    type: "radio",
    options: [
      { value: "immediate", label: "Immediate (1-2 weeks) - Crisis mode", urgency: "high" },
      { value: "short", label: "3 months - Normal planning", urgency: "medium" },
      { value: "long", label: "6+ months - Strategic planning", urgency: "low" }
    ],
    required: true,
    helpText: "Consider potential tariff changes when setting timeline"
  }
];
```

**Form Behavior:**
- Auto-save answers as user progresses
- "Previous" and "Next" buttons (no "Submit" until final screen)
- Validation before advancing to next screen
- Maximum 2 minutes completion time target

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

**Stage 1: Market Goals (4 questions)**
```javascript
const marketQuestions = [
  "What's your target market? (Mexico/Canada/both) and why now?",
  "What's your timeline for market entry and budget range?",
  "What's your preferred sales approach? (direct sales/distributor/local partner)",
  "What's your current international sales experience and USMCA compliance readiness?"
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