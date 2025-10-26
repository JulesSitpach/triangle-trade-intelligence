/**
 * SKILL INTEGRATION GUIDE
 * Practical examples of how to integrate Skills into your API endpoints
 *
 * This file shows the recommended patterns for using Skills in production:
 * 1. USMCA Qualification API - Uses Skills for deterministic calculations
 * 2. Executive Trade Alert API - Uses Skills for impact analysis
 * 3. Certificate Validator - Uses Skills to validate before PDF generation
 */

/**
 * ========== INTEGRATION PATTERN 1: USMCA COMPLETE ANALYSIS ==========
 * File: pages/api/ai-usmca-complete-analysis.js
 *
 * This is the main endpoint that should use Skills for:
 * 1. Tariff enrichment (deterministic)
 * 2. USMCA qualification calculation (deterministic)
 * 3. Section 301 impact analysis (deterministic)
 * 4. Strategic recommendations (AI - keep as traditional)
 */

export const aiUsmcaCompleteAnalysisIntegration = `
import { SkillsBaseAgent } from '../../lib/agents/skills-base-agent.js';

// Initialize Skills-enabled agent
const skillsAgent = new SkillsBaseAgent({
  name: 'USMCAAnalysisAgent',
  enableSkills: true,
  skillFallback: true
});

export default protectedApiHandler({
  POST: async (req, res) => {
    const formData = req.body;
    const startTime = Date.now();

    try {
      // ========== STEP 1: Tariff Enrichment (Skill) ==========
      // This is a deterministic calculation - perfect for Skills
      const enrichmentResult = await skillsAgent.execute(null, {
        skillId: 'tariff-enrichment-engine',
        skillInput: {
          components: formData.component_origins,
          destination_country: formData.destination_country,
          cache_lookup_required: true,
          include_confidence: true
        },
        agent: 'tariff-enrichment',
        skillFallback: true  // Fall back to traditional AI if Skill fails
      });

      if (!enrichmentResult.success) {
        return res.status(500).json({
          error: 'Tariff enrichment failed',
          details: enrichmentResult.error
        });
      }

      const enrichedComponents = enrichmentResult.data.enriched_components;
      const cacheHitRate = enrichmentResult.data.cache_hit_rate;

      console.log('✅ Tariff enrichment successful', {
        componentCount: enrichedComponents.length,
        cacheHitRate: (cacheHitRate * 100).toFixed(1) + '%'
      });

      // ========== STEP 2: USMCA Qualification (Skill) ==========
      // Deterministic calculation - use Skill for consistency
      const qualificationResult = await skillsAgent.execute(null, {
        skillId: 'usmca-qualification-analyzer',
        skillInput: {
          company_name: formData.company_name,
          company_country: formData.company_country,
          destination_country: formData.destination_country,
          industry_sector: formData.business_type,
          industry_rvc_threshold: industryThreshold.rvc,
          components: enrichedComponents,
          trade_volume: formData.trade_volume
        },
        agent: 'usmca-qualification',
        skillFallback: true
      });

      if (!qualificationResult.success) {
        return res.status(500).json({
          error: 'USMCA qualification analysis failed',
          details: qualificationResult.error
        });
      }

      const qualificationData = qualificationResult.data;

      // ========== STEP 3: Section 301 Analysis (Skill) ==========
      // Impact calculation - use Skill for accuracy
      const section301Result = await skillsAgent.execute(null, {
        skillId: 'section301-impact-calculator',
        skillInput: {
          destination_country: formData.destination_country,
          components: enrichedComponents,
          trade_volume: formData.trade_volume,
          company_industry: formData.business_type
        },
        agent: 'section301-analysis',
        skillFallback: true
      });

      const section301Data = section301Result.success
        ? section301Result.data
        : { has_section301_exposure: false };

      // ========== STEP 4: Strategic Recommendations (Traditional AI) ==========
      // Non-deterministic - keep using traditional AI
      const strategicPrompt = buildStrategicPrompt(
        qualificationData,
        section301Data,
        enrichedComponents
      );

      const strategicResult = await skillsAgent.execute(strategicPrompt, {
        temperature: 0.7,  // Allow creativity
        agent: 'strategic-recommendations'
        // Note: NO skillId - uses traditional 2-tier fallback
      });

      // ========== STEP 5: Return Complete Response ==========
      return res.status(200).json({
        success: true,
        result: {
          company: { name: formData.company_name, country: formData.company_country },
          usmca: {
            qualified: qualificationData.qualified,
            rvc_percentage: qualificationData.rvc_percentage,
            preference_criterion: qualificationData.preference_criterion
          },
          component_origins: enrichedComponents,
          financial_impact: {
            annual_tariff_savings: calculateSavings(enrichedComponents),
            section_301_exposure: section301Data.total_annual_section301_burden || 0,
            mexico_sourcing: section301Data.mexico_sourcing
          },
          metadata: {
            execution_time: Date.now() - startTime + 'ms',
            tariff_provider: enrichmentResult.metadata.provider,
            qualification_provider: qualificationResult.metadata.provider,
            section301_provider: section301Result.metadata.provider
          }
        }
      });

    } catch (error) {
      console.error('❌ USMCA analysis failed:', error);
      return res.status(500).json({
        error: 'Analysis failed',
        message: error.message
      });
    }
  }
});
`;

