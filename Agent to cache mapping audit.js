#!/usr/bin/env node

/**
 * AGENT-TO-CACHE MAPPING AUDIT
 * Maps all agents that reference volatile tariff data to their cache source
 * Identifies what needs fixing and in what order
 */

const fs = require('fs');
const path = require('path');

const AGENT_PATTERNS = [
  {
    name: 'Section 301 Usage',
    pattern: /section.?301|Section.?301/gi,
    cache_table: 'policy_tariffs_cache',
    cache_field: 'section_301',
    policy: 'Section 301',
    volatility: 'CRITICAL',
    ttl: '30 days',
  },
  {
    name: 'Section 232 Usage',
    pattern: /section.?232|Section.?232|steel|aluminum/gi,
    cache_table: 'policy_tariffs_cache',
    cache_field: 'section_232_steel|section_232_aluminum',
    policy: 'Section 232',
    volatility: 'CRITICAL',
    ttl: '30 days',
  },
  {
    name: 'Reciprocal Tariff Usage',
    pattern: /reciprocal|reciprocal.?tariff/gi,
    cache_table: 'policy_tariffs_cache',
    cache_field: 'reciprocal_rate',
    policy: 'Reciprocal Tariffs',
    volatility: 'CRITICAL',
    ttl: '7 days',
  },
  {
    name: 'MFN Rate Usage',
    pattern: /mfn|most.?favored|base.?rate/gi,
    cache_table: 'policy_tariffs_cache',
    cache_field: 'mfn_rate',
    policy: 'MFN Base Rates',
    volatility: 'HIGH',
    ttl: '365 days',
  },
  {
    name: 'USMCA RVC Threshold',
    pattern: /rvc|regional.?value|threshold|60%|55%|50%/gi,
    cache_table: 'usmca_threshold_cache',
    cache_field: 'rvc_threshold',
    policy: 'USMCA RVC Requirements',
    volatility: 'MEDIUM',
    ttl: '180 days',
  },
];

const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const SKIP_DIRS = ['node_modules', '.next', 'dist', 'build', '.git'];

