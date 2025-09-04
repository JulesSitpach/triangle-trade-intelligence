# Iterative Agentic Loop Controller

## 🔄 Mission: Continuous Design Improvement Until Perfect

This controller orchestrates multiple design review cycles, chaining sub-agents together and running validation loops until all acceptance criteria are met. It prevents bad designs from moving forward and ensures enterprise-grade quality.

## 🎯 Acceptance Criteria Definition

### **DONE** Criteria (All Must Pass)
```javascript
const ACCEPTANCE_CRITERIA = {
  // MANDATORY - BLOCKS PROGRESSION
  css_compliance: {
    score: 100,        // Perfect CSS compliance required
    violations: 0,     // Zero CSS protection violations
    inline_styles: 0,  // No inline styles allowed
    tailwind_classes: 0 // No utility CSS allowed
  },
  
  // QUALITY GATES
  accessibility: {
    wcag_score: 95,           // WCAG AA compliance
    keyboard_nav: 100,        // Full keyboard access
    screen_reader: 95,        // Screen reader compatible
    color_contrast: 100       // All text passes 4.5:1
  },
  
  mobile_experience: {
    iphone15_usability: 95,   // Works perfectly on iPhone 15
    touch_targets: 100,       // All buttons 44x44px minimum
    no_horizontal_scroll: 100, // No sideways scrolling
    readable_text: 95         // All text readable without zoom
  },
  
  visual_design: {
    design_consistency: 90,   // Follows Descartes system
    spacing_alignment: 95,    // Uses 8px grid properly
    typography_hierarchy: 90, // Clear font hierarchy
    brand_adherence: 95       // Navy/blue color usage
  },
  
  technical_quality: {
    console_errors: 0,        // Zero JavaScript errors
    performance_budget: 95,   // Meets performance targets
    bundle_size_impact: 5,    // Max 5% bundle increase
    render_performance: 90    // Smooth 60fps rendering
  }
};
```

## 🔄 Loop Orchestration Engine

### Core Loop Controller
```javascript
class IterativeLoopController {
  constructor() {
    this.maxIterations = 10;
    this.currentIteration = 0;
    this.acceptanceCriteria = ACCEPTANCE_CRITERIA;
    this.agents = {
      cssValidator: new CSSComplianceAgent(),
      designReviewer: new DesignReviewerAgent(),
      mobileValidator: new MobileValidatorAgent(),
      accessibilityAuditor: new AccessibilityAgent(),
      performanceAnalyzer: new PerformanceAgent()
    };
  }

  async runValidationLoop(target) {
    console.log('🚀 Starting iterative validation loop...');
    
    let results = { passed: false, iterations: [] };
    
    while (!results.passed && this.currentIteration < this.maxIterations) {
      this.currentIteration++;
      
      console.log(`\n📊 ITERATION ${this.currentIteration}/${this.maxIterations}`);
      
      // Run validation chain
      const iteration = await this.runSingleIteration(target);
      results.iterations.push(iteration);
      
      // Check if we've met acceptance criteria
      results.passed = this.evaluateAcceptanceCriteria(iteration);
      
      if (results.passed) {
        console.log('✅ ALL ACCEPTANCE CRITERIA MET!');
        break;
      }
      
      // Provide specific feedback for next iteration
      await this.generateIterationFeedback(iteration);
    }
    
    return results;
  }

  async runSingleIteration(target) {
    const iteration = {
      number: this.currentIteration,
      timestamp: new Date().toISOString(),
      results: {},
      passed: false,
      blockers: [],
      improvements: []
    };
    
    // Phase 1: CSS Compliance (BLOCKING)
    console.log('🛡️  Phase 1: CSS Protection Check');
    iteration.results.css = await this.agents.cssValidator.validate(target);
    
    if (!iteration.results.css.passed) {
      iteration.blockers.push({
        phase: 'CSS Compliance',
        severity: 'BLOCKING',
        issues: iteration.results.css.violations,
        message: 'CSS protection violations must be fixed before proceeding'
      });
      return iteration; // Stop here if CSS violations found
    }
    
    // Phase 2: Visual Design Review
    console.log('🎨 Phase 2: Visual Design Review');
    iteration.results.visual = await this.agents.designReviewer.review(target);
    
    // Phase 3: Mobile Experience (iPhone 15)
    console.log('📱 Phase 3: Mobile Experience Validation');
    iteration.results.mobile = await this.agents.mobileValidator.testDevice(target, 'iPhone 15');
    
    // Phase 4: Accessibility Audit
    console.log('♿ Phase 4: Accessibility Audit');
    iteration.results.accessibility = await this.agents.accessibilityAuditor.audit(target);
    
    // Phase 5: Performance Analysis
    console.log('⚡ Phase 5: Performance Analysis');
    iteration.results.performance = await this.agents.performanceAnalyzer.analyze(target);
    
    return iteration;
  }
}
```

