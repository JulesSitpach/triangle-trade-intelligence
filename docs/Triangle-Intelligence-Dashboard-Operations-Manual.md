# Triangle Intelligence Platform - Dashboard Operations Manual

## 🎯 **Core Principle: Information Procurement, Not Data Entry**

Each dashboard is designed as an **Information Broker System** where team members leverage their expertise for **relationship management and validation**, not manual data processing.

---

## 🚀 **Customer Journey Flow**

### **Step 1: Free 15-Minute Consultation (Lead Generation)**
**Location**: `/services/mexico-trade-services`

**Purpose**: Basic intake form to help Jorge prepare for a **FREE 15-minute consultation** to assess if the client is interested in paid services.

**Client Fills Out:**
- Company name, contact info
- Service interest (Supplier Vetting, Market Entry, Partnership Intelligence)
- Basic project description
- Timeline and budget range
- Current challenges

**Jorge's Next Step:**
- Reviews form submission
- Schedules **15-minute consultation call**
- Assesses client needs and fit
- Recommends appropriate paid service

### **Step 2: Paid Service Execution (Information Procurement)**
**Location**: Jorge's Dashboard `/admin/jorge-dashboard-clean`

**IF CLIENT PURCHASES SERVICE**, Jorge executes using Information Broker Pattern:
- **Manufacturing Feasibility** ($650) - 4-stage workflow
- **Supplier Sourcing** ($450) - 3-stage workflow
- **Market Entry** ($550) - 3-stage workflow

**Critical Distinction:**
- **Free consultation form** = Lead generation (client fills out)
- **Paid service workflow** = Information procurement (Jorge sends forms to network)

---

## 📊 **Complete Sales & Service Flow**

### **Phase 1: Lead Generation (Free)**
```
Client visits website → /services/mexico-trade-services
↓
Client fills basic intake form:
  - Service interest (Supplier/Market Entry/Partnership)
  - Company info
  - Project description
  - Timeline & budget
↓
Form submitted to Jorge's dashboard
↓
Jorge reviews → Schedules 15-min consultation call
↓
During call: Jorge assesses needs, explains services, recommends solution
```

### **Phase 2: Service Purchase Decision**
```
IF Client says YES:
  → Jorge creates service request in dashboard
  → Client receives invoice ($450-$650)
  → Payment processed
  → Service workflow begins (Information Procurement Pattern)

IF Client says NO:
  → Jorge marks as "Not Interested"
  → Client added to nurture list
  → No service workflow needed
```

### **Phase 3: Service Execution (Paid Services Only)**

#### **Manufacturing Feasibility ($650)**
```
Stage 1: Jorge sends client detailed intake form → Client completes → Upload
Stage 2: Jorge discovers Mexico contacts → Sends info requests → Collects responses
Stage 3: Jorge validates system analysis → Adds local market insights
Stage 4: AI generates report → Jorge reviews → Delivers to client → Invoice $650
```

#### **Supplier Sourcing ($450)**
```
Stage 1: Jorge sends supplier requirement form → Client completes → Upload
Stage 2: Jorge activates supplier network → Sends capability forms → Collects responses
Stage 3: Jorge validates supplier quality → Adds vetting insights
Stage 4: AI generates recommendations → Jorge reviews → Delivers → Invoice $450
```

#### **Market Entry ($550)**
```
Stage 1: Jorge sends market strategy form → Client completes → Upload
Stage 2: Jorge identifies partners → Sends partnership inquiries → Collects proposals
Stage 3: Jorge validates opportunities → Adds market expertise
Stage 4: AI generates strategy → Jorge reviews → Delivers → Invoice $550
```

### **Key Insight: Two Different Forms**

#### **Consultation Form (Free)**
- **Location**: Public website `/services/mexico-trade-services`
- **Purpose**: Lead qualification
- **Filled by**: Potential client
- **Fields**: Basic (7-10 fields)
- **Jorge's action**: Review and call
- **Outcome**: Assess interest, recommend service

#### **Service Intake Form (Paid)**
- **Location**: Jorge's dashboard (after purchase)
- **Purpose**: Service execution
- **Filled by**: Paying client
- **Fields**: Comprehensive (20+ fields)
- **Jorge's action**: Send form, upload response
- **Outcome**: Execute full service workflow

