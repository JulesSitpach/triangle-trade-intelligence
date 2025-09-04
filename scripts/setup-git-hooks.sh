#!/bin/bash
# Setup script to install Triangle Intelligence hardcoding protection hooks

echo "🛡️ Setting up Triangle Intelligence Project Protection..."

# Configure git to use our hooks directory
git config core.hooksPath .githooks

echo "✅ Git hooks configured!"
echo ""
echo "🔍 Testing hardcoding detection..."

# Test the hook
.githooks/pre-commit

echo ""
echo "🛡️ Triangle Intelligence Protection Active!"
echo "• All commits will be scanned for hardcoding"
echo "• Hardcoded countries, rates, and HS codes will block commits"
echo "• Your project's enterprise value is now protected"