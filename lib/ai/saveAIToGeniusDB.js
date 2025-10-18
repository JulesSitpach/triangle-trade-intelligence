/**
 * GENIUS DATABASE - AI Result Persistence
 *
 * Every AI call saves results to build knowledge over time
 * 100% AI-first, database learns from every request
 *
 * Usage:
 *   await saveToGeniusDB.classification({ hs_code, mfn_rate, ... })
 *   await saveToGeniusDB.supplier({ supplier_name, country, ... })
 *   await saveToGeniusDB.crisis({ crisis_type, severity, ... })
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Save HS code classification + tariff rates
 */
async function saveClassification(data) {
  try {
    const { error } = await supabase
      .from('ai_classifications')
      .insert({
        hs_code: data.hs_code,
        component_description: data.description || data.component_description,
        mfn_rate: data.mfn_rate || 0,
        base_mfn_rate: data.base_mfn_rate || data.mfn_rate || 0,
        policy_adjusted_mfn_rate: data.mfn_rate || 0,
        usmca_rate: data.usmca_rate || 0,
        policy_adjustments: data.policy_adjustments || [],
        origin_country: data.origin_country || data.country,
        confidence: data.confidence || data.ai_confidence || 85,
        reasoning: data.reasoning,
        verified: false,
        last_updated: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });

    if (error && error.code !== '23505') { // Ignore duplicates
      console.error('⚠️ Classification save failed:', error.message);
      return { success: false, error };
    }

    console.log(`💾 Saved classification: HS ${data.hs_code}`);
    return { success: true };

  } catch (error) {
    console.error('⚠️ Classification save exception:', error.message);
    return { success: false, error };
  }
}

/**
 * Save supplier intelligence
 */
async function saveSupplier(data) {
  try {
    const { error } = await supabase
      .from('ai_supplier_intelligence')
      .insert({
        supplier_name: data.supplier_name || data.name,
        country: data.country,
        region: data.region,
        industry_sector: data.industry_sector || data.industry,
        products_offered: data.products_offered || data.products || [],
        certifications: data.certifications || [],
        production_capacity: data.production_capacity,
        usmca_compliant: data.usmca_compliant || false,
        reliability_score: data.reliability_score || data.score,
        cost_competitiveness: data.cost_competitiveness || data.cost_level,
        lead_time_days: data.lead_time_days,
        minimum_order_quantity: data.moq || data.minimum_order_quantity,
        contact_info: data.contact_info || {},
        source_analysis: data.source_analysis || 'AI discovery',
        ai_confidence: data.ai_confidence || data.confidence || 85,
        verified: false,
        last_updated: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });

    if (error && error.code !== '23505') {
      console.error('⚠️ Supplier save failed:', error.message);
      return { success: false, error };
    }

    console.log(`💾 Saved supplier: ${data.supplier_name || data.name}`);
    return { success: true };

  } catch (error) {
    console.error('⚠️ Supplier save exception:', error.message);
    return { success: false, error };
  }
}

/**
 * Save crisis/alert intelligence
 */
async function saveCrisis(data) {
  try {
    const { error } = await supabase
      .from('ai_crisis_intelligence')
      .insert({
        crisis_type: data.crisis_type || data.type,
        affected_countries: data.affected_countries || data.countries || [],
        affected_hs_codes: data.affected_hs_codes || data.hs_codes || [],
        severity: data.severity,
        impact_summary: data.impact_summary || data.summary,
        policy_details: data.policy_details || {},
        effective_date: data.effective_date,
        source: data.source,
        mitigation_strategies: data.mitigation_strategies || data.recommendations || [],
        ai_analysis: data.ai_analysis || data.analysis,
        ai_confidence: data.ai_confidence || data.confidence || 90,
        verified: false,
        resolution_status: 'active',
        last_updated: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });

    if (error && error.code !== '23505') {
      console.error('⚠️ Crisis save failed:', error.message);
      return { success: false, error };
    }

    console.log(`💾 Saved crisis alert: ${data.crisis_type || data.type}`);
    return { success: true };

  } catch (error) {
    console.error('⚠️ Crisis save exception:', error.message);
    return { success: false, error };
  }
}

/**
 * Save USMCA qualification research
 */
async function saveUSMCAQualification(data) {
  try {
    const { error } = await supabase
      .from('ai_usmca_qualifications')
      .insert({
        product_category: data.product_category || data.category,
        industry_sector: data.industry_sector || data.industry,
        hs_code_range: data.hs_code_range,
        required_threshold: data.required_threshold || data.threshold,
        threshold_source: data.threshold_source,
        threshold_reasoning: data.threshold_reasoning,
        regional_value_method: data.regional_value_method || 'Transaction Value',
        product_specific_rules: data.product_specific_rules || [],
        documentation_required: data.documentation_required || [],
        common_pitfalls: data.common_pitfalls || [],
        optimization_strategies: data.optimization_strategies || [],
        ai_confidence: data.ai_confidence || data.confidence || 90,
        verified: false,
        last_updated: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });

    if (error && error.code !== '23505') {
      console.error('⚠️ USMCA qualification save failed:', error.message);
      return { success: false, error };
    }

    console.log(`💾 Saved USMCA rule: ${data.product_category || data.category}`);
    return { success: true };

  } catch (error) {
    console.error('⚠️ USMCA qualification save exception:', error.message);
    return { success: false, error };
  }
}

/**
 * Save trade policy intelligence
 */
