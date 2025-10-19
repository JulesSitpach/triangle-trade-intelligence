# Certificate Type Mapping Issue
**Priority:** 🟡 Medium - Important for compliance accuracy
**Status:** 📋 Documented, Not Yet Implemented
**Impact:** Certificate generation may not match business role

---

## 🎯 The Problem

The platform has **6 business role options** in `CompanyInformationStep.js`:
1. Importer
2. Exporter
3. Manufacturer
4. Distributor
5. Wholesaler
6. Retailer

**But certificate generation likely uses ONE standard template** regardless of role selected.

---

## 📋 USMCA Certificate Requirements

### Different Roles = Different Certificate Types

| Business Role | Certificate Type | Complexity | Who Can Certify |
|--------------|------------------|------------|-----------------|
| **Manufacturer** | PRODUCER | Most detailed | Only if you produced the goods |
| **Exporter** | EXPORTER | Medium detail | Can certify for others' goods |
| **Importer** | IMPORTER | Simplest | Relies on supplier certification |
| **Distributor** | IMPORTER | Simplest | Reselling, not producing |
| **Wholesaler** | IMPORTER | Simplest | Reselling, not producing |
| **Retailer** | IMPORTER | Simplest | Reselling, not producing |

---

## 📊 Certificate Field Differences

### Required Fields by Certificate Type:

#### **PRODUCER Certificate** (Manufacturer role)
```javascript
{
  certifier_role: "PRODUCER",
  certifier_declaration: "I am the producer of the goods",

  // REQUIRED FIELDS:
  manufacturing_location: "Exact facility address",
  production_process: "Description of manufacturing process",
  component_breakdown: [{
    component: "Steel housing",
    origin: "Mexico",
    value_percentage: 35,
    hs_code: "7326.90.85",
    supplier: "Aceros del Norte"
  }],
  rvc_calculation_worksheet: {
    transaction_value: 10000,
    vnm: 6500,  // Value of non-originating materials
    vom: 3500,  // Value of originating materials
    rvc_percentage: 65,
    method: "Transaction Value Method"
  },
  basis_of_knowledge: "I produced these goods in my facility",
  blanket_period: "Up to 12 months",

  // Producer can certify:
  can_certify_for_others: false  // Only for goods they produce
}
```

#### **EXPORTER Certificate** (Exporter role)
```javascript
{
  certifier_role: "EXPORTER",
  certifier_declaration: "I certify that the goods described below qualify as originating",

  // REQUIRED FIELDS:
  exporter_info: "Company name, address, country",
  producer_info: "Producer name (if different from exporter)",
  importer_info: "Optional - can be left blank for blanket cert",
  goods_description: "Industrial control module assembly",
  hs_code: "8537.10.90",
  preference_criterion: "B (Regional Value Content)",
  rvc_percentage: 60,  // Summary only, not detailed worksheet
  blanket_period: "Up to 12 months",

  basis_of_knowledge: "Based on information provided by producer",

  // Exporter can certify:
  can_certify_for_others: true  // Can certify for goods produced by others
}
```

#### **IMPORTER Certificate** (Importer/Distributor/Wholesaler/Retailer)
```javascript
{
  certifier_role: "IMPORTER",
  certifier_declaration: "I have reason to believe the goods qualify as originating",

  // REQUIRED FIELDS:
  importer_info: "Company name, address, country",
  supplier_info: "Exporter/producer who provided certification",
  goods_description: "Industrial control module assembly",
  hs_code: "8537.10.90",
  reliance_statement: "Based on producer/exporter certification",

  // SIMPLIFIED - No RVC calculation required
  rvc_percentage: null,  // Not required for importer cert
  component_breakdown: null,  // Not required
  blanket_period: "Single shipment only",  // Importers typically don't use blanket

  basis_of_knowledge: "Importer's knowledge based on supplier certification",

  // Importer can certify:
  can_certify_for_others: false  // Only for goods they're importing
}
```

---

## 🚨 Current Implementation Issues

### **Issue #1: One-Size-Fits-All Certificate**
Current certificate generation likely doesn't vary by role:
- All users get same template
- All users asked for producer-level details
- No role-specific validation

### **Issue #2: Over-Collection of Data**
Importers/Distributors/Wholesalers/Retailers shouldn't need:
- ❌ Manufacturing location details
- ❌ Component breakdown with supplier names
- ❌ Detailed RVC calculation worksheet
- ❌ Production process descriptions

They should only provide:
- ✅ Importer name and address
- ✅ Supplier (exporter/producer) information
- ✅ Goods description and HS code
- ✅ Statement of reliance on supplier certification