class AgentToCacheMappingAuditor {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.agentFiles = [];
    this.findings = [];
    this.mappings = {};
  }

  shouldSkip(filePath) {
    return SKIP_DIRS.some((dir) => filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`));
  }

  isAgentFile(filePath) {
    return filePath.includes('/agents/') || filePath.includes('\\agents\\');
  }

  scanDirectory(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      entries.forEach((entry) => {
        const fullPath = path.join(dir, entry.name);

        if (this.shouldSkip(fullPath)) return;

        if (entry.isDirectory()) {
          this.scanDirectory(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(fullPath).toLowerCase();
          if (FILE_EXTENSIONS.includes(ext) && this.isAgentFile(fullPath)) {
            this.agentFiles.push(fullPath);
          }
        }
      });
    } catch (err) {
      console.error(`Error scanning ${dir}:`, err.message);
    }
  }

  analyzeAgent(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relPath = path.relative(this.projectRoot, filePath);
      const agentName = path.basename(filePath, path.extname(filePath));

      const agentFindings = {
        agent: agentName,
        file: relPath,
        tariffDataUsage: [],
        cacheQueries: [],
        aiHallucinations: [],
      };

      // Check for each pattern
      AGENT_PATTERNS.forEach((patternConfig) => {
        const matches = content.match(patternConfig.pattern) || [];

        if (matches.length > 0) {
          agentFindings.tariffDataUsage.push({
            policy: patternConfig.policy,
            mentions: matches.length,
            should_query: patternConfig.cache_table,
            cache_field: patternConfig.cache_field,
            volatility: patternConfig.volatility,
            ttl: patternConfig.ttl,
          });
        }
      });

      // Check for AI hallucination indicators
      const hallucMarkers = [
        { marker: /buildPrompt|buildAgent.*Prompt/g, type: 'AI_PROMPT_BUILDING' },
        { marker: /execute\(.*prompt/gi, type: 'AI_EXECUTION_FROM_PROMPT' },
        { marker: /research|lookup.*ai|ai.*lookup/gi, type: 'AI_RESEARCH_CLAIM' },
        { marker: /training.?data|knowledge.?cutoff|as.?of.*2024|as.?of.*2025/gi, type: 'STALE_DATA_REFERENCE' },
      ];

      hallucMarkers.forEach((marker) => {
        const matches = content.match(marker.marker) || [];
        if (matches.length > 0) {
          agentFindings.aiHallucinations.push({
            type: marker.type,
            count: matches.length,
          });
        }
      });

      // Check for actual cache queries
      const cacheQueries = content.match(/policy_tariffs_cache|tariff.*cache|usmca_threshold_cache/g) || [];
      if (cacheQueries.length > 0) {
        agentFindings.cacheQueries = cacheQueries.length;
      }

      if (agentFindings.tariffDataUsage.length > 0 || agentFindings.aiHallucinations.length > 0) {
        this.findings.push(agentFindings);
      }
    } catch (err) {
      console.error(`Error analyzing ${filePath}:`, err.message);
    }
  }

  generateMappings() {
    // Group findings by policy type
    const byPolicy = {};

    this.findings.forEach((finding) => {
      finding.tariffDataUsage.forEach((usage) => {
        if (!byPolicy[usage.policy]) {
          byPolicy[usage.policy] = {
            policy: usage.policy,
            volatility: usage.volatility,
            ttl: usage.ttl,
            cache_table: usage.should_query,
            cache_field: usage.cache_field,
            agents_affected: [],
            total_mentions: 0,
          };
        }

        byPolicy[usage.policy].agents_affected.push(finding.agent);
        byPolicy[usage.policy].total_mentions += usage.mentions;
      });
    });

    this.mappings = byPolicy;
    return byPolicy;
  }

  audit() {
    console.log(`🔍 Starting agent-to-cache mapping audit in: ${this.projectRoot}\n`);
    this.scanDirectory(this.projectRoot);

    console.log(`📊 Found ${this.agentFiles.length} agent files\n`);

    this.agentFiles.forEach((file) => {
      this.analyzeAgent(file);
    });

    this.generateMappings();

    return {
      summary: {
        total_agents_scanned: this.agentFiles.length,
        agents_using_tariff_data: this.findings.length,
        total_findings: this.findings.length,
        policies_identified: Object.keys(this.mappings).length,
      },
      findings: this.findings,
      policy_mappings: this.mappings,
    };
  }
}

// Main execution
const projectRoot = process.argv[2] || process.cwd();

if (!fs.existsSync(projectRoot)) {
  console.error(`❌ Project root not found: ${projectRoot}`);
  process.exit(1);
}

const auditor = new AgentToCacheMappingAuditor(projectRoot);
const results = auditor.audit();

// Console output
console.log('\n' + '='.repeat(80));
console.log('📋 AGENT-TO-CACHE MAPPING AUDIT');
console.log('='.repeat(80));

console.log(`\n✅ Scan Summary:`);
console.log(`   Total Agents Scanned: ${results.summary.total_agents_scanned}`);
console.log(`   Agents Using Tariff Data: ${results.summary.agents_using_tariff_data}`);
console.log(`   Policies Identified: ${results.summary.policies_identified}`);

console.log(`\n🗂️  POLICY MAPPING (What each agent should query):\n`);

Object.entries(results.policy_mappings)
  .sort((a, b) => {
    const volatilityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
    return volatilityOrder[a[1].volatility] - volatilityOrder[b[1].volatility];
  })
  .forEach(([policyName, mapping]) => {
    const icon = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
    }[mapping.volatility];

    console.log(`${icon} ${mapping.policy}`);
    console.log(`   Cache Table: ${mapping.cache_table}`);
    console.log(`   Cache Field: ${mapping.cache_field}`);
    console.log(`   Volatility: ${mapping.volatility} (TTL: ${mapping.ttl})`);
    console.log(`   Agents Affected: ${mapping.agents_affected.join(', ')}`);
    console.log(`   Total Mentions: ${mapping.total_mentions}`);
    console.log();
  });

console.log('\n🔧 AGENTS NEEDING UPDATES:\n');

results.findings
  .sort((a, b) => b.tariffDataUsage.length - a.tariffDataUsage.length)
  .forEach((finding, idx) => {
    console.log(
      `${idx + 1}. ${finding.agent} (${finding.file})`
    );
    console.log(`   Tariff Data Uses: ${finding.tariffDataUsage.map((u) => u.policy).join(', ')}`);

    if (finding.aiHallucinations.length > 0) {
      console.log(`   ⚠️  AI Hallucination Markers: ${finding.aiHallucinations.map((h) => h.type).join(', ')}`);
    }

    if (finding.cacheQueries > 0) {
      console.log(`   ✅ Already using cache (${finding.cacheQueries} queries found)`);
    }

    console.log();
  });

// Save JSON report
const reportPath = path.join(projectRoot, 'agent-to-cache-mapping-report.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`💾 Full report saved to: ${reportPath}`);

console.log(`\n📋 REMEDIATION PRIORITY:\n`);

const criticalAgents = results.findings.filter((f) =>
  f.tariffDataUsage.some((u) => u.volatility === 'CRITICAL')
);

console.log(`PHASE 1 (CRITICAL) - ${criticalAgents.length} agents:`);
criticalAgents.forEach((agent) => {
  console.log(
    `  • ${agent.agent}: Replace with ${agent.tariffDataUsage
      .filter((u) => u.volatility === 'CRITICAL')
      .map((u) => u.should_query)
      .join(', ')} queries`
  );
});

process.exit(0);