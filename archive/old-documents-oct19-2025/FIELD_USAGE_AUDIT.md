# FIELD USAGE AUDIT - Company Information Step
**Critical Analysis: Where Each Field is Actually Used**

**Date**: October 19, 2025
**Purpose**: Determine if UI "optional" fields should be REQUIRED

---

## 🔍 AUDIT RESULTS

### ✅ **CORRECTLY REQUIRED Fields** (Used in Multiple Places)

#### 1. **company_name**
- **UI**: Required ✅
- **API Validation**: Required (400 error if missing)
- **Used In**:
  - Certificate PDF (Field 3: Certifier name)
  - AI analysis prompt (business context)
  - Service requests (client identification)
  - Database: `workflow_sessions.subscriber_data`
- **Verdict**: ✅ **KEEP REQUIRED**

---

#### 2. **business_type**
- **UI**: Required ✅
- **API Validation**: Required (400 error if missing)
- **Used In**:
  - Maps to `certifier_type` (PRODUCER/EXPORTER/IMPORTER)
  - Certificate PDF template selection
  - AI classification context
- **Verdict**: ✅ **KEEP REQUIRED**

---

#### 3. **industry_sector**
- **UI**: Required ✅
- **API Validation**: Required (400 error if missing)
- **Used In**:
  - AI analysis prompt (product context)
  - HS code classification (industry-specific)
  - USMCA threshold determination (automotive 75%, electronics 65%, textiles 55%)
- **Verdict**: ✅ **KEEP REQUIRED**

---

#### 4. **company_address**
- **UI**: Required ✅
- **API Validation**: NOT validated (logs warning if missing)
- **Used In**:
  - Certificate PDF (Field 3: Certifier address)
  - Line 213, 281, 358, 404 in `usmca-certificate-pdf-generator.js`
  - Service requests (contact information)
- **Verdict**: ✅ **KEEP REQUIRED** (needed for certificates)

---

#### 5. **company_country**
- **UI**: Required ✅
- **API Validation**: NOT validated
- **Used In**:
  - Trade flow calculation (`trade_flow_type: "CA→US"`)
  - Certificate PDF (certifier location)
  - Component origin validation
- **Verdict**: ✅ **KEEP REQUIRED**

---

#### 6. **destination_country**
- **UI**: Required ✅
- **API Validation**: NOT validated (logs WARNING if missing)
- **Used In**:
  - **CRITICAL**: Tariff routing strategy selection
    - USA → `ai_24hr` cache (~$0.02/component)
    - Canada → `ai_90day` cache (~$0.01/component)
    - Mexico → `database` lookup ($0.00 - FREE)
  - Section 301 tariff determination (USA only)
  - AI analysis prompt (line 523)
  - Certificate PDF (destination market)
- **Verdict**: ✅ **KEEP REQUIRED** - ⚠️ **ADD API VALIDATION**

---

#### 7. **contact_person**
- **UI**: Required ✅
- **API Validation**: NOT validated
- **Used In**:
  - Service requests (primary contact)
  - Admin dashboards (client communication)
  - Email notifications (recipient name)
- **Verdict**: ✅ **KEEP REQUIRED**

---

#### 8. **contact_phone**
- **UI**: Required ✅
- **API Validation**: NOT validated
- **Used In**:
  - Service requests (contact information)
  - Admin team communication
  - Certificate PDF (optional field)
- **Verdict**: ✅ **KEEP REQUIRED**

---

#### 9. **contact_email**
- **UI**: Required ✅
- **API Validation**: NOT validated
- **Used In**:
  - Service requests (primary communication)
  - Email notifications (crisis alerts)
  - Admin team contact
  - Certificate correspondence
- **Verdict**: ✅ **KEEP REQUIRED**

---

#### 10. **trade_volume**
- **UI**: Required ✅ (FREE TEXT INPUT: "4,800,000")
- **API Validation**: NOT validated (logs WARNING if missing)
- **Used In**:
  - **CRITICAL**: Annual savings calculation
  - AI analysis prompt (line 524)
  - Service pricing estimates
  - ROI calculations for certificates
  - Dashboard analytics
