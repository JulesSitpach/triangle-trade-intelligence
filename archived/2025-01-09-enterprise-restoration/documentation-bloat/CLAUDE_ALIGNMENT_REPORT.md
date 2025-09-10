# CLAUDE.md Alignment Report
*Generated: September 1, 2025*

## Executive Summary
The CLAUDE.md file (1,223 lines) contains significant outdated information and misalignments with the current codebase. While the core concepts remain valid, many specific details need updating.

## Key Findings

### ✅ ALIGNED AREAS

1. **Core Technology Stack**
   - Next.js 13.5.6, React 18.2.0, Supabase - All match package.json
   - i18next for internationalization - Confirmed
   - Tailwind CSS configuration - Present

2. **Trust API Microservices**
   - All 8 trust endpoints exist as documented:
     - complete-workflow.js
     - complete-certificate.js
     - data-provenance.js
     - expert-validation.js
     - trust-metrics.js
     - trust-metrics-lightweight.js
     - success-stories.js
     - case-studies.js

3. **Core API Endpoints**
   - database-driven-usmca-compliance.js ✅
   - database-driven-dropdown-options.js ✅
   - simple-classification.js ✅
   - simple-dropdown-options.js ✅
   - simple-savings.js ✅
   - simple-usmca-compliance.js ✅

4. **Workflow Components**
   - USMCAWorkflowOrchestrator.js exists
   - CompanyInformationStep.js exists (also CompanyInfoStep.js - duplicate?)
   - ComponentOriginsStepEnhanced.js exists
   - WorkflowResults.js exists

### ❌ MISALIGNED/OUTDATED AREAS

1. **Missing Intelligence APIs**
   - CLAUDE.md mentions `/api/intelligence/*` endpoints
   - Reality: `pages/api/intelligence/` directory doesn't exist
   - Listed as "TO BE IMPLEMENTED" but presented as active

2. **API Count Discrepancy**
   - CLAUDE.md claims "35 active endpoints"
   - Reality: 37 JS files in pages/api/

3. **Database Schema Issues**
   - SQL files mentioned exist but appear outdated:
     - crisis-pivot-schema.sql
     - missing-products-schema.sql
     - tariff-monitoring-schema.sql
     - unified-tariff-view.sql
   - No core schema files like mentioned "core-schema.sql" or "simple-usmca-schema.sql"

4. **Duplicate/Confusing Components**
   - Multiple similar components exist:
     - CompanyInformationStep.js vs CompanyInfoStep.js
     - ComponentOriginsStep.js vs ComponentOriginsStepEnhanced.js
     - ProductDetailsStep.js vs ProductInformationStep.js

5. **Build Scripts Mismatch**
   - CLAUDE.md mentions scripts that don't exist in package.json:
     - "ingest:hs-codes" maps to non-existent file
     - "ingest:us-tariffs" maps to non-existent file

6. **Services Not Mentioned**
   - Many services exist but aren't documented:
     - crisis-calculator-service.js
     - crisis-config-service.js
     - crisis-messaging-service.js
     - trump-tariff-monitor-service.js
     - professional-validation-service.js

7. **Outdated Status Claims**
   - Claims "PRODUCTION READY" but intelligence APIs missing
   - Says "34,476 comprehensive government records" - needs verification
   - "44% complexity reduction" - metric unclear

8. **Configuration Files**
   - References non-existent config/trust-config.js
   - Actual config directory exists but contents differ

## Recommendations for CLAUDE.md Cleanup

### 1. **Remove or Update Intelligence APIs Section**
```markdown
#### Intelligence APIs (Not Yet Implemented)
- `/api/intelligence/hs-codes` - Planned
- `/api/intelligence/routing` - Planned
- `/api/intelligence/shipping` - Planned
- `/api/intelligence/tariffs` - Planned
```

### 2. **Clarify Duplicate Components**
- Document which components are actively used
- Mark deprecated ones clearly
- Explain the Enhanced vs standard versions

### 3. **Update Database Documentation**
- Remove references to non-existent schema files
- Focus on actual table structure (hs_master_rebuild)
- Update row counts with actual numbers

### 4. **Simplify Claims**
- Remove specific metrics that can't be verified
- Focus on actual implemented features
- Update status to reflect missing components

### 5. **Add Missing Services**
- Document crisis-related services
- Include Trump tariff monitoring
- Professional validation services

### 6. **Fix Script References**
- Update or remove non-existent ingestion scripts
- Document actual available scripts

### 7. **Consolidate Redundant Sections**
- Multiple sections repeat the same information
- Combine microservices descriptions
- Remove duplicate configuration examples

## Proposed Structure for Cleaned CLAUDE.md

1. **Overview** (50 lines)
   - What the platform does
   - Current state
   - Tech stack

2. **Project Structure** (100 lines)
   - Directory layout
   - Key components
   - API endpoints (actual list)

3. **Development Setup** (50 lines)
   - Environment variables
   - Database connection
   - Running locally

4. **API Documentation** (200 lines)
   - Trust microservices
   - Core APIs
   - Utility endpoints

5. **Testing & Deployment** (50 lines)
   - Test commands
   - Build process
   - Deployment notes

6. **Known Issues & TODOs** (50 lines)
   - Missing features
   - Planned improvements
   - Current limitations

**Target: ~500 lines (vs current 1,223)**

## Priority Actions

1. **Immediate**: Remove/update false claims about intelligence APIs
2. **High**: Clarify which components are actually used
3. **Medium**: Update database documentation to match reality
4. **Low**: Consolidate redundant sections

## Conclusion

The CLAUDE.md file contains valuable documentation but needs significant cleanup to match the current codebase reality. About 40% of the content is outdated or misaligned. A cleaned, accurate version would be more helpful and about 60% shorter.