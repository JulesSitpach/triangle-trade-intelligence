#!/bin/bash

# User Experience Automated Tests
# Run this before launching to production

echo "🧪 Running User Experience Tests..."
echo ""

# Test 1: No broken links to deleted pages
echo "✓ Test 1: Checking for broken links to deleted pages..."
BROKEN_LINKS=$(grep -r "href=\"/solutions\|href=\"/industries\|href=\"/intelligence\|href=\"/supplier-capability\|href=\"/sales-presentations\|href=\"/system-status\|href=\"/simple-certificate\|href=\"/certificates" pages/*.js 2>/dev/null | grep -v "node_modules" || true)

if [ -z "$BROKEN_LINKS" ]; then
  echo "  ✅ PASS: No broken links found"
else
  echo "  ❌ FAIL: Found broken links:"
  echo "$BROKEN_LINKS"
  exit 1
fi

# Test 2: No "enterprise" language on user-facing pages
echo ""
echo "✓ Test 2: Checking for 'enterprise' language on user pages..."
ENTERPRISE_TEXT=$(grep -ri "enterprise" pages/index.js pages/pricing.js pages/services.js pages/signup.js 2>/dev/null | grep -v "Professional Plus" | grep -v "tier: 'enterprise'" | grep -v "@type" | grep -v "triangleintelligence.com" || true)

if [ -z "$ENTERPRISE_TEXT" ]; then
  echo "  ✅ PASS: No enterprise language found on user pages"
else
  echo "  ❌ FAIL: Found enterprise language:"
  echo "$ENTERPRISE_TEXT"
  exit 1
fi

# Test 3: No "free trial" confusion
echo ""
echo "✓ Test 3: Checking for 'free trial' mentions..."
FREE_TRIAL=$(grep -ri "free trial\|Free Trial" pages/index.js pages/pricing.js pages/services.js pages/signup.js 2>/dev/null || true)

if [ -z "$FREE_TRIAL" ]; then
  echo "  ✅ PASS: No free trial mentions found"
else
  echo "  ❌ FAIL: Found free trial mentions:"
  echo "$FREE_TRIAL"
  exit 1
fi

# Test 4: No old capacity language
echo ""
echo "✓ Test 4: Checking for old '3-person team' capacity language..."
CAPACITY_TEXT=$(grep -r "3-person team\|40/month\|8-10/month" pages/pricing.js 2>/dev/null || true)

if [ -z "$CAPACITY_TEXT" ]; then
  echo "  ✅ PASS: Old capacity language removed"
else
  echo "  ❌ FAIL: Found old capacity language:"
  echo "$CAPACITY_TEXT"
  exit 1
fi

# Test 5: Correct page count (19 pages)
echo ""
echo "✓ Test 5: Verifying correct page count..."
PAGE_COUNT=$(ls pages/*.js 2>/dev/null | wc -l)

if [ "$PAGE_COUNT" -eq 19 ]; then
  echo "  ✅ PASS: 19 pages found (correct)"
else
  echo "  ❌ FAIL: Expected 19 pages, found $PAGE_COUNT"
  exit 1
fi

# Test 6: Critical files exist
echo ""
echo "✓ Test 6: Verifying critical user-facing files exist..."
CRITICAL_FILES=(
  "pages/index.js"
  "pages/pricing.js"
  "pages/services.js"
  "pages/usmca-workflow.js"
  "pages/dashboard.js"
  "pages/login.js"
  "pages/signup.js"
)

for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file exists"
  else
    echo "  ❌ FAIL: $file missing"
    exit 1
  fi
done

# Test 7: Deleted pages are gone
echo ""
echo "✓ Test 7: Verifying deleted pages are removed..."
DELETED_FILES=(
  "pages/solutions.js"
  "pages/industries.js"
  "pages/intelligence.js"
  "pages/supplier-capability-assessment.js"
  "pages/sales-presentations.js"
  "pages/system-status.js"
  "pages/simple-certificate.js"
  "pages/certificates.js"
)

ALL_DELETED=true
for file in "${DELETED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ❌ FAIL: $file should be deleted"
    ALL_DELETED=false
  fi
done

if [ "$ALL_DELETED" = true ]; then
  echo "  ✅ PASS: All deleted pages removed"
fi

# Test 8: Pricing page has new sections
echo ""
echo "✓ Test 8: Verifying pricing page has new 'What Subscribers Get' section..."
if grep -q "What Subscribers Get Every Week" pages/pricing.js; then
  echo "  ✅ PASS: New section found in pricing page"
else
  echo "  ❌ FAIL: New section missing from pricing page"
  exit 1
fi

# Test 9: Subscription features emphasize monitoring
echo ""
echo "✓ Test 9: Verifying subscription features emphasize monitoring..."
if grep -q "Weekly USMCA policy digest (expert-curated)" pages/pricing.js; then
  echo "  ✅ PASS: Monitoring-focused features found"
else
  echo "  ❌ FAIL: Old features still present"
  exit 1
fi

# Test 10: Capacity limits reframed
echo ""
echo "✓ Test 10: Verifying capacity limits reframed as expertise..."
if grep -q "licensed customs broker" pages/pricing.js && grep -q "17 years" pages/pricing.js; then
  echo "  ✅ PASS: Expertise-focused language found"
else
  echo "  ❌ FAIL: Old capacity language still present"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ ALL TESTS PASSED!"
echo "=========================================="
echo ""
echo "User-facing experience is ready for production."
echo ""
echo "Next steps:"
echo "1. Manual testing: Run through USER_PRODUCTION_READINESS.md checklist"
echo "2. Test on mobile devices (iPhone, Android)"
echo "3. Test Stripe payment flow with test cards"
echo "4. Verify email monitoring system (admin side)"
echo "5. Run: npm run build (verify production build)"
echo "6. Deploy to production 🚀"
echo ""
