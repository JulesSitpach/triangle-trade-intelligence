#!/usr/bin/env node
/**
 * SIMPLIFIED RUNTIME AUDIT
 * Just validates that formData fields are sent correctly to AI API
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 RUNTIME DATA FLOW AUDIT\n');
console.log('This audit validates field mappings between components and APIs\n');

const issues = [];

// 1. Check useWorkflowState formData structure
console.log('📋 Step 1: Analyzing useWorkflowState.js formData structure...\n');

const workflowStatePath = path.join(__dirname, '../hooks/useWorkflowState.js');
const workflowState = fs.readFileSync(workflowStatePath, 'utf8');

// Extract formData fields
const formDataMatch = workflowState.match(/const \[formData, setFormData\] = useState\({([\s\S]*?)\}\);/);
if (formDataMatch) {
  const formDataContent = formDataMatch[1];
  const fields = formDataContent
    .split(',')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//'))
    .map(line => line.split(':')[0].trim())
    .filter(field => field && !field.includes('{') && !field.includes('['));

  console.log('✅ Found formData fields:', fields);
  console.log('');

  // 2. Check ComponentOriginsStepEnhanced field mappings
  console.log('📋 Step 2: Analyzing ComponentOriginsStepEnhanced.js field mappings...\n');

  const componentPath = path.join(__dirname, '../components/workflow/ComponentOriginsStepEnhanced.js');
  const componentCode = fs.readFileSync(componentPath, 'utf8');

  // Find additionalContext structure
  const contextMatch = componentCode.match(/additionalContext: \{([\s\S]*?)\}/);
  if (contextMatch) {
    const contextContent = contextMatch[1];

    // Extract field mappings
    const mappings = {};
    const mappingRegex = /(\w+):\s*formData\.(\w+)/g;
    let match;
    while ((match = mappingRegex.exec(contextContent)) !== null) {
      mappings[match[1]] = match[2];
    }

    console.log('📤 Field mappings sent to AI:');
    Object.entries(mappings).forEach(([sentField, formDataField]) => {
      const exists = fields.includes(formDataField);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${sentField}: formData.${formDataField}${!exists ? ' (DOES NOT EXIST)' : ''}`);

      if (!exists) {
        issues.push({
          type: 'FIELD_MISMATCH',
          severity: 'CRITICAL',
          component: 'ComponentOriginsStepEnhanced',
          issue: `Sending formData.${formDataField} but field does not exist in formData`,
          sentAs: sentField,
          fix: `Check if field name should be different`
        });
      }
    });
  }

  console.log('');

  // 3. Check classification-agent.js expected fields
  console.log('📋 Step 3: Analyzing classification-agent.js expected fields...\n');

  const agentPath = path.join(__dirname, '../lib/agents/classification-agent.js');
  const agentCode = fs.readFileSync(agentPath, 'utf8');

  // Find prompt template
  const promptMatch = agentCode.match(/const prompt = `([\s\S]*?)`/);
  if (promptMatch) {
    const promptContent = promptMatch[1];

    // Extract expected context fields
    const expectedFields = [];
    const fieldRegex = /\$\{additionalContext\.(\w+)/g;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(promptContent)) !== null) {
      expectedFields.push(fieldMatch[1]);
    }

    console.log('🤖 AI expects these context fields:');
    expectedFields.forEach(field => {
      console.log(`   - ${field}`);
    });
  }

  console.log('');
}

// Generate report
console.log('=' .repeat(60));
console.log('📊 AUDIT RESULTS');
console.log('='.repeat(60));
console.log('');

if (issues.length === 0) {
  console.log('✅ NO ISSUES FOUND - All field mappings are correct!');
} else {
  console.log(`❌ FOUND ${issues.length} CRITICAL ISSUES:\n`);

  issues.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue.severity}: ${issue.issue}`);
    console.log(`   Component: ${issue.component}`);
    console.log(`   Sent as: ${issue.sentAs}`);
    console.log(`   Fix: ${issue.fix}`);
    console.log('');
  });

  // Save detailed report
  fs.writeFileSync(
    path.join(__dirname, '../RUNTIME-AUDIT-REPORT.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), issues }, null, 2)
  );

  console.log('📄 Detailed report saved to: RUNTIME-AUDIT-REPORT.json\n');
  process.exit(1);
}
