#!/usr/bin/env node
/**
 * GLOBAL FIELD NAME FIX
 * Fixes all instances of wrong field names across the entire codebase
 */

const fs = require('fs');
const path = require('path');

const FIELD_FIXES = {
  // Wrong → Correct
  'annual_trade_volume': 'trade_volume',
  'export_destination': 'destination_country',
  'primary_supplier_country': 'supplier_country',
  'primary_supplier': 'supplier_country'
};

const filesToFix = [
  'pages/trade-risk-alternatives.js',
  'pages/api/ai-usmca-complete-analysis.js',
  'components/workflow/WorkflowResults.js',
  'components/workflow/USMCAWorkflowOrchestrator.js',
  'pages/api/admin/service-requests.js',
  'lib/validation.js',
  'types/data-contracts.ts',
  'pages/api/consolidate-alerts.js',
  'pages/services/request-form.js',
  'pages/intake/[projectId].js',
  'pages/api/enhance-component-details.js',
  'pages/api/dashboard-data.js',
  'pages/api/ai-vulnerability-alerts.js',
  'lib/tariff/hts-lookup.js',
  'lib/services/workflow-data-connector.js',
  'lib/services/workflow-data-capture-service.js',
  'components/workflow/results/RecommendedActions.js',
  'components/workflow/results/USMCAQualification.js',
  'components/workflow/CrisisCalculatorResults.js',
  'components/workflow/AuthorizationStep.js',
  'components/workflow/AlertsSubscriptionFlow.js',
  'components/shared/TradeHealthCheckTab.js'
];

let totalFixes = 0;
let filesModified = 0;

console.log('🔧 FIXING ALL FIELD NAMES ACROSS CODEBASE\n');

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, '..', file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${file} (not found)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let fileFixCount = 0;

  Object.entries(FIELD_FIXES).forEach(([wrong, correct]) => {
    // Fix both formData.wrong and just wrong (in object destructuring, etc.)
    const patterns = [
      new RegExp(`formData\\.${wrong}`, 'g'),
      new RegExp(`company\\.${wrong}`, 'g'),
      new RegExp(`data\\.${wrong}`, 'g'),
      new RegExp(`\\b${wrong}\\b(?=\\s*:)`, 'g')  // In object keys like { annual_trade_volume: ... }
    ];

    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, (match) => {
          return match.replace(wrong, correct);
        });
        fileFixCount += matches.length;
        modified = true;
      }
    });
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${fileFixCount} occurrences in ${file}`);
    totalFixes += fileFixCount;
    filesModified++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`✅ COMPLETE: Fixed ${totalFixes} field names across ${filesModified} files`);
console.log('='.repeat(60));
console.log('\nField mappings applied:');
Object.entries(FIELD_FIXES).forEach(([wrong, correct]) => {
  console.log(`  ${wrong} → ${correct}`);
});
console.log('\n💡 Run git diff to review changes before committing');
