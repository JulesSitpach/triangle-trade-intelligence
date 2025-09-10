#!/usr/bin/env node

/**
 * Triangle Intelligence Automated Audit CLI
 * 
 * Command-line interface for the comprehensive automated audit system.
 * Orchestrates all audit components with intelligent execution modes.
 * 
 * Usage:
 *   npm run audit               # Quick audit
 *   npm run audit:full          # Full comprehensive audit
 *   npm run audit:monitor       # Start continuous monitoring
 *   npm run audit:database      # Database-only verification
 *   npm run audit:status        # Check system status
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

// Import audit system components
const TriangleAuditSystem = require('./automated-audit-system');
const AuditExecutionWrapper = require('./audit-execution-wrapper');
const AutomatedMCPIntegration = require('./automated-mcp-integration');
const ContinuousAuditManager = require('./continuous-audit-manager');
const DatabaseVerificationSystem = require('./database-verification-system');

class AuditCLI {
    constructor() {
        this.version = '1.0.0';
        this.startTime = Date.now();
        this.outputDir = path.join(process.cwd(), 'audit-outputs');
        
        console.log(`🚀 Triangle Intelligence Automated Audit System v${this.version}`);
        console.log(`📁 Output Directory: ${this.outputDir}`);
    }

    async initialize() {
        await fs.mkdir(this.outputDir, { recursive: true });
        console.log('✅ Audit CLI initialized');
    }

    async quickAudit(options = {}) {
        console.log('\n⚡ === QUICK AUDIT EXECUTION ===');
        console.log('🎯 Target: Essential system verification with MCP tools');
        console.log('⏱️  Expected Duration: ~2 minutes\n');

        try {
            // Phase 1: MCP Integration (Quick mode)
            console.log('📖 Phase 1: MCP Tool Integration...');
            const mcpIntegration = new AutomatedMCPIntegration(`quick_${Date.now()}`);
            const mcpResult = await this.runWithTimeout(
                mcpIntegration.runComprehensiveMCPAudit(),
                120000, // 2 minute timeout
                'MCP integration'
            );

            // Phase 2: Database Connectivity Check
            console.log('\n🗄️  Phase 2: Database Verification...');
            const dbVerification = new DatabaseVerificationSystem();
            await dbVerification.initialize();
            const dbResult = await this.runWithTimeout(
                dbVerification.verifyConnectivity(),
                60000, // 1 minute timeout
                'Database connectivity'
            );

            // Generate quick summary
            const quickSummary = {
                auditType: 'QUICK',
                timestamp: new Date().toISOString(),
                executionTime: Date.now() - this.startTime,
                results: {
                    mcpIntegration: mcpResult,
                    databaseConnectivity: dbResult
                },
                status: this.assessQuickAuditStatus(mcpResult, dbResult),
                recommendations: this.generateQuickRecommendations(mcpResult, dbResult)
            };

            await this.saveAuditOutput('quick-audit-summary.json', quickSummary);
            
            console.log('\n✅ === QUICK AUDIT COMPLETED ===');
            console.log(`📊 Status: ${quickSummary.status}`);
            console.log(`⏱️  Duration: ${(quickSummary.executionTime / 1000).toFixed(1)}s`);
            console.log(`📁 Output: ${path.join(this.outputDir, 'quick-audit-summary.json')}`);

            return quickSummary;

        } catch (error) {
            console.error('❌ Quick audit failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    async fullAudit(options = {}) {
        console.log('\n🔍 === FULL COMPREHENSIVE AUDIT ===');
        console.log('🎯 Target: Complete system verification with all tools');
        console.log('⏱️  Expected Duration: ~10 minutes\n');

        try {
            // Phase 1: Standard Audit System
            console.log('🔧 Phase 1: Standard Audit Framework...');
            const auditSystem = new TriangleAuditSystem();
            const standardResult = await this.runWithTimeout(
                auditSystem.runCompleteAudit(),
                300000, // 5 minute timeout
                'Standard audit'
            );

            // Phase 2: MCP Integration
            console.log('\n📖 Phase 2: MCP Tool Integration...');
            const mcpIntegration = new AutomatedMCPIntegration(`full_${Date.now()}`);
            const mcpResult = await this.runWithTimeout(
                mcpIntegration.runComprehensiveMCPAudit(),
                300000, // 5 minute timeout
                'MCP integration'
            );

            // Phase 3: Database Verification
            console.log('\n🗄️  Phase 3: Complete Database Verification...');
            const dbVerification = new DatabaseVerificationSystem();
            const dbResult = await this.runWithTimeout(
                dbVerification.runComprehensiveVerification(),
                240000, // 4 minute timeout
                'Database verification'
            );

            // Generate comprehensive report
            const fullReport = {
                auditType: 'FULL',
                timestamp: new Date().toISOString(),
                executionTime: Date.now() - this.startTime,
                results: {
                    standardAudit: standardResult,
                    mcpIntegration: mcpResult,
                    databaseVerification: dbResult
                },
                overallStatus: this.assessFullAuditStatus(standardResult, mcpResult, dbResult),
                businessImpact: this.assessBusinessImpact(standardResult, mcpResult, dbResult),
                executiveSummary: this.generateExecutiveSummary(standardResult, mcpResult, dbResult),
                actionItems: this.generateActionItems(standardResult, mcpResult, dbResult)
            };

            await this.saveAuditOutput('full-audit-report.json', fullReport);
            await this.generateExecutiveReport(fullReport);
            
            console.log('\n✅ === FULL AUDIT COMPLETED ===');
            console.log(`📊 Overall Status: ${fullReport.overallStatus}`);
            console.log(`💼 Business Impact: ${fullReport.businessImpact}`);
            console.log(`⏱️  Duration: ${(fullReport.executionTime / 1000).toFixed(1)}s`);
            console.log(`📁 Report: ${path.join(this.outputDir, 'EXECUTIVE-AUDIT-REPORT.md')}`);

            return fullReport;

        } catch (error) {
            console.error('❌ Full audit failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    async databaseAudit(options = {}) {
        console.log('\n🗄️  === DATABASE VERIFICATION AUDIT ===');
        console.log('🎯 Target: Comprehensive database health and performance');
        console.log('⏱️  Expected Duration: ~3 minutes\n');

        try {
            const dbVerification = new DatabaseVerificationSystem();
            const dbResult = await this.runWithTimeout(
                dbVerification.runComprehensiveVerification(),
                180000, // 3 minute timeout
                'Database verification'
            );

            await this.saveAuditOutput('database-audit-result.json', dbResult);
            
            console.log('\n✅ === DATABASE AUDIT COMPLETED ===');
            console.log(`📊 Database Status: ${dbResult.results?.connectivity?.status || 'UNKNOWN'}`);
            console.log(`⚡ Performance: ${dbResult.results?.performance?.performanceGrade || 'UNKNOWN'}`);
            console.log(`🔍 Integrity: ${dbResult.results?.integrity?.overallIntegrity || 'UNKNOWN'}`);
            console.log(`📁 Evidence: ${dbResult.evidenceDir}`);

            return dbResult;

        } catch (error) {
            console.error('❌ Database audit failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    async startMonitoring(intervalMinutes = 30) {
        console.log('\n🔄 === CONTINUOUS MONITORING MODE ===');
        console.log(`🎯 Target: Automated system monitoring every ${intervalMinutes} minutes`);
        console.log('⏱️  Duration: Continuous until stopped (Ctrl+C)\n');

        try {
            const auditManager = new ContinuousAuditManager();
            
            // Setup graceful shutdown
            process.on('SIGINT', async () => {
                console.log('\n🛑 Stopping continuous monitoring...');
                await auditManager.cleanup();
                process.exit(0);
            });

            await auditManager.initialize();
            await auditManager.startContinuousMonitoring(intervalMinutes);
            
            console.log('🔄 Continuous monitoring active. Press Ctrl+C to stop.');
            
            // Keep process alive
            while (true) {
                await this.sleep(10000); // Check every 10 seconds
                
                // Display periodic status
                const status = await auditManager.getStatus();
                if (status.queueLength > 0 || status.activeAudits > 0) {
                    console.log(`📊 Status: ${status.queueLength} queued, ${status.activeAudits} active`);
                }
            }

        } catch (error) {
            console.error('❌ Monitoring failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    async checkStatus(options = {}) {
        console.log('\n📊 === SYSTEM STATUS CHECK ===\n');

        try {
            // Check database connectivity
            console.log('🗄️  Checking database connectivity...');
            const dbVerification = new DatabaseVerificationSystem();
            await dbVerification.initialize();
            const dbStatus = dbVerification.connectionHealthy;

            // Check file system
            console.log('📁 Checking file system access...');
            const fsStatus = await this.checkFileSystemAccess();

            // Check recent audit history
            console.log('📈 Checking audit history...');
            const auditHistory = await this.checkAuditHistory();

            const statusReport = {
                timestamp: new Date().toISOString(),
                system: {
                    database: dbStatus ? 'HEALTHY' : 'UNHEALTHY',
                    fileSystem: fsStatus ? 'ACCESSIBLE' : 'LIMITED',
                    auditHistory: auditHistory.available ? 'AVAILABLE' : 'EMPTY'
                },
                recent_audits: auditHistory.recentCount,
                last_audit: auditHistory.lastAudit,
                recommendations: this.generateStatusRecommendations(dbStatus, fsStatus, auditHistory)
            };

            console.log('\n📊 === STATUS SUMMARY ===');
            console.log(`🗄️  Database: ${statusReport.system.database}`);
            console.log(`📁 File System: ${statusReport.system.fileSystem}`);
            console.log(`📈 Audit History: ${statusReport.system.auditHistory}`);
            console.log(`🕐 Last Audit: ${statusReport.last_audit || 'Never'}`);
            
            if (statusReport.recommendations.length > 0) {
                console.log('\n💡 Recommendations:');
                statusReport.recommendations.forEach((rec, i) => {
                    console.log(`   ${i + 1}. ${rec}`);
                });
            }

            await this.saveAuditOutput('system-status.json', statusReport);
            return statusReport;

        } catch (error) {
            console.error('❌ Status check failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    async runDemo() {
        console.log('\n🎬 === AUDIT SYSTEM DEMONSTRATION ===');
        console.log('🎯 Target: Showcase all audit capabilities\n');

        try {
            console.log('⚡ Step 1: Quick audit demonstration...');
            const quickResult = await this.quickAudit();
            
            console.log('\n🗄️  Step 2: Database verification demonstration...');
            const dbResult = await this.databaseAudit();
            
            console.log('\n📊 Step 3: System status demonstration...');
            const statusResult = await this.checkStatus();

            const demoReport = {
                demoTimestamp: new Date().toISOString(),
                executionTime: Date.now() - this.startTime,
                demonstrations: {
                    quickAudit: quickResult?.status || 'FAILED',
                    databaseAudit: dbResult?.success ? 'SUCCESS' : 'FAILED',
                    statusCheck: statusResult?.system ? 'SUCCESS' : 'FAILED'
                },
                overallDemo: 'COMPLETED',
                nextSteps: [
                    'Run full audit with: npm run audit:full',
                    'Start monitoring with: npm run audit:monitor',
                    'Review evidence in audit-outputs directory'
                ]
            };

            console.log('\n🎬 === DEMONSTRATION COMPLETED ===');
            console.log(`⏱️  Total Time: ${(demoReport.executionTime / 1000).toFixed(1)}s`);
            console.log(`📊 Quick Audit: ${demoReport.demonstrations.quickAudit}`);
            console.log(`🗄️  Database: ${demoReport.demonstrations.databaseAudit}`);
            console.log(`📈 Status: ${demoReport.demonstrations.statusCheck}`);
            
            console.log('\n🎯 Next Steps:');
            demoReport.nextSteps.forEach((step, i) => {
                console.log(`   ${i + 1}. ${step}`);
            });

            await this.saveAuditOutput('demo-report.json', demoReport);
            return demoReport;

        } catch (error) {
            console.error('❌ Demo failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    // UTILITY METHODS
    async runWithTimeout(promise, timeoutMs, operationName) {
        const timeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs);
        });

        try {
            return await Promise.race([promise, timeout]);
        } catch (error) {
            if (error.message.includes('timed out')) {
                console.warn(`⚠️  ${operationName} timed out, continuing with partial results`);
                return { success: false, error: error.message, timedOut: true };
            }
            throw error;
        }
    }

    assessQuickAuditStatus(mcpResult, dbResult) {
        if (!mcpResult?.success && !dbResult?.healthy) return 'CRITICAL';
        if (!mcpResult?.success || !dbResult?.healthy) return 'DEGRADED';
        return 'HEALTHY';
    }

    generateQuickRecommendations(mcpResult, dbResult) {
        const recommendations = [];
        
        if (!mcpResult?.success) {
            recommendations.push('Run full audit to investigate MCP integration issues');
        }
        
        if (!dbResult?.healthy) {
            recommendations.push('Check database configuration and connectivity');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('System appears healthy - consider running full audit for comprehensive analysis');
        }
        
        return recommendations;
    }

    assessFullAuditStatus(standardResult, mcpResult, dbResult) {
        const scores = [
            standardResult?.success ? 1 : 0,
            mcpResult?.success ? 1 : 0,
            dbResult?.success ? 1 : 0
        ];
        
        const successRate = scores.reduce((a, b) => a + b, 0) / scores.length;
        
        if (successRate >= 1.0) return 'EXCELLENT';
        if (successRate >= 0.8) return 'GOOD';
        if (successRate >= 0.6) return 'FAIR';
        return 'POOR';
    }

    assessBusinessImpact(standardResult, mcpResult, dbResult) {
        // Database is most critical for business operations
        if (!dbResult?.success) return 'HIGH - Database issues affect core functionality';
        
        // MCP integration affects audit reliability
        if (!mcpResult?.success) return 'MEDIUM - Audit system reliability compromised';
        
        // Standard audit affects monitoring
        if (!standardResult?.success) return 'MEDIUM - System monitoring capabilities limited';
        
        return 'LOW - All systems operational';
    }

    generateExecutiveSummary(standardResult, mcpResult, dbResult) {
        return {
            systemHealth: this.assessFullAuditStatus(standardResult, mcpResult, dbResult),
            businessContinuity: this.assessBusinessImpact(standardResult, mcpResult, dbResult),
            auditCapability: mcpResult?.success ? 'OPERATIONAL' : 'IMPAIRED',
            databaseStatus: dbResult?.success ? 'HEALTHY' : 'REQUIRES_ATTENTION',
            platformReadiness: this.assessPlatformReadiness(standardResult, mcpResult, dbResult),
            riskLevel: this.assessRiskLevel(standardResult, mcpResult, dbResult)
        };
    }

    assessPlatformReadiness(standardResult, mcpResult, dbResult) {
        if (dbResult?.success && mcpResult?.success) return 'PRODUCTION_READY';
        if (dbResult?.success) return 'FUNCTIONAL_WITH_MONITORING_GAPS';
        return 'REQUIRES_FIXES_BEFORE_PRODUCTION';
    }

    assessRiskLevel(standardResult, mcpResult, dbResult) {
        if (!dbResult?.success) return 'HIGH';
        if (!mcpResult?.success || !standardResult?.success) return 'MEDIUM';
        return 'LOW';
    }

    generateActionItems(standardResult, mcpResult, dbResult) {
        const actions = [];
        
        if (!dbResult?.success) {
            actions.push({
                priority: 'URGENT',
                action: 'Resolve database connectivity and performance issues',
                component: 'database',
                impact: 'Blocks core platform functionality'
            });
        }
        
        if (!mcpResult?.success) {
            actions.push({
                priority: 'HIGH',
                action: 'Fix MCP tool integration for reliable audit execution',
                component: 'mcp_integration',
                impact: 'Reduces audit system reliability'
            });
        }
        
        if (!standardResult?.success) {
            actions.push({
                priority: 'MEDIUM',
                action: 'Address standard audit framework issues',
                component: 'audit_framework',
                impact: 'Limits monitoring and validation capabilities'
            });
        }
        
        if (actions.length === 0) {
            actions.push({
                priority: 'LOW',
                action: 'Continue regular monitoring and optimization',
                component: 'maintenance',
                impact: 'Maintains system health and performance'
            });
        }
        
        return actions;
    }

    async generateExecutiveReport(fullReport) {
        const report = `
# Triangle Intelligence Platform Audit Report
**Generated:** ${new Date(fullReport.timestamp).toLocaleString()}
**Execution Time:** ${(fullReport.executionTime / 1000).toFixed(1)} seconds

## Executive Summary
- **Overall Status:** ${fullReport.overallStatus}
- **Business Impact:** ${fullReport.businessImpact}
- **Platform Readiness:** ${fullReport.executiveSummary.platformReadiness}
- **Risk Level:** ${fullReport.executiveSummary.riskLevel}

## System Health Assessment
- **Database Status:** ${fullReport.executiveSummary.databaseStatus}
- **Audit Capability:** ${fullReport.executiveSummary.auditCapability}
- **Business Continuity:** ${fullReport.executiveSummary.businessContinuity}

## Key Findings
### Standard Audit Framework
**Status:** ${fullReport.results.standardAudit?.success ? '✅ Operational' : '❌ Issues Detected'}
${fullReport.results.standardAudit?.summary ? `**Platform Status:** ${fullReport.results.standardAudit.summary.executiveSummary?.platformStatus}` : ''}

### MCP Tool Integration
**Status:** ${fullReport.results.mcpIntegration?.success !== false ? '✅ Operational' : '❌ Issues Detected'}
${fullReport.results.mcpIntegration?.results ? `**Files Analyzed:** ${fullReport.results.mcpIntegration.results.filesAnalyzed}` : ''}

### Database Verification
**Status:** ${fullReport.results.databaseVerification?.success ? '✅ Healthy' : '❌ Issues Detected'}
${fullReport.results.databaseVerification?.results?.connectivity ? `**Connectivity:** ${fullReport.results.databaseVerification.results.connectivity.status}` : ''}
${fullReport.results.databaseVerification?.results?.performance ? `**Performance:** ${fullReport.results.databaseVerification.results.performance.performanceGrade}` : ''}

## Action Items
${fullReport.actionItems.map((item, i) => `
${i + 1}. **${item.priority}**: ${item.action}
   - Component: ${item.component}
   - Impact: ${item.impact}
`).join('')}

## Business Context Alignment
Based on the business context for Triangle Intelligence's key customer personas:

### Sarah (Compliance Manager)
- **USMCA Compliance:** ${fullReport.results.standardAudit?.summary?.testResults?.businessLogic?.usmcaCompliance ? '✅ Validated' : '⚠️ Requires Verification'}
- **Risk Assessment:** ${fullReport.executiveSummary.riskLevel} risk level for compliance operations

### Mike (Procurement Team)  
- **Tariff Calculations:** ${fullReport.results.standardAudit?.summary?.testResults?.businessLogic?.tariffCalculations ? '✅ Validated' : '⚠️ Requires Verification'}
- **Cost Savings Analysis:** Platform readiness for procurement optimization

### Lisa (Finance Executive)
- **Business Continuity:** ${fullReport.executiveSummary.businessContinuity}
- **Platform ROI:** ${fullReport.executiveSummary.platformReadiness === 'PRODUCTION_READY' ? 'Ready for customer value delivery' : 'Requires fixes before customer deployment'}

## Evidence and Documentation
- **Standard Audit Evidence:** ${fullReport.results.standardAudit?.evidenceDir || 'Not available'}
- **MCP Analysis Evidence:** ${fullReport.results.mcpIntegration?.evidenceDirectory || 'Not available'}  
- **Database Verification:** ${fullReport.results.databaseVerification?.evidenceDir || 'Not available'}

## Recommendations for Continued Excellence
1. **Immediate Actions:** Address any URGENT priority items identified above
2. **Monitoring:** Set up continuous monitoring for ongoing system health
3. **Regular Audits:** Schedule weekly full audits during active development
4. **Business Validation:** Test actual customer scenarios (electronics, automotive, fashion)

---
*This report validates Triangle Intelligence platform readiness for serving compliance managers, procurement teams, and finance executives with accurate USMCA qualification and tariff optimization.*
`;

        await fs.writeFile(path.join(this.outputDir, 'EXECUTIVE-AUDIT-REPORT.md'), report);
        console.log('📋 Executive report generated: EXECUTIVE-AUDIT-REPORT.md');
    }

    async checkFileSystemAccess() {
        try {
            const testFile = path.join(this.outputDir, 'fs-test.txt');
            await fs.writeFile(testFile, 'test');
            await fs.unlink(testFile);
            return true;
        } catch {
            return false;
        }
    }

    async checkAuditHistory() {
        try {
            const historyDir = path.join(process.cwd(), 'audit-history');
            const historyExists = await fs.access(historyDir).then(() => true).catch(() => false);
            
            if (!historyExists) {
                return { available: false, recentCount: 0, lastAudit: null };
            }

            const audits = await fs.readdir(historyDir);
            const recentAudits = audits.filter(name => {
                const auditTime = parseInt(name.match(/\d{13}/)?.[0]);
                if (!auditTime) return false;
                return Date.now() - auditTime < 7 * 24 * 60 * 60 * 1000; // Last 7 days
            });

            const lastAudit = recentAudits.length > 0 ? 
                new Date(Math.max(...recentAudits.map(name => parseInt(name.match(/\d{13}/)?.[0])))).toLocaleString() :
                null;

            return {
                available: true,
                recentCount: recentAudits.length,
                lastAudit
            };
            
        } catch {
            return { available: false, recentCount: 0, lastAudit: null };
        }
    }

    generateStatusRecommendations(dbStatus, fsStatus, auditHistory) {
        const recommendations = [];
        
        if (!dbStatus) {
            recommendations.push('Check database configuration and run database audit');
        }
        
        if (!fsStatus) {
            recommendations.push('Verify file system permissions for audit output directory');
        }
        
        if (auditHistory.recentCount === 0) {
            recommendations.push('Run initial audit to establish baseline');
        } else if (auditHistory.recentCount < 3) {
            recommendations.push('Consider more frequent audits during active development');
        }
        
        return recommendations;
    }

    async saveAuditOutput(filename, data) {
        try {
            const filePath = path.join(this.outputDir, filename);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            console.log(`💾 Output saved: ${filename}`);
        } catch (error) {
            console.error(`❌ Failed to save output ${filename}:`, error.message);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI Setup with Commander.js
program
    .name('audit-cli')
    .description('Triangle Intelligence Automated Audit System')
    .version('1.0.0');

program
    .command('quick')
    .description('Run quick audit (essential checks only)')
    .action(async () => {
        const cli = new AuditCLI();
        await cli.initialize();
        await cli.quickAudit();
    });

program
    .command('full')
    .description('Run full comprehensive audit')
    .action(async () => {
        const cli = new AuditCLI();
        await cli.initialize();
        await cli.fullAudit();
    });

program
    .command('database')
    .description('Run database verification audit only')
    .action(async () => {
        const cli = new AuditCLI();
        await cli.initialize();
        await cli.databaseAudit();
    });

program
    .command('monitor')
    .description('Start continuous monitoring')
    .option('-i, --interval <minutes>', 'monitoring interval in minutes', '30')
    .action(async (options) => {
        const cli = new AuditCLI();
        await cli.initialize();
        await cli.startMonitoring(parseInt(options.interval));
    });

program
    .command('status')
    .description('Check current system status')
    .action(async () => {
        const cli = new AuditCLI();
        await cli.initialize();
        await cli.checkStatus();
    });

program
    .command('demo')
    .description('Run demonstration of all audit capabilities')
    .action(async () => {
        const cli = new AuditCLI();
        await cli.initialize();
        await cli.runDemo();
    });

// Default action
if (process.argv.length === 2) {
    program.parse(['node', 'audit-cli.js', 'demo']);
} else {
    program.parse();
}

module.exports = AuditCLI;