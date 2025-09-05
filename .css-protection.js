#!/usr/bin/env node
/**
 * CSS Protection System - Prevents unauthorized CSS modifications
 * Protects globals.css and dashboard.css from bloat and contamination
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CSS_PROTECTION_CONFIG = {
  // Protected CSS files with their allowed line counts
  protectedFiles: {
    'styles/globals.css': {
      maxLines: 800,
      currentLines: 738,
      purpose: 'Pre-signin pages only'
    },
    'styles/dashboard.css': {
      maxLines: 800, 
      currentLines: 746,
      purpose: 'Post-signin dashboard functionality'
    }
  },
  
  // Forbidden patterns that indicate violations
  forbiddenPatterns: [
    // Inline styles
    { pattern: /style\s*=\s*{/, message: 'React inline styles detected' },
    { pattern: /style\s*=\s*"/, message: 'HTML style attributes detected' },
    
    // Tailwind CSS utility classes (exclude legitimate custom classes)
    { pattern: /className="[^"]*\b(bg-(red|blue|green|yellow|purple|pink|gray|indigo|teal|orange|cyan|rose|stone|neutral|zinc|slate|emerald|lime|amber|sky|violet|fuchsia|black|white)(-\d+)?|text-(xs|sm|base|lg|xl|\d+xl)|p-\d+|px-\d+|py-\d+|m-\d+|mx-\d+|my-\d+|w-\d+|h-\d+|flex-(row|col|wrap)|grid-(cols-\d+|rows-\d+)|border-\d+|rounded(-\w+)?|shadow(-\w+)?|space-(x-\d+|y-\d+)|gap-\d+|justify-(center|between|around|evenly)|items-(center|start|end)|hover:\w+|focus:\w+)\b/, message: 'Actual Tailwind CSS utility classes detected' },
    
    // CSS framework imports
    { pattern: /@tailwind/, message: 'Tailwind CSS imports detected' },
    { pattern: /@apply/, message: 'Tailwind @apply directives detected' },
    { pattern: /bootstrap\.css|tailwind\.css/i, message: 'CSS framework imports detected' },
    
    // Unauthorized CSS additions
    { pattern: /\/\*\s*ADDED BY AI\s*\*\//, message: 'Unauthorized AI modifications detected' },
    { pattern: /\/\*\s*AUTO-GENERATED\s*\*\//, message: 'Auto-generated CSS detected' },
    
    // !important overrides (suspicious)
    { pattern: /!important(?![^}]*\/\*\s*APPROVED\s*\*\/)/, message: 'Unauthorized !important declarations detected' }
  ],
  
  // Allowed CSS file modifications (require explicit approval)
  approvalRequired: [
    'Adding new CSS classes',
    'Modifying existing selectors', 
    'Changing color values',
    'Adding media queries',
    'Updating CSS custom properties'
  ]
};

class CSSProtectionSystem {
  constructor() {
    this.projectRoot = process.cwd();
    this.hashFile = path.join(this.projectRoot, '.css-hashes.json');
    this.loadApprovedHashes();
  }
  
  // Load approved CSS file hashes
  loadApprovedHashes() {
    try {
      if (fs.existsSync(this.hashFile)) {
        this.approvedHashes = JSON.parse(fs.readFileSync(this.hashFile, 'utf8'));
      } else {
        this.approvedHashes = {};
        this.saveApprovedHashes();
      }
    } catch (error) {
      console.warn('⚠️  Could not load CSS hashes, creating new ones');
      this.approvedHashes = {};
    }
  }
  
  // Save approved CSS file hashes
  saveApprovedHashes() {
    fs.writeFileSync(this.hashFile, JSON.stringify(this.approvedHashes, null, 2));
  }
  
  // Generate hash for file content
  generateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }
  
  // Check if a file has been modified without approval
  checkFileIntegrity(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return { status: 'missing', message: `Protected file ${filePath} is missing` };
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const currentHash = this.generateHash(content);
    const approvedHash = this.approvedHashes[filePath];
    
    if (!approvedHash) {
      // First time - approve current state
      this.approvedHashes[filePath] = currentHash;
      this.saveApprovedHashes();
      return { status: 'approved', message: `${filePath} approved for protection` };
    }
    
    if (currentHash !== approvedHash) {
      return { 
        status: 'violation',
        message: `${filePath} has been modified without approval`,
        currentHash,
        approvedHash
      };
    }
    
    return { status: 'intact', message: `${filePath} is protected and intact` };
  }
  
  // Scan file for forbidden patterns
  scanForViolations(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);
    const violations = [];
    
    if (!fs.existsSync(fullPath)) {
      return [{ type: 'missing', message: `File ${filePath} not found` }];
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    
    // Check line count
    const config = CSS_PROTECTION_CONFIG.protectedFiles[filePath];
    if (config && lines.length > config.maxLines) {
      violations.push({
        type: 'line_count',
        message: `File exceeds maximum ${config.maxLines} lines (current: ${lines.length})`,
        line: 0
      });
    }
    
    // Check for forbidden patterns
    lines.forEach((line, index) => {
      CSS_PROTECTION_CONFIG.forbiddenPatterns.forEach(({ pattern, message }) => {
        if (pattern.test(line)) {
          violations.push({
            type: 'pattern',
            message,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    });
    
    return violations;
  }
  
  // Scan all project files for CSS violations
  scanProjectFiles(extensions = ['.js', '.jsx', '.tsx', '.ts', '.html']) {
    const violations = [];
    
    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const relativePath = path.relative(this.projectRoot, fullPath);
        
        // Skip node_modules, .next, etc.
        if (item.startsWith('.') || item === 'node_modules' || item === '.next') {
          return;
        }
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          const fileViolations = this.scanForViolations(relativePath);
          if (fileViolations.length > 0) {
            violations.push({
              file: relativePath,
              violations: fileViolations
            });
          }
        }
      });
    };
    
    scanDirectory(this.projectRoot);
    return violations;
  }
  
  // Approve current state of protected CSS files
  approveCurrentState() {
    const results = [];
    
    Object.keys(CSS_PROTECTION_CONFIG.protectedFiles).forEach(filePath => {
      const fullPath = path.join(this.projectRoot, filePath);
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const hash = this.generateHash(content);
        
        this.approvedHashes[filePath] = hash;
        
        results.push({
          file: filePath,
          status: 'approved',
          lines: content.split('\n').length,
          hash: hash.substring(0, 8)
        });
      }
    });
    
    this.saveApprovedHashes();
    return results;
  }
  
  // Full protection check
  runProtectionCheck() {
    console.log('🔒 CSS Protection System - Running Full Check\n');
    
    let hasViolations = false;
    
    // Check protected file integrity
    console.log('📋 Protected File Integrity:');
    Object.keys(CSS_PROTECTION_CONFIG.protectedFiles).forEach(filePath => {
      const result = this.checkFileIntegrity(filePath);
      const config = CSS_PROTECTION_CONFIG.protectedFiles[filePath];
      
      if (result.status === 'violation') {
        console.log(`❌ ${filePath}: ${result.message}`);
        hasViolations = true;
      } else if (result.status === 'intact') {
        console.log(`✅ ${filePath}: Protected (${config.currentLines} lines, ${config.purpose})`);
      } else if (result.status === 'approved') {
        console.log(`🆕 ${filePath}: ${result.message}`);
      }
    });
    
    // Scan for violations in project files
    console.log('\n🔍 Project-Wide CSS Violation Scan:');
    const projectViolations = this.scanProjectFiles();
    
    if (projectViolations.length === 0) {
      console.log('✅ No CSS violations found in project files');
    } else {
      hasViolations = true;
      projectViolations.forEach(({ file, violations }) => {
        console.log(`\n❌ ${file}:`);
        violations.forEach(v => {
          if (v.line > 0) {
            console.log(`   Line ${v.line}: ${v.message}`);
            if (v.content) {
              console.log(`   Code: ${v.content}`);
            }
          } else {
            console.log(`   ${v.message}`);
          }
        });
      });
    }
    
    // Summary
    console.log('\n📊 Protection Summary:');
    console.log('======================');
    
    if (hasViolations) {
      console.log('🚨 CSS PROTECTION VIOLATIONS DETECTED');
      console.log('❌ Action Required: Fix violations before proceeding');
      process.exit(1);
    } else {
      console.log('✅ All CSS protection checks passed');
      console.log('🔒 CSS files are locked and secure');
      
      // Display current stats
      Object.entries(CSS_PROTECTION_CONFIG.protectedFiles).forEach(([file, config]) => {
        console.log(`📄 ${file}: ${config.currentLines}/${config.maxLines} lines`);
      });
    }
    
    return !hasViolations;
  }
}

// CLI Interface
if (require.main === module) {
  const protection = new CSSProtectionSystem();
  const command = process.argv[2];
  
  switch (command) {
    case 'check':
      protection.runProtectionCheck();
      break;
      
    case 'approve':
      console.log('🔒 Approving current CSS state...\n');
      const results = protection.approveCurrentState();
      results.forEach(r => {
        console.log(`✅ ${r.file}: Approved (${r.lines} lines, hash: ${r.hash})`);
      });
      console.log('\n🔐 CSS files are now locked and protected');
      break;
      
    case 'status':
      Object.keys(CSS_PROTECTION_CONFIG.protectedFiles).forEach(filePath => {
        const result = protection.checkFileIntegrity(filePath);
        const config = CSS_PROTECTION_CONFIG.protectedFiles[filePath];
        console.log(`${result.status === 'intact' ? '🔒' : '⚠️ '} ${filePath}: ${result.message}`);
      });
      break;
      
    default:
      console.log('CSS Protection System Usage:');
      console.log('node .css-protection.js check    - Run full protection check');
      console.log('node .css-protection.js approve  - Approve current CSS state');
      console.log('node .css-protection.js status   - Check protection status');
  }
}

module.exports = CSSProtectionSystem;