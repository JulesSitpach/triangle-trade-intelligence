# Certificate Data Flow Fix - Company Information

**Issue:** Certificate completion page showing blank company fields

**Root Cause:** AI endpoint wasn't passing through company detail fields needed for certificate

---

## The Problem

### What User Saw:
```
FIELD 1 - EXPORTER INFORMATION
Company: Industrial Hydraulics Mexico  ← Showed company name
Address: [BLANK]                       ← Missing!
Country: [BLANK]                       ← Missing!
Tax ID: [BLANK]                        ← Missing!
```

### Why It Happened:

**Step 1 Collected:**
- ✅ company_name
- ✅ company_address
- ✅ tax_id
- ✅ contact_person
- ✅ contact_email
- ✅ contact_phone

**AI Endpoint Returned:**
```javascript
company: {
  name: formData.company_name,           // ✅ Only this
  business_type: formData.business_type,
  trade_volume: formData.trade_volume
  // ❌ Missing address, tax_id, contact fields!
}
```

**Certificate Page Expected:**
```javascript
company.name              ← Found it
company.company_address   ← NOT FOUND
company.tax_id            ← NOT FOUND
company.contact_person    ← NOT FOUND
company.contact_email     ← NOT FOUND
company.contact_phone     ← NOT FOUND
company.country           ← NOT FOUND
```

---

## The Fix

### Updated AI Endpoint Response:

**File:** `pages/api/ai-usmca-complete-analysis.js`

**Before:**
```javascript
company: {
  name: formData.company_name,
  business_type: formData.business_type,
  trade_volume: formData.trade_volume,
  supplier_country: formData.supplier_country
}
```

**After:**
```javascript
company: {
  name: formData.company_name,
  company_name: formData.company_name, // Alias for compatibility
  business_type: formData.business_type,
  trade_volume: formData.trade_volume,
  supplier_country: formData.supplier_country,
  destination_country: formData.destination_country,

  // Company details for certificate
  company_address: formData.company_address || '',
  address: formData.company_address || '',
  tax_id: formData.tax_id || '',
  contact_person: formData.contact_person || '',
  contact_email: formData.contact_email || '',
  contact_phone: formData.contact_phone || '',
  country: formData.destination_country || 'US',
  exporter_country: formData.destination_country || 'US'
}
```

### Also Added Manufacturing Location:

**Product Object:**
```javascript
product: {
  hs_code: analysis.product?.hs_code,
  description: formData.product_description,
  product_description: formData.product_description,
  manufacturing_location: formData.manufacturing_location || '' // ← Added
}
```

**USMCA Object:**
```javascript
usmca: {
  qualified: analysis.usmca?.qualified,
  north_american_content: analysis.usmca?.north_american_content,
  regional_content: analysis.usmca?.north_american_content, // Alias
  threshold_applied: analysis.usmca?.threshold_applied,
  manufacturing_location: formData.manufacturing_location || '', // ← Added
  // ... rest of fields
}
```

### Added Context for Results Display:

**Root Level:**
```javascript
result.component_origins = formData.component_origins;
result.components = formData.component_origins; // Alias
result.manufacturing_location = formData.manufacturing_location;
result.workflow_data = {
  company_name: formData.company_name,
  business_type: formData.business_type,
  product_description: formData.product_description,
  manufacturing_location: formData.manufacturing_location
};
```

---

## Data Flow Now Complete:

```
Step 1: Company Information Form
↓ Collects:
  - company_name: "Industrial Hydraulics Mexico"
  - company_address: "Av Industrial 123"
  - tax_id: "RFC123456"
  - contact_person: "Joe"
  - contact_email: "joe@company.com"
  - contact_phone: "555-1234"
  - destination_country: "US"

↓ useWorkflowState stores in formData

↓ workflow-service.js passes ALL fields to API

↓ AI Endpoint (/api/ai-usmca-complete-analysis)
  - Receives ALL company fields
  - Returns company object WITH all fields
  - Saves to localStorage

↓ Certificate Page (/usmca-certificate-completion)
  - Reads from localStorage
  - Populates certificate fields:
    ✅ company.name → "Industrial Hydraulics Mexico"
    ✅ company.address → "Av Industrial 123"
    ✅ company.tax_id → "RFC123456"
    ✅ company.contact_person → "Joe"
    ✅ company.contact_email → "joe@company.com"
    ✅ company.contact_phone → "555-1234"
    ✅ company.country → "US"
```

---

## What Certificate Will Now Show:

```
FIELD 1 - EXPORTER INFORMATION
Company: Industrial Hydraulics Mexico    ✅
Address: Av Industrial 123              ✅
Country: US                             ✅
Tax ID: RFC123456                       ✅
Phone: 555-1234                         ✅
Email: joe@company.com                  ✅

FIELD 5 - DESCRIPTION OF GOOD(S)
HS Code: 8413.50                        ✅
Description: High-pressure hydraulic... ✅
Manufacturing Location: Mexico          ✅

FIELD 6 - PREFERENCE CRITERION
Regional Value Content: 65.0%           ✅

FIELD 12 - AUTHORIZED SIGNATURE
Signatory Name: joe                     ✅
Title: President                        ✅
```

---

## Testing Instructions:

1. **Clear browser cache and localStorage**
   ```javascript
   localStorage.clear()
   ```

2. **Run complete workflow:**
   - Step 1: Fill ALL company fields (including address, tax ID, contact)
   - Step 2: Fill product and components
   - Click "Continue to USMCA Analysis"

3. **Check console output:**
   ```
   🌐 WORKFLOW SERVICE: API REQUEST
   ⚠️ CERTIFICATE FIELDS CHECK:
     has_company_address: true    ← Should be true
     has_tax_id: true             ← Should be true
     has_contact_person: true     ← Should be true
   ```

4. **Navigate to certificate page:**
   - Should see company name, address, tax ID
   - Should see manufacturing location
   - Should see regional content percentage

---

## Files Modified:

1. ✅ `pages/api/ai-usmca-complete-analysis.js` - Added all company fields to response
2. ✅ `lib/services/workflow-service.js` - Added debug logging for certificate fields

---

**Status:** Fixed and ready for testing
**Next:** Test complete workflow → certificate generation to verify all fields populate correctly
