# USMCA Workflow - Test Cheat Sheet

## How to Use
Copy/paste the test data directly into the form fields. All values are realistic and pass API validation.

---

## STEP 1: COMPANY INFORMATION

| Field | Test Value | Notes |
|-------|-----------|-------|
| Company Name | Acme Electronics Manufacturing Inc | Min length required |
| Business Type | Manufacturer | Options: Importer, Exporter, Manufacturer, Distributor, Wholesaler, Retailer |
| Industry Sector | Electronics | Must be selected from dropdown (see all 14 options below) |
| Company Address | 42 Industrial Park Drive, San Jose CA 95110 | Full address required |
| Company Country | United States | Options: US, Canada, Mexico, China, Vietnam, etc. |
| Destination Market | Mexico | **CRITICAL for USMCA**: Must be US, Canada, or Mexico |
| Contact Person | Sarah Chen | Full name required |
| Contact Phone | (408) 555-0142 | Format: (XXX) XXX-XXXX or +1-XXX-XXX-XXXX |
| Contact Email | sarah.chen@acmeelec.com | Valid email format |
| Tax ID / Business Number | 95-1234567 | EIN format for US: XX-XXXXXXX |
| Annual Trade Volume | 5,500,000 | In USD. Can include commas, no $ symbol |
| Supplier Country | Mexico | Where primary components originate |

---

## STEP 2: PRODUCT & COMPONENT ANALYSIS

**Product Section:**

| Field | Test Value | Notes |
|-------|-----------|-------|
| Complete Product Description | Industrial-grade dual-core microprocessor system with metal housing and LCD interface | Detailed description for accurate HS classification |
| Manufacturing/Assembly Location | Mexico | Required. Options: "Does Not Apply" or any country |

**Component Origins (BOM):**

### Add these components one at a time - they must sum to 100% or less

**Component 1 - Microprocessor**
- Description: ARM-based dual-core microprocessor controller module
- Origin Country: China
- Value Percentage: 35
- HS Code: 8542.31
- Manufacturing Location: Mexico

**Component 2 - Power Supply Module**
- Description: 85W switching power supply with UPS backup battery integration
- Origin Country: Mexico
- Value Percentage: 25
- HS Code: 8504.40
- Manufacturing Location: Mexico

**Component 3 - Aluminum Housing**
- Description: Precision-machined 6061-T6 aluminum enclosure with mounting hardware
- Origin Country: Mexico
- Value Percentage: 20
- HS Code: 7616.99
- Manufacturing Location: Mexico

**Component 4 - LCD Display**
- Description: 7-inch industrial-grade LCD touchscreen display module with drivers
- Origin Country: Vietnam
- Value Percentage: 15
- HS Code: 9405.10
- Manufacturing Location: Mexico

**Component 5 - Wiring & Assembly**
- Description: Pre-assembled wiring harness with safety-rated connectors
- Origin Country: Mexico
- Value Percentage: 5
- HS Code: 8544.30
- Manufacturing Location: Mexico

**Total: 100%** ✓

---

## ALTERNATIVE TEST SCENARIO (Simpler - 2 Components)

### Use this if you want faster testing

**Step 1: Company Information - Same as above**

**Step 2: Components**

**Component 1**
- Description: Industrial-grade lithium battery management system with safety electronics
- Origin Country: South Korea
- Value Percentage: 60
- HS Code: 8507.80
- Manufacturing Location: Mexico

**Component 2**
- Description: Stainless steel mounting brackets and fasteners assembly
- Origin Country: Mexico
- Value Percentage: 40
- HS Code: 7326.90
- Manufacturing Location: Mexico

**Total: 100%** ✓

---

## ALL 14 INDUSTRY SECTOR OPTIONS

**Complete list of industries available in dropdown with their USMCA RVC thresholds:**

| Industry Sector | RVC Threshold | Labor Credit | USMCA Article |
|---|---|---|---|
| Agriculture | 60% | 17.5% | Art. 4.4 |
| Automotive | 75% | 22.5% | Art. 4.5 |
| Base Metals | 62.5% | 12.5% | Art. 4.2 |
| Chemicals | 62.5% | 12.5% | Art. 4.2 |
| Electronics | 65% | 17.5% | Art. 4.7 |
| Energy Equipment | 62.5% | 12.5% | Art. 4.2 |
| General | 62.5% | 15% | Art. 4.2 |
| Leather | 55% | 20% | Art. 4.3 |
| Machinery | 62.5% | 12.5% | Art. 4.2 |
| Plastics & Rubber | 62.5% | 12.5% | Art. 4.2 |
| Precision Instruments | 62.5% | 12.5% | Art. 4.2 |
| Textiles/Apparel | 55% | 27.5% | Art. 4.3 |
| Transport Equipment | 62.5% | 15% | Art. 4.2 |
| Wood Products | 62.5% | 12.5% | Art. 4.2 |

**Testing Tips:**
- Try each industry to verify the correct threshold is applied
- Check the AI prompt includes the correct RVC percentage
- Verify the labor credit matches the threshold for that industry
- Watch the regional content calculation - it includes the labor credit

