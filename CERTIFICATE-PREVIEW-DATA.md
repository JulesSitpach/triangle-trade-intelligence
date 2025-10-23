# Certificate Preview Data - All Test Accounts

**For Phase 3c Manual Testing - Complete Certificate Information**

---

## ⚠️ CRITICAL: Step 1 vs Step 4 Form Separation

**Step 1: USMCA Workflow Form (CompanyInformationStep.js)**
Contact Information Section has ONLY 3 fields - NO title field exists:
- `contact_person` ✅ (Contact person name)
- `contact_phone` ✅ (Contact phone number)
- `contact_email` ✅ (Contact email address)
- `contact_title` ❌ **DOES NOT EXIST IN UI**

API (pages/api/ai-usmca-complete-analysis.js) validates exactly these 3 fields.

**Step 4: Certificate Authorization Form (AuthorizationStep.js)**
Authorized Signatory Section has 4 fields including title:
- `signatory_name` (Who signs the certificate)
- `signatory_title` (Role/title of signatory - REQUIRED for certificate)
- `signatory_email`
- `signatory_phone`

**Key Insight:**
- Step 1 has NO title field at all (neither in UI nor required by API)
- Step 4 HAS a title field (needed for certificate signature authority)
- These are TWO SEPARATE FORMS at different stages of the workflow
- The contact person from Step 1 can be the same or different from Step 4's authorized signatory

---

## 🎯 How to Test Certificate Preview

### Two Separate Forms - Important Distinction

**Step 1: USMCA Workflow Form** (CompanyInformationStep.js)
- Collects: Company name, contact person, contact phone, contact email
- API requires: contact_person, contact_phone, contact_email (NO title field)
- This is your company's primary contact info

**Step 4: Certificate Authorization Form** (AuthorizationStep.js - appears AFTER results)
- Collects: Authorized signatory name, title, email, phone
- Different from workflow contact person
- Used for certificate signature authorization
- Certifier type: IMPORTER, EXPORTER, or PRODUCER

### Testing Flow

1. Login with test account
2. Complete USMCA workflow:
   - Fill Company Information (including contact_person, contact_phone, contact_email - NO title needed here)
   - Add components and product details
   - Continue to Results
3. Once results show, click "Generate Certificate"
4. Fill Authorization Step:
   - Select certifier type (IMPORTER/EXPORTER/PRODUCER)
   - Enter authorized signatory name (can be same or different from contact person)
   - Enter authorized signatory title (REQUIRED at this step, NOT at step 1)
   - Fill importer/exporter details
   - Check certification boxes
   - Click "Generate & Preview Certificate"
5. Verify certificate fields populate correctly

---

## 📋 TEST ACCOUNT 1: TRIAL USER

### **Login Credentials**
```
Email: macproductions010@gmail.com
Password: Test2025!
Status: Trial (7-day countdown)
Tier: FREE
```

### **STEP 1: Company Information Form** (API Form - 3 contact fields only)
```
Company Name: AutoParts USA Inc
Business Type: Importer
Industry Sector: Automotive
Company Address: 123 Import Blvd, Detroit, MI 48201
Company Country: United States
Tax ID: 38-7654321

📍 CONTACT INFORMATION SECTION (Only 3 fields - NO title field):
Contact Person: John Smith
Contact Phone: +1-313-555-1234
Contact Email: john.smith@autopartsusa.com
⚠️ Title field does NOT exist in this form

Trade Volume: $450,000
```

### **Trade Route Information** (Required by API)
```
Primary Supplier Country: Mexico ← WHERE YOU SOURCE COMPONENTS
Destination Market: United States ← WHERE YOU EXPORT TO
Manufacturing Location: Mexico ← CRITICAL FOR AI ANALYSIS (where assembly happens)

🔲 Manufacturing involves substantial transformation: ✅ CHECK THIS
   (Reason: Welding, stamping, assembly = substantial transformation, not just simple assembly)
```