### **Issue #3: Compliance Risk**
Wrong certificate type could cause:
- ⚠️ Customs rejection
- ⚠️ Audit flags
- ⚠️ User confusion about what they can certify
- ⚠️ Over-certification (claiming producer status when you're just a reseller)

---

## 🎯 Recommended Solution

### **Step 1: Map Business Role → Certificate Type**

```javascript
// config/business-types.js (already exists)

export const CERTIFIER_TYPES = {
  PRODUCER: 'producer',      // Manufacturer
  EXPORTER: 'exporter',      // Exporter
  IMPORTER: 'importer'       // Importer, Distributor, Wholesaler, Retailer
};

export const BUSINESS_TYPES = [
  {
    value: 'manufacturer',
    label: 'Manufacturer',
    certifier_type: CERTIFIER_TYPES.PRODUCER,  // ← Certificate type
    label_with_cert: 'Manufacturer (Producer Certificate)',
    requires_manufacturing_details: true,
    requires_rvc_worksheet: true,
    can_use_blanket_period: true
  },
  {
    value: 'exporter',
    label: 'Exporter',
    certifier_type: CERTIFIER_TYPES.EXPORTER,
    label_with_cert: 'Exporter (Exporter Certificate)',
    requires_manufacturing_details: false,  // Optional - if also producer
    requires_rvc_worksheet: false,          // Summary only
    can_use_blanket_period: true
  },
  {
    value: 'importer',
    label: 'Importer',
    certifier_type: CERTIFIER_TYPES.IMPORTER,
    label_with_cert: 'Importer (Importer Certificate)',
    requires_manufacturing_details: false,
    requires_rvc_worksheet: false,
    can_use_blanket_period: false  // Single shipment only
  },
  // Distributor/Wholesaler/Retailer all map to IMPORTER certificate
];
```

### **Step 2: Add Clarifying Question for Exporters**

Since exporters can ALSO be producers, add follow-up:

```javascript
// In CompanyInformationStep.js
{formData.business_type === 'exporter' && (
  <div className="form-group">
    <label className="form-label required">Are you also the producer?</label>
    <div className="radio-group">
      <label>
        <input
          type="radio"
          name="is_producer"
          value="yes"
          onChange={() => updateFormData('certifier_type', 'producer')}
        />
        Yes - I manufacture and export (Producer Certificate - most detailed)
      </label>
      <label>
        <input
          type="radio"
          name="is_producer"
          value="no"
          onChange={() => updateFormData('certifier_type', 'exporter')}
        />
        No - I export but don't manufacture (Exporter Certificate)
      </label>
    </div>
    <div className="form-help">
      Producer certificates require detailed manufacturing information.
      Exporter certificates allow you to certify goods produced by others.
    </div>
  </div>
)}
```

### **Step 3: Conditional Field Display**

Show/hide fields based on certificate type:

```javascript
// ComponentOriginsStepEnhanced.js

// Only show detailed component breakdown for PRODUCER certificates
{formData.certifier_type === 'producer' && (
  <>
    <h3>Manufacturing Details (Required for Producer Certificate)</h3>
    <ComponentTable
      components={formData.component_origins}
      showSupplierNames={true}
      showManufacturingLocation={true}
      requireDetailedRVC={true}
    />
  </>
)}

// Show simplified view for EXPORTER certificates
{formData.certifier_type === 'exporter' && (
  <>
    <h3>Product Information (Summary for Exporter Certificate)</h3>
    <ComponentTable
      components={formData.component_origins}
      showSupplierNames={false}
      showManufacturingLocation={false}
      requireDetailedRVC={false}
    />
  </>
)}

// Show minimal view for IMPORTER certificates
{formData.certifier_type === 'importer' && (
  <>
    <div className="alert alert-info">
      As an importer, you'll generate a simplified certificate based on your supplier's certification.
      You do not need to provide detailed manufacturing information.
    </div>
  </>
)}
```

### **Step 4: Certificate Template Routing**

```javascript
// pages/api/generate-certificate.js (or similar)

function generateCertificate(workflowData) {
  const certifierType = workflowData.certifier_type;

  switch(certifierType) {
    case 'producer':
      return generateProducerCertificate(workflowData);

    case 'exporter':
      return generateExporterCertificate(workflowData);

    case 'importer':
      return generateImporterCertificate(workflowData);

    default:
      throw new Error(`Unknown certifier type: ${certifierType}`);
  }
}

function generateProducerCertificate(data) {
  return {
    certificate_number: generateCertNumber(),
    certifier_role: 'PRODUCER',
    certifier_declaration: 'I am the producer of the goods described below',

    // Producer-specific fields
    manufacturing_location: data.company_address,
    component_breakdown: data.component_origins,
    rvc_calculation: {
      transaction_value: data.product_value,
      vnm: calculateVNM(data.component_origins),
      vom: calculateVOM(data.component_origins),
      rvc_percentage: data.usmca.regional_content
    },

    blanket_period: data.blanket_period || '12 months',
    basis_of_knowledge: 'I produced these goods in my facility'
  };
}

function generateExporterCertificate(data) {
  return {
    certificate_number: generateCertNumber(),
    certifier_role: 'EXPORTER',
    certifier_declaration: 'I certify that the goods described below qualify as originating',

    // Exporter-specific fields
    exporter_info: {
      name: data.company_name,
      address: data.company_address,
      country: data.company_country
    },
    producer_info: data.producer_different ? {
      name: data.producer_name,
      address: data.producer_address
    } : null,

    // Summary RVC only (not detailed worksheet)
    rvc_percentage: data.usmca.regional_content,

    blanket_period: data.blanket_period || '12 months',
    basis_of_knowledge: 'Based on information provided by producer'
  };
}

function generateImporterCertificate(data) {
  return {
    certificate_number: generateCertNumber(),
    certifier_role: 'IMPORTER',
    certifier_declaration: 'I have reason to believe the goods qualify as originating',

    // Importer-specific fields (simplified)
    importer_info: {
      name: data.company_name,
      address: data.company_address,
      country: data.company_country
    },
    supplier_info: {
      name: data.supplier_name,
      country: data.supplier_country
    },

    // No RVC calculation required
    reliance_statement: 'Based on producer/exporter certification',
    blanket_period: null,  // Single shipment only
    basis_of_knowledge: "Importer's knowledge based on supplier certification"
  };
}
```

---

## 📁 Files That Need Changes

### **1. Config Files** (Add Certificate Type Mapping)
- ✅ `config/business-types.js` - Already has `mapBusinessTypeToCertifierType()` function
- Need to verify it maps correctly:
  - Manufacturer → producer
  - Exporter → exporter
  - Importer/Distributor/Wholesaler/Retailer → importer

### **2. Workflow Components** (Conditional Field Display)
- `components/workflow/CompanyInformationStep.js` - Add "Are you also producer?" for exporters
- `components/workflow/ComponentOriginsStepEnhanced.js` - Show/hide fields based on certifier_type
- `components/workflow/AuthorizationStep.js` - Certificate generation

### **3. Certificate Generation** (Create 3 Templates)
- `pages/api/generate-certificate.js` (if exists)
- OR wherever certificate PDF is generated
- Create 3 separate template functions

### **4. Validation Logic** (Role-Specific Rules)
- Validate required fields based on certificate type
- Prevent importers from certifying as producers
- Ensure blanket periods only for producer/exporter certs

---

## 🎯 Implementation Priority

**Suggested Phases:**

### **Phase 1: Quick Fix (Config Mapping)**
- ✅ Already done - `config/business-types.js` has `mapBusinessTypeToCertifierType()`
- ✅ Already flows through `CompanyInformationStep.js` (auto-sets certifier_type)

### **Phase 2: Certificate Template Routing** (High Priority)
- Create 3 certificate templates (producer, exporter, importer)
- Route based on certifier_type
- Ensure correct fields in each

### **Phase 3: UI Refinements** (Medium Priority)
- Add "Are you also producer?" question for exporters
- Show/hide fields based on certificate type
- Add help text explaining differences

### **Phase 4: Validation** (Low Priority)
- Role-specific validation rules
- Prevent over-certification
- Compliance checks

---

## 🔍 Current Status Check Needed

**Questions to answer:**
1. ✅ Does `config/business-types.js` correctly map business roles to certifier types?
2. ❓ Where is certificate generation code? (`pages/api/generate-certificate.js`?)
3. ❓ Does current certificate template vary by certifier_type?
4. ❓ Are there separate PDF templates for producer vs exporter vs importer?

---

## 📝 Next Steps

**Option A: Implement Now**
1. Find certificate generation code
2. Create 3 template functions (producer/exporter/importer)
3. Route based on certifier_type
4. Test with all 6 business roles

**Option B: Document for Later**
- ✅ This document created
- Track as backlog item
- Priority: Medium (not launch-blocking, but important)

**Which would you prefer?** 🚀
