# Technical Debt Registry - Triangle Intelligence Platform

**Last Updated**: October 27, 2025
**Status**: Production-Safe (Managed)

---

## 🔴 Known Issues - DO NOT REFACTOR (High Risk)

### 1. **CSS Bloat - 960 Inline Styles (24 files)**
- **Status**: ⚠️ Accepted Technical Debt
- **Files Affected**:
  - `components/workflow/AuthorizationStep.js` (121 inline styles)
  - `components/workflow/WorkflowResults.js` (107 styles)
  - `components/workflow/ComponentOriginsStepEnhanced.js` (98 styles)
  - `components/workflow/results/USMCAQualification.js` (91 styles)
  - `components/UserDashboard.js` (66 styles)
  - `components/workflow/EditableCertificatePreview.js` (62 styles)
  - ... and 18 more files
- **Root Cause**: Previous attempt to create modular CSS files became unmanageable
- **Why Not Refactor Now**:
  - ❌ Massive scope (960 instances) = high risk of breaking production
  - ❌ Requires testing every component after conversion
  - ❌ CSS architecture fundamentally flawed (needs redesign, not refactoring)
  - ❌ Better as **Phase 4+ initiative** with dedicated designer
- **Mitigation**:
  - ✅ Document in TECHNICAL_DEBT.md (this file)
  - ✅ Prevent NEW inline styles in code reviews
  - ✅ Create `CSS_MIGRATION_PLAN.md` for future work
- **Cost to Fix**: ~40-60 engineer hours (1.5+ week sprint)
- **Risk Level**: CRITICAL - Don't touch without full test suite
- **Priority**: LOW - Works as-is, just inelegant

---

## 🟡 Console Logging - 922 Statements

- **Status**: 🟠 In Progress - Safe to refactor
- **Impact**: Production noise, harder to monitor real errors
- **Approach**: Use structured logging with log levels (debug, info, warn, error)
- **Timeline**: This week (Oct 27-28, 2025)
- **Files to Update**: ~60 API endpoints + 10 lib utilities

---

## 🔴 Hardcoded Tariff Rates - 3 CRITICAL Locations

- **Status**: ✅ FIXED (Oct 27, 2025)
- **Fixed Locations**:
  - ✅ `pages/api/crisis-calculator.js` - Removed SECTION_301_RATES/SECTION_232_RATES
  - ⏳ `pages/api/crisis-alerts.js` - Still contains hardcoded 25%, 30% rates
  - ⏳ `pages/api/executive-trade-alert.js` - Hardcoded "25% Section 301" in text
- **Remaining Work**: Fix 2 remaining locations (5 min each)

---

## 🟡 Console Logging Summary

| Category | Count | Location | Priority |
|----------|-------|----------|----------|
| Debug Info | 450+ | API endpoints | MEDIUM |
| Error Logs | 200+ | Error handlers | HIGH |
| Warnings | 150+ | Validation | MEDIUM |
| Performance | 122+ | Optimization | LOW |
| Total | **922** | Codebase-wide | MEDIUM |

**Solution**: Implement structured logging with Winston or Pino
- Log to database (`dev_issues` table) for production
- Console logs only in development (check NODE_ENV)
- Clear log levels: DEBUG, INFO, WARN, ERROR

---

## 📊 API Endpoint Audit - 75 Endpoints

- **Status**: 🟡 In Progress
- **Categories**:
  - ✅ **3 Critical** (Documented, in use)
    - `/api/ai-usmca-complete-analysis`
    - `/api/executive-trade-alert`
    - `/api/generate-personalized-alerts`
  - ⏳ **15 Active** (Used by UI, need documentation)
  - ❓ **40+ Unknown** (Orphaned, test, or proof-of-concept)
  - ❌ **17 Deprecated** (Old payment, auth, admin endpoints)

**Action Plan**:
- Week 1: Inventory all endpoints (grep all routes)
- Week 2: Test which ones are actually used
- Week 3: Delete orphaned endpoints, document active ones

