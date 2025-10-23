# Certificate Preview Data - All Test Accounts

**For Phase 3c Manual Testing - Complete Certificate Information**

---

## ⚠️ CRITICAL: API vs UI Form Requirements

**What the API (pages/api/ai-usmca-complete-analysis.js) REQUIRES:**
- `contact_person` ✅ (Contact person name)
- `contact_phone` ✅ (Contact phone number)
- `contact_email` ✅ (Contact email address)
- `contact_title` ❌ **NOT required by API** - this is NOT a field the API validates

**What appears in Certificate Authorization Form (Step 4):**
- `signatory_name` (Who signs the certificate - can be same or different from contact person)
- `signatory_title` (Role/title of signatory - REQUIRED for certificate signing, NOT for API submission)
- `signatory_email`
- `signatory_phone`

**Key Insight:**
- Step 1 (USMCA Workflow) has NO title field - API doesn't require it
- Step 4 (Certificate Generation) HAS a title field - needed for certificate authentication
- These are TWO DIFFERENT FORMS with DIFFERENT field requirements
- The contact person from Step 1 can be different from the authorized signatory in Step 4

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

### **STEP 1: Company Information Form** (API Form - contact fields only, NO title)
```
Company Name: AutoParts USA Inc
Business Type: Importer
Industry Sector: Automotive
Company Address: 123 Import Blvd, Detroit, MI 48201
Company Country: United States
Tax ID: 38-7654321

📍 CONTACT PERSON SECTION (API requires these fields):
Contact Person: John Smith
Contact Phone: +1-313-555-1234
Contact Email: john.smith@autopartsusa.com
⚠️ Note: NO Title field here - API doesn't require it

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

📋 IMPORTER DETAILS (Your customer's info):
Company Name: [Fill if customer is different]
Address: [Fill if customer is different]
Tax ID: [Fill if customer is different]

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

## 📋 TEST ACCOUNT 2: STARTER SUBSCRIBER ($99/month)

### **Login Credentials**
```
Email: starter@testcompany.com
Password: Pass123!
Status: Starter Subscription
Tier: STARTER ($99/month)
Limit: 10 analyses per month
```

### **Company Information**
```
Company Name: MexManufacturing Ltd
Business Type: Manufacturer/Producer
Industry Sector: Textiles
Company Address: 456 Industrial Way, Monterrey, NL, Mexico 64000
Company Country: Mexico
Tax ID: RFC-MEX123456
Contact Person: Maria Garcia
Contact Phone: +52-81-555-6789
Contact Email: maria@mexmanufacturing.com
Trade Volume: $850,000
```

### **Trade Route Information** (Required by API)
```
Primary Supplier Country: United States ← WHERE YOU SOURCE COMPONENTS
Destination Market: Canada ← WHERE YOU EXPORT TO (Triangle routing)
Manufacturing Location: Mexico ← CRITICAL FOR AI ANALYSIS (where assembly happens)

🔲 Manufacturing involves substantial transformation: ✅ CHECK THIS
   (Reason: Sewing, dyeing, treating fabrics = substantial transformation, not just simple assembly)
```

### **Product Details**
```
Product Description: Industrial textile products for automotive upholstery and interior trim
HS Code: [Auto-filled by AI]
```

### **Components (3 items)**
```
1. 100% combed cotton fabric, twill weave construction, pre-shrunk and mercerized, 300 thread count, automotive-grade upholstery material
   Origin: USA
   Percentage: 45%
   HS Code: 5209.42.00

2. High-tenacity polyester thread, UV-resistant coating, continuous filament spun, industrial-grade stitching for automotive applications
   Origin: Mexico
   Percentage: 35%
   offered me one of lower confidence 
   HS Code: 5407.10.10
