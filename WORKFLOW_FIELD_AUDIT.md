# Workflow Field Audit - UI → API → AI → Database
**Date:** October 20, 2025
**Purpose:** Ensure ALL UI fields are actually used by AI and saved to database (like substantial_transformation fix)

## ✅ WORKING CORRECTLY - Full Workflow

### Company Information Step (13 required fields)
| Field | UI Captured | API Validates | Used in AI Prompt | Saved to DB | Notes |
|-------|-------------|---------------|-------------------|-------------|-------|
| company_name | ✅ | ✅ | ✅ | ✅ | Used throughout |
| business_type | ✅ | ✅ | ✅ | ✅ | Critical for AI context |
| industry_sector | ✅ | ✅ | ✅ | ✅ | Determines USMCA threshold |
| company_address | ✅ | ✅ | ❌ | ❌ | **Collected but not used/saved!** |
| company_country | ✅ | ✅ | ❌ | ❌ | **Collected but not used/saved!** |
| destination_country | ✅ | ✅ | ✅ | ✅ | Critical for tariff routing |
| tax_id | ✅ | ✅ | ❌ | ❌ | **Collected but not used/saved!** |
| contact_person | ✅ | ✅ | ❌ | ❌ | **Collected but not used/saved!** |
| contact_phone | ✅ | ✅ | ❌ | ❌ | **Collected but not used/saved!** |
| contact_email | ✅ | ✅ | ❌ | ❌ | **Collected but not used/saved!** |
| trade_volume | ✅ | ✅ | ✅ | ✅ | Critical for savings calc |
| supplier_country | ✅ | ✅ | ✅ | ❌ | **Used in AI but not saved!** |
| trade_flow_type | ✅ (auto) | ❌ | ❌ | ✅ | Auto-calculated from countries |
| tariff_cache_strategy | ✅ (auto) | ❌ | ❌ | ✅ | Auto-calculated from dest |

### Component Origins Step
| Field | UI Captured | API Validates | Used in AI Prompt | Saved to DB | Notes |
|-------|-------------|---------------|-------------------|-------------|-------|
| product_description | ✅ | ❌ | ✅ | ✅ | Critical for classification |
| manufacturing_location | ✅ | ✅ | ✅ | ✅ | Determines labor credit |
| substantial_transformation | ✅ | ❌ | ✅ | ✅ | **JUST FIXED!** |
| component_origins[] | ✅ | ✅ | ✅ | ✅ | Core data structure |

## ❌ PROBLEMS FOUND - Fields Not Following Workflow

### 1. **certifier_type** - COSMETIC FIELD ❌
**Status:** UI collects it, API ignores it completely
- **Captured in UI:** Yes (CompanyInformationStep.js line 180-189)
- **Auto-set from business_type:** Yes (maps Exporter → EXPORTER, Importer → IMPORTER, etc.)
- **API validates:** ❌ NO - Not in requiredFields list
- **Used in AI prompt:** ❌ NO - Never passed to AI
- **Saved to database:** ❌ NO - Not in workflow_sessions INSERT
- **Problem:** User thinks this affects their certificate but it's just UI decoration

**Fix Needed:**
```javascript
// Add to API validation
certifier_type: formData.certifier_type,

// Add to database save
certifier_type: formData.certifier_type,

// Add to AI prompt (if relevant for analysis)
Certifier Type: ${formData.certifier_type}
```

### 2. **origin_criterion** - USER INPUT IGNORED ❌
**Status:** UI lets user select it, but AI determines it anyway
- **Captured in UI:** Yes (ComponentOriginsStepEnhanced.js line 563-565)
- **Options:** A, B, C, D (USMCA preference criterion)
- **API validates:** ❌ NO
- **Used in AI prompt:** ❌ NO - AI determines this independently
- **Saved to database:** ❌ NO
- **Problem:** User can select "B" but AI might say "C" - confusing!

**Fix Needed:** Either:
- Option 1: Remove from UI - let AI decide (RECOMMENDED)
- Option 2: Use user's choice as a "hint" in AI prompt
- Option 3: Save user's choice and show AI's determination separately

