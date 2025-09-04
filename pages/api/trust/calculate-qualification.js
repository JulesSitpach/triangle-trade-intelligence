/**
 * USMCA Qualification Calculation API
 * Calculates USMCA qualification based on supply chain data
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { component_origins, manufacturing_location, hs_code, business_type } = req.body;

  if (!component_origins || !manufacturing_location) {
    return res.status(400).json({ 
      error: 'Component origins and manufacturing location are required' 
    });
  }

  try {
    // Load USMCA engine
    const { databaseDrivenUSMCAEngine } = await import('../../../lib/core/database-driven-usmca-engine.js');
    await databaseDrivenUSMCAEngine.initialize();

    const qualificationResult = await databaseDrivenUSMCAEngine.checkUSMCAQualification(
      hs_code,
      component_origins,
      manufacturing_location,
      business_type || 'General'
    );

    // Calculate trust score for qualification
    const trustScore = calculateTrustScore({
      hasCompleteSupplyChain: component_origins.every(c => c.origin_country && c.value_percentage > 0),
      hasManufacturingLocation: !!manufacturing_location,
      dataSourceReliability: qualificationResult.rules_applied?.source !== 'emergency_fallback'
    });

    return res.json({
      success: true,
      qualified: qualificationResult.qualified,
      threshold_required: qualificationResult.threshold_applied,
      regional_content: qualificationResult.north_american_content,
      rule_description: qualificationResult.rule,
      trust_score: trustScore,
      calculation_timestamp: new Date().toISOString(),
      component_breakdown: qualificationResult.component_breakdown,
      qualification_details: {
        north_american_value: qualificationResult.north_american_value,
        total_value: qualificationResult.total_value,
        percentage: qualificationResult.north_american_content
      }
    });

  } catch (error) {
    console.error('USMCA qualification calculation failed:', error);
    
    return res.json({
      success: false,
      qualified: false,
      error: 'Qualification calculation unavailable',
      trust_score: 0.0,
      fallback: 'Manual qualification review required',
      message: error.message
    });
  }
}

/**
 * Calculate trust score based on data quality
 */
function calculateTrustScore(factors) {
  let score = 0.0;
  
  if (factors.hsCodeExists) score += 0.3;
  if (factors.hasDescription) score += 0.2;
  if (factors.hasTariffData) score += 0.2;
  if (factors.hasCompleteSupplyChain) score += 0.2;
  if (factors.hasManufacturingLocation) score += 0.1;
  if (factors.dataSourceReliability) score += 0.1;
  if (factors.requiresManualVerification) score = Math.max(0.1, score * 0.5);
  
  return Math.min(1.0, Math.max(0.0, score));
}