#!/usr/bin/env node

/**
 * Production Readiness Validation Script
 * Comprehensive checks before deployment
 */

const fs = require('fs')
const path = require('path')

class ProductionReadinessChecker {
  constructor() {
    this.checks = []
    this.passed = 0
    this.failed = 0
    this.warnings = 0
  }

  check(name, condition, severity = 'error') {
    const passed = typeof condition === 'function' ? condition() : condition
    
    this.checks.push({
      name,
      passed,
      severity
    })

    if (passed) {
      this.passed++
      console.log(`✅ ${name}`)
    } else {
      if (severity === 'error') {
        this.failed++
        console.log(`❌ ${name}`)
      } else {
        this.warnings++
        console.log(`⚠️  ${name}`)
      }
    }

    return passed
  }

  // Security Checks
  checkSecurity() {
    console.log('\n🔒 SECURITY CHECKS')
    console.log('==================')

    // Check for hardcoded credentials
    this.check('No hardcoded API keys in source', () => {
      const libFiles = this.getJSFiles('./lib')
      const pagesFiles = this.getJSFiles('./pages')
      
      for (const file of [...libFiles, ...pagesFiles]) {
        const content = fs.readFileSync(file, 'utf8')
        if (
          content.includes('sk-ant-api03-') ||
          content.includes('sk-or-v1-') ||
          content.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9') ||
          content.includes('pk_live_') ||
          content.includes('sk_live_')
        ) {
          console.log(`   Found in: ${file}`)
          return false
        }
      }
      return true
    })

    // Check .env.example exists
    this.check('.env.example template exists', fs.existsSync('./.env.example'))

    // Check .gitignore includes .env files
    this.check('.gitignore protects environment files', () => {
      if (!fs.existsSync('./.gitignore')) return false
      const gitignore = fs.readFileSync('./.gitignore', 'utf8')
      return gitignore.includes('.env') && gitignore.includes('.env.local')
    })

    // Check security middleware exists
    this.check('Security middleware implemented', fs.existsSync('./lib/security.js'))

    // Check production logging exists
    this.check('Production logging implemented', fs.existsSync('./lib/production-logger.js'))
  }

  // Configuration Checks
  checkConfiguration() {
    console.log('\n⚙️  CONFIGURATION CHECKS')
    console.log('========================')

    // Check Next.js config
    this.check('Next.js production config exists', fs.existsSync('./next.config.js'))

    // Check TypeScript strict mode
    this.check('TypeScript strict mode enabled', () => {
      if (!fs.existsSync('./tsconfig.json')) return false
      const tsconfig = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'))
      return tsconfig.compilerOptions?.strict === true
    })

    // Check package.json scripts
    this.check('Test scripts configured', () => {
      const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
      return pkg.scripts?.test && pkg.scripts?.['test:coverage']
    })

    // Check Docker configuration
    this.check('Docker configuration exists', fs.existsSync('./Dockerfile'))
    this.check('Docker Compose configuration exists', fs.existsSync('./docker-compose.yml'))
  }

  // Testing Checks
  checkTesting() {
    console.log('\n🧪 TESTING CHECKS')
    console.log('==================')

    // Check Jest configuration
    this.check('Jest configuration exists', fs.existsSync('./jest.config.js'))
    this.check('Jest setup file exists', fs.existsSync('./jest.setup.js'))

    // Check test files exist
    this.check('Unit tests exist', () => {
      return fs.existsSync('./__tests__') && 
             fs.readdirSync('./__tests__').some(file => file.endsWith('.test.js'))
    })

    // Check testing dependencies
    this.check('Testing dependencies installed', () => {
      const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
      return pkg.devDependencies?.jest && pkg.devDependencies?.['@testing-library/react']
    })
  }

  // Monitoring Checks
  checkMonitoring() {
    console.log('\n📊 MONITORING CHECKS')
    console.log('=====================')

    // Check monitoring system exists
    this.check('Monitoring system implemented', fs.existsSync('./lib/monitoring.js'))

    // Check health check endpoint
    this.check('Health check endpoint exists', fs.existsSync('./pages/api/health.js'))

    // Check error tracking setup
    this.check('Error tracking configured', () => {
      const monitoringFile = './lib/monitoring.js'
      if (!fs.existsSync(monitoringFile)) return false
      const content = fs.readFileSync(monitoringFile, 'utf8')
      return content.includes('trackError') && content.includes('createAlert')
    })
  }