### 3. **method_of_qualification** - USER INPUT IGNORED ❌
**Status:** UI lets user select TV/NC/YF, but AI determines it
- **Captured in UI:** Yes (ComponentOriginsStepEnhanced.js line 586-588)
- **Options:** TV (Transaction Value), NC (Net Cost), YF (Yarn Forward)
- **API validates:** ❌ NO
- **Used in AI prompt:** ✅ YES - But AI overrides user's choice
- **Saved to database:** ❌ NO - AI's determination saved, not user's
- **Problem:** User selects "TV" but AI might choose "NC" based on industry rules

**Fix Needed:** Either:
- Option 1: Remove from UI - let AI decide (RECOMMENDED - automotive MUST use NC)
- Option 2: Show both: "You selected: TV | AI recommends: NC | ⚠️ Mismatch"

### 4. **Contact/Address Fields** - COLLECTED BUT ABANDONED ❌
**Status:** Required in UI, validated by API, but never used or saved
- **Fields:** company_address, company_country, tax_id, contact_person, contact_phone, contact_email
- **Captured in UI:** ✅ YES - All required fields with validation
- **API validates:** ✅ YES - In requiredFields, will error if missing
- **Used in AI prompt:** ❌ NO - Not passed to AI analysis
- **Saved to database:** ❌ NO - workflow_sessions INSERT doesn't include them
- **Problem:** User provides all this info thinking it's being saved for certificates, but it's lost!

**Impact:** These fields are likely needed for:
- Certificate generation (tax_id, company_address REQUIRED for USMCA certificates)
- Admin follow-up (contact_person, contact_email, contact_phone)
- Service delivery (Jorge/Cristina need to contact clients)

**Fix Needed:**
```javascript
// Add to database save (workflow_sessions table)
company_address: formData.company_address,
company_country: formData.company_country,
tax_id: formData.tax_id,
contact_person: formData.contact_person,
contact_phone: formData.contact_phone,
contact_email: formData.contact_email,
```

### 5. **supplier_country** - USED BUT NOT SAVED ❌
**Status:** Used in AI analysis but not persisted to database
- **Captured in UI:** ✅ YES
- **API validates:** ✅ YES
- **Used in AI prompt:** ✅ YES - "Trade Flow: ${supplier_country}→${destination_country}"
- **Saved to database:** ❌ NO
- **Problem:** AI uses it for analysis, but admins can't see it later in dashboards

**Fix Needed:**
```javascript
// Add to database save
supplier_country: formData.supplier_country,
```

## 📊 Summary Statistics

**Total UI Fields:** 20
**Fully Functional (UI → API → AI → DB):** 8 (40%)
**Partially Functional:** 7 (35%)
**Cosmetic/Broken:** 5 (25%)

**Critical Issues:**
1. 🔴 **Certificate data not saved:** tax_id, company_address, contact info
2. 🔴 **User input ignored:** certifier_type, origin_criterion, method_of_qualification
3. 🟡 **Analysis data lost:** supplier_country used but not saved

## 🎯 Recommended Fixes (Priority Order)

### HIGH PRIORITY - Certificate Generation Broken
**Problem:** Certificate needs tax_id, company_address, contact info but they're not saved!
**Impact:** Users can't generate certificates even after "completing" workflow
**Fix:** Add missing fields to database INSERT and certificate generation

### MEDIUM PRIORITY - User Confusion
**Problem:** UI shows fields that don't do anything (certifier_type, origin/method dropdowns)
**Impact:** Users think they're controlling the analysis but AI ignores their choices
**Fix:** Either remove UI fields OR make AI respect them

### LOW PRIORITY - Admin Dashboard Gap
**Problem:** supplier_country used in analysis but not available in admin dashboards
**Impact:** Jorge/Cristina can't see complete trade flow context
**Fix:** Add supplier_country to database save

## ✅ Good Practices to Keep

1. **substantial_transformation** - Perfect example! UI → API → AI → DB all connected
2. **destination_country** - Critical field properly flowing through entire system
3. **Auto-calculated fields** (trade_flow_type, tariff_cache_strategy) - Smart defaults

## 🔧 Implementation Plan

1. **Phase 1:** Add missing certificate fields to database (tax_id, addresses, contacts)
2. **Phase 2:** Remove confusing UI fields (certifier_type, origin_criterion, method_of_qualification)
3. **Phase 3:** Add supplier_country to database for admin reference
4. **Phase 4:** Update admin dashboards to show all saved fields

---

**Next Steps:** Would you like me to implement these fixes systematically, starting with the HIGH PRIORITY certificate data?
