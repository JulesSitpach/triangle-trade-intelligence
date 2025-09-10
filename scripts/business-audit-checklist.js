#!/usr/bin/env node

/**
 * BUSINESS-FIRST AUDIT CHECKLIST SYSTEM
 * Transform technical audits into business outcome validation
 */

const fs = require('fs');
const path = require('path');

const BUSINESS_AUDIT_FRAMEWORK = {
  // Replace technical-only questions with business context questions
  transforms: {
    technical: {
      "Does the API return correct data?": "Does this enable Sarah to make confident USMCA filing decisions in <30 minutes?",
      "Are calculations accurate?": "Would Mike trust these results for a $180K+ sourcing decision?",
      "Is the response time acceptable?": "Does this maintain the professional speed Lisa expects for financial planning?",
      "Does the component work?": "Does this advance customer business outcomes (cost reduction, risk mitigation)?",
      "Is the code clean?": "Is this maintainable enough to support $150K+ customer value delivery?",
      "Are tests passing?": "Do these tests validate real customer scenarios (electronics, automotive, fashion)?",
      "Is performance good?": "Does this support the complete user journey (crisis → trial → implementation)?",
      "Is security adequate?": "Does this maintain professional credibility with compliance experts?"
    }
  },
  
  customer_contexts: {
    sarah: {
      role: "Import Compliance Manager",
      goals: "Accurate USMCA certificates, zero audit failures, <30min analysis",
      pain_points: "Manual research takes 4 hours, supplier data delays, customs penalties",
      success_metrics: "95% audit success, 30-minute workflows, defensible decisions"
    },
    
    mike: {
      role: "Procurement Specialist", 
      goals: "Optimal sourcing decisions, total landed cost analysis, strategic supplier selection",
      pain_points: "Can't factor USMCA savings, incomplete cost data, suboptimal choices",
      success_metrics: "15%+ cost reduction, faster decisions, data-driven sourcing"
    },
    
    lisa: {
      role: "CFO/Finance Director",
      goals: "Accurate financial forecasting, quantified trade savings, strategic planning",
      pain_points: "Conservative duty estimates, unknown USMCA potential, financial uncertainty", 
      success_metrics: "Accurate forecasts, quantified savings, strategic cost visibility"
    }
  }
};

class BusinessAuditSystem {
  constructor() {
    this.auditResults = [];
    this.contextPath = path.join(process.cwd(), 'PROJECT-CONTEXT-DOCUMENT.md');
  }

  // Customer-centric audit questions
  async auditCustomerOutcomes(component) {
    console.log(`🎯 CUSTOMER OUTCOME AUDIT: ${component}\n`);
    
    const customerAudits = [
      {
        customer: "Sarah (Compliance Manager)",
        questions: [
          "Can she complete USMCA analysis in <30 minutes with this component?",
          "Will the results be defensible in a customs audit?", 
          "Does this reduce her manual research time from 4 hours to minutes?",
          "Can she confidently file certificates with these results?"
        ]
      },
      {
        customer: "Mike (Procurement Specialist)", 
        questions: [
          "Can he see total landed cost including USMCA savings?",
          "Will this help him choose optimal suppliers?",
          "Does this provide data for $180K+ sourcing decisions?",
          "Can he quantify Mexico vs China routing benefits?"
        ]
      },
      {
        customer: "Lisa (CFO/Finance Director)",
        questions: [
          "Can she accurately forecast duty costs with this data?",
          "Does this quantify USMCA savings for financial models?",
          "Will this support strategic business planning?", 
          "Can she justify supplier/product line decisions with these insights?"
        ]
      }
    ];

    for (const audit of customerAudits) {
      console.log(`\n${audit.customer}:`);
      for (const question of audit.questions) {
        console.log(`  • ${question}`);
        const response = await this.getAuditResponse();
        this.auditResults.push({
          customer: audit.customer,
          question,
          response,
          component
        });
      }
    }
    
    return this.auditResults;
  }