async function saveTradePolicy(data) {
  try {
    const { error } = await supabase
      .from('ai_trade_policies')
      .insert({
        policy_name: data.policy_name || data.name,
        policy_type: data.policy_type || data.type,
        affected_countries: data.affected_countries || data.countries || [],
        affected_hs_codes: data.affected_hs_codes || data.hs_codes || [],
        policy_details: data.policy_details || data.details,
        tariff_changes: data.tariff_changes || {},
        effective_date: data.effective_date,
        sunset_date: data.sunset_date,
        exemptions: data.exemptions || [],
        strategic_implications: data.strategic_implications,
        business_recommendations: data.business_recommendations || data.recommendations || [],
        ai_analysis: data.ai_analysis || data.analysis,
        ai_confidence: data.ai_confidence || data.confidence || 85,
        verified: false,
        last_updated: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });

    if (error && error.code !== '23505') {
      console.error('⚠️ Trade policy save failed:', error.message);
      return { success: false, error };
    }

    console.log(`💾 Saved trade policy: ${data.policy_name || data.name}`);
    return { success: true };

  } catch (error) {
    console.error('⚠️ Trade policy save exception:', error.message);
    return { success: false, error };
  }
}

/**
 * Save manufacturing intelligence
 */
async function saveManufacturing(data) {
  try {
    const { error } = await supabase
      .from('ai_manufacturing_intelligence')
      .insert({
        product_type: data.product_type || data.product,
        manufacturing_country: data.manufacturing_country || data.country,
        feasibility_score: data.feasibility_score || data.score,
        cost_analysis: data.cost_analysis || {},
        infrastructure_assessment: data.infrastructure_assessment,
        labor_availability: data.labor_availability,
        regulatory_compliance: data.regulatory_compliance || [],
        lead_time_estimate: data.lead_time_estimate,
        investment_required: data.investment_required,
        risk_factors: data.risk_factors || [],
        competitive_advantages: data.competitive_advantages || [],
        ai_analysis: data.ai_analysis || data.analysis,
        ai_confidence: data.ai_confidence || data.confidence || 80,
        verified: false,
        last_updated: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });

    if (error && error.code !== '23505') {
      console.error('⚠️ Manufacturing save failed:', error.message);
      return { success: false, error };
    }

    console.log(`💾 Saved manufacturing intel: ${data.product_type} in ${data.manufacturing_country}`);
    return { success: true };

  } catch (error) {
    console.error('⚠️ Manufacturing save exception:', error.message);
    return { success: false, error };
  }
}

/**
 * Save market intelligence
 */
async function saveMarket(data) {
  try {
    const { error } = await supabase
      .from('ai_market_intelligence')
      .insert({
        target_market: data.target_market || data.market,
        product_category: data.product_category || data.category,
        market_size: data.market_size,
        growth_rate: data.growth_rate,
        competitive_landscape: data.competitive_landscape,
        entry_barriers: data.entry_barriers || [],
        regulatory_requirements: data.regulatory_requirements || [],
        distribution_channels: data.distribution_channels || [],
        pricing_strategy: data.pricing_strategy,
        target_customer_profile: data.target_customer_profile,
        success_factors: data.success_factors || [],
        risk_factors: data.risk_factors || [],
        ai_analysis: data.ai_analysis || data.analysis,
        ai_confidence: data.ai_confidence || data.confidence || 75,
        verified: false,
        last_updated: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });

    if (error && error.code !== '23505') {
      console.error('⚠️ Market intel save failed:', error.message);
      return { success: false, error };
    }

    console.log(`💾 Saved market intel: ${data.target_market}`);
    return { success: true };

  } catch (error) {
    console.error('⚠️ Market intel save exception:', error.message);
    return { success: false, error };
  }
}

/**
 * Save document intelligence
 */
async function saveDocument(data, userId = null) {
  try {
    const { error } = await supabase
      .from('ai_document_intelligence')
      .insert({
        document_type: data.document_type || data.type,
        extracted_data: data.extracted_data || data.data || {},
        hs_codes_found: data.hs_codes_found || data.hs_codes || [],
        countries_mentioned: data.countries_mentioned || data.countries || [],
        compliance_issues: data.compliance_issues || [],
        data_quality_score: data.data_quality_score || data.quality_score,
        extraction_confidence: data.extraction_confidence || data.confidence || 85,
        verification_status: 'pending',
        ai_analysis: data.ai_analysis || data.analysis,
        user_id: userId,
        last_updated: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });

    if (error && error.code !== '23505') {
      console.error('⚠️ Document save failed:', error.message);
      return { success: false, error };
    }

    console.log(`💾 Saved document extract: ${data.document_type || data.type}`);
    return { success: true };

  } catch (error) {
    console.error('⚠️ Document save exception:', error.message);
    return { success: false, error };
  }
}

/**
 * Batch save multiple classifications (for tariff lookups)
 */
async function saveBatchClassifications(classificationsArray) {
  const promises = classificationsArray.map(data => saveClassification(data));
  const results = await Promise.allSettled(promises);

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;

  console.log(`💾 Batch save: ${successful} saved, ${failed} failed`);
  return { successful, failed };
}

// Export all save functions
export const saveToGeniusDB = {
  classification: saveClassification,
  supplier: saveSupplier,
  crisis: saveCrisis,
  usmcaQualification: saveUSMCAQualification,
  tradePolicy: saveTradePolicy,
  manufacturing: saveManufacturing,
  market: saveMarket,
  document: saveDocument,
  batchClassifications: saveBatchClassifications
};

export default saveToGeniusDB;
