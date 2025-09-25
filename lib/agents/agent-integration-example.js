// Enhanced Agent Integration Example
// Demonstrates how the enhanced classification agent integrates with existing workflow

import EnhancedClassificationAgent from './enhanced-classification-agent'

// Example: Integration with existing USMCA workflow
export async function enhanceUSMCAWorkflow(workflowData) {
  console.log('[INTEGRATION] Enhancing USMCA workflow with AI agent...')

  const agent = new EnhancedClassificationAgent()

  try {
    // Process product classification with web verification
    const classificationResult = await agent.processRequest({
      product_description: workflowData.product_description,
      origin_country: workflowData.manufacturing_location || 'MX',
      destination_country: 'US',
      trade_volume: parseFloat(workflowData.trade_volume) || 100000,
      context: {
        mode: 'workflow_enhancement',
        user_id: workflowData.user_id,
        workflow_step: 'classification'
      }
    })

    // Enhance workflow data with agent insights
    const enhancedData = {
      ...workflowData,

      // Agent-enhanced classification
      agent_classification: {
        hs_code: classificationResult.classification?.hs_code,
        description: classificationResult.classification?.description,
        confidence: classificationResult.classification?.confidence,
        verification_status: classificationResult.verification?.database_verified ? 'verified' : 'needs_review'
      },

      // Real-time USMCA analysis
      enhanced_usmca_analysis: {
        qualification_status: classificationResult.usmca_analysis?.qualification_status,
        mfn_rate: classificationResult.usmca_analysis?.mfn_rate,
        usmca_rate: classificationResult.usmca_analysis?.usmca_rate,
        projected_savings: classificationResult.usmca_analysis?.annual_savings,
        confidence_score: classificationResult.data_quality?.confidence
      },

      // Data quality insights
      data_quality_report: {
        database_freshness: classificationResult.verification?.last_checked,
        web_sources_consulted: classificationResult.verification?.sources_consulted,
        verification_confidence: classificationResult.data_quality?.confidence,
        requires_expert_review: classificationResult.data_quality?.verification_status === 'Needs review'
      },

      // Smart recommendations
      agent_recommendations: this.generateWorkflowRecommendations(classificationResult, workflowData)
    }

    console.log('[INTEGRATION] Workflow enhanced with agent intelligence')
    return enhancedData

  } catch (error) {
    console.error('[INTEGRATION ERROR] Agent enhancement failed:', error)

    // Graceful fallback to original workflow
    return {
      ...workflowData,
      agent_error: {
        message: 'AI enhancement unavailable',
        fallback_mode: true,
        original_workflow_intact: true
      }
    }
  }
}

// Example: Real-time form assistance
export async function enhanceFormInput(fieldName, fieldValue, formContext) {
  if (fieldName !== 'product_description') return null

  console.log('[FORM ASSIST] Providing real-time classification suggestions...')

  const agent = new EnhancedClassificationAgent()

  try {
    const suggestions = await agent.processRequest({
      product_description: fieldValue,
      context: {
        mode: 'form_assistance',
        field_name: fieldName,
        partial_input: fieldValue.length < 10 // Is this partial input?
      }
    })

    return {
      type: 'classification_suggestions',
      suggestions: [
        {
          hs_code: suggestions.classification?.hs_code,
          description: suggestions.classification?.description,
          confidence: suggestions.classification?.confidence,
          why_suggested: 'Best match from verified database'
        }
      ],
      data_quality: {
        verification_status: suggestions.data_quality?.verification_status,
        last_updated: suggestions.verification?.last_checked
      },
      usmca_preview: {
        potential_savings: suggestions.usmca_analysis?.annual_savings,
        qualification_likely: suggestions.usmca_analysis?.qualification_status === 'Eligible'
      }
    }

  } catch (error) {
    console.error('[FORM ASSIST ERROR]', error)
    return null
  }
}

