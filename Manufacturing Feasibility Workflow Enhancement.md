# Manufacturing Feasibility Workflow Enhancement

## Task
Enhance the Manufacturing Feasibility workflow to guide Jorge through information gathering with integrated UI tools and database helpers.

## Focus: Jorge as Information Broker
Jorge connects clients with Mexico manufacturing reality through his network and local knowledge. The workflow should guide him on what information to gather, where to get it, and how to document it for AI report generation.

## Enhanced Workflow Stages

### Stage 2: Location Intelligence Gathering
**Information Gathering Guide for Jorge:**

*What to find out:*
- Regional manufacturing capacity for client's product type
- Available industrial facilities and their condition  
- Local labor force skills and availability
- Transportation infrastructure to US markets

*Where to look:*
- Contact industrial park managers in target regions
- Speak with local manufacturers doing similar work
- Check with logistics providers about shipping routes
- Talk to regional economic development offices

**UI Enhancements Needed:**

```javascript
// Contact Management Integration
- Pre-populated contact dropdown from `partner_suppliers` and `suppliers` tables
- Quick-add new contacts discovered during research
- Contact history showing previous interactions
- Research activity tracking (who contacted, when, what learned)

// Regional Data Helpers  
- Interactive Mexico map showing manufacturing regions
- Database lookup showing existing facilities from `trade_routes` data
- Regional economic indicators displayed contextually
- Infrastructure data from your existing tables

// Research Documentation Tools
- Standardized question templates for different contact types
- Voice-to-text for capturing phone call insights
- Photo upload for facility documentation
- Timer tracking for billable research hours
```

### Stage 3: Market Intelligence & Gap Analysis
**Information Gathering Guide for Jorge:**

*What to find out:*
- Current supplier ecosystem for components needed
- Regulatory approval timeline for this product type
- Local business practices affecting operations
- Partnership opportunities with existing manufacturers

*Where to look:*
- Interview suppliers in component supply chain
- Contact local regulatory offices for permit timelines  
- Speak with similar manufacturers about their experience
- Identify potential local partners or contract manufacturers

**UI Enhancements Needed:**

```javascript
// Research Templates & Checklists
- Standardized forms for supplier interviews
- Regulatory checklist specific to product type
- Partnership evaluation framework
- Progress indicators showing completion status

// Database Cross-Reference Tools
- Show existing intelligence data while gathering new info
- Flag information gaps where research adds value
- Suggest contacts based on client requirements
- Auto-populate AI report inputs from structured notes

// Quick Documentation
- Simple forms that structure findings for AI consumption
- Notes fields that map directly to report sections
- Checklist format preventing missed information
- Real-time validation of required data points
```

## Implementation Requirements

### Database Integration
- Connect to existing `partner_suppliers`, `suppliers`, `trade_routes` tables
- Pull relevant regional and facility data contextually
- Track research progress in `workflow_sessions` table
- Store gathered intelligence for AI report generation

### UI Component Enhancements
- **ContactManager.js** - Manage Jorge's Mexico network contacts
- **RegionalDataHelper.js** - Display relevant database info by region
- **ResearchTemplate.js** - Guided information gathering forms
- **TimeTracker.js** - Track billable research hours
- **IntelligenceCapture.js** - Structure findings for AI report

### Key Features
- Progress tracking for each information gathering task
- Contact history and relationship management
- Regional data overlay from existing database
- Structured note-taking that feeds AI report generation
- Timer integration for billable hour tracking

### AI Report Integration
Jorge's gathered intelligence should auto-populate the AI report generation with:
- Local facility options with costs/capabilities
- Regional advantages/challenges discovered
- Supplier network assessment
- Regulatory timeline with local insights
- Partnership recommendations with pros/cons

## Replication Template
Once Manufacturing Feasibility workflow is enhanced, replicate the pattern for:
- Supplier Sourcing (contact supplier network)
- Market Entry (research market conditions)
- All other Jorge services following same information broker model

The enhanced workflow makes Jorge more efficient at gathering local intelligence while ensuring the AI gets structured, actionable data for comprehensive report generation.

