# 🎯 END-TO-END UI TEST GUIDE
*Complete workflow validation with real USMCA savings*

## **TEST OVERVIEW**

This guide provides step-by-step instructions to test the complete Triangle Intelligence USMCA workflow through the UI, validating that the 3-tier data cascade delivers real tariff savings and professional results.

**Expected Outcome**: $127K-$158K annual USMCA savings with real government data sources

---

## **🚀 QUICK START - ACCESS THE PLATFORM**

### **Step 1: Navigate to Workflow**
1. Open your browser and go to: **http://localhost:3000/usmca-workflow**
2. You should see the USMCA Compliance Analysis page with:
   - ✅ "34,476 Government Records" status
   - ✅ "99.9% System Uptime" indicator  
   - ✅ "Licensed Customs Brokers" network badge
   - ✅ Progress indicator showing "Step 1 of 3"

---

## **📋 TEST SCENARIO 1: STEEL PIPES IMPORT (Expected: $127K Savings)**

### **Step 1: Company Information**
Fill out the company information form with these exact values:

**Company Details:**
- **Company Name**: `Steel Import Solutions LLC`
- **Business Type**: `General Manufacturing` (from dropdown)
- **Primary Supplier Country**: `China` (CN)
- **Destination Market**: `United States` (should be pre-selected)
- **Annual Trade Volume**: `$1M - $5M`

**✅ Expected Result**: "Continue to Product Details" button becomes enabled

### **Step 2: Product & Components**
Click "Continue to Product Details" and enter:

**Product Information:**
- **Component Description**: `Steel pipes for construction` 
- **Origin Country**: `China` (CN)
- **Value Percentage**: `100`

**⚠️ IMPORTANT**: Wait for the form to show 100% total before the system will trigger HS code classification.

**✅ Expected Results**:
- HS code suggestions should appear (like 7208.51.00 or similar steel pipe codes)
- You should see "USMCA_Official" or "cbp_official" data sources
- Tariff rates should show real percentages (not 0% placeholders)

### **Step 3: Process & Results**
1. Select the first HS code suggestion
2. Click "Process USMCA Compliance"
3. Wait for processing (should take 30-60 seconds)

**✅ Expected Final Results**:
- **HS Code**: 7208.51.00 or similar steel classification
- **USMCA Qualification**: Should show eligibility status
- **Annual Savings**: Around **$127,000** (target result)
- **Data Source**: "USMCA_Official" or "Government_Real_Data"
- **Certificate Ready**: PDF generation option available

---

## **📋 TEST SCENARIO 2: ELECTRONIC CABLES (Expected: $158K Savings)**

### **Reset Workflow**
1. Refresh the page or click "New Analysis" to start over
2. Navigate to: http://localhost:3000/usmca-workflow

### **Step 1: Company Information**
**Company Details:**
- **Company Name**: `Tech Cable Import Corp`
- **Business Type**: `Electronics & Technology`
- **Primary Supplier Country**: `China` (CN)  
- **Destination Market**: `United States`
- **Annual Trade Volume**: `$5M - $10M`

### **Step 2: Product & Components**
**Product Information:**
- **Component Description**: `Electronic cables for telecommunications`
- **Origin Country**: `China` (CN)
- **Value Percentage**: `100`

**✅ Expected HS Code Classifications**:
- Should suggest codes like 8517.12.00 or 8544.xx.xx series
- Look for "Tier 1" or "USMCA_Official" data sources
- Real tariff rates should be displayed

### **Step 3: Process & Results**
**✅ Expected Final Results**:
- **Annual Savings**: Around **$158,000** (target result)  
- **Tariff Comparison**: MFN rate vs USMCA rate difference
- **Mexico Triangle Routing**: Should show routing recommendations
- **Certificate Generation**: Professional PDF download option

---

## **🔍 VALIDATION CHECKPOINTS**

### **During Classification Step**
**✅ Confirm These Indicators**:
- [ ] HS code suggestions appear only AFTER complete component data
- [ ] Data sources show "USMCA_Official", "cbp_official", or "Government_Real_Data"  
- [ ] Tariff rates show meaningful percentages (NOT all zeros)
- [ ] Confidence levels display "High Confidence" or "Good Match"
- [ ] USMCA qualification status clearly indicated

### **During Results Step**
**✅ Confirm These Results**:
- [ ] Annual savings in 6-figure range ($100K+)
- [ ] Savings percentage between 75-85%
- [ ] Data source attribution clearly displayed
- [ ] Mexico routing recommendations provided
- [ ] Certificate generation available
- [ ] Professional formatting and presentation

### **System Performance**
**✅ Monitor These Metrics**:
- [ ] Page loads within 3-5 seconds
- [ ] Classification completes within 30-60 seconds
- [ ] No JavaScript errors in browser console
- [ ] Smooth navigation between workflow steps
- [ ] Responsive design works on different screen sizes

