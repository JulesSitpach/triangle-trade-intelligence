# Business Type vs Industry Sector Analysis
**Date**: October 15, 2025
**Issue**: Field name confusion between business role and industry classification

---

## 🚨 CRITICAL FINDING: NAMING CONFUSION

The field `business_type` is being used for **TWO DIFFERENT PURPOSES** across the application:

### Purpose 1: Industry Sector (Current USMCA Workflow)
- **Location**: `/usmca-workflow` → `CompanyInformationStep.js`
- **Values**: Agriculture & Food, Automotive, Electronics & Technology, Energy Equipment, General, General Manufacturing, Machinery & Equipment, Other, Textiles & Apparel
- **Source**: `pages/api/database-driven-dropdown-options.js` lines 128-172
- **Query**: Pulls from `usmca_qualification_rules` table's `product_category` column
- **Purpose**: HS code classification - helps AI classify products into correct tariff codes

### Purpose 2: Business Role (Service Request Form)
- **Location**: `/services/request-form` → Service Request Form
- **Values**: Importer, Exporter, Manufacturer, Distributor
- **Purpose**: Capture the company's role in the supply chain
- **Admin Need**: Team needs to know if they're talking to an importer, exporter, etc.

---

## 📊 CURRENT STATE ANALYSIS

### USMCA Workflow (`/usmca-workflow`)

**What It Collects:**
```javascript
// CompanyInformationStep.js line 105-122
<label>Business Type *</label>  // MISLEADING NAME!
<select>
  <option value="">Select primary business activity</option>
  // Populated with INDUSTRY SECTORS:
  <option value="Agriculture & Food">Agriculture & Food</option>
  <option value="Automotive">Automotive</option>
  <option value="Electronics & Technology">Electronics & Technology</option>
  // ... etc
</select>
<div className="form-help">Primary activity for trade classification</div>
```

**Database Source:**
- API: `/api/database-driven-dropdown-options?category=business_types`
- Query: `SELECT product_category FROM usmca_qualification_rules`
- Result: Returns INDUSTRY SECTORS for HS classification

**Stored As:**
```javascript
formData.business_type = "Automotive"  // Actually an industry sector!
```

### Service Request Form (`/services/request-form`)

**What It NOW Collects (After Our Changes):**
```javascript
// request-form.js lines 250-286
<label>Business Type *</label>  // CORRECT - Business Role
<select name="business_type">
  <option value="Importer">Importer</option>
  <option value="Exporter">Exporter</option>
  <option value="Manufacturer">Manufacturer</option>
  <option value="Distributor">Distributor</option>
</select>

<label>Industry Sector</label>  // NEW FIELD
<select name="industry_sector">
  <option value="Agriculture & Food">Agriculture & Food</option>
  <option value="Automotive">Automotive</option>
  // ... etc
</select>
```

**Stored As:**
```javascript
formData.business_type = "Importer"  // Correct role
formData.industry_sector = "Automotive"  // Correct industry
```

---

## 🔥 DOWNSTREAM IMPACT ANALYSIS

### 1. Database Storage (`usmca_workflows` table)

**Current Schema:**
```sql
CREATE TABLE usmca_workflows (
  id UUID PRIMARY KEY,
  user_id UUID,
  company_data JSONB,  -- Contains business_type
  ...
);
```

**What's Stored:**
```json
{
  "company_data": {
    "company_name": "Acme Corp",
    "business_type": "Automotive",  // Currently INDUSTRY SECTOR
    "trade_volume": "$1M-$5M"
  }
}
```

**Problem**: No field for business role (Importer/Exporter) in USMCA workflows.

### 2. Admin Dashboards

**What Admin Sees:**
```javascript
// components/shared/TradeHealthCheckTab.js
const subscriberData = request.subscriber_data;
console.log(subscriberData.business_type);
// USMCA workflow: "Automotive" (industry)
// Service request: "Importer" (role)
// INCONSISTENT!
```

**Admin Needs BOTH:**
- Business Role: To understand client's position in supply chain
- Industry Sector: To understand product category for tariff analysis

### 3. AI Analysis (`lib/services/workflow-service.js`)

**Current API Call:**
```javascript
// Line 154-157
business_type: formData.business_type,
// AI receives: "Automotive" from workflow OR "Importer" from service request
// INCONSISTENT BUSINESS CONTEXT!
```

**Impact on AI:**
- AI needs BOTH fields for proper analysis
- "Automotive" helps with HS code classification
- "Importer" helps with compliance responsibilities

### 4. Component Enrichment (October 2025 Feature)

**Current Implementation:**
```javascript
// Enrichment uses business_type for industry context
const hsCode = await classifyComponent(
  component.description,
  formData.business_type  // Could be industry OR role!
);
```

**Problem**: HS classification needs industry sector, not business role.

---

## ✅ RECOMMENDED SOLUTION

### Phase 1: Add `industry_sector` to USMCA Workflow ✅ COMPLETED

**Service Request Form** already has both fields:
- `business_type`: Importer, Exporter, Manufacturer, Distributor
- `industry_sector`: Agriculture & Food, Automotive, etc.

### Phase 2: Add `industry_sector` to USMCA Workflow (REQUIRED)

