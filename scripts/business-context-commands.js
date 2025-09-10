#!/usr/bin/env node

/**
 * BUSINESS CONTEXT VALIDATION SLASH COMMANDS
 * Embed business thinking into every technical decision
 */

const fs = require('fs');
const path = require('path');

const BUSINESS_CONTEXT = {
  users: {
    sarah: "Import Compliance Manager - 8 years experience, manages 200+ products, needs <30min analysis",
    mike: "Procurement Specialist - Makes sourcing decisions, needs total landed cost analysis",
    lisa: "CFO/Finance Director - Needs accurate financial planning and cost forecasting"
  },
  
  scenarios: {
    electronics: "TechCorp - Smart speaker, $10M annual imports, seeking $245K savings",
    automotive: "AutoDist - Brake assembly, $25M imports, complex supply chain",
    fashion: "Fashion retailer - Winter jacket, evaluating Mexico supplier switch"
  },
  
  success_criteria: {
    customer: "95% customs accuracy, <30min analysis, $150K+ annual savings",
    business: "25% trial conversion, 90% retention, NPS >50",
    technical: "<2s response, 99.9% uptime, <5 tickets per 100 workflows"
  }
};

class BusinessContextValidator {
  constructor() {
    this.contextPath = path.join(process.cwd(), 'PROJECT-CONTEXT-DOCUMENT.md');
  }

  async validateBusinessImpact(change) {
    console.log('🎯 BUSINESS IMPACT ANALYSIS\n');
    
    console.log('CUSTOMER IMPACT CHECK:');
    console.log(`• Sarah (Compliance): How does "${change}" affect her 30-minute analysis goal?`);
    console.log(`• Mike (Procurement): Does this improve his sourcing decision confidence?`);
    console.log(`• Lisa (Finance): Can she better forecast costs with this change?\n`);
    
    console.log('BUSINESS OUTCOME VALIDATION:');
    console.log(`• Cost Reduction: Does this advance 3-8% product cost reduction?`);
    console.log(`• Risk Mitigation: Does this reduce customs penalties/audit failures?`);
    console.log(`• Process Efficiency: Does this move closer to <30 minutes analysis?`);
    console.log(`• Strategic Value: Does this enable $150K+ annual customer savings?\n`);
    
    return this.awaitUserConfirmation('Business impact considered');
  }

  async validateUserJourney(feature) {
    console.log('🔄 USER JOURNEY VALIDATION\n');
    
    console.log('JOURNEY STAGE IMPACT:');
    console.log('• Crisis Recognition: Does this help users recognize tariff savings opportunity?');
    console.log('• Trial Evaluation: Does this demonstrate value in first 7 days?');
    console.log('• Implementation: Does this support operational workflow integration?');
    console.log('• Success Measurement: Does this contribute to measurable customer outcomes?\n');
    
    console.log('DATA COLLECTION FLOW:');
    console.log('• Progressive Enhancement: Can users see value with partial data?');
    console.log('• Complete Workflow: Are results actionable and defensible?');
    console.log('• Decision Support: Does this enable confident business decisions?\n');
    
    return this.awaitUserConfirmation('User journey impact validated');
  }

  async runScenarioTest(scenario = 'electronics') {
    console.log(`📋 SCENARIO TESTING: ${scenario.toUpperCase()}\n`);
    
    const scenarioData = BUSINESS_CONTEXT.scenarios[scenario];
    console.log(`SCENARIO: ${scenarioData}\n`);
    
    switch(scenario) {
      case 'electronics':
        console.log('CRITICAL TESTS:');
        console.log('• Can TechCorp see $245K savings potential immediately?');
        console.log('• Does 8-component breakdown work smoothly?');
        console.log('• Can they confidently file USMCA certificates?');
        console.log('• Is qualification logic transparent and defensible?');
        break;
        
      case 'automotive':
        console.log('CRITICAL TESTS:');
        console.log('• Does partial data analysis guide AutoDist effectively?');
        console.log('• Can they identify missing 20% component data?');
        console.log('• Does final $625K savings calculation build confidence?');
        console.log('• Is supplier contact workflow smooth?');
        break;
        
      case 'fashion':
        console.log('CRITICAL TESTS:');
        console.log('• Does China→Mexico transition show different results?');
        console.log('• Can they see 8% vs 11.2% cost trade-off clearly?');
        console.log('• Is real-time recalculation immediate and obvious?');
        console.log('• Does $180K savings justify supplier switch?');
        break;
    }
    
    console.log('\n');
    return this.awaitUserConfirmation(`${scenario} scenario validated`);
  }