/**
 * ========== INTEGRATION PATTERN 2: EXECUTIVE TRADE ALERT ==========
 * File: pages/api/executive-trade-alert.js
 *
 * Uses Skills to:
 * 1. Analyze policy impacts on user's specific products (Skill)
 * 2. Calculate financial implications (Skill)
 * 3. Generate strategic recommendations (traditional AI)
 */

export const executiveTradeAlertIntegration = `
import { SkillsBaseAgent } from '../../lib/agents/skills-base-agent.js';

const skillsAgent = new SkillsBaseAgent({
  name: 'ExecutiveTradeAlertAgent',
  enableSkills: true,
  skillFallback: true
});

export default async function handler(req, res) {
  const { user_profile, workflow_intelligence } = req.body;

  try {
    // ========== Use Skill to analyze policy impacts ==========
    const policyAnalysisResult = await skillsAgent.execute(null, {
      skillId: 'policy-impact-analyzer',
      skillInput: {
        user_components: workflow_intelligence.components,
        user_industry: user_profile.industry_sector,
        user_destination: user_profile.destination_country,
        annual_trade_volume: user_profile.annual_trade_volume
      },
      agent: 'policy-impact-analysis'
    });

    if (!policyAnalysisResult.success) {
      throw new Error('Policy impact analysis failed');
    }

    const policyImpact = policyAnalysisResult.data;

    // ========== Use traditional AI for executive framing ==========
    const executiveSummaryPrompt = buildExecutiveSummaryPrompt(
      policyImpact,
      workflow_intelligence,
      user_profile
    );

    const executiveResult = await skillsAgent.execute(executiveSummaryPrompt, {
      temperature: 0.6,
      agent: 'executive-summary'
    });

    return res.status(200).json({
      success: true,
      advisory: {
        headline: executiveResult.data.headline,
        situation: executiveResult.data.situation,
        financial_impact: policyImpact.impact_ranking,
        strategic_options: policyImpact.strategic_options,
        immediate_actions: executiveResult.data.immediate_actions,
        execution_time: Date.now() - startTime + 'ms'
      }
    });

  } catch (error) {
    console.error('❌ Executive alert generation failed:', error);
    return res.status(500).json({ error: error.message });
  }
}
`;

/**
 * ========== INTEGRATION PATTERN 3: CERTIFICATE GENERATION ==========
 * File: pages/api/certificates.js
 *
 * Uses Skill to validate before PDF generation
 */

