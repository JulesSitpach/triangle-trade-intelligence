#!/usr/bin/env node
/**
 * Agent Prompt Hardcoded Values Audit
 * Finds hardcoded assumptions in AI agent prompts that won't survive policy changes
 *
 * Focus: Agent prompts are SOURCE OF TRUTH for dynamic calculations
 * If prompts have hardcoded dates/rates/thresholds, entire system is brittle
 */

const fs = require('fs');
const path = require('path');

// Patterns that indicate hardcoded assumptions in agent prompts
const AGENT_PROMPT_PATTERNS = [
  // Temporal assumptions
  {
    pattern: /as of (January|February|March|April|May|June|July|August|September|October|November|December)?\s*\d{1,2},?\s*202\d/gi,
    category: 'Hardcoded "as of" date in prompt',
    severity: 'CRITICAL',
    why: 'Prompt claims data is current as of specific date - will be stale immediately'
  },
  {
    pattern: /(current|currently|now|today|recently)\s+(rates?|policy|threshold|list|effective)/gi,
    category: 'Temporal claim without verification',
    severity: 'CRITICAL',
    why: 'Claims data is "current" but has no mechanism to verify freshness'
  },
  {
    pattern: /effective\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*202\d/gi,
    category: 'Hardcoded effective date',
    severity: 'CRITICAL',
    why: 'Policy effective date hardcoded - will be wrong when policy changes'
  },

  // Section 301 list definitions (the smoking gun)
  {
    pattern: /List\s+[1-4]A?\s*:\s*\d+\.?\d*%/gi,
    category: 'Hardcoded Section 301 list rate',
    severity: 'CRITICAL',
    why: 'Section 301 list rates change monthly - hardcoding creates stale data'
  },
  {
    pattern: /List\s+[1-4]A?\s+increased\s+(from|to)\s+\d+\.?\d*%/gi,
    category: 'Hardcoded Section 301 rate change',
    severity: 'CRITICAL',
    why: 'Historical rate change hardcoded - implies current rates are static'
  },
  {
    pattern: /(List 1|List 2|List 3|List 4A?)\s*:\s*\d+\.?\d*%\s*or\s*\d+\.?\d*%/gi,
    category: 'Hardcoded Section 301 alternative rates',
    severity: 'CRITICAL',
    why: 'Section 301 alternative rates hardcoded - should query policy_tariffs_cache'
  },

  // Threshold assumptions
  {
    pattern: /RVC\s+(threshold|requirement)\s*:\s*\d+\.?\d*%/gi,
    category: 'Hardcoded RVC threshold',
    severity: 'CRITICAL',
    why: 'USMCA thresholds vary by industry and can change in renegotiation'
  },
  {
    pattern: /(Automotive|Electronics|Textiles|Machinery)\s*:\s*\d+\.?\d*%/gi,
    category: 'Hardcoded industry threshold',
    severity: 'CRITICAL',
    why: 'Industry-specific thresholds should come from usmca_qualification_rules table'
  },
  {
    pattern: /threshold.*?(\d+\.?\d*)%.*?(automotive|electronics|textiles|machinery)/gi,
    category: 'Hardcoded industry-threshold mapping',
    severity: 'CRITICAL',
    why: 'Threshold-to-industry mapping will break when USMCA renegotiates in 2026'
  },

  // Policy structure assumptions
  {
    pattern: /USTR\s+List\s+[1-4]A?\s+(includes|contains|covers)/gi,
    category: 'Hardcoded USTR list structure',
    severity: 'HIGH',
    why: 'USTR list membership changes - should query current lists, not assume'
  },
  {
    pattern: /ITA\s+(duty-free|duty free|0%)/gi,
    category: 'Hardcoded ITA assumption',
    severity: 'HIGH',
    why: 'ITA agreements can be modified - should verify, not assume'
  },
  {
    pattern: /Section 232\s+(steel|aluminum)\s*:\s*\d+\.?\d*%/gi,
    category: 'Hardcoded Section 232 rate',
    severity: 'CRITICAL',
    why: 'Section 232 rates change by country and negotiation - should query cache'
  },

  // Rate range assumptions
  {
    pattern: /typically\s+\d+\.?\d*%\s*to\s*\d+\.?\d*%/gi,
    category: 'Hardcoded "typical" rate range',
    severity: 'HIGH',
    why: 'Claims typical range without data source - creates false expectations'
  },
  {
    pattern: /most\s+\w+\s+(pay|incur|face)\s+\d+\.?\d*%/gi,
    category: 'Hardcoded "most" rate claim',
    severity: 'HIGH',
    why: 'Claims "most X pay Y%" without statistical basis'
  },

  // Conditional logic based on hardcoded values
  {
    pattern: /if.*China.*→.*US.*\d+\.?\d*%/gi,
    category: 'Hardcoded conditional rate',
    severity: 'CRITICAL',
    why: 'Conditional logic with hardcoded rate - will be wrong when rate changes'
  },
  {
    pattern: /China\s*→\s*US\s*:\s*\d+\.?\d*%/gi,
    category: 'Hardcoded country-route rate',
    severity: 'CRITICAL',
    why: 'Trade route rate hardcoded - should query policy_tariffs_cache'
  },

  // Example data that could be mistaken for instructions
  {
    pattern: /Example:?\s*.*?\d+\.?\d*%/gi,
    category: 'Example with hardcoded percentage',
    severity: 'MEDIUM',
    why: 'AI might learn from examples and use hardcoded values as defaults'
  },
  {
    pattern: /e\.g\.,?\s*.*?\$[\d,]+/gi,
    category: 'Example with hardcoded dollar amount',
    severity: 'MEDIUM',
    why: 'AI might replicate example dollar amounts instead of calculating'
  },

  // Fallback assumptions
  {
    pattern: /assuming\s+\d+\.?\d*%/gi,
    category: 'Hardcoded fallback assumption',
    severity: 'HIGH',
    why: 'Default assumption in prompt - should error instead of silent fallback'
  },
  {
    pattern: /default\s+(to|=)\s*\d+\.?\d*%/gi,
    category: 'Hardcoded default value',
    severity: 'HIGH',
    why: 'Default rate in conditional logic - creates silent failures'
  },
];

