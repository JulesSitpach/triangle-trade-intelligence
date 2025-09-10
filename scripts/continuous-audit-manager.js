#!/usr/bin/env node

/**
 * Continuous Audit Manager for Triangle Intelligence
 * 
 * Provides persistent state management, continuous monitoring, and
 * intelligent audit scheduling with automated evidence preservation.
 * 
 * Features:
 * - Session state persistence across restarts
 * - Intelligent audit scheduling based on system changes
 * - Automated baseline management and regression detection
 * - Real-time violation detection and alerting
 * - Comprehensive audit history and trend analysis
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const TriangleAuditSystem = require('./automated-audit-system');
const AutomatedMCPIntegration = require('./automated-mcp-integration');

class ContinuousAuditManager extends EventEmitter {
    constructor() {
        super();
        this.managerId = `audit_manager_${Date.now()}`;
        this.stateDir = path.join(process.cwd(), 'audit-state');
        this.historyDir = path.join(process.cwd(), 'audit-history');
        this.baselineDir = path.join(process.cwd(), 'audit-baselines');
        
        this.state = {
            managerId: this.managerId,
            currentBaseline: null,
            auditSchedule: {},
            violations: [],
            trends: {},
            lastAudit: null,
            systemFingerprint: null,
            monitoringEnabled: false,
            alertThresholds: {
                criticalViolations: 5,
                apiFailureRate: 0.3,
                performanceDegradation: 0.5
            }
        };

        this.auditQueue = [];
        this.activeAudits = new Map();
        this.watchers = new Map();
        
        console.log(`🔄 Continuous Audit Manager Initialized`);
        console.log(`🆔 Manager ID: ${this.managerId}`);
    }

    async initialize() {
        try {
            // Create necessary directories
            await fs.mkdir(this.stateDir, { recursive: true });
            await fs.mkdir(this.historyDir, { recursive: true });
            await fs.mkdir(this.baselineDir, { recursive: true });

            // Load previous state if exists
            await this.loadPersistentState();

            // Setup file system watchers
            await this.setupFileWatchers();

            // Initialize system fingerprint
            await this.updateSystemFingerprint();

            await this.logManagerAction('INIT', 'Continuous audit manager initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize audit manager:', error.message);
            return false;
        }
    }

    // PERSISTENT STATE MANAGEMENT
    async loadPersistentState() {
        try {
            const stateFile = path.join(this.stateDir, 'manager-state.json');
            const stateExists = await fs.access(stateFile).then(() => true).catch(() => false);
            
            if (stateExists) {
                const savedState = JSON.parse(await fs.readFile(stateFile, 'utf8'));
                
                // Merge saved state with defaults
                this.state = {
                    ...this.state,
                    ...savedState,
                    managerId: this.managerId, // Always use new manager ID
                    monitoringEnabled: false  // Reset monitoring on startup
                };
                
                console.log(`📥 Loaded persistent state from previous session`);
                console.log(`📊 Last audit: ${this.state.lastAudit?.timestamp || 'Never'}`);
                console.log(`🔍 Previous violations: ${this.state.violations.length}`);
                
                await this.logManagerAction('STATE_LOADED', 'Persistent state loaded from previous session');
            }
            
        } catch (error) {
            console.warn('⚠️  Could not load persistent state:', error.message);
            await this.logManagerAction('STATE_LOAD_FAILED', error.message);
        }
    }

    async savePersistentState() {
        try {
            const stateFile = path.join(this.stateDir, 'manager-state.json');
            await fs.writeFile(stateFile, JSON.stringify(this.state, null, 2));
            
            // Also save backup with timestamp
            const backupFile = path.join(this.stateDir, `state-backup-${Date.now()}.json`);
            await fs.writeFile(backupFile, JSON.stringify(this.state, null, 2));
            
        } catch (error) {
            console.error('❌ Failed to save persistent state:', error.message);
        }
    }

    // INTELLIGENT AUDIT SCHEDULING
    async scheduleIntelligentAudit(trigger = 'manual', priority = 'normal') {
        const auditRequest = {
            id: `audit_${Date.now()}`,
            timestamp: new Date().toISOString(),
            trigger,
            priority,
            estimatedDuration: this.estimateAuditDuration(priority),
            systemFingerprint: await this.generateSystemFingerprint()
        };

        // Check if system has changed significantly
        const hasSignificantChanges = await this.detectSignificantChanges(auditRequest.systemFingerprint);
        
        if (!hasSignificantChanges && trigger === 'auto' && this.state.lastAudit) {
            const timeSinceLastAudit = Date.now() - new Date(this.state.lastAudit.timestamp).getTime();
            if (timeSinceLastAudit < 30 * 60 * 1000) { // Less than 30 minutes
                console.log('⏭️  Skipping audit - no significant changes detected');
                return null;
            }
        }

        this.auditQueue.push(auditRequest);
        
        console.log(`📅 Audit scheduled: ${auditRequest.id}`);
        console.log(`🔄 Trigger: ${trigger}, Priority: ${priority}`);
        console.log(`⏱️  Estimated Duration: ${auditRequest.estimatedDuration}ms`);
        
        await this.logManagerAction('AUDIT_SCHEDULED', `Audit ${auditRequest.id} scheduled with priority ${priority}`);
        
        // Process queue if not already processing
        if (this.auditQueue.length === 1) {
            setTimeout(() => this.processAuditQueue(), 1000);
        }
        
        return auditRequest.id;
    }

    async processAuditQueue() {
        while (this.auditQueue.length > 0) {
            const auditRequest = this.auditQueue.shift();
            
            try {
                console.log(`\n🚀 Processing audit: ${auditRequest.id}`);
                
                const startTime = Date.now();
                this.activeAudits.set(auditRequest.id, { ...auditRequest, startTime });
                
                // Execute appropriate audit type based on priority
                let auditResult;
                if (auditRequest.priority === 'quick' || auditRequest.priority === 'low') {
                    auditResult = await this.executeQuickAudit(auditRequest);
                } else {
                    auditResult = await this.executeFullAudit(auditRequest);
                }
                
                // Process audit results
                await this.processAuditResults(auditRequest, auditResult);
                
                this.activeAudits.delete(auditRequest.id);
                
                const executionTime = Date.now() - startTime;
                console.log(`✅ Audit completed: ${auditRequest.id} (${executionTime}ms)`);
                
            } catch (error) {
                console.error(`❌ Audit failed: ${auditRequest.id}`, error.message);
                this.activeAudits.delete(auditRequest.id);
                
                await this.logManagerAction('AUDIT_FAILED', `Audit ${auditRequest.id} failed: ${error.message}`);
            }
        }
    }

    async executeQuickAudit(auditRequest) {
        console.log('⚡ Executing quick audit with MCP integration...');
        
        const mcpIntegration = new AutomatedMCPIntegration(auditRequest.id);
        
        // Override for quick execution
        mcpIntegration.automatedCodeDiscovery = async function() {
            console.log('📖 Quick code discovery (essential files only)...');
            
            const essentialFiles = [
                'package.json',
                'pages/api/system-status.js',
                'pages/api/simple-usmca-compliance.js',
                'pages/api/simple-savings.js'
            ];

            const results = {
                filesRead: 0,
                totalLines: 0,
                implementations: {},
                evidence: []
            };

            for (const filePath of essentialFiles) {
                try {
                    const analysis = await this.readAndAnalyzeFile(filePath);
                    results.filesRead++;
                    results.totalLines += analysis.lineCount;
                    results.implementations[filePath] = analysis;
                    
                    results.evidence.push({
                        tool: 'READ',
                        file: filePath,
                        timestamp: new Date().toISOString(),
                        analysis: analysis
                    });
                } catch (error) {
                    console.warn(`⚠️  Quick read failed for ${filePath}`);
                }
            }

            await this.saveMCPEvidence('quick-read-analysis.json', results);
            return results;
        };

        return await mcpIntegration.runComprehensiveMCPAudit();
    }

    async executeFullAudit(auditRequest) {
        console.log('🔍 Executing full comprehensive audit...');
        
        const auditSystem = new TriangleAuditSystem();
        const auditResult = await auditSystem.runCompleteAudit();
        
        // Also run MCP integration for comprehensive evidence
        const mcpIntegration = new AutomatedMCPIntegration(auditRequest.id + '_mcp');
        const mcpResult = await mcpIntegration.runComprehensiveMCPAudit();
        
        // Combine results
        return {
            ...auditResult,
            mcpAnalysis: mcpResult,
            combinedEvidence: {
                standardAudit: auditResult.evidenceDir,
                mcpAnalysis: mcpResult.evidenceDirectory
            }
        };
    }

    async processAuditResults(auditRequest, auditResult) {
        // Update state with latest audit
        this.state.lastAudit = {
            id: auditRequest.id,
            timestamp: new Date().toISOString(),
            trigger: auditRequest.trigger,
            success: auditResult.success !== false,
            summary: auditResult.summary || auditResult.comprehensiveAnalysis
        };

        // Archive audit results
        await this.archiveAuditResults(auditRequest.id, auditResult);

        // Update baseline if appropriate
        await this.updateBaselineIfNeeded(auditResult);

        // Detect and record violations
        await this.detectAndRecordViolations(auditResult);

        // Update trends
        await this.updateTrends(auditResult);

        // Check alert conditions
        await this.checkAlertConditions(auditResult);

        // Save updated state
        await this.savePersistentState();

        // Emit events for external listeners
        this.emit('auditCompleted', {
            auditId: auditRequest.id,
            result: auditResult,
            violations: this.state.violations.filter(v => v.auditId === auditRequest.id)
        });
    }

    // BASELINE MANAGEMENT
    async updateBaselineIfNeeded(auditResult) {
        try {
            const shouldUpdateBaseline = await this.evaluateBaselineUpdate(auditResult);
            
            if (shouldUpdateBaseline) {
                const baselineId = `baseline_${Date.now()}`;
                const baselinePath = path.join(this.baselineDir, `${baselineId}.json`);
                
                const baseline = {
                    id: baselineId,
                    timestamp: new Date().toISOString(),
                    auditResult: auditResult,
                    systemFingerprint: await this.generateSystemFingerprint(),
                    metrics: this.extractBaselineMetrics(auditResult)
                };

                await fs.writeFile(baselinePath, JSON.stringify(baseline, null, 2));
                
                this.state.currentBaseline = baselineId;
                console.log(`📊 Updated baseline: ${baselineId}`);
                
                await this.logManagerAction('BASELINE_UPDATED', `New baseline established: ${baselineId}`);
            }
            
        } catch (error) {
            console.error('❌ Failed to update baseline:', error.message);
        }
    }

    async evaluateBaselineUpdate(auditResult) {
        // Update baseline if:
        // 1. No current baseline exists
        // 2. Significant improvement in metrics
        // 3. Major system changes detected
        
        if (!this.state.currentBaseline) {
            return true;
        }

        if (!auditResult.success || (auditResult.summary?.executiveSummary?.criticalIssues > 0)) {
            return false; // Don't update baseline with failing audits
        }

        // Check for improvement
        const currentMetrics = this.extractBaselineMetrics(auditResult);
        const baselineMetrics = await this.loadBaselineMetrics();
        
        if (baselineMetrics) {
            const improvement = this.calculateMetricImprovement(currentMetrics, baselineMetrics);
            return improvement.overall > 0.1; // 10% improvement threshold
        }

        return false;
    }

    extractBaselineMetrics(auditResult) {
        return {
            successRate: this.parseSuccessRate(auditResult.summary?.executiveSummary?.testSuccessRate),
            criticalIssues: auditResult.summary?.executiveSummary?.criticalIssues || 0,
            apiEndpoints: auditResult.summary?.systemOverview?.architecture?.apiEndpoints || 0,
            buildTime: auditResult.summary?.testResults?.performance?.buildTime || -1,
            businessReadiness: auditResult.summary?.executiveSummary?.businessReadiness,
            timestamp: new Date().toISOString()
        };
    }

    // VIOLATION DETECTION AND ALERTING
    async detectAndRecordViolations(auditResult) {
        const violations = [];

        // Critical system violations
        if (!auditResult.success) {
            violations.push({
                id: `violation_${Date.now()}`,
                type: 'AUDIT_FAILURE',
                severity: 'CRITICAL',
                description: 'Complete audit system failure',
                auditId: auditResult.auditId,
                timestamp: new Date().toISOString()
            });
        }

        // Business logic violations
        if (auditResult.summary?.testResults?.businessLogic) {
            const businessLogic = auditResult.summary.testResults.businessLogic;
            
            if (!businessLogic.usmcaCompliance) {
                violations.push({
                    id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'BUSINESS_LOGIC_FAILURE',
                    severity: 'HIGH',
                    description: 'USMCA compliance logic validation failed',
                    component: 'usmcaCompliance',
                    auditId: auditResult.auditId,
                    timestamp: new Date().toISOString()
                });
            }

            if (!businessLogic.tariffCalculations) {
                violations.push({
                    id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'BUSINESS_LOGIC_FAILURE',
                    severity: 'HIGH',
                    description: 'Tariff calculation logic validation failed',
                    component: 'tariffCalculations',
                    auditId: auditResult.auditId,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Performance violations
        if (auditResult.summary?.testResults?.performance?.buildTime > 60000) {
            violations.push({
                id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'PERFORMANCE_VIOLATION',
                severity: 'MEDIUM',
                description: `Build time exceeded 60s: ${auditResult.summary.testResults.performance.buildTime}ms`,
                component: 'build_performance',
                auditId: auditResult.auditId,
                timestamp: new Date().toISOString()
            });
        }

        // API violations
        if (auditResult.summary?.testResults?.apiTesting) {
            const apiTesting = auditResult.summary.testResults.apiTesting;
            const failureRate = apiTesting.total > 0 ? apiTesting.failed / apiTesting.total : 0;
            
            if (failureRate > this.state.alertThresholds.apiFailureRate) {
                violations.push({
                    id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'API_FAILURE_RATE',
                    severity: 'HIGH',
                    description: `API failure rate ${(failureRate * 100).toFixed(1)}% exceeds threshold`,
                    component: 'api_testing',
                    metrics: { failureRate, failed: apiTesting.failed, total: apiTesting.total },
                    auditId: auditResult.auditId,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Add violations to state
        this.state.violations.push(...violations);

        // Keep only recent violations (last 100)
        if (this.state.violations.length > 100) {
            this.state.violations = this.state.violations.slice(-100);
        }

        if (violations.length > 0) {
            console.log(`🚨 Detected ${violations.length} violations in audit ${auditResult.auditId}`);
            violations.forEach(v => {
                console.log(`   ${v.severity}: ${v.description}`);
            });
        }

        return violations;
    }

    async checkAlertConditions(auditResult) {
        const recentViolations = this.state.violations.filter(v => {
            const violationTime = new Date(v.timestamp).getTime();
            const cutoff = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
            return violationTime > cutoff;
        });

        const criticalViolations = recentViolations.filter(v => v.severity === 'CRITICAL').length;
        const highViolations = recentViolations.filter(v => v.severity === 'HIGH').length;

        // Check critical alert conditions
        if (criticalViolations >= this.state.alertThresholds.criticalViolations) {
            await this.sendAlert('CRITICAL_VIOLATIONS', {
                count: criticalViolations,
                threshold: this.state.alertThresholds.criticalViolations,
                timeframe: '24 hours',
                auditId: auditResult.auditId
            });
        }

        // Check business continuity alerts
        const businessReadiness = auditResult.summary?.executiveSummary?.businessReadiness;
        if (businessReadiness === 'NEEDS_SIGNIFICANT_WORK') {
            await this.sendAlert('BUSINESS_CONTINUITY_RISK', {
                readiness: businessReadiness,
                criticalIssues: auditResult.summary?.executiveSummary?.criticalIssues,
                auditId: auditResult.auditId
            });
        }
    }

    // FILE SYSTEM MONITORING
    async setupFileWatchers() {
        try {
            const watchPaths = [
                'pages/api',
                'lib',
                'components',
                'config',
                'package.json'
            ];

            for (const watchPath of watchPaths) {
                try {
                    const pathExists = await fs.access(watchPath).then(() => true).catch(() => false);
                    if (pathExists) {
                        const { watch } = require('chokidar');
                        const watcher = watch(watchPath, {
                            ignored: /(^|[\/\\])\../, // ignore dotfiles
                            persistent: true,
                            ignoreInitial: true
                        });

                        watcher.on('change', (filePath) => this.handleFileChange(filePath));
                        watcher.on('add', (filePath) => this.handleFileChange(filePath, 'added'));
                        watcher.on('unlink', (filePath) => this.handleFileChange(filePath, 'deleted'));

                        this.watchers.set(watchPath, watcher);
                        console.log(`👀 Watching: ${watchPath}`);
                    }
                } catch (error) {
                    console.warn(`⚠️  Could not watch ${watchPath}:`, error.message);
                }
            }
        } catch (error) {
            console.error('❌ Failed to setup file watchers:', error.message);
        }
    }

    async handleFileChange(filePath, changeType = 'modified') {
        console.log(`📝 File ${changeType}: ${filePath}`);
        
        // Update system fingerprint
        await this.updateSystemFingerprint();
        
        // Schedule intelligent audit based on file importance
        const priority = this.assessFileImportance(filePath);
        if (priority !== 'ignore') {
            setTimeout(() => {
                this.scheduleIntelligentAudit('file_change', priority);
            }, 5000); // Debounce file changes
        }
    }

    assessFileImportance(filePath) {
        if (filePath.includes('/api/')) return 'high';
        if (filePath.includes('lib/') && filePath.includes('classification')) return 'high';
        if (filePath.includes('config/')) return 'medium';
        if (filePath.includes('package.json')) return 'medium';
        if (filePath.includes('components/')) return 'low';
        return 'ignore';
    }

    // SYSTEM FINGERPRINTING
    async generateSystemFingerprint() {
        try {
            const fingerprint = {
                timestamp: new Date().toISOString(),
                packageJson: await this.getFileHash('package.json'),
                apiFiles: await this.getDirectoryFingerprint('pages/api'),
                libFiles: await this.getDirectoryFingerprint('lib'),
                configFiles: await this.getDirectoryFingerprint('config'),
                nodeModulesSize: await this.getDirectorySize('node_modules')
            };
            
            return this.hashObject(fingerprint);
            
        } catch (error) {
            console.warn('⚠️  Could not generate system fingerprint:', error.message);
            return null;
        }
    }

    async updateSystemFingerprint() {
        const newFingerprint = await this.generateSystemFingerprint();
        if (newFingerprint && newFingerprint !== this.state.systemFingerprint) {
            this.state.systemFingerprint = newFingerprint;
            await this.logManagerAction('FINGERPRINT_UPDATED', 'System fingerprint updated due to changes');
        }
    }

    async detectSignificantChanges(newFingerprint) {
        if (!this.state.systemFingerprint || !newFingerprint) {
            return true; // Assume changes if we can't fingerprint
        }
        
        return this.state.systemFingerprint !== newFingerprint;
    }

    // TREND ANALYSIS
    async updateTrends(auditResult) {
        const metrics = this.extractBaselineMetrics(auditResult);
        const timestamp = Date.now();
        
        // Initialize trend tracking
        if (!this.state.trends.successRate) {
            this.state.trends = {
                successRate: [],
                criticalIssues: [],
                buildTime: [],
                businessReadiness: []
            };
        }

        // Add current metrics to trends
        this.state.trends.successRate.push({ timestamp, value: metrics.successRate });
        this.state.trends.criticalIssues.push({ timestamp, value: metrics.criticalIssues });
        this.state.trends.buildTime.push({ timestamp, value: metrics.buildTime });
        this.state.trends.businessReadiness.push({ timestamp, value: metrics.businessReadiness });

        // Keep only last 50 data points for each trend
        Object.keys(this.state.trends).forEach(key => {
            if (this.state.trends[key].length > 50) {
                this.state.trends[key] = this.state.trends[key].slice(-50);
            }
        });

        await this.logManagerAction('TRENDS_UPDATED', 'Audit trends updated with latest metrics');
    }

    // MONITORING CONTROL
    async startContinuousMonitoring(intervalMinutes = 30) {
        if (this.state.monitoringEnabled) {
            console.log('🔄 Continuous monitoring already running');
            return;
        }

        this.state.monitoringEnabled = true;
        console.log(`🔄 Starting continuous monitoring (${intervalMinutes} minute intervals)`);

        const monitoringLoop = async () => {
            if (!this.state.monitoringEnabled) {
                return; // Exit monitoring loop
            }

            console.log(`\n🔄 === CONTINUOUS MONITORING CYCLE ===`);
            console.log(`⏰ ${new Date().toLocaleString()}`);

            try {
                await this.scheduleIntelligentAudit('continuous_monitoring', 'quick');
            } catch (error) {
                console.error('❌ Monitoring cycle error:', error.message);
            }

            // Schedule next monitoring cycle
            setTimeout(monitoringLoop, intervalMinutes * 60 * 1000);
        };

        // Start monitoring loop
        setTimeout(monitoringLoop, 1000);
        
        await this.logManagerAction('MONITORING_STARTED', `Continuous monitoring started with ${intervalMinutes} minute intervals`);
    }

    async stopContinuousMonitoring() {
        this.state.monitoringEnabled = false;
        console.log('🛑 Continuous monitoring stopped');
        await this.logManagerAction('MONITORING_STOPPED', 'Continuous monitoring stopped');
    }

    // UTILITY METHODS
    async sendAlert(alertType, details) {
        const alert = {
            id: `alert_${Date.now()}`,
            type: alertType,
            severity: 'HIGH',
            timestamp: new Date().toISOString(),
            details,
            managerId: this.managerId
        };

        console.log(`🚨 === ALERT TRIGGERED ===`);
        console.log(`🚨 Type: ${alertType}`);
        console.log(`🚨 Details:`, JSON.stringify(details, null, 2));

        // Save alert to file
        const alertFile = path.join(this.stateDir, 'alerts.jsonl');
        await fs.appendFile(alertFile, JSON.stringify(alert) + '\n');

        // Emit alert event
        this.emit('alertTriggered', alert);

        return alert;
    }

    async archiveAuditResults(auditId, auditResult) {
        try {
            const archiveDir = path.join(this.historyDir, auditId);
            await fs.mkdir(archiveDir, { recursive: true });

            // Save audit result summary
            await fs.writeFile(
                path.join(archiveDir, 'audit-summary.json'),
                JSON.stringify(auditResult, null, 2)
            );

            // Copy evidence directories if they exist
            if (auditResult.evidenceDir) {
                await this.copyDirectory(auditResult.evidenceDir, path.join(archiveDir, 'evidence'));
            }

            if (auditResult.combinedEvidence) {
                if (auditResult.combinedEvidence.standardAudit) {
                    await this.copyDirectory(
                        auditResult.combinedEvidence.standardAudit,
                        path.join(archiveDir, 'standard-audit')
                    );
                }
                if (auditResult.combinedEvidence.mcpAnalysis) {
                    await this.copyDirectory(
                        auditResult.combinedEvidence.mcpAnalysis,
                        path.join(archiveDir, 'mcp-analysis')
                    );
                }
            }

            console.log(`📦 Archived audit results: ${archiveDir}`);
            
        } catch (error) {
            console.error(`❌ Failed to archive audit ${auditId}:`, error.message);
        }
    }

    estimateAuditDuration(priority) {
        switch (priority) {
            case 'quick':
            case 'low':
                return 60000; // 1 minute
            case 'medium':
                return 180000; // 3 minutes
            case 'high':
            case 'normal':
                return 300000; // 5 minutes
            default:
                return 180000;
        }
    }

    parseSuccessRate(successRateString) {
        if (!successRateString) return 0;
        return parseFloat(successRateString.replace('%', '')) || 0;
    }

    calculateMetricImprovement(current, baseline) {
        const improvements = {};
        
        improvements.successRate = (current.successRate - baseline.successRate) / 100;
        improvements.criticalIssues = baseline.criticalIssues - current.criticalIssues; // Lower is better
        improvements.buildTime = baseline.buildTime > 0 ? 
            (baseline.buildTime - current.buildTime) / baseline.buildTime : 0;
        
        // Calculate overall improvement
        improvements.overall = (
            improvements.successRate + 
            Math.max(0, improvements.criticalIssues / 10) + 
            Math.max(0, improvements.buildTime)
        ) / 3;
        
        return improvements;
    }

    async loadBaselineMetrics() {
        if (!this.state.currentBaseline) return null;
        
        try {
            const baselinePath = path.join(this.baselineDir, `${this.state.currentBaseline}.json`);
            const baseline = JSON.parse(await fs.readFile(baselinePath, 'utf8'));
            return baseline.metrics;
        } catch (error) {
            console.warn('⚠️  Could not load baseline metrics:', error.message);
            return null;
        }
    }

    async getFileHash(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return this.hashString(content);
        } catch {
            return null;
        }
    }

    async getDirectoryFingerprint(dirPath) {
        try {
            const files = await fs.readdir(dirPath);
            const fingerprints = await Promise.all(
                files.map(async file => {
                    const fullPath = path.join(dirPath, file);
                    const stat = await fs.stat(fullPath);
                    return `${file}:${stat.size}:${stat.mtime.getTime()}`;
                })
            );
            return this.hashString(fingerprints.sort().join('|'));
        } catch {
            return null;
        }
    }

    async getDirectorySize(dirPath) {
        try {
            const { spawn } = require('child_process');
            return new Promise((resolve) => {
                const du = spawn('du', ['-sb', dirPath]);
                let output = '';
                du.stdout.on('data', (data) => output += data);
                du.on('close', () => {
                    const size = parseInt(output.split('\t')[0]) || 0;
                    resolve(size);
                });
                du.on('error', () => resolve(0));
            });
        } catch {
            return 0;
        }
    }

    hashString(str) {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(str).digest('hex');
    }

    hashObject(obj) {
        return this.hashString(JSON.stringify(obj));
    }

    async copyDirectory(source, destination) {
        try {
            await fs.mkdir(destination, { recursive: true });
            const files = await fs.readdir(source);
            
            for (const file of files) {
                const sourcePath = path.join(source, file);
                const destPath = path.join(destination, file);
                const stat = await fs.stat(sourcePath);
                
                if (stat.isDirectory()) {
                    await this.copyDirectory(sourcePath, destPath);
                } else {
                    await fs.copyFile(sourcePath, destPath);
                }
            }
        } catch (error) {
            console.warn(`⚠️  Copy failed for ${source}:`, error.message);
        }
    }

    async logManagerAction(action, message) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            managerId: this.managerId,
            action,
            message
        };
        
        try {
            const logFile = path.join(this.stateDir, 'manager-actions.jsonl');
            await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.warn('⚠️  Could not save manager action log:', error.message);
        }
    }

    // PUBLIC API METHODS
    async getStatus() {
        return {
            managerId: this.managerId,
            monitoringEnabled: this.state.monitoringEnabled,
            lastAudit: this.state.lastAudit,
            queueLength: this.auditQueue.length,
            activeAudits: this.activeAudits.size,
            violationsCount: this.state.violations.length,
            currentBaseline: this.state.currentBaseline,
            systemFingerprint: this.state.systemFingerprint
        };
    }

    async getViolationsSummary() {
        const recent24h = this.state.violations.filter(v => {
            return Date.now() - new Date(v.timestamp).getTime() < 24 * 60 * 60 * 1000;
        });

        return {
            total: this.state.violations.length,
            recent24h: recent24h.length,
            bySeverity: {
                critical: this.state.violations.filter(v => v.severity === 'CRITICAL').length,
                high: this.state.violations.filter(v => v.severity === 'HIGH').length,
                medium: this.state.violations.filter(v => v.severity === 'MEDIUM').length,
                low: this.state.violations.filter(v => v.severity === 'LOW').length
            },
            byType: this.state.violations.reduce((acc, v) => {
                acc[v.type] = (acc[v.type] || 0) + 1;
                return acc;
            }, {})
        };
    }

    async getTrends() {
        return this.state.trends;
    }

    async cleanup() {
        // Stop monitoring
        await this.stopContinuousMonitoring();
        
        // Close watchers
        for (const watcher of this.watchers.values()) {
            await watcher.close();
        }
        this.watchers.clear();
        
        // Save final state
        await this.savePersistentState();
        
        console.log('🧹 Audit manager cleanup completed');
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'start';
    
    const manager = new ContinuousAuditManager();
    
    // Setup graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down audit manager...');
        await manager.cleanup();
        process.exit(0);
    });

    await manager.initialize();
    
    switch (command) {
        case 'start':
            await manager.startContinuousMonitoring(parseInt(args[1]) || 30);
            break;
            
        case 'audit':
            const priority = args[1] || 'normal';
            const auditId = await manager.scheduleIntelligentAudit('manual', priority);
            console.log(`🔍 Manual audit scheduled: ${auditId}`);
            break;
            
        case 'status':
            const status = await manager.getStatus();
            console.log('📊 Manager Status:', JSON.stringify(status, null, 2));
            break;
            
        case 'violations':
            const violations = await manager.getViolationsSummary();
            console.log('🚨 Violations Summary:', JSON.stringify(violations, null, 2));
            break;
            
        case 'trends':
            const trends = await manager.getTrends();
            console.log('📈 Trend Analysis:', JSON.stringify(trends, null, 2));
            break;
            
        default:
            console.log('Available commands: start, audit, status, violations, trends');
            break;
    }
    
    // Keep process alive for monitoring
    if (command === 'start') {
        console.log('🔄 Continuous monitoring active. Press Ctrl+C to stop.');
        setInterval(() => {}, 1000); // Keep process alive
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('Fatal manager error:', error);
        process.exit(1);
    });
}

module.exports = ContinuousAuditManager;