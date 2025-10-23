# SUBSCRIPTION TIER TEST SCRIPT
**Triangle Intelligence Platform - User Tier Testing**

**Testing Date**: __________
**Environment**: http://localhost:3000

---

## 🎯 QUICK COPY-PASTE TEST DATA

### TEST 1: TRIAL USER (Current Account)
**Email**: nature098@icloud.com
**Status**: Already logged in ✅

**Company Information**:
```
Company Name: AutoParts USA Inc
Business Type: Importer (IMPORTER)
Certifier Type: IMPORTER
Industry Sector: Automotive
Company Address: 123 Import Blvd, Detroit, MI 48201
Company Country: United States
Tax ID: 38-7654321
Contact Person: John Smith
Contact Phone: +1-313-555-1234
Contact Email: john.smith@autopartsusa.com
Trade Volume: 450000
Supplier Country: Mexico
Destination: United States
```

**Product Description**:
```
Automotive engine mount assemblies with steel housing and rubber vibration dampeners
```

yes Manufacturing involves substantial transformation (not just simple assembly)
Check this if your manufacturing process creates significant value beyond basic assembly (welding, forming, heat treatment, etc.)
**Manufacturing Location**: Mexico

**Components** (Detailed descriptions for accurate AI classification):
```
1. Cold-rolled steel housing with powder-coated finish, stamped and welded construction, corrosion-resistant coating | China | 20%
2. Natural rubber vibration dampeners, molded with metal inserts, durometer rating 50-60 Shore A, heat-resistant compound | Mexico | 50%
3. Grade 8 steel mounting bolts with lock washers, zinc-plated hardware, M10x1.5 thread pitch | USA | 30%
```

**✅ VERIFY**:
- [ ] Watermark on certificate preview
- [ ] Download BLOCKED - "Upgrade Required" message
- [ ] Workflow saves to database
- [ ] Dashboard shows workflow

---

### TEST 2: STARTER SUBSCRIBER ($99/month)
**Signup**: starter@testcompany.com / Pass123!

**Company Information**:
```
Company Name: MexManufacturing Ltd
Business Type: Manufacturer (PRODUCER)
Certifier Type: PRODUCER
Industry Sector: Textiles
Company Address: 456 Industrial Way, Monterrey, NL, Mexico 64000
Company Country: Mexico
Tax ID: RFC-MEX123456
Contact Person: Maria Garcia
Contact Phone: +52-81-555-6789
Contact Email: maria@mexmanufacturing.com
Trade Volume: 850000
Supplier Country: United States
Destination: Canada
```

**Product Description**:
```
Industrial textile products for automotive upholstery and interior trim
```
yes Manufacturing involves substantial transformation (not just simple assembly)
Check this if your manufacturing process creates significant value beyond basic assembly (welding, forming, heat treatment, etc.)

**Manufacturing Location**: Mexico

**Components** (Detailed descriptions for accurate AI classification):
```
1. 100% combed cotton fabric, twill weave construction, pre-shrunk and mercerized, 300 thread count, automotive-grade upholstery material | USA | 45% HS Code: 5209.42.00
2. High-tenacity polyester thread, UV-resistant coating, continuous filament spun, industrial-grade stitching for automotive applications | Mexico | 35%
3. Foam backing material with pressure-sensitive adhesive, flame-retardant treatment, closed-cell polyurethane construction | Canada | 20% HS Code: 3926.90.90
```

**✅ VERIFY**:
- [ ] Certificate downloads successfully (NO watermark)
- [ ] Service request shows $175 (NO discount)
- [ ] Dashboard shows "Starter" tier
- [ ] 10 analyses limit displayed

---

### TEST 3: PROFESSIONAL SUBSCRIBER ($299/month)
**Signup**: pro@testcompany.com / Pass123!

**Company Information**:
```
Company Name: CanadaDistribution Inc
Business Type: Distributor (IMPORTER)
Certifier Type: IMPORTER
Industry Sector: Electronics
Company Address: 789 Commerce St, Toronto, ON M5H 2N2
Company Country: Canada
Tax ID: BN-987654321RC0001
Contact Person: David Chen
Contact Phone: +1-416-555-9012
Contact Email: david@canadadist.com
Trade Volume: 2500000
Supplier Country: China
Destination: United States
```

**Product Description**:
```
Electronic components and circuit assemblies for automotive control systems
```

**Manufacturing Location**: Does Not Apply (Imported/Distributed Only)

**Components** (Detailed descriptions for accurate AI classification):
```
1. Multi-layer printed circuit boards, FR-4 substrate material, lead-free solder, surface-mount technology, automotive-grade with conformal coating | China | 55%
2. Wire harness connectors with gold-plated contacts, waterproof sealed housings, automotive-grade terminals, compliant with SAE standards | Mexico | 25%
3. Injection-molded ABS plastic housing with UV stabilizers, flame-retardant UL94 V-0 rated, impact-resistant enclosures for automotive control systems | USA | 20%
```

**✅ VERIFY**:
- [ ] Certificate downloads successfully
- [ ] Service request shows $149 (15% discount from $175)
- [ ] Dashboard shows "Professional" tier
- [ ] Unlimited analyses
- [ ] Email alerts enabled

---

### TEST 4: PREMIUM SUBSCRIBER ($599/month)
**Signup**: premium@testcompany.com / Pass123!