// Example: Admin dashboard integration
export async function generateAdminInsights(timeframe = '24h') {
  console.log('[ADMIN INSIGHTS] Generating system-wide intelligence...')

  const agent = new EnhancedClassificationAgent()

  // Simulate admin-level request for system insights
  const systemAnalysis = await agent.processRequest({
    product_description: 'system_health_check',
    context: {
      mode: 'admin',
      operation: 'system_insights',
      timeframe: timeframe
    }
  })

  return {
    classification_performance: {
      total_classifications: systemAnalysis.system_metrics?.classifications_today,
      database_accuracy: systemAnalysis.system_metrics?.database_accuracy,
      web_verifications: systemAnalysis.system_metrics?.web_verifications_performed,
      discrepancies_found: systemAnalysis.system_metrics?.discrepancies_found
    },
    policy_intelligence: {
      changes_detected: systemAnalysis.policy_intelligence?.changes_detected,
      affected_certificates: systemAnalysis.policy_intelligence?.affected_certificates,
      alerts_generated: systemAnalysis.policy_intelligence?.system_alerts_generated
    },
    database_health: systemAnalysis.database_health,
    recommended_actions: systemAnalysis.recommended_actions || []
  }
}

// Generate smart workflow recommendations
function generateWorkflowRecommendations(classificationResult, workflowData) {
  const recommendations = []

  // Classification confidence recommendations
  const confidence = parseFloat(classificationResult.classification?.confidence?.replace('%', '')) || 0

  if (confidence < 75) {
    recommendations.push({
      type: 'expert_review',
      priority: 'high',
      message: 'Classification confidence below 75% - expert review recommended',
      action: 'escalate_to_expert'
    })
  }

  // USMCA qualification recommendations
  if (classificationResult.usmca_analysis?.qualification_status === 'Eligible') {
    const savings = parseFloat(classificationResult.usmca_analysis.annual_savings?.replace(/[$,]/g, '')) || 0

    if (savings > 5000) {
      recommendations.push({
        type: 'high_savings_opportunity',
        priority: 'high',
        message: `High USMCA savings potential: ${classificationResult.usmca_analysis.annual_savings}`,
        action: 'prioritize_usmca_certification'
      })
    }
  }

  // Data quality recommendations
  if (classificationResult.data_quality?.verification_status === 'Needs review') {
    recommendations.push({
      type: 'data_verification',
      priority: 'medium',
      message: 'Tariff rates may have recent changes - verification recommended',
      action: 'verify_current_rates'
    })
  }

  // Trade volume optimization
  const tradeVolume = parseFloat(workflowData.trade_volume) || 0
  if (tradeVolume > 500000) {
    recommendations.push({
      type: 'high_volume_optimization',
      priority: 'medium',
      message: 'High trade volume detected - consider supply chain optimization consultation',
      action: 'offer_supply_chain_services'
    })
  }

  return recommendations
}

// Example usage in existing components:

// In CompanyInformationStep.js:
/*
import { enhanceFormInput } from '../lib/agents/agent-integration-example'

const handleProductDescriptionChange = async (value) => {
  setProductDescription(value)

  // Real-time agent assistance
  if (value.length > 5) {
    const suggestions = await enhanceFormInput('product_description', value, formContext)
    if (suggestions) {
      setAgentSuggestions(suggestions)
    }
  }
}
*/

// In USMCAWorkflowOrchestrator.js:
/*
import { enhanceUSMCAWorkflow } from '../lib/agents/agent-integration-example'

const processWorkflowWithAgent = async (workflowData) => {
  const enhancedData = await enhanceUSMCAWorkflow(workflowData)

  // Use enhanced data for better user experience
  setWorkflowData(enhancedData)

  // Show agent recommendations
  if (enhancedData.agent_recommendations?.length > 0) {
    setRecommendations(enhancedData.agent_recommendations)
  }
}
*/

// In admin dashboard:
/*
import { generateAdminInsights } from '../lib/agents/agent-integration-example'

const loadAdminDashboard = async () => {
  const insights = await generateAdminInsights('24h')
  setSystemInsights(insights)
}
*/