const findings = {
  CRITICAL: [],
  HIGH: [],
  MEDIUM: []
};

let filesScanned = 0;
let totalFindings = 0;

// Agent directories to scan
const AGENT_DIRS = [
  'lib/agents',
  'pages/api/ai-*',
  'lib/tariff',
  'lib/usmca'
];

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    filesScanned++;

    AGENT_PROMPT_PATTERNS.forEach(({ pattern, category, severity, why }) => {
      lines.forEach((line, lineNumber) => {
        const matches = line.match(pattern);
        if (matches) {
          // Check if this is inside a prompt string or template literal
          const isInPrompt =
            line.includes('prompt =') ||
            line.includes('prompt:') ||
            line.includes('`') ||
            line.includes('"') ||
            content.substring(0, content.indexOf(line)).lastIndexOf('const prompt') >
            content.substring(0, content.indexOf(line)).lastIndexOf(';');

          findings[severity].push({
            file: filePath,
            line: lineNumber + 1,
            category,
            severity,
            why,
            code: line.trim(),
            matched: matches[0],
            in_prompt: isInPrompt
          });
          totalFindings++;
        }
      });
    });

  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
}

function scanDirectory(dir) {
  try {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !fullPath.includes('node_modules')) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && /\.(js|ts)$/.test(entry.name)) {
        scanFile(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error scanning directory ${dir}:`, err.message);
  }
}

// Main execution
console.log('🔍 Starting Agent Prompt Hardcoded Values Audit...\n');

const projectRoot = process.argv[2] || process.cwd();
console.log(`📂 Scanning agent prompts in: ${projectRoot}\n`);

// Scan agent directories
const agentPaths = [
  path.join(projectRoot, 'lib/agents'),
  path.join(projectRoot, 'lib/tariff'),
  path.join(projectRoot, 'lib/usmca'),
  path.join(projectRoot, 'pages/api')
];

agentPaths.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Scanning ${path.basename(dir)}/...`);
    scanDirectory(dir);
  }
});

