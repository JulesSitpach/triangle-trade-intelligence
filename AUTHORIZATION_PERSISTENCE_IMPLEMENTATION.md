# Authorization Persistence Implementation Guide
**Date**: November 7, 2025
**Feature**: Save and auto-populate certificate authorization data from database

## Problem Statement
When users complete the authorization step and generate a certificate preview, the authorization data (signatory name, importer details, etc.) is only saved to localStorage. When they return from the dashboard to review/download their certificate, the authorization fields are empty and they must re-enter everything.

## Solution Architecture

### 1. Database Schema
Authorization data is saved in two tables:
- `workflow_sessions.data.authorization` (JSONB)
- `workflow_completions.workflow_data.authorization` (JSONB)

### 2. API Endpoint (✅ COMPLETED)
**File**: `pages/api/workflow-session/update-authorization.js`

Saves authorization data to database when user clicks "Generate & Preview Certificate".

```javascript
POST /api/workflow-session/update-authorization
Body: { authorization_data: {...} }
```

## Implementation Steps

### Step 1: Save Authorization to Database (usmca-certificate-completion.js)

**Location**: `pages/usmca-certificate-completion.js` line 274

**Current Code**:
```javascript
const handlePreviewCertificate = async (authData) => {
  console.log('Generating certificate and opening preview for editing...');

  // Store authorization data for use in certificate generation
  setCertificateData(prev => ({
    ...prev,
    authorization: authData
  }));

  // Generate certificate and show editable preview
  await generateAndDownloadCertificate(authData);
};
```

**Updated Code**:
```javascript
const handlePreviewCertificate = async (authData) => {
  console.log('Generating certificate and opening preview for editing...');

  // Store authorization data for use in certificate generation
  setCertificateData(prev => ({
    ...prev,
    authorization: authData
  }));

  // ✅ FIX (Nov 7): Save authorization data to database
  try {
    const response = await fetch('/api/workflow-session/update-authorization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        authorization_data: authData
      })
    });

    if (response.ok) {
      console.log('✅ [CERTIFICATE-COMPLETION] Authorization data saved to database');
    } else {
      console.warn('⚠️ [CERTIFICATE-COMPLETION] Failed to save authorization (will use localStorage)');
    }
  } catch (error) {
    console.error('❌ [CERTIFICATE-COMPLETION] Error saving authorization:', error);
  }

  // Generate certificate and show editable preview
  await generateAndDownloadCertificate(authData);
};
```

---

### Step 2: Load Authorization from Database (usmca-certificate-completion.js)

**Location**: `pages/usmca-certificate-completion.js` line 168

**Current Code**:
```javascript
// ✅ Restore authorization data from localStorage (if exists)
let restoredAuthData = {};
if (storedAuth) {
  try {
    const authData = JSON.parse(storedAuth);
    console.log('✅ Restoring authorization data:', authData);
    restoredAuthData = {
      authorization: {
        signatory_name: authData.signatory_name || '',
        // ... rest of fields
      }
    };
  } catch (e) {
    console.error('Failed to restore authorization data:', e);
  }
}
```

**Updated Code**:
```javascript
// ✅ FIX (Nov 7): Restore authorization data from database OR localStorage
// Priority: database (parsedResults.authorization) > localStorage (storedAuth)
let restoredAuthData = {};
const dbAuthData = parsedResults?.authorization;
const localAuthData = storedAuth ? JSON.parse(storedAuth) : null;

// Use database data first, fallback to localStorage
const authDataSource = dbAuthData || localAuthData;

if (authDataSource) {
  try {
    console.log('✅ [CERTIFICATE-COMPLETION] Restoring authorization from:', dbAuthData ? 'database' : 'localStorage');
    restoredAuthData = {
      authorization: {
        signatory_name: authDataSource.signatory_name || '',
        signatory_title: authDataSource.signatory_title || '',
        signatory_email: authDataSource.signatory_email || '',
        signatory_phone: authDataSource.signatory_phone || '',
        certifier_type: authDataSource.certifier_type || 'EXPORTER'
      },
      exporter_same_as_company: authDataSource.exporter_same_as_company,
      producer_same_as_exporter: authDataSource.producer_same_as_exporter,
      // Exporter details
      exporter_name: authDataSource.exporter_name || '',
      exporter_address: authDataSource.exporter_address || '',
      exporter_country: authDataSource.exporter_country || '',
      exporter_tax_id: authDataSource.exporter_tax_id || '',
      exporter_phone: authDataSource.exporter_phone || '',
      exporter_email: authDataSource.exporter_email || '',
      // Importer details
      importer_name: authDataSource.importer_name || '',
      importer_address: authDataSource.importer_address || '',
      importer_country: authDataSource.importer_country || '',
      importer_tax_id: authDataSource.importer_tax_id || '',
      importer_phone: authDataSource.importer_phone || '',
      importer_email: authDataSource.importer_email || '',
      // Producer details
      producer_name: authDataSource.producer_name || '',
      producer_address: authDataSource.producer_address || '',
      producer_country: authDataSource.producer_country || '',
      producer_tax_id: authDataSource.producer_tax_id || '',
      producer_phone: authDataSource.producer_phone || '',
      producer_email: authDataSource.producer_email || ''
    };
  } catch (e) {
    console.error('Failed to restore authorization data:', e);
  }
}
```