Woven fabrics of synthetic filament yarn, including monofilament of synthetic textile materials of a thickness not exceeding 1 mm: Of polyester filament yarn, other than those of heading 5407.10.20 or 5407.10.30, unbleached or bleached
▲ Hide AI Analysis
🧠 Why We Classified This Way:
⚠️ The component description lacks clarity about the physical form and construction. To improve accuracy, specify: (1) whether this is a spun thread (twisted filament), a woven tape, or a finished textile product; (2) the specific thread count or linear density (decitex/dtex); (3) whether the UV-resistant coating is integral to the filament or applied post-manufacturing. Based on the description provided: - Material: High-tenacity polyester (synthetic continuous filament) - clearly falls under Chapter 54 (Man-made filament yarns) - Construction: "Continuous filament spun" suggests twisted/plied polyester yarn - Function: "Industrial-grade stitching" indicates end-use, NOT classification basis - Coating: UV-resistant coating is applied treatment, not defining characteristic The most likely classification is HS 5407 (Woven fabrics of synthetic filament yarn) or HS 5403-5405 (Synthetic filament yarn and thread). However, if this is strictly THREAD (twisted/plied yarn for sewing), it should be classified under: - HS 5403.10.20 (Multiple twisted or cabled yarn of polyester, not put up for retail) The chosen code 5407.10.10 assumes this is a spun polyester textile product with synthetic filament construction suitable for high-strength applications. USMCA Consideration: Component originates from Mexico (USMCA member). If classified as synthetic filament yarn/thread, it qualifies for preferential USMCA treatment as long as it meets regional value content thresholds for Chapter 54 textiles (typically 55-65% depending on specific category).

🔄 Other Options to Consider:
5403.10.20
78% match
If the component is specifically a TWISTED or CABLED polyester thread (as opposed to woven fabric), this is the correct classification for synthetic polyester filament yarn. More appropriate if 'continuous filament spun' refers to the thread structure rather than a woven textile product. This code covers multiple twisted or cabled yarn of polyester, not put up for retail sale, which aligns with industrial-grade stitching thread.

3. Foam backing material with pressure-sensitive adhesive, flame-retardant treatment, closed-cell polyurethane construction
   Origin: Canada
   Percentage: 20%
   HS Code: 3926.90.90
