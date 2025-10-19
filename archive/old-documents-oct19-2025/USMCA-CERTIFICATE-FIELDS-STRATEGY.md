# USMCA Certificate Field Completion Strategy

**Date**: October 16, 2025
**Status**: ✅ DOCUMENTED & FIXED

---

## 🔧 Issue Fixed: Page Count Statement

### Problem
The official USMCA form requires: "THIS CERTIFICATE CONSISTS OF ___ PAGES, INCLUDING ALL ATTACHMENTS"

This was visible in the preview but missing from the PDF download.

### Solution
Added page count statement to PDF generator:

```javascript
// Page count statement (required by official USMCA form)
doc.setFontSize(8);
doc.setFont(undefined, 'normal');
doc.text('THIS CERTIFICATE CONSISTS OF 1 PAGE, INCLUDING ALL ATTACHMENTS.', pageWidth / 2, y, { align: 'center' });
```

**Result**: Page count now appears in both preview and downloaded PDF ✅

---

## 📋 Field Completion Strategy

### Official USMCA Requirements

The USMCA certificate has **3 possible certifiers**:
1. **EXPORTER** - Company shipping the goods
2. **PRODUCER** - Company manufacturing the goods
3. **IMPORTER** - Company receiving the goods

**Only ONE certifier type must be checked**, and that party's information goes in Section 2 (Certifier).

---

## 🎯 Field-by-Field Completion Rules

### Section 1: Certifier Type
**Required**: Must check ONE box (IMPORTER, EXPORTER, or PRODUCER)

**Current System**: Defaults to EXPORTER
```javascript
const certifierType = (certificateData.certifier_type || 'EXPORTER').toUpperCase();
```

---

### Section 2: Certifier Information
**Completion Rule**: Mirrors whoever is the certifier

**If EXPORTER is certifier:**
- Use exporter data (name, address, country, phone, email, tax ID)
- Current code: `certificateData.certifier?.name || certificateData.exporter?.name || ''`

**If PRODUCER is certifier:**
- Use producer data
- Current code: Same fallback chain

**If IMPORTER is certifier:**
- Use importer data
- Current code: Same fallback chain

**Status**: All fields must be filled ✓ Complete information required

---

### Section 3: Exporter Information
**Completion Rule**: ALWAYS REQUIRED (company shipping goods)

**Required Fields:**
- ✅ NAME - Company name
- ✅ ADDRESS - Full shipping address
- ✅ COUNTRY - Country code (US, MX, CA)
- ✅ PHONE - Contact phone number
- ✅ EMAIL - Contact email
- ✅ TAX IDENTIFICATION NUMBER - RFC (Mexico), EIN (US), BN (Canada)

**Status**: All fields must be filled ✓ Complete information required

**Current Issue**: Shows "Not specified"
**Root Cause**: `certificateData.exporter` is null/undefined or fields are empty

---

### Section 4: Producer Information
**Completion Rule**: Can use "SAME AS EXPORTER" or fill completely

**Option A: Producer = Exporter**
```javascript
// If producer is the same as exporter
certificateData.producer = {
  same_as_exporter: true,
  name: 'SAME AS EXPORTER',  // This is what appears on PDF
  address: 'SAME AS EXPORTER',
  country: certificateData.exporter?.country,  // Use exporter's country
  phone: certificateData.exporter?.phone,
  email: certificateData.exporter?.email,
  tax_id: certificateData.exporter?.tax_id
}
```

**Option B: Different Producer**
```javascript
// If producer is different from exporter
certificateData.producer = {
  same_as_exporter: false,
  name: 'Precision Electronics Assembly SA de CV',
  address: 'Blvd. Industrial 123, Culiacán, Sinaloa',
  country: 'MX',
  phone: '+52 (667) 715-8800',
  email: 'ventas@precisionelec.mx',
  tax_id: 'PEA-550923678-SA9'
}
```

