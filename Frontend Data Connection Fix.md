# Frontend Data Connection Fix

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

## Focus
Fix the data fetching and display - the infrastructure is there, just need the frontend to use it.