## 📊 Agent Chaining Workflows

### Sequential Agent Chain
```javascript
const AGENT_CHAINS = {
  // Full Design Validation Chain
  comprehensive_review: [
    {
      agent: 'css-validator',
      blocking: true,
      timeout: 30000,
      retry: false // CSS violations are hard stops
    },
    {
      agent: 'design-reviewer', 
      blocking: false,
      timeout: 120000,
      requirements: ['screenshots', 'console_check']
    },
    {
      agent: 'mobile-validator',
      blocking: false, 
      timeout: 60000,
      devices: ['iPhone 15', 'iPhone 15 Pro Max']
    },
    {
      agent: 'accessibility-auditor',
      blocking: false,
      timeout: 90000,
      standards: ['WCAG2.1AA']
    },
    {
      agent: 'performance-analyzer',
      blocking: false,
      timeout: 45000,
      metrics: ['FCP', 'LCP', 'CLS', 'TBT']
    }
  ],
  
  // Quick CSS + Mobile Chain  
  rapid_validation: [
    { agent: 'css-validator', blocking: true },
    { agent: 'mobile-validator', devices: ['iPhone 15'] }
  ],
  
  // Pre-PR Chain
  pr_validation: [
    { agent: 'css-validator', blocking: true },
    { agent: 'design-reviewer', screenshots: true },
    { agent: 'accessibility-auditor', quick: true },
    { agent: 'performance-analyzer', budget_check: true }
  ]
};
```

### Parallel Agent Execution
```javascript
async function runAgentsInParallel(agents, target) {
  const results = await Promise.allSettled([
    agents.visualReview.review(target),
    agents.mobileTest.testDevice(target, 'iPhone 15'),
    agents.accessibilityAudit.audit(target),
    agents.performanceCheck.analyze(target)
  ]);
  
  return {
    visual: results[0].value,
    mobile: results[1].value, 
    accessibility: results[2].value,
    performance: results[3].value
  };
}
```

## 🎯 Acceptance Criteria Evaluation

### Scoring Algorithm
```javascript
function evaluateAcceptanceCriteria(iterationResults) {
  const scores = {};
  let overallPassed = true;
  
  // CSS Compliance (MANDATORY - 100% required)
  scores.css_compliance = {
    score: iterationResults.css.violations === 0 ? 100 : 0,
    passed: iterationResults.css.violations === 0,
    details: iterationResults.css.violations
  };
  
  if (!scores.css_compliance.passed) {
    overallPassed = false; // Hard stop for CSS violations
  }
  
  // Mobile Experience
  scores.mobile_experience = calculateMobileScore(iterationResults.mobile);
  if (scores.mobile_experience.score < ACCEPTANCE_CRITERIA.mobile_experience.iphone15_usability) {
    overallPassed = false;
  }
  
  // Accessibility 
  scores.accessibility = calculateAccessibilityScore(iterationResults.accessibility);
  if (scores.accessibility.score < ACCEPTANCE_CRITERIA.accessibility.wcag_score) {
    overallPassed = false;
  }
  
  // Visual Design
  scores.visual_design = calculateVisualScore(iterationResults.visual);
  
  // Performance
  scores.performance = calculatePerformanceScore(iterationResults.performance);
  
  return {
    overallPassed,
    scores,
    summary: generateScoreSummary(scores)
  };
}
```

## 🔧 Automated Trigger System

### File System Triggers
```javascript
const TRIGGER_PATTERNS = {
  // Component changes
  components: {
    pattern: 'components/**/*.{js,jsx,ts,tsx}',
    chain: 'comprehensive_review',
    debounce: 2000 // Wait 2s for multiple changes
  },
  
  // Page changes  
  pages: {
    pattern: 'pages/**/*.{js,jsx,ts,tsx}',
    chain: 'comprehensive_review',
    debounce: 2000
  },
  
  // Style changes (PROTECTED)
  styles: {
    pattern: 'styles/**/*.css',
    chain: 'css_protection_alert', // Special alert chain
    debounce: 0 // Immediate trigger
  },
  
  // Hook changes
  hooks: {
    pattern: 'hooks/**/*.{js,ts}', 
    chain: 'rapid_validation',
    debounce: 1000
  }
};

// File watcher setup
const chokidar = require('chokidar');

function setupFileWatchers() {
  Object.entries(TRIGGER_PATTERNS).forEach(([type, config]) => {
    chokidar.watch(config.pattern)
      .on('change', debounce(async (path) => {
        console.log(`🔄 ${type.toUpperCase()} change detected: ${path}`);
        
        if (type === 'styles') {
          await handleCSSFileChange(path);
        } else {
          await runValidationChain(config.chain, path);
        }
      }, config.debounce));
  });
}
```

