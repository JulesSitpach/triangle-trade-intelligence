# MANDATORY DEVELOPMENT SEQUENCE - FULL STACK ALIGNMENT

## Phase 1: Foundation Testing
```bash
claude test database-connection --verify-supabase
claude test auth-system --verify-user-roles
claude test environment-variables --verify-all-required
```

**BLOCKER: Cannot proceed until ALL Phase 1 tests pass**

## Phase 2: Full-Stack Component Development
FOR EACH FEATURE (USMCACertificateTab, HSClassificationTab, etc.):

### Step 1: Database Schema Alignment
```bash
claude verify database-schema --feature=${FEATURE_NAME}
claude test database-queries --feature=${FEATURE_NAME} --verify-real-data
```

### Step 2: API Endpoint Development
```bash
claude build api --endpoint=${API_NAME} --align-with-database
claude test api --endpoint=${API_NAME} --verify-database-writes
claude test api --endpoint=${API_NAME} --verify-database-reads
```

### Step 3: Frontend Component Development
```bash
claude build component --name=${COMPONENT_NAME} --align-with-api
claude test component --name=${COMPONENT_NAME} --verify-api-integration
claude test component --name=${COMPONENT_NAME} --verify-data-display
```

### Step 4: Full-Stack Integration Testing
```bash
claude test full-stack --feature=${FEATURE_NAME} --trace-data-flow
# This must trace: UI → API → Database → API → UI
```

### Step 5: Data Consistency Verification
```bash
claude verify data-consistency --feature=${FEATURE_NAME}
# Ensure UI displays exactly what database contains
```

### Step 6: User Flow Testing
```bash
claude test user-flow --feature=${FEATURE_NAME} --verify-end-to-end
# Test complete user journey with real data
```

**BLOCKER: Cannot start next feature until current one passes ALL 6 steps**

## Phase 3: Service Integration
```bash
claude test service-requests --verify-database-writes
claude test payment-flow --verify-stripe-integration
claude test email-notifications --verify-delivery
claude test pdf-generation --verify-file-creation
```

## Phase 4: Cross-Component Testing
```bash
claude test dashboard-integration --verify-all-tabs
claude test user-permissions --verify-jorge-cristina-access
claude test data-flow --verify-subscriber-data-usage
```

## Phase 5: Production Readiness
```bash
claude test error-handling --verify-graceful-failures
claude test security --verify-rls-policies
claude test performance --verify-load-handling
```

## Enforcement Commands

### Development with Protocol Enforcement
```bash
# Forces step-by-step verification
claude develop --enforce-protocol --component=USMCACertificateTab

# Blocks any "complete" claims without proof
claude verify --all-tests --component=USMCACertificateTab

# Traces every step of execution
claude test --trace-full-stack --component=USMCACertificateTab
```

### Integration Checkpoints
After each component:
```bash
# Verify nothing broke
claude test --regression --all-existing-components

# Verify new component integrates
claude test --integration --new-component=${COMPONENT_NAME}

# Verify production readiness
claude test --production-ready --component=${COMPONENT_NAME}
```

## Component Development Priority Order

1. **USMCACertificateTab** (Cristina) - Highest volume service
2. **HSClassificationTab** (Cristina) - Uses existing Enhanced Classification Agent
3. **CrisisResponseTab** (Cristina) - New workflow pattern
4. **ManufacturingFeasibilityTab** (Jorge) - Copy supplier sourcing pattern
5. **MarketEntryTab** (Jorge) - Copy supplier sourcing pattern

## Success Criteria

Each component must pass ALL tests before moving to next:
- ✅ Component renders without errors
- ✅ API responds with real data
- ✅ Integration produces working output
- ✅ End-to-end flow completes successfully
- ✅ Database operations work correctly
- ✅ No regressions in existing functionality

## Testing Requirements

### Real Data Validation
- No mock data allowed in production tests
- All APIs must connect to real Supabase database
- All external integrations must be tested
- All PDFs must be generated and accessible

### Performance Standards
- API responses < 400ms
- Database queries < 200ms
- Page loads < 3s
- Component renders < 100ms

### Error Handling
- Graceful degradation when services unavailable
- Clear error messages for users
- Proper logging for debugging
- Fallback mechanisms where appropriate