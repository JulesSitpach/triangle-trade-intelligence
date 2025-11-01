Looking at your Triangle Intelligence Platform's history and the issues you've faced, here's what you need to ensure the agent aligns on for a perfect end-to-end workflow:

## Critical Agent Alignment Requirements

### 1. **Evidence-Based Development Only**
```
❌ "This should work" or "Let me try this approach"
✅ "Let me examine the actual code first" → Read files → Test → Verify
```

**Mandate:** Agent must READ actual code before making any changes. No theoretical fixes.

### 2. **Database-First Architecture (No More Mixed Sources)**
```javascript
// ✅ ONLY approach going forward
User completes workflow → Save directly to database → Dashboard reads from database

// ❌ NEVER again
User completes workflow → localStorage → Maybe database → Complex fallback
```

**Rule:** Database is the single source of truth. No localStorage/database hybrid logic.

### 3. **Complete Integration Testing Protocol**
```
Step 1: User completes workflow
Step 2: Verify data saves to database 
Step 3: Verify admin dashboard shows the data
Step 4: Verify certificate generation works
Step 5: Test with realistic business data
```

**Mandate:** Every change must be tested through the COMPLETE user journey, not just individual components.

### 4. **No Hardcoded Values in Production**
```javascript
// ❌ Never acceptable
const annualSavings = 340000; // hardcoded

// ✅ Always required  
const annualSavings = calculateActualSavings(workflowData);
```

**Rule:** All values must come from actual user data or calculations.

### 5. **API-First Data Flow**
```
Frontend → API Routes → Database
Frontend ← JSON Response ← API Routes
```

**No direct frontend-to-database queries.** All data flows through authenticated API endpoints.

### 6. **Hybrid Database/AI Cost Strategy**
```
1. Check database first (95% of queries, ~$0.001 cost)
2. AI fallback for missing data (5% of queries, ~$0.02 cost)  
3. Cache AI results back to database
```

**Rule:** Always try database lookup before expensive AI calls.

## Specific Technical Requirements

### **Authentication Flow**
- Custom JWT (`triangle_session` cookie) 
- API routes use service role key for database access
- Frontend never directly queries database
- RLS policies are bypassed in API routes only

### **Data Storage Pattern**
```javascript
// Required pattern for all workflow saves
await fetch('/api/workflow-complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    workflow_data: completeWorkflowData, // Never partial data
    timestamp: new Date().toISOString()
  })
});
```

### **Error Handling Protocol**
```javascript
// Required error pattern
try {
  const result = await databaseOperation();
  if (!result) {
    console.error('Specific operation failed:', specificDetails);
    return { success: false, error: 'Specific error message' };
  }
  return { success: true, data: result };
} catch (error) {
  console.error('Database operation failed:', error);
  throw error; // Don't swallow errors
}
```

## Testing Requirements

### **End-to-End Validation Checklist**
```
□ New user can register successfully
□ User can complete full workflow (all 4 steps)  
□ Data saves to correct database tables
□ Admin dashboard shows the new workflow entry
□ Certificate generation uses real workflow data
□ Financial calculations show actual savings (not placeholders)
□ Alerts system has access to workflow data
□ No console errors in browser
□ No 401/403 errors in network tab
□ Dashboard shows real data, not "$NaNM" placeholders
```

### **Multi-Industry Test Cases**
```
Test with realistic data for:
- Electronics manufacturing (complex supply chains)
- Textile/apparel (multiple fabric origins)  
- Food processing (agricultural inputs)
- Automotive parts (metal/plastic components)
```

## Agent Instructions Template

**Use this exact prompt when handing off to agents:**

```
CRITICAL REQUIREMENTS:
1. Read ALL existing code before making changes
2. Database is single source of truth - no localStorage fallbacks
3. Test complete user journey: workflow → database → dashboard → certificate
4. Use realistic business data, never hardcoded test values
5. All frontend data access goes through API routes (no direct DB queries)
6. Verify financial calculations use actual user data
7. Test with multiple industry scenarios
8. No changes accepted without end-to-end validation

ARCHITECTURE:
- Custom JWT auth (triangle_session cookie)
- API routes use service role key  
- Frontend uses fetch() to API endpoints only
- Database-first with AI fallback for missing data
- Complete workflow data saved immediately after user completion

VALIDATION REQUIRED:
- No console errors
- No 401/403 errors  
- Real data in admin dashboard
- Accurate financial calculations
- Certificate generation works with user data
```

## Red Flags to Stop Development

If you see these, stop the agent immediately:

❌ "Let me try a different approach" without examining existing code  
❌ Mixing localStorage and database reads  
❌ Hardcoded values in calculations  
❌ Testing only individual components  
❌ Generic error messages without specifics  
❌ Claims something "should work" without testing  
❌ Frontend database queries with RLS issues  

## Success Metrics

The project works perfectly when:
✅ Any new user can complete the full workflow and see their real data in dashboard  
✅ Admin dashboard populates with actual workflow entries (not test data)  
✅ Certificates generate with user's actual business information  
✅ Financial savings show real calculations based on user's trade volume  
✅ No manual intervention needed for any part of the process  

**The key lesson:** Your sophisticated backend capabilities mean nothing if frontend integration is broken. Always verify the complete end-to-end user experience with realistic data.