export const certificateValidationIntegration = `
import { SkillsBaseAgent } from '../../lib/agents/skills-base-agent.js';

const skillsAgent = new SkillsBaseAgent({
  name: 'CertificateGenerationAgent',
  enableSkills: true,
  skillFallback: true
});

export default async function handler(req, res) {
  const { certificate_data, components, tariff_analysis } = req.body;

  try {
    // ========== Validate before PDF generation ==========
    const validationResult = await skillsAgent.execute(null, {
      skillId: 'certificate-validator',
      skillInput: {
        company: certificate_data.company,
        components: components,
        tariff_analysis: tariff_analysis,
        destination_country: certificate_data.destination_country
      },
      agent: 'certificate-validation'
    });

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Certificate validation failed',
        details: validationResult.error
      });
    }

    const validation = validationResult.data;

    if (!validation.is_valid) {
      return res.status(400).json({
        error: 'Certificate data invalid',
        errors: validation.validation_errors,
        warnings: validation.validation_warnings
      });
    }

    // ========== Generate PDF ==========
    const pdf = await generateCertificatePDF(certificate_data, components);

    return res.status(200).json({
      success: true,
      certificate_url: pdf.url,
      validation_score: validation.completeness_score,
      execution_time: Date.now() - startTime + 'ms'
    });

  } catch (error) {
    console.error('❌ Certificate generation failed:', error);
    return res.status(500).json({ error: error.message });
  }
}
`;

/**
 * ========== INTEGRATION PATTERN 4: PARALLEL EXECUTION ==========
 * When you need multiple Skills/prompts at the same time
 */

export const parallelExecutionExample = `
import { SkillsBaseAgent } from '../../lib/agents/skills-base-agent.js';

const skillsAgent = new SkillsBaseAgent({
  name: 'ParallelExecutionAgent',
  enableSkills: true
});

// Execute multiple operations in parallel
const results = await skillsAgent.executeParallel([
  {
    type: 'skill',
    skillId: 'tariff-enrichment-engine',
    input: { components, destination_country }
  },
  {
    type: 'skill',
    skillId: 'hs-code-classifier',
    input: { product_description, industry_sector }
  },
  {
    type: 'prompt',
    prompt: 'Generate strategic recommendations for...',
    context: { temperature: 0.7 }
  }
]);

// All three execute simultaneously
const [enrichmentResult, classificationResult, strategicResult] = results;
`;

/**
 * ========== TROUBLESHOOTING GUIDE ==========
 */

export const troubleshootingGuide = `
## Common Issues and Solutions

### 1. Skill Execution Timeout
**Problem**: Skill exceeds 45-second timeout
**Solution**:
- Check input data size (very large component lists)
- Use skill fallback to traditional AI
- Break into smaller batches if processing many components

### 2. Parse Error on Skill Response
**Problem**: Skill returns invalid JSON
**Solution**:
- Check Skill input format matches schema
- Enable fallback to traditional AI
- Review Skill output schema in skill-definitions.js

### 3. Fallback Cascading
**Problem**: Skill fails, fallback fails
**Solution**:
- Check ANTHROPIC_API_KEY is valid
- Verify network connectivity
- Review error logs in console

### 4. Skills Not Registered
**Problem**: "Unknown Skill: skill-id"
**Solution**:
- Verify skill ID matches SKILLS_REGISTRY in skill-executor.js
- Check spelling (case-sensitive)
- Available IDs: usmca-qualification-analyzer, section301-impact-calculator, etc.

## Monitoring

Check Skill metrics:
\`\`\`javascript
console.log(skillsAgent.getMetrics());
// Output:
// {
//   agent: 'SkillsAgent',
//   skills: {
//     successful: 42,
//     failed: 2,
//     fallbacks: 1,
//     successRate: '95.45%',
//     averageTime: '1200ms'
//   }
// }
\`\`\`

## Performance Expectations

- Tariff Enrichment: 2-5 seconds (Skills much faster than AI per-component)
- USMCA Qualification: 3-8 seconds
- Section 301 Analysis: 2-4 seconds
- Traditional AI prompts: 2-5 seconds
- Total request: 8-15 seconds (with parallel execution)
`;

export default {
  aiUsmcaCompleteAnalysisIntegration,
  executiveTradeAlertIntegration,
  certificateValidationIntegration,
  parallelExecutionExample,
  troubleshootingGuide
};
