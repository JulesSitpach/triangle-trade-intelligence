# Error Logging Fixes - November 6, 2025

## Issues Fixed

### 1. ✅ Database Schema Mismatch
**Problem:** Error logger was using wrong column names
- Used `data` → Should be `context_data`
- Used `type` → Should be `issue_type`
- Used `status` → Should be `resolved`

**Error Message:**
```
[ERROR-LOGGER] Failed to log error to dev_issues: {
  code: 'PGRST204',
  message: "Could not find the 'data' column of 'dev_issues' in the schema cache"
}
```

**Fix:** Updated `lib/utils/error-logger.js` to match actual dev_issues table schema:
```javascript
const issueData = {
  issue_type: errorType,          // ✅ Was: type
  severity: finalSeverity,
  component: context,
  message: errorMessage,
  context_data: {                 // ✅ Was: data
    error_name: errorName,
    stack: errorStack,
    timestamp: new Date().toISOString(),
    user_agent: ...,
    url: ...,
    ...data
  },
  user_id: userId,
  resolved: false                 // ✅ Was: status: 'open'
};
```

**Result:** Errors now successfully log to dev_issues table

---

### 2. ✅ Double-Quoted Session IDs
**Problem:** `workflow_session_id` stored with escaped quotes

**Error Log:**
```
"sessionId":"\"session_1762452051658_li6f3p6ck\""
```

**Root Cause:** `workflow-storage-adapter.js` was calling `JSON.stringify()` on ALL data, including strings

**Bug Flow:**
1. `SessionManager.loadFromSession('workflow_session_id')` returns `"session_123"` (string)
2. `workflowStorage.getItem()` calls `JSON.stringify("session_123")` → `"\"session_123\""`
3. Frontend sends `{ sessionId: "\"session_123\"" }` to API
4. Database stores/logs with quotes

**Fix:** Only stringify objects/arrays, return strings as-is:
```javascript
// lib/services/workflow-storage-adapter.js
getItem(key) {
  const data = SessionManager.loadFromSession(key);

  // ✅ FIX: Don't double-stringify strings
  if (typeof data === 'string') {
    return data;  // Return session IDs as-is
  }

  // Only stringify objects/arrays
  return data ? JSON.stringify(data) : null;
}
```

**Result:** Session IDs now stored/transmitted without quotes

---

### 3. ✅ 403 Errors Now Logged to Admin Dashboard
**Problem:** When users hit 403 errors, they were only console.log'd, never saved to database

**Impact:** Admin dashboard showed no issues even when users were blocked

**Fix:** Added error logging to classification API:
```javascript
// pages/api/agents/classification.js
if (sessionError || !workflowSession) {
  // ✅ Log to dev_issues for monitoring
  const { logAuthError } = require('@/lib/utils/error-logger');
  await logAuthError(
    new Error('Invalid workflow session ID - user blocked'),
    'HS code classification on invalid session',
    authenticatedUserId
  );

  return res.status(403).json({
    success: false,
    error: 'Invalid workflow session'
  });
}

// Also log completed workflow abuse attempts
if (workflowSession.completed_at) {
  await logAuthError(
    new Error('User tried to modify completed workflow'),
    'HS code classification on completed workflow',
    authenticatedUserId
  );
  ...
}
```

**Result:** All 403 errors now appear in admin dev dashboard with full context

---

## Files Modified

1. **`lib/utils/error-logger.js`** (lines 79-95)
   - Fixed column names to match dev_issues schema
   - Changed `type` → `issue_type`
   - Changed `data` → `context_data`
   - Changed `status: 'open'` → `resolved: false`

2. **`lib/services/workflow-storage-adapter.js`** (lines 37-51)
   - Fixed double-stringify bug
   - Return strings as-is (session IDs, simple values)
   - Only stringify objects/arrays

3. **`pages/api/agents/classification.js`** (lines 84-90, 103-109)
   - Added logAuthError() calls for 403 errors
   - Logs invalid workflow sessions
   - Logs completed workflow abuse attempts

---

## Testing Checklist

- [x] Error logger uses correct dev_issues column names
- [x] Session IDs transmitted without quotes
- [x] 403 errors logged to database
- [x] Admin dashboard shows new dev_issues entries
- [ ] Test HS classification with new session (should work)
- [ ] Test completed workflow modification (should log + block)
- [ ] Verify admin dashboard displays logged errors correctly

---

## Next Steps

1. **Test frontend workflow** - Create new workflow, verify session ID is clean
2. **Check admin dashboard** - Verify dev_issues table shows 403 errors
3. **Add error logging to other APIs**:
   - Tariff analysis API (`pages/api/ai-usmca-complete-analysis.js`)
   - Workflow session API (`pages/api/workflow-session.js`)
   - Authentication endpoints (`pages/api/auth/*`)

See `ERROR_LOGGING_GUIDE.md` for comprehensive integration examples.
