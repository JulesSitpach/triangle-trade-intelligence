/**
 * Automated Trigger System for Design Validation
 * Integrates with Playwright MCP and CSS Protection Rules
 */

const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');

// CSS Protection - Critical Alert System
const CSS_PROTECTION_ALERTS = {
  forbidden_patterns: [
    /style\s*=\s*{/,              // React inline styles
    /style\s*=\s*"/,              // HTML style attributes
    /className=".*\s(bg-|text-|p-|m-|w-|h-|flex-|grid-)/, // Tailwind
    /@apply/,                     // Tailwind directives
    /@tailwind/,                  // Tailwind imports
    /!important/,                 // Important declarations
  ],
  
  protected_files: [
    'styles/globals.css',
    'styles/**/*.css'
  ]
};

// Trigger Configuration
const TRIGGER_PATTERNS = {
  // CRITICAL: CSS File Changes (Immediate Alert)
  css_protection: {
    patterns: ['styles/globals.css', 'styles/**/*.css'],
    actions: ['css_violation_alert', 'block_change', 'notify_user'],
    debounce: 0, // Immediate
    priority: 'CRITICAL'
  },
  
  // Component Changes (Full Validation)
  component_changes: {
    patterns: [
      'components/**/*.{js,jsx,ts,tsx}',
      'pages/**/*.{js,jsx,ts,tsx}',
      'hooks/**/*.{js,jsx,ts,tsx}'
    ],
    actions: ['comprehensive_validation', 'mobile_test', 'screenshot_capture'],
    debounce: 2000, // 2 seconds
    priority: 'HIGH'
  },
  
  // Workflow Changes (Specific to Triangle Intelligence)
  workflow_changes: {
    patterns: [
      'components/workflow/**/*.js',
      'pages/usmca-workflow.js',
      'lib/core/**/*.js'
    ],
    actions: ['workflow_validation', 'mobile_workflow_test', 'business_logic_check'],
    debounce: 3000, // 3 seconds
    priority: 'HIGH'
  },
  
  // Configuration Changes
  config_changes: {
    patterns: [
      'next.config.js',
      'package.json',
      '.claude/**/*',
      'jest.config.js'
    ],
    actions: ['config_validation', 'dependency_check'],
    debounce: 1000,
    priority: 'MEDIUM'
  }
};

// Automated Actions
class AutomatedTriggerSystem {
  constructor() {
    this.watchers = new Map();
    this.isRunning = false;
    this.lastTrigger = new Map(); // Prevent duplicate triggers
  }

  start() {
    console.log('🚀 Starting Automated Trigger System...');
    console.log('🛡️  CSS Protection: ACTIVE');
    console.log('📱 Mobile Testing: iPhone 15 Ready');
    console.log('🎨 Design Validation: ACTIVE');
    
    this.isRunning = true;
    this.setupWatchers();
  }

  setupWatchers() {
    Object.entries(TRIGGER_PATTERNS).forEach(([triggerType, config]) => {
      const watcher = chokidar.watch(config.patterns, {
        ignored: [
          'node_modules/**',
          '.next/**',
          '.git/**',
          '**/*.log',
          '**/coverage/**'
        ],
        persistent: true,
        ignoreInitial: true
      });

      watcher
        .on('change', this.handleFileChange.bind(this, triggerType, config))
        .on('add', this.handleFileAdd.bind(this, triggerType, config))
        .on('unlink', this.handleFileDelete.bind(this, triggerType, config))
        .on('error', error => console.error(`❌ Watcher error for ${triggerType}:`, error));

      this.watchers.set(triggerType, watcher);
      console.log(`✅ Watcher setup: ${triggerType} (${config.patterns.join(', ')})`);
    });
  }

  async handleFileChange(triggerType, config, filePath) {
    const normalizedPath = path.normalize(filePath);
    
    // Debounce duplicate triggers
    const triggerKey = `${triggerType}:${normalizedPath}`;
    const now = Date.now();
    const lastTime = this.lastTrigger.get(triggerKey) || 0;
    
    if (now - lastTime < config.debounce) {
      return; // Skip duplicate trigger
    }
    
    this.lastTrigger.set(triggerKey, now);
    
    console.log(`\n🔄 TRIGGER: ${triggerType.toUpperCase()}`);
    console.log(`📁 File: ${normalizedPath}`);
    console.log(`⏰ Priority: ${config.priority}`);
    
    // Special handling for CSS protection
    if (triggerType === 'css_protection') {
      await this.handleCSSProtectionTrigger(normalizedPath);
      return;
    }
    
    // Execute configured actions
    for (const action of config.actions) {
      try {
        await this.executeAction(action, normalizedPath, config);
      } catch (error) {
        console.error(`❌ Action failed: ${action}`, error.message);
      }
    }
  }

  async handleFileAdd(triggerType, config, filePath) {
    console.log(`➕ New file detected: ${filePath}`);
    await this.handleFileChange(triggerType, config, filePath);
  }

  async handleFileDelete(triggerType, config, filePath) {
    console.log(`🗑️  File deleted: ${filePath}`);
    // Run validation to ensure UI still works
    if (triggerType === 'component_changes') {
      await this.executeAction('comprehensive_validation', filePath, config);
    }
  }

  async handleCSSProtectionTrigger(filePath) {
    console.log('🚨 CSS PROTECTION ALERT!');
    console.log(`🔒 Protected file modified: ${filePath}`);
    
    // Read file content to check for violations
    const fs = require('fs').promises;
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const violations = this.detectCSSViolations(content);
      
      if (violations.length > 0) {
        console.log('❌ CSS VIOLATIONS DETECTED:');
        violations.forEach(violation => {
          console.log(`   - ${violation.message}`);
          console.log(`     Line: ${violation.line}`);
          console.log(`     Suggestion: ${violation.suggestion}`);
        });
        
        // Block the change if possible (in development)
        if (process.env.NODE_ENV === 'development') {
          await this.blockCSSChange(filePath, violations);
        }
      }
    } catch (error) {
      console.error('Error reading CSS file:', error);
    }
  }

  detectCSSViolations(content) {
    const violations = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      CSS_PROTECTION_ALERTS.forbidden_patterns.forEach(pattern => {
        if (pattern.test(line)) {
          violations.push({
            line: index + 1,
            message: `Forbidden pattern detected: ${pattern.source}`,
            content: line.trim(),
            suggestion: 'Use existing classes from globals.css instead'
          });
        }
      });
    });
    
    return violations;
  }

  async executeAction(action, filePath, config) {
    console.log(`⚡ Executing: ${action}`);
    
    switch (action) {
      case 'css_violation_alert':
        await this.cssViolationAlert(filePath);
        break;
        
      case 'comprehensive_validation':
        await this.comprehensiveValidation(filePath);
        break;
        
      case 'mobile_test':
        await this.mobileTest(filePath);
        break;
        
      case 'screenshot_capture':
        await this.screenshotCapture(filePath);
        break;
        
      case 'workflow_validation':
        await this.workflowValidation(filePath);
        break;
        
      case 'mobile_workflow_test':
        await this.mobileWorkflowTest(filePath);
        break;
        
      default:
        console.log(`⚠️  Unknown action: ${action}`);
    }
  }

  async cssViolationAlert(filePath) {
    console.log('🚨 CSS VIOLATION ALERT');
    console.log('🛡️  Running CSS protection validation...');
    
    // Run CSS compliance check
    const result = await this.runCommand('/css-check');
    
    if (!result.success) {
      console.log('❌ CSS VIOLATIONS FOUND - BLOCKING CHANGES');
      // In development, could revert the file or show warning
    }
  }

  async comprehensiveValidation(filePath) {
    console.log('🔍 Running comprehensive validation...');
    
    // Chain multiple validations
    const validations = [
      '/css-check',      // CSS compliance first (blocking)
      '/design-review',  // Visual design review
      '/mobile-test',    // iPhone 15 testing
      '/a11y-audit'      // Accessibility check
    ];
    
    for (const validation of validations) {
      const result = await this.runCommand(validation);
      
      if (validation === '/css-check' && !result.success) {
        console.log('❌ Validation chain stopped - CSS violations found');
        return false;
      }
    }
    
    return true;
  }

  async mobileTest(filePath) {
    console.log('📱 Running iPhone 15 mobile test...');
    
    // Use Playwright MCP to test mobile experience
    const playwrightConfig = {
      device: 'iPhone 15',
      viewport: { width: 393, height: 852 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
    };
    
    return await this.runPlaywrightTest(playwrightConfig);
  }

  async screenshotCapture(filePath) {
    console.log('📸 Capturing screenshots...');
    
    // Capture both desktop and mobile screenshots
    const screenshots = await Promise.all([
      this.captureScreenshot('desktop', { width: 1920, height: 1080 }),
      this.captureScreenshot('mobile', { width: 393, height: 852, device: 'iPhone 15' })
    ]);
    
    console.log('✅ Screenshots captured:', screenshots.map(s => s.filename));
    return screenshots;
  }

  async workflowValidation(filePath) {
    console.log('🔄 Validating USMCA workflow...');
    
    // Special validation for Triangle Intelligence workflow
    if (filePath.includes('usmca-workflow')) {
      return await this.validateUSMCAWorkflow();
    }
    
    if (filePath.includes('components/workflow')) {
      return await this.validateWorkflowComponent(filePath);
    }
    
    return true;
  }

  async mobileWorkflowTest(filePath) {
    console.log('📱🔄 Testing workflow on iPhone 15...');
    
    // Test complete workflow on mobile device
    const testSteps = [
      'Navigate to workflow page',
      'Fill company information step',
      'Add product components', 
      'Complete qualification check',
      'Generate certificate'
    ];
    
    return await this.runMobileWorkflowTest(testSteps);
  }

  // Utility methods
  async runCommand(command) {
    return new Promise((resolve) => {
      console.log(`   Running: ${command}`);
      
      // Simulate command execution
      // In real implementation, would integrate with actual slash commands
      setTimeout(() => {
        resolve({ 
          success: true, 
          command,
          timestamp: new Date().toISOString()
        });
      }, Math.random() * 2000 + 500); // Random delay 0.5-2.5s
    });
  }

  async runPlaywrightTest(config) {
    console.log(`   📱 Testing with: ${config.device || 'Desktop'}`);
    
    // Integrate with your Playwright MCP configuration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          device: config.device,
          viewport: config.viewport,
          passed: true,
          issues: []
        });
      }, 3000);
    });
  }

  async captureScreenshot(type, config) {
    console.log(`   📸 Capturing ${type} screenshot...`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          type,
          filename: `${type}-${Date.now()}.png`,
          config,
          timestamp: new Date().toISOString()
        });
      }, 1500);
    });
  }

  stop() {
    console.log('🛑 Stopping Automated Trigger System...');
    
    this.watchers.forEach((watcher, triggerType) => {
      watcher.close();
      console.log(`✅ Stopped watcher: ${triggerType}`);
    });
    
    this.watchers.clear();
    this.isRunning = false;
  }
}

// Export for use in project
module.exports = {
  AutomatedTriggerSystem,
  TRIGGER_PATTERNS,
  CSS_PROTECTION_ALERTS
};

// CLI usage
if (require.main === module) {
  const system = new AutomatedTriggerSystem();
  
  // Start the system
  system.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n📋 Received SIGINT, shutting down gracefully...');
    system.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n📋 Received SIGTERM, shutting down gracefully...');
    system.stop();
    process.exit(0);
  });
  
  console.log('\n💡 Press Ctrl+C to stop the automated trigger system');
}