# Certificate Preview Data - All Test Accounts

**For Phase 3c Manual Testing + Automated Business Outcome Testing**

---

## ⚠️ CRITICAL: Step 1 vs Step 4 Form Separation

**Step 1: USMCA Workflow Form (CompanyInformationStep.js)**
Contact Information Section has ONLY 3 fields - NO title field exists:
- `contact_person` ✅ (Contact person name)
- `contact_phone` ✅ (Contact phone number)
- `contact_email` ✅ (Contact email address)
- `contact_title` ❌ **DOES NOT EXIST IN UI**

**Step 4: Certificate Authorization Form (AuthorizationStep.js)**
Authorized Signatory Section has 4 fields including title:
- `signatory_name` (Who signs the certificate)
- `signatory_title` (Role/title of signatory - REQUIRED for certificate)
- `signatory_email`
- `signatory_phone`

---

## 🎯 Quick Start - Choose Your Test

### Manual Testing (Tests 1-4)
Use these to manually test the UI in your browser:
- **Test 1: TRIAL** - AutoParts USA (Mexico-origin, mixed BOM)
- **Test 2: STARTER** - MexManufacturing Ltd (multi-country USMCA)
- **Test 3: PROFESSIONAL** - CanadaDistribution Inc (China distributor)
- **Test 4: PREMIUM** - GlobalWholesale Corp (medical devices)

### Automated Testing (Tests 5-6)
Used by automated test suite - validates business outcomes:
- **Test 5: SECTION 301** - Steel Manufacturing Inc (China-origin, tariff analysis)
- **Test 6: USMCA QUALIFIED** - TextileCorp USA (multi-country savings)

---

## 📋 TEST 1: TRIAL USER (Manual Testing)

### **Login Credentials**
```
Email: macproductions010@gmail.com
Password: Test2025!
Status: Trial (7-day countdown)
Tier: FREE
```

### **STEP 1: USMCA Workflow Form - Copy all at once:**
```
Company Name: AutoParts USA Inc
Address: 123 Import Blvd, Detroit, MI 48201
Company Country: United States
Tax ID: 38-7654321

Contact Person: John Smith                    ← ONLY CONTACT FIELDS (no title)
Contact Phone: +1-313-555-1234
Contact Email: john.smith@autopartsusa.com

Primary Supplier Country: Mexico
Destination Market: United States
Manufacturing Location: Mexico
☑️ Manufacturing involves substantial transformation

Trade Volume: $450,000

Product: Automotive engine mount assemblies with steel housing and rubber vibration dampeners

Component 1: Cold-rolled steel housing | China | 20%
Component 2: Natural rubber dampeners | Mexico | 50%
Component 3: Grade 8 steel bolts | USA | 30%
```

### **STEP 4: Certificate Authorization Form - After results display:**
```
Certifier Type: ☑️ IMPORTER

Authorized Signatory Name: John Smith
Authorized Signatory Title: Importer Manager          ← TITLE FIELD REQUIRED (appears only here)
Signatory Email: john.smith@autopartsusa.com
Signatory Phone: +1-313-555-1234

Importer Company: AutoParts USA Inc
Address: 123 Import Blvd, Detroit, MI 48201
Country: United States
Tax ID: 38-7654321
Contact Person: John Smith
Phone: +1-313-555-1234
Email: john.smith@autopartsusa.com

✅ Check: I certify that the information provided is true and accurate
✅ Check: I am authorized to sign this certificate on behalf of AutoParts USA Inc

Click: Generate & Preview Certificate
```

**Expected Result**: Certificate preview with TRIAL WATERMARK, download blocked

---

## 📋 TEST 2: STARTER USER (Manual Testing)

### **STEP 1: USMCA Workflow Form:**
```
Company Name: MexManufacturing Ltd
Address: 456 Industrial Way, Monterrey, NL, Mexico 64000
Company Country: Mexico
Tax ID: RFC-MEX123456

Contact Person: Maria Garcia                  ← ONLY CONTACT FIELDS (no title)
Contact Phone: +52-81-555-6789
Contact Email: maria@mexmanufacturing.com

Primary Supplier Country: United States
Destination Market: Canada
Manufacturing Location: Mexico
☑️ Manufacturing involves substantial transformation

Trade Volume: $500,000

Product: Industrial textile products for automotive upholstery and interior trim

Component 1: 100% combed cotton fabric | USA | 45%
Component 2: High-tenacity polyester thread | Mexico | 35%
Component 3: Foam backing material | Canada | 20%
```

