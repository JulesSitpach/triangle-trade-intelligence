# Admin API Dev Issue Logging - Quick Reference Guide

## Import Statement
```javascript
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue.js';
```

---

## Quick Helpers (DevIssue)

### 1. Missing Data
```javascript
await DevIssue.missingData('admin_api', 'field_name', {
  contextData: 'value'
});
```

**Use when:**
- Required parameter not provided
- Subscriber data field missing
- Critical business context absent

**Example:**
```javascript
if (!subscriber_data?.company_name) {
  await DevIssue.missingData('admin_api', 'subscriber_data.company_name', {
    serviceRequestId,
    userId
  });
}
```

---

### 2. API Errors
```javascript
await DevIssue.apiError('admin_api', '/api/endpoint', error, {
  contextData: 'value'
});
```

**Use when:**
- Database query fails
- External API call fails
- Unexpected exceptions occur

**Example:**
```javascript
catch (error) {
  await DevIssue.apiError('admin_api', '/api/admin/service-requests', error, {
    action: req.method,
    serviceRequestId
  });
  res.status(500).json({ error: 'Failed to fetch data' });
}
```

---

### 3. Validation Errors
```javascript
await DevIssue.validationError('admin_api', 'field_name', value, {
  contextData: 'value'
});
```

**Use when:**
- Invalid HTTP method
- Parameter format incorrect
- Business rule violated

**Example:**
```javascript
if (req.method !== 'GET') {
  await DevIssue.validationError('admin_api', 'request_method', req.method, {
    endpoint: '/api/admin/analytics',
    allowed_methods: ['GET']
  });
  return res.status(405).json({ error: 'Method not allowed' });
}
```

---

### 4. Null Values
```javascript
await DevIssue.nullValue('admin_api', 'field_name', {
  contextData: 'value'
});
```

**Use when:**
- Expected value is null/undefined
- Data integrity issue detected
- Optional field unexpectedly missing

---

### 5. Unexpected Behavior
```javascript
await DevIssue.unexpectedBehavior('admin_api', 'description', {
  contextData: 'value'
});
```

**Use when:**
- Logic flow incorrect
- State mismatch detected
- Business rule violation

---

## Full LogDevIssue Function

For custom severity levels and types:

```javascript
await logDevIssue({
  type: 'missing_data' | 'validation_error' | 'api_error' | 'null_value' | 'unexpected_behavior',
  severity: 'critical' | 'high' | 'medium' | 'low',
  component: 'admin_api',
  message: 'Human-readable description',
  data: {
    // Full context object
  },
  userId: userId,              // Optional
  certificateNumber: certNum   // Optional
});
```

---

## Common Patterns

### Pattern 1: Method Validation
```javascript
if (req.method !== 'GET') {
  await DevIssue.validationError('admin_api', 'request_method', req.method, {
    endpoint: req.url,
    allowed_methods: ['GET']
  });
  return res.status(405).json({ error: 'Method not allowed' });
}
```

### Pattern 2: Missing Parameter
```javascript
if (!id) {
  await DevIssue.missingData('admin_api', 'service_request_id', {
    endpoint: req.url,
    query: req.query
  });
  return res.status(400).json({ error: 'ID required' });
}
```

### Pattern 3: Database Error
```javascript
try {
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
} catch (dbError) {
  await logDevIssue({
    type: 'api_error',
    severity: 'high',
    component: 'admin_api',
    message: 'Database query failed',
    data: {
      table: 'table_name',
      error: dbError.message,
      operation: 'SELECT'
    }
  });
  // Continue with graceful fallback
}
```

### Pattern 4: Missing Business Data
```javascript
if (!data.subscriber_data) {
  await DevIssue.missingData('admin_api', 'subscriber_data', {
    request_id: id,
    company_name: data.company_name,
    service_type: data.service_type
  });
}
```

### Pattern 5: Unauthorized Access
```javascript
const adminCheck = await verifyAdmin(req);
if (!adminCheck.isAdmin) {
  await logDevIssue({
    type: 'validation_error',
    severity: 'high',
    component: 'admin_api',
    message: 'Unauthorized access attempt',
    data: {
      userId: adminCheck.userId,
      ip: req.ip || req.connection?.remoteAddress,
      endpoint: req.url
    }
  });
  return res.status(403).json({ error: 'Admin access required' });
}
```

---

## Severity Guidelines

### CRITICAL
- System-wide failures
- Data corruption risks
- Security breaches
- Database connection loss

### HIGH
- Missing critical business data
- Service request failures
- Update operation failures
- Unauthorized access attempts
- Revenue-impacting errors

### MEDIUM
- Query failures with fallbacks
- Analytics calculation errors
- Non-blocking database errors
- Validation failures

### LOW
- Informational logging
- Successful operations
- Minor data quality issues
- Audit trail entries

---

## Best Practices

### ✅ DO
- Log before returning error responses
- Include full business context in data object
- Use appropriate severity levels
- Log both failures AND security events
- Provide actionable error messages

### ❌ DON'T
- Log sensitive data (passwords, tokens)
- Log inside tight loops
- Block response with logging failures
- Use generic error messages
- Log successful operations as errors

---

## Context Data Guidelines

### Include These Fields:
- **Identifiers:** userId, serviceRequestId, companyName
- **Operation Context:** action, method, endpoint
- **Business Data:** service_type, trade_volume, industry
- **Error Details:** error.message, errorCode, stack (for exceptions)
- **Audit Trail:** admin_id, timestamp, resolution_notes

### Example Context Object:
```javascript
{
  service_request_id: 'SR123456',
  company_name: 'ABC Corp',
  service_type: 'usmca-advantage',
  user_email: 'user@example.com',
  action: 'CREATE',
  method: 'POST',
  endpoint: '/api/admin/service-requests',
  error: dbError.message,
  timestamp: new Date().toISOString()
}
```

---

## Viewing Logged Issues

### Admin Dashboard
```
/admin/dev-issues
```

**Features:**
- Real-time issue feed
- Severity filtering
- Component grouping
- Time-based filtering
- Resolution status tracking
- One-click resolution

### Console Output
```
🚨 DEV ISSUE [CRITICAL]: admin_api - Database connection lost
⚠️  DEV ISSUE [HIGH]: admin_api - Missing subscriber_data.company_name
⚡ DEV ISSUE [MEDIUM]: admin_api - Query timeout with fallback
ℹ️  DEV ISSUE [LOW]: admin_api - Audit trail logged
```

---

## Testing Your Logging

### 1. Test Console Output
```javascript
// Verify emoji indicators appear
// Check message clarity
// Confirm data object structure
```

### 2. Test Dashboard Integration
```javascript
// Check issue appears in admin dashboard
// Verify severity badge correct
// Confirm filtering works
// Test resolution workflow
```

### 3. Test Non-Blocking
```javascript
// Ensure API still responds if logging fails
// Verify fetch errors don't break main flow
// Check graceful degradation
```

---

## Statistics

- **Total Logging Points:** 38
- **Method Validations:** 6
- **Missing Data Checks:** 10
- **API Error Handlers:** 14
- **Audit Trail Points:** 8

---

## Related Files

- **Utility:** `/lib/utils/logDevIssue.js`
- **API Endpoint:** `/api/admin/log-dev-issue.js`
- **View Issues:** `/api/admin/dev-issues.js`
- **Resolve Issues:** `/api/admin/resolve-dev-issue.js`
- **Database Table:** `dev_issues`

---

**Last Updated:** January 2025
**Status:** Production Ready ✅
