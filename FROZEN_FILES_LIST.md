# Frozen Files List - Production Locked

**Last Updated**: November 10, 2025
**Status**: All files below are FROZEN - no modifications allowed without owner approval

---

## 🔒 Critical API Endpoints (13 files)

### Tariff Analysis & Classification
```
pages/api/ai-usmca-complete-analysis.js          (600+ lines)
pages/api/agents/classification.js                (300+ lines)
pages/api/generate-personalized-alerts.js         (100+ lines)
pages/api/generate-portfolio-briefing.js          (400+ lines)
pages/api/executive-trade-alert.js                (400+ lines)
```

**Why frozen**: Core tariff calculation engine. Changes affect financial accuracy for all users.

### Workflow & Session Management
```
pages/api/workflow-session.js                     (500+ lines)
pages/api/workflow-session/update-certificate.js  (200+ lines)
pages/api/check-usage-limit.js                    (150+ lines)
```

**Why frozen**: Manages user workflow state and session persistence. Changes break in-progress workflows.

### Authentication
```
pages/api/auth/login.js                           (200+ lines)
pages/api/auth/register.js                        (250+ lines)
pages/api/auth/logout.js                          (100+ lines)
pages/api/auth/me.js                              (150+ lines)
```

**Why frozen**: Security-critical. Changes require penetration testing and session invalidation.

### Payment Processing
```
pages/api/stripe/webhook.js                       (400+ lines)
```

**Why frozen**: Handles real money. Any bug = financial loss or revenue leakage.

---

## 🤖 AI Agents & Business Logic (6 files)

### Core Agents
```
lib/agents/base-agent.js                          (250+ lines)
lib/agents/classification-agent.js                (300+ lines)
```

**Why frozen**: 2-tier AI fallback system (OpenRouter → Anthropic). Changes affect all AI calls.

### USMCA Calculation Engines
```
lib/usmca/qualification-engine.js                 (600+ lines)
lib/tariff/volatility-manager.js                  (200+ lines)
lib/services/industry-thresholds-service.js       (150+ lines)
lib/services/usitc-api-service.js                 (300+ lines)
```

**Why frozen**: Core business logic for USMCA qualification, RVC calculations, tariff rate lookups. Changes affect legal compliance.

---

## ⚙️ Configuration & Middleware (5 files)

### Subscription System
```
config/subscription-tier-limits.js                (80 lines)
lib/middleware/subscription-guard.js              (150 lines)
lib/hooks/useSubscriptionLimit.js                 (120 lines)
```

**Why frozen**: Centralized subscription enforcement. Changes affect revenue and tier limits.

### Security
```
lib/middleware/auth-middleware.js                 (200 lines)
```

**Why frozen**: Authentication middleware. Security-critical.

---

## 🏗️ Build & Deployment (2 files)

```
next.config.js                                    (50 lines)
vercel.json                                       (30 lines)
```

**Why frozen**: Production deployment configuration. Changes break build process or expose secrets.

---

## 🗄️ Database Schema (FROZEN)

### No migrations allowed for these tables:

**Active Tables** (8 tables):
```
auth.users                   - User accounts (14 real users)
user_profiles                - User metadata (14 records)
workflow_sessions            - In-progress workflows (194 records)
workflow_completions         - Completed certificates (20 records)
tariff_intelligence_master   - HS codes + tariff rates (12,118 codes)
policy_tariffs_cache         - Section 301/232 rates (372 codes)
invoices                     - Payment records
crisis_alerts                - Real policy alerts
```

**Why frozen**: Contains production data. Schema changes require migration of real user data.

**Forbidden Operations**:
- ❌ ALTER TABLE
- ❌ DROP TABLE
- ❌ CREATE TABLE
- ❌ ADD COLUMN
- ❌ DROP COLUMN
- ❌ RENAME COLUMN
- ❌ Change indexes
- ❌ Change foreign keys
- ❌ Change constraints

---

## 🎨 UI Components (Partial Freeze)

### Frozen Logic, Allowed Styling

These files can be modified for **CSS/layout ONLY**:

```
pages/usmca-workflow.js
pages/trade-risk-alternatives.js
pages/pricing.js
components/workflow/CompanyInformationStep.js
components/workflow/ComponentOriginsStepEnhanced.js
components/workflow/ResultsStep.js
```

**What's frozen**: All JavaScript logic (state management, API calls, data transformations)
**What's allowed**: CSS classes, JSX structure for layout, display text, accessibility attributes

---

## 📋 Frozen File Count Summary

