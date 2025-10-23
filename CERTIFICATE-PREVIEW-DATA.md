# Certificate Preview Data - All Test Accounts

**For Phase 3c Manual Testing - Complete Certificate Information**

---

## 🎯 How to Test Certificate Preview

1. Complete USMCA workflow with company data (below)
2. Click "View Results" → "Generate Certificate"
3. Fill certificate authorization fields
4. Click "Download" or "View Preview"
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

### **Company Information**
```
Company Name: AutoParts USA Inc
Business Type: Importer
Industry Sector: Automotive
Company Address: 123 Import Blvd, Detroit, MI 48201
Company Country: United States
Tax ID: 38-7654321
Contact Person: John Smith
Contact Phone: +1-313-555-1234
Contact Email: john.smith@autopartsusa.com
Trade Volume: $450,000
```

### **Trade Route Information** (Required by API)
```
Primary Supplier Country: Mexico ← WHERE YOU SOURCE COMPONENTS
Destination Market: United States ← WHERE YOU EXPORT TO
```

### **Product Details**
```
Product Description: Automotive engine mount assemblies with steel housing and rubber vibration dampeners
Manufacturing Location: Mexico
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

### **Certificate Authorization Fields** (Fill before download)
```
Authorized Name: John Smith
Authorized Title: Importer Manager
Certification Date: [Today's date]
Certification Box: CHECK THIS
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
```

### **Product Details**
```
Product Description: Industrial textile products for automotive upholstery and interior trim
Manufacturing Location: Mexico
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
```

### **Product Details**
```
Product Description: Electronic components and circuit assemblies for automotive control systems
Manufacturing Location: Does Not Apply (Imported/Distributed Only)
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
```

### **Product Details**
```
Product Description: Medical device components and surgical instrument assemblies
Manufacturing Location: Does Not Apply (Imported/Distributed Only)
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

### **Test 1: TRIAL** (Copy all at once)
```
Company Name: AutoParts USA Inc
Address: 123 Import Blvd, Detroit, MI 48201
Contact: John Smith
Phone: +1-313-555-1234
Tax ID: 38-7654321

Product: Automotive engine mount assemblies with steel housing and rubber vibration dampeners
Manufacturing: Mexico

Component 1: Cold-rolled steel housing | China | 20%
Component 2: Natural rubber dampeners | Mexico | 50%
Component 3: Grade 8 steel bolts | USA | 30%

Authorization Name: John Smith
Authorization Title: Importer Manager
```

### **Test 2: STARTER** (Copy all at once)
```
Company Name: MexManufacturing Ltd
Address: 456 Industrial Way, Monterrey, NL, Mexico 64000
Contact: Maria Garcia
Phone: +52-81-555-6789
Tax ID: RFC-MEX123456

Product: Industrial textile products for automotive upholstery and interior trim
Manufacturing: Mexico

Component 1: 100% combed cotton fabric | USA | 45%
Component 2: High-tenacity polyester thread | Mexico | 35%
Component 3: Foam backing material | Canada | 20%

Authorization Name: Maria Garcia
Authorization Title: Manufacturer Manager
```

### **Test 3: PROFESSIONAL** (Copy all at once)
```
Company Name: CanadaDistribution Inc
Address: 789 Commerce St, Toronto, ON M5H 2N2
Contact: David Chen
Phone: +1-416-555-9012
Tax ID: BN-987654321RC0001

Product: Electronic components and circuit assemblies for automotive control systems
Manufacturing: Does Not Apply

Component 1: Multi-layer circuit boards | China | 55%
Component 2: Wire harness connectors | Mexico | 25%
Component 3: Injection-molded ABS housing | USA | 20%

Authorization Name: David Chen
Authorization Title: Distributor Manager
```

### **Test 4: PREMIUM** (Copy all at once)
```
Company Name: GlobalWholesale Corp
Address: 321 Medical Plaza, Houston, TX 77002
Contact: Dr. Sarah Johnson
Phone: +1-713-555-3456
Tax ID: 12-3456789

Product: Medical device components and surgical instrument assemblies
Manufacturing: Does Not Apply

Component 1: 316L surgical stainless steel | USA | 40%
Component 2: Medical-grade silicone seals | Mexico | 35%
Component 3: Precision polycarbonate housings | Canada | 25%

Authorization Name: Dr. Sarah Johnson
Authorization Title: Wholesaler Manager
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
