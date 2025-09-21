# Agent Prompt: Triangle Intelligence Dashboard Development - Phase 1

## Project Context

Build functional dashboard components for Triangle Intelligence's USMCA compliance platform. Focus on completing existing Jorge dashboard and creating Cristina's dashboard structure using the current codebase as foundation.

## Current Codebase Status

### Existing Implementation
- **Jorge Dashboard**: `pages/admin/jorge-dashboard-clean.js` - Basic structure exists
- **Database**: Supabase PostgreSQL with established tables
- **Styling**: `salesforce-tables.css` - Use existing classes
- **Project Structure**: Next.js 14 Pages Router, React 18

### Known Working Elements
- Database connection via Supabase
- Basic admin dashboard framework
- Existing API endpoints in `pages/api/admin/`
- CSS styling system

## Phase 1 Objectives (This Session)

### Priority 1: Complete Jorge's Dashboard
**File to modify**: `pages/admin/jorge-dashboard-clean.js`

**Add these specific tab implementations:**

#### Tab 1: Service Queue
- Table displaying records from `service_requests` table
- Columns: Client Name, Service Type, Status, Due Date, Actions
- Basic CRUD operations (view, update status)
- Filter by service type (Supplier Verification, Market Entry, Intelligence)

#### Tab 2: Supplier Vetting  
- Table for `suppliers` table records
- Columns: Supplier Name, Location, Status, Contact, Verification Date
- Add supplier form with basic fields
- Update verification status functionality

#### Tab 3: Market Entry
- Filter `service_requests` for market entry consultations
- Track consultation hours and project status
- Basic project timeline display

#### Tab 4: Supplier Intel
- Simple RSS feed display (use existing `rss_feeds` table)
- Basic filtering by keywords
- Mark items as reviewed functionality

### Priority 2: Create Cristina's Dashboard Structure
**Create new file**: `pages/admin/cristina-dashboard.js`