**Company Information**:
```
Company Name: GlobalWholesale Corp
Business Type: Wholesaler (IMPORTER)
Certifier Type: IMPORTER
Industry Sector: Medical Devices
Company Address: 321 Medical Plaza, Houston, TX 77002
Company Country: United States
Tax ID: 12-3456789
Contact Person: Dr. Sarah Johnson
Contact Phone: +1-713-555-3456
Contact Email: sarah@globalwholesale.com
Trade Volume: 8500000
Supplier Country: Mexico
Destination: United States
```

**Product Description**:
```
Medical device components and surgical instrument assemblies
```

**Manufacturing Location**: Does Not Apply (Imported/Distributed Only)

**Components** (Detailed descriptions for accurate AI classification):
```
1. 316L surgical stainless steel components, precision machined, passivated surface treatment, FDA-compliant biocompatible material for surgical instruments | USA | 40%
2. Medical-grade silicone seals, platinum-cured elastomer, USP Class VI certified, autoclave-resistant, biocompatible for medical device applications | Mexico | 35%
3. Precision injection-molded polycarbonate housings, medical-grade clear plastic, USP Class VI certified, sterilizable and biocompatible for surgical instrument assemblies | Canada | 25%
```

**✅ VERIFY**:
- [ ] Certificate downloads successfully
- [ ] Service request shows $131 (25% discount from $175)
- [ ] Dashboard shows "Premium" tier
- [ ] Unlimited analyses
- [ ] Quarterly strategy calls mentioned

---

## 📋 STEP-BY-STEP TEST PROCEDURE

### For Each Tier:

**1. SIGNUP** (Skip for Trial - already logged in)
```
Go to: http://localhost:3000/signup
Copy-paste email and password
Fill: Full Name, Company Name (from table above)
Check: Terms of Service
Click: Create Account
Verify: Email confirmation
Login: Use same credentials
```

**2. SUBSCRIBE** (Skip for Trial)
```
Go to: http://localhost:3000/pricing
Click: Subscribe to [Tier] Plan
Use Stripe Test Card:
  Card: 4242 4242 4242 4242
  Expiry: 12/28
  CVC: 123
  ZIP: 12345
Verify: Redirected to dashboard
Verify: Tier shows correctly
```

**3. RUN USMCA WORKFLOW**
```
Go to: http://localhost:3000/usmca-workflow
Copy-paste company info (from table above)
Click: Next Step
Copy-paste product description
Copy-paste manufacturing location
Add 3 components (from table above)
Click: 🤖 Get AI HS Code Suggestion (for each)
Click: Analyze USMCA Qualification
```

**4. VIEW RESULTS**
```
Verify: Qualification status displays
Verify: Component table shows enrichment
Verify: Tariff rates populated
Verify: Savings calculated
```

**5. CERTIFICATE TEST**
```
Click: Generate Certificate or Download
Fill: Authorization fields
  Authorized Name: [Contact Person from table]
  Title: [Business Type] Manager
  Date: [Today]
  Check: Certification box
Click: Download PDF

TRIAL: Verify watermark + download blocked
PAID: Verify download works, no watermark
```

**6. SAVE TO DATABASE**
```
Click: Save Analysis to Database (if visible)
Accept: Consent modal
Verify: Success message
```

**7. VERIFY DASHBOARD**
```
Go to: http://localhost:3000/dashboard
Verify: Trial countdown (Trial only)
Verify: Usage section shows tier
Verify: Workflow appears in "My Certificates"
Verify: Company name visible
Verify: Qualification status shown
```

**8. TEST SERVICE PRICING**
```
Scroll to: Request Expert Service
Select: USMCA Advantage Sprint
Verify pricing:
  Trial/Starter: $175 (no discount)
  Professional: $149 (15% off)
  Premium: $131 (25% off)
```

---

## 🎯 QUICK CHECKLIST (Check ☑ when PASS)

### TEST 1: TRIAL USER
- [ ] Dashboard shows "7 days remaining"
- [ ] Workflow completes successfully
- [ ] Certificate preview has WATERMARK
- [ ] Download BLOCKED with upgrade message
- [ ] Workflow saves to database
- [ ] Dashboard displays saved workflow
- [ ] Service shows $175 (no discount)

### TEST 2: STARTER ($99/month)
- [ ] Signup + payment successful
- [ ] Dashboard shows "Starter" tier
- [ ] Certificate downloads (no watermark)
- [ ] Service shows $175 (no discount)
- [ ] 10 analyses limit displayed

### TEST 3: PROFESSIONAL ($299/month)
- [ ] Signup + payment successful
- [ ] Dashboard shows "Professional" tier
- [ ] Certificate downloads (no watermark)
- [ ] Service shows $149 (15% discount)
- [ ] Unlimited analyses

### TEST 4: PREMIUM ($599/month)
- [ ] Signup + payment successful
- [ ] Dashboard shows "Premium" tier
- [ ] Certificate downloads (no watermark)
- [ ] Service shows $131 (25% discount)
- [ ] Unlimited analyses
- [ ] Quarterly calls mentioned

---

## 🚨 CRITICAL ISSUES LOG

**BLOCKERS** (must fix before launch):

1. ________________________________________________

2. ________________________________________________

3. ________________________________________________

**NON-CRITICAL** (can fix post-launch):

1. ________________________________________________

2. ________________________________________________

---

## ✅ GO/NO-GO

**Tests Passed**: ______ / 28
**Critical Blockers**: ______ (must be 0)

**LAUNCH STATUS**: ☐ GO  ☐ NO-GO

**Tested By**: __________
**Date**: __________
