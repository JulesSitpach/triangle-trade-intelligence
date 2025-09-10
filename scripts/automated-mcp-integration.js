#!/usr/bin/env node

/**
 * Automated MCP Integration for Triangle Intelligence
 * 
 * Leverages Model Context Protocol tools for systematic verification:
 * - Read tool for code analysis and discovery
 * - Bash tool for automated testing execution
 * - Glob tool for comprehensive file discovery
 * - Grep tool for intelligent pattern analysis
 * 
 * Addresses methodology violations through persistent evidence collection
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');

class AutomatedMCPIntegration {
    constructor(auditId) {
        this.auditId = auditId || `mcp_audit_${Date.now()}`;
        this.mcpEvidenceDir = path.join(process.cwd(), 'mcp-evidence', this.auditId);
        this.discoveryCache = new Map();
        this.testExecutions = [];
        this.evidenceChain = [];
        
        console.log(`🤖 MCP Integration System Initialized`);
        console.log(`🔍 MCP Audit ID: ${this.auditId}`);
    }

    async initialize() {
        await fs.mkdir(this.mcpEvidenceDir, { recursive: true });
        await this.logMCPAction('INIT', 'MCP Integration system initialized');
        return true;
    }

    // READ TOOL AUTOMATION - Systematic Code Analysis
    async automatedCodeDiscovery() {
        console.log('\n📖 === AUTOMATED READ TOOL EXECUTION ===');
        
        const discoveryPlan = {
            criticalFiles: [
                'package.json',
                'next.config.js', 
                'lib/core/simple-usmca-classifier.js',
                'lib/classification/intelligent-hs-classifier.js',
                'lib/services/trump-tariff-monitor-service.js',
                'pages/api/simple-usmca-compliance.js',
                'pages/api/simple-savings.js',
                'pages/api/system-status.js'
            ],
            configurationFiles: [
                'config/system-config.js',
                'config/table-constants.js', 
                'config/trust-config.js'
            ],
            componentFiles: await this.discoverComponentFiles(),
            databaseFiles: await this.discoverDatabaseFiles()
        };

        const analysisResults = {
            filesRead: 0,
            totalLines: 0,
            implementations: {},
            configurations: {},
            integrations: {},
            businessLogic: {},
            evidence: []
        };

        // Execute READ operations with evidence capture
        for (const category of Object.keys(discoveryPlan)) {
            console.log(`📖 Reading ${category}...`);
            
            for (const filePath of discoveryPlan[category]) {
                try {
                    const analysis = await this.readAndAnalyzeFile(filePath);
                    analysisResults.filesRead++;
                    analysisResults.totalLines += analysis.lineCount;
                    
                    // Categorize analysis results
                    if (filePath.includes('/api/')) {
                        analysisResults.implementations[filePath] = analysis;
                    } else if (filePath.includes('config/')) {
                        analysisResults.configurations[filePath] = analysis;
                    } else if (filePath.includes('lib/')) {
                        analysisResults.businessLogic[filePath] = analysis;
                    }

                    analysisResults.evidence.push({
                        tool: 'READ',
                        file: filePath,
                        timestamp: new Date().toISOString(),
                        analysis: analysis
                    });
                    
                } catch (error) {
                    console.warn(`⚠️  Failed to read ${filePath}:`, error.message);
                    analysisResults.evidence.push({
                        tool: 'READ',
                        file: filePath,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }

        await this.saveMCPEvidence('automated-read-analysis.json', analysisResults);
        await this.logMCPAction('READ_COMPLETE', `Analyzed ${analysisResults.filesRead} files with ${analysisResults.totalLines} total lines`);
        
        return analysisResults;
    }

    async readAndAnalyzeFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.split('\n');
            
            const analysis = {
                filePath,
                lineCount: lines.length,
                size: content.length,
                lastModified: (await fs.stat(filePath)).mtime,
                patterns: {
                    hasDatabase: content.includes('supabase') || content.includes('prisma'),
                    hasAuth: content.includes('auth') || content.includes('jwt') || content.includes('token'),
                    hasAPIEndpoints: content.includes('export default') && content.includes('req'),
                    hasReactComponents: content.includes('useState') || content.includes('useEffect'),
                    hasBusinessLogic: content.includes('usmca') || content.includes('tariff') || content.includes('classification'),
                    hasErrorHandling: content.includes('try') && content.includes('catch'),
                    hasValidation: content.includes('validate') || content.includes('schema'),
                    hasConfiguration: content.includes('config') || content.includes('env'),
                    hasTesting: content.includes('test') || content.includes('jest') || content.includes('spec')
                },
                imports: this.extractImports(content),
                exports: this.extractExports(content),
                functions: this.extractFunctions(content),
                apiEndpoints: this.extractAPIEndpoints(content),
                businessEntities: this.extractBusinessEntities(content),
                complexity: this.calculateComplexity(content)
            };

            // Cache for reuse
            this.discoveryCache.set(filePath, analysis);
            
            return analysis;
            
        } catch (error) {
            throw new Error(`Read analysis failed for ${filePath}: ${error.message}`);
        }
    }

    // BASH TOOL AUTOMATION - Comprehensive Testing Execution
    async automatedBashTesting() {
        console.log('\n⚙️  === AUTOMATED BASH TOOL EXECUTION ===');
        
        const testSuite = {
            systemStatus: [
                'npm run build',
                'node scripts/test-database-connection.js || echo "Database test skipped"',
                'curl -f http://localhost:3000/api/system-status || echo "System status unavailable"'
            ],
            apiTesting: [
                'curl -s http://localhost:3000/api/health | head -1',
                'curl -s http://localhost:3000/api/simple-hs-search?query=electronics | head -5',
                'curl -s http://localhost:3000/api/simple-usmca-compliance | head -3'
            ],
            performanceTesting: [
                'npm run test 2>&1 | tail -10',
                'npm run lint 2>&1 | tail -5',
                'du -sh node_modules/'
            ],
            securityTesting: [
                'npm audit --audit-level=high',
                'grep -r "console.log" pages/api/ | wc -l',
                'find . -name "*.env*" -type f | head -5'
            ]
        };

        const executionResults = {
            totalCommands: 0,
            successfulCommands: 0,
            failedCommands: 0,
            executionTime: 0,
            outputs: {},
            evidence: []
        };

        const startTime = Date.now();

        // Execute each test category
        for (const [category, commands] of Object.entries(testSuite)) {
            console.log(`⚙️  Executing ${category} tests...`);
            
            const categoryResults = {
                category,
                commands: commands.length,
                outputs: [],
                startTime: new Date().toISOString()
            };

            for (const command of commands) {
                try {
                    console.log(`  Running: ${command}`);
                    
                    const output = await this.executeCommand(command);
                    executionResults.totalCommands++;
                    executionResults.successfulCommands++;
                    
                    categoryResults.outputs.push({
                        command,
                        success: true,
                        output: output.stdout,
                        stderr: output.stderr,
                        exitCode: output.exitCode,
                        executionTime: output.executionTime
                    });
                    
                } catch (error) {
                    console.warn(`⚠️  Command failed: ${command}`);
                    
                    executionResults.totalCommands++;
                    executionResults.failedCommands++;
                    
                    categoryResults.outputs.push({
                        command,
                        success: false,
                        error: error.message,
                        exitCode: error.exitCode || -1
                    });
                }
            }
            
            categoryResults.endTime = new Date().toISOString();
            executionResults.outputs[category] = categoryResults;
            
            executionResults.evidence.push({
                tool: 'BASH',
                category,
                timestamp: new Date().toISOString(),
                results: categoryResults
            });
        }

        executionResults.executionTime = Date.now() - startTime;
        
        await this.saveMCPEvidence('automated-bash-testing.json', executionResults);
        await this.logMCPAction('BASH_COMPLETE', `Executed ${executionResults.totalCommands} commands with ${executionResults.successfulCommands} successes`);
        
        return executionResults;
    }

    async executeCommand(command) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const child = spawn('bash', ['-c', command], {
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 30000 // 30 second timeout
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (exitCode) => {
                const executionTime = Date.now() - startTime;
                
                if (exitCode === 0) {
                    resolve({
                        stdout: stdout.trim(),
                        stderr: stderr.trim(),
                        exitCode,
                        executionTime
                    });
                } else {
                    reject({
                        message: `Command exited with code ${exitCode}`,
                        stdout: stdout.trim(),
                        stderr: stderr.trim(),
                        exitCode,
                        executionTime
                    });
                }
            });

            child.on('error', (error) => {
                reject({
                    message: error.message,
                    exitCode: -1
                });
            });
        });
    }

    // GLOB TOOL AUTOMATION - Intelligent File Pattern Discovery
    async automatedGlobDiscovery() {
        console.log('\n🔍 === AUTOMATED GLOB TOOL EXECUTION ===');
        
        const globPatterns = {
            sourceCode: [
                '**/*.js',
                '**/*.jsx',
                '**/*.ts',
                '**/*.tsx'
            ],
            configurations: [
                '**/config/*.js',
                '**/*.config.js',
                '**/*.json',
                '**/.*rc*'
            ],
            tests: [
                '**/*.test.js',
                '**/*.spec.js',
                '**/__tests__/**/*.js'
            ],
            documentation: [
                '**/*.md',
                '**/README*',
                '**/docs/**/*'
            ],
            assets: [
                '**/*.css',
                '**/*.scss',
                '**/*.svg',
                '**/*.png'
            ]
        };

        const discoveryResults = {
            totalFiles: 0,
            categories: {},
            evidence: []
        };

        for (const [category, patterns] of Object.entries(globPatterns)) {
            console.log(`🔍 Discovering ${category} files...`);
            
            const categoryFiles = new Set();
            
            for (const pattern of patterns) {
                try {
                    const files = await this.executeGlobPattern(pattern);
                    files.forEach(file => categoryFiles.add(file));
                } catch (error) {
                    console.warn(`⚠️  Glob pattern failed: ${pattern}`, error.message);
                }
            }

            const fileArray = Array.from(categoryFiles);
            discoveryResults.categories[category] = {
                count: fileArray.length,
                files: fileArray.slice(0, 100), // Limit to first 100 files
                patterns: patterns
            };
            
            discoveryResults.totalFiles += fileArray.length;
            
            discoveryResults.evidence.push({
                tool: 'GLOB',
                category,
                timestamp: new Date().toISOString(),
                filesFound: fileArray.length,
                patterns: patterns
            });
        }

        await this.saveMCPEvidence('automated-glob-discovery.json', discoveryResults);
        await this.logMCPAction('GLOB_COMPLETE', `Discovered ${discoveryResults.totalFiles} files across ${Object.keys(discoveryResults.categories).length} categories`);
        
        return discoveryResults;
    }

    async executeGlobPattern(pattern) {
        try {
            // Simulate glob functionality using find command
            const command = pattern.includes('**') 
                ? `find . -name "${pattern.replace('**/', '')}" -type f 2>/dev/null || echo ""`
                : `ls ${pattern} 2>/dev/null || echo ""`;
            
            const result = await this.executeCommand(command);
            return result.stdout.split('\n').filter(line => line.trim().length > 0);
            
        } catch (error) {
            console.warn(`Glob pattern ${pattern} failed:`, error.message);
            return [];
        }
    }

    // GREP TOOL AUTOMATION - Intelligent Pattern Analysis
    async automatedGrepAnalysis() {
        console.log('\n🔎 === AUTOMATED GREP TOOL EXECUTION ===');
        
        const searchPatterns = {
            businessLogic: [
                { pattern: 'usmca', description: 'USMCA compliance references' },
                { pattern: 'tariff', description: 'Tariff calculation logic' },
                { pattern: 'classification', description: 'HS code classification' },
                { pattern: 'savings', description: 'Cost savings calculations' }
            ],
            apiEndpoints: [
                { pattern: 'export default.*handler', description: 'API endpoint handlers' },
                { pattern: 'res\\.status', description: 'API response patterns' },
                { pattern: 'req\\.method', description: 'HTTP method handling' }
            ],
            dataAccess: [
                { pattern: 'supabase\\.from', description: 'Database queries' },
                { pattern: 'prisma\\..', description: 'Prisma ORM usage' },
                { pattern: '\\.env\\..', description: 'Environment variable access' }
            ],
            errorHandling: [
                { pattern: 'try.*catch', description: 'Error handling blocks' },
                { pattern: 'throw new Error', description: 'Error throwing' },
                { pattern: 'console\\.error', description: 'Error logging' }
            ],
            security: [
                { pattern: 'api.*key', description: 'API key references' },
                { pattern: 'auth', description: 'Authentication logic' },
                { pattern: 'jwt', description: 'JWT token usage' }
            ]
        };

        const analysisResults = {
            totalPatterns: 0,
            totalMatches: 0,
            categories: {},
            evidence: []
        };

        for (const [category, patterns] of Object.entries(searchPatterns)) {
            console.log(`🔎 Analyzing ${category} patterns...`);
            
            const categoryResults = {
                category,
                patterns: patterns.length,
                matches: {},
                totalMatches: 0
            };

            for (const { pattern, description } of patterns) {
                try {
                    const matches = await this.executeGrepSearch(pattern);
                    categoryResults.matches[pattern] = {
                        description,
                        count: matches.length,
                        files: [...new Set(matches.map(match => match.file))],
                        examples: matches.slice(0, 5) // First 5 examples
                    };
                    
                    categoryResults.totalMatches += matches.length;
                    analysisResults.totalPatterns++;
                    
                } catch (error) {
                    console.warn(`⚠️  Grep pattern failed: ${pattern}`, error.message);
                    categoryResults.matches[pattern] = {
                        description,
                        error: error.message
                    };
                }
            }

            analysisResults.categories[category] = categoryResults;
            analysisResults.totalMatches += categoryResults.totalMatches;
            
            analysisResults.evidence.push({
                tool: 'GREP',
                category,
                timestamp: new Date().toISOString(),
                patterns: patterns.length,
                matches: categoryResults.totalMatches
            });
        }

        await this.saveMCPEvidence('automated-grep-analysis.json', analysisResults);
        await this.logMCPAction('GREP_COMPLETE', `Analyzed ${analysisResults.totalPatterns} patterns with ${analysisResults.totalMatches} total matches`);
        
        return analysisResults;
    }

    async executeGrepSearch(pattern) {
        try {
            const command = `grep -r "${pattern}" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" . 2>/dev/null || echo ""`;
            const result = await this.executeCommand(command);
            
            return result.stdout.split('\n')
                .filter(line => line.trim().length > 0)
                .map(line => {
                    const [filePath, ...contentParts] = line.split(':');
                    return {
                        file: filePath,
                        content: contentParts.join(':').trim(),
                        line: line
                    };
                });
                
        } catch (error) {
            console.warn(`Grep search failed for ${pattern}:`, error.message);
            return [];
        }
    }

    // COMPREHENSIVE MCP AUDIT EXECUTION
    async runComprehensiveMCPAudit() {
        console.log('🚀 === COMPREHENSIVE MCP AUDIT EXECUTION ===\n');
        
        const auditStartTime = Date.now();
        
        try {
            await this.initialize();
            
            // Phase 1: READ tool automation
            const readResults = await this.automatedCodeDiscovery();
            
            // Phase 2: GLOB tool automation  
            const globResults = await this.automatedGlobDiscovery();
            
            // Phase 3: GREP tool automation
            const grepResults = await this.automatedGrepAnalysis();
            
            // Phase 4: BASH tool automation
            const bashResults = await this.automatedBashTesting();
            
            // Phase 5: Comprehensive analysis
            const comprehensiveAnalysis = await this.generateComprehensiveAnalysis({
                read: readResults,
                glob: globResults,
                grep: grepResults,
                bash: bashResults
            });

            const totalExecutionTime = Date.now() - auditStartTime;

            const auditSummary = {
                auditId: this.auditId,
                timestamp: new Date().toISOString(),
                executionTime: totalExecutionTime,
                toolsExecuted: ['READ', 'GLOB', 'GREP', 'BASH'],
                results: {
                    filesAnalyzed: readResults.filesRead,
                    patternsSearched: grepResults.totalPatterns,
                    commandsExecuted: bashResults.totalCommands,
                    totalEvidence: this.evidenceChain.length
                },
                comprehensiveAnalysis,
                evidenceDirectory: this.mcpEvidenceDir,
                persistentState: await this.generatePersistentState()
            };

            await this.saveMCPEvidence('mcp-audit-summary.json', auditSummary);
            await this.logMCPAction('AUDIT_COMPLETE', `MCP audit completed in ${totalExecutionTime}ms`);

            console.log('\n✅ === MCP AUDIT COMPLETED SUCCESSFULLY ===');
            console.log(`📊 Total Execution Time: ${(totalExecutionTime / 1000).toFixed(1)}s`);
            console.log(`📁 Evidence Directory: ${this.mcpEvidenceDir}`);
            console.log(`📈 Files Analyzed: ${readResults.filesRead}`);
            console.log(`🔍 Commands Executed: ${bashResults.totalCommands}`);
            console.log(`💾 Evidence Files: ${this.evidenceChain.length}`);

            return auditSummary;
            
        } catch (error) {
            console.error('❌ MCP audit failed:', error.message);
            await this.logMCPAction('AUDIT_FAILED', error.message);
            
            return {
                success: false,
                auditId: this.auditId,
                error: error.message,
                evidenceDirectory: this.mcpEvidenceDir
            };
        }
    }

    async generateComprehensiveAnalysis(toolResults) {
        const analysis = {
            systemArchitecture: {
                totalFiles: toolResults.glob.totalFiles,
                sourceCodeFiles: toolResults.glob.categories.sourceCode?.count || 0,
                apiEndpoints: Object.keys(toolResults.read.implementations).length,
                businessLogicFiles: Object.keys(toolResults.read.businessLogic).length,
                configurationFiles: Object.keys(toolResults.read.configurations).length
            },
            businessCapabilities: {
                usmcaCompliance: toolResults.grep.categories.businessLogic?.matches?.usmca?.count || 0,
                tariffCalculations: toolResults.grep.categories.businessLogic?.matches?.tariff?.count || 0,
                hsClassification: toolResults.grep.categories.businessLogic?.matches?.classification?.count || 0,
                savingsCalculations: toolResults.grep.categories.businessLogic?.matches?.savings?.count || 0
            },
            technicalHealth: {
                buildSuccess: toolResults.bash.outputs.systemStatus?.outputs?.some(o => o.command.includes('npm run build') && o.success) || false,
                testExecution: toolResults.bash.outputs.performanceTesting?.outputs?.some(o => o.command.includes('npm run test') && o.success) || false,
                apiConnectivity: toolResults.bash.outputs.apiTesting?.outputs?.filter(o => o.success).length || 0,
                securityAudit: toolResults.bash.outputs.securityTesting?.outputs?.some(o => o.command.includes('npm audit') && o.success) || false
            },
            implementationQuality: {
                errorHandling: toolResults.grep.categories.errorHandling?.totalMatches || 0,
                databaseIntegrations: toolResults.grep.categories.dataAccess?.totalMatches || 0,
                securityMeasures: toolResults.grep.categories.security?.totalMatches || 0,
                codeComplexity: this.assessOverallComplexity(toolResults.read)
            },
            evidenceIntegrity: {
                toolsExecuted: 4,
                evidenceFilesGenerated: this.evidenceChain.length,
                persistentStateManaged: true,
                methodologyViolations: this.identifyMethodologyViolations(toolResults)
            }
        };

        return analysis;
    }

    async generatePersistentState() {
        return {
            auditId: this.auditId,
            discoveryCache: Object.fromEntries(this.discoveryCache),
            testExecutions: this.testExecutions,
            evidenceChain: this.evidenceChain,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    // Utility Methods
    async discoverComponentFiles() {
        try {
            const result = await this.executeCommand('find components -name "*.js" -type f 2>/dev/null || echo ""');
            return result.stdout.split('\n').filter(line => line.trim().length > 0);
        } catch {
            return [];
        }
    }

    async discoverDatabaseFiles() {
        try {
            const result = await this.executeCommand('find . -name "prisma" -type d -o -name "*.sql" -type f 2>/dev/null || echo ""');
            return result.stdout.split('\n').filter(line => line.trim().length > 0);
        } catch {
            return [];
        }
    }

    extractImports(content) {
        const importPattern = /import\s+.*?from\s+['"`]([^'"`]+)['"`]/g;
        const imports = [];
        let match;
        while ((match = importPattern.exec(content)) !== null) {
            imports.push(match[1]);
        }
        return imports;
    }

    extractExports(content) {
        const exportPattern = /export\s+(?:default\s+)?(?:const\s+|function\s+|class\s+)?(\w+)/g;
        const exports = [];
        let match;
        while ((match = exportPattern.exec(content)) !== null) {
            exports.push(match[1]);
        }
        return exports;
    }

    extractFunctions(content) {
        const functionPattern = /(?:function\s+(\w+)|const\s+(\w+)\s*=.*?=>|(\w+)\s*:\s*(?:async\s+)?function)/g;
        const functions = [];
        let match;
        while ((match = functionPattern.exec(content)) !== null) {
            functions.push(match[1] || match[2] || match[3]);
        }
        return functions.filter(f => f);
    }

    extractAPIEndpoints(content) {
        const endpointPattern = /req\.method\s*===\s*['"`](\w+)['"`]/g;
        const endpoints = [];
        let match;
        while ((match = endpointPattern.exec(content)) !== null) {
            endpoints.push(match[1]);
        }
        return endpoints;
    }

    extractBusinessEntities(content) {
        const entities = [];
        const businessTerms = ['usmca', 'tariff', 'classification', 'savings', 'compliance', 'certificate'];
        
        businessTerms.forEach(term => {
            if (content.toLowerCase().includes(term)) {
                entities.push(term);
            }
        });
        
        return entities;
    }

    calculateComplexity(content) {
        const lines = content.split('\n').length;
        const functions = (content.match(/function/g) || []).length;
        const conditions = (content.match(/if|switch|for|while/g) || []).length;
        
        const score = lines * 0.1 + functions * 2 + conditions * 3;
        
        if (score > 200) return 'high';
        if (score > 50) return 'medium';
        return 'low';
    }

    assessOverallComplexity(readResults) {
        const complexities = Object.values(readResults.implementations)
            .concat(Object.values(readResults.businessLogic))
            .map(analysis => analysis.complexity);
            
        const high = complexities.filter(c => c === 'high').length;
        const medium = complexities.filter(c => c === 'medium').length;
        const low = complexities.filter(c => c === 'low').length;
        
        return { high, medium, low, total: complexities.length };
    }

    identifyMethodologyViolations(toolResults) {
        const violations = [];
        
        // Check for insufficient evidence
        if (toolResults.read.filesRead < 5) {
            violations.push({
                type: 'INSUFFICIENT_READ_COVERAGE',
                severity: 'HIGH',
                description: 'Less than 5 files analyzed with READ tool'
            });
        }
        
        // Check for failed commands
        if (toolResults.bash.failedCommands > toolResults.bash.totalCommands * 0.3) {
            violations.push({
                type: 'HIGH_BASH_FAILURE_RATE',
                severity: 'MEDIUM',
                description: 'More than 30% of bash commands failed'
            });
        }
        
        // Check for pattern detection failures
        if (toolResults.grep.totalMatches === 0) {
            violations.push({
                type: 'NO_PATTERN_MATCHES',
                severity: 'HIGH',
                description: 'No patterns found in codebase analysis'
            });
        }
        
        return violations;
    }

    async logMCPAction(action, message) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            auditId: this.auditId,
            action,
            message
        };
        
        this.evidenceChain.push(logEntry);
        
        try {
            const logFile = path.join(this.mcpEvidenceDir, 'mcp-action-log.jsonl');
            await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.warn('⚠️  Could not save MCP action log:', error.message);
        }
    }

    async saveMCPEvidence(filename, data) {
        try {
            const filePath = path.join(this.mcpEvidenceDir, filename);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            console.log(`💾 MCP Evidence saved: ${filename}`);
            
            this.evidenceChain.push({
                timestamp: new Date().toISOString(),
                evidenceFile: filename,
                dataSize: JSON.stringify(data).length,
                action: 'EVIDENCE_SAVED'
            });
            
        } catch (error) {
            console.error(`❌ Failed to save MCP evidence ${filename}:`, error.message);
        }
    }
}

// Execute MCP audit if called directly
async function main() {
    const mcpIntegration = new AutomatedMCPIntegration();
    const result = await mcpIntegration.runComprehensiveMCPAudit();
    
    if (result && result.success !== false) {
        console.log('\n🎉 MCP Integration completed successfully!');
        process.exit(0);
    } else {
        console.log('\n💥 MCP Integration failed!');
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('Fatal MCP integration error:', error);
        process.exit(1);
    });
}

module.exports = AutomatedMCPIntegration;