**Status**: Shows full details ✓ Working correctly (as per user's example)

---

### Section 5: Importer Information
**Completion Rule**: OPTIONAL (depends on certifier type)

**When Required:**
- ✓ If IMPORTER is the certifier → Must fill completely
- ✗ If EXPORTER is certifier → Can leave blank
- ✗ If PRODUCER is certifier → Can leave blank

**When to Fill (Best Practice):**
- Always fill if known (helps customs clearance)
- Leave blank if certifier is EXPORTER and importer unknown
- Triangle Intelligence users: Usually EXPORTER certifier, so importer can be blank

**Status**: Can be blank ✓ Optional field strategy working

---

## 🔍 Current Data Flow Issue

### User's Current Output:
```
Section 2 (CERTIFIER): "Not specified"
Section 3 (EXPORTER): "Not specified"
Section 4 (PRODUCER): ✅ Full details (name, phone, email, tax ID)
```

### Root Cause Analysis:

**1. Certifier Type Selected**: EXPORTER (default)

**2. Missing Data**: `certificateData.certifier` and `certificateData.exporter` are null/undefined

**3. Producer Data Present**: `certificateData.producer` has complete information

**Expected Behavior:**
```javascript
// If certifier type = EXPORTER, then:
Section 2 (Certifier) = Section 3 (Exporter) data
Section 3 (Exporter) = Must have company data
Section 4 (Producer) = Can use "SAME AS EXPORTER" or different producer
Section 5 (Importer) = Can be blank
```

---

## ✅ Recommended Fix

### For Your Current Workflow:

**Scenario 1: Producer IS the Exporter (Manufacturing company shipping directly)**
```javascript
const certificateData = {
  certifier_type: 'EXPORTER',

  // Section 2 (Certifier) = Section 3 (Exporter) data
  certifier: {
    name: 'Precision Electronics Assembly SA de CV',
    address: 'Blvd. Industrial 123, Culiacán, Sinaloa',
    country: 'MX',
    phone: '+52 (667) 715-8800',
    email: 'ventas@precisionelec.mx',
    tax_id: 'PEA-550923678-SA9'
  },

  // Section 3 (Exporter) - Same as certifier
  exporter: {
    name: 'Precision Electronics Assembly SA de CV',
    address: 'Blvd. Industrial 123, Culiacán, Sinaloa',
    country: 'MX',
    phone: '+52 (667) 715-8800',
    email: 'ventas@precisionelec.mx',
    tax_id: 'PEA-550923678-SA9'
  },

  // Section 4 (Producer) - Same as exporter
  producer: {
    same_as_exporter: true,
    name: 'SAME AS EXPORTER',
    address: 'SAME AS EXPORTER',
    country: 'MX',
    phone: '+52 (667) 715-8800',
    email: 'ventas@precisionelec.mx',
    tax_id: 'PEA-550923678-SA9'
  },

  // Section 5 (Importer) - Optional, can be blank
  importer: null  // or provide importer details if known
};
```

**Scenario 2: Separate Producer and Exporter (Manufacturing company ≠ Shipping company)**
```javascript
const certificateData = {
  certifier_type: 'EXPORTER',

  // Section 2 (Certifier) = Exporter data
  certifier: {
    name: 'Global Trade Exports Inc.',
    address: '456 Export St, McAllen, TX',
    country: 'US',
    phone: '+1 (956) 555-1234',
    email: 'exports@globaltrade.com',
    tax_id: '12-3456789'
  },

  // Section 3 (Exporter) - Same as certifier
  exporter: {
    name: 'Global Trade Exports Inc.',
    address: '456 Export St, McAllen, TX',
    country: 'US',
    phone: '+1 (956) 555-1234',
    email: 'exports@globaltrade.com',
    tax_id: '12-3456789'
  },

  // Section 4 (Producer) - Different from exporter
  producer: {
    same_as_exporter: false,
    name: 'Precision Electronics Assembly SA de CV',
    address: 'Blvd. Industrial 123, Culiacán, Sinaloa',
    country: 'MX',
    phone: '+52 (667) 715-8800',
    email: 'ventas@precisionelec.mx',
    tax_id: 'PEA-550923678-SA9'
  },

  // Section 5 (Importer) - Optional
  importer: null
};
```

---

## 📊 Triangle Intelligence Default Strategy

**For Most SMB Users (Manufacturing in Mexico, Exporting to US):**

1. **Certifier Type**: EXPORTER (manufacturing company certifying their own goods)
2. **Certifier Data**: Use manufacturer's company info
3. **Exporter Data**: Same as certifier (manufacturer ships directly)
4. **Producer Data**: Same as exporter (manufacturer produces goods)
5. **Importer Data**: Leave blank (US importer fills this when filing)

**Rationale:**
- Most Triangle users are manufacturers certifying their own production
- EXPORTER certification is most common and accepted
- Importer info often unknown at time of shipment
- Customs accepts blank importer field when exporter certifies

---

## 🚀 Next Steps

1. ✅ **PDF Generator**: Page count statement added
2. ✅ **Documentation**: Field completion strategy documented
3. 🔄 **Data Flow**: Ensure workflow passes complete exporter data
4. 🔄 **UI Validation**: Add required field checks in certificate workflow
5. 🔄 **Default Values**: Pre-fill certifier = exporter for Triangle users

---

**Status**: DOCUMENTED - Ready for data flow verification
**Updated By**: Claude (AI Assistant)
**Date**: October 16, 2025
