# Components Archive - January 10, 2025

This directory contains 16 unused React components that were safely archived from the main components/ directory.

## Archived Contents:

### crisis-alerts/ (6 components)
- CrisisAlertBanner.js - Alert banner component (no imports found)
- CrisisTariffAlertsPage.js - Crisis tariff page component (no imports found)
- CrisisTariffAlertsPageSimple.js - Simplified crisis page (no imports found)
- TrumpTariffAlertsPage.js - Trump tariff page component (no imports found)
- DynamicRSSAlerts.js - RSS alerts component (no imports found)
- PartnerSolutions.js - Partner solutions component (commented out import)

### refactoring-artifacts/ (6 components)
- GuidedProductInput.js - Original guided input (replaced)
- GuidedProductInputRefactored.js - Refactored version (unused)
- AIAnalysis.js - AI analysis component (only used by refactored chain)
- CategorySelector.js - Category selector (only used by refactored chain)
- HSCodeEntry.js - HS code entry (only used by refactored chain)
- ProductInput.js - Product input (only used by refactored chain)

### utilities/ (2 components)
- EmailTemplateGenerator.js - Email template utility (no imports found)
- RefactorTestPage.js - Test page component (no imports found)

## Remaining Active Components (26 components):

### Core System:
- TriangleLayout.js ✅ (Universal layout - 52+ references)
- Icons.js ✅ (Icon components)
- SimpleSavingsCalculator.js ✅ (Homepage calculator)

### Workflow System (9 components):
- USMCAWorkflowOrchestrator.js ✅ (Main orchestrator)
- WorkflowProgress.js ✅
- CompanyInformationStep.js ✅
- ComponentOriginsStepEnhanced.js ✅
- WorkflowResults.js ✅
- WorkflowLoading.js ✅
- WorkflowError.js ✅
- CrisisCalculatorResults.js ✅
- WorkflowPathSelection.js ✅

### Results Sub-Components (7 components):
- CompanyProfile.js ✅
- ProductClassification.js ✅
- DataSourceAttribution.js ✅
- USMCAQualification.js ✅
- TariffSavings.js ✅
- CertificateSection.js ✅
- RecommendedActions.js ✅

### Certificate Wizard (4 components):
- CertificateCompletionWizard.js ✅
- CompanyInfoStep.js ✅
- ProductDetailsStep.js ✅
- SupplyChainStep.js ✅

### Presentation System (3 components):
- SalesPresentation.js ✅
- PresentationExport.js ✅
- AlertsSubscriptionFlow.js ✅

## Recovery Instructions:

To restore any archived component:
```bash
# Restore individual component
cp archive-safe/2025-01-10-unused-files/unused-components/crisis-alerts/CrisisAlertBanner.js components/

# Restore entire crisis alerts system
cp -r archive-safe/2025-01-10-unused-files/unused-components/crisis-alerts/* components/
```

## Project Benefits After Cleanup:
- Reduced from 40 components to 26 active components (35% reduction)
- Removed unused crisis alert system duplicating page functionality
- Removed abandoned refactoring artifacts
- Cleaner component structure focused on core workflow
- All production functionality preserved

## Safety:
- No active components were removed
- All imports and dependencies verified before archival
- Git history preserved
- Can be restored at any time