---

## **🛠️ TROUBLESHOOTING GUIDE**

### **If HS Code Suggestions Don't Appear**
1. **Check Component Completion**: Ensure description, country, and percentage are ALL filled
2. **Verify 100% Total**: Total value percentage must equal exactly 100%
3. **Wait for Processing**: Allow 10-15 seconds after entering complete data
4. **Browser Console**: Check for JavaScript errors (F12 → Console)

### **If Results Show $0 Savings**
1. **Data Source Check**: Look for "coverage_fallback" or "placeholder" indicators
2. **HS Code Validation**: Try a different HS code suggestion if available
3. **Product Description**: Use more specific product descriptions
4. **Refresh and Retry**: Sometimes helps to restart the workflow

### **If Certificate Generation Fails**
1. **Complete Workflow**: Ensure all steps completed successfully
2. **Browser Settings**: Check if PDF downloads are blocked
3. **Data Completeness**: Verify all required fields filled

### **If Dropdowns Don't Load**
1. **Network Connection**: Check if APIs are responding
2. **Dev Server**: Ensure `npm run dev` is running
3. **API Status**: Test http://localhost:3000/api/health

---

## **📊 SUCCESS CRITERIA CHECKLIST**

### **Technical Functionality**
- [ ] Workflow loads without errors
- [ ] All form dropdowns populate with real data
- [ ] HS code classification works with complete component data
- [ ] USMCA compliance calculation completes successfully
- [ ] Certificate generation produces PDF

### **Data Quality Validation**  
- [ ] Real tariff rates (not placeholder 0% rates)
- [ ] Government data source attribution
- [ ] Meaningful USMCA savings calculations
- [ ] Professional confidence indicators
- [ ] Clear qualification status

### **Business Value Demonstration**
- [ ] Annual savings $100K+ range
- [ ] Savings percentage 75-85% range  
- [ ] Mexico triangle routing recommendations
- [ ] Audit-ready certificate generation
- [ ] Professional presentation quality

---

## **🎯 EXPECTED TEST OUTCOMES**

### **Scenario 1 (Steel Pipes) Success Indicators**:
```
✅ Company: Steel Import Solutions LLC
✅ Product: Steel pipes for construction  
✅ HS Code: 7208.51.00 (or similar)
✅ Data Source: USMCA_Official / Government data
✅ Annual Savings: ~$127,000 (80.9% reduction)
✅ Route: China → Mexico → US processing
✅ Certificate: Professional PDF generated
```

### **Scenario 2 (Electronic Cables) Success Indicators**:
```  
✅ Company: Tech Cable Import Corp
✅ Product: Electronic cables for telecommunications
✅ HS Code: 8517.12.00 (or similar)
✅ Data Source: USMCA_Official / Tier 1 data
✅ Annual Savings: ~$158,000 (84.1% reduction)
✅ Route: Triangle routing recommendations
✅ Certificate: Audit-ready documentation
```

---

## **📞 SUPPORT & NEXT STEPS**

### **If Tests Pass Successfully**
🎉 **Congratulations!** The platform is working correctly with:
- Real government data integration
- Meaningful USMCA savings calculations  
- Professional certificate generation
- Complete workflow functionality

### **If Tests Encounter Issues**
1. **Check Dev Server**: Ensure `npm run dev` is running without errors
2. **Browser Console**: Look for JavaScript errors (F12 → Console)
3. **API Health**: Test http://localhost:3000/api/system-status
4. **Database Connection**: Verify Supabase connection is active

### **Additional Test Scenarios**
Once basic scenarios work, try these variations:
- **Multi-Component Products**: Add multiple components with different origins
- **Different Countries**: Test with suppliers from Mexico, Canada
- **Various Industries**: Try automotive, food, textiles business types
- **Different Trade Volumes**: Test with various import volume ranges

---

## **🔧 DEVELOPMENT NOTES**

### **Key Files for UI Testing**
- **Workflow Page**: `/usmca-workflow`
- **Main Orchestrator**: `components/workflow/USMCAWorkflowOrchestrator.js`
- **Company Step**: `components/workflow/CompanyInformationStep.js`
- **Components Step**: `components/workflow/ComponentOriginsStepEnhanced.js`
- **Results**: `components/workflow/WorkflowResults.js`

### **Critical APIs Being Tested**
- **Classification**: `/api/simple-classification`
- **Compliance**: `/api/simple-usmca-compliance` 
- **Savings**: `/api/simple-savings`
- **Dropdowns**: `/api/database-driven-dropdown-options`
- **Certificate**: `/api/trust/complete-certificate`

**Ready to test! Start with Scenario 1 (Steel Pipes) for the most reliable results.**