**Update `CompanyInformationStep.js`:**
```javascript
// ADD THIS FIELD after business_type dropdown:
<div className="form-group">
  <label className="form-label required">Business Type</label>
  <select
    className="form-select"
    value={formData.business_type}
    onChange={(e) => updateFormData('business_type', e.target.value)}
    required
  >
    <option value="">Select business role</option>
    <option value="Importer">Importer</option>
    <option value="Exporter">Exporter</option>
    <option value="Manufacturer">Manufacturer</option>
    <option value="Distributor">Distributor</option>
  </select>
  <div className="form-help">Your role in the supply chain</div>
</div>

<div className="form-group">
  <label className="form-label required">Industry Sector</label>
  <select
    className="form-select"
    value={formData.industry_sector}
    onChange={(e) => updateFormData('industry_sector', e.target.value)}
    required
  >
    <option value="">Select industry</option>
    {dropdownOptions.businessTypes?.map(type => (
      <option key={type.value} value={type.value}>{type.label}</option>
    ))}
  </select>
  <div className="form-help">Primary product category for HS classification</div>
</div>
```

### Phase 3: Update Database Schema (REQUIRED)

**Add `industry_sector` column:**
```sql
ALTER TABLE usmca_workflows
ADD COLUMN industry_sector TEXT;

-- Migrate existing data (business_type currently contains industry sectors)
UPDATE usmca_workflows
SET industry_sector = (workflow_data->>'business_type')
WHERE industry_sector IS NULL;
```

### Phase 4: Update All Downstream Systems

**1. Admin Dashboards**
```javascript
// Display BOTH fields
<div className="info-row">
  <span className="label">Business Type:</span>
  <span className="value">{request.subscriber_data.business_type}</span>  // Importer
</div>
<div className="info-row">
  <span className="label">Industry Sector:</span>
  <span className="value">{request.subscriber_data.industry_sector}</span>  // Automotive
</div>
```

**2. AI API Calls**
```javascript
// Send BOTH to AI
const analysis = await openRouter({
  business_role: formData.business_type,  // Importer, Exporter, etc.
  industry_sector: formData.industry_sector,  // Automotive, Electronics, etc.
  // ... other data
});
```

**3. Component Enrichment**
```javascript
// Use industry_sector for HS classification
const hsCode = await classifyComponent(
  component.description,
  formData.industry_sector  // Automotive, not Importer!
);
```

**4. Workflow Service**
```javascript
// lib/services/workflow-service.js
async processCompleteWorkflow(formData) {
  // Validate BOTH fields exist
  if (!formData.business_type || !formData.industry_sector) {
    throw new Error('Both business_type and industry_sector required');
  }

  // Pass BOTH to API
  const apiData = {
    business_role: formData.business_type,
    industry_sector: formData.industry_sector,
    // ... rest of data
  };
}
```

---

## 📋 MIGRATION CHECKLIST

### Immediate (Breaking Changes)
- [ ] Add `industry_sector` field to USMCA workflow Step 1
- [ ] Update `useWorkflowState` hook to include `industry_sector` in formData
- [ ] Add database migration for `industry_sector` column
- [ ] Update workflow validation to require both fields

### Backend Updates
- [ ] Update `/api/usmca-workflow-complete` to accept both fields
- [ ] Update AI prompts to use both `business_type` (role) and `industry_sector`
- [ ] Update component enrichment to use `industry_sector` for HS classification
- [ ] Update workflow-service.js to handle both fields

### Admin Dashboard Updates
- [ ] Update all service tabs to display both fields
- [ ] Update admin analytics to track by BOTH role and industry
- [ ] Update service request cards to show both values

### Testing Required
- [ ] USMCA workflow: Submit with both fields → verify database storage
- [ ] Service request form: Submit with both fields → verify admin sees both
- [ ] Component enrichment: Verify uses `industry_sector` not `business_type`
- [ ] AI analysis: Verify receives both fields with correct context

---

## 🎯 USER IMPACT

### Before Fix (Current State)
- **USMCA Workflow**: "Business Type" = Industry Sector (misleading label!)
- **Service Request**: "Business Type" = Industry Sector (wrong data!)
- **Admin Confusion**: Can't tell if "Automotive" means they make cars or import electronics
- **AI Confusion**: Can't provide proper compliance advice without knowing their role

### After Fix (Proposed State)
- **USMCA Workflow**: Both "Business Type" (role) AND "Industry Sector" fields
- **Service Request**: Both fields clearly separated
- **Admin Clarity**: Knows client is "Importer" in "Automotive" industry
- **AI Accuracy**: Provides role-specific advice for industry-specific products

---

## 🚀 ESTIMATED EFFORT

**Phase 1** (Service Request Form): ✅ **COMPLETED** - 1 hour
**Phase 2** (USMCA Workflow UI): 2-3 hours
**Phase 3** (Database Migration): 1 hour
**Phase 4** (Downstream Updates): 4-6 hours
**Testing & Validation**: 2-3 hours

**Total**: ~10-14 hours of development work

---

## 💡 ALTERNATIVE: Minimal Fix (NOT RECOMMENDED)

**Option**: Keep current structure, just rename fields

**Pros**: Less code changes
**Cons**:
- Loses critical business role data
- Admin teams won't know client's position in supply chain
- AI gets incomplete context
- Can't provide role-specific compliance advice

**Verdict**: NOT ACCEPTABLE - We need BOTH pieces of information.

---

## ✅ CONCLUSION

**Root Cause**: Field `business_type` used for two different purposes (role vs industry)

**Impact**:
- Inconsistent data across workflows
- Missing critical business intelligence
- Confused admin dashboards
- Incomplete AI analysis

**Solution**:
- Keep `business_type` for business role (Importer/Exporter/etc)
- Add `industry_sector` for product category (Automotive/Electronics/etc)
- Update ALL downstream systems to use correct field for correct purpose

**Priority**: HIGH - Affects data quality, admin experience, and AI accuracy