  // Infrastructure Checks
  checkInfrastructure() {
    console.log('\n🚀 INFRASTRUCTURE CHECKS')
    console.log('=========================')

    // Check CI/CD pipeline
    this.check('CI/CD pipeline configured', fs.existsSync('./.github/workflows/ci-cd.yml'))

    // Check health check script
    this.check('Health check script exists', fs.existsSync('./healthcheck.js'))

    // Check environment validation
    this.check('Environment validation implemented', fs.existsSync('./lib/environment-validation.js'))
  }

  // Performance Checks
  checkPerformance() {
    console.log('\n⚡ PERFORMANCE CHECKS')
    console.log('=====================')

    // Check bundle analysis setup
    this.check('Bundle analysis configured', () => {
      const nextConfig = './next.config.js'
      if (!fs.existsSync(nextConfig)) return false
      const content = fs.readFileSync(nextConfig, 'utf8')
      return content.includes('BundleAnalyzerPlugin') || content.includes('ANALYZE')
    })

    // Check image optimization
    this.check('Image optimization configured', () => {
      const nextConfig = './next.config.js'
      if (!fs.existsSync(nextConfig)) return false
      const content = fs.readFileSync(nextConfig, 'utf8')
      return content.includes('images:')
    })

    // Check caching strategy
    this.check('Intelligent caching implemented', () => {
      return fs.existsSync('./lib/database-intelligence-bridge.js') &&
             fs.existsSync('./lib/api-strategy-manager.js')
    }, 'warning')
  }

  // Code Quality Checks
  checkCodeQuality() {
    console.log('\n📝 CODE QUALITY CHECKS')
    console.log('=======================')

    // Check for console.log in production code
    this.check('No console.log in production code', () => {
      const prodFiles = [
        ...this.getJSFiles('./lib'),
        ...this.getJSFiles('./pages/api')
      ]
      
      for (const file of prodFiles) {
        const content = fs.readFileSync(file, 'utf8')
        // Allow console.log in development checks or specific contexts
        const lines = content.split('\n')
        for (const line of lines) {
          if (line.includes('console.log') && 
              !line.includes('isDevelopment') && 
              !line.includes('development') &&
              !line.includes('//') &&
              !line.includes('process.env.NODE_ENV')) {
            console.log(`   Found console.log in: ${file}`)
            return false
          }
        }
      }
      return true
    })

    // Check TypeScript usage
    this.check('TypeScript types defined', fs.existsSync('./types/index.ts'))

    // Check environment variable validation
    this.check('Environment variables validated', () => {
      const envValidation = './lib/environment-validation.js'
      if (!fs.existsSync(envValidation)) return false
      const content = fs.readFileSync(envValidation, 'utf8')
      return content.includes('validateEnvironment') && content.includes('REQUIRED_ENV_VARS')
    })
  }

  // Helper method to get JS files
  getJSFiles(dir) {
    if (!fs.existsSync(dir)) return []
    
    const files = []
    const items = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name)
      if (item.isDirectory()) {
        files.push(...this.getJSFiles(fullPath))
      } else if (item.name.endsWith('.js') || item.name.endsWith('.jsx')) {
        files.push(fullPath)
      }
    }
    
    return files
  }

  // Run all checks
  run() {
    console.log('🔍 TRIANGLE INTELLIGENCE - PRODUCTION READINESS CHECK')
    console.log('=====================================================')
    
    this.checkSecurity()
    this.checkConfiguration()
    this.checkTesting()
    this.checkMonitoring()
    this.checkInfrastructure()
    this.checkPerformance()
    this.checkCodeQuality()
    
    // Summary
    console.log('\n📊 SUMMARY')
    console.log('===========')
    console.log(`✅ Passed: ${this.passed}`)
    console.log(`❌ Failed: ${this.failed}`)
    console.log(`⚠️  Warnings: ${this.warnings}`)
    console.log(`📊 Total: ${this.checks.length}`)
    
    const passRate = (this.passed / this.checks.length) * 100
    console.log(`📈 Pass Rate: ${passRate.toFixed(1)}%`)
    
    // Production readiness score
    let score = passRate
    if (this.failed > 0) score = Math.max(0, score - (this.failed * 10))
    
    console.log(`🎯 Production Readiness Score: ${score.toFixed(1)}/100`)
    
    if (score >= 85) {
      console.log('\n🎉 PRODUCTION READY!')
      console.log('✅ System meets production deployment criteria')
    } else if (score >= 70) {
      console.log('\n⚠️  NEEDS IMPROVEMENT')
      console.log('🔧 Address failed checks before production deployment')
    } else {
      console.log('\n❌ NOT PRODUCTION READY')
      console.log('🚫 Critical issues must be resolved before deployment')
    }
    
    // Exit code
    process.exit(this.failed > 0 ? 1 : 0)
  }
}

// Run the checker
const checker = new ProductionReadinessChecker()
checker.run()