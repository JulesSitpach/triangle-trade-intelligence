# 🔍 Request Logging Guide - Find Phantom API Calls

**Status:** Active logging enabled
**Last Updated:** Oct 31, 2025

## What's Been Added

### 1. Client-Side Interceptor (Global)
**File:** `pages/_app.js`
**What it does:** Intercepts ALL `fetch()` requests in the browser and logs them to console

**Output format:**
```
🌐 FETCH REQUEST: {
  timestamp: "2025-10-31T...",
  url: "/api/ai-usmca-complete-analysis",
  method: "POST",
  body: "(has body)",
  calledFrom: "at ComponentOriginsStepEnhanced.js:234"
}
```

### 2. Server-Side Logger (Opt-in)
**File:** `lib/middleware/request-logger.js`
**What it does:** Logs API route hits on the server side

**How to use:**
```javascript
import { withRequestLogging } from '../../lib/middleware/request-logger';

export default withRequestLogging(async function handler(req, res) {
  // Your API logic...
});
```

**Output format:**
```
🚨 API REQUEST: {
  timestamp: "2025-10-31T...",
  path: "/api/ai-usmca-complete-analysis",
  method: "POST",
  userAgent: "Mozilla/5.0...",
  referer: "http://localhost:3001/usmca-workflow",
  ip: "127.0.0.1"
}
```

---

## How to Use This to Find Phantom Calls

### Test 1: Idle Page Test (Find Auto-Polling)
**Goal:** Catch requests that happen when you're not doing anything

1. Open your app: `http://localhost:3001`
2. Navigate to the page with issues (e.g., components page)
3. **Open DevTools Console** (F12 → Console tab)
4. **Don't touch anything** - just sit there for 2 minutes
5. Watch the console for `🌐 FETCH REQUEST:` logs

**What to look for:**
- ✅ **Expected:** Zero requests (good - no phantom calls)
- 🚨 **Problem:** Repeated requests every few seconds = auto-polling or useEffect loop

**Example phantom call:**
```
🌐 FETCH REQUEST: {
  url: "/api/ai-usmca-complete-analysis",
  calledFrom: "at useEffect (WorkflowResults.js:123)"  👈 FOUND IT!
}
```

---

### Test 2: Button Click Test (Find Repeated Calls)
**Goal:** Catch multiple API calls from single user action

1. Open DevTools Console
2. **Clear console** (click trash icon)
3. Click a button (e.g., "Generate Certificate")
4. Count how many `🌐 FETCH REQUEST:` logs appear

**What to look for:**
- ✅ **Expected:** 1 request per button click
- 🚨 **Problem:** 2+ requests for same endpoint = duplicate event handlers

**Example duplicate call:**
```
🌐 FETCH REQUEST: { url: "/api/ai-usmca-complete-analysis", calledFrom: "at handleSubmit (ComponentOriginsStepEnhanced.js:234)" }
🌐 FETCH REQUEST: { url: "/api/ai-usmca-complete-analysis", calledFrom: "at handleSubmit (ComponentOriginsStepEnhanced.js:234)" }  👈 DUPLICATE!
```

---

### Test 3: Page Navigation Test (Find Memory Leaks)
**Goal:** Catch requests from unmounted components

1. Open DevTools Console
2. Navigate between pages (e.g., Workflow → Results → Workflow)
3. Watch for requests appearing after navigation

**What to look for:**
- ✅ **Expected:** Requests stop when you leave the page
- 🚨 **Problem:** Requests continue after navigation = useEffect cleanup missing

**Example memory leak:**
```
[User navigates away from WorkflowResults.js]
🌐 FETCH REQUEST: { url: "/api/dashboard-data", calledFrom: "at useEffect (WorkflowResults.js:456)" }  👈 Component is unmounted!
```

---

### Test 4: Network Tab Comparison
**Goal:** Cross-validate client-side logs with actual network requests

1. Open DevTools → Network tab
2. Clear console + network tab
3. Perform an action (e.g., submit form)
4. Compare:
   - Console: Count `🌐 FETCH REQUEST:` logs
   - Network tab: Count actual HTTP requests

**What to look for:**
- ✅ **Expected:** Same count (1:1 match)
- 🚨 **Problem:** More network requests than logs = non-fetch requests (XMLHttpRequest, axios, etc.)

---

## Common Phantom Call Patterns

### Pattern 1: useEffect Missing Dependencies
```javascript
// 🚨 BAD - Runs on every render
useEffect(() => {
  fetch('/api/data');
}, []); // Missing dependencies

// ✅ GOOD - Runs only when needed
useEffect(() => {
  if (!data) {
    fetch('/api/data');
  }
}, [data]);
```

### Pattern 2: Missing Cleanup Function
```javascript
// 🚨 BAD - Interval keeps running after unmount
useEffect(() => {
  const interval = setInterval(() => {
    fetch('/api/data');
  }, 5000);
}, []);

// ✅ GOOD - Cleanup on unmount
useEffect(() => {
  const interval = setInterval(() => {
    fetch('/api/data');
  }, 5000);

  return () => clearInterval(interval); // Cleanup
}, []);
```

### Pattern 3: Multiple Event Listeners
```javascript
// 🚨 BAD - Adds new listener on every render
useEffect(() => {
  button.addEventListener('click', () => fetch('/api/data'));
}, []);

// ✅ GOOD - Single event listener
const handleClick = () => {
  fetch('/api/data');
};

<button onClick={handleClick}>Submit</button>
```

---

## Advanced Debugging: Filter Logs

If you're getting too many logs, filter in DevTools Console:

1. Open Console
2. Click "Filter" icon
3. Enter regex: `🌐 FETCH REQUEST:.*ai-usmca-complete-analysis`

This shows only requests to your tariff analysis endpoint.

---

## How to Remove Logging (After Debugging)

### Client-Side (Remove from _app.js)
**File:** `pages/_app.js`
**What to remove:** Lines 17-40 (the entire useEffect block)

### Server-Side (Remove from API routes)
**File:** Any API route using `withRequestLogging`
**What to remove:** Just unwrap the handler:

```javascript
// Before (with logging)
export default withRequestLogging(async function handler(req, res) { ... });

// After (logging removed)
export default async function handler(req, res) { ... }
```

---

## Next Steps

1. **Run Test 1** (Idle Page Test) first - this catches 90% of phantom calls
2. If you find phantom calls, note the `calledFrom` file and line number
3. Open that file and check for:
   - Missing useEffect dependencies
   - Missing cleanup functions
   - Duplicate event handlers
4. Fix the issue
5. Re-run Test 1 to confirm fix

**Expected Result:** Zero requests when idle, exactly 1 request per user action.
