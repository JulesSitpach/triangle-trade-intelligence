  ---
  📋 Summary of Changes

  1. Certificate Generation Flow ✅

  Files Fixed:
  - pages/usmca-certificate-completion.js (line 99) - Fixed company_country field mapping
  - hooks/useWorkflowState.js (lines 350-369) - Ensured company_country and certifier_type flow through localStorage
  - lib/utils/usmca-certificate-pdf-generator.js (lines 120, 165, 216) - Removed ALL fallback chains, added error logging

  2. Alerts Page Data Flow ✅

  File: pages/trade-risk-alternatives.js

  localStorage Loader (lines 148-201):
  - ❌ Removed: Triple fallback chains like company?.name || company?.company_name || 'Your Company'
  - ✅ Fixed: Schema mismatch - now uses userData.components (matches what useWorkflowState saves)
  - ✅ Added: Dev issue logging for missing fields with full context

  Database Loader (lines 72-126):
  - ✅ Added: Schema mismatch detection and logging for origin_country vs country fields

  3. Dashboard Data Flow ✅

  File: components/UserDashboard.js

  Certificate Download Function (lines 64-140):
  - ✅ Added: Missing field detection for 9 critical fields
  - ✅ Added: Dev issue logging with workflow context
  - ⚠️ Kept fallbacks (for backward compatibility) but now logs to admin when used

  ---
  🚨 Fail Loudly System Implemented

  All missing data now logs to /admin/dev-issues with:
  - Component name (e.g., trade_alerts_page, dashboard_certificate_generator)
  - Severity level (critical, high, medium)
  - Missing field list
  - Full context data for debugging
  - Workflow/certificate IDs where applicable

  ---
  📊 Database Schema Issues Detected

  KEY FINDING: localStorage saves as components but code was checking component_origins first!

  Before:
  userData.component_origins?.[0]  // ← Looks here first (WRONG)
    || userData.components?.[0]     // ← Falls back to correct key (HIDING BUG)

  After:
  userData.components?.[0]          // ← Uses correct key directly
  // + Logs if either field is missing

  ---
  🎯 Next Steps

  1. Test the flow - Run through workflow → certificate → alerts → dashboard
  2. Check admin dashboard - Visit /admin/dev-issues to see any logged issues
  3. Fix root causes - When issues appear, fix the data source (not add more fallbacks!)

  All data flow is now honest and transparent - bugs will be visible in your admin dashboard instead of hidden behind fallback chains! 🎉