## Critical Fixes Needed

### 1. Service Type Mapping
Create consistent service type mapping across all dashboards:

```javascript
// Add service type mapping utility
const SERVICE_TYPE_MAPPING = {
  // Jorge's Services - Frontend expects vs Database has
  'mexico-supplier-sourcing': ['supplier-vetting', 'supplier-sourcing', 'partner-suppliers'],
  'mexico-manufacturing-feasibility': ['manufacturing-feasibility', 'market-consultations'],
  'mexico-market-entry': ['market-entry', 'partnership-intelligence'],
  
  // Cristina's Services - Frontend expects vs Database has
  'usmca-certificate-generation': ['certificate-generation', 'usmca-certificates'],
  'hs-code-classification': ['hs-classification', 'product-classification'],
  'document-review': ['document-review', 'verification-documents'],
  'monthly-support': ['monthly-support', 'ongoing-support'],
  'crisis-response': ['crisis-response', 'emergency-support']
};

// Use mapping in API calls
const fetchServiceRequests = async (expectedServiceType) => {
  const dbServiceTypes = SERVICE_TYPE_MAPPING[expectedServiceType] || [expectedServiceType];
  const response = await fetch(`/api/admin/service-requests?types=${dbServiceTypes.join(',')}`);
  return response.json();
};
```

### 2. Database Query Fixes
Update API calls to handle multiple service type variations:

```javascript
// Instead of exact match, use inclusive filtering
const getServiceRequests = async (serviceTypes) => {
  try {
    const typeFilter = Array.isArray(serviceTypes) 
      ? serviceTypes.map(type => `service_type ILIKE '%${type}%'`).join(' OR ')
      : `service_type ILIKE '%${serviceTypes}%'`;
      
    const response = await fetch(`/api/admin/service-requests?filter=${encodeURIComponent(typeFilter)}`);
    const data = await response.json();
    return data.requests || [];
  } catch (error) {
    console.error('Error fetching service requests:', error);
    return [];
  }
};
```

### 3. Component Data Fetching Fixes

#### Jorge's Components
```javascript
// SupplierSourcingTab.js - Fix service type filtering
useEffect(() => {
  const fetchData = async () => {
    const serviceTypes = ['supplier-vetting', 'supplier-sourcing', 'mexico-supplier-sourcing'];
    const requests = await getServiceRequests(serviceTypes);
    setSupplierRequests(requests);
  };
  fetchData();
}, []);

// ManufacturingFeasibilityTab.js - Fix market consultation data
useEffect(() => {
  const fetchData = async () => {
    const serviceTypes = ['manufacturing-feasibility', 'market-consultations'];
    const requests = await getServiceRequests(serviceTypes);
    setFeasibilityRequests(requests);
  };
  fetchData();
}, []);

// MarketEntryTab.js - Fix market entry and partnership data
useEffect(() => {
  const fetchData = async () => {
    const serviceTypes = ['market-entry', 'partnership-intelligence'];
    const requests = await getServiceRequests(serviceTypes);
    setMarketEntryRequests(requests);
  };
  fetchData();
}, []);
```

