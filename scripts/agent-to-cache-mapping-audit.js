#!/usr/bin/env node
/**
 * AGENT-TO-CACHE MAPPING AUDIT
 * Identifies which agents query cache vs. which still use AI hallucination for volatile tariff data
 *
 * Outputs:
 * 1. Which agents handle which volatile policies (Section 301, 232, MFN, etc.)
 * 2. Which ones query policy_tariffs_cache (GOOD)
 * 3. Which ones use AI to "research" rates (BAD - stale training data)
 * 4. Remediation priority list
 */

const fs = require('fs');
const path = require('path');

// Volatile tariff policies that should ALWAYS come from cache
const VOLATILE_POLICIES = {
  'section_301': {
    name: 'Section 301 (China tariffs)',
    cache_table: 'policy_tariffs_cache',
    cache_column: 'section_301',
    sync_job: 'federal-register-section301-sync.js',
    ttl_days: 30
  },
  'section_232': {
    name: 'Section 232 (steel/aluminum)',
    cache_table: 'policy_tariffs_cache',
    cache_column: 'section_232_steel / section_232_aluminum',
    sync_job: 'section232-sync.js',
    ttl_days: 30
  },
  'mfn_rate': {
    name: 'MFN Base Rates',
    cache_table: 'policy_tariffs_cache',
    cache_column: 'mfn_rate',
    sync_job: 'mfn-base-rates-sync.js',
    ttl_days: 365
  },
  'reciprocal': {
    name: 'Reciprocal Tariffs',
    cache_table: 'policy_tariffs_cache',
    cache_column: 'reciprocal_rate',
    sync_job: 'NOT IMPLEMENTED',
    ttl_days: 30
  },
  'ieepa': {
    name: 'IEEPA Emergency Tariffs',
    cache_table: 'policy_tariffs_cache',
    cache_column: 'ieepa_rate',
    sync_job: 'NOT IMPLEMENTED',
    ttl_days: 30
  }
};

