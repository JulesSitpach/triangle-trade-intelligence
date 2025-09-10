# AGENT IMPLEMENTATION CHECKLIST
## USMCA Platform Critical Issues - Status Tracking

*Based on comprehensive analysis artifact from September 8, 2025*

---

## 1. FOUNDATION METHODOLOGY FIXES

### Agent Behavioral Requirements
- [ ] **Examine actual code files before making statements** about system capabilities
- [ ] **Query database tables before claiming data availability** 
- [ ] **Test complete workflows before declaring completion**
- [ ] **Build cumulative understanding** rather than starting fresh each conversation
- [ ] **Validate all assumptions against actual implementation**

### Forcing Functions Implementation
- [ ] **Read actual files before writing specifications**
- [ ] **Use Read, Grep, Bash tools systematically** before analysis
- [ ] **Complete database schema analysis** before any development work
- [ ] **Foundation audit before claiming fixes complete**

**STATUS:** ❓ UNKNOWN - Need agent confirmation of methodology adoption

---

## 2. DATABASE ARCHITECTURE FIXES

### 3-Tier Data Cascade Implementation
- [x] **Fix API query logic** to properly cascade through data tiers
- [x] **Implement getCascadedTariffData function** in core APIs (lookupTariffWithFallback)
- [x] **Update simple-savings.js** to use Tier 2 (tariff_rates) before fallback
- [ ] **Update simple-usmca-compliance.js** to access real tariff data
- [x] **Update simple-classification.js** to use proper data cascade

### Database Integration Validation
- [x] **Verify >80% of searches return Tier 1 or Tier 2 real data** (confirmed cbp_harmonized_tariff_schedule)
- [x] **Confirm elimination of placeholder/fallback data dominance** (no more generic 8.5% rates)
- [ ] **Test foundation audit shows "READY FOR CUSTOMERS"**
- [x] **Validate customer scenarios return real savings calculations** (verified with live testing)

**STATUS:** ✅ MOSTLY COMPLETE - Core functionality working, need full audit verification

---

## 3. UI WORKFLOW LOGIC CORRECTIONS

### Premature Calculation Prevention
- [ ] **Block HS code suggestions** until complete component data entry
- [ ] **Show "Complete all fields" message** instead of premature suggestions
- [ ] **Require total component percentages = 100%** before calculations
- [ ] **Implement real-time recalculation** when component data changes

### Data Collection Workflow
- [ ] **Enforce origin country requirement** before showing results
- [ ] **Enforce value percentage requirement** before calculations
- [ ] **Validate complete component breakdown** before USMCA qualification
- [ ] **Prevent misleading "NOT QUALIFIED" with incomplete data**

**STATUS:** ❓ UNKNOWN - Need UI workflow testing verification

---

## 4. PARAMETER NAMING MISMATCH FIXES

### Critical API Parameter Fixes
- [x] **Fix simple-savings.js** parameter handling (camelCase vs snake_case)
- [x] **Fix simple-classification.js** parameter handling
- [x] **Fix simple-usmca-compliance.js** parameter handling
- [x] **Fix context-classification.js** parameter handling (normalization implemented, internal bug exists)

### Parameter Transformation Implementation
- [x] **Implement backend parameter normalizer** (hybrid approach)
- [ ] **Add frontend parameter conversion** to snake_case
- [x] **Test API calls with both parameter formats** (6/8 endpoints working)
- [x] **Validate real calculations vs fallback data elimination** (confirmed cbp data sources)

### Affected Components Update
- [ ] **Update GuidedProductInput.js** parameter format
- [ ] **Update ComponentOriginsStepEnhanced.js** parameter format
- [ ] **Update CrisisTariffAlertsPage.js** parameter format
- [ ] **Update 26 other affected component instances**

**STATUS:** ✅ CORE COMPLETE - API layer fixed, component updates pending

---

## 5. BUSINESS CONTEXT INTEGRATION

### Strategic Supplier Intelligence
- [ ] **Implement Mexico/Canada partnership opportunity highlighting**
- [ ] **Add scenario modeling for regulatory change outcomes**
- [ ] **Create long-term sourcing strategy recommendations**
- [ ] **Position platform beyond immediate compliance**

### Policy Intelligence Integration
- [ ] **Implement Trump Tracker monitoring** for trade announcements
- [ ] **Add rule change impact assessment** for existing qualifications
- [ ] **Create customer communication workflows** for regulatory updates
- [ ] **Build scenario planning for USMCA renegotiation**

**STATUS:** ❓ UNKNOWN - Need strategic feature implementation verification

---

## 6. END-TO-END VALIDATION REQUIREMENTS

### Technical Validation Tests
- [ ] **Foundation audit shows "READY FOR CUSTOMERS"**
- [ ] **Customer scenarios return real tariff data** (not placeholders)
- [ ] **Complete UI workflows function without errors**
- [ ] **>95% of searches utilize real government tariff data**

### Business Validation Tests
- [ ] **Platform demonstrates $150K-$625K annual savings** per customer
- [ ] **Users complete qualification in <30 minutes**
- [ ] **Results defensible for customs audits**
- [ ] **Supplier recommendations drive strategic value**

### Integration Validation Tests
- [ ] **Company profile data flows to qualification calculations**
- [ ] **Origin country changes trigger accurate recalculation**
- [ ] **UI displays reflect backend calculation sophistication**
- [ ] **Parameter consistency across all form-to-API connections**

**STATUS:** ❓ UNKNOWN - Need comprehensive end-to-end testing

---

## 7. OPERATIONAL READINESS

### Customer Workflow Completion
- [ ] **Customer onboarding functionality** implemented
- [ ] **Payment processing integration** (Stripe)
- [ ] **Trial management system** operational
- [ ] **Customer support workflows** established

### Admin Team Capabilities
- [ ] **Admin dashboards display real customer data**
- [ ] **Business intelligence for customer success monitoring**
- [ ] **Revenue tracking and commission systems**
- [ ] **Crisis monitoring and customer communication tools**

**STATUS:** ❓ UNKNOWN - Need business operations verification

---

## CRITICAL SUCCESS CRITERIA

### Platform Must Demonstrate:
- [ ] **Real tariff savings calculations** ($150K-$625K range)
- [ ] **Accurate USMCA qualification** based on complete component data
- [ ] **Strategic supplier partnership recommendations**
- [ ] **Defensible results for business decision-making**

### Agent Must Prove:
- [ ] **Systematic methodology adoption** (no more assumption-based work)
- [ ] **Complete system understanding** (database, APIs, UI integration)
- [ ] **End-to-end workflow validation** before claiming completion
- [ ] **Real customer value delivery** verification

---

## IMMEDIATE AGENT ACTIONS REQUIRED

1. **Methodology Verification:** Confirm adoption of foundation-first approach
2. **Database Status:** Verify 3-tier cascade implementation and real data utilization
3. **UI Workflow Status:** Test complete customer workflows for proper data collection
4. **Parameter Fix Status:** Confirm resolution of camelCase/snake_case mismatches
5. **Integration Testing:** Validate end-to-end customer scenarios with real results

**AGENT MUST PROVIDE EVIDENCE-BASED STATUS UPDATES FOR EACH CHECKLIST ITEM**

No claims of completion without systematic validation against this checklist.