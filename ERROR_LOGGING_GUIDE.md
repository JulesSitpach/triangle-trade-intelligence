# Error Logging Guide - Triangle Intelligence Platform

**Created:** November 6, 2025
**Purpose:** Capture all user-facing errors in admin dashboard for monitoring

---

## 📍 Overview

The `error-logger.js` utility automatically logs errors to the `dev_issues` table so your admin dashboard shows what users are experiencing in real-time.

**Key Features:**
- ✅ Automatic severity detection (critical/high/medium/low)
- ✅ Error categorization (auth, validation, network, database, AI)
- ✅ User context tracking (userId, URL, user-agent)
- ✅ Request/response logging for APIs
- ✅ Component state capture for React errors
- ✅ Non-blocking (errors in logging don't break user flow)

---

## 🚀 Quick Start

### Import the logger:
```javascript
import { logUserError, logApiError, logComponentError } from '@/lib/utils/error-logger';
```

### Basic usage in try/catch:
```javascript
try {
  // Your code
  const result = await riskyOperation();
} catch (error) {
  // Log to admin dashboard
  await logUserError(error, {
    context: 'component_name',
    userId: user.id,
    severity: 'high'
  });

  // Still show user-friendly message
  setError('Something went wrong. Please try again.');
}
```

---

## 📋 Available Functions

### 1. `logUserError(error, metadata)`
**Use:** General-purpose error logging

**Parameters:**
- `error` - Error object or string message
- `metadata.context` - Where error occurred (e.g., 'workflow_step_2')
- `metadata.userId` - User ID (if available)
- `metadata.severity` - 'critical' | 'high' | 'medium' | 'low' (auto-detected if omitted)
- `metadata.data` - Additional context (object)

**Example:**
```javascript
await logUserError(
  new Error('Failed to save component data'),
  {
    context: 'ComponentOriginsStepEnhanced',
    userId: user.id,
    severity: 'high',
    data: { component_count: 5, workflow_id: 'session_123' }
  }
);
```

**Auto-detected severities:**
- 403/401 errors → `high`
- 500/database errors → `critical`
- 404/validation errors → `medium`

---

### 2. `logApiError(error, req, severity)`
**Use:** API endpoint errors with request context

**Parameters:**
- `error` - Error object or string
- `req` - Next.js API request object
- `severity` - Optional (defaults to 'medium')

**Example:**
```javascript
// pages/api/your-endpoint.js
export default async function handler(req, res) {
  try {
    // Your API logic
  } catch (error) {
    await logApiError(error, req, 'high');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

**What gets logged:**
- HTTP method, endpoint URL, request body, query params
- User-agent, content-type headers
- User ID (from req.userId or req.body.user_id)

---

### 3. `logComponentError(error, componentName, componentState, userId)`
**Use:** React component errors with state snapshot

**Parameters:**
- `error` - Error object or string
- `componentName` - Name of React component
- `componentState` - Component state at time of error (object)
- `userId` - User ID (if available)

**Example:**
```javascript
// In React component
try {
  await handleSubmit();
} catch (error) {
  await logComponentError(
    error,
    'WorkflowStep2',
    { components: this.state.components, step: 2 },
    this.props.userId
  );
  this.setState({ error: 'Failed to submit' });
}
```

---

### 4. `logValidationError(message, fieldName, fieldValue, userId)`
**Use:** Form validation failures

**Example:**
```javascript
if (!email.includes('@')) {
  await logValidationError(
    'Invalid email format',
    'email',
    email,
    user.id
  );
  setError('Please enter a valid email');
}
```

---

### 5. `logNetworkError(error, url, requestOptions, userId)`
**Use:** Fetch/network failures

**Example:**
```javascript
try {
  const response = await fetch('/api/tariff-analysis', {
    method: 'POST',
    body: JSON.stringify(data)
  });
} catch (error) {
  await logNetworkError(
    error,
    '/api/tariff-analysis',
    { method: 'POST', body: data },
    user.id
  );
}
```

---

### 6. `logAuthError(error, action, userId)`
**Use:** Authentication/authorization failures (401, 403)

**Example:**
```javascript
// When user hits 403
await logAuthError(
  new Error('Invalid workflow session'),
  'Tried to classify component with invalid session',
  user.id
);
```

---

### 7. `withErrorLogging(fn, context, userId)`
**Use:** Wrapper for async functions (auto-logs errors)

**Example:**
```javascript
const saveComponentWithLogging = withErrorLogging(
  saveComponent,
  'saveComponent',
  user.id
);

// Now any error in saveComponent() is automatically logged
await saveComponentWithLogging(componentData);
```

---

## 🎯 Real-World Examples

### Example 1: Classification API 403 Error
```javascript
// pages/api/agents/classification.js
if (sessionError || !workflowSession) {
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
```

**Logged to admin dashboard:**
- Type: `authentication_error`
- Severity: `high`
- Component: `authentication`
- Message: "Invalid workflow session ID - user blocked"
- Data: { action: "HS code classification on invalid session", userId: "..." }

---

### Example 2: Component Save Failure
```javascript
// components/workflow/ComponentOriginsStepEnhanced.js
const handleSaveComponents = async () => {
  try {
    const response = await fetch('/api/workflow-session/save-components', {
      method: 'POST',
      body: JSON.stringify({ components, workflow_session_id })
    });

    if (!response.ok) {
      throw new Error(`Save failed: ${response.statusText}`);
    }
  } catch (error) {
    await logComponentError(
      error,
      'ComponentOriginsStepEnhanced',
      { components, workflow_session_id },
      userId
    );

    setError('Failed to save components. Please try again.');
  }
};
```

**Logged to admin dashboard:**
- Type: `unknown_error`
- Severity: `medium`
- Component: `component:ComponentOriginsStepEnhanced`
- Message: "Save failed: Internal Server Error"
- Data: { component_state: { components: [...], workflow_session_id: "..." } }

---

### Example 3: Tariff Analysis API Error
```javascript
// pages/api/ai-usmca-complete-analysis.js
export default async function handler(req, res) {
  try {
    // Validate input
    if (!req.body.components || req.body.components.length === 0) {
      throw new Error('No components provided');
    }

    // Process tariff analysis
    const result = await analyzeTariffs(req.body);
    return res.status(200).json(result);

  } catch (error) {
    await logApiError(error, req, 'critical');
    return res.status(500).json({ error: 'Analysis failed' });
  }
}
```

**Logged to admin dashboard:**
- Type: `unknown_error`
- Severity: `critical`
- Component: `/api/ai-usmca-complete-analysis`
- Message: "No components provided"
- Data: { method: "POST", body: { ... }, headers: { ... } }

---

### Example 4: Database Query Failure
```javascript
// lib/agents/classification-agent.js
try {
  const { data, error } = await supabase
    .from('hs_classification_cache')
    .select('*')
    .eq('component_description_normalized', normalized)
    .single();

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }
} catch (error) {
  await logUserError(error, {
    context: 'classification_cache_lookup',
    userId: this.userId,
    severity: 'critical',
    data: { query_params: { normalized } }
  });

  // Fallback to AI classification
  return await this.callAI(description);
}
```

**Logged to admin dashboard:**
- Type: `database_error`
- Severity: `critical`
- Component: `classification_cache_lookup`
- Message: "Database query failed: ..."
- Data: { query_params: { normalized: "..." } }

---

## 🔍 What Gets Logged (dev_issues table schema)

Each error creates a row in `dev_issues` with:

| Column | Description | Example |
|--------|-------------|---------|
| `type` | Error category | `authentication_error`, `database_error`, `validation_error` |
| `severity` | Impact level | `critical`, `high`, `medium`, `low` |
| `component` | Where error occurred | `ComponentOriginsStepEnhanced`, `/api/classification` |
| `message` | Error message | "Invalid workflow session ID - user blocked" |
| `data` | JSON context | `{ user_id: "...", workflow_session_id: "...", stack: "..." }` |
| `status` | Resolution status | `open` (default) |
| `created_at` | Timestamp | `2025-11-06T12:34:56Z` |

---

## 📊 Severity Levels Guide

### Critical (Immediate Action Required)
- Database connection failures
- Payment processing errors
- Data corruption
- 500 server errors affecting multiple users

### High (Review Within 24h)
- Authentication failures (403/401)
- Authorization bypasses
- Repeated failures from single user
- AI service failures

### Medium (Review Within Week)
- Validation errors
- 404 errors
- Network timeouts
- Cache misses

### Low (Review When Convenient)
- Form validation warnings
- Non-critical UI glitches
- Info-level logs

---

## ✅ Integration Checklist

Add error logging to:

- [x] **Classification API** (`pages/api/agents/classification.js`) - 403 errors logged
- [ ] **Tariff Analysis API** (`pages/api/ai-usmca-complete-analysis.js`)
- [ ] **Workflow Session API** (`pages/api/workflow-session.js`)
- [ ] **Component Save API** (`pages/api/workflow-session/save-components.js`)
- [ ] **React Components**:
  - [ ] ComponentOriginsStepEnhanced
  - [ ] ResultsStep
  - [ ] USMCAWorkflow main page
- [ ] **Authentication Endpoints** (`pages/api/auth/*`)
- [ ] **Payment Processing** (`pages/api/stripe/webhook.js`)
- [ ] **Executive Alert API** (`pages/api/executive-trade-alert.js`)

---

## 🚨 Common Patterns

### Pattern 1: API Endpoint Error Handling
```javascript
export default async function handler(req, res) {
  try {
    // Validate auth first
    if (!req.userId) {
      await logAuthError(new Error('Unauthenticated'), 'API access', null);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Your business logic
    const result = await processRequest(req.body);
    return res.status(200).json(result);

  } catch (error) {
    await logApiError(error, req, 'high');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Pattern 2: React Component Error Boundary
```javascript
class ErrorBoundary extends React.Component {
  async componentDidCatch(error, errorInfo) {
    await logComponentError(
      error,
      this.props.componentName,
      { errorInfo },
      this.props.userId
    );
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Pattern 3: Fetch Wrapper with Auto-Logging
```javascript
async function fetchWithLogging(url, options = {}, userId = null) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    await logNetworkError(error, url, options, userId);
    throw error; // Re-throw for component to handle
  }
}
```

---

## 🔧 Admin Dashboard Integration

**Query to show recent critical errors:**
```sql
SELECT
  id,
  type,
  severity,
  component,
  message,
  data->>'user_id' as user_id,
  created_at
FROM dev_issues
WHERE severity IN ('critical', 'high')
  AND status = 'open'
ORDER BY created_at DESC
LIMIT 50;
```

**Query to show error frequency by component:**
```sql
SELECT
  component,
  severity,
  COUNT(*) as error_count,
  MAX(created_at) as last_occurrence
FROM dev_issues
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY component, severity
ORDER BY error_count DESC;
```

**Query to show user-specific errors:**
```sql
SELECT
  message,
  component,
  severity,
  created_at
FROM dev_issues
WHERE data->>'user_id' = 'USER_ID_HERE'
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

---

## ✅ Next Steps

1. **Add to remaining API endpoints** - Tariff analysis, workflow session, auth
2. **Integrate with React components** - Error boundaries, form validation
3. **Build admin dashboard view** - Query dev_issues table, show stats
4. **Set up alerts** - Email/Slack when critical errors occur
5. **Add error resolution workflow** - Mark issues as resolved, add notes

---

**Status:** ✅ Ready to use - Classification API already integrated (Nov 6, 2025)
