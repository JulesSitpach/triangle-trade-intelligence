# 🔒 PROJECT LOCKDOWN - NO BREAKING CHANGES ALLOWED

**Status**: PRODUCTION LOCKED (November 10, 2025)
**Owner Decision**: "For me it's perfect" - Mac
**Policy**: UI-only changes permitted. ALL other changes require explicit owner approval.

---

## 🚫 ABSOLUTELY FORBIDDEN (Will Break Production)

### 1. API Endpoint Changes
**DO NOT modify these files under ANY circumstances:**

```
pages/api/ai-usmca-complete-analysis.js          ❌ FROZEN (tariff analysis engine)
pages/api/executive-trade-alert.js               ❌ FROZEN (policy advisor)
pages/api/generate-portfolio-briefing.js         ❌ FROZEN (portfolio system)
pages/api/generate-personalized-alerts.js        ❌ FROZEN (alert filtering)
pages/api/agents/classification.js               ❌ FROZEN (HS code classification)
pages/api/workflow-session.js                    ❌ FROZEN (session persistence)
pages/api/workflow-session/update-certificate.js ❌ FROZEN (certificate updates)
pages/api/auth/*                                 ❌ FROZEN (authentication)
pages/api/stripe/webhook.js                      ❌ FROZEN (payment processing)
pages/api/check-usage-limit.js                   ❌ FROZEN (subscription enforcement)
```

**Reason**: These endpoints are production-tested and working. Any change risks breaking:
- Tariff calculations (users rely on accuracy)
- Certificate generation (legal compliance documents)
- Payment processing (money at stake)
- Authentication (security risk)

### 2. Database Schema Changes
**DO NOT modify:**

```
No ALTER TABLE statements
No DROP TABLE statements
No column renames
No new migrations
No index changes
No foreign key modifications
```

**Current schema is FROZEN** (30+ tables, 8 actively used)

**Reason**: Schema changes require:
- Testing across 14 real user accounts
- Validation of 194 in-progress workflows
- Migration of 20 completed certificates
- Risk of data loss or corruption

### 3. Core Business Logic
**DO NOT modify these files:**

```
lib/agents/base-agent.js                  ❌ FROZEN (2-tier AI fallback)
lib/agents/classification-agent.js        ❌ FROZEN (HS code classification)
lib/usmca/qualification-engine.js         ❌ FROZEN (USMCA analysis prompt)
lib/tariff/volatility-manager.js          ❌ FROZEN (volatility tiers)
lib/services/usitc-api-service.js         ❌ FROZEN (USITC integration)
lib/services/industry-thresholds-service.js ❌ FROZEN (RVC thresholds)
config/subscription-tier-limits.js        ❌ FROZEN (tier limits - centralized)
lib/middleware/subscription-guard.js      ❌ FROZEN (subscription enforcement)
lib/hooks/useSubscriptionLimit.js         ❌ FROZEN (React subscription hook)
```

**Reason**: These are the calculation engines. Changes here affect:
- Financial accuracy (users make business decisions on this)
- Compliance calculations (legal implications)
- Subscription billing (revenue at stake)

### 4. Environment Configuration
**DO NOT modify:**

```
.env                    ❌ FROZEN (production secrets)
.env.local              ❌ FROZEN (local secrets)
next.config.js          ❌ FROZEN (build configuration)
vercel.json             ❌ FROZEN (deployment config)
package.json            ⚠️  NO dependency version changes
```

**Reason**: Configuration changes can:
- Break production deployment
- Expose API keys
- Break build process
- Introduce incompatible dependencies

### 5. Authentication & Security
**DO NOT modify:**

```
pages/api/auth/*                    ❌ FROZEN
lib/middleware/auth-middleware.js   ❌ FROZEN
JWT token signing logic             ❌ FROZEN
Supabase client initialization      ❌ FROZEN
```

**Reason**: Security changes require:
- Penetration testing
- Session invalidation for all users
- Potential data breach risk

### 6. Payment Processing
**DO NOT modify:**

```
pages/api/stripe/webhook.js    ❌ FROZEN
Invoice creation logic         ❌ FROZEN
Subscription tier checks       ❌ FROZEN (use centralized config only)
```

**Reason**: Payment bugs = money problems. Period.

---

## ✅ ALLOWED CHANGES (UI-Only)

### Safe UI Improvements

**You MAY modify these for styling ONLY:**

