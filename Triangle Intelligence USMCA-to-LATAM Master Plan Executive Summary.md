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

## 🌎 LATAM Expansion Integration

### Phase 6: Chile Integration (Month 4-6)
**"The Bridge" Country - USMCA to Chile**

#### 6.1 U.S.-Chile FTA Integration
```sql
-- Add Chile FTA data
chile_fta_rules (
    hs_code TEXT PRIMARY KEY,
    us_chile_qualified BOOLEAN,
    chile_tariff_rate DECIMAL,
    us_mfn_rate DECIMAL,
    origin_requirements TEXT,
    staging_category TEXT
);

-- Chile market access data
chile_market_access (
    sector TEXT,
    import_requirements TEXT[],
    key_regulations TEXT,
    logistics_hubs TEXT[], -- Valparaíso, San Antonio
    documentation_needed TEXT[]
);
```

#### 6.2 Chile Market Access Module
- **USMCA Bridge Logic**: "You manufacture in Mexico under USMCA. Here's how to use those components for Chile-US FTA"
- **Market Intelligence**: Chilean import procedures, key sectors (fruits, wine, mining equipment)
- **Logistics Corridors**: Laredo, TX to Chilean ports

### Phase 7: Peru Integration (Month 7-9)
**Strategic Expansion - U.S.-Peru TPA**

#### 7.1 Peru Trade Promotion Agreement Data
```sql
-- Peru TPA integration
peru_tpa_rules (
    hs_code TEXT PRIMARY KEY,
    us_peru_qualified BOOLEAN,
    peru_tariff_rate DECIMAL,
    tpa_preferential_rate DECIMAL,
    origin_requirements TEXT,
    staging_schedule TEXT
);
```

#### 7.2 Peru Market Module
- **USMCA-Peru Bridge**: Connect existing USMCA supply chains to Peru opportunities
- **Key Sectors**: Agricultural machinery, textiles, mining equipment
- **Regulatory Framework**: Peru customs procedures, SUNAT requirements

## 📊 Enhanced User Interface (USMCA + LATAM)

### Updated Single Workflow Page
```
┌─────────────────────────────────────────────────┐
│ 1. Product Input Section                       │
│   • Product description (intelligent matching) │
│   • Current USMCA supply chain details         │
│   • Target expansion markets (Chile/Peru)      │
│   • Annual export volume potential             │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ 2. Multi-Market Results Section                │
│   • USMCA qualification status                 │
│   • Chile FTA qualification & savings          │
│   • Peru TPA qualification & savings           │
│   • Cross-market optimization opportunities    │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ 3. Bridge Strategy Output                      │
│   • Multi-market certificate generation        │
│   • USMCA → Chile/Peru expansion roadmap       │
│   • Set up alerts for all markets              │
│   • Logistics corridor recommendations         │
└─────────────────────────────────────────────────┘
```

### Enhanced Alert Categories
- **USMCA Updates**: Standard regulatory changes
- **Chile FTA Changes**: U.S.-Chile agreement modifications
- **Peru TPA Updates**: Trade Promotion Agreement changes
- **Cross-Market Opportunities**: New supply chain optimization possibilities
- **Market Access Changes**: Chilean/Peruvian import regulation updates

## 🎯 Strategic Positioning: "USMCA Bridge to LATAM"

### Core Value Proposition
- **Not a generic LATAM platform**
- **The USMCA Platform for Expanding into Latin America**
- **Leverage existing USMCA expertise for Chile/Peru expansion**

### Target User Journey
1. **Current State**: Company comfortable with USMCA rules
2. **Expansion Goal**: Want to export to Chile or Peru
3. **Bridge Solution**: "You manufacture in Mexico under USMCA. Here's how to qualify for Chile-US FTA"
4. **Competitive Advantage**: Deep USMCA knowledge + LATAM expansion = unique positioning

## 🏗️ Updated Implementation Priority

### Phase 1-5: Core USMCA Platform (Weeks 1-6)
- [Same as before - USMCA compliance foundation]

### Phase 6: Chile Integration (Weeks 7-10)
- Integrate U.S.-Chile FTA data and rules
- Build Chile Market Access Module
- Create "Bridge" logic connecting USMCA to Chile opportunities
- Add Chilean port/logistics data

### Phase 7: Peru Integration (Weeks 11-14)
- Add U.S.-Peru TPA data
- Build Peru market intelligence
- Create multi-market comparison tools
- Enhanced supply chain optimization

### Phase 8: LATAM Expansion Features (Weeks 15-16)
- Multi-market certificate generation
- Cross-border logistics optimization
- Advanced alert system for all markets
- Partner integration for LATAM expansion

## 🎪 Enhanced Revenue Model

### Tiered Approach
- **USMCA Professional**: $299/month (existing plan)
- **LATAM Bridge**: $599/month 
  - All USMCA features
  - Chile FTA tools and alerts
  - Peru TPA integration
  - Cross-market optimization
- **Global Enterprise**: $999/month
  - Everything + API access
  - Custom market analysis
  - White-label for customs brokers

## 🚀 Ready to Start - Updated

**Next Agent Should:**
1. **Build core USMCA workflow** (foundation first)
2. **Design extensible architecture** for Chile/Peru integration
3. **Create "Bridge" user experience** (USMCA → LATAM)
4. **Set up multi-market database schema**
5. **Plan Chile FTA integration** (Phase 6)

**Strategic Focus**: Build the best USMCA platform with a clear, valuable path into Chile and Peru - not generic LATAM coverage!