---

### Step 3: Load Authorization in useWorkflowState Hook

**Location**: `hooks/useWorkflowState.js` line 850

**Current Code**:
```javascript
detailed_analysis: workflowData.detailed_analysis || null,
workflow_data: workflowData
```

**Updated Code**:
```javascript
detailed_analysis: workflowData.detailed_analysis || null,
authorization: workflowData.authorization || null, // ✅ FIX (Nov 7): Load saved authorization data
workflow_data: workflowData
```

This ensures that when users load a workflow from the dashboard, the authorization data is included in the `results` object.

---

### Step 4: Update Dashboard Data Loading

**Location**: `pages/api/dashboard-data.js` (if needed)

Ensure the API returns `workflow_data.authorization` when fetching certificates. The existing code should already include this since it returns the full `workflow_data` JSONB field.

---

## Data Flow

### Saving Flow:
```
User fills authorization form
    ↓
Clicks "📄 Generate & Preview Certificate"
    ↓
handlePreviewCertificate() called
    ↓
POST /api/workflow-session/update-authorization
    ↓
Saves to workflow_sessions.data.authorization
Saves to workflow_completions.workflow_data.authorization
    ↓
Also saves to localStorage (immediate backup)
    ↓
Certificate preview displays with data
```

### Loading Flow (from Dashboard):
```
User selects certificate from dashboard dropdown
    ↓
Dashboard loads workflow_completions record
    ↓
loadSavedWorkflow() called with workflow data
    ↓
results.authorization = workflowData.authorization
    ↓
usmca-certificate-completion.js loads
    ↓
Reads parsedResults.authorization (from database)
    ↓
Falls back to localStorage if database empty
    ↓
restoredAuthData populated
    ↓
setCertificateData() merges authorization
    ↓
AuthorizationStep auto-fills all fields
    ↓
Certificate preview shows saved data
```

## Testing Checklist

- [ ] Complete USMCA workflow (Steps 1-3)
- [ ] Navigate to authorization page
- [ ] Fill in all authorization fields:
  - Signatory name
  - Signatory title
  - Importer name, address, country
  - Producer details (if applicable)
- [ ] Click "Generate & Preview Certificate"
- [ ] Verify authorization data saves to database (check console logs)
- [ ] Certificate preview displays with correct data
- [ ] Navigate to dashboard
- [ ] Select the certificate from dropdown
- [ ] Verify authorization fields are pre-filled (NOT empty)
- [ ] Verify certificate preview displays correctly
- [ ] User can edit and download without re-entering data

## Database Verification

```sql
-- Check if authorization data was saved
SELECT
  id,
  company_name,
  data->'authorization'->>'signatory_name' as signatory,
  data->'authorization'->>'importer_name' as importer,
  completed_at
FROM workflow_sessions
WHERE user_id = 'USER_ID'
ORDER BY completed_at DESC
LIMIT 1;

-- Also check workflow_completions
SELECT
  id,
  company_name,
  workflow_data->'authorization'->>'signatory_name' as signatory,
  workflow_data->'authorization'->>'importer_name' as importer,
  completed_at
FROM workflow_completions
WHERE user_id = 'USER_ID'
ORDER BY completed_at DESC
LIMIT 1;
```

## Expected Console Logs

When saving:
```
💾 [SAVE-AUTHORIZATION] Saving authorization data to database
✅ [UPDATE-AUTHORIZATION] Updated workflow_sessions: <session_id>
✅ [UPDATE-AUTHORIZATION] Updated workflow_completions: <completion_id>
✅ [CERTIFICATE-COMPLETION] Authorization data saved to database
```

When loading from dashboard:
```
📂 Loading saved workflow: <workflow>
✅ [CERTIFICATE-COMPLETION] Restoring authorization from: database
✅ Restored authorization data: {signatory_name: "...", importer_name: "..."}
```

## Status
- ✅ API endpoint created (`/api/workflow-session/update-authorization`)
- ⏳ Save call needs to be added to `handlePreviewCertificate()`
- ⏳ Load logic needs to prioritize database over localStorage
- ⏳ useWorkflowState hook needs to include authorization in results
- ⏳ Testing required

## Notes
- Authorization data is saved to BOTH `workflow_sessions` and `workflow_completions` for redundancy
- Database data takes priority over localStorage to ensure latest data is used
- localStorage remains as fallback for immediate UX (before database write completes)
- Certificate preview (EditableCertificatePreview) receives data via props from usmca-certificate-completion page