| Category | Count | Status |
|----------|-------|--------|
| API Endpoints | 13 | 🔒 Completely frozen |
| AI Agents & Logic | 6 | 🔒 Completely frozen |
| Config & Middleware | 5 | 🔒 Completely frozen |
| Build Config | 2 | 🔒 Completely frozen |
| Database Tables | 8 | 🔒 Schema frozen |
| UI Components | ~10 | ⚠️ Logic frozen, styling allowed |
| **Total Critical Files** | **26+** | **Production locked** |

---

## 🚨 What Happens If You Modify Frozen Files

### Pre-Commit Hook Will Block:

```bash
$ git commit -m "fix: update tariff calculation"

🔍 Checking for secrets before commit...
✅ No secrets detected.
🔒 Running PROJECT LOCKDOWN check...
❌ ERROR: Attempting to modify FROZEN production file: pages/api/ai-usmca-complete-analysis.js

🚫 COMMIT BLOCKED: Frozen production files cannot be modified
📖 See PROJECT_LOCKDOWN.md for details

These files are production-tested and working perfectly.
UI-only changes are allowed. API/logic changes require owner approval.
```

### Manual Override (NOT RECOMMENDED):

```bash
git commit --no-verify -m "dangerous change"
```

**Consequences**:
- 🚨 Risk breaking production for 14 real users
- 🚨 Risk breaking 194 in-progress workflows
- 🚨 Risk corrupting 20 completed certificates
- 🚨 Risk breaking payment processing (money at stake)
- 🚨 Risk breaking authentication (security breach)
- 🚨 Owner will revert your commit

---

## ✅ What You CAN Modify

### Safe Files (No Pre-Commit Block):

1. **CSS Files**
   - `styles/globals.css` - All changes allowed
   - Any other `.css` files

2. **Documentation**
   - `README.md`
   - `CLAUDE.md`
   - `PROJECT_LOCKDOWN.md`
   - `UI_CHANGE_GUIDE.md`
   - Any `.md` files

3. **UI Components (Styling Only)**
   - See UI_CHANGE_GUIDE.md for detailed rules
   - CSS classes, layout, display text OK
   - State management, API calls, calculations NOT OK

4. **Test Files**
   - Any file in `__tests__/` or `*.test.js`
   - Test scripts (e.g., `test-*.js`)

---

## 📞 Request Modification Approval

**If you need to modify a frozen file, submit this request:**

```
MODIFICATION REQUEST

File: [filename]
Type: [API/Logic/Database/Config]
Reason: [why this change is needed]
Risk: [what could break]
Testing Plan: [how will you verify it's safe]
Rollback Plan: [how to undo if it breaks]

Affected Users: [how many users impacted]
Affected Workflows: [how many workflows affected]
Revenue Impact: [does this affect payments?]
```

**Owner will approve or reject within 24 hours.**

---

## 🔍 How to Check If File is Frozen

### Method 1: Pre-Commit Hook Test
```bash
# Make a small change to the file
echo "// test" >> pages/api/ai-usmca-complete-analysis.js

# Try to commit
git add .
git commit -m "test"

# If frozen, hook will block with error message
# Undo the test
git reset HEAD
git checkout -- pages/api/ai-usmca-complete-analysis.js
```

### Method 2: Check This List
- If file is listed above → Frozen
- If file is NOT listed → Probably safe (but verify with PROJECT_LOCKDOWN.md)

### Method 3: Ask Owner
When in doubt, ask before modifying.

---

## 📊 Frozen vs Safe Files

**Frozen (26 files)**:
- API endpoints (13)
- AI agents (6)
- Config/middleware (5)
- Build config (2)
- UI component logic (in 10+ files)

**Safe to Modify**:
- CSS files (unlimited)
- Documentation (unlimited)
- UI styling (10+ component files, styling only)
- Test files (unlimited)

**Ratio: ~26 frozen files protecting 14 users + 214 workflows + payment processing**

---

## 🎯 Frozen Files Protection Levels

### Level 1: Critical (13 files)
**Changes = High Risk of Production Outage**
- All API endpoints
- Payment webhook
- Authentication

**Testing Required Before Approval**:
- Manual testing with real user accounts
- Regression testing of all 4 critical user journeys
- Payment flow verification
- Security audit

### Level 2: Important (6 files)
**Changes = Medium Risk of Calculation Errors**
- AI agents
- USMCA logic
- Tariff calculations

**Testing Required Before Approval**:
- Unit tests for all calculations
- Comparison with existing results
- Financial accuracy verification

### Level 3: Configuration (5 files)
**Changes = Medium Risk of Build/Deploy Issues**
- Subscription limits
- Middleware
- Build config

**Testing Required Before Approval**:
- Local build verification
- Staging deployment test
- Subscription tier testing

---

**Remember: These files are frozen because they work perfectly. Protect production stability.**

**Priority: Production stability > New features > UI polish**