```
✅ styles/globals.css                    (CSS classes only, no JavaScript)
✅ components/workflow/*.js              (UI components - NO API calls, NO state changes)
✅ components/ui/*.js                    (Pure UI components)
✅ pages/usmca-workflow.js               (Layout/styling ONLY - NO workflow logic)
✅ pages/trade-risk-alternatives.js      (Display ONLY - NO alert logic)
✅ pages/pricing.js                      (Display ONLY - NO tier logic)
```

### Approved UI Changes:

1. **CSS Styling**
   - ✅ Color changes (btn-primary, form-section-title, etc.)
   - ✅ Font sizes, weights, families
   - ✅ Spacing (padding, margin)
   - ✅ Responsive breakpoints
   - ✅ Animations and transitions
   - ❌ NO inline styles (continue using CSS classes)
   - ❌ NO Tailwind CSS (conflicts with existing CSS)

2. **Component Layout**
   - ✅ Rearrange UI elements (buttons, tables, cards)
   - ✅ Add loading spinners
   - ✅ Add tooltips, help text
   - ✅ Improve form labels
   - ✅ Add icons
   - ❌ NO changing data flow
   - ❌ NO changing API calls
   - ❌ NO changing state management

3. **Text Content**
   - ✅ Copy changes (button labels, headings, descriptions)
   - ✅ Error messages (display only)
   - ✅ Help text, tooltips
   - ✅ Placeholder text
   - ❌ NO changing validation messages that affect logic

4. **Accessibility**
   - ✅ ARIA labels
   - ✅ Keyboard navigation
   - ✅ Screen reader improvements
   - ✅ Focus indicators

### UI Change Checklist:

Before making ANY change, answer these:

- [ ] Does this change modify an API endpoint? → ❌ FORBIDDEN
- [ ] Does this change database queries? → ❌ FORBIDDEN
- [ ] Does this change calculation logic? → ❌ FORBIDDEN
- [ ] Does this change authentication? → ❌ FORBIDDEN
- [ ] Does this change payment processing? → ❌ FORBIDDEN
- [ ] Is this ONLY CSS/HTML/display text? → ✅ ALLOWED
- [ ] Does this affect how data is stored? → ❌ FORBIDDEN
- [ ] Does this affect how data is retrieved? → ❌ FORBIDDEN

**If you answered ❌ to any question above, STOP and ask owner for approval.**

---

## 🛡️ Protection Mechanisms

### 1. Agent Instructions

**For ALL AI agents (Claude Code, etc.):**

```
CRITICAL LOCKDOWN RULES:

1. READ PROJECT_LOCKDOWN.md BEFORE any code changes
2. If change is NOT in "Allowed Changes" section → ASK OWNER FIRST
3. NEVER modify files marked ❌ FROZEN
4. Test ALL changes in dev environment first (port 3001)
5. If unsure whether change is safe → ASK OWNER FIRST

Default answer to "should I modify this?" is NO unless explicitly allowed.
```

### 2. Git Pre-Commit Hook (Optional)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Frozen files list
FROZEN_FILES=(
  "pages/api/ai-usmca-complete-analysis.js"
  "pages/api/executive-trade-alert.js"
  "pages/api/generate-portfolio-briefing.js"
  "lib/agents/base-agent.js"
  "config/subscription-tier-limits.js"
  # ... add all frozen files
)

# Check if any frozen files are being modified
for file in "${FROZEN_FILES[@]}"; do
  if git diff --cached --name-only | grep -q "^$file$"; then
    echo "❌ ERROR: Attempting to modify FROZEN file: $file"
    echo "This file is production-locked. See PROJECT_LOCKDOWN.md"
    exit 1
  fi
done

exit 0
```

### 3. Review Checklist Template

**Use this for every commit:**

```
## Change Review Checklist

### Files Modified:
- [ ] List all modified files

### Change Type:
- [ ] CSS styling only
- [ ] HTML/JSX layout only
- [ ] Display text only
- [ ] Other (REQUIRES OWNER APPROVAL)

### Testing:
- [ ] Tested in dev environment (port 3001)
- [ ] No console errors
- [ ] No API changes
- [ ] No database changes
- [ ] No calculation logic changes

### Approval:
- [ ] Owner approved (if not UI-only)
- [ ] Safe to deploy