**Basic structure with four tabs:**
- Service Queue (similar to Jorge's)
- Certificate Generation 
- HS Code Classification
- Shipment Tracking

## Technical Implementation Requirements

### Database Connections
Use existing Supabase configuration:
```javascript
// Use existing pattern from other admin pages
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .order('created_at', { ascending: false });
```

### Styling Requirements
- Use existing `salesforce-tables.css` classes
- Follow pattern from other admin pages
- Implement sortable tables with existing CSS
- Use consistent button styling

### Functional Requirements (Keep Simple)
- **Read operations**: Display data from tables
- **Update operations**: Status changes only
- **Basic filtering**: Client-side filtering by status/type
- **No external APIs**: Focus on database operations only

## What NOT to Build (This Session)

- External API integrations (AfterShip, SAM.gov)
- PDF report generation
- Complex real-time updates
- Authentication systems
- Advanced search functionality

## Specific Code Patterns to Follow

### Table Structure Template
```javascript
<table className="admin-table">
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {data.map(item => (
      <tr key={item.id}>
        <td>{item.field1}</td>
        <td>{item.field2}</td>
        <td>
          <button onClick={() => handleAction(item.id)}>
            Action
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Tab Navigation Pattern
Use existing admin dashboard tab structure with proper state management.

## Database Tables to Use

- `service_requests` - For both Jorge and Cristina service queues
- `suppliers` - Jorge's supplier vetting data
- `workflow_completions` - Cristina's certificate data
- `hs_master_rebuild` - HS code lookup data
- `rss_feeds` - Basic intelligence feed display

## Success Criteria

1. **Jorge's dashboard has 4 functional tabs** with data display
2. **Cristina's dashboard structure created** with basic tab navigation
3. **Database connections working** for read operations
4. **Status updates functional** for service requests
5. **Consistent styling** using existing CSS classes
6. **Error handling** for database connection issues

## Implementation Notes

- Start with Jorge's existing file and add missing functionality
- Copy successful patterns from existing admin pages
- Keep database queries simple (SELECT, UPDATE only)
- Use existing Supabase configuration
- Test each tab functionality before moving to next
- Focus on core CRUD operations over advanced features

Build incrementally - complete basic functionality before adding complexity. This phase establishes the foundation for future API integrations and report generation features.

I've completely rewritten the agent prompt to be realistic and achievable. Here are the key changes:

**Scope Reduction:**
- Focused on Phase 1 only (completing existing work)
- Removed complex API integrations for later phases
- Limited to basic CRUD operations on existing database tables

**Specific Technical Direction:**
- References existing file `pages/admin/jorge-dashboard-clean.js`
- Provides actual code patterns to follow
- Uses established Supabase connection methods
- Focuses on existing CSS classes

**Clear Boundaries:**
- Explicitly lists what NOT to build in this session
- Sets realistic success criteria
- Emphasizes incremental development

**Actionable Tasks:**
- Complete 4 specific tabs for Jorge's dashboard
- Create basic structure for Cristina's dashboard
- Focus on data display and simple status updates

**Implementation Notes:**
- Build on existing working elements
- Test each component before moving forward
- Keep database operations simple

This revised prompt gives the agent a clear, achievable scope that builds foundation functionality first. The agent can successfully complete these basic dashboard components, which then provides a solid foundation for adding API integrations and report generation in future phases.

The key insight is that trying to build everything at once leads to incomplete, non-functional code. This approach ensures working components that Jorge and Cristina can actually use while providing a foundation for future enhancements.

## Cristina's Dashboard Table Breakdown

### 📋 Service Queue Tab
**Data Source:** `service_requests` table filtered for Cristina's services
**Table Columns:**
- Client Name
- Service Type (USMCA Certificate, HS Classification, Customs Clearance, Crisis Response)
- Request Date
- Status (New, In Progress, Client Review, Complete)
- Due Date
- Urgency (Standard, Rush, Emergency)
- Documents Received (Yes/No/Partial)
- Actions (Start Work, Request Info, Complete, Invoice)

### 📜 Certificate Generation Tab
**Data Source:** `workflow_completions` + `certificates_generated` tables
**Table Columns:**
- Client Company
- Product Description
- HS Code
- USMCA Qualification Status (Qualified/Not Qualified/Pending)
- Certificate Status (Draft, Generated, Delivered)
- Regional Content % 
- Qualification Threshold (65% Electronics, 75% Auto, 62.5% Textiles)
- Actions (Auto-populate, Generate PDF, Email Client, Track Delivery)

### 🔍 HS Code Classification Tab
**Data Source:** `hs_master_rebuild` (34,476 codes) + classification history
**Table Columns:**
- Product Description
- Suggested HS Code
- Alternative Codes
- Tariff Rate (MFN vs USMCA)
- Classification Confidence
- Previous Classifications (for similar products)
- Status (Research, Verified, Client Approved)
- Actions (Search Database, Verify Code, Document Decision)

### 🚢 Shipment Tracking Tab
**Data Source:** AfterShip API integration + customs clearance records
**Table Columns:**
- Tracking Number
- Client Name
- Carrier
- Origin/Destination
- Shipment Status
- Customs Status (Cleared/Pending/Issues)
- Last Update
- Estimated Delivery
- Issues/Alerts
- Actions (Update Status, Contact Carrier, Resolve Issue, Notify Client)

## Report Generation by Dashboard Tab

### 📋 Service Queue
**Reports Generated:**
- Daily work queue summary
- Service completion metrics
- Client billing reports
- Capacity planning analysis

### 📜 Certificate Generation
**Reports Generated:**
- USMCA certificates (PDF deliverables - $200 each)
- Qualification analysis reports
- Regional content calculations
- Compliance verification documentation

### 🔍 HS Code Classification
**Reports Generated:**
- HS code verification reports ($150 each)
- Classification justification documents
- Tariff impact analysis
- Alternative code recommendations

### 🚢 Shipment Tracking
**Reports Generated:**
- Customs clearance status reports ($300 each)
- Shipment delay notifications
- Performance analytics for carriers
- Issue resolution documentation

Each dashboard pulls from your existing database infrastructure and generates the specific deliverables clients pay for, while also providing Cristina operational visibility into her workload and deadlines.
Yes, each dashboard tab will generate specific reports based on the data it manages:

## Report Generation by Dashboard Tab

### 📋 Service Queue Tab
**Reports Generated:**
- Weekly service status summary (what's pending, overdue, completed)
- Client workload report (which clients have multiple active requests)
- Performance metrics (average completion time by service type)
- Revenue tracking (completed services and billing status)

### 🏭 Supplier Vetting Tab
**Reports Generated:**
- Supplier verification reports ($950 deliverable for clients)
- Monthly supplier discovery summary
- Verification status dashboard for internal tracking
- Supplier performance metrics (delivery times, quality scores)

### 🇲🇽 Market Entry Tab
**Reports Generated:**
- Market entry strategy documents ($400/hour deliverable)
- Industry analysis reports for specific clients
- Consultation hour tracking and billing
- Implementation progress reports

### 📊 Supplier Intel Tab
**Reports Generated:**
- Monthly intelligence briefings ($500/month deliverable)
- RSS feed summaries filtered by client interests
- Partnership opportunity alerts (Canada-Mexico developments)
- Regulatory change notifications affecting suppliers

**Key Point:** The dashboards are both operational tools (for Jorge to manage his work) AND report generation systems (to create the deliverables clients pay for). Each tab pulls from your existing database tables and can export formatted reports using the data Jorge has been tracking and updating.

This approach means Jorge isn't doing double work - his daily dashboard activities automatically populate the client reports he needs to deliver.