#!/usr/bin/env node

/**
 * TRANSFORM DOCUMENTATION TO CONTEXT-FIRST
 * Automatically transform technical documentation to start with business context
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class DocumentationTransformer {
  constructor() {
    this.projectRoot = process.cwd();
    this.templatePath = path.join(this.projectRoot, 'BUSINESS-CONTEXT-DOCUMENTATION-TEMPLATE.md');
    
    this.documentationPatterns = [
      '**/*.md',
      '**/README.md',
      '**/*-doc*.md',
      '**/*-guide*.md',
      '**/api-*.md'
    ];
    
    this.businessContextTemplate = {
      api: {
        context: "**Customer Impact**: Enables [customer] to [business outcome] in <30 minutes instead of [current time]",
        outcome: "**Business Outcome**: [Specific customer value - cost reduction, risk mitigation, process efficiency]",
        metric: "**Success Metric**: [95% accuracy, <30min analysis, $150K+ savings, etc.]",
        scenario: "**Real Scenario**: [Electronics/Automotive/Fashion scenario this enables]"
      },
      
      component: {
        context: "**User Experience Impact**: [How does this improve customer workflow?]",
        credibility: "**Professional Credibility**: [Does this maintain compliance professional standards?]",
        integration: "**Workflow Integration**: [Where does this fit in complete customer journey?]"
      },
      
      database: {
        context: "**Customer Data**: [What customer information does this support?]",
        process: "**Business Process**: [Which workflows depend on this data?]",
        compliance: "**Compliance Requirements**: [How does this support audit defense?]"
      }
    };
    
    this.customerProfiles = {
      sarah: "Sarah (Import Compliance Manager): <30min analysis, 95% accuracy, audit defensibility",
      mike: "Mike (Procurement Specialist): Total landed cost analysis, strategic sourcing decisions", 
      lisa: "Lisa (CFO/Finance Director): Accurate duty forecasting, quantified trade savings"
    };
    
    this.realScenarios = {
      electronics: "Electronics Manufacturer (TechCorp): Smart speaker, 8 components, $245K savings potential",
      automotive: "Automotive Parts Importer (AutoDist): Brake assembly, $625K savings, progressive data collection",
      fashion: "Fashion Retailer: Winter jacket, China → Mexico supplier switch, $180K savings evaluation"
    };
  }

  async transformAllDocumentation() {
    console.log('🔄 TRANSFORMING DOCUMENTATION TO CONTEXT-FIRST\n');
    
    // Find all documentation files
    const docFiles = await this.findDocumentationFiles();
    
    console.log(`Found ${docFiles.length} documentation files to transform:\n`);
    docFiles.forEach(file => console.log(`  • ${file}`));
    
    // Transform each file
    let transformedCount = 0;
    for (const file of docFiles) {
      const transformed = await this.transformDocument(file);
      if (transformed) transformedCount++;
    }
    
    console.log(`\n✅ Transformed ${transformedCount} documents to context-first format`);
    console.log('📖 All documentation now starts with business context\n');
    
    return transformedCount;
  }

  async findDocumentationFiles() {
    const allFiles = [];
    
    for (const pattern of this.documentationPatterns) {
      const files = glob.sync(pattern, { 
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
      });
      allFiles.push(...files);
    }
    
    // Remove duplicates and filter for actual documentation
    const uniqueFiles = [...new Set(allFiles)];
    const docFiles = uniqueFiles.filter(file => {
      const content = fs.readFileSync(path.join(this.projectRoot, file), 'utf8');
      return content.length > 100; // Filter out very small files
    });
    
    return docFiles;
  }

  async transformDocument(relativePath) {
    const fullPath = path.join(this.projectRoot, relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    console.log(`\n📝 Transforming: ${relativePath}`);
    
    // Skip if already has business context
    if (this.hasBusinessContext(content)) {
      console.log('   ✅ Already has business context - skipping');
      return false;
    }
    
    // Determine document type
    const docType = this.determineDocumentType(relativePath, content);
    console.log(`   📋 Detected type: ${docType}`);
    
    // Transform based on type
    const transformedContent = await this.transformByType(content, docType, relativePath);
    
    // Write transformed content
    fs.writeFileSync(fullPath, transformedContent);
    console.log('   ✅ Transformed successfully');
    
    return true;
  }

  hasBusinessContext(content) {
    const businessIndicators = [
      'BUSINESS CONTEXT',
      'Customer Impact',
      'Business Outcome', 
      'Sarah (Compliance)',
      'Mike (Procurement)',
      'Lisa (Finance)',
      'Real Scenario'
    ];
    
    return businessIndicators.some(indicator => content.includes(indicator));
  }

  determineDocumentType(filePath, content) {
    if (filePath.includes('api') || content.includes('endpoint') || content.includes('API')) {
      return 'api';
    }
    
    if (filePath.includes('component') || content.includes('React') || content.includes('Component')) {
      return 'component';
    }
    
    if (filePath.includes('database') || filePath.includes('schema') || content.includes('table')) {
      return 'database';
    }
    
    if (filePath.includes('README') || filePath.includes('guide')) {
      return 'guide';
    }
    
    return 'general';
  }

  async transformByType(content, docType, filePath) {
    // Extract original title
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const originalTitle = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');
    
    // Generate business context section
    const businessContext = this.generateBusinessContext(docType, originalTitle, content);
    
    // Generate customer workflow integration
    const customerWorkflow = this.generateCustomerWorkflow(docType, originalTitle);
    
    // Generate success criteria
    const successCriteria = this.generateSuccessCriteria(docType);
    
    // Combine with original content
    const transformedContent = `# ${originalTitle}

${businessContext}

${customerWorkflow}

${successCriteria}

---

## 🛠️ TECHNICAL IMPLEMENTATION

${content.replace(/^#\s+.+$/m, '').trim()}`;

    return transformedContent;
  }

  generateBusinessContext(docType, title, content) {
    let context = '## 🎯 BUSINESS CONTEXT\n';
    
    switch (docType) {
      case 'api':
        context += `**Customer Impact**: Enables Sarah (Import Compliance Manager) to complete USMCA qualification analysis in <30 minutes instead of 4 hours of manual research\n`;
        context += `**Business Outcome**: Accurate qualification decisions supporting $150K+ annual customer savings through tariff optimization\n`;
        context += `**Success Metric**: 95% customs compliance accuracy, professional confidence levels, audit-defensible results\n`;
        context += `**Real Scenario**: Electronics manufacturer (TechCorp) analyzing 8-component smart speaker for $245K USMCA savings potential\n`;
        break;
        
      case 'component':
        context += `**User Experience Impact**: Improves customer workflow efficiency by providing professional-grade interface for compliance decisions\n`;
        context += `**Professional Credibility**: Maintains enterprise standards expected by compliance professionals and auditors\n`;
        context += `**Workflow Integration**: Fits within complete customer journey from crisis recognition through implementation\n`;
        context += `**Customer Value**: Supports customers in achieving <30 minute analysis times with 95% accuracy rates\n`;
        break;
        
      case 'database':
        context += `**Customer Data**: Supports accurate USMCA qualification decisions with comprehensive tariff and classification data\n`;
        context += `**Business Process**: Enables Sarah's compliance workflows, Mike's procurement decisions, and Lisa's financial planning\n`;
        context += `**Compliance Requirements**: Provides audit-defensible data sources for customs compliance and certificate filing\n`;
        context += `**Strategic Value**: Powers $150K+ annual savings through accurate tariff optimization and qualification\n`;
        break;
        
      default:
        context += `**Customer Impact**: Serves Import Compliance Managers, Procurement Specialists, and Finance Directors in achieving business outcomes\n`;
        context += `**Business Outcome**: Advances customer goals of cost reduction, risk mitigation, and process efficiency\n`;
        context += `**Success Metric**: Contributes to 95% accuracy, <30min workflows, and $150K+ customer value delivery\n`;
        context += `**Real Scenario**: Supports Electronics, Automotive, and Fashion retailer customer scenarios\n`;
    }
    
    return context;
  }

  generateCustomerWorkflow(docType, title) {
    let workflow = '## 💼 CUSTOMER WORKFLOW INTEGRATION\n';
    
    workflow += `**Sarah's Workflow**: ${this.getSarahWorkflow(docType)}\n`;
    workflow += `**Mike's Decision**: ${this.getMikeWorkflow(docType)}\n`;
    workflow += `**Lisa's Planning**: ${this.getLisaWorkflow(docType)}\n`;
    
    return workflow;
  }

  getSarahWorkflow(docType) {
    switch (docType) {
      case 'api':
        return 'Input product details → Get qualification decision → File USMCA certificates with confidence';
      case 'component':
        return 'Navigate professional interface → Complete analysis workflows → Generate audit-defensible results';
      case 'database':
        return 'Access comprehensive tariff data → Make accurate qualification decisions → Support audit defense';
      default:
        return 'Use professional tools → Complete compliance analysis in <30 minutes → Achieve 95% accuracy rate';
    }
  }

  getMikeWorkflow(docType) {
    switch (docType) {
      case 'api':
        return 'Compare supplier scenarios → Evaluate total landed costs → Make strategic sourcing decisions';
      case 'component':
        return 'Analyze sourcing options → See tariff impact clearly → Optimize procurement strategies';
      case 'database':
        return 'Access real tariff rates → Calculate sourcing impact → Support $180K+ procurement decisions';
      default:
        return 'Evaluate sourcing options → Calculate total costs → Make data-driven procurement decisions';
    }
  }

  getLisaWorkflow(docType) {
    switch (docType) {
      case 'api':
        return 'Get accurate duty forecasts → Quantify USMCA savings → Support strategic financial planning';
      case 'component':
        return 'Access financial data → See savings impact → Support business planning and ROI analysis';
      case 'database':
        return 'Use reliable cost data → Forecast accurately → Support strategic business decisions';
      default:
        return 'Access accurate financial data → Forecast duty costs → Plan strategic business initiatives';
    }
  }

  generateSuccessCriteria(docType) {
    return `## 📊 SUCCESS CRITERIA
- **Customer Success**: 95% customs compliance accuracy, <30 minute analysis time, $150K+ annual savings enabled
- **Business Success**: 25% trial conversion through value demonstration, 90% customer retention rate
- **Technical Excellence**: <2 second response times, 99.9% uptime reliability, database-driven accuracy`;
  }

  async generateTransformationReport() {
    console.log('\n📊 DOCUMENTATION TRANSFORMATION REPORT\n');
    
    const docFiles = await this.findDocumentationFiles();
    let contextFirst = 0;
    let technicalFirst = 0;
    
    console.log('📖 Documentation Analysis:\n');
    
    for (const file of docFiles) {
      const content = fs.readFileSync(path.join(this.projectRoot, file), 'utf8');
      const hasContext = this.hasBusinessContext(content);
      
      console.log(`${hasContext ? '✅' : '❌'} ${file} - ${hasContext ? 'Context-First' : 'Technical-First'}`);
      
      if (hasContext) {
        contextFirst++;
      } else {
        technicalFirst++;
      }
    }
    
    const total = docFiles.length;
    const contextPercentage = Math.round((contextFirst / total) * 100);
    
    console.log('\n📊 TRANSFORMATION METRICS:');
    console.log(`• Total Documentation Files: ${total}`);
    console.log(`• Context-First Documents: ${contextFirst} (${contextPercentage}%)`);
    console.log(`• Technical-First Documents: ${technicalFirst} (${100 - contextPercentage}%)`);
    
    if (contextPercentage >= 90) {
      console.log('🎉 EXCELLENT: Documentation is business-context driven');
    } else if (contextPercentage >= 70) {
      console.log('✅ GOOD: Most documentation includes business context');
    } else {
      console.log('⚠️ NEEDS WORK: More documentation needs business context');
    }
    
    return {
      total,
      contextFirst,
      technicalFirst,
      contextPercentage
    };
  }

  async createDocumentationIndex() {
    console.log('\n📚 CREATING BUSINESS CONTEXT DOCUMENTATION INDEX\n');
    
    const docFiles = await this.findDocumentationFiles();
    let indexContent = `# BUSINESS CONTEXT DOCUMENTATION INDEX

*All documentation follows context-first principles*

---

## 🎯 CUSTOMER-FOCUSED DOCUMENTATION

### 📱 **Customer Scenarios**
`;

    // Group documentation by customer impact
    const customerGroups = {
      sarah: [],
      mike: [],
      lisa: [],
      general: []
    };

    for (const file of docFiles) {
      const content = fs.readFileSync(path.join(this.projectRoot, file), 'utf8');
      
      if (content.includes('Sarah') || content.includes('Compliance')) {
        customerGroups.sarah.push(file);
      } else if (content.includes('Mike') || content.includes('Procurement')) {
        customerGroups.mike.push(file);
      } else if (content.includes('Lisa') || content.includes('Finance')) {
        customerGroups.lisa.push(file);
      } else {
        customerGroups.general.push(file);
      }
    }

    // Add customer-specific documentation sections
    indexContent += `\n#### 👩‍💼 **Sarah (Import Compliance Manager)**\n*<30min analysis, 95% accuracy, audit defensibility*\n\n`;
    customerGroups.sarah.forEach(file => {
      indexContent += `- [${path.basename(file, '.md')}](./${file})\n`;
    });

    indexContent += `\n#### 👨‍💼 **Mike (Procurement Specialist)**\n*Total landed cost analysis, strategic sourcing decisions*\n\n`;
    customerGroups.mike.forEach(file => {
      indexContent += `- [${path.basename(file, '.md')}](./${file})\n`;
    });

    indexContent += `\n#### 👩‍💼 **Lisa (CFO/Finance Director)**\n*Accurate duty forecasting, quantified trade savings*\n\n`;
    customerGroups.lisa.forEach(file => {
      indexContent += `- [${path.basename(file, '.md')}](./${file})\n`;
    });

    indexContent += `\n#### 🌐 **General Documentation**\n*Supporting all customer workflows*\n\n`;
    customerGroups.general.forEach(file => {
      indexContent += `- [${path.basename(file, '.md')}](./${file})\n`;
    });

    indexContent += `\n---

## 📊 **SUCCESS METRICS**

All documentation supports:
- **Customer Success**: 95% accuracy, <30min workflows, $150K+ savings
- **Business Success**: 25% conversion, 90% retention, NPS >50
- **Technical Excellence**: <2s response, 99.9% uptime, database-driven

---

## 🔄 **DOCUMENTATION STANDARDS**

Every document follows the [Business Context Template](./BUSINESS-CONTEXT-DOCUMENTATION-TEMPLATE.md):

1. **🎯 Business Context** - Customer impact and outcomes
2. **💼 Customer Workflow Integration** - How it serves Sarah, Mike, Lisa
3. **📊 Success Criteria** - Measurable business metrics
4. **🛠️ Technical Implementation** - Implementation details

---

*Last Updated: ${new Date().toISOString().split('T')[0]}*`;

    const indexPath = path.join(this.projectRoot, 'DOCUMENTATION-INDEX.md');
    fs.writeFileSync(indexPath, indexContent);
    
    console.log(`✅ Created documentation index: ${indexPath}`);
    console.log('📖 Index organizes all documentation by customer impact\n');
    
    return indexPath;
  }
}

// Command Line Interface
async function main() {
  const command = process.argv[2] || 'transform';
  const transformer = new DocumentationTransformer();
  
  switch (command) {
    case 'transform':
      await transformer.transformAllDocumentation();
      break;
      
    case 'report':
      await transformer.generateTransformationReport();
      break;
      
    case 'index':
      await transformer.createDocumentationIndex();
      break;
      
    case 'complete':
      console.log('🔄 COMPLETE DOCUMENTATION TRANSFORMATION\n');
      await transformer.transformAllDocumentation();
      await transformer.generateTransformationReport();
      await transformer.createDocumentationIndex();
      break;
      
    default:
      console.log('📚 BUSINESS CONTEXT DOCUMENTATION TRANSFORMER\n');
      console.log('Available commands:');
      console.log('• transform  - Transform all documentation to context-first');
      console.log('• report     - Generate transformation status report');
      console.log('• index      - Create customer-focused documentation index');
      console.log('• complete   - Run full transformation suite\n');
      console.log('Examples:');
      console.log('• node scripts/transform-docs-to-context-first.js transform');
      console.log('• node scripts/transform-docs-to-context-first.js complete');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DocumentationTransformer;