/**
 * BUTTON FUNCTIONALITY AUDIT TOOL
 * Automatically detects non-functional buttons across the Mexico Trade Bridge project
 * Identifies missing onClick handlers, empty functions, and placeholder implementations
 */

const fs = require('fs');
const path = require('path');

class ButtonAuditor {
  constructor() {
    this.results = {
      nonFunctionalButtons: [],
      emptyHandlers: [],
      placeholderFunctions: [],
      missingImplementations: [],
      summary: {}
    };
    this.fileCount = 0;
    this.buttonCount = 0;
  }

  // Scan all React/JS files in the project
  async auditProject() {
    console.log('🔍 Starting Button Functionality Audit...\n');

    const directories = [
      'pages',
      'components',
      'pages/admin',
      'pages/api'
    ];

    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        await this.scanDirectory(dir);
      }
    }

    this.generateReport();
    return this.results;
  }

  // Recursively scan directory for React/JS files
  async scanDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        await this.scanDirectory(fullPath);
      } else if (this.isReactFile(item)) {
        await this.analyzeFile(fullPath);
      }
    }
  }

  // Check if file is a React/JS file we should analyze
  isReactFile(filename) {
    return /\.(js|jsx|ts|tsx)$/.test(filename) &&
           !filename.includes('.test.') &&
           !filename.includes('.spec.');
  }

  // Analyze individual file for button functionality issues
  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.fileCount++;

      console.log(`📄 Analyzing: ${filePath}`);

      // Pattern 1: Buttons with no onClick handler
      this.findButtonsWithoutHandlers(filePath, content);

      // Pattern 2: Buttons with empty onClick handlers
      this.findButtonsWithEmptyHandlers(filePath, content);

      // Pattern 3: Functions with placeholder implementations
      this.findPlaceholderImplementations(filePath, content);

      // Pattern 4: TODO comments indicating missing functionality
      this.findMissingImplementations(filePath, content);

    } catch (error) {
      console.error(`❌ Error analyzing ${filePath}:`, error.message);
    }
  }

  // Find buttons without onClick handlers
  findButtonsWithoutHandlers(filePath, content) {
    // Pattern: <button> without onClick
    const buttonRegex = /<button[^>]*>/g;
    const onClickRegex = /onClick\s*=/;

    let match;
    while ((match = buttonRegex.exec(content)) !== null) {
      this.buttonCount++;
      const buttonTag = match[0];

      if (!onClickRegex.test(buttonTag)) {
        const lineNumber = this.getLineNumber(content, match.index);

        this.results.nonFunctionalButtons.push({
          file: filePath,
          line: lineNumber,
          button: buttonTag.substring(0, 100) + '...',
          issue: 'No onClick handler',
          severity: 'high'
        });
      }
    }
  }

  // Find buttons with empty or placeholder onClick handlers
  findButtonsWithEmptyHandlers(filePath, content) {
    // Pattern: onClick={() => {}} or onClick={handleSomething} where handleSomething is empty
    const emptyOnClickPatterns = [
      /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/g,
      /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*console\.log\(/g,
      /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*alert\(/g,
      /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\/\/\s*TODO/g
    ];

    emptyOnClickPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);

        this.results.emptyHandlers.push({
          file: filePath,
          line: lineNumber,
          handler: match[0],
          issue: 'Empty or placeholder onClick handler',
          severity: 'medium'
        });
      }
    });
  }

  // Find functions with placeholder implementations
  findPlaceholderImplementations(filePath, content) {
    const placeholderPatterns = [
      /const\s+\w+\s*=\s*\(\s*\)\s*=>\s*\{\s*\/\/\s*TODO/g,
      /function\s+\w+\s*\([^)]*\)\s*\{\s*\/\/\s*TODO/g,
      /const\s+\w+\s*=\s*\(\s*\)\s*=>\s*\{\s*console\.log\(/g,
      /const\s+\w+\s*=\s*\(\s*\)\s*=>\s*\{\s*alert\(/g,
      /const\s+\w+\s*=\s*\(\s*\)\s*=>\s*\{\s*\}/g
    ];

    placeholderPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);

        this.results.placeholderFunctions.push({
          file: filePath,
          line: lineNumber,
          function: match[0].substring(0, 100) + '...',
          issue: 'Placeholder function implementation',
          severity: 'medium'
        });
      }
    });
  }

  // Find TODO comments indicating missing functionality
  findMissingImplementations(filePath, content) {
    const todoRegex = /\/\/\s*TODO:?\s*(.+)/g;

    let match;
    while ((match = todoRegex.exec(content)) !== null) {
      const lineNumber = this.getLineNumber(content, match.index);

      this.results.missingImplementations.push({
        file: filePath,
        line: lineNumber,
        todo: match[1].trim(),
        issue: 'Missing implementation (TODO)',
        severity: 'low'
      });
    }
  }

  // Get line number for a character index
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 BUTTON FUNCTIONALITY AUDIT REPORT');
    console.log('='.repeat(80));

    // Summary
    const totalIssues = this.results.nonFunctionalButtons.length +
                       this.results.emptyHandlers.length +
                       this.results.placeholderFunctions.length +
                       this.results.missingImplementations.length;

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Files Analyzed: ${this.fileCount}`);
    console.log(`   Buttons Found: ${this.buttonCount}`);
    console.log(`   Total Issues: ${totalIssues}`);
    console.log(`   Non-functional Buttons: ${this.results.nonFunctionalButtons.length}`);
    console.log(`   Empty Handlers: ${this.results.emptyHandlers.length}`);
    console.log(`   Placeholder Functions: ${this.results.placeholderFunctions.length}`);
    console.log(`   Missing Implementations: ${this.results.missingImplementations.length}`);

    // Top Priority Issues
    console.log(`\n🚨 HIGH PRIORITY - Non-functional Buttons:`);
    this.results.nonFunctionalButtons.slice(0, 10).forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.file}:${issue.line}`);
      console.log(`      Issue: ${issue.issue}`);
      console.log(`      Button: ${issue.button.substring(0, 50)}...`);
    });

    // Empty Handlers
    console.log(`\n⚠️  MEDIUM PRIORITY - Empty Handlers:`);
    this.results.emptyHandlers.slice(0, 5).forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.file}:${issue.line}`);
      console.log(`      Handler: ${issue.handler.substring(0, 50)}...`);
    });

    // Save detailed report
    this.results.summary = {
      filesAnalyzed: this.fileCount,
      buttonsFound: this.buttonCount,
      totalIssues: totalIssues,
      timestamp: new Date().toISOString()
    };

    const reportPath = 'button-functionality-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);

    console.log('\n' + '='.repeat(80));
  }
}

// Export for use in other scripts
module.exports = ButtonAuditor;

// Run if called directly
if (require.main === module) {
  const auditor = new ButtonAuditor();
  auditor.auditProject().then(() => {
    console.log('✅ Button functionality audit complete!');
  }).catch(error => {
    console.error('❌ Audit failed:', error);
  });
}