### **Visual Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                    FREE CONSULTATION PHASE                       │
│                  (Lead Generation - No Payment)                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
    Client visits: http://localhost:3004/services/mexico-trade-services
                              ↓
              Client fills basic form (7-10 fields):
              - Company name, contact info
              - Service interest dropdown
              - Basic project description
              - Timeline, budget range
                              ↓
                  Form saved to database
                              ↓
              Jorge sees lead in "Service Queue" tab
                              ↓
          Jorge reviews → Calls client (15 minutes)
                              ↓
                    ┌─────────────────┐
                    │  Client Decision │
                    └─────────────────┘
                    ↙               ↘
            ┌─────────┐         ┌─────────┐
            │   YES   │         │   NO    │
            │ I want  │         │  Not    │
            │ service │         │interested│
            └─────────┘         └─────────┘
                 ↓                    ↓
                 │              Jorge marks
                 │              "Not Interested"
                 │              → Nurture list
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PAID SERVICE PHASE                            │
│              (Information Procurement Workflow)                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                Jorge creates service request
                    (Manufacturing Feasibility,
                    Supplier Sourcing, or Market Entry)
                              ↓
              Client receives invoice ($450-$650)
                              ↓
                     Payment processed
                              ↓
    Jorge opens service workflow in dashboard → Modal opens
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              STAGE 1: CLIENT INFORMATION PROCUREMENT             │
└─────────────────────────────────────────────────────────────────┘
              Jorge clicks "📧 Send Client Form"
                    (Detailed 20+ field form)
                              ↓
              Client fills comprehensive intake
                              ↓
              Jorge clicks "📁 Upload Response"
                              ↓
                  AUTO-ADVANCE TO STAGE 2
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│       STAGE 2: CONTACT DISCOVERY & INFORMATION REQUESTS          │
└─────────────────────────────────────────────────────────────────┘
          Jorge clicks "🔍 Discover Contacts"
            (System finds Mexico network contacts)
                              ↓
        Jorge clicks "📧 Send Information Requests"
            (Forms sent to suppliers/partners)
                              ↓
                  AUTO-ADVANCE TO STAGE 3
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           STAGE 3: DATA ANALYSIS & VALIDATION                    │
└─────────────────────────────────────────────────────────────────┘
          Jorge clicks "⚠️ Review & Validate"
            (Adds Mexico market expertise)
                              ↓
                  AUTO-ADVANCE TO STAGE 4
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│          STAGE 4: REPORT GENERATION & DELIVERY                   │
└─────────────────────────────────────────────────────────────────┘
          Jorge clicks "📋 Generate Report"
              (AI creates professional deliverable)
                              ↓
          Jorge clicks "📧 Deliver to Client"
                              ↓
              Service completed → Invoice sent
                              ↓
                    Workflow closes