```

### **Certificate Authorization Fields** (Fill before download)
```
Authorized Name: Maria Garcia
Authorized Title: Manufacturer Manager
Certification Date: [Today's date]
Certification Box: CHECK THIS
```

### **Expected Certificate Preview**
```
Exporter: MexManufacturing Ltd
Address: 456 Industrial Way, Monterrey, NL, Mexico 64000
Tax ID: RFC-MEX123456
Contact: Maria Garcia

Product HS Code: [AI-determined]
Description: Industrial textile products...
Preference Criterion: [AI-determined]

USMCA Qualification: [AI-determined - likely QUALIFIED]
Regional Content: [Calculated]%
Threshold: [Determined by HS code category]%

Blanket Period: [Current date] to [+1 year]

✅ NO WATERMARK
✅ DOWNLOAD WORKS
✅ Service pricing: $175 (no discount for Starter)
```

---

## 📋 TEST ACCOUNT 3: PROFESSIONAL SUBSCRIBER ($299/month)

### **Login Credentials**
```
Email: pro@testcompany.com
Password: Pass123!
Status: Professional Subscription
Tier: PROFESSIONAL ($299/month)
Limit: Unlimited analyses
```

### **Company Information**
```
Company Name: CanadaDistribution Inc
Business Type: Distributor/Importer
Industry Sector: Electronics
Company Address: 789 Commerce St, Toronto, ON M5H 2N2
Company Country: Canada
Tax ID: BN-987654321RC0001
Contact Person: David Chen
Contact Phone: +1-416-555-9012
Contact Email: david@canadadist.com
Trade Volume: $2,500,000
```

### **Trade Route Information** (Required by API)
```
Primary Supplier Country: China ← WHERE YOU SOURCE COMPONENTS (Non-USMCA)
Destination Market: United States ← WHERE YOU EXPORT TO
Manufacturing Location: Does Not Apply ← CRITICAL FOR AI ANALYSIS (distributor/importer only)

🔲 Manufacturing involves substantial transformation: ❌ NOT APPLICABLE
   (Reason: You're a distributor/importer, not a manufacturer - checkbox won't appear)
```

### **Product Details**
```
Product Description: Electronic components and circuit assemblies for automotive control systems
HS Code: [Auto-filled by AI]
```

### **Components (3 items)**
```
1. Multi-layer printed circuit boards, FR-4 substrate material, lead-free solder, surface-mount technology, automotive-grade with conformal coating
   Origin: China
   Percentage: 55%

2. Wire harness connectors with gold-plated contacts, waterproof sealed housings, automotive-grade terminals, compliant with SAE standards
   Origin: Mexico
   Percentage: 25%

3. Injection-molded ABS plastic housing with UV stabilizers, flame-retardant UL94 V-0 rated, impact-resistant enclosures for automotive control systems
   Origin: USA
   Percentage: 20%
```

### **Certificate Authorization Fields** (Fill before download)
```
Authorized Name: David Chen
Authorized Title: Distributor Manager
Certification Date: [Today's date]
Certification Box: CHECK THIS
```

### **Expected Certificate Preview**
```
Exporter: CanadaDistribution Inc
Address: 789 Commerce St, Toronto, ON M5H 2N2
Tax ID: BN-987654321RC0001
Contact: David Chen

Product HS Code: [AI-determined]
Description: Electronic components and circuit assemblies...
Preference Criterion: [AI-determined]

USMCA Qualification: [AI-determined - electronics have 65% threshold]
Regional Content: [Calculated]%
Threshold: [Determined by HS code category]%

Blanket Period: [Current date] to [+1 year]

✅ NO WATERMARK
✅ DOWNLOAD WORKS
✅ Service pricing: $149 (15% discount from $175)
✅ Unlimited analyses message displays
```

---

## 📋 TEST ACCOUNT 4: PREMIUM SUBSCRIBER ($599/month)

### **Login Credentials**
```
Email: premium@testcompany.com
Password: Pass123!
Status: Premium Subscription
Tier: PREMIUM ($599/month)
Limit: Unlimited analyses
```

### **Company Information**
```
Company Name: GlobalWholesale Corp
Business Type: Wholesaler/Importer
Industry Sector: Medical Devices
Company Address: 321 Medical Plaza, Houston, TX 77002
Company Country: United States
Tax ID: 12-3456789
Contact Person: Dr. Sarah Johnson
Contact Phone: +1-713-555-3456
Contact Email: sarah@globalwholesale.com
Trade Volume: $8,500,000
```

### **Trade Route Information** (Required by API)
```
Primary Supplier Country: Mexico ← WHERE YOU SOURCE COMPONENTS (USMCA)
Destination Market: United States ← WHERE YOU EXPORT TO
Manufacturing Location: Does Not Apply ← CRITICAL FOR AI ANALYSIS (distributor/wholesaler only)

🔲 Manufacturing involves substantial transformation: ❌ NOT APPLICABLE
   (Reason: You're a wholesaler/distributor, not a manufacturer - checkbox won't appear)
```

### **Product Details**
```
Product Description: Medical device components and surgical instrument assemblies
HS Code: [Auto-filled by AI]
```

### **Components (3 items)**
```
1. 316L surgical stainless steel components, precision machined, passivated surface treatment, FDA-compliant biocompatible material for surgical instruments
   Origin: USA
   Percentage: 40%

2. Medical-grade silicone seals, platinum-cured elastomer, USP Class VI certified, autoclave-resistant, biocompatible for medical device applications
   Origin: Mexico
   Percentage: 35%

3. Precision injection-molded polycarbonate housings, medical-grade clear plastic, USP Class VI certified, sterilizable and biocompatible for surgical instrument assemblies
   Origin: Canada
   Percentage: 25%
```

### **Certificate Authorization Fields** (Fill before download)
```
Authorized Name: Dr. Sarah Johnson
Authorized Title: Wholesaler Manager
Certification Date: [Today's date]
Certification Box: CHECK THIS
```

### **Expected Certificate Preview**
```
Exporter: GlobalWholesale Corp
Address: 321 Medical Plaza, Houston, TX 77002
Tax ID: 12-3456789
Contact: Dr. Sarah Johnson

Product HS Code: [AI-determined]
Description: Medical device components and surgical instrument assemblies...
Preference Criterion: [AI-determined]

USMCA Qualification: [AI-determined - medical devices have specific thresholds]
Regional Content: [Calculated]%
Threshold: [Determined by HS code category]%

Blanket Period: [Current date] to [+1 year]

✅ NO WATERMARK
✅ DOWNLOAD WORKS
✅ Service pricing: $131 (25% discount from $175)
✅ Unlimited analyses message displays
✅ Premium tier benefits mentioned
```

---

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
Contact Person: John Smith
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
Authorized Signatory Title: Importer Manager
Signatory Email: john.smith@autopartsusa.com
Signatory Phone: +1-313-555-1234

Importer Company: AutoParts USA Inc
Address: 123 Import Blvd, Detroit, MI 48201
Country: United States
Tax ID: 38-7654321

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
Contact Person: Maria Garcia
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

Importer Company: [Fill with your customer info]
Address: [Fill with customer address]
Country: [Select country]
Tax ID: [Fill with customer tax ID]

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
Contact Person: David Chen
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
Contact Person: Dr. Sarah Johnson
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

**You're all set! Use the data above for certificate testing. Good luck! 🎉**