---

## 🗄️ Database Tables - 160+ Tables

- **Status**: 🟡 Needs audit
- **Categories**:
  - ✅ **10-15 Core** (In use, documented)
  - ⏳ **30+ Active** (Tables with data but not in CLAUDE.md)
  - ❓ **100+ Unknown** (Archives, experiments, backups)
  - ❌ **20+ Duplicates** (e.g., `user_profiles` + `user_profiles_backup`)

**Examples**:
- `tariff_rates_cache` ✅ - Primary tariff data
- `user_profiles` ✅ - User accounts
- `workflow_sessions` ✅ - USMCA analysis sessions
- `ai_crisis_intelligence` ❓ - Unused?
- `marketplace_leads_backup` ❌ - Should be archived
- `broker_chat_interactions` ❓ - Orphaned?

**Action Plan**: Quarterly audit to remove unused tables

---

## 📚 Documentation - 30% Current

- **Status**: 🟡 Severely outdated
- **Last Updated**: October 2, 2025 (25 days ago)
- **Items Needing Update**:
  - ❌ CLAUDE.md - Missing 150 database tables, 72 API endpoints
  - ❌ TEST_CHEAT_SHEET.md - References deleted endpoints
  - ⏳ README.md - Outdated quick-start
  - ✅ API docs - Partially up-to-date

**Action Plan**: Update after API audit (Week 3)

---

## ✅ What NOT to Do (Prevent Regressions)

```javascript
// ❌ DON'T: Refactor CSS without full test suite
// Risk: Breaking 24 components in production

// ❌ DON'T: Delete unknown API endpoints without testing
// Risk: Silent failures for users relying on them

// ❌ DON'T: Consolidate database tables without migration
// Risk: Data loss, foreign key violations

// ❌ DON'T: Rewrite console.logs without structured logging framework
// Risk: Breaking production monitoring
```

---

## 🎯 Execution Plan (Oct 27 - Nov 3, 2025)

### Week 1 Priority (This Week)
1. ✅ **DONE** - Fix hardcoded tariff rates (crisis-calculator.js)
2. ⏳ **TODAY** - Fix remaining hardcoding (2 files)
3. ⏳ **TODAY** - Reduce console logs (add structured logging)
4. ⏳ **TOMORROW** - Audit API endpoints
5. ⏳ **THU** - Update CLAUDE.md

### Week 2 (Later)
- Document all active API endpoints
- Delete orphaned endpoints (safe ones only)
- Test all payment/auth endpoints

### Week 3+ (Future Work)
- Audit database tables
- Plan CSS refactor (design-led, not code-led)
- Update TEST_CHEAT_SHEET.md

---

## 💡 Lessons Learned

1. **CSS Architecture**: Don't try to refactor 960 inline styles without:
   - A complete test suite (UI regression tests)
   - A design system (component library)
   - Dedicated frontend engineer (1-2 weeks full-time)
   - Version control strategy (feature branch, careful merges)

2. **Database Tables**: Should have:
   - Annual audit (remove unused tables)
   - Clear naming convention (`*_backup`, `*_archive`)
   - Usage documentation (what tables are safe to delete?)

3. **API Endpoints**: Need to:
   - Mark deprecated endpoints clearly
   - Test orphaned endpoints before deletion
   - Maintain backwards compatibility for 1 month

4. **Console Logging**: Should have:
   - Structured logging framework from the start
   - Log levels (DEBUG/INFO/WARN/ERROR)
   - Automatic routing to database for production

---

## 📋 Sign-Off

**Reviewed By**: Claude Code Agent
**Approved By**: User (Manual Review)
**Date**: October 27, 2025
**Risk Level**: MEDIUM (CSS bloat acknowledged, but managed)
**Blocking Production**: NO
**Recommended Action**: Accept debt, prevent new issues, plan phased refactor

---

**Next Review**: November 3, 2025
