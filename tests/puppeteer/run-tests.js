#!/usr/bin/env node

/**
 * Triangle Intelligence Dashboard Test Runner
 * Executes comprehensive UI tests and generates reports
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class TestRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0
      }
    };
  }

  async ensureDirectories() {
    const dirs = [
      path.join(__dirname, 'screenshots'),
      path.join(__dirname, 'reports'),
      path.join(__dirname, 'videos')
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory already exists
      }
    }
  }

  async checkDependencies() {
    console.log('📦 Checking dependencies...');

    try {
      // Check if Puppeteer is installed
      require('puppeteer');
      console.log('✅ Puppeteer found');
    } catch (error) {
      console.log('❌ Puppeteer not found. Installing...');
      await this.installDependency('puppeteer');
    }

    console.log('✅ All dependencies ready');
  }

  async installDependency(packageName) {
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install', packageName], {
        cwd: path.join(__dirname, '..', '..'),
        stdio: 'inherit'
      });

      npm.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${packageName} installed successfully`);
          resolve();
        } else {
          reject(new Error(`Failed to install ${packageName}`));
        }
      });
    });
  }

  async startDevServer() {
    console.log('🚀 Starting development server...');

    return new Promise((resolve, reject) => {
      const devServer = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, '..', '..'),
        stdio: 'pipe'
      });

      let serverReady = false;
      const timeout = setTimeout(() => {
        if (!serverReady) {
          devServer.kill();
          reject(new Error('Dev server failed to start within 30 seconds'));
        }
      }, 30000);

      devServer.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('🔧', output.trim());

        if (output.includes('ready') || output.includes('Ready') || output.includes('localhost:3000')) {
          clearTimeout(timeout);
          serverReady = true;
          console.log('✅ Development server is ready');
          resolve(devServer);
        }
      });

      devServer.stderr.on('data', (data) => {
        console.error('❌ Dev server error:', data.toString());
      });

      devServer.on('close', (code) => {
        if (!serverReady) {
          reject(new Error(`Dev server exited with code ${code}`));
        }
      });
    });
  }

  async runUITests() {
    console.log('🧪 Running comprehensive UI tests...');

    const startTime = Date.now();

    try {
      // Import and run the main test suite
      const DashboardUITester = require('./dashboard-ui-tests');
      const tester = new DashboardUITester();

      await tester.runAllTests();

      this.results.tests.push({
        name: 'Dashboard UI Tests',
        status: 'passed',
        duration: Date.now() - startTime
      });

      console.log('✅ UI tests completed successfully');

    } catch (error) {
      console.error('❌ UI tests failed:', error);

      this.results.tests.push({
        name: 'Dashboard UI Tests',
        status: 'failed',
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  }

  async generateFinalReport() {
    console.log('📊 Generating comprehensive test report...');

    // Calculate summary
    this.results.summary.total = this.results.tests.length;
    this.results.summary.passed = this.results.tests.filter(t => t.status === 'passed').length;
    this.results.summary.failed = this.results.tests.filter(t => t.status === 'failed').length;
    this.results.summary.duration = this.results.tests.reduce((sum, test) => sum + (test.duration || 0), 0);

    // Generate detailed HTML report
    const htmlReport = this.generateHTMLReport();
    const reportPath = path.join(__dirname, 'reports', `test-report-${Date.now()}.html`);
    await fs.writeFile(reportPath, htmlReport);

    // Generate JSON report
    const jsonPath = path.join(__dirname, 'reports', 'latest-results.json');
    await fs.writeFile(jsonPath, JSON.stringify(this.results, null, 2));

    console.log('📊 Reports generated:');
    console.log(`   HTML: ${reportPath}`);
    console.log(`   JSON: ${jsonPath}`);

    // Print summary
    console.log('\n📈 TEST SUMMARY:');
    console.log(`   Total Tests: ${this.results.summary.total}`);
    console.log(`   Passed: ${this.results.summary.passed} ✅`);
    console.log(`   Failed: ${this.results.summary.failed} ❌`);
    console.log(`   Duration: ${Math.round(this.results.summary.duration / 1000)}s`);

    return this.results.summary.failed === 0;
  }

  generateHTMLReport() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Triangle Intelligence - Test Report</title>
    <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #134169 0%, #009CEB 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5rem; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary { display: flex; gap: 20px; padding: 30px; }
        .metric { flex: 1; text-align: center; }
        .metric-value { font-size: 2.5rem; font-weight: bold; margin-bottom: 10px; }
        .metric-label { color: #666; font-size: 0.9rem; }
        .passed { color: #16a34a; }
        .failed { color: #dc2626; }
        .tests { padding: 0 30px 30px; }
        .test-item { padding: 15px; border: 1px solid #e0e0e0; border-radius: 6px; margin-bottom: 10px; }
        .test-passed { border-left: 4px solid #16a34a; background: #f0fdf4; }
        .test-failed { border-left: 4px solid #dc2626; background: #fef2f2; }
        .test-name { font-weight: bold; margin-bottom: 5px; }
        .test-duration { color: #666; font-size: 0.9rem; }
        .error { color: #dc2626; margin-top: 10px; font-family: monospace; background: #fee; padding: 10px; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #e0e0e0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔬 Test Report</h1>
            <p>Triangle Intelligence Dashboard Testing Suite</p>
            <p>Generated: ${new Date(this.results.timestamp).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value">${this.results.summary.total}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value passed">${this.results.summary.passed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value failed">${this.results.summary.failed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.round(this.results.summary.duration / 1000)}s</div>
                <div class="metric-label">Duration</div>
            </div>
        </div>

        <div class="tests">
            <h2>Test Details</h2>
            ${this.results.tests.map(test => `
                <div class="test-item ${test.status === 'passed' ? 'test-passed' : 'test-failed'}">
                    <div class="test-name">${test.name}</div>
                    <div class="test-duration">Duration: ${Math.round((test.duration || 0) / 1000)}s</div>
                    ${test.error ? `<div class="error">Error: ${test.error}</div>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>Triangle Intelligence Platform - Automated Testing Suite</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  async cleanup(devServer) {
    if (devServer) {
      console.log('🧹 Shutting down development server...');
      devServer.kill('SIGTERM');

      // Give it time to shut down gracefully
      setTimeout(() => {
        if (!devServer.killed) {
          devServer.kill('SIGKILL');
        }
      }, 5000);
    }
  }

  async run() {
    console.log('🚀 Triangle Intelligence Test Runner Starting...\n');

    let devServer = null;

    try {
      await this.ensureDirectories();
      await this.checkDependencies();

      // Start dev server
      devServer = await this.startDevServer();

      // Wait a bit for server to stabilize
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Run tests
      await this.runUITests();

      // Generate reports
      const allPassed = await this.generateFinalReport();

      console.log('\n🎉 Test execution completed!');
      process.exit(allPassed ? 0 : 1);

    } catch (error) {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup(devServer);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(console.error);
}

module.exports = TestRunner;