#!/bin/bash
# DUPLICATE COMPONENT DETECTION AUDIT
# Run this before committing to catch duplicate tables/components

echo "🔍 Scanning for duplicate component tables..."
echo ""

# Find all component tables in results files
echo "=== COMPONENT ANALYSIS TABLES ==="
grep -r "Component.*Analysis\|component.*breakdown\|component_breakdown" \
  components/workflow/results \
  --include="*.js" \
  -l

echo ""
echo "=== CHECKING FOR DUPLICATE RENDERING ==="

# Check WorkflowResults for inline tables that should use components
if grep -q "results.usmca?.component_breakdown" components/workflow/WorkflowResults.js; then
  echo "⚠️  WorkflowResults has inline component_breakdown table - CHECK if component is also imported"
  grep -n "import.*Qualification\|import.*Tariff\|component_breakdown" components/workflow/WorkflowResults.js | head -5
fi

echo ""
echo "=== COMPONENT IMPORTS IN RESULTS ==="
grep "^import" components/workflow/WorkflowResults.js | grep -i "qualification\|tariff\|component"

echo ""
echo "✅ Run this before each commit to catch duplicates"