### **STEP 4: Certificate Authorization Form:**
```
Certifier Type: ☑️ EXPORTER

Authorized Signatory Name: Maria Garcia
Authorized Signatory Title: Manufacturer Manager
Signatory Email: maria@mexmanufacturing.com
Signatory Phone: +52-81-555-6789

Exporter Company: MexManufacturing Ltd
Address: 456 Industrial Way, Monterrey, NL, Mexico 64000
Country: Mexico
Tax ID: RFC-MEX123456

Importer Company: Automotive Textiles Canada Inc
Address: 1200 Industrial Ave, Toronto, ON M1K 5A8
Country: Canada
Tax ID: BN-111222333RC0001
Contact Person: Patricia Brown
Phone: +1-416-555-7890
Email: patricia.brown@autotextiles.ca

✅ Check: I certify that the information provided is true and accurate
✅ Check: I am authorized to sign this certificate on behalf of MexManufacturing Ltd

Click: Generate & Preview Certificate
```

**Expected Result**: Certificate preview, download enabled, no watermark

---

## 📋 TEST 3: PROFESSIONAL USER (Manual Testing)

### **STEP 1: USMCA Workflow Form:**
```
Company Name: CanadaDistribution Inc
Address: 789 Commerce St, Toronto, ON M5H 2N2
Company Country: Canada
Tax ID: BN-987654321RC0001

Contact Person: David Chen                    ← ONLY CONTACT FIELDS (no title)
Contact Phone: +1-416-555-9012
Contact Email: david@canadadist.com

Primary Supplier Country: China
Destination Market: United States
Manufacturing Location: Does Not Apply
☐ Manufacturing involves substantial transformation (N/A for distributors)

Trade Volume: $750,000

Product: Electronic components and circuit assemblies for automotive control systems

Component 1: Multi-layer circuit boards | China | 55%
Component 2: Wire harness connectors | Mexico | 25%
Component 3: Injection-molded ABS housing | USA | 20%
```

### **STEP 4: Certificate Authorization Form:**
```
Certifier Type: ☑️ IMPORTER

Authorized Signatory Name: David Chen
Authorized Signatory Title: Distributor Manager
Signatory Email: david@canadadist.com
Signatory Phone: +1-416-555-9012

Importer Company: CanadaDistribution Inc
Address: 789 Commerce St, Toronto, ON M5H 2N2
Country: Canada
Tax ID: BN-987654321RC0001
Contact Person: David Chen
Phone: +1-416-555-9012
Email: david@canadadist.com

✅ Check: I certify that the information provided is true and accurate
✅ Check: I am authorized to sign this certificate on behalf of CanadaDistribution Inc

Click: Generate & Preview Certificate
```

**Expected Result**: Certificate preview, download enabled, 15% discount applied

---

## 📋 TEST 4: PREMIUM USER (Manual Testing)

### **STEP 1: USMCA Workflow Form:**
```
Company Name: GlobalWholesale Corp
Address: 321 Medical Plaza, Houston, TX 77002
Company Country: United States
Tax ID: 12-3456789

Contact Person: Dr. Sarah Johnson              ← ONLY CONTACT FIELDS (no title)
Contact Phone: +1-713-555-3456
Contact Email: sarah@globalwholesale.com

Primary Supplier Country: Mexico
Destination Market: United States
Manufacturing Location: Does Not Apply
☐ Manufacturing involves substantial transformation (N/A for wholesalers)

Trade Volume: $1,200,000

Product: Medical device components and surgical instrument assemblies

Component 1: 316L surgical stainless steel | USA | 40%
Component 2: Medical-grade silicone seals | Mexico | 35%
Component 3: Precision polycarbonate housings | Canada | 25%
```

### **STEP 4: Certificate Authorization Form:**
```
Certifier Type: ☑️ IMPORTER

Authorized Signatory Name: Dr. Sarah Johnson
Authorized Signatory Title: Wholesaler Manager
Signatory Email: sarah@globalwholesale.com
Signatory Phone: +1-713-555-3456

Importer Company: GlobalWholesale Corp
Address: 321 Medical Plaza, Houston, TX 77002
Country: United States
Tax ID: 12-3456789
Contact Person: Dr. Sarah Johnson
Phone: +1-713-555-3456
Email: sarah@globalwholesale.com

✅ Check: I certify that the information provided is true and accurate
✅ Check: I am authorized to sign this certificate on behalf of GlobalWholesale Corp

Click: Generate & Preview Certificate
```

**Expected Result**: Certificate preview, download enabled, 25% discount applied

---

## 🧪 TEST 5: SECTION 301 SCENARIO (Automated Testing)

**Purpose**: Validate Section 301 tariff calculation for China-origin goods destined for USA

