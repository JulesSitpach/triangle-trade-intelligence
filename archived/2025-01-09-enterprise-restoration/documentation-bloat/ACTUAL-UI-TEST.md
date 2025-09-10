# ACTUAL UI TEST - BASED ON REAL CODE

## STEP 1: Open Workflow
**http://localhost:3000/usmca-workflow**

## STEP 2: Fill Company Information
Based on actual CompanyInformationStep.js (lines 64-66), these are REQUIRED:
- **Company Name**: `Test Company` (required - line 64)
- **Business Type**: Select any from dropdown (required - line 65)
- **Annual Trade Volume**: Select any from dropdown (required - line 66)

These are OPTIONAL:
- **Primary Supplier Country**: Select `China` if you want
- **Destination Market**: Leave as `United States`

**Button enables when**: company_name AND business_type AND trade_volume are filled

## STEP 3: Product & Components
Fill in:
- **Component Description**: `steel pipes`
- **Origin Country**: `China`  
- **Value Percentage**: `100`

Wait for HS codes to appear, select one.

## STEP 4: Process
Click **"Process USMCA Compliance"**

## STEP 5: Get Certificate
Click **"Download Certificate"** when available.

---

This is based on the ACTUAL code at lines 64-66 of CompanyInformationStep.js which shows the button is disabled if these three fields are empty.