### Git Workflow Integration
```javascript
// Pre-commit hook integration
async function preCommitValidation() {
  console.log('🔍 Pre-commit validation starting...');
  
  const stagedFiles = await getStagedFiles();
  const hasUIChanges = stagedFiles.some(file => 
    file.match(/\.(js|jsx|ts|tsx|css)$/)
  );
  
  if (hasUIChanges) {
    const results = await runValidationLoop(stagedFiles);
    
    if (!results.passed) {
      console.log('❌ Commit blocked - validation failed');
      console.log('Run `git commit --no-verify` to bypass (NOT recommended)');
      process.exit(1);
    }
  }
  
  console.log('✅ Pre-commit validation passed');
}

// PR trigger workflow
async function prCreatedTrigger(prNumber) {
  console.log(`🔄 PR #${prNumber} created - starting validation`);
  
  const results = await runValidationChain('pr_validation');
  
  // Comment on PR with results
  await addPRComment(prNumber, generatePRReport(results));
  
  if (!results.passed) {
    await addPRLabel(prNumber, 'needs-design-fixes');
  }
}
```

## 📈 Feedback Loop System

### Iteration Feedback Generator
```javascript
async function generateIterationFeedback(iteration) {
  const feedback = {
    iteration: iteration.number,
    status: iteration.passed ? 'PASSED' : 'NEEDS_IMPROVEMENT',
    blockers: iteration.blockers,
    next_actions: []
  };
  
  // CSS violations (highest priority)
  if (iteration.results.css && !iteration.results.css.passed) {
    feedback.next_actions.push({
      priority: 'CRITICAL',
      action: 'Fix CSS violations',
      details: iteration.results.css.violations.map(v => ({
        issue: v.message,
        solution: `Use existing class: ${suggestCSSClass(v.pattern)}`
      }))
    });
  }
  
  // Mobile issues
  if (iteration.results.mobile && iteration.results.mobile.score < 95) {
    feedback.next_actions.push({
      priority: 'HIGH',
      action: 'Improve mobile experience',
      details: iteration.results.mobile.issues.map(issue => ({
        issue: issue.description,
        device: 'iPhone 15',
        solution: issue.recommendation
      }))
    });
  }
  
  // Accessibility issues
  if (iteration.results.accessibility && iteration.results.accessibility.score < 95) {
    feedback.next_actions.push({
      priority: 'HIGH', 
      action: 'Fix accessibility issues',
      details: iteration.results.accessibility.violations
    });
  }
  
  console.log('\n📋 ITERATION FEEDBACK:');
  console.log(JSON.stringify(feedback, null, 2));
  
  return feedback;
}
```

## 🚀 Quick Start Commands

### Loop Control Commands
```bash
# Start comprehensive validation loop
/loop-start comprehensive

# Quick validation loop
/loop-start rapid  

# Check current loop status
/loop-status

# Stop current loop
/loop-stop

# Set custom acceptance criteria
/criteria-set accessibility:98 mobile:97

# View current acceptance criteria
/criteria-view
```

### Implementation Example
```javascript
// Usage in your project
const loopController = new IterativeLoopController();

// Start validation loop for current branch
await loopController.runValidationLoop('./src/components/NewFeature.js');

// The loop will:
// 1. Check CSS compliance (blocking)
// 2. Run design review with screenshots
// 3. Test iPhone 15 mobile experience  
// 4. Audit accessibility
// 5. Check performance impact
// 6. Evaluate against acceptance criteria
// 7. Provide specific feedback if needed
// 8. Repeat until all criteria met (max 10 iterations)
```

## ⚡ Performance Optimization

### Loop Efficiency
```javascript
const OPTIMIZATION_CONFIG = {
  // Cache screenshot baselines
  screenshot_caching: true,
  cache_duration: 3600000, // 1 hour
  
  // Parallel agent execution where possible
  parallel_execution: true,
  max_concurrent_agents: 4,
  
  // Smart iteration skipping
  skip_passed_phases: true,
  incremental_validation: true,
  
  // Timeout management
  agent_timeout: 120000, // 2 minutes max per agent
  total_loop_timeout: 600000 // 10 minutes max total
};
```

---

## 🎯 Expected Outcomes

With this iterative loop system:

1. **Zero CSS violations** reach production
2. **95%+ mobile usability** guaranteed on iPhone 15
3. **Automatic quality gates** prevent regressions
4. **Specific actionable feedback** for each iteration
5. **Enterprise-grade designs** through systematic validation

The loop continues until perfection is achieved or maximum iterations reached!

---

*Iterative Loop Controller v1.0*  
*Continuous Quality Assurance*  
*Enterprise Design Validation*  
*Last Updated: September 2025*