- **Verdict**: ✅ **KEEP REQUIRED** - ⚠️ **ADD API VALIDATION**

---

### ⚠️ **"OPTIONAL" Fields That Should Be REQUIRED**

#### 11. **tax_id** (Currently Optional ❌)
- **UI**: Optional (no asterisk)
- **API Validation**: NOT validated
- **Used In**:
  - Certificate PDF (Field 3: Tax ID/EIN) - Lines 213, 281, 358, 404
  - Service requests (business verification)
  - Admin compliance documentation
- **Current Problem**: Certificate shows BLANK tax ID if not provided
- **Verdict**: ⚠️ **MAKE REQUIRED** - Legal compliance issue!

**Certificate Field 3 Code**:
```javascript
// Line 213 - Certifier tax ID
doc.text(certificateData.certifier?.tax_id || '', margin + 1, y + 47);
// Shows BLANK if missing ← BAD for official documents
```

---

#### 12. **supplier_country** (Currently Optional ❌)
- **UI**: Optional (no asterisk)
- **API Validation**: NOT validated (logs WARNING if missing)
- **Used In**:
  - AI analysis prompt (line 522: "Primary Supplier Country")
  - Supply chain risk assessment
  - Crisis alert filtering (supplier-based vulnerabilities)
  - Service requests (sourcing intelligence)
- **Current Problem**: AI analysis says "Not specified" if missing
- **Verdict**: ⚠️ **MAKE REQUIRED** - Needed for accurate analysis

**AI Prompt Impact**:
```javascript
// Line 522-524
Supply Chain Flow:
- Primary Supplier Country: ${formData.supplier_country || 'Not specified'}  // ← Reduces AI quality
- Export Destination: ${formData.destination_country || 'Not specified'}
- Annual Trade Volume: ${formData.trade_volume || 'Not specified'}
```

---

## 📊 SUMMARY

### Current State:
- **UI Requires**: 11 fields
- **API Validates**: Only 4 fields (company_name, business_type, industry_sector, component_origins)
- **Actually Used**: 12 fields (including "optional" ones)

### Problems Found:

#### 🔴 **CRITICAL Issues**:

1. **tax_id marked optional but REQUIRED for certificates**
   - Legal compliance issue
   - Official USMCA certificates need Tax ID/EIN
   - Currently shows BLANK on PDF

2. **destination_country marked optional but CRITICAL for tariff routing**
   - Missing = defaults to expensive AI lookups
   - Should use Mexico database (FREE) but can't without destination
   - Missing = no Section 301 tariff handling

3. **trade_volume marked optional but REQUIRED for savings calculation**
   - Missing = can't calculate ROI
   - Missing = AI analysis incomplete ("Not specified")

4. **supplier_country marked optional but used in AI analysis**
   - Missing = "Not specified" in AI prompt
   - Reduces AI analysis quality
   - Needed for supply chain risk assessment

#### 🟡 **Validation Gap**:
- UI enforces 11 fields
- API only validates 4 fields
- **7 fields have NO backend validation** (relying on UI only)

---

## ✅ RECOMMENDED FIXES

### Fix 1: Add API Validation for All UI-Required Fields

**File**: `pages/api/ai-usmca-complete-analysis.js`

**Current** (Line 73-85):
```javascript
if (!formData.company_name ||
    !formData.business_type ||
    !formData.industry_sector ||
    !formData.component_origins) {
  return res.status(400).json({
    success: false,
    error: 'Missing required fields: company_name, business_type, industry_sector, component_origins'
  });
}
```

**Recommended**:
```javascript
// Validate ALL fields UI marks as required
const requiredFields = {
  company_name: formData.company_name,
  business_type: formData.business_type,
  industry_sector: formData.industry_sector,
  company_address: formData.company_address,
  company_country: formData.company_country,
  destination_country: formData.destination_country,  // CRITICAL for tariff routing
  contact_person: formData.contact_person,
  contact_phone: formData.contact_phone,
  contact_email: formData.contact_email,
  trade_volume: formData.trade_volume,                // CRITICAL for savings calculation
  tax_id: formData.tax_id,                            // CRITICAL for certificates
  supplier_country: formData.supplier_country,        // CRITICAL for AI analysis
  component_origins: formData.component_origins
};

const missingFields = Object.keys(requiredFields).filter(key => !requiredFields[key]);

if (missingFields.length > 0) {
  return res.status(400).json({
    success: false,
    error: `Missing required fields: ${missingFields.join(', ')}`,
    missing_fields: missingFields
  });
}
```