console.log(`\n✅ Scan complete: ${filesScanned} files scanned, ${totalFindings} findings\n`);

console.log('='.repeat(80));
console.log('AGENT PROMPT AUDIT: HARDCODED VALUES');
console.log('='.repeat(80));

['CRITICAL', 'HIGH', 'MEDIUM'].forEach(severity => {
  const items = findings[severity];
  if (items.length === 0) {
    console.log(`\n✅ ${severity}: 0 findings`);
    return;
  }

  console.log(`\n🚨 ${severity}: ${items.length} findings`);
  console.log('-'.repeat(80));

  // Group by category
  const byCategory = {};
  items.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  Object.entries(byCategory).forEach(([category, categoryItems]) => {
    console.log(`\n  📌 ${category} (${categoryItems.length} occurrences):`);
    console.log(`     WHY: ${categoryItems[0].why}`);

    categoryItems.slice(0, 3).forEach(item => {
      console.log(`\n     ${item.file}:${item.line} ${item.in_prompt ? '(IN PROMPT)' : ''}`);
      console.log(`     ${item.code.substring(0, 100)}${item.code.length > 100 ? '...' : ''}`);
      console.log(`     Matched: "${item.matched}"`);
    });

    if (categoryItems.length > 3) {
      console.log(`\n     ... and ${categoryItems.length - 3} more\n`);
    }
  });
});

// Prioritized recommendations
console.log('\n' + '='.repeat(80));
console.log('RECOMMENDED FIXES (Priority Order)');
console.log('='.repeat(80));

const criticalInPrompts = findings.CRITICAL.filter(f => f.in_prompt);
const highInPrompts = findings.HIGH.filter(f => f.in_prompt);

if (criticalInPrompts.length > 0) {
  console.log('\n🔥 IMMEDIATE (CRITICAL in agent prompts):');
  console.log('   These will break when policies change - fix NOW');

  const byFile = {};
  criticalInPrompts.forEach(f => {
    const file = path.basename(f.file);
    if (!byFile[file]) byFile[file] = [];
    byFile[file].push(f);
  });

  Object.entries(byFile).forEach(([file, items]) => {
    console.log(`\n   ${file}: ${items.length} hardcoded values`);
    items.slice(0, 2).forEach(item => {
      console.log(`   - ${item.category}: "${item.matched}"`);
      console.log(`     Fix: Query database instead of hardcoding`);
    });
  });
}

if (highInPrompts.length > 0) {
  console.log('\n⚠️  HIGH PRIORITY (HIGH in agent prompts):');
  console.log('   Creates false expectations - fix this week');

  const byCategory = {};
  highInPrompts.forEach(f => {
    if (!byCategory[f.category]) byCategory[f.category] = 0;
    byCategory[f.category]++;
  });

  Object.entries(byCategory).forEach(([category, count]) => {
    console.log(`   - ${category}: ${count} instances`);
  });
}

// Save detailed report
const reportPath = path.join(projectRoot, 'agent-prompt-hardcoded-audit.json');
fs.writeFileSync(reportPath, JSON.stringify({
  summary: {
    filesScanned,
    totalFindings,
    bySeverity: {
      CRITICAL: findings.CRITICAL.length,
      CRITICAL_in_prompts: criticalInPrompts.length,
      HIGH: findings.HIGH.length,
      HIGH_in_prompts: highInPrompts.length,
      MEDIUM: findings.MEDIUM.length
    }
  },
  findings
}, null, 2));

console.log(`\n📄 Full report saved to: ${reportPath}`);

// Exit with error if critical findings exist in prompts
if (criticalInPrompts.length > 0) {
  console.log(`\n❌ AUDIT FAILED: ${criticalInPrompts.length} CRITICAL hardcoded values in agent prompts`);
  console.log('   AI agents are learning from stale/hardcoded assumptions!');
  process.exit(1);
} else {
  console.log(`\n✅ AUDIT PASSED: No critical hardcoded values in agent prompts`);
  process.exit(0);
}
