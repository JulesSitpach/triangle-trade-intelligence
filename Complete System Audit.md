# TASK: Complete System Audit & User Journey Validation

## YOUR ROLE
Act as a senior QA engineer who needs to understand and validate the ENTIRE user experience from signup through analysis, alerts setup, and certificate generation.

---

## PHASE 1 - MAP THE SYSTEM (45 minutes)

### 1.1 Document Complete User Flows

**PRIMARY FLOW:**
```
Signup → Dashboard → Run USMCA Analysis → View Results → 
Privacy Consent Decision → Save Data → Generate Certificate (if qualified)
```

**ALERTS FLOW:**
```
Dashboard → Alerts Setup → Configure Monitoring → 
View Active Alerts → Alert Details → Related Workflow → Take Action
```

**WORKFLOWS MANAGEMENT:**
```
Dashboard → View All Workflows → Select Workflow (dropdown) → 
Preview Details → Contextual Actions (based on qualification status)
```

### 1.2 Trace Data Flow Through Every Component

For each flow, document:

**Data Capture Points:**
- What forms/inputs collect data?
- What fields are required vs optional?
- What validation occurs at input time?

**Data Storage:**
- Which database tables? (`workflow_sessions`, `vulnerability_analyses`, `service_requests`)
- What's the schema for each table?
- How are relationships maintained (workflow → alert → certificate)?

**Data Retrieval:**
- Which API endpoints fetch data?
- How are queries structured?
- Are there any joins or aggregations?

**Data Display:**
- Which components render the data?
- How is data formatted for display?
- Are there any transformations between storage and display?

### 1.3 Create Data Flow Diagram (Text Format)

Example:
```
USER INPUT (usmca-workflow.js)
  ↓
VALIDATION (client-side)
  ↓
API CALL (/api/ai-usmca-complete-analysis)
  ↓
AI PROCESSING (OpenRouter/Claude)
  ↓
RESULTS RETURNED
  ↓
PRIVACY CONSENT MODAL (???)
  ↓ (if user consents)
DATABASE SAVE (workflow_sessions)
  ↓
DASHBOARD UPDATE
  ↓
ALERTS GENERATION (if applicable)
  ↓
CERTIFICATE GENERATION (if qualified)
```

---

## PHASE 2 - IDENTIFY ISSUES (90 minutes)

### 2.1 DATA INTEGRITY AUDIT

For each data touchpoint, verify:

**Workflow Analysis Data:**
- [ ] Company name: Captured? Saved? Displayed correctly?
- [ ] Business type: Formatted consistently everywhere?
- [ ] Component data: All fields preserved (origin, percentage, value)?
- [ ] Annual volume: Saved and retrievable?
- [ ] Qualification status: Consistent across all displays?
- [ ] Savings calculations: Persisted accurately?
- [ ] HS codes: No corruption or encoding issues?

**Certificate Data:**
- [ ] Exporter details: Complete and formatted correctly?
- [ ] Importer details: Complete and formatted correctly?
- [ ] Date fields: Parsing correctly? No "Invalid Date"?
- [ ] Tax ID: No character corruption? (`Tax IDl@u487c5%27032` bug)
- [ ] Criterion: Matches qualification method (A/B/C/D)?
- [ ] Certification statement: Complete text, not truncated?

**Alerts Data:**
- [ ] Company name: Real data or "Your Company" placeholder?
- [ ] Annual volume: Real data or "Not specified"?
- [ ] Risk factors: Correctly identified and displayed?
- [ ] Related workflow: Proper linking maintained?
- [ ] Alert status: Active/dismissed states working?

**Cross-Reference Consistency:**
- [ ] Does workflow data match what appears in alerts?
- [ ] Does certificate data match source workflow?
- [ ] Are dropdowns showing all saved workflows?
- [ ] Are counts accurate (X of Y analyses used)?

### 2.2 USER EXPERIENCE AUDIT

**Navigation & Flow:**
- [ ] Can user complete full journey without dead ends?
- [ ] Are all "View All" links working?
- [ ] Do dropdown selections properly update preview boxes?
- [ ] Are contextual buttons appropriate for each state?
- [ ] No broken links or 404 errors?

**Feedback & Clarity:**
- [ ] Is loading state clear during AI analysis?
- [ ] Are success messages displayed after saves?
- [ ] Are error messages helpful and actionable?
- [ ] Is qualification status immediately obvious?
- [ ] Do alerts clearly explain what action is needed?

**Consistency:**
- [ ] Brand name consistent (TradeFlow vs Triangle)?
- [ ] Terminology consistent (workflow vs analysis vs session)?
- [ ] Button labels consistent across pages?
- [ ] Color coding consistent (qualified=green, not qualified=red)?

**Responsive Behavior:**
- [ ] Does UI work on different screen sizes?
- [ ] Are modals properly centered and dismissable?
- [ ] Do dropdowns overflow properly?

### 2.3 PRIVACY & COMPLIANCE AUDIT

**CRITICAL - Privacy Consent:**
- [ ] Is consent requested BEFORE saving any workflow data?
- [ ] Is the modal dismissable or is choice forced?
- [ ] Are the implications of each choice clear?
- [ ] Is "Save" pre-checked as stated in requirements?
- [ ] Does "Don't save" actually prevent database storage?
- [ ] Can user change their mind later?

