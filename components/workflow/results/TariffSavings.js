/**
 * TariffSavings - Accurate tariff savings with Section 301 reality
 * Shows REAL savings (base MFN only) + Section 301 burden that remains
 */

import React from 'react';
import { DollarSign } from '../../Icons';

export default function TariffSavings({ results }) {
  if (!results?.component_origins && !results?.components) return null;

  const components = results.component_origins || results.components || [];
  const tradeVolume = parseFloat(results.company?.trade_volume || 0);

  // Calculate REAL savings: only base MFN rates are eliminated
  // Section 301 REMAINS even with USMCA qualification
  let baseMFNSavings = 0;
  let section301Burden = 0;
  let totalWithoutUSMCA = 0;

  // Component-level breakdown for detailed display
  const componentBreakdown = [];

  components.forEach(c => {
    const componentValue = tradeVolume * (parseFloat(c.percentage || c.value_percentage || 0) / 100);
    const baseMFN = parseFloat(c.mfn_rate || c.base_mfn_rate || 0);
    const section301 = parseFloat(c.section_301 || 0);
    const totalRate = parseFloat(c.total_rate || baseMFN + section301);

    // Store component details for display
    componentBreakdown.push({
      description: c.description || c.component_type,
      origin: c.origin_country || c.country,
      percentage: parseFloat(c.percentage || c.value_percentage || 0),
      baseMFN,
      section301,
      totalRate,
      componentValue,
      baseMFNSavings: componentValue * (baseMFN / 100),
      section301Cost: componentValue * (section301 / 100)
    });

    // Base MFN is eliminated by USMCA
    baseMFNSavings += componentValue * (baseMFN / 100);

    // Section 301 REMAINS (Chinese goods still pay this)
    if (section301 > 0) {
      section301Burden += componentValue * (section301 / 100);
    }

    // Total tariff cost WITHOUT USMCA
    totalWithoutUSMCA += componentValue * (totalRate / 100);
  });

  const netTariffCost = section301Burden; // With USMCA, only Section 301 remains
  const savingsPercentage = tradeVolume > 0 ? (baseMFNSavings / tradeVolume) * 100 : 0;

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

      {/* Section 301 Warning (What USMCA DOESN'T Save) */}
      {section301Burden > 0 && (
        <div style={{ padding: '1.5rem', backgroundColor: '#fef2f2', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '0.5rem', fontWeight: '600' }}>⚠️ Section 301 Tariffs Still Apply</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '0.5rem' }}>
            ${section301Burden.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '0.5rem' }}>
            Annual tariff cost that REMAINS despite USMCA qualification
          </div>
          <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>
            Chinese components are subject to Section 301 tariffs regardless of USMCA status.
            To eliminate this cost, source from USMCA suppliers (Mexico/Canada/US).
          </div>
        </div>
      )}

      {/* Component-Level Tariff Breakdown */}
      {componentBreakdown.length > 0 && componentBreakdown.some(c => c.section301 > 0) && (
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem', fontWeight: '600' }}>📊 Component-Level Tariff Breakdown</div>
          {componentBreakdown.map((comp, idx) => (
            <div key={idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: idx < componentBreakdown.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                {comp.description} ({comp.origin}) - {comp.percentage}% of product
              </div>
              {comp.section301 > 0 ? (
                <>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Base MFN Rate: {comp.baseMFN}% + Section 301: {comp.section301}% = <strong>Total: {comp.totalRate}%</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#059669', marginBottom: '0.25rem' }}>
                    ✅ USMCA Saves: ${comp.baseMFNSavings.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} ({comp.baseMFN}% eliminated)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                    ❌ Section 301 Remains: ${comp.section301Cost.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} ({comp.section301}% still applies)
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Tariff Rate: {comp.totalRate}% | USMCA Saves: ${comp.baseMFNSavings.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Net Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Without USMCA</div>
          <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
            ${totalWithoutUSMCA.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
          </div>
          <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>annual tariff cost</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>With USMCA</div>
          <div style={{ fontSize: '1.125rem', fontWeight: '600', color: section301Burden > 0 ? '#dc2626' : '#15803d' }}>
            ${netTariffCost.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
          </div>
          <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>annual tariff cost</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Reduction</div>
          <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#15803d' }}>
            {((baseMFNSavings / totalWithoutUSMCA) * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>tariff reduction</div>
        </div>
      </div>

      {/* Optimization Opportunity */}
      {section301Burden > baseMFNSavings && (
        <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '4px', marginTop: '1rem', border: '1px solid #93c5fd' }}>
          <div style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>💡 Major Optimization Opportunity</div>
          <div style={{ fontSize: '0.8125rem', color: '#1e3a8a', lineHeight: '1.5' }}>
            Switch Chinese components to Mexican suppliers to eliminate the ${section301Burden.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} Section 301 burden.
            Even with 15-20% material premium, you could save an additional ${(section301Burden * 0.3).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} annually.
          </div>
        </div>
      )}
    </div>
  );
}