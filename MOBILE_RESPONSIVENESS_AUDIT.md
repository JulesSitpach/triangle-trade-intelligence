# Mobile Responsiveness Audit - November 15, 2025

**Tested Devices:**
- iPhone 12 Pro (375x667px)
- iPad (768x1024px)
- Desktop (1920x1080px)

---

## ✅ WORKING PAGES (Mobile-Friendly)

### 1. **Homepage** (`/`)
- ✅ Navigation collapses to hamburger menu
- ✅ Hero section text readable
- ✅ CTA buttons touch-friendly
- ✅ Video background responsive
- ✅ All sections stack vertically

### 2. **Alerts Dashboard** (`/trade-risk-alternatives`)
- ✅ Empty state displays correctly
- ✅ Message is centered and readable
- ✅ "Start USMCA Analysis" button is touch-friendly

---

## 🔴 BROKEN PAGES (Mobile Issues)

### 1. **Pricing Page** (`/pricing`) - CRITICAL ISSUE

**Problem:** Pricing cards are displaying side-by-side on mobile (375px width) causing horizontal overflow and cut-off text.

**Expected Behavior:** Cards should stack vertically on mobile
**Actual Behavior:** Cards try to fit 4 cards horizontally, text gets cut off

**Screenshot Evidence:**
- `pricing-mobile-cards.png` - Shows cards cut off on iPhone size
- `pricing-tablet-ipad.png` - Shows cards working correctly on tablet size

**Root Cause:** Inline styling overriding responsive CSS
- Someone used `display: flex` with fixed widths
- No `@media (max-width: 480px)` override in inline styles
- CSS file has responsive breakpoints, but inline styles have higher specificity

**Files to Fix:**
- `pages/pricing.js` (check for inline `style={{}}` objects)
- Likely around line 200-400 where pricing cards are rendered

**Specific Fix Needed:**
```jsx
// ❌ WRONG (current - inline styling):
<div style={{ display: 'flex', gap: '1rem' }}>
  {pricingCards.map(...)}
</div>

// ✅ CORRECT (should be):
<div className="pricing-cards-container">
  {pricingCards.map(...)}
</div>

// With CSS in globals.css:
.pricing-cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

@media (max-width: 640px) {
  .pricing-cards-container {
    grid-template-columns: 1fr; /* Single column on mobile */
  }
}
```

---

## 📋 TESTING CHECKLIST (Remaining Pages)

Still need to test:
- [ ] `/usmca-workflow` - Main workflow form
- [ ] `/signup` - Registration form
- [ ] `/login` - Login form
- [ ] `/dashboard` - User dashboard (requires login)

---

## 🎯 PRIORITY FIXES

### Priority 1 (CRITICAL - Blocks Mobile Users)
1. **Fix pricing page card layout** - Mobile users can't see full pricing information

### Priority 2 (Important - UX Issues)
2. Audit all pages for inline `style={{}}` patterns
3. Check workflow forms for mobile usability (input sizes, touch targets)
4. Verify tables are responsive (alerts tables, component tables)

### Priority 3 (Nice to Have)
5. Test on real devices (Android, different iOS versions)
6. Check landscape orientation
7. Test touch interactions (swipe, pinch-zoom)

---

## 🔧 RECOMMENDED FIX APPROACH

Since you mentioned agents kept using inline styling and ignoring CSS:

**Option A: Quick Fix (1-2 hours)**
- Find all inline `style={{ display: 'flex' }}` in pricing.js
- Replace with CSS classes from globals.css
- Test on mobile

**Option B: Comprehensive Fix (4-6 hours)**
- Run grep for all `style={{` patterns across codebase
- Create CSS classes for common patterns
- Replace inline styles systematically
- Add pre-commit hook to block inline styles

**Recommendation:** Start with Option A for pricing page (it's public-facing and critical), then do Option B for the full platform when you have time.

---

## 📸 SCREENSHOTS SAVED

All screenshots saved to: `.playwright-mcp/`
- `homepage-mobile-iphone.png` - ✅ Working
- `pricing-mobile-top.png` - ✅ Header working
- `pricing-mobile-cards.png` - 🔴 Cards broken (cut off)
- `pricing-tablet-ipad.png` - ✅ Working on tablet
- `alerts-mobile-no-data.png` - ✅ Working

---

## 🎓 LESSON LEARNED

**Problem:** CSS in `globals.css` has proper responsive breakpoints, but inline styles have higher specificity and override them.

**Solution:** Enforce "No inline styles" rule OR use CSS-in-JS library that supports responsive breakpoints (like styled-components or Tailwind CSS with @apply).

**For Now:** Manually audit and fix critical public-facing pages (pricing, homepage, signup).