#### Cristina's Components
```javascript
// Certific# Frontend Data Connection Fix

## Issue
Backend APIs and database are fully implemented, but frontend components show "No data found" instead of connecting to existing APIs.

## Task
Fix the data connection between existing frontend components and working backend APIs.

## Components That Need Data Connection

### Jorge's Components (components/jorge/)
- **SupplierSourcingTab.js** - Connect to `/api/admin/service-requests`
- **ManufacturingFeasibilityTab.js** - Connect to `/api/admin/market-intelligence`
- **MarketEntryTab.js** - Connect to `/api/admin/service-requests`
- **ServiceQueueTab.js** - Connect to `/api/admin/service-requests`

### Cristina's Components (components/broker/)
- **CertificateGenerationTab.js** - Connect to `/api/admin/professional-services`
- **HSCodeClassificationTab.js** - Connect to `/api/admin/service-requests`
- **ServiceQueueTab.js** - Connect to `/api/admin/service-requests`

## Required Fixes

### 1. API Data Fetching
Replace placeholder data with real API calls:

```javascript
// Instead of showing "No data found", fetch real data
useEffect(() => {
  const fetchServiceRequests = async () => {
    try {
      const response = await fetch('/api/admin/service-requests');
      const data = await response.json();
      setServiceRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    }
  };
  
  fetchServiceRequests();
}, []);
```

### 2. Dynamic Pricing Connection
Connect AI Report buttons to existing pricing API:

```javascript
// Fetch dynamic pricing instead of hardcoded values
const fetchServicePricing = async (serviceType) => {
  const response = await fetch(`/api/dynamic-pricing?service=${serviceType}`);
  const pricing = await response.json();
  return pricing.amount;
};
```

### 3. Service Queue Data Display
Populate tables with real database data:

```javascript
// Display actual service requests instead of empty tables
const serviceRequests = data?.requests?.map(request => ({
  clientName: request.client_name,
  serviceType: request.service_type,
  status: request.status,
  priority: request.priority,
  dueDate: request.due_date,
  progress: `Stage ${request.current_stage}/4`
}));
```

### 4. Workflow Modal Data
Connect workflow modals to existing session tracking:

```javascript
// Use real workflow session data
const handleStartWorkflow = async (serviceId) => {
  const response = await fetch(`/api/workflow-session?serviceId=${serviceId}`);
  const workflowData = await response.json();
  setActiveWorkflow(workflowData);
  setShowModal(true);
};
```

## Existing APIs to Connect To

### Working Endpoints (already implemented):
- `/api/admin/service-requests` - Service queue management
- `/api/admin/professional-services` - Professional service tracking
- `/api/dynamic-pricing` - Dynamic pricing system
- `/api/workflow-session` - Workflow progress tracking
- `/api/admin/market-intelligence` - Market intelligence data
- `/api/crisis-calculator` - Crisis response calculations

## Requirements
- **NO NEW BACKEND CODE** - Just connect to existing APIs
- Use existing CSS classes from `styles/salesforce-tables.css`
- Maintain current component structure
- Add proper loading states
- Add error handling for API failures
- Ensure all buttons have working onClick handlers

## Sample Data Requirements

### Use Existing Database Data
The database already contains sample data - the issue is frontend components aren't connecting properly:

**Existing Data to Leverage:**
- `service_requests` (3 rows) - Main service queue data
- `broker_operations` (8 rows) - Cristina's service operations  
- `collaboration_queue` (2 rows) - Cross-team projects
- `partner_pipeline` (2 rows) - Jorge's partnership work
- `workflow_sessions` (186 rows) - Extensive workflow tracking data
- `workflow_completions` (19 rows) - Completed workflows
- `service_pricing` (6 rows) - Dynamic pricing data

### Debug Data Connection Issues
Before adding new sample data, verify why existing data isn't appearing:

```javascript
// Test what's actually in the database
const debugDatabaseConnection = async () => {
  console.log('=== DATABASE DEBUG ===');
  
  // Check service_requests table
  const serviceRequests = await fetch('/api/admin/service-requests').then(r => r.json());
  console.log('Service Requests:', serviceRequests);
  
  // Check broker_operations table  
  const brokerOps = await fetch('/api/admin/broker-operations').then(r => r.json());
  console.log('Broker Operations:', brokerOps);
  
  // Check what service types exist
  const allServices = await fetch('/api/admin/service-requests?debug=true').then(r => r.json());
  console.log('All Service Types Found:', allServices);
};
```

### Verify API Endpoints Return Existing Data
Test that your 100+ APIs are actually returning the sample data:

```javascript
// Verify each API endpoint works
const testEndpoints = [
  '/api/admin/service-requests',
  '/api/admin/professional-services', 
  '/api/workflow-session',
  '/api/dynamic-pricing'
];

testEndpoints.forEach(async (endpoint) => {
  const response = await fetch(endpoint);
  const data = await response.json();
  console.log(`${endpoint}:`, data);
});
```

## Focus
Fix the data fetching and display - the infrastructure is there, just need the frontend to use it.