### **Product Details**
```
Product Description: Automotive engine mount assemblies with steel housing and rubber vibration dampeners
HS Code: [Auto-filled by AI]
```

### **Components (3 items)**
```
1. Cold-rolled steel housing with powder-coated finish, stamped and welded construction, corrosion-resistant coating
   Origin: China
   Percentage: 20%

2. Natural rubber vibration dampeners, molded with metal inserts, durometer rating 50-60 Shore A, heat-resistant compound
   Origin: Mexico
   Percentage: 50%

3. Grade 8 steel mounting bolts with lock washers, zinc-plated hardware, M10x1.5 thread pitch
   Origin: USA
   Percentage: 30%
```

### **STEP 4: Certificate Authorization Form** (After Results - separate form for certificate signing)
```
👤 AUTHORIZED SIGNATORY SECTION:
Authorized Name: John Smith
  (Can be same or different from Step 1 contact person)
Authorized Title: Importer Manager
  (REQUIRED here - this is certification authority)
Signatory Email: john.smith@autopartsusa.com
Signatory Phone: +1-313-555-1234

🎯 CERTIFIER TYPE (Choose one):
☑️ IMPORTER (you are the importing company)
☐ EXPORTER
☐ PRODUCER

📋 IMPORTER DETAILS (Your company's info - since you are the importer):
Company Name: AutoParts USA Inc
Address: 123 Import Blvd, Detroit, MI 48201
Tax ID: 38-7654321

✅ CERTIFICATION CHECKBOXES:
☑️ I certify that the information provided is true and accurate
☑️ I am authorized to sign this certificate on behalf of AutoParts USA Inc

📅 CERTIFICATION DATE: [Auto-filled to today]

Then click: "Generate & Preview Certificate"
```

### **Expected Certificate Preview**
```
Exporter: AutoParts USA Inc
Address: 123 Import Blvd, Detroit, MI 48201
Tax ID: 38-7654321
Contact: John Smith

Product HS Code: [AI-determined]
Description: Automotive engine mount assemblies...
Preference Criterion: [AI-determined]

USMCA Qualification: QUALIFIED
Regional Content: [Calculated by AI]%
Threshold: 60%

Blanket Period: [Current date] to [+1 year]

⚠️ TRIAL WATERMARK: Should display watermark
🔒 Download: Should be BLOCKED with "Upgrade Required" message
```

---

**ℹ️ NOTE:** All test account data is organized in the "Quick Copy-Paste" section below with proper STEP 1 and STEP 4 separation. The old format sections have been removed to reduce confusion.

## ✅ Certificate Preview Testing Checklist

### For Each Account, Verify:

**Certificate Fields Populated**:
- [ ] Exporter name correct (Company Name)
- [ ] Address correct (Company Address)
- [ ] Tax ID correct (Tax ID)
- [ ] Contact person correct (Contact Person)
- [ ] Product description populated
- [ ] HS code filled (from AI)
- [ ] Preference criterion filled (from AI)
- [ ] Blanket period shows current date + 1 year

**USMCA Qualification Data**:
- [ ] Qualification status shows (QUALIFIED/NOT QUALIFIED)
- [ ] Regional content percentage calculated
- [ ] Threshold displayed (varies by HS code)
- [ ] Component breakdown visible

**Authorization Section**:
- [ ] Authorized name field shows entered value
- [ ] Authorized title field shows entered value
- [ ] Certification date shows
- [ ] Certification checkbox shows as checked

**Download Behavior**:

**TRIAL Account** (AutoParts USA):
- [ ] Watermark visible on preview
- [ ] Download button says "Upgrade Required"
- [ ] Download blocked with message
- [ ] Service pricing shows $175 (no discount)

**STARTER Account** (MexManufacturing):
- [ ] No watermark on preview
- [ ] Download button enabled
- [ ] Download works successfully
- [ ] Service pricing shows $175 (no discount)