### **STEP 1: USMCA Workflow Form - Copy all at once:**
```
Company Name: Steel Manufacturing Inc
Address: 1500 Industrial Blvd, Pittsburgh, PA 15213
Company Country: United States
Tax ID: 38-2847291

Contact Person: Maria Chen                    ← ONLY CONTACT FIELDS (no title)
Contact Phone: (412) 555-0198
Contact Email: maria.chen@steelmfg.com

Primary Supplier Country: China
Destination Market: United States
Manufacturing Location: China
☑️ Manufacturing involves substantial transformation

Product: Steel housing components for automotive

Component 1: Steel housing | China | 100%
```

**What the Automated Tests Validate**:
- ✅ Section 301 tariff applies (25% additional duty on China goods)
- ✅ Total tariff calculated: MFN + Section 301 = ~27.9%
- ✅ Annual financial impact shown: $279,000+ exposure
- ✅ USMCA qualification: NOT QUALIFIED (100% non-USMCA content)
- ✅ Alerts show policy impact with financial consequences

**Trade Volume**: $1,250,000 annually

---

## 🧪 TEST 6: USMCA QUALIFICATION SCENARIO (Automated Testing)

**Purpose**: Validate USMCA savings calculation and certificate eligibility for qualified multi-country BOM

### **STEP 1: USMCA Workflow Form - Copy all at once:**
```
Company Name: TextileCorp USA
Address: 2400 Fashion Plaza, New York, NY 10018
Company Country: United States
Tax ID: 47-1923847

Contact Person: James Rodriguez                ← ONLY CONTACT FIELDS (no title)
Contact Phone: (212) 555-0247
Contact Email: james.rodriguez@textilecorp.com

Primary Supplier Country: Mexico
Destination Market: United States
Manufacturing Location: United States
☑️ Manufacturing involves substantial transformation

Product: Cotton blend apparel - USMCA qualified

Component 1: Cotton fabric | USA | 45%
Component 2: Polyester thread | Mexico | 35%
Component 3: Foam backing | Canada | 20%
```

**What the Automated Tests Validate**:
- ✅ USMCA qualification: QUALIFIED (100% regional content)
- ✅ Savings calculation: (MFN - USMCA) × $850K = accurate amount
- ✅ Trade volume preserved through workflow: $850,000
- ✅ Certificate generation eligible: YES
- ✅ Component breakdown shows accurate origin countries
- ✅ Regional content percentage: 100%

**Trade Volume**: $850,000 annually
**Regional Content**: 100% (all components from USMCA countries)

---

## ✅ Certificate Preview Testing Checklist

### For Each Account, Verify:

**Certificate Fields Populated**:
- [ ] Exporter name correct
- [ ] Address correct
- [ ] Tax ID correct
- [ ] Contact person correct
- [ ] Product description populated
- [ ] HS code filled (from AI)
- [ ] Preference criterion filled (from AI)
- [ ] Blanket period shows current date + 1 year

**USMCA Qualification Data**:
- [ ] Qualification status shows (QUALIFIED/NOT QUALIFIED)
- [ ] Regional content percentage calculated
- [ ] Component breakdown visible

**Download Behavior**:
- **TRIAL (Test 1)**: Watermark visible, download blocked
- **STARTER+ (Tests 2-4)**: No watermark, download enabled
- **PROFESSIONAL (Test 3)**: 15% discount shown
- **PREMIUM (Test 4)**: 25% discount shown

---

## 📊 Test Summary Table

| Test | Account | Scenario | Purpose | Status |
|------|---------|----------|---------|--------|
| 1 | AutoParts USA | Mexico-origin mixed BOM | Manual testing, TRIAL tier | Copy-paste ready |
| 2 | MexManufacturing | USMCA multi-country | Manual testing, STARTER tier | Copy-paste ready |
| 3 | CanadaDistribution | China distributor | Manual testing, PROFESSIONAL tier | Copy-paste ready |
| 4 | GlobalWholesale | Medical USMCA | Manual testing, PREMIUM tier | Copy-paste ready |
| 5 | Steel Manufacturing | Section 301 tariff | Automated test validation | Runs automatically |
| 6 | TextileCorp USA | USMCA savings | Automated test validation | Runs automatically |

---

## 🚀 Testing Instructions

### Manual Testing (Tests 1-4)
1. Open app at http://localhost:3001
2. Login with credentials provided for each test
3. Complete USMCA workflow (STEP 1) with copy-pasted data
4. Click "Generate Certificate"
5. Complete Certificate Authorization (STEP 4) with copy-pasted data
6. Verify certificate preview matches expected results

### Automated Testing (Tests 5-6)
Run: `npm test -- tests/business-outcomes.test.js tests/business-value-alerts.test.js`

Tests validate:
- Correct tariff calculations
- Proper USMCA qualification
- Trade volume preservation
- Alert accuracy
- Financial impact display
- All 31 business outcome tests passing ✅

---

**Last Updated**: October 23, 2025
**Test Status**: All 6 accounts documented and ready to use
**Automated Tests**: 31/31 passing ✅