// Pattern detection
const PATTERNS = {
  // Good: Queries cache
  cache_query: [
    /\.from\(['"`]policy_tariffs_cache['"`]\)/,
    /\.from\(['"`]section_301_cache['"`]\)/,
    /\.from\(['"`]tariff_intelligence_master['"`]\)/,
    /getDatabaseCache/,
    /queryCache/
  ],

  // Bad: AI research of volatile rates
  ai_research: [
    /Research current.*tariff/i,
    /Determine the CURRENT.*rate/i,
    /\.execute\(.*prompt/,
    /OpenRouter.*tariff/,
    /Anthropic.*Section 301/,
    /agent\.execute/
  ],

  // Bad: Hardcoded rates
  hardcoded_rates: [
    /section_301.*=.*0\.25/,
    /List 1:.*25%/,
    /List 3:.*7\.5%/,
    /steel.*=.*0\.25/,
    /aluminum.*=.*0\.10/
  ],

  // Policy mentions (to identify which agents handle which policies)
  policy_mentions: {
    section_301: [/section[_\s]301/i, /USTR/i, /China.*tariff/i],
    section_232: [/section[_\s]232/i, /steel.*tariff/i, /aluminum.*tariff/i],
    mfn_rate: [/MFN/i, /most favored nation/i, /base.*rate/i, /general.*duty/i],
    reciprocal: [/reciprocal.*tariff/i],
    ieepa: [/IEEPA/i, /emergency.*tariff/i]
  }
};

const findings = {
  agents: [],
  summary: {
    total_agents: 0,
    query_cache: 0,
    use_ai_research: 0,
    use_hardcoded: 0,
    need_remediation: 0
  }
};

let filesScanned = 0;

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);

    filesScanned++;

    // Detect which policies this agent handles
    const handledPolicies = [];
    Object.keys(PATTERNS.policy_mentions).forEach(policy => {
      const patterns = PATTERNS.policy_mentions[policy];
      if (patterns.some(pattern => pattern.test(content))) {
        handledPolicies.push(policy);
      }
    });

    // Skip if agent doesn't handle volatile policies
    if (handledPolicies.length === 0) {
      return;
    }

    // Check data access patterns
    const queriesCache = PATTERNS.cache_query.some(pattern => pattern.test(content));
    const usesAIResearch = PATTERNS.ai_research.some(pattern => pattern.test(content));
    const usesHardcoded = PATTERNS.hardcoded_rates.some(pattern => pattern.test(content));

    // Extract code samples
    const cacheSamples = extractCodeSamples(content, PATTERNS.cache_query);
    const aiSamples = extractCodeSamples(content, PATTERNS.ai_research);
    const hardcodedSamples = extractCodeSamples(content, PATTERNS.hardcoded_rates);

    // Determine status
    let status = 'UNKNOWN';
    let severity = 'UNKNOWN';

    if (queriesCache && !usesAIResearch && !usesHardcoded) {
      status = 'GOOD';
      severity = 'NONE';
    } else if (usesAIResearch || usesHardcoded) {
      status = 'BAD';
      severity = usesHardcoded ? 'CRITICAL' : 'HIGH';
    } else if (queriesCache && (usesAIResearch || usesHardcoded)) {
      status = 'MIXED';
      severity = 'HIGH';
    }

    findings.agents.push({
      file: filePath,
      fileName,
      handledPolicies,
      status,
      severity,
      queriesCache,
      usesAIResearch,
      usesHardcoded,
      cacheSamples: cacheSamples.slice(0, 2),
      aiSamples: aiSamples.slice(0, 2),
      hardcodedSamples: hardcodedSamples.slice(0, 2)
    });

    // Update summary
    findings.summary.total_agents++;
    if (queriesCache) findings.summary.query_cache++;
    if (usesAIResearch) findings.summary.use_ai_research++;
    if (usesHardcoded) findings.summary.use_hardcoded++;
    if (status === 'BAD' || status === 'MIXED') findings.summary.need_remediation++;

  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
}

function extractCodeSamples(content, patterns) {
  const samples = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    patterns.forEach(pattern => {
      if (pattern.test(line)) {
        samples.push({
          line: index + 1,
          code: line.trim().substring(0, 100)
        });
      }
    });
  });

  return samples;
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
        analyzeFile(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error scanning directory ${dir}:`, err.message);
  }
}

// Main execution
console.log('🔍 Starting Agent-to-Cache Mapping Audit...\n');

const projectRoot = process.argv[2] || process.cwd();
console.log(`📂 Scanning agents in: ${projectRoot}\n`);

// Scan agent directories
const agentPaths = [
  path.join(projectRoot, 'lib/agents'),
  path.join(projectRoot, 'lib/tariff'),
  path.join(projectRoot, 'lib/services'),
  path.join(projectRoot, 'pages/api')
];

agentPaths.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Scanning ${path.basename(dir)}/...`);
    scanDirectory(dir);
  }
});

console.log(`\n✅ Scan complete: ${filesScanned} files scanned\n`);

// Print results
console.log('='.repeat(80));
console.log('AGENT-TO-CACHE MAPPING AUDIT RESULTS');
console.log('='.repeat(80));

console.log(`\n📊 SUMMARY:`);
console.log(`   Total agents handling volatile policies: ${findings.summary.total_agents}`);
console.log(`   ✅ Query cache (GOOD): ${findings.summary.query_cache}`);
console.log(`   ❌ Use AI research (BAD): ${findings.summary.use_ai_research}`);
console.log(`   ❌ Use hardcoded rates (BAD): ${findings.summary.use_hardcoded}`);
console.log(`   ⚠️  Need remediation: ${findings.summary.need_remediation}`);

// Group by status
const byStatus = {
  GOOD: findings.agents.filter(a => a.status === 'GOOD'),
  MIXED: findings.agents.filter(a => a.status === 'MIXED'),
  BAD: findings.agents.filter(a => a.status === 'BAD')
};

console.log('\n' + '='.repeat(80));
console.log('✅ GOOD (Query Cache Only - No Changes Needed)');
console.log('='.repeat(80));

if (byStatus.GOOD.length === 0) {
  console.log('   None found.\n');
} else {
  byStatus.GOOD.forEach(agent => {
    console.log(`\n   ${agent.fileName}`);
    console.log(`   Policies: ${agent.handledPolicies.join(', ')}`);
    console.log(`   Cache queries:`);
    agent.cacheSamples.forEach(sample => {
      console.log(`      Line ${sample.line}: ${sample.code}`);
    });
  });
}

console.log('\n' + '='.repeat(80));
console.log('⚠️  MIXED (Queries Cache BUT Also Uses AI/Hardcoded)');
console.log('='.repeat(80));

if (byStatus.MIXED.length === 0) {
  console.log('   None found.\n');
} else {
  byStatus.MIXED.forEach(agent => {
    console.log(`\n   ${agent.fileName}`);
    console.log(`   Policies: ${agent.handledPolicies.join(', ')}`);
    console.log(`   Issues:`);
    if (agent.usesAIResearch) {
      console.log(`      - Uses AI research (remove this)`);
      agent.aiSamples.forEach(sample => {
        console.log(`        Line ${sample.line}: ${sample.code}`);
      });
    }
    if (agent.usesHardcoded) {
      console.log(`      - Uses hardcoded rates (remove this)`);
      agent.hardcodedSamples.forEach(sample => {
        console.log(`        Line ${sample.line}: ${sample.code}`);
      });
    }
  });
}

console.log('\n' + '='.repeat(80));
console.log('❌ BAD (AI Research or Hardcoded - URGENT FIX NEEDED)');
console.log('='.repeat(80));

if (byStatus.BAD.length === 0) {
  console.log('   None found.\n');
} else {
  byStatus.BAD.forEach(agent => {
    console.log(`\n   🚨 ${agent.fileName}`);
    console.log(`   Severity: ${agent.severity}`);
    console.log(`   Policies: ${agent.handledPolicies.join(', ')}`);
    console.log(`   Issues:`);
    if (agent.usesHardcoded) {
      console.log(`      - HARDCODED RATES (CRITICAL):`);
      agent.hardcodedSamples.forEach(sample => {
        console.log(`        Line ${sample.line}: ${sample.code}`);
      });
    }
    if (agent.usesAIResearch) {
      console.log(`      - AI RESEARCH (uses stale training data):`);
      agent.aiSamples.forEach(sample => {
        console.log(`        Line ${sample.line}: ${sample.code}`);
      });
    }
    console.log(`   Fix: Replace with cache query to policy_tariffs_cache`);
  });
}

// Remediation priority
console.log('\n' + '='.repeat(80));
console.log('🔧 REMEDIATION PRIORITY LIST');
console.log('='.repeat(80));

const needFix = findings.agents.filter(a => a.status === 'BAD' || a.status === 'MIXED');

if (needFix.length === 0) {
  console.log('\n✅ All agents query cache correctly - no remediation needed!\n');
} else {
  // Sort by severity (CRITICAL > HIGH > MEDIUM)
  needFix.sort((a, b) => {
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  console.log('\nFix in this order:\n');

  needFix.forEach((agent, index) => {
    console.log(`${index + 1}. [${agent.severity}] ${agent.fileName}`);
    console.log(`   Policies: ${agent.handledPolicies.join(', ')}`);

    // Provide specific fix instructions
    agent.handledPolicies.forEach(policy => {
      const policyInfo = VOLATILE_POLICIES[policy];
      if (policyInfo) {
        console.log(`   Fix for ${policy}:`);
        console.log(`      - Query: ${policyInfo.cache_table}.${policyInfo.cache_column}`);
        console.log(`      - Synced by: ${policyInfo.sync_job}`);
        console.log(`      - TTL: ${policyInfo.ttl_days} days`);
      }
    });

    console.log('');
  });

  console.log('='.repeat(80));
  console.log('RECOMMENDED APPROACH');
  console.log('='.repeat(80));
  console.log(`
1. Start with CRITICAL severity (hardcoded rates)
2. Then fix HIGH severity (AI research on stale data)
3. For each agent:
   - Remove AI prompts that "research" tariff rates
   - Remove hardcoded rate assumptions
   - Add database query to policy_tariffs_cache
   - Add cache age check (warn if >25 days old)
   - Return confidence based on cache freshness

Example fix pattern:
  OLD: const rate = await agent.execute("Research Section 301 rate for HS code...")
  NEW: const { data } = await supabase.from('policy_tariffs_cache')
                                      .select('section_301, verified_date')
                                      .eq('hs_code', hsCode)
                                      .single();
       const daysOld = Math.floor((Date.now() - new Date(data.verified_date)) / (24*60*60*1000));
       const confidence = daysOld > 25 ? 'low' : (daysOld > 14 ? 'medium' : 'high');
`);
}

// Save detailed report
const reportPath = path.join(projectRoot, 'agent-cache-mapping-audit.json');
fs.writeFileSync(reportPath, JSON.stringify({
  summary: findings.summary,
  agents: findings.agents,
  volatile_policies: VOLATILE_POLICIES,
  remediation_priority: needFix.map((a, i) => ({
    priority: i + 1,
    severity: a.severity,
    file: a.fileName,
    policies: a.handledPolicies,
    issues: {
      hardcoded: a.usesHardcoded,
      ai_research: a.usesAIResearch
    }
  }))
}, null, 2));

console.log(`\n📄 Full report saved to: ${reportPath}\n`);

// Exit with error if any agents need remediation
if (needFix.length > 0) {
  console.log(`❌ AUDIT FAILED: ${needFix.length} agents need remediation`);
  console.log('   Fix agents using hardcoded rates or AI research for volatile tariff data\n');
  process.exit(1);
} else {
  console.log(`✅ AUDIT PASSED: All agents query cache correctly\n`);
  process.exit(0);
}
