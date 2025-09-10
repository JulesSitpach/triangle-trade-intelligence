/**
 * USMCA RECALCULATION API
 * Implements dynamic recalculation when component origins or percentages change
 * 
 * Addresses the critical UX issue: changing China → Mexico should immediately 
 * update qualification status and tariff rates
 */

import { OptimizedUSMCAEngine } from '../../lib/core/optimized-usmca-engine.js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const {
      updatedComponents,
      businessContext,
      recalculationTrigger,
      targetHSCode
    } = req.body;

    // Validate input
    if (!updatedComponents || !Array.isArray(updatedComponents)) {
      return res.status(400).json({
        error: 'Updated components array required'
      });
    }

    if (!targetHSCode) {
      return res.status(400).json({
        error: 'Target HS code required for qualification calculation'
      });
    }

    logInfo('Starting USMCA recalculation', {
      trigger: recalculationTrigger,
      hs_code: targetHSCode,
      components_count: updatedComponents.length,
      business_type: businessContext?.type
    });

    // Initialize USMCA engine
    const usmcaEngine = new OptimizedUSMCAEngine();
    await usmcaEngine.initialize();

    // Filter complete components
    const completeComponents = updatedComponents.filter(comp => 
      comp.origin_country && 
      comp.value_percentage > 0 &&
      comp.description?.length > 0
    );

    if (completeComponents.length === 0) {
      return res.json({
        success: true,
        qualification: {
          qualified: false,
          reason: 'No complete component data available',
          north_american_content: 0,
          threshold_required: 62.5
        },
        recalculation_trigger: recalculationTrigger,
        processing_time_ms: Date.now() - startTime
      });
    }

    // Calculate total component percentage
    const totalPercentage = completeComponents.reduce(
      (sum, comp) => sum + parseFloat(comp.value_percentage || 0), 0
    );

    // Recalculate USMCA qualification with updated component data
    console.log(`🔄 Recalculating USMCA qualification for ${targetHSCode}...`);
    console.log(`📊 Components: ${completeComponents.length}, Total: ${totalPercentage.toFixed(1)}%`);
    
    const qualificationResult = await usmcaEngine.checkUSMCAQualification(
      targetHSCode,
      completeComponents,
      businessContext?.manufacturing_location || 'MX',
      businessContext?.type || 'Manufacturing'
    );

    // Calculate component breakdown for transparency
    const usmcaCountries = ['US', 'CA', 'MX'];
    const componentBreakdown = {
      usmca_components: completeComponents.filter(c => usmcaCountries.includes(c.origin_country)),
      non_usmca_components: completeComponents.filter(c => !usmcaCountries.includes(c.origin_country)),
      usmca_percentage: completeComponents
        .filter(c => usmcaCountries.includes(c.origin_country))
        .reduce((sum, c) => sum + parseFloat(c.value_percentage || 0), 0),
      non_usmca_percentage: completeComponents
        .filter(c => !usmcaCountries.includes(c.origin_country))
        .reduce((sum, c) => sum + parseFloat(c.value_percentage || 0), 0)
    };

    // Enhanced qualification result with component analysis
    const enhancedQualification = {
      ...qualificationResult,
      component_breakdown: componentBreakdown,
      total_components_analyzed: completeComponents.length,
      total_percentage_covered: totalPercentage,
      qualification_threshold: qualificationResult.rules_applied?.regional_content_threshold || 62.5
    };

    // Log recalculation results for debugging
    console.log(`✅ Recalculation complete: ${qualificationResult.qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}`);
    console.log(`🌎 North American Content: ${qualificationResult.north_american_content?.toFixed(1)}%`);
    console.log(`🎯 Required Threshold: ${enhancedQualification.qualification_threshold}%`);

    logInfo('USMCA recalculation completed', {
      trigger: recalculationTrigger,
      hs_code: targetHSCode,
      qualified: qualificationResult.qualified,
      north_american_content: qualificationResult.north_american_content,
      usmca_percentage: componentBreakdown.usmca_percentage,
      processing_time: Date.now() - startTime
    });

    // Return comprehensive recalculation results
    return res.json({
      success: true,
      qualification: enhancedQualification,
      recalculation_trigger: recalculationTrigger,
      timestamp: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime,
      
      // Component analysis for UI updates
      component_analysis: {
        complete_components: completeComponents.length,
        total_percentage: totalPercentage,
        usmca_countries_percentage: componentBreakdown.usmca_percentage,
        non_usmca_countries_percentage: componentBreakdown.non_usmca_percentage,
        qualification_gap: Math.max(0, enhancedQualification.qualification_threshold - (qualificationResult.north_american_content || 0))
      },

      // Actionable recommendations
      recommendations: generateRecommendations(qualificationResult, componentBreakdown, enhancedQualification.qualification_threshold)
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logError('USMCA recalculation failed', {
      error: error.message,
      processing_time: processingTime,
      trigger: req.body.recalculationTrigger,
      hs_code: req.body.targetHSCode
    });

    return res.status(500).json({
      success: false,
      error: 'USMCA recalculation failed',
      details: error.message,
      processing_time_ms: processingTime
    });
  }
}

/**
 * Generate actionable recommendations based on qualification results
 */
function generateRecommendations(qualification, breakdown, threshold) {
  const recommendations = [];
  
  if (!qualification.qualified) {
    const shortfall = threshold - (qualification.north_american_content || 0);
    
    recommendations.push({
      type: 'qualification_shortfall',
      message: `Need ${shortfall.toFixed(1)}% more North American content to qualify`,
      action: 'Consider sourcing more components from Mexico, Canada, or US'
    });

    if (breakdown.non_usmca_percentage > shortfall) {
      recommendations.push({
        type: 'component_substitution',
        message: `Converting ${Math.ceil(shortfall)}% from non-USMCA to Mexico sourcing would qualify the product`,
        action: 'Review components from China/Asia for potential Mexico alternatives'
      });
    }
  }

  if (qualification.qualified && qualification.north_american_content < threshold + 10) {
    recommendations.push({
      type: 'qualification_strengthening',
      message: 'Qualification margin is narrow - consider strengthening USMCA content',
      action: 'Additional Mexico sourcing provides qualification security'
    });
  }

  return recommendations;
}