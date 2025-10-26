/**
 * SKILLS-ENHANCED BASE AGENT
 * Extends BaseAgent to support Claude Skills while maintaining backward compatibility
 *
 * Features:
 * - Automatic skill selection based on context
 * - Graceful fallback to traditional AI if Skills fail
 * - Parallel execution support (multiple Skills or prompts)
 * - Integrated metrics and error handling
 */

import { skillExecutor } from '../skills/skill-executor.js';
import BaseAgent from './base-agent.js';

export class SkillsBaseAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    this.skillExecutor = skillExecutor;
    this.enableSkills = config.enableSkills !== false; // Default: enabled
    this.skillFallback = config.skillFallback !== false; // Default: fallback enabled
  }

  /**
   * Execute with automatic Skill selection or traditional AI fallback
   *
   * @param {string} prompt - The prompt (or null if using Skills)
   * @param {object} context - Execution context with optional skillId
   * @returns {Promise<object>} - Result object with success, data, and metadata
   */
  async execute(prompt, context = {}) {
    // ========== STEP 1: Check if Skill should be used ==========
    if (this.enableSkills && context.skillId) {
      return this.executeWithSkill(context.skillId, context.skillInput, context);
    }

    // ========== STEP 2: Fall back to traditional AI (2-tier) ==========
    return super.execute(prompt, context);
  }

  /**
   * Execute using Claude Skills
   *
   * @param {string} skillId - Skill identifier
   * @param {object} input - Input data for the Skill
   * @param {object} context - Execution context
   * @returns {Promise<object>} - Skill execution result
   */
  async executeWithSkill(skillId, input, context = {}) {
    console.log(`🎯 [${this.name}] Using Skill: ${skillId}`, {
      inputSize: JSON.stringify(input).length,
      timestamp: new Date().toISOString()
    });

    // Prepare fallback function that uses traditional AI
    const fallbackFn = context.skillFallback
      ? async (fallbackInput) => {
          console.log(`🔄 [${this.name}] Skill failed, falling back to traditional AI`);

          // Build a prompt from the Skill input
          const prompt = this.buildSkillFallbackPrompt(skillId, fallbackInput);

          // Use traditional 2-tier execution
          const result = await super.execute(prompt, {
            temperature: context.temperature,
            agent: context.agent
          });

          if (result.success) {
            return result.data;
          } else {
            throw new Error(`Fallback AI failed: ${result.error}`);
          }
        }
      : null;

    // Execute Skill with fallback
    const skillResult = await this.skillExecutor.execute(
      skillId,
      input,
      {
        agent: context.agent || this.name,
        fallback: fallbackFn
      }
    );

    return skillResult;
  }

  /**
   * Execute multiple Skills or prompts in parallel
   *
   * @param {array} tasks - Array of {type: 'skill'|'prompt', skillId/prompt, context}
   * @returns {Promise<array>} - Array of results
   */
  async executeParallel(tasks) {
    console.log(`🚀 [${this.name}] Executing ${tasks.length} tasks in parallel`);

    const executions = tasks.map(task => {
      if (task.type === 'skill') {
        return this.executeWithSkill(task.skillId, task.input, task.context || {});
      } else if (task.type === 'prompt') {
        return super.execute(task.prompt, task.context || {});
      } else {
        return Promise.reject(new Error(`Unknown task type: ${task.type}`));
      }
    });

    try {
      const results = await Promise.all(executions);
      console.log(`✅ [${this.name}] All parallel tasks completed`);
      return results;
    } catch (error) {
      console.error(`❌ [${this.name}] Some parallel tasks failed:`, error.message);
      throw error;
    }
  }

  /**
   * Build a prompt from Skill input for fallback execution
   * @private
   */
  buildSkillFallbackPrompt(skillId, input) {
    const skillPrompts = {
      'usmca-qualification-analyzer': `Analyze USMCA qualification for the following product:
${JSON.stringify(input, null, 2)}

Return a JSON object with:
- qualified: boolean
- rvc_percentage: number (0-100)
- preference_criterion: string (A/B/C/D or null)
- analysis: object with details
- recommendations: array of strings`,

      'section301-impact-calculator': `Calculate Section 301 tariff impact for:
${JSON.stringify(input, null, 2)}

Return a JSON object with:
- has_section301_exposure: boolean
- exposed_components: array
- total_annual_section301_burden: number
- mexico_sourcing: object with available, cost, payback_months
- strategic_options: array`,

      'tariff-enrichment-engine': `Enrich these components with tariff data:
${JSON.stringify(input, null, 2)}

Return a JSON object with:
- enriched_components: array
- cache_hit_rate: number (0-1)
- enrichment_summary: string`,

      'hs-code-classifier': `Classify this product to an HS code:
${JSON.stringify(input, null, 2)}

Return a JSON object with:
- primary_hs_code: string (10 digits)
- primary_description: string
- confidence_score: number (0-1)
- alternative_codes: array
- requires_human_review: boolean`,

      'policy-impact-analyzer': `Analyze which policies impact this user's products:
${JSON.stringify(input, null, 2)}

Return a JSON object with:
- applicable_policies: array
- impact_ranking: array
- total_policy_impact: number
- strategic_options: array`,

      'certificate-validator': `Validate this certificate data for completeness:
${JSON.stringify(input, null, 2)}

Return a JSON object with:
- is_valid: boolean
- validation_errors: array
- validation_warnings: array
- completeness_score: number (0-100)
- ready_for_generation: boolean`
    };

    return skillPrompts[skillId] ||
      `Process the following request and return JSON:\n${JSON.stringify(input, null, 2)}`;
  }

  /**
   * Get comprehensive metrics including Skills and traditional AI
   */
  getMetrics() {
    return {
      agent: this.name,
      skills: this.skillExecutor.getMetrics(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if a Skill is available
   */
  isSkillAvailable(skillId) {
    return this.skillExecutor.isAvailable(skillId);
  }

  /**
   * List all available Skills
   */
  listAvailableSkills() {
    return this.skillExecutor.listSkills();
  }

  /**
   * Enable/disable Skills execution
   */
  setSkillsEnabled(enabled) {
    this.enableSkills = enabled;
    console.log(`[${this.name}] Skills ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable/disable fallback to traditional AI when Skills fail
   */
  setSkillFallbackEnabled(enabled) {
    this.skillFallback = enabled;
    console.log(`[${this.name}] Skill fallback ${enabled ? 'enabled' : 'disabled'}`);
  }
}

/**
 * Factory function for creating Skills agents
 */
export function createSkillsAgent(config = {}) {
  return new SkillsBaseAgent(config);
}

// Create a default singleton instance
export const defaultSkillsAgent = new SkillsBaseAgent({
  name: 'SkillsAgent',
  enableSkills: true,
  skillFallback: true
});

export default SkillsBaseAgent;
