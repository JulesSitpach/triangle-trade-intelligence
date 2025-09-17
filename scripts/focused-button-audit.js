/**
 * FOCUSED BUTTON AUDIT - Last Night's Admin Dashboards
 * Only analyzes the 4 admin dashboards created last night that are actually being used
 */

const fs = require('fs');
const path = require('path');

class FocusedButtonAuditor {
  constructor() {
    this.results = {
      dashboards: {},
      summary: {}
    };

    // Only the dashboards created last night
    this.targetFiles = [
      'pages/admin/dev-dashboard.js',
      'pages/admin/client-portfolio.js',
      'pages/admin/broker-dashboard.js',
      'pages/admin/collaboration-workspace.js'
    ];
  }

  async auditActiveAdminDashboards() {
    console.log('🎯 Focused Button Audit - Last Night\'s Admin Dashboards\n');

    for (const filePath of this.targetFiles) {
      if (fs.existsSync(filePath)) {
        await this.analyzeAdminDashboard(filePath);
      } else {
        console.log(`⚠️  File not found: ${filePath}`);
      }
    }

    this.generateFocusedReport();
    return this.results;
  }

  async analyzeAdminDashboard(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`🔍 Analyzing: ${filePath}`);

      const dashboardName = path.basename(filePath, '.js');
      this.results.dashboards[dashboardName] = {
        filePath,
        nonFunctionalButtons: [],
        emptyHandlers: [],
        todoItems: [],
        buttonCount: 0
      };

      // Count all buttons
      const buttonMatches = content.match(/<button[^>]*>/g) || [];
      this.results.dashboards[dashboardName].buttonCount = buttonMatches.length;

      // Find non-functional buttons
      this.findNonFunctionalButtons(dashboardName, content);

      // Find empty/placeholder handlers
      this.findEmptyHandlers(dashboardName, content);

      // Find TODO items
      this.findTodoItems(dashboardName, content);

    } catch (error) {
      console.error(`❌ Error analyzing ${filePath}:`, error.message);
    }
  }

  findNonFunctionalButtons(dashboardName, content) {
    const buttonRegex = /<button[^>]*>/g;
    const onClickRegex = /onClick\s*=/;

    let match;
    while ((match = buttonRegex.exec(content)) !== null) {
      const buttonTag = match[0];

      if (!onClickRegex.test(buttonTag)) {
        const lineNumber = this.getLineNumber(content, match.index);
        const buttonText = this.extractButtonText(content, match.index);

        this.results.dashboards[dashboardName].nonFunctionalButtons.push({
          line: lineNumber,
          button: buttonTag.substring(0, 80) + '...',
          text: buttonText,
          issue: 'Missing onClick handler'
        });
      }
    }
  }

  findEmptyHandlers(dashboardName, content) {
    const emptyPatterns = [
      /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/g,
      /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*console\.log\([^)]*\)\s*\}/g,
      /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*alert\([^)]*\)\s*\}/g
    ];

    emptyPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);

        this.results.dashboards[dashboardName].emptyHandlers.push({
          line: lineNumber,
          handler: match[0],
          issue: 'Empty or placeholder handler'
        });
      }
    });
  }

  findTodoItems(dashboardName, content) {
    const todoRegex = /\/\/\s*TODO:?\s*(.+)/g;

    let match;
    while ((match = todoRegex.exec(content)) !== null) {
      const lineNumber = this.getLineNumber(content, match.index);

      this.results.dashboards[dashboardName].todoItems.push({
        line: lineNumber,
        todo: match[1].trim(),
        issue: 'Missing implementation'
      });
    }
  }

  extractButtonText(content, buttonIndex) {
    // Try to find button text between > and </button>
    const afterButton = content.substring(buttonIndex);
    const textMatch = afterButton.match(/>(.*?)<\/button>/);
    if (textMatch) {
      return textMatch[1].trim().substring(0, 30);
    }
    return 'No text found';
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  generateFocusedReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 FOCUSED ADMIN DASHBOARD BUTTON AUDIT');
    console.log('='.repeat(80));

    let totalButtons = 0;
    let totalIssues = 0;

    Object.entries(this.results.dashboards).forEach(([dashboardName, data]) => {
      totalButtons += data.buttonCount;
      const dashboardIssues = data.nonFunctionalButtons.length + data.emptyHandlers.length;
      totalIssues += dashboardIssues;

      console.log(`\n📊 ${dashboardName.toUpperCase()}:`);
      console.log(`   File: ${data.filePath}`);
      console.log(`   Total Buttons: ${data.buttonCount}`);
      console.log(`   Non-functional: ${data.nonFunctionalButtons.length}`);
      console.log(`   Empty Handlers: ${data.emptyHandlers.length}`);
      console.log(`   TODOs: ${data.todoItems.length}`);

      if (data.nonFunctionalButtons.length > 0) {
        console.log(`\n   🚨 Non-functional Buttons:`);
        data.nonFunctionalButtons.slice(0, 5).forEach((button, index) => {
          console.log(`      ${index + 1}. Line ${button.line}: "${button.text}"`);
        });
      }

      if (data.emptyHandlers.length > 0) {
        console.log(`\n   ⚠️  Empty Handlers:`);
        data.emptyHandlers.forEach((handler, index) => {
          console.log(`      ${index + 1}. Line ${handler.line}: ${handler.handler.substring(0, 40)}...`);
        });
      }
    });

    // Overall summary
    console.log(`\n📈 OVERALL SUMMARY:`);
    console.log(`   Active Admin Dashboards: ${Object.keys(this.results.dashboards).length}`);
    console.log(`   Total Buttons: ${totalButtons}`);
    console.log(`   Total Issues: ${totalIssues}`);
    console.log(`   Success Rate: ${((totalButtons - totalIssues) / totalButtons * 100).toFixed(1)}%`);

    // Priority recommendations
    console.log(`\n🎯 PRIORITY RECOMMENDATIONS:`);

    const mostProblematic = Object.entries(this.results.dashboards)
      .sort(([,a], [,b]) => (b.nonFunctionalButtons.length + b.emptyHandlers.length) - (a.nonFunctionalButtons.length + a.emptyHandlers.length))
      .slice(0, 2);

    mostProblematic.forEach(([dashboardName, data], index) => {
      const issues = data.nonFunctionalButtons.length + data.emptyHandlers.length;
      console.log(`   ${index + 1}. Fix ${dashboardName} (${issues} button issues)`);
    });

    // Save focused report
    this.results.summary = {
      totalDashboards: Object.keys(this.results.dashboards).length,
      totalButtons,
      totalIssues,
      successRate: ((totalButtons - totalIssues) / totalButtons * 100).toFixed(1),
      timestamp: new Date().toISOString()
    };

    const reportPath = 'focused-button-audit-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Focused report saved to: ${reportPath}`);

    console.log('\n' + '='.repeat(80));
  }
}

// Export for use in other scripts
module.exports = FocusedButtonAuditor;

// Run if called directly
if (require.main === module) {
  const auditor = new FocusedButtonAuditor();
  auditor.auditActiveAdminDashboards().then(() => {
    console.log('✅ Focused admin dashboard audit complete!');
  }).catch(error => {
    console.error('❌ Audit failed:', error);
  });
}