**PROFESSIONAL Account** (CanadaDistribution):
- [ ] No watermark on preview
- [ ] Download button enabled
- [ ] Download works successfully
- [ ] Service pricing shows $149 (15% discount)
- [ ] "Unlimited analyses" message displays

**PREMIUM Account** (GlobalWholesale):
- [ ] No watermark on preview
- [ ] Download button enabled
- [ ] Download works successfully
- [ ] Service pricing shows $131 (25% discount)
- [ ] Premium benefits message displays
- [ ] "Quarterly strategy calls" mentioned

---

## 🎯 Quick Copy-Paste for Each Account

### **Test 1: TRIAL** (Two Steps)

**STEP 1: USMCA Workflow Form - Copy all at once:**
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

Product: Automotive engine mount assemblies with steel housing and rubber vibration dampeners

Component 1: Cold-rolled steel housing | China | 20%
Component 2: Natural rubber dampeners | Mexico | 50%
Component 3: Grade 8 steel bolts | USA | 30%
```

**STEP 4: Certificate Authorization Form - After results display:**
```
Certifier Type: ☑️ IMPORTER

Authorized Signatory Name: John Smith
Authorized Signatory Title: Importer Manager          ← TITLE FIELD REQUIRED (appears only here in Step 4)
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

### **Test 2: STARTER** (Two Steps)

**STEP 1: USMCA Workflow Form:**
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

Product: Industrial textile products for automotive upholstery and interior trim

Component 1: 100% combed cotton fabric | USA | 45%
Component 2: High-tenacity polyester thread | Mexico | 35%
Component 3: Foam backing material | Canada | 20%
```

**STEP 4: Certificate Authorization Form:**
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

### **Test 3: PROFESSIONAL** (Two Steps)

**STEP 1: USMCA Workflow Form:**
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

Product: Electronic components and circuit assemblies for automotive control systems

Component 1: Multi-layer circuit boards | China | 55%
Component 2: Wire harness connectors | Mexico | 25%
Component 3: Injection-molded ABS housing | USA | 20%
```

**STEP 4: Certificate Authorization Form:**
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

### **Test 4: PREMIUM** (Two Steps)

**STEP 1: USMCA Workflow Form:**
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

Product: Medical device components and surgical instrument assemblies

Component 1: 316L surgical stainless steel | USA | 40%
Component 2: Medical-grade silicone seals | Mexico | 35%
Component 3: Precision polycarbonate housings | Canada | 25%
```

**STEP 4: Certificate Authorization Form:**
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

---

## 📌 Key Testing Notes

1. **HS Codes**: AI will auto-fill these - don't worry about them
2. **Tariff Rates**: AI will calculate these - verify they show in component breakdown
3. **Regional Content**: AI calculates based on component origins - should vary by account
4. **Threshold**: Varies by product category (60-75% typically)
5. **Watermark**: TRIAL only - shows "DRAFT" or "UNLICENSED"
6. **Download**: TRIAL blocks it, PAID tiers allow it

---

## 🧪 Business Outcome Test Accounts (Automated Test Suite)

These accounts are used in the automated business outcome testing suite (`tests/business-outcomes.test.js` and `tests/business-value-alerts.test.js`). They validate real user workflows with complete company information.

### **Test 5: Steel Manufacturing Inc** (China-Origin / Section 301 Scenario)

**Purpose**: Validate Section 301 tariff calculation for China-origin goods destined for USA

**STEP 1: Company Information Form - Complete Data:**
```
Company Name: Steel Manufacturing Inc
Business Type: Importer
Industry Sector: Manufacturing
Tax ID: 38-2847291
Company Address: 1500 Industrial Blvd, Pittsburgh, PA 15213
Company Country: United States

Contact Person: Maria Chen
Contact Phone: (412) 555-0198
Contact Email: maria.chen@steelmfg.com