**If ANY checkbox is unchecked, DO NOT COMMIT.**
```

---

## 📋 Quick Reference

### ❌ NEVER Touch:
- API endpoints (pages/api/*)
- Database migrations
- Core business logic (lib/agents/*, lib/usmca/*, lib/tariff/*)
- Authentication (pages/api/auth/*)
- Payment processing (pages/api/stripe/*)
- Configuration files (.env, next.config.js, vercel.json)
- Subscription enforcement (config/subscription-tier-limits.js, lib/middleware/*, lib/hooks/*)

### ✅ Safe to Modify:
- CSS files (styles/globals.css)
- UI component styling (components/*/styling only)
- Display text (labels, headings, help text)
- Layout (positioning, spacing)
- Accessibility features (ARIA, keyboard nav)

### ⚠️ Ask First:
- Anything not clearly in "Safe to Modify" list
- Adding new npm packages
- Changing component structure
- Adding new pages
- Changing routing

---

## 🚨 Emergency Procedures

### If Something Breaks:

1. **Immediately revert the change:**
   ```bash
   git revert HEAD
   git push
   ```

2. **Check production:**
   - Visit https://triangle-trade-intelligence.vercel.app
   - Test login
   - Test workflow (Company → Components → Results)
   - Verify alerts page loads

3. **Notify owner:**
   - Describe what broke
   - What change caused it
   - Current status (reverted? still broken?)

4. **Don't try to fix forward:**
   - Revert first, debug later
   - Production stability > fixing quickly

### If Unsure About a Change:

**Default answer: NO**

Ask owner with this format:
```
Change Request:
- File: [filename]
- Type: [CSS/Layout/Logic/API/Database]
- Reason: [why this change is needed]
- Risk: [what could break]
- Testing: [how will you verify it's safe]

Is this approved?
```

---

## 📊 What's Working (Don't Break This)

### Critical User Journeys:

1. **USMCA Workflow** (FROZEN)
   - User visits /usmca-workflow
   - Step 1: Company info + destination
   - Step 2: Component origins
   - Step 3: Results + tariff analysis
   - Download PDF certificate
   - **Status**: Working perfectly, LOCKED

2. **Alerts Dashboard** (FROZEN)
   - User visits /trade-risk-alternatives
   - Sees portfolio briefing
   - Sees component-level alerts
   - Matches Section 301/232 policies
   - **Status**: Working perfectly, LOCKED

3. **Payment Flow** (FROZEN)
   - User selects plan on /pricing
   - Stripe checkout
   - Webhook updates subscription
   - Usage limits enforced (3-layer system)
   - **Status**: Working perfectly, LOCKED

4. **Authentication** (FROZEN)
   - Login/register
   - Session persistence
   - JWT token signing
   - **Status**: Working perfectly, LOCKED

### Key Numbers (Don't Regress):

- ✅ 14 real users (test accounts)
- ✅ 194 in-progress workflows
- ✅ 20 completed certificates
- ✅ 12,118 HS codes in database
- ✅ 372 Section 301/232 rates cached
- ✅ <500ms typical API response
- ✅ <3s worst-case AI fallback
- ✅ $0.02-$0.04 per AI request (cost-effective)
- ✅ 3-layer subscription enforcement (page → component → API)
- ✅ Centralized subscription config (single source of truth)

**These metrics must NOT degrade after any UI change.**

---

## 🎯 Owner's Vision

**"For me it's perfect"** - Mac, November 10, 2025

This platform is production-ready and generating accurate USMCA certificates. The core functionality is FROZEN to protect:

1. **User Trust**: Tariff calculations are accurate
2. **Legal Compliance**: Certificates meet CBP requirements
3. **Financial Accuracy**: Savings calculations are reliable
4. **Business Revenue**: Payment processing works
5. **Data Integrity**: 194 workflows + 20 certificates safe

**UI improvements are welcome. Everything else requires owner approval.**

---

## 📞 Escalation Path

**For UI changes:**
- Make change
- Test locally (port 3001)
- Commit with clear message
- Push (auto-deploys to Vercel)
- Verify in production

**For everything else:**
1. Read PROJECT_LOCKDOWN.md
2. Confirm change is NOT in forbidden list
3. Ask owner with detailed change request
4. Wait for explicit approval
5. Only then proceed

**When in doubt, ask. When still in doubt, don't do it.**

---

## ✅ Success Criteria

**UI change was successful if:**
- [ ] No console errors
- [ ] All 4 critical user journeys still work
- [ ] No API response time regression
- [ ] No database errors
- [ ] No authentication issues
- [ ] No payment processing issues
- [ ] Owner approves the visual change

**If ANY of these fail, revert immediately.**

---

**This lockdown is effective immediately (November 10, 2025) and remains in effect until owner explicitly removes it.**

**Priority: Production stability > New features > UI polish**
