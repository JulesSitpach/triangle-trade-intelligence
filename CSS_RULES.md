# CSS Rules - MANDATORY FOR ALL AGENTS

**Last Updated:** November 20, 2025
**Status:** ✅ Cleanup complete - 143 unused classes removed (16.81 KB saved)

---

## ❌ FORBIDDEN: Inline Styles

**Rule:** DO NOT use `style={{}}` objects in React components.

**Why:** Previous agents created 31% bloat (143 unused CSS classes) by constantly adding inline styles and then adding more CSS classes that also went unused.

**Correct approach:**
```javascript
// ✅ CORRECT: Use existing CSS classes
<div className="alert alert-warning">
  <div className="alert-title">Warning</div>
  <p className="alert-text">Message here</p>
</div>

// ❌ WRONG: Inline styles
<div style={{ padding: '1rem', backgroundColor: '#fef2f2' }}>
  <div style={{ fontWeight: 600 }}>Warning</div>
  <p style={{ color: '#991b1b' }}>Message here</p>
</div>
```

---

## 📋 Available CSS Classes (335 classes)

**Check before creating new CSS:** Run `node scripts/check-unused-css.js` to see what exists.

### Common Classes You Should Use:

#### Alerts & Status
- `.alert`, `.alert-warning`, `.alert-success`, `.alert-info`
- `.status-badge`, `.status-badge.success`, `.status-badge.warning`
- `.status-error`, `.status-warning`, `.status-info`

#### Buttons
- `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`
- `.btn-sm`, `.btn-lg`, `.btn-link`
- `.btn-ai-suggestion`

#### Tables
- `.table-header`, `.table-row`, `.table-cell`
- `.table-row:hover` (built-in hover state)

#### Cards & Content
- `.content-card`, `.content-card-title`, `.content-card-description`
- `.content-card.classification`, `.content-card.analysis`, `.content-card.certificates`

#### Typography
- `.text-sm`, `.text-base`, `.text-lg`, `.text-xl`
- `.font-medium`, `.font-bold`
- `.text-center`, `.text-right`, `.text-left`
- `.text-blue`, `.text-gray-600`, `.text-gray-700`

#### Spacing
- `.mb-1`, `.mb-2`, `.mb-4`, `.mb-6`, `.mb-8`
- `.p-4` (padding utilities)

#### Layout
- `.relative`, `.absolute`
- `.bg-gray-50`

---

## ⚠️ ONLY 2 EXCEPTIONS (Documented)

These files are allowed to use inline styles (production code, highly customized):

1. **components/workflow/results/USMCAQualification.js** (~500 lines inline styles)
   - Tooltip positioning, collapsible sections, Section 301/232 color-coded warnings

2. **components/workflow/results/TariffSavings.js** (~200 lines inline styles)
   - Financial boxes (green/red/amber), component breakdowns

**All other components MUST use globals.css classes.**

---

## 🚨 How to Check Compliance

Before committing code with styling:

```bash
# Check if you're using existing classes
node scripts/check-unused-css.js

# If you added new CSS classes, verify they're not duplicates
grep "\.your-new-class" styles/globals.css
```

---

## 📊 Maintenance Scripts

**Check for unused CSS:**
```bash
node scripts/check-unused-css.js
```
Output: Shows which CSS classes exist but are never used in .js/.jsx files.

**Remove unused CSS:**
```bash
node scripts/remove-unused-css.js
# Creates styles/globals-cleaned.css for review
# Manually inspect, then: mv styles/globals-cleaned.css styles/globals.css
```

---

## 🎯 What To Do Instead

**Agent asks:** "Should I add inline styles for this alert?"
**Answer:** NO. Use `.alert` and `.alert-warning` classes.

**Agent asks:** "Should I create a new CSS class for this button?"
**Answer:** Check if `.btn-primary`, `.btn-secondary`, or `.btn-success` fits first.

**Agent asks:** "This component needs specific styling..."
**Answer:** Only if it's as complex as the 2 documented exceptions. Otherwise, compose existing classes.

---

## ✅ Success Metrics

- **Before cleanup:** 486 CSS classes, 104.54 KB
- **After cleanup:** 335 CSS classes (31% reduction), 87.73 KB (16% smaller)
- **Inline styles:** Only 2 files (documented exceptions), all others use CSS classes

**Future agents: Keep it this way. Don't undo the cleanup.**