---

### Fix 2: Update UI to Mark tax_id and supplier_country as REQUIRED

**File**: `components/workflow/CompanyInformationStep.js`

**Line 256** - Change:
```javascript
<label className="form-label">Tax ID / EIN</label>  // ❌ NO asterisk
```

**To**:
```javascript
<label className="form-label required">Tax ID / EIN</label>  // ✅ Add "required" class
```

**Line 330** - Change:
```javascript
<label className="form-label">Primary Supplier Country</label>  // ❌ NO asterisk
```

**To**:
```javascript
<label className="form-label required">Primary Supplier Country</label>  // ✅ Add "required"
```

**Add to validation check** (Line 100-111):
```javascript
if (!formData.tax_id) missingFields.push('Tax ID / EIN');
if (!formData.supplier_country) missingFields.push('Primary Supplier Country');
```

---

### Fix 3: Add Input Validation for trade_volume

**File**: `components/workflow/CompanyInformationStep.js`

**Line 312-324** - Add validation:
```javascript
<label className="form-label required">Annual Trade Volume (US $)</label>
<input
  type="text"
  className="form-input"
  value={formData.trade_volume || ''}
  onChange={(e) => {
    // Only allow numbers and commas
    const value = e.target.value.replace(/[^0-9,]/g, '');
    updateFormData('trade_volume', value);
  }}
  placeholder="4,800,000"
  required
/>
<div className="form-help">Estimated annual import/export value (numbers only)</div>
```

---

## 🎯 IMPACT ANALYSIS

### Before Fixes:
- ❌ Certificates can have BLANK Tax ID (legal issue)
- ❌ Missing destination = expensive AI tariff lookups
- ❌ Missing trade_volume = no savings calculation
- ❌ Missing supplier_country = incomplete AI analysis
- ❌ 7 fields have NO backend validation (UI can be bypassed)

### After Fixes:
- ✅ All certificates have complete Tax ID/EIN
- ✅ Destination country ALWAYS provided → correct tariff routing
- ✅ Trade volume ALWAYS provided → accurate ROI calculations
- ✅ Supplier country ALWAYS provided → complete AI analysis
- ✅ Backend validates ALL fields (can't bypass UI validation)

---

## 📝 IMPLEMENTATION PRIORITY

### Priority 1 (BEFORE PRODUCTION):
1. ✅ Make `tax_id` REQUIRED in UI + API validation
2. ✅ Make `supplier_country` REQUIRED in UI + API validation
3. ✅ Add backend validation for all UI-required fields

### Priority 2 (BEFORE PRODUCTION):
4. ✅ Add input validation for `trade_volume` (numbers only)
5. ✅ Update test scripts to reflect all 13 required fields

### Priority 3 (POST-LAUNCH):
6. ⚠️ Consider adding `manufacturing_location` as required (useful for producer certificates)

---

## 🔒 CONCLUSION

**All 13 fields should be REQUIRED**:
1. company_name ✅
2. business_type ✅
3. certifier_type ✅ (auto-selected)
4. industry_sector ✅
5. company_address ✅
6. company_country ✅
7. **tax_id** ⚠️ **MAKE REQUIRED** (legal compliance)
8. contact_person ✅
9. contact_phone ✅
10. contact_email ✅
11. trade_volume ✅
12. **supplier_country** ⚠️ **MAKE REQUIRED** (AI analysis quality)
13. destination_country ✅

**None should be optional** - all are used in certificates, AI analysis, or service requests.

---

**Next Steps**:
1. Implement API validation for all 13 fields
2. Update UI to mark tax_id and supplier_country as required
3. Update test scripts to reflect 13 required fields
4. Update CLAUDE.md documentation