  // Business journey audit
  async auditBusinessJourney(feature) {
    console.log(`🔄 BUSINESS JOURNEY AUDIT: ${feature}\n`);
    
    const journeyStages = [
      {
        stage: "Crisis Recognition",
        questions: [
          "Does this help prospects recognize $50K-$500K+ tariff savings opportunity?",
          "Is the value proposition immediately clear and compelling?",
          "Does this address urgent pain points (audit failures, competitive pressure)?"
        ]
      },
      {
        stage: "Trial Evaluation (14 days)",
        questions: [
          "Can users complete one successful workflow in first 7 days?",
          "Does this demonstrate concrete savings ($245K electronics example)?",
          "Is professional credibility established through accurate results?"
        ]
      },
      {
        stage: "Implementation & Operations",
        questions: [
          "Does this integrate with existing procurement/compliance workflows?",
          "Can teams scale this across 200+ product portfolios?",
          "Does this support quarterly optimization and strategic planning?"
        ]
      }
    ];

    for (const stage of journeyStages) {
      console.log(`\n📍 ${stage.stage}:`);
      for (const question of stage.questions) {
        console.log(`  • ${question}`);
        const response = await this.getAuditResponse();
        this.auditResults.push({
          stage: stage.stage,
          question,
          response,
          feature
        });
      }
    }
    
    return this.auditResults;
  }

  // Success criteria validation audit  
  async auditSuccessCriteria(implementation) {
    console.log(`📊 SUCCESS CRITERIA AUDIT: ${implementation}\n`);
    
    const successCategories = [
      {
        category: "Customer Success (Primary)",
        criteria: [
          "95% customs compliance rate - Will this maintain/improve accuracy?",
          "<30 minutes analysis time - Does this reduce workflow time?", 
          "$150K+ annual savings - Does this enable significant customer value?",
          "Professional credibility - Can customers defend decisions to auditors?"
        ]
      },
      {
        category: "Business Success (Revenue)",
        criteria: [
          "25%+ trial conversion - Does this demonstrate clear value in trial?",
          "90%+ customer retention - Does this deliver ongoing operational value?",
          "NPS >50 from compliance professionals - Is this truly helpful?",
          "$150K+ customer LTV - Does this justify enterprise pricing?"
        ]
      },
      {
        category: "Technical Excellence (Foundation)",
        criteria: [
          "<2 second response times - Is performance professional-grade?",
          "99.9% uptime reliability - Can customers depend on this?",
          "<5 support tickets per 100 workflows - Is this intuitive?",
          "Database-driven accuracy - Are results defensible and traceable?"
        ]
      }
    ];

    for (const category of successCategories) {
      console.log(`\n🎯 ${category.category}:`);
      for (const criterion of category.criteria) {
        console.log(`  • ${criterion}`);
        const response = await this.getAuditResponse();
        this.auditResults.push({
          category: category.category,
          criterion,
          response,
          implementation
        });
      }
    }
    
    return this.auditResults;
  }

  // Real scenario validation
  async auditRealScenarios(change) {
    console.log(`📋 REAL SCENARIO AUDIT: ${change}\n`);
    
    const scenarios = [
      {
        name: "Electronics Manufacturer (TechCorp)",
        context: "Smart speaker, 8 components, $10M imports, seeking $245K savings",
        validations: [
          "Can they see immediate $245K savings potential?",
          "Does 8-component breakdown work smoothly?", 
          "Can they confidently file USMCA certificates?",
          "Is 68% North American content calculation clear and defensible?"
        ]
      },
      {
        name: "Automotive Parts Importer (AutoDist)",
        context: "Brake assembly, $25M imports, complex supply chain, partial data",
        validations: [
          "Does partial analysis guide them effectively?",
          "Can they identify missing component data requirements?",
          "Does progression from 55% to 72% qualification make sense?",
          "Is final $625K savings calculation convincing?"
        ]
      },
      {
        name: "Fashion Retailer Supplier Switch", 
        context: "Winter jacket, China→Mexico evaluation, real-time decision",
        validations: [
          "Does China vs Mexico show different results immediately?",
          "Is 8% cost vs 11.2% savings trade-off clear?",
          "Can they make confident $180K sourcing decision?",
          "Does real-time recalculation work smoothly?"
        ]
      }
    ];

    for (const scenario of scenarios) {
      console.log(`\n🏢 ${scenario.name}:`);
      console.log(`   Context: ${scenario.context}`);
      for (const validation of scenario.validations) {
        console.log(`   • ${validation}`);
        const response = await this.getAuditResponse();
        this.auditResults.push({
          scenario: scenario.name,
          validation,
          response,
          change
        });
      }
    }
    
    return this.auditResults;
  }

