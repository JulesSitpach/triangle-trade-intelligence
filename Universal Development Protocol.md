Here's the updated Universal Development Protocol with full-stack alignment requirements:

## Universal Development Protocol - Full Stack Alignment

Create this file: `.claude/development-protocol.md`

```bash
# MANDATORY DEVELOPMENT SEQUENCE - FULL STACK ALIGNMENT

## Phase 1: Foundation Testing
claude test database-connection --verify-supabase
claude test auth-system --verify-user-roles  
claude test environment-variables --verify-all-required

# BLOCKER: Cannot proceed until ALL Phase 1 tests pass

## Phase 2: Full-Stack Component Development
FOR EACH FEATURE (USMCACertificateTab, HSClassificationTab, etc.):

Step 1: Database Schema Alignment
claude verify database-schema --feature=${FEATURE_NAME}
claude test database-queries --feature=${FEATURE_NAME} --verify-real-data

Step 2: API Endpoint Development
claude build api --endpoint=${API_NAME} --align-with-database
claude test api --endpoint=${API_NAME} --verify-database-writes
claude test api --endpoint=${API_NAME} --verify-database-reads

Step 3: Frontend Component Development
claude build component --name=${COMPONENT_NAME} --align-with-api
claude test component --name=${COMPONENT_NAME} --verify-api-integration
claude test component --name=${COMPONENT_NAME} --verify-data-display

Step 4: Full-Stack Integration Testing
claude test full-stack --feature=${FEATURE_NAME} --trace-data-flow
# This must trace: UI → API → Database → API → UI

Step 5: Data Consistency Verification
claude verify data-consistency --feature=${FEATURE_NAME}
# Ensure UI displays exactly what database contains

Step 6: User Flow Testing
claude test user-flow --feature=${FEATURE_NAME} --verify-end-to-end
# Test complete user journey with real data

# BLOCKER: Cannot start next feature until current one passes ALL 6 steps

## Phase 3: Cross-Stack Validation
claude test database-ui-alignment --verify-all-features
claude test api-consistency --verify-all-endpoints
claude test data-flow-integrity --verify-subscriber-data-usage
```

## Full-Stack Alignment Enforcement

Create: `scripts/full-stack-verification.js`

```javascript
const verifyFullStackAlignment = async (feature) => {
  console.log(`Verifying full-stack alignment for ${feature}...`);
  
  // Step 1: Verify database schema supports feature
  const schemaCheck = await verifyDatabaseSchema(feature);
  if (!schemaCheck.valid) {
    throw new Error(`Database schema invalid for ${feature}: ${schemaCheck.errors}`);
  }
  
  // Step 2: Verify API aligns with database
  const apiCheck = await verifyAPIAlignment(feature);
  if (!apiCheck.valid) {
    throw new Error(`API doesn't align with database for ${feature}: ${apiCheck.errors}`);
  }
  
  // Step 3: Verify UI aligns with API
  const uiCheck = await verifyUIAlignment(feature);
  if (!uiCheck.valid) {
    throw new Error(`UI doesn't align with API for ${feature}: ${uiCheck.errors}`);
  }
  
  // Step 4: Verify data flows correctly through entire stack
  const dataFlowCheck = await verifyDataFlow(feature);
  if (!dataFlowCheck.valid) {
    throw new Error(`Data flow broken for ${feature}: ${dataFlowCheck.errors}`);
  }
  
  console.log(`✅ Full-stack alignment verified for ${feature}`);
  return true;
};

const verifyDatabaseSchema = async (feature) => {
  // Check if required tables exist
  const requiredTables = getRequiredTables(feature);
  const requiredColumns = getRequiredColumns(feature);
  
  for (const table of requiredTables) {
    const exists = await checkTableExists(table);
    if (!exists) {
      return { valid: false, errors: [`Table ${table} missing`] };
    }
  }
  
  for (const [table, columns] of requiredColumns) {
    const missingColumns = await checkColumnsExist(table, columns);
    if (missingColumns.length > 0) {
      return { valid: false, errors: [`Missing columns in ${table}: ${missingColumns.join(', ')}`] };
    }
  }
  
  return { valid: true };
};

const verifyAPIAlignment = async (feature) => {
  const apiEndpoint = getAPIEndpoint(feature);
  const testData = getTestData(feature);
  
  // Test API creates database records correctly
  const createResponse = await fetch(apiEndpoint, {
    method: 'POST',
    body: JSON.stringify(testData)
  });
  
  if (!createResponse.ok) {
    return { valid: false, errors: ['API endpoint not responding'] };
  }
  
  // Verify data was actually written to database
  const dbRecord = await checkDatabaseRecord(feature, testData);
  if (!dbRecord) {
    return { valid: false, errors: ['API not writing to database'] };
  }
  
  // Verify API reads return correct data
  const readResponse = await fetch(`${apiEndpoint}/${dbRecord.id}`);
  const apiData = await readResponse.json();
  
  if (!compareData(apiData, dbRecord)) {
    return { valid: false, errors: ['API returning different data than database contains'] };
  }
  
  return { valid: true };
};

const verifyUIAlignment = async (feature) => {
  const component = getComponent(feature);
  const testData = getTestData(feature);
  
  // Test component renders API data correctly
  const renderedComponent = render(component, { data: testData });
  
  // Verify UI displays all required fields
  const requiredFields = getRequiredUIFields(feature);
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!renderedComponent.contains(testData[field])) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    return { valid: false, errors: [`UI not displaying: ${missingFields.join(', ')}`] };
  }
  
  return { valid: true };
};

const verifyDataFlow = async (feature) => {
  // Test complete data flow: UI action → API → Database → API → UI
  const initialData = getTestData(feature);
  
  // Simulate UI action
  const uiAction = simulateUIAction(feature, initialData);
  
  // Verify API receives correct data
  const apiReceived = await captureAPIRequest(uiAction);
  if (!compareData(initialData, apiReceived)) {
    return { valid: false, errors: ['UI not sending correct data to API'] };
  }
  
  // Verify database stores correct data
  const dbStored = await captureDatabaseWrite(apiReceived);
  if (!compareData(apiReceived, dbStored)) {
    return { valid: false, errors: ['API not storing correct data in database'] };
  }
  
  // Verify UI displays updated data
  const uiDisplayed = await captureUIUpdate(dbStored);
  if (!compareData(dbStored, uiDisplayed)) {
    return { valid: false, errors: ['UI not displaying updated data correctly'] };
  }
  
  return { valid: true };
};
```

## Feature-Specific Alignment Tests

```bash
# For each feature, create alignment verification
claude create-alignment-test --feature=SupplierSourcing --verify-stack

# This creates:
# 1. Database schema requirements
# 2. API contract specification  
# 3. UI data requirements
# 4. Full data flow test
```

## Mandatory Alignment Checkpoints

```bash
# Before any "completion" claim:
claude verify-alignment --feature=${FEATURE_NAME} --full-stack

# This must verify:
# - Database schema supports the feature
# - API correctly reads/writes database
# - UI correctly displays API data
# - Complete user journey works with real data
# - No mock/template data anywhere in the stack
```

## Blocking Conditions

The agent cannot claim completion unless:

1. **Database Proof**: Real schema exists with required tables/columns
2. **API Proof**: Endpoint actually reads/writes to real database
3. **UI Proof**: Component displays real data from API calls
4. **Integration Proof**: Complete user flow works end-to-end
5. **Data Consistency**: UI shows exactly what database contains

This prevents the agent from building isolated layers that don't actually work together or showing mock data when claiming real functionality.