---

## QUICK REFERENCE: REQUIRED FIELD VALIDATIONS

### Step 1 Validation Rules
✓ Company Name - Any text, min 2 characters
✓ Business Type - Must select from: Importer, Exporter, Manufacturer, Distributor, Wholesaler, or Retailer
✓ Industry Sector - Must select from dropdown
✓ Address - Any valid address format
✓ Company Country - Any country
✓ **Destination Country - MUST BE: US, Canada, or Mexico** ← CRITICAL
✓ Contact Person - Any name
✓ Contact Phone - Any valid phone format
✓ Contact Email - Must be valid email format
✓ Tax ID - Any format (EIN: XX-XXXXXXX or CA: Business Number, MX: RFC)
✓ Trade Volume - Numeric only, can include commas, no currency symbols
✓ Supplier Country - Any country
✓ All 12 fields required to proceed to Step 2

### Step 2 Validation Rules
✓ Complete Product Description - Required for accurate AI classification
✓ **Manufacturing/Assembly Location - REQUIRED** ← CRITICAL. Options: "Does Not Apply" or any country
✓ Component Description - **Minimum 10 characters** ← CRITICAL
✓ Component Origin Country - Any country
✓ Component Value Percentage - Numeric, **total must equal 100%** ← CRITICAL
✓ Component HS Code - 6-10 digit format (e.g., 8542.31 or 854231). Must have at least 1 HS code across all components
✓ Minimum 1 component required (maximum depends on subscription tier)

---

## EXPECTED WORKFLOW RESULTS

After submission, you should see:

**For Mexico Destination (Free Cache):**
- Tariff data retrieved instantly from database cache
- No OpenRouter API calls needed
- Shows cached rates from January 2025 with warning label

**For US/Canada Destination (Paid Lookup):**
- OpenRouter API calls to get current 2025 tariff rates
- Takes 2-5 seconds for analysis
- Shows real-time Section 301/232 tariffs
- AI confidence scores for each component

**USMCA Qualification:**
- Shows regional content percentage
- Displays qualified/not qualified status
- Lists components affecting qualification
- Shows MFN vs USMCA rate comparison

**Certificate Generation:**
- If QUALIFIED: Shows "Generate Certificate" button
- If NOT QUALIFIED: Shows alternatives and upgrade options

---

## COMMON MISTAKES TO AVOID

❌ Don't use $ or commas in Trade Volume field (e.g., "$5,500,000")
→ Use: 5500000 or 5,500,000 (commas OK, no currency symbol)

❌ Don't select "Canada" or "US" as company country if you need USMCA benefits
→ Most USMCA workflows start with non-USMCA suppliers (China, Vietnam, India)

❌ Don't make component descriptions too short
→ Min 10 characters, preferably full technical specs

❌ Don't exceed 100% on component percentages
→ If you add Component 5 at 5%, total must be ≤100%

❌ Don't use HS codes that don't match component type
→ Example: Use 8542.31 (microprocessor) not 8504.40 (power supply) for a CPU

✅ DO use realistic destination countries (US/CA/MX only for USMCA)

✅ DO use manufacturing location = Mexico for USMCA benefits
(Products partially made in Mexico qualify for treaty benefits)

✅ DO provide detailed component descriptions
(AI uses this to look up correct HS codes and tariff impacts)

---

## TEST DATA WITH VARIATIONS

### Test Case A: China-to-US (High tariff scenario)
- Company Country: China
- Destination: United States
- Main Component: 8517.62 (smartphones) from China
- Expected: High Section 301 tariffs, NOT qualified unless Mexico manufacturing

### Test Case B: Mexico-to-US (USMCA scenario)
- Company Country: Mexico
- Destination: United States
- Components: Assembled in Mexico
- Expected: QUALIFIED with 60%+ regional content, lower tariffs

### Test Case C: Multi-sourcing (Complex BOM)
- Use the 5-component example above
- Mix of China/Mexico/Vietnam/Korea origins
- Manufactured in Mexico
- Expected: Medium tariffs, conditional qualification

---

## DATABASE REFERENCE

**If you want to manually check results in Supabase:**

Table: `workflow_sessions`
- Contains company name, destination, all form data
- Field: `workflow_data` → JSON of complete analysis

Table: `tariff_rates_cache`
- HS codes stored here with destination-specific rates
- Filter by: destination_country, expires_at > now()

Table: `workflow_completions`
- Stores final qualified/not qualified status
- Shows estimated annual savings

---

## NEXT STEPS AFTER TESTING

1. **Alerts Page**: Click "Generate Alert Analysis" to see trade policy alerts
2. **Dashboard**: View all submitted workflows and results
3. **Certificate**: Download USMCA Form D certificate (if qualified)
4. **Email Alerts**: Enable email notifications for tariff policy changes

---

**Last Updated:** October 24, 2025
**Valid for:** USMCA Workflow v1.0
**API Endpoint:** POST `/api/ai-usmca-complete-analysis`
