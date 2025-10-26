/**
 * SKILL EXECUTOR
 * Handles all Claude Skills execution with proper error handling and fallback
 *
 * Skills are persistent code execution containers that handle deterministic calculations:
 * - Regional content calculations
 * - Tariff enrichment and batch processing
 * - Section 301 impact analysis
 * - HS code classification
 * - Policy impact scoring
 * - Certificate validation
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Map of available Skills with metadata
const SKILLS_REGISTRY = {
  'usmca-qualification-analyzer': {
    description: 'Analyzes USMCA qualification with regional content calculation',
    version: 'latest',
    timeout: 30000,
    retries: 2
  },
  'section301-impact-calculator': {
    description: 'Calculates Section 301 tariff burden and nearshoring ROI',
    version: 'latest',
    timeout: 30000,
    retries: 2
  },
  'tariff-enrichment-engine': {
    description: 'Batch enriches components with complete tariff data',
    version: 'latest',
    timeout: 45000,
    retries: 1
  },
  'hs-code-classifier': {
    description: 'Classifies products to HS codes with confidence scoring',
    version: 'latest',
    timeout: 30000,
    retries: 2
  },
  'policy-impact-analyzer': {
    description: 'Identifies policy impacts specific to user products',
    version: 'latest',
    timeout: 30000,
    retries: 2
  },
  'certificate-validator': {
    description: 'Validates certificate data completeness before generation',
    version: 'latest',
    timeout: 15000,
    retries: 1
  }
};

export class SkillExecutor {
  constructor(config = {}) {
    this.retryAttempts = config.retryAttempts || 3;
    this.timeout = config.timeout || 60000;
    this.metrics = {
      successful: 0,
      failed: 0,
      fallbacks: 0,
      totalTime: 0
    };
  }

  /**
   * Execute a Skill with automatic retry and fallback
   * @param {string} skillId - Skill identifier (must exist in SKILLS_REGISTRY)
   * @param {object} input - Input data for the Skill
   * @param {object} context - Execution context (agent name, fallback function, etc.)
   * @returns {Promise<object>} - Skill execution result
   */
  async execute(skillId, input, context = {}) {
    const startTime = Date.now();
    const skillMeta = SKILLS_REGISTRY[skillId];

    if (!skillMeta) {
      throw new Error(`Unknown Skill: ${skillId}. Available: ${Object.keys(SKILLS_REGISTRY).join(', ')}`);
    }

    console.log(`🎯 [SkillExecutor] Executing Skill: ${skillId}`, {
      agent: context.agent || 'unknown',
      input_size: JSON.stringify(input).length,
      timestamp: new Date().toISOString()
    });

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await this._executeWithTimeout(skillId, input, skillMeta.timeout);

        const duration = Date.now() - startTime;
        this.metrics.successful++;
        this.metrics.totalTime += duration;

        console.log(`✅ [SkillExecutor] Skill succeeded: ${skillId}`, {
          attempt,
          duration: `${duration}ms`,
          agent: context.agent
        });

        return {
          success: true,
          data: result,
          metadata: {
            skillId,
            agent: context.agent,
            attempt,
            duration,
            provider: 'claude-skill',
            timestamp: new Date().toISOString()
          }
        };

      } catch (error) {
        console.error(`❌ [SkillExecutor] Skill failed on attempt ${attempt}/${this.retryAttempts}:`, {
          skillId,
          error: error.message,
          agent: context.agent
        });

        // If last attempt failed, try fallback
        if (attempt === this.retryAttempts) {
          if (context.fallback) {
            console.log(`🔄 [SkillExecutor] Falling back to traditional AI for ${skillId}`);
            this.metrics.fallbacks++;

            try {
              const fallbackResult = await context.fallback(input);
              const duration = Date.now() - startTime;

              return {
                success: true,
                data: fallbackResult,
                metadata: {
                  skillId,
                  agent: context.agent,
                  provider: 'fallback',
                  duration,
                  timestamp: new Date().toISOString()
                }
              };
            } catch (fallbackError) {
              console.error(`🚨 [SkillExecutor] Both Skill and fallback failed:`, fallbackError.message);
              this.metrics.failed++;

              throw new Error(`Skill execution failed after ${this.retryAttempts} attempts: ${error.message}`);
            }
          } else {
            console.error(`🚨 [SkillExecutor] No fallback available for ${skillId}`);
            this.metrics.failed++;
            throw error;
          }
        }

        // Wait before retry
        if (attempt < this.retryAttempts) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`⏳ [SkillExecutor] Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
  }

  /**
   * Execute a Skill with timeout protection
   * @private
   */
  async _executeWithTimeout(skillId, input, timeout) {
    return Promise.race([
      this._executeSkill(skillId, input),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Skill execution timeout after ${timeout}ms`)),
          timeout
        )
      )
    ]);
  }

  /**
   * Make the actual Skill API call
   * @private
   */
  async _executeSkill(skillId, input) {
    const response = await client.beta.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      betas: ['code-execution-2025-08-25', 'skills-2025-10-02'],
      thinking: {
        type: 'enabled',
        budget_tokens: 2000
      },
      container: {
        type: 'skill',
        skill_id: skillId,
        version: 'latest'
      },
      messages: [{
        role: 'user',
        content: JSON.stringify(input, null, 2)
      }]
    });

    // Extract the text response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent) {
      throw new Error('No text response from Skill');
    }

    // Parse JSON response
    try {
      return JSON.parse(textContent.text);
    } catch (parseError) {
      throw new Error(`Failed to parse Skill response: ${parseError.message}`);
    }
  }

  /**
   * Get execution metrics
   */
  getMetrics() {
    const successRate = this.metrics.successful / (this.metrics.successful + this.metrics.failed) * 100;
    const avgTime = this.metrics.totalTime / (this.metrics.successful + 1);

    return {
      ...this.metrics,
      successRate: `${successRate.toFixed(2)}%`,
      averageTime: `${avgTime.toFixed(0)}ms`,
      totalExecutions: this.metrics.successful + this.metrics.failed
    };
  }

  /**
   * Check if a Skill is available
   */
  isAvailable(skillId) {
    return skillId in SKILLS_REGISTRY;
  }

  /**
   * List all available Skills
   */
  listSkills() {
    return Object.entries(SKILLS_REGISTRY).map(([id, meta]) => ({
      id,
      ...meta
    }));
  }
}

// Global instance
export const skillExecutor = new SkillExecutor();

export default skillExecutor;