  async checkSuccessCriteria(component) {
    console.log('📊 SUCCESS CRITERIA VALIDATION\n');
    
    console.log('CUSTOMER SUCCESS METRICS:');
    console.log(`• Accuracy: Will this maintain 95% customs compliance rate?`);
    console.log(`• Speed: Does this keep analysis under 30 minutes?`);
    console.log(`• Value: Does this contribute to $150K+ customer savings?`);
    console.log(`• Confidence: Can customers defend decisions to auditors?\n`);
    
    console.log('BUSINESS SUCCESS METRICS:');
    console.log(`• Conversion: Does this improve 25%+ trial conversion rate?`);
    console.log(`• Retention: Does this support 90%+ customer retention?`);
    console.log(`• Satisfaction: Does this advance NPS >50 goal?`);
    console.log(`• Growth: Does this enable $150K+ customer value?\n`);
    
    console.log('TECHNICAL SUCCESS METRICS:');
    console.log(`• Performance: Does this maintain <2 second response times?`);
    console.log(`• Reliability: Does this support 99.9% uptime target?`);
    console.log(`• Support: Does this keep support tickets <5 per 100 workflows?`);
    console.log(`• Quality: Does this maintain technical excellence?\n`);
    
    return this.awaitUserConfirmation('Success criteria validated');
  }

  async runContextRefresh() {
    console.log('🔄 BUSINESS CONTEXT REFRESH\n');
    
    if (!fs.existsSync(this.contextPath)) {
      console.log('❌ PROJECT-CONTEXT-DOCUMENT.md not found!');
      console.log('Create this file first with comprehensive business context.\n');
      return false;
    }
    
    const context = fs.readFileSync(this.contextPath, 'utf8');
    const sections = ['BUSINESS PURPOSE', 'USER PROFILES', 'USER JOURNEY', 'BUSINESS RULES', 'SUCCESS CRITERIA'];
    
    console.log('✅ CONTEXT DOCUMENT LOADED\n');
    
    sections.forEach(section => {
      const hasSection = context.includes(section);
      console.log(`${hasSection ? '✅' : '❌'} ${section} section ${hasSection ? 'present' : 'MISSING'}`);
    });
    
    console.log('\n🎯 KEY REMINDERS:');
    console.log('• Customer Pain: $50K-$500K+ lost annually in unnecessary tariffs');
    console.log('• Success Definition: <30min analysis, 95% accuracy, $150K+ savings');
    console.log('• User Context: Sarah (Compliance), Mike (Procurement), Lisa (Finance)');
    console.log('• Business Outcome: Strategic cost reduction, not compliance checkbox\n');
    
    return this.awaitUserConfirmation('Business context refreshed');
  }

  awaitUserConfirmation(message) {
    return new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question(`✅ ${message}? (y/N): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y');
      });
    });
  }
}

// Command Line Interface
async function main() {
  const command = process.argv[2];
  const param = process.argv[3];
  const validator = new BusinessContextValidator();
  
  switch(command) {
    case 'business-impact':
      await validator.validateBusinessImpact(param || 'current change');
      break;
      
    case 'user-journey':
      await validator.validateUserJourney(param || 'current feature');
      break;
      
    case 'scenario-test':
      await validator.runScenarioTest(param || 'electronics');
      break;
      
    case 'success-criteria':
      await validator.checkSuccessCriteria(param || 'current component');
      break;
      
    case 'context-refresh':
      await validator.runContextRefresh();
      break;
      
    default:
      console.log('🎯 BUSINESS CONTEXT VALIDATION COMMANDS\n');
      console.log('Available commands:');
      console.log('• business-impact [change]     - Validate customer and business impact');
      console.log('• user-journey [feature]       - Check impact on complete user journey');
      console.log('• scenario-test [scenario]     - Test against real-world scenarios');
      console.log('• success-criteria [component] - Validate against success metrics');
      console.log('• context-refresh              - Reload business context document\n');
      console.log('Examples:');
      console.log('• node scripts/business-context-commands.js business-impact "API optimization"');
      console.log('• node scripts/business-context-commands.js scenario-test automotive');
      console.log('• node scripts/business-context-commands.js context-refresh');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = BusinessContextValidator;