```

---

## 👥 **Team Member Roles & Dashboards**

### 🇲🇽 **Jorge - Latin America Partnership Expert**
- **Dashboard**: `/admin/jorge-dashboard-clean`
- **Expertise**: Mexico network, manufacturing contacts, regulatory insights
- **Role**: Information procurement through network relationships

### 🏛️ **Cristina - Compliance & Logistics Specialist**
- **Dashboard**: `/admin/broker-dashboard`
- **Expertise**: US/Canada/Mexico customs, USMCA compliance, logistics
- **Role**: Document procurement and expert validation

---

## 📋 **Jorge's Dashboard - 4 Service Tabs**

### **Tab 1: Service Queue**
**Purpose**: Manage incoming service requests across all Jorge's services

**Workflow**:
1. **View Active Requests** - All pending manufacturing, supplier, and market entry requests
2. **Filter by Service Type** - Focus on specific service categories
3. **Priority Management** - Handle urgent requests first
4. **Quick Actions** - Open service workflows with one click

### **Tab 2: Manufacturing Feasibility**
**Service**: $650 - 4-Stage Complex Research

#### **Stage 1: Client Information Procurement**
**Jorge's Actions:**
- Click **"📧 Send Client Form"** → Sends digital intake form to client
- Wait for client completion
- Click **"📁 Upload Response"** → Processes client form (auto-advances to Stage 2)

**Jorge NEVER**: Re-types client information that exists in forms

#### **Stage 2: Contact Discovery & Information Requests**
**Jorge's Actions:**
- Click **"🔍 Discover Contacts"** → System finds 4 Mexico contacts:
  - Industrial Park Manager (Tijuana)
  - Facility Provider (Guadalajara)
  - Logistics Company (Monterrey)
  - Regulatory Expert (Mexico City)
- Click **"📧 Send Information Requests"** → Sends forms to all contacts (auto-advances to Stage 3)

**Jorge NEVER**: Manually creates contact lists or types contact info

#### **Stage 3: Data Analysis & Validation**
**Jorge's Actions:**
- Click **"⚠️ Review & Validate"** → Validates system analysis with local market knowledge (auto-advances to Stage 4)
- Add context the database can't know: market conditions, relationship factors, regulatory reality

**Jorge NEVER**: Re-analyzes data the system already processed

#### **Stage 4: Report Generation & Delivery**
**Jorge's Actions:**
- Click **"📋 Generate Report"** → AI creates professional deliverable from all collected data
- Click **"📧 Deliver to Client"** → Completes service, generates $650 invoice, closes workflow

**Jorge NEVER**: Writes reports from scratch - reviews and approves AI-generated content

### **Tab 3: Supplier Sourcing**
**Service**: $450 - 3-Stage Standard Research

#### **Stage 1: Requirements Procurement**
- Send supplier requirement forms to clients
- Upload completed specifications

#### **Stage 2: Network Discovery**
- Discover suppliers through Jorge's Mexico network
- Send capability assessment forms to suppliers
- Collect supplier responses and certifications

#### **Stage 3: Recommendation Delivery**
- Validate supplier capabilities with local knowledge
- Generate supplier recommendations with contact introductions
- Deliver vetted supplier list ($450 billing)

### **Tab 4: Market Entry Support**
**Service**: $550 - 3-Stage Consultation

#### **Stage 1: Strategy Procurement**
- Send market entry assessment forms to clients
- Upload business strategy requirements

#### **Stage 2: Partnership Discovery**
- Identify potential Mexico partners through network
- Send partnership inquiry forms
- Collect partnership proposals and terms

#### **Stage 3: Strategy Delivery**
- Validate opportunities with market expertise
- Generate market entry strategy with partnership introductions
- Deliver strategic recommendations ($550 billing)

---

## 🏛️ **Cristina's Dashboard - 4 Compliance Services**

### **Tab 1: Service Queue**
**Purpose**: Manage compliance and customs service requests

**Workflow**:
1. **View Active Requests** - All pending compliance services
2. **Priority by Urgency** - Crisis response first, monthly support last
3. **Capacity Tracking** - Monitor monthly service limits
4. **Revenue Tracking** - Track current month earnings

### **Tab 2: USMCA Certificate Generation**
**Service**: $200/certificate - 32/40 monthly capacity

#### **Stage 1: Document Procurement**
**Cristina's Actions:**
- Send USMCA document request checklist to client
- Upload client-provided product specs, manufacturing details, component sourcing

#### **Stage 2: Expert Validation**
- Send origin determination forms to customs experts
- Collect expert validation on USMCA qualification rules

#### **Stage 3: Compliance Analysis**
- Review expert validations against regulatory database
- Validate qualification logic with compliance experience

#### **Stage 4: Certificate Generation**
- Generate professional USMCA certificate
- Deliver with compliance notes ($200 billing)

### **Tab 3: HS Code Classification**
**Service**: $150/code - 45/60 monthly capacity

#### **Stage 1: Product Documentation**
- Send technical specification request forms
- Upload product descriptions, composition details, intended use

#### **Stage 2: Expert Analysis**
- Send classification forms to HS code specialists
- Collect expert classification analysis

#### **Stage 3: Validation & Alternatives**
- Cross-reference against HS master database
- Validate practical tariff implications

#### **Stage 4: Classification Delivery**
- Generate classification report with justification
- Deliver with tariff strategy recommendations ($150 billing)

### **Tab 4: Customs Clearance Support**
**Service**: $300/shipment - 22/30 monthly capacity

#### **Stage 1: Shipment Documentation**
- Send customs document checklist to client
- Upload commercial invoices, packing lists, certificates

#### **Stage 2: Compliance Review**
- Send documentation to compliance auditors for review
- Collect error identification and compliance gaps

#### **Stage 3: Resolution Planning**
- Prioritize compliance issues by risk level
- Plan clearance strategy with expert input

#### **Stage 4: Clearance Execution**
- Execute customs clearance process
- Deliver clearance confirmation ($300 billing)

### **Tab 5: Crisis Response Management**
**Service**: $500/incident - 8/15 monthly capacity - PRIORITY

#### **Stage 1: Crisis Assessment**
- Upload crisis documentation: rejected certificates, customs correspondence
- Emergency document collection

#### **Stage 2: Expert Emergency Response**
- Contact emergency compliance specialists immediately
- Rapid assessment forms and emergency consultations

#### **Stage 3: Root Cause Analysis**
- System analyzes crisis causes
- Cristina validates against regulatory reality

#### **Stage 4: Resolution & Prevention**
- Generate crisis resolution plan
- Deliver with prevention measures ($500 billing)

---

## 🔄 **Universal Workflow Patterns**

### **Information Flow Architecture**
```
Client Request → Jorge/Cristina Sends Forms → Third Parties Complete → Upload Responses → System Analysis → Expert Validation → AI Report Generation → Professional Delivery
```

### **What Team Members DO:**
- ✅ **Send digital forms** to clients and contacts
- ✅ **Upload completed responses** from forms
- ✅ **Validate system analysis** with expert knowledge
- ✅ **Add context** database can't provide
- ✅ **Approve AI-generated deliverables**
- ✅ **Manage relationships** and follow-up

### **What Team Members NEVER DO:**
- ❌ **Manual data entry** of information that exists in forms
- ❌ **Re-typing contact information** or client details
- ❌ **Writing reports from scratch** - review and approve AI content
- ❌ **Recreating analysis** the system already performed
- ❌ **Complex form filling** - send forms to others instead

### **Button States & Logic**
- **Stage 1 Buttons**: Send Form (enabled) → Upload Response (enabled after send)
- **Stage 2 Buttons**: Discover Contacts (enabled) → Send Requests (enabled after discovery)
- **Stage 3 Buttons**: Review Analysis (enabled after requests) → Generate Report (enabled after review)
- **Stage 4 Buttons**: Deliver to Client (enabled after generation) → Complete Billing

### **Automatic Progression**
- **Each action automatically advances** to the next stage
- **No manual stage navigation** required
- **Clear progress indicators** show completion status
- **Professional alerts** confirm each action

---

## 💰 **Revenue & Capacity Tracking**

### **Jorge's Services - Current Capacity**
- **Manufacturing Feasibility**: $650/service - No monthly limit
- **Supplier Sourcing**: $450/service - No monthly limit
- **Market Entry**: $550/service - No monthly limit
- **Total Potential**: Unlimited based on network capacity

### **Cristina's Services - Monthly Limits**
- **USMCA Certificates**: $200 × 32 completed = $6,400/month (80% capacity)
- **HS Classifications**: $150 × 45 completed = $6,750/month (75% capacity)
- **Customs Clearance**: $300 × 22 completed = $6,600/month (73% capacity)
- **Crisis Response**: $500 × 8 completed = $4,000/month (53% capacity)
- **Current Monthly Revenue**: $23,750

---

## 🎯 **Success Metrics**

### **Efficiency Goals**
- **Jorge spends < 2 minutes per stage** on data entry
- **95% of information comes from uploaded forms**
- **Contact discovery finds 10+ relevant contacts per service**
- **AI reports generate within 5 minutes** of final upload

### **Quality Standards**
- **Cristina spends < 3 minutes per stage** on manual entry
- **90% of compliance data extracted from uploaded documents**
- **Expert network provides validation within 24-48 hours**
- **Compliance deliverables generate within 10 minutes** of final validation

### **Business Results**
- **Professional service delivery** without data entry burden
- **Scalable information procurement** through network relationships
- **Consistent quality** through expert validation
- **Automated billing** and workflow completion

---

## 🚀 **Implementation Status**

### **✅ Currently Working:**
- **Jorge's Manufacturing Feasibility** - Full 4-stage workflow with auto-progression
- **Button functionality** - All actions trigger proper state changes
- **Automatic advancement** - Stages progress without manual navigation
- **Professional alerts** - Clear feedback for each action
- **Service completion** - Workflow closes and marks requests complete

### **🔄 Next Implementation:**
- **Jorge's Supplier Sourcing** - Apply same pattern
- **Jorge's Market Entry** - Apply same pattern
- **Cristina's Compliance Services** - Adapt pattern for compliance workflow
- **Cross-dashboard consistency** - Ensure all services follow Information Broker Pattern

---

## 📞 **Support & Training**

### **If Dashboards Don't Work:**
1. **Hard refresh** browser (Ctrl+Shift+R)
2. **Clear browser cache**
3. **Check server**: `http://localhost:3004`
4. **Verify login**: Use triangleintel@gmail.com
5. **Check console** for JavaScript errors

### **Training Notes:**
- **Focus on relationship management** - Jorge and Cristina are network coordinators
- **Trust the automation** - System handles data processing
- **Validate, don't recreate** - Add expertise without starting over
- **Professional delivery** - AI generates, experts approve

---

*This manual reflects the Information Broker Pattern implementation where team expertise is leveraged for relationship management and quality validation, not manual data processing.*

**Last Updated**: September 2025
**Version**: 1.0 - Manufacturing Feasibility Implementation
**Status**: Production Ready - Jorge's Manufacturing Service