/**
 * TariffSavings - Accurate tariff savings with Section 301 reality
 * Shows REAL savings (base MFN only) + Section 301 burden that remains
 */

import React from 'react';
import { DollarSign } from '../../Icons';

export default function TariffSavings({ results }) {
  if (!results?.component_origins && !results?.components) return null;

  const components = results.component_origins || results.components || [];

  // ✅ FIX #5: Validator now ensures trade_volume exists
  // If this is missing, it's a data contract violation (should never happen in production)
  const tradeVolume = parseFloat(results.company?.trade_volume);
  if (isNaN(tradeVolume) || tradeVolume <= 0) {
    console.error('[TariffSavings] Invalid trade_volume:', results.company?.trade_volume);
    return (
      <div className="card-content">
        <div style={{ padding: '1.5rem', backgroundColor: '#fef2f2', borderRadius: '4px', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '0.875rem', color: '#991b1b', fontWeight: '600', marginBottom: '0.5rem' }}>⚠️ Trade Volume Data Missing</div>
          <div style={{ fontSize: '0.8125rem', color: '#991b1b', lineHeight: '1.5' }}>
            Trade volume is required for savings calculations. Please contact support if you see this message.
          </div>
        </div>
      </div>
    );
  }

  // ✅ ISSUE #1 FIX: Use SINGLE authoritative source - AI's detailed_analysis.savings_analysis
  // The AI calculates savings ONLY in detailed_analysis.savings_analysis
  // Both results.savings and results.detailed_analysis.savings_analysis come from the SAME source
  // Use detailed_analysis since it includes calculation_detail (the "show your work")
  const aiCalculatedSavings = results.detailed_analysis?.savings_analysis?.annual_savings || results.savings?.annual_savings || 0;
  const aiCalculatedMonthlySavings = results.detailed_analysis?.savings_analysis?.monthly_savings || results.savings?.monthly_savings || 0;
  const aiSavingsPercentage = results.detailed_analysis?.savings_analysis?.savings_percentage || results.savings?.savings_percentage || 0;

  // Component-level breakdown for detailed display (for transparency, not for final savings calculation)
  const componentBreakdown = [];
  let calculatedBaseMFNSavings = 0;  // For comparison only
  let calculatedSection301Burden = 0;  // For warnings
  let calculatedSection232Burden = 0;  // NEW: Section 232 (steel/aluminum) burden

  components.forEach(c => {
    const componentValue = tradeVolume * (parseFloat(c.percentage || c.value_percentage || 0) / 100);

    // ✅ CRITICAL FIX (Nov 14): Preserve null vs 0 distinction
    // null = "pending verification", 0 = "verified duty-free"
    const base_mfn = c.mfn_rate !== null && c.mfn_rate !== undefined
      ? parseFloat(c.mfn_rate)
      : (c.base_mfn_rate !== null && c.base_mfn_rate !== undefined ? parseFloat(c.base_mfn_rate) : null);

    const section_301 = c.section_301 !== null && c.section_301 !== undefined ? parseFloat(c.section_301) : null;
    const section_232 = c.section_232 !== null && c.section_232 !== undefined ? parseFloat(c.section_232) : null;  // NEW
    const total_rate = c.total_rate !== null && c.total_rate !== undefined
      ? parseFloat(c.total_rate)
      : (base_mfn !== null && section_301 !== null && section_232 !== null ? base_mfn + section_301 + section_232 : null);

    // ✅ FIX (Oct 28): Rates are in DECIMAL format (0.35 = 35%), NOT percentage format
    // API returns decimals, so NO /100 needed for calculations
    // For display: multiply by 100 to show as percentage
    componentBreakdown.push({
      description: c.description || c.component_type,
      origin: c.origin_country || c.country,
      percentage: parseFloat(c.percentage || c.value_percentage || 0),
      base_mfn: base_mfn !== null ? base_mfn * 100 : null,  // null shows "Pending"
      section_301: section_301 !== null ? section_301 * 100 : null,  // null shows "Pending"
      section_232: section_232 !== null ? section_232 * 100 : null,  // NEW: null shows "Pending"
      total_rate: total_rate !== null ? total_rate * 100 : null,  // null shows "Pending"
      componentValue,
      base_mfn_savings: base_mfn !== null ? componentValue * base_mfn : null,  // Skip if pending
      section_301_cost: section_301 !== null ? componentValue * section_301 : null,  // Skip if pending
      section_232_cost: section_232 !== null ? componentValue * section_232 : null,  // NEW: Skip if pending
      section_232_exemption: c.section_232_exemption || null,  // ✅ NEW (Nov 14): Include exemption data for display
      isPending: base_mfn === null || section_301 === null  // Flag for UI
    });

    // Calculate ONLY for component-level display (not for final number)
    // Skip components with pending (null) rates from totals
    if (base_mfn !== null) {
      calculatedBaseMFNSavings += componentValue * base_mfn;  // ✅ base_mfn already decimal
    }
    if (section_301 !== null && section_301 > 0) {
      calculatedSection301Burden += componentValue * section_301;  // ✅ section_301 already decimal
    }
    if (section_232 !== null && section_232 > 0) {  // NEW
      calculatedSection232Burden += componentValue * section_232;  // ✅ section_232 already decimal
    }
  });

  // Use AI calculation as the authoritative answer
  const baseMFNSavings = aiCalculatedSavings;
  const section301Burden = calculatedSection301Burden;  // Still warn about Section 301
  const section232Burden = calculatedSection232Burden;  // NEW: Warn about Section 232
  const savingsPercentage = aiSavingsPercentage;

  // Check for China components with missing Section 301 data (pending verification)
  const chinaComponentsPending = components.filter(c =>
    (c.origin_country === 'CN' || c.origin_country === 'China' || c.country === 'CN' || c.country === 'China') &&
    (c.section_301 === null || c.section_301 === undefined)
  );
  const hasChinaComponentsPending = chinaComponentsPending.length > 0;

  return (
    <div className="card-content">
      {/* Base MFN Savings (What USMCA Actually Saves) */}
      <div style={{ padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #86efac' }}>
        <div style={{ fontSize: '0.875rem', color: '#166534', marginBottom: '0.5rem', fontWeight: '600' }}>✅ USMCA Base Duty Savings</div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#15803d', marginBottom: '0.5rem' }}>
          ${baseMFNSavings.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#166534' }}>
          {savingsPercentage.toFixed(1)}% of annual volume saved by eliminating base MFN duties
        </div>
        <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.5rem' }}>
          Monthly: ${(baseMFNSavings / 12).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
        </div>
      </div>

      {/* Section 301 Warning (What USMCA DOESN'T Save - China Tariffs) */}
      {section301Burden > 0 && (
        <div style={{ padding: '1.5rem', backgroundColor: '#fef2f2', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '0.5rem', fontWeight: '600' }}>⚠️ Section 301 Tariffs Still Apply (China)</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '0.5rem' }}>
            ${section301Burden.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '0.5rem' }}>
            Annual Section 301 tariff cost that REMAINS despite USMCA qualification
          </div>
          <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>
            Chinese components are subject to Section 301 tariffs regardless of USMCA status.
            To eliminate this cost, source from USMCA suppliers (Mexico/Canada/US).
          </div>
        </div>
      )}

      {/* Section 232 Warning (What USMCA DOESN'T Save - Steel/Aluminum Tariffs) */}
      {section232Burden > 0 && (
        <div style={{ padding: '1.5rem', backgroundColor: '#fef2f2', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '0.5rem', fontWeight: '600' }}>
            🚨 CRITICAL: Section 232 Applies to ALL Countries (50% Steel/Aluminum Tariff)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '0.5rem' }}>
            ${section232Burden.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '0.75rem' }}>
            Annual Section 232 tariff cost that USMCA CANNOT ELIMINATE (applies to Mexico/Canada too)
          </div>
          <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '3px', marginBottom: '0.75rem', border: '1px solid #fca5a5' }}>
            <div style={{ fontSize: '0.75rem', color: '#7f1d1d', fontWeight: '600', marginBottom: '0.25rem' }}>
              ⚠️ Section 232 applies to ALL countries including USMCA members (50% rate, effective June 4, 2025)
            </div>
            <div style={{ fontSize: '0.75rem', color: '#7f1d1d' }}>
              There is NO USMCA exemption for Section 232. Mexico and Canada pay the same 50% tariff as China.
            </div>
          </div>
          <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '3px', border: '1px solid #fcd34d' }}>
            <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: '600', marginBottom: '0.25rem' }}>
              💡 ONLY EXEMPTION: US-Smelted Aluminum or US-Melted Steel
            </div>
            <div style={{ fontSize: '0.75rem', color: '#78350f', marginBottom: '0.5rem' }}>
              If your steel/aluminum components are made from aluminum exclusively smelted and cast in the United States,
              or steel exclusively melted and poured in the United States, they are EXEMPT from Section 232 (0% tariff).
            </div>
            <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: '600', fontStyle: 'italic' }}>
              ✅ ACTION REQUIRED: Verify with your suppliers whether aluminum/steel is US-smelted/melted.
              If yes, provide documentation to eliminate this ${section232Burden.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} cost.
            </div>
          </div>
        </div>
      )}

      {/* Generic China Warning (For Pending Section 301 Verification) */}
      {hasChinaComponentsPending && (
        <div style={{ padding: '1.5rem', backgroundColor: '#fff7ed', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #fed7aa' }}>
          <div style={{ fontSize: '0.875rem', color: '#9a3412', marginBottom: '0.5rem', fontWeight: '600' }}>
            ⚠️ China-Origin Components: Additional Tariffs Likely Apply
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#7c2d12', lineHeight: '1.6', marginBottom: '0.75rem' }}>
            Your product contains {chinaComponentsPending.length} component{chinaComponentsPending.length > 1 ? 's' : ''} from China
            with pending tariff verification. China-origin goods typically face additional tariffs beyond base MFN rates:
          </div>
          <div style={{ padding: '0.75rem', backgroundColor: '#ffedd5', borderRadius: '3px', marginBottom: '0.75rem', border: '1px solid #fdba74' }}>
            <div style={{ fontSize: '0.75rem', color: '#7c2d12', fontWeight: '600', marginBottom: '0.5rem' }}>
              📋 Typical China Tariff Layers:
            </div>
            <div style={{ fontSize: '0.75rem', color: '#7c2d12', marginBottom: '0.25rem' }}>
              • <strong>Section 301</strong>: 25-50% (most electronics/industrial goods)
            </div>
            <div style={{ fontSize: '0.75rem', color: '#7c2d12', marginBottom: '0.25rem' }}>
              • <strong>IEEPA China Reciprocal</strong>: 10% baseline
            </div>
            <div style={{ fontSize: '0.75rem', color: '#7c2d12', marginBottom: '0.25rem' }}>
              • <strong>Section 232</strong>: 50% (if steel/aluminum)
            </div>
            <div style={{ fontSize: '0.75rem', color: '#7c2d12', fontStyle: 'italic', marginTop: '0.5rem' }}>
              Combined: 35-110% typical total tariff for China goods
            </div>
          </div>
          <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '3px', border: '1px solid #fcd34d' }}>
            <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: '600', marginBottom: '0.5rem' }}>
              🔍 Pending Verification:
            </div>
            {chinaComponentsPending.map((comp, idx) => (
              <div key={idx} style={{ fontSize: '0.75rem', color: '#78350f', marginBottom: '0.25rem' }}>
                • {comp.description || comp.component_type || 'Component'} (HTS: {comp.hs_code || 'Pending'})
              </div>
            ))}
            <div style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: '600', fontStyle: 'italic', marginTop: '0.5rem' }}>
              ⚠️ STATUS: Exact Section 301/IEEPA rates pending HTS code verification
            </div>
          </div>
          <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '3px', border: '1px solid #86efac', marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '600', marginBottom: '0.25rem' }}>
              💡 RECOMMENDED ACTION: Consider USMCA Sourcing
            </div>
            <div style={{ fontSize: '0.75rem', color: '#166534' }}>
              Switching to Mexico/Canada suppliers eliminates Section 301 and IEEPA tariffs.
              Verify exact rates with customs broker before making six-figure sourcing decisions.
            </div>
          </div>
        </div>
      )}

      {/* Component-Level Tariff Breakdown */}
      {componentBreakdown.length > 0 && (
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem', fontWeight: '600' }}>📊 Component-Level Tariff Breakdown</div>
          {componentBreakdown.map((comp, idx) => (
            <div key={idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: idx < componentBreakdown.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                {comp.description} ({comp.origin}) - {comp.percentage}% of product
              </div>
              {comp.isPending ? (
                <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontStyle: 'italic' }}>
                  ⏳ Tariff rates pending verification - awaiting USITC data
                </div>
              ) : (comp.section_301 !== null && comp.section_301 > 0) || (comp.section_232 !== null && comp.section_232 > 0) ? (
                <>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Base MFN: {comp.base_mfn.toFixed(1)}%
                    {comp.section_301 > 0 && ` + Section 301: ${comp.section_301.toFixed(1)}%`}
                    {comp.section_232 > 0 && ` + Section 232: ${comp.section_232.toFixed(1)}%`}
                    {' = '}<strong>Total: {comp.total_rate.toFixed(1)}%</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#059669', marginBottom: '0.25rem' }}>
                    ✅ USMCA Saves: ${comp.base_mfn_savings.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} ({comp.base_mfn.toFixed(1)}% eliminated)
                  </div>
                  {comp.section_301 > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#dc2626', marginBottom: '0.25rem' }}>
                      ❌ Section 301 Remains: ${comp.section_301_cost.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} ({comp.section_301.toFixed(1)}% China tariff)
                    </div>
                  )}
                  {comp.section_232 > 0 && (
                    <>
                      <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                        ❌ Section 232 Remains: ${comp.section_232_cost.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} ({comp.section_232.toFixed(1)}% steel/aluminum tariff - applies to ALL countries)
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#d97706', fontStyle: 'italic', marginTop: '0.25rem' }}>
                        💡 Can be 0% if aluminum is US-smelted or steel is US-melted - verify with supplier
                      </div>
                    </>
                  )}
                  {/* ✅ NEW: Show Section 232 exemption status if provided */}
                  {comp.section_232_exemption && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: comp.section_232_exemption.exemption_amount > 0 ? '#d1fae5' : '#fef2f2',
                      border: `1px solid ${comp.section_232_exemption.exemption_amount > 0 ? '#10b981' : '#fecaca'}`,
                      borderRadius: '4px'
                    }}>
                      {comp.section_232_exemption.exemption_amount > 0 ? (
                        <>
                          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#065f46', marginBottom: '0.25rem' }}>
                            ✅ Section 232 Exemption Applied
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#047857' }}>
                            US-origin material: Saving ${(comp.componentValue * comp.section_232_exemption.exemption_amount).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}/year ({(comp.section_232_exemption.original_rate * 100).toFixed(1)}% tariff exempted)
                          </div>
                          {comp.section_232_exemption.material_notes && (
                            <div style={{ fontSize: '0.7rem', color: '#047857', fontStyle: 'italic', marginTop: '0.25rem' }}>
                              📝 {comp.section_232_exemption.material_notes}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            {comp.section_232_exemption.reason}
                          </div>
                          {comp.section_232_exemption.potential_savings > 0 && (
                            <div style={{ fontSize: '0.7rem', color: '#d97706', fontStyle: 'italic' }}>
                              💰 Potential savings if US-origin: ${(comp.componentValue * comp.section_232_exemption.potential_savings).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}/year
                            </div>
                          )}
                          {comp.section_232_exemption.material_notes && (
                            <div style={{ fontSize: '0.7rem', color: '#6b7280', fontStyle: 'italic', marginTop: '0.25rem' }}>
                              📝 {comp.section_232_exemption.material_notes}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Tariff Rate: {comp.total_rate !== null ? `${comp.total_rate.toFixed(1)}%` : 'Pending'} | USMCA Saves: {comp.base_mfn_savings !== null ? `$${comp.base_mfn_savings.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}` : 'Pending'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Net Comparison - Using AI-calculated values */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Without USMCA</div>
          <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
            ${(baseMFNSavings + section301Burden + section232Burden).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
          </div>
          <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>annual tariff cost</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>With USMCA</div>
          <div style={{ fontSize: '1.125rem', fontWeight: '600', color: (section301Burden + section232Burden) > 0 ? '#dc2626' : '#15803d' }}>
            ${(section301Burden + section232Burden).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
          </div>
          <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>annual tariff cost</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Reduction</div>
          <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#15803d' }}>
            ${baseMFNSavings.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
          </div>
          <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>tariff savings (AI-calculated)</div>
        </div>
      </div>

      {/* Optimization Opportunity - Section 301 */}
      {section301Burden > baseMFNSavings && (
        <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '4px', marginTop: '1rem', border: '1px solid #93c5fd' }}>
          <div style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>💡 Major Optimization Opportunity (Section 301)</div>
          <div style={{ fontSize: '0.8125rem', color: '#1e3a8a', lineHeight: '1.5' }}>
            Switch Chinese components to Mexican suppliers to eliminate the ${section301Burden.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} Section 301 burden.
            Even with 15-20% material premium, you could save an additional ${(section301Burden * 0.3).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} annually.
          </div>
        </div>
      )}

      {/* Optimization Opportunity - Section 232 */}
      {section232Burden > baseMFNSavings * 0.5 && (
        <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '4px', marginTop: '1rem', border: '1px solid #93c5fd' }}>
          <div style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>💡 Steel/Aluminum Optimization Opportunity (Section 232)</div>
          <div style={{ fontSize: '0.8125rem', color: '#1e3a8a', lineHeight: '1.5' }}>
            Switch steel/aluminum components to Canadian or Mexican suppliers to eliminate the ${section232Burden.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} Section 232 burden.
            USMCA members are exempt from Section 232 tariffs - this is pure savings with no additional cost.
          </div>
        </div>
      )}
    </div>
  );
}