  // Generate business audit report
  generateBusinessAuditReport() {
    console.log('\n🎯 BUSINESS AUDIT REPORT\n');
    
    const passed = this.auditResults.filter(r => r.response === 'pass').length;
    const total = this.auditResults.length;
    const score = Math.round((passed / total) * 100);
    
    console.log(`BUSINESS READINESS SCORE: ${score}% (${passed}/${total})\n`);
    
    if (score >= 90) {
      console.log('✅ EXCELLENT - Ready for customer value delivery');
    } else if (score >= 75) {
      console.log('⚠️  GOOD - Minor improvements needed for optimal customer outcomes');
    } else if (score >= 60) {
      console.log('⚠️  NEEDS WORK - Significant business impact improvements required');
    } else {
      console.log('❌ CRITICAL - Major business alignment issues must be addressed');
    }
    
    console.log('\nFAILED BUSINESS VALIDATIONS:');
    const failures = this.auditResults.filter(r => r.response === 'fail');
    failures.forEach(failure => {
      console.log(`• ${failure.question || failure.validation || failure.criterion}`);
    });
    
    return {
      score,
      passed,
      total,
      failures: failures.map(f => f.question || f.validation || f.criterion)
    };
  }

  async getAuditResponse() {
    return new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('    [pass/fail/skip]: ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase() || 'skip');
      });
    });
  }
}

// Command Line Interface
async function main() {
  const auditType = process.argv[2];
  const subject = process.argv[3] || 'current implementation';
  const auditor = new BusinessAuditSystem();
  
  switch(auditType) {
    case 'customer-outcomes':
      await auditor.auditCustomerOutcomes(subject);
      break;
      
    case 'business-journey': 
      await auditor.auditBusinessJourney(subject);
      break;
      
    case 'success-criteria':
      await auditor.auditSuccessCriteria(subject);
      break;
      
    case 'real-scenarios':
      await auditor.auditRealScenarios(subject);
      break;
      
    case 'complete':
      console.log('🎯 COMPLETE BUSINESS AUDIT\n');
      await auditor.auditCustomerOutcomes(subject);
      await auditor.auditBusinessJourney(subject);
      await auditor.auditSuccessCriteria(subject);
      await auditor.auditRealScenarios(subject);
      break;
      
    default:
      console.log('🎯 BUSINESS-FIRST AUDIT SYSTEM\n');
      console.log('Available audit types:');
      console.log('• customer-outcomes [component]  - Audit impact on Sarah, Mike, Lisa');
      console.log('• business-journey [feature]     - Audit impact on complete user journey');
      console.log('• success-criteria [impl]        - Validate against business success metrics');
      console.log('• real-scenarios [change]        - Test against real customer scenarios');
      console.log('• complete [subject]             - Run full business audit suite\n');
      console.log('Examples:');
      console.log('• node scripts/business-audit-checklist.js customer-outcomes "API optimization"');
      console.log('• node scripts/business-audit-checklist.js complete "qualification logic"');
      return;
  }
  
  const report = auditor.generateBusinessAuditReport();
  
  if (report.score < 75) {
    console.log('\n❌ BUSINESS AUDIT FAILED - Address critical issues before proceeding\n');
    process.exit(1);
  } else {
    console.log('\n✅ BUSINESS AUDIT PASSED - Ready for customer value delivery\n');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = BusinessAuditSystem;