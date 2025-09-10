# MANDATORY AGENT EVIDENCE DOCUMENTATION

## 🚨 REQUIRED FOR ALL SYSTEM CAPABILITY CLAIMS

**Every agent must use this template before making ANY statement about system functionality.**

---

## **CLAIM VERIFICATION TEMPLATE**

```markdown
## CLAIM: [Specific statement about system capability]

### 📖 FILE IMPLEMENTATION EVIDENCE:
**Files Read:** 
- [List complete files read with Read tool]
- [Show key code sections that prove functionality]

**Code Analysis:**
```[language]
[Paste relevant code sections showing actual implementation]
```

### 🧪 FUNCTIONALITY TEST EVIDENCE:
**API Endpoints Tested:**
- Endpoint: [URL]
- Method: [GET/POST/etc]
- Request: [Actual request sent]
- Response: [Actual response received]
- Status: [Success/Failure with details]

**UI Components Tested:**
- Component: [Name and location]
- Test Method: [How tested]
- Results: [What actually happened]

### 💾 DATABASE VERIFICATION EVIDENCE:
**Tables Queried:**
- Table: [table_name]  
- Query: [SQL query executed]
- Results: [Number of records, sample data]

**Data Flow Verified:**
- Input: [Data sent]
- Processing: [How data flows through system]
- Output: [Final result]

### 👤 USER WORKFLOW EVIDENCE:
**End-to-End Test:**
1. User Action: [What user does]
2. System Response: [What system does]  
3. Result: [Final outcome user sees]

**Complete Workflow:**
- Step 1: [Detailed step with actual results]
- Step 2: [Detailed step with actual results]
- Step N: [Final verification]

### 🔍 FOUNDATION AUDIT EVIDENCE:
**System Validation:**
- Foundation Audit Command: [Command run]
- Results: [Complete audit output]
- Score: [Actual score achieved]
- Issues Found: [Specific problems identified]

### 📋 EVIDENCE SUMMARY:
- ✅ File Implementation: [VERIFIED/NOT VERIFIED]
- ✅ Functionality Test: [VERIFIED/NOT VERIFIED]  
- ✅ Database Verification: [VERIFIED/NOT VERIFIED]
- ✅ User Experience: [VERIFIED/NOT VERIFIED]
- ✅ Foundation Audit: [VERIFIED/NOT VERIFIED]

### 🎯 FINAL STATUS:
**CLAIM SUPPORTED:** [YES/NO]
**CONFIDENCE LEVEL:** [High/Medium/Low based on evidence]
**READY FOR USER:** [YES/NO - only YES if all evidence provided]
```

---

## **VIOLATION EXAMPLES - NEVER DO THIS:**

### ❌ **BAD EXAMPLE - NO EVIDENCE:**
```
CLAIM: Mexico partnership highlighting is implemented ✅
EVIDENCE: Found files with "Mexico" and "partnership" keywords
STATUS: IMPLEMENTED
```

### ✅ **GOOD EXAMPLE - PROPER EVIDENCE:**
```
CLAIM: Mexico partnership highlighting shows in user interface

FILE IMPLEMENTATION EVIDENCE:
Files Read: components/workflow/WorkflowResults.js (complete file)
Code Analysis: Lines 245-267 show partnership recommendation logic

FUNCTIONALITY TEST EVIDENCE:
API Tested: POST /api/simple-savings with real data
Response: {"nextSteps":["Identify Mexico manufacturing/processing partners"]}
UI Test: Workflow component renders partnership recommendations

DATABASE VERIFICATION EVIDENCE:
Query: SELECT * FROM mexico_partners WHERE active=true
Results: 3 active partners found with contact details

USER WORKFLOW EVIDENCE:
1. User completes workflow → 2. System shows Mexico partners → 3. User sees contact info

FOUNDATION AUDIT EVIDENCE:
Command: node comprehensive-system-validator.js
Results: Partnership feature scored 95% functionality

STATUS: VERIFIED WITH COMPLETE EVIDENCE
```

---

## **ENFORCEMENT CHECKLIST:**

Before making any claim, agent must verify:

- [ ] Used Read tool on complete file implementations
- [ ] Tested actual API endpoints with real requests
- [ ] Queried database tables to confirm data exists  
- [ ] Tested complete user workflows end-to-end
- [ ] Ran foundation audit to validate system state
- [ ] Documented all evidence in required format
- [ ] Can prove claim with concrete examples

**IF ANY CHECKBOX UNCHECKED → CLAIM REJECTED → RESTART VERIFICATION**

---

## **TEMPLATE USAGE:**

1. Copy template for each claim
2. Fill in ALL sections with real evidence
3. Test everything before claiming implementation
4. Show work, don't just state conclusions
5. Provide concrete proof for every statement

**NO SHORTCUTS. NO ASSUMPTIONS. NO EXCEPTIONS.**