**Data Management:**
- [ ] Can users view all their saved data?
- [ ] Can users delete their workflows?
- [ ] Can users delete their alerts?
- [ ] Can users export their data?
- [ ] Is there a "delete account" option?

**Security:**
- [ ] Is sensitive data encrypted at rest?
- [ ] Are API endpoints authenticated?
- [ ] Can users only access their own data?
- [ ] Are there any data leaks in logs or errors?

### 2.4 PERFORMANCE & RELIABILITY AUDIT

**API Efficiency:**
- [ ] Are there redundant API calls?
- [ ] Is data being fetched multiple times unnecessarily?
- [ ] Are large datasets paginated?
- [ ] Is there proper error handling on all endpoints?

**State Management:**
- [ ] Does data persist correctly across navigation?
- [ ] Are there race conditions in async operations?
- [ ] Does refresh lose user progress?
- [ ] Are forms properly reset after submission?

**AI Integration:**
- [ ] Does AI call timeout gracefully?
- [ ] Is there retry logic for failed AI calls?
- [ ] Are AI costs being tracked/logged?
- [ ] Is the AI prompt producing consistent results?

### 2.5 ALERTS SYSTEM DEEP DIVE

**Alert Generation:**
- [ ] When/how are alerts created?
- [ ] What triggers an alert vs no alert?
- [ ] Are alerts created at the right time (after consent)?
- [ ] Is alert logic handled by AI or hardcoded?

**Alert Display:**
- [ ] Recent alerts shown on dashboard (how many)?
- [ ] Full alerts page with dropdown working?
- [ ] Preview box showing correct alert details?
- [ ] Expand/collapse UI working consistently?
- [ ] No duplicate text in Financial Impact section?

**Alert Actions:**
- [ ] Can user view related workflow from alert?
- [ ] Can user dismiss alerts?
- [ ] Does dismissing actually remove from active list?
- [ ] Does "Get Help" button work?
- [ ] Are service requests properly created from alerts?

**Alert Data Quality:**
- [ ] Risk severity accurate (High/Medium/Low)?
- [ ] Recommendations actionable and specific?
- [ ] Financial impact calculations correct?
- [ ] Timeline projections reasonable?

### 2.6 SUBSCRIPTION & USAGE TRACKING

**Tier Enforcement:**
- [ ] Is usage counter accurate?
- [ ] Does Starter tier block after 10 analyses?
- [ ] Are Professional/Premium unlimited as stated?
- [ ] Are service discounts applied correctly?

**Dashboard Display:**
- [ ] Progress bar shows correct usage (X of Y)?
- [ ] "Upgrade" prompts appear at right time?
- [ ] Plan name displayed correctly?
- [ ] Monthly reset working?

---

## PHASE 3 - PRIORITIZED FINDINGS REPORT (30 minutes)

### Report Format

For each issue found, document:

```markdown
## [SEVERITY] Issue Title

**What's Broken:**
Clear description of the problem

**Where It's Broken:**
- File: `/path/to/file.js`
- Line: 123 (if applicable)
- Component: ComponentName
- Database: table_name.column_name (if applicable)

**Why It Matters:**
Impact on user experience, compliance, or functionality

**Current Behavior:**
What happens now

**Expected Behavior:**
What should happen

**Suggested Fix:**
High-level approach to resolving it

**Test Case:**
How to reproduce and verify the fix
```

### Severity Definitions

**CRITICAL (P0 - Blocking Launch):**
- Breaks core functionality
- Violates legal/compliance requirements
- Data loss or corruption
- Security vulnerabilities
- Blocks revenue (payment, subscription)

**HIGH (P1 - Should Fix Before Launch):**
- Poor UX causing confusion
- Data inconsistency (placeholders, wrong formatting)
- Broken secondary features
- Incomplete workflows

**MEDIUM (P2 - Fix Soon After Launch):**
- Polish issues
- Minor UX improvements
- Performance optimizations
- Nice-to-have features

**LOW (P3 - Backlog):**
- Edge cases
- Cosmetic issues
- Future enhancements

---

## PHASE 4 - DELIVERABLE

Create a comprehensive markdown document with:

### Executive Summary
- Total issues found by severity
- Top 3 most critical problems
- Overall system health assessment
- Recommended fix order

### Detailed Findings
- All issues organized by severity
- Each following the format above

### Data Flow Documentation
- Complete diagrams from Phase 1
- Any discoveries about how the system actually works
- Discrepancies between intended vs actual behavior

### Testing Recommendations
- Regression tests to add
- Integration tests needed
- User acceptance test scenarios

---

## IMPORTANT CONSTRAINTS

**DO NOT FIX ANYTHING YET**
Your job is to FIND and DOCUMENT issues, not fix them. I need to review your findings first.

**BE THOROUGH BUT EFFICIENT**
- Don't get stuck on one issue for hours
- If you can't figure something out, note it and move on
- Flag areas that need my input or clarification

**FOCUS ON USER IMPACT**
- Prioritize based on what users actually experience
- Technical debt is low priority unless it affects users
- Pretty code doesn't matter; working features do

**USE THE HANDOFF DOC AS YOUR GUIDE**
- The P0/P1 items listed are known issues - verify them
- But also look for issues NOT in the handoff doc
- Cross-check that "completed" items actually work

---

## ESTIMATED TIME: 2-3 hours total

Take your time. This audit will save us from endless bug hunting later.

**BEGIN AUDIT NOW.**