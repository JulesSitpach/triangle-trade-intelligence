# Implementation Roadmap - USMCA Compliance Platform

## 🚀 Starting Point Assessment

### ✅ What We Have (Post-Cleanup)
- Clean page structure with essential pages
- Working API endpoints (`simple-usmca-compliance.js`, `simple-classification.js`)
- Core utilities in `/lib/core/` (USMCA classifier, tariff calculator)
- Basic layout components
- Language/i18n support

### 📋 What We Need to Build (From Master Plan)

## Phase 1: Core USMCA Workflow (Week 1-2)

### 1.1 Single Workflow Page (`/pages/usmca-workflow.js`)
**Replaces multi-stage system with single page containing:**

#### Input Section
- Product description (intelligent matching)
- Key components and their origins  
- Manufacturing/assembly location
- Annual import volume

#### Results Section
- HS code classification with confidence
- USMCA qualification status (Yes/No/Needs Documentation)
- Detailed rule explanation
- Tariff savings calculation

#### Output Section
- Download Certificate of Origin (PDF)
- Export compliance report
- **Set up alerts for this product** 
- Save analysis for future reference

### 1.2 Alert Management Dashboard (`/pages/alerts.js` - enhance existing)
- My Alerts: Active notifications for customer's saved products
- Alert History: Past notifications with actions taken
- Notification Settings: Email, SMS, in-app preferences by alert type
- Product Tracking: HS codes and trade routes being monitored

## Phase 2: Core APIs Enhancement (Week 2-3)

### 2.1 Enhance Existing APIs
- `simple-usmca-compliance.js` - Add certificate generation
- `simple-classification.js` - Improve HS code matching
- `simple-savings.js` - Add detailed breakdown

### 2.2 New Alert System APIs
```javascript
/api/alerts/
├── create-alert.js      // Set up new regulatory alert
├── get-alerts.js        // Fetch user's alerts
├── update-alert.js      // Modify alert preferences  
├── regulatory-feed.js   // Check CBP/CBSA/SAT updates
└── trigger-alerts.js    // Send notifications
```

## Phase 3: Database Schema (Week 3-4)

### 3.1 Create Core Tables (From Master Plan)
```sql
-- USMCA Rules of Origin Database
CREATE TABLE usmca_rules (
    hs_code TEXT PRIMARY KEY,
    product_description TEXT,
    rule_type TEXT, -- 'percentage', 'tariff_shift', 'process'
    regional_content_percentage DECIMAL,
    tariff_shift_rule TEXT,
    specific_process_requirements TEXT,
    certification_required BOOLEAN
);

-- Tariff Rates
CREATE TABLE tariff_rates (
    hs_code TEXT,
    country TEXT, -- US, CA, MX
    mfn_rate DECIMAL,
    usmca_rate DECIMAL,
    effective_date DATE,
    staging_category TEXT
);

-- HS Code Master Database  
CREATE TABLE hs_codes (
    hs_code TEXT PRIMARY KEY,
    description TEXT,
    chapter INTEGER,
    section TEXT,
    search_keywords TEXT[]
);

-- Customer Alerts
CREATE TABLE customer_alerts (
    id UUID PRIMARY KEY,
    user_id UUID,
    alert_type TEXT, -- 'regulatory', 'product_specific', 'deadline', 'operational'
    hs_codes TEXT[], -- Customer's tracked products
    countries TEXT[], -- Customer's trade routes
    alert_priority TEXT, -- 'critical', 'high', 'medium', 'info'
    notification_preferences JSONB, -- email, sms, in-app
    created_at TIMESTAMP,
    is_active BOOLEAN
);

-- Regulatory Updates
CREATE TABLE regulatory_updates (
    id UUID PRIMARY KEY,
    source TEXT, -- 'CBP', 'CBSA', 'SAT', 'USMCA_Committee'
    update_type TEXT, -- 'rule_interpretation', 'procedure_change', 'tariff_update'
    affected_hs_codes TEXT[],
    affected_countries TEXT[],
    effective_date DATE,
    update_content TEXT,
    severity TEXT, -- 'critical', 'high', 'medium', 'low'
    created_at TIMESTAMP
);
```

## Phase 4: PDF Certificate Generation (Week 4)

### 4.1 Certificate Templates
- Official USMCA Certificate of Origin form
- Auto-populate all required fields
- PDF generation with proper formatting
- Digital signature support

## Phase 5: Regulatory Alert System (Week 5-6)

### 5.1 Alert Processing Engine
- Monitor CBP, CBSA, SAT regulatory feeds
- Parse updates for HS code impacts
- Match against customer alert preferences
- Trigger notifications (email/SMS/in-app)

### 5.2 Alert Categories (From Master Plan)
- **Critical Compliance Changes**: New USMCA interpretations
- **Product-Specific Updates**: HS reclassifications  
- **Deadline Reminders**: Certificate renewals
- **Operational Updates**: Port procedure changes

## 🎯 Success Metrics

### Operational Metrics
- Classification accuracy rate >95%
- Certificate acceptance rate by customs >98%  
- Average time to complete analysis <3 minutes

### Business Metrics
- Customer LTV >$15,000
- Alert engagement rate >60%
- Certificate download rate >80%

## 📋 Implementation Rules (For Agent)

### Development Standards
- Follow all rules from Triangle Intelligence Development Rules artifact
- No inline styles, no hard coding, maximum flexibility
- Components under 150 lines
- Configuration-driven development

### File Structure
```
/pages/
├── usmca-workflow.js     // Main single workflow
├── alerts.js             // Alert management (enhance existing)
└── certificate/[id].js   // Certificate viewer

/components/
├── USMCAWorkflow/        // Main workflow component
├── AlertManagement/      // Alert system components  
├── CertificateGenerator/ // PDF generation
└── shared/              // Reusable UI components

/lib/
├── core/usmca/          // USMCA business logic
├── alerts/              // Alert processing
├── pdf/                 // Certificate generation
└── config/              // All configuration
```

### Priority Order
1. **Build single USMCA workflow page** (replaces all stages)
2. **Enhance alert system** (key differentiator)
3. **Add PDF certificate generation**
4. **Create regulatory monitoring**
5. **Polish and optimize**

## 🚀 Ready to Start

**Next Agent Should:**
1. Create `/pages/usmca-workflow.js` with single workflow
2. Build reusable USMCA form components  
3. Enhance existing alert management
4. Set up proper database schema
5. Implement PDF generation

**All foundation is ready - core APIs exist, cleanup is done, rules are established!**