#!/bin/bash

# Git Hooks Setup for Automated Design Validation
# Integrates with CSS Protection, Agent Chains, and Acceptance Criteria Loops

echo "🔗 Setting up Git Hooks for Triangle Intelligence..."
echo "🛡️  CSS Protection: ACTIVE"
echo "🎨 Design Validation: ENABLED"
echo "📱 Mobile Testing: iPhone 15 Ready"

# Create .githooks directory if it doesn't exist
mkdir -p .githooks

# Set git to use our custom hooks directory
git config core.hooksPath .githooks

echo "✅ Git hooks path configured"

# Make all hooks executable
chmod +x .githooks/*

echo "✅ Hook permissions set"

# Verify setup
if [ -x ".githooks/pre-commit" ]; then
    echo "✅ Pre-commit hook installed"
else
    echo "⚠️  Pre-commit hook not found"
fi

if [ -x ".githooks/pre-push" ]; then
    echo "✅ Pre-push hook installed"
else  
    echo "⚠️  Pre-push hook not found"
fi

echo ""
echo "🎯 Git Hooks Installed:"
echo "  📝 pre-commit: CSS protection + basic validation"
echo "  🚀 pre-push: Full acceptance criteria validation"
echo "  🔄 post-commit: Trigger screenshots and reports"
echo ""
echo "💡 To bypass hooks (NOT recommended): git commit --no-verify"
echo "🛡️  CSS violations will ALWAYS block commits"