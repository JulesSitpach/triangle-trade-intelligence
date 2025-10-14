/**
 * HTS 2025 Database Lookup
 * Provides accurate, official tariff rates from USITC data
 * Updated: January 2025
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Lookup tariff rates from HTS 2025 database
 * @param {string} hsCode - HS code (6 or 8 digits)
 * @returns {Object} Tariff rates with metadata
 */
export async function lookupHTSTariffRates(hsCode) {
  try {
    // Normalize HS code to 8 digits (add .00 if needed)
    const normalizedCode = normalizeHSCode(hsCode);

    console.log(`🔍 Looking up HTS rates for: ${normalizedCode}`);

    // Query HTS database
    const { data, error } = await supabase
      .from('tariff_intelligence_master')  // Updated to consolidated master table
      .select('hts8, brief_description, mfn_ad_val_rate, usmca_ad_val_rate, begin_effect_date, triangle_eligible, rule_of_origin')
      .eq('hts8', normalizedCode)
      .single();

    if (error || !data) {
      console.log(`⚠️ HTS code ${normalizedCode} not found in database`);
      return {
        success: false,
        error: 'HS code not found in HTS database'
      };
    }

    console.log(`✅ HTS rates found: MFN ${data.mfn_ad_val_rate * 100}%, USMCA ${data.usmca_ad_val_rate * 100}%`);

    return {
      success: true,
      hs_code: data.hts8,
      description: data.brief_description,
      mfn_rate: data.mfn_ad_val_rate * 100, // Convert decimal to percentage
      usmca_rate: data.usmca_ad_val_rate * 100, // Convert decimal to percentage
      last_updated: data.begin_effect_date || '2025-01-01',
      source: 'USITC HTS Database 2025'
    };

  } catch (error) {
    console.error('HTS lookup error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Normalize HS code to 8-digit format for database lookup
 * @param {string} hsCode - HS code (6 or 8 digits, may have dots)
 * @returns {string} 8-digit HS code without dots
 */
function normalizeHSCode(hsCode) {
  if (!hsCode) return null;

  // Remove dots and spaces
  let normalized = hsCode.replace(/[.\s]/g, '');

  // Pad to 8 digits if needed (add 00 at end for 6-digit codes)
  if (normalized.length === 6) {
    normalized = normalized + '00';
  }

  return normalized;
}

/**
 * Detect tariff rate changes for alert system
 * Compares current component tariffs with HTS database to identify changes
 * @param {Array} components - Array of components with HS codes and current rates
 * @returns {Array} Components with rate changes detected
 */
export async function detectTariffChanges(components) {
  const changesDetected = [];

  for (const component of components) {
    if (!component.hs_code) continue;

    const currentRates = await lookupHTSTariffRates(component.hs_code);

    if (!currentRates.success) continue;

    // Check if rates have changed
    const mfnChanged = Math.abs(currentRates.mfn_rate - (component.mfn_rate || 0)) > 0.1;
    const usmcaChanged = Math.abs(currentRates.usmca_rate - (component.usmca_rate || 0)) > 0.1;

    if (mfnChanged || usmcaChanged) {
      changesDetected.push({
        ...component,
        tariff_change: {
          hs_code: component.hs_code,
          old_mfn_rate: component.mfn_rate || 0,
          new_mfn_rate: currentRates.mfn_rate,
          old_usmca_rate: component.usmca_rate || 0,
          new_usmca_rate: currentRates.usmca_rate,
          mfn_changed: mfnChanged,
          usmca_changed: usmcaChanged,
          detected_at: new Date().toISOString()
        }
      });
    }
  }

  return changesDetected;
}

/**
 * Calculate financial impact of tariff changes
 * @param {Array} changedComponents - Components with tariff changes
 * @param {number} annualTradeVolume - Company's annual trade volume
 * @returns {Object} Financial impact analysis
 */
export function calculateTariffChangeImpact(changedComponents, annualTradeVolume) {
  let totalImpact = 0;
  const componentImpacts = [];

  for (const component of changedComponents) {
    const change = component.tariff_change;
    const componentValue = annualTradeVolume * (component.value_percentage / 100);

    // Calculate impact based on MFN rate change (assumes company pays MFN if not USMCA qualified)
    const rateDelta = change.new_mfn_rate - change.old_mfn_rate;
    const dollarImpact = componentValue * (rateDelta / 100);

    totalImpact += dollarImpact;

    componentImpacts.push({
      component_description: component.description,
      hs_code: component.hs_code,
      value_percentage: component.value_percentage,
      rate_change: `${change.old_mfn_rate.toFixed(1)}% → ${change.new_mfn_rate.toFixed(1)}%`,
      annual_impact: dollarImpact,
      severity: Math.abs(dollarImpact) > 10000 ? 'HIGH' : Math.abs(dollarImpact) > 5000 ? 'MEDIUM' : 'LOW'
    });
  }

  return {
    total_annual_impact: totalImpact,
    affected_components: componentImpacts.length,
    component_details: componentImpacts,
    alert_priority: Math.abs(totalImpact) > 50000 ? 'CRITICAL' : Math.abs(totalImpact) > 10000 ? 'HIGH' : 'MEDIUM'
  };
}

/**
 * Generate alert for tariff rate changes
 * @param {Object} company - Company data
 * @param {Object} impactAnalysis - Financial impact analysis
 * @returns {Object} Alert object ready for notification system
 */
export function generateTariffChangeAlert(company, impactAnalysis) {
  return {
    alert_type: 'TARIFF_RATE_CHANGE',
    severity: impactAnalysis.alert_priority,
    company_name: company.company_name,
    title: `Tariff Rate Changes Detected: ${impactAnalysis.affected_components} Components Affected`,
    description: `HTS database update detected ${impactAnalysis.affected_components} component(s) with tariff rate changes affecting your supply chain.`,
    financial_impact: {
      estimated_annual_impact: impactAnalysis.total_annual_impact,
      affected_trade_volume: company.annual_trade_volume,
      impact_percentage: (Math.abs(impactAnalysis.total_annual_impact) / company.annual_trade_volume) * 100
    },
    affected_components: impactAnalysis.component_details,
    recommended_actions: [
      'Review affected components for sourcing alternatives',
      'Consider USMCA qualification to reduce tariff exposure',
      'Evaluate Mexico sourcing for tariff-free access',
      'Consult with customs broker for compliance strategy'
    ],
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  };
}