Primary Supplier Country: China
Destination Market: United States
Manufacturing Location: China
Annual Trade Volume: $1,250,000

Product: Steel housing components for automotive
Component Origin: 100% China-origin
```

**Test Outcomes Validated**:
- ✅ Section 301 tariff applies (25% additional duty for China goods)
- ✅ Total tariff rate calculated correctly (MFN + Section 301)
- ✅ Annual financial impact shown in dollars ($279,000+ exposure)
- ✅ USMCA qualification = NOT QUALIFIED (100% non-USMCA content)
- ✅ Alerts show policy impact with financial consequences

---

### **Test 6: TextileCorp USA** (USMCA-Qualified / Multi-Country BOM)

**Purpose**: Validate USMCA savings calculation and certificate eligibility for qualified content

**STEP 1: Company Information Form - Complete Data:**
```
Company Name: TextileCorp USA
Business Type: Manufacturer
Industry Sector: Textiles/Apparel
Tax ID: 47-1923847
Company Address: 2400 Fashion Plaza, New York, NY 10018
Company Country: United States

Contact Person: James Rodriguez
Contact Phone: (212) 555-0247
Contact Email: james.rodriguez@textilecorp.com

Primary Supplier Country: Mexico
Destination Market: United States
Manufacturing Location: United States
Annual Trade Volume: $850,000

Product: Cotton blend apparel - USMCA qualified
```

**Component Breakdown** (100% USMCA content):
```
1. Cotton fabric | Origin: USA | 45%
2. Polyester thread | Origin: Mexico | 35%
3. Foam backing | Origin: Canada | 20%
```

**Test Outcomes Validated**:
- ✅ USMCA qualification = QUALIFIED (100% regional content)
- ✅ Savings calculation accurate: (MFN - USMCA) × $850,000
- ✅ Trade volume preserved through workflow: $850,000
- ✅ Certificate generation eligible (USMCA-qualified)
- ✅ Component breakdown shows accurate origin countries
- ✅ Regional content percentage calculated: 100%

---

## 📊 Field Mapping: Tests to Certificate

These tests ensure all company information flows correctly through the workflow:

| Field | Required | Step 1 | Step 4 | Certificate | Tests |
|-------|----------|--------|--------|------------|-------|
| Company Name | ✅ Yes | ✅ Input | - | ✅ Displayed | ✅ Validated |
| Business Type | ✅ Yes | ✅ Input | - | - | ✅ Validated |
| Industry Sector | ✅ Yes | ✅ Input | - | - | ✅ Used for HS classification |
| Tax ID | ✅ Yes | ✅ Input | - | ✅ Displayed | ✅ Validated |
| Company Address | ✅ Yes | ✅ Input | - | ✅ Displayed | ✅ Validated |
| Company Country | ✅ Yes | ✅ Input | - | ✅ Displayed | ✅ Validated |
| Contact Person | ✅ Yes | ✅ Input | - | ✅ Displayed | ✅ Validated |
| Contact Phone | ✅ Yes | ✅ Input | - | ✅ Displayed | ✅ Validated |
| Contact Email | ✅ Yes | ✅ Input | - | ✅ Displayed | ✅ Validated |
| Trade Volume | ✅ Yes | ✅ Input | - | - | ✅ Persists to alerts |
| Supplier Country | ✅ Yes | ✅ Input | - | - | ✅ Triggers tariff analysis |
| Destination Market | ✅ Yes | ✅ Input | - | - | ✅ Determines rates |
| Manufacturing Location | ✅ Yes | ✅ Input | - | - | ✅ Affects USMCA qualification |
| Product Description | ✅ Yes | ✅ Input | - | ✅ Displayed | ✅ Validated |
| Component Origins | ✅ Yes | ✅ Input | - | - | ✅ Used for qualification |

---

**You're all set! Use the data above for certificate testing. Good luck! 🎉**
