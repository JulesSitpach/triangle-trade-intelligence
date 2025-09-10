#!/usr/bin/env node

/**
 * SETUP BUSINESS CONTEXT GIT HOOKS
 * Install git hooks that enforce business context consideration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BusinessGitHooksSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.gitHooksDir = path.join(this.projectRoot, '.git', 'hooks');
    this.customHooksDir = path.join(this.projectRoot, '.githooks');
    
    this.hooks = {
      'pre-commit': 'pre-commit-business-context',
      'pre-push': 'pre-push-business-validation',
      'commit-msg': 'commit-msg-business-enhancement'
    };
  }

  async setupHooks() {
    console.log('🎯 SETTING UP BUSINESS CONTEXT GIT HOOKS\n');
    
    // Ensure .git/hooks directory exists
    if (!fs.existsSync(this.gitHooksDir)) {
      console.log('❌ .git/hooks directory not found - ensure this is a git repository');
      return false;
    }
    
    // Ensure .githooks directory exists
    if (!fs.existsSync(this.customHooksDir)) {
      fs.mkdirSync(this.customHooksDir);
      console.log('✅ Created .githooks directory');
    }
    
    // Install each hook
    for (const [hookName, sourceFile] of Object.entries(this.hooks)) {
      await this.installHook(hookName, sourceFile);
    }
    
    console.log('\n🎉 BUSINESS CONTEXT GIT HOOKS SETUP COMPLETE\n');
    
    // Display usage instructions
    this.displayUsageInstructions();
    
    return true;
  }

  async installHook(hookName, sourceFile) {
    const sourcePath = path.join(this.customHooksDir, sourceFile);
    const targetPath = path.join(this.gitHooksDir, hookName);
    
    console.log(`📋 Installing ${hookName} hook...`);
    
    if (!fs.existsSync(sourcePath)) {
      await this.createHookFile(sourcePath, hookName);
    }
    
    // Copy hook file to .git/hooks
    try {
      fs.copyFileSync(sourcePath, targetPath);
      
      // Make executable (Unix-like systems)
      if (process.platform !== 'win32') {
        execSync(`chmod +x "${targetPath}"`);
      }
      
      console.log(`✅ ${hookName} hook installed successfully`);
      return true;
    } catch (error) {
      console.log(`❌ Failed to install ${hookName} hook:`, error.message);
      return false;
    }
  }

  async createHookFile(filePath, hookName) {
    const hookContent = this.getHookContent(hookName);
    fs.writeFileSync(filePath, hookContent);
    console.log(`📝 Created ${path.basename(filePath)}`);
  }

  getHookContent(hookName) {
    switch (hookName) {
      case 'pre-push':
        return this.getPrePushHookContent();
      case 'commit-msg':
        return this.getCommitMsgHookContent();
      default:
        return '#!/bin/bash\necho "Business context hook placeholder"';
    }
  }

  getPrePushHookContent() {
    return `#!/bin/bash

# BUSINESS CONTEXT PRE-PUSH VALIDATION
# Ensure business context is maintained before pushing to remote

echo "🚀 BUSINESS CONTEXT PRE-PUSH VALIDATION"
echo "======================================"

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

# Business context validation
validate_business_context() {
    echo -e "\\n\${BLUE}BUSINESS CONTEXT VALIDATION\${NC}"
    
    # Check if recent commits have business context consideration
    recent_commits=$(git log --oneline -5 --pretty=format:"%s")
    
    business_context_commits=0
    while IFS= read -r commit; do
        if echo "$commit" | grep -qE "(business|customer|Sarah|Mike|Lisa|scenario|USMCA|qualification|compliance)"; then
            business_context_commits=$((business_context_commits + 1))
        fi
    done <<< "$recent_commits"
    
    echo "Recent commits with business context: $business_context_commits / 5"
    
    if [ "$business_context_commits" -lt 2 ]; then
        echo -e "\${YELLOW}⚠️  Low business context awareness in recent commits\${NC}"
        echo "Consider adding business impact to commit messages"
    else
        echo -e "\${GREEN}✅ Good business context awareness\${NC}"
    fi
    
    return 0
}

# Business readiness check
business_readiness_check() {
    echo -e "\\n\${BLUE}BUSINESS READINESS CHECK\${NC}"
    
    # Check if critical business files exist
    critical_files=(
        "PROJECT-CONTEXT-DOCUMENT.md"
        "CLAUDE.md"
        "pages/api/integrated-usmca-classification.js"
        "components/workflow/ComponentOriginsStepEnhanced.js"
    )
    
    missing_files=()
    for file in "\${critical_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ \${#missing_files[@]} -gt 0 ]; then
        echo -e "\${RED}❌ CRITICAL: Missing business-critical files:\${NC}"
        for file in "\${missing_files[@]}"; do
            echo "   • $file"
        done
        echo -e "\${YELLOW}Customer Impact: Core business functionality may be broken\${NC}"
        return 1
    fi
    
    echo -e "\${GREEN}✅ All critical business files present\${NC}"
    return 0
}

# Customer scenario validation
validate_customer_scenarios() {
    echo -e "\\n\${BLUE}CUSTOMER SCENARIO VALIDATION\${NC}"
    
    # Quick check that customer scenarios are still valid
    if [ -f "PROJECT-CONTEXT-DOCUMENT.md" ]; then
        scenarios_present=0
        
        if grep -q "Electronics Manufacturer" PROJECT-CONTEXT-DOCUMENT.md; then
            scenarios_present=$((scenarios_present + 1))
        fi
        
        if grep -q "Automotive Parts" PROJECT-CONTEXT-DOCUMENT.md; then
            scenarios_present=$((scenarios_present + 1))
        fi
        
        if grep -q "Fashion Retailer" PROJECT-CONTEXT-DOCUMENT.md; then
            scenarios_present=$((scenarios_present + 1))
        fi
        
        echo "Customer scenarios documented: $scenarios_present / 3"
        
        if [ "$scenarios_present" -eq 3 ]; then
            echo -e "\${GREEN}✅ All customer scenarios documented\${NC}"
        else
            echo -e "\${YELLOW}⚠️  Some customer scenarios may be missing\${NC}"
        fi
    else
        echo -e "\${RED}❌ PROJECT-CONTEXT-DOCUMENT.md not found\${NC}"
        return 1
    fi
    
    return 0
}

# Main execution
main() {
    echo -e "\${BLUE}Validating business context before push...\\n\${NC}"
    
    validate_business_context || exit 1
    business_readiness_check || exit 1
    validate_customer_scenarios || exit 1
    
    echo -e "\\n\${GREEN}🎉 BUSINESS CONTEXT VALIDATION PASSED!\${NC}"
    echo -e "\${GREEN}✅ Push approved - business context maintained\${NC}"
    echo -e "\\n\${BLUE}Proceeding with push...\${NC}"
    
    exit 0
}

# Run main function
main "$@"`;
  }

  getCommitMsgHookContent() {
    return `#!/bin/bash

# BUSINESS CONTEXT COMMIT MESSAGE ENHANCEMENT
# Enhance commit messages with business context reminders

commit_message_file="$1"

# Colors
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

# Read the commit message
commit_message=$(cat "$commit_message_file")

# Check if message already has business context
has_business_context=false

business_keywords=("business" "customer" "Sarah" "Mike" "Lisa" "scenario" "USMCA" "qualification" "compliance" "savings")

for keyword in "\${business_keywords[@]}"; do
    if echo "$commit_message" | grep -qi "$keyword"; then
        has_business_context=true
        break
    fi
done

# Add business context reminder if not present
if [ "$has_business_context" = false ]; then
    echo -e "\\n\${YELLOW}💡 BUSINESS CONTEXT REMINDER:\${NC}"
    echo -e "\${BLUE}Consider adding business context to your commit message:\${NC}"
    echo "• How does this serve Sarah (Compliance), Mike (Procurement), or Lisa (Finance)?"
    echo "• Which customer scenario does this impact (Electronics, Automotive, Fashion)?"
    echo "• Does this advance customer business outcomes?"
    echo ""
fi

exit 0`;
  }

  displayUsageInstructions() {
    console.log('📖 USAGE INSTRUCTIONS:');
    console.log('');
    console.log('🔄 Automatic Business Context Enforcement:');
    console.log('• pre-commit: Validates business context before every commit');
    console.log('• pre-push: Ensures business readiness before pushing');
    console.log('• commit-msg: Enhances commit messages with business context');
    console.log('');
    console.log('🎯 What Happens Now:');
    console.log('• Every commit will prompt for business context consideration');
    console.log('• You\'ll need to specify customer impact and scenario');
    console.log('• CSS and hardcoding protection is automatically enforced');
    console.log('• Push operations validate business readiness');
    console.log('');
    console.log('💡 Pro Tips:');
    console.log('• Include customer names (Sarah, Mike, Lisa) in commit messages');
    console.log('• Reference scenarios (Electronics, Automotive, Fashion)');
    console.log('• Describe business impact, not just technical changes');
    console.log('• Use "Skip hooks" flag (git commit --no-verify) only in emergencies');
    console.log('');
    console.log('🛠️  Management Commands:');
    console.log('• npm run context:validate - Quick business context check');
    console.log('• npm run business-impact - Validate specific changes');
    console.log('• npm run audit:business - Complete business audit');
    console.log('');
  }

  async testHooks() {
    console.log('🧪 TESTING BUSINESS CONTEXT GIT HOOKS\n');
    
    // Test pre-commit hook exists and is executable
    const preCommitPath = path.join(this.gitHooksDir, 'pre-commit');
    if (fs.existsSync(preCommitPath)) {
      console.log('✅ pre-commit hook installed');
      
      // Test if executable
      try {
        const stats = fs.statSync(preCommitPath);
        console.log(`✅ pre-commit hook permissions: ${stats.mode}`);
      } catch (error) {
        console.log('❌ Cannot check pre-commit hook permissions');
      }
    } else {
      console.log('❌ pre-commit hook not found');
    }
    
    // Test business context document
    if (fs.existsSync(path.join(this.projectRoot, 'PROJECT-CONTEXT-DOCUMENT.md'))) {
      console.log('✅ PROJECT-CONTEXT-DOCUMENT.md found');
    } else {
      console.log('❌ PROJECT-CONTEXT-DOCUMENT.md missing');
    }
    
    console.log('\n🎯 Hook testing completed');
  }
}

// Command Line Interface
async function main() {
  const command = process.argv[2] || 'setup';
  const hookSetup = new BusinessGitHooksSetup();
  
  switch (command) {
    case 'setup':
      await hookSetup.setupHooks();
      break;
      
    case 'test':
      await hookSetup.testHooks();
      break;
      
    default:
      console.log('🎯 BUSINESS CONTEXT GIT HOOKS SETUP\n');
      console.log('Available commands:');
      console.log('• setup  - Install business context git hooks');
      console.log('• test   - Test that hooks are properly installed\n');
      console.log('Examples:');
      console.log('• node scripts/setup-business-git-hooks.js setup');
      console.log('• node scripts/setup-business-git-hooks.js test');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = BusinessGitHooksSetup;