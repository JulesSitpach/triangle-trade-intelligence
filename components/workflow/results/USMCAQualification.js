/**
 * USMCAQualification - Component Analysis
 * Shows component breakdown and regional content analysis
 * NO duplicate qualification status (shown in hero section)
 */

import React, { useState } from 'react';
import Link from 'next/link';

// EDUCATIONAL: Simple tooltip component for trade terminology
const Tooltip = ({ text, children }) => {
  const [show, setShow] = useState(false);

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ borderBottom: '1px dotted #6b7280', cursor: 'help' }}
      >
        {children}
      </span>
      {show && (
        <span style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '0.5rem',
          backgroundColor: '#1f2937',
          color: '#ffffff',
          fontSize: '0.75rem',
          borderRadius: '4px',
          whiteSpace: 'normal',
          width: '200px',
          zIndex: 1000,
          marginBottom: '0.5rem',
          lineHeight: '1.4'
        }}>
          {text}
          <span style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #1f2937'
          }} />
        </span>
      )}
    </span>
  );
};

export default function USMCAQualification({ results }) {
  console.log('🚨 USMCAQualification component called with:', results);
  const [expandedComponents, setExpandedComponents] = useState({});

  if (!results?.usmca) return null;

  const { qualified, rule, reason, documentation_required } = results.usmca;

  const toggleComponentDetails = (index) => {
    setExpandedComponents(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Extract gap analysis data for NOT QUALIFIED products
  const extractGapAnalysis = () => {
    console.log('🔍 Gap Analysis Debug:', { qualified, results });

    // Don't show for qualified products
    if (qualified) return null;

    const currentContent = results.usmca.north_american_content || 0;
    const requiredThreshold = results.usmca.threshold_applied || results.usmca.threshold_required || 62.5;
    const gap = requiredThreshold - currentContent;

    console.log('📊 Threshold Data:', {
      currentContent,
      requiredThreshold,
      gap,
      source: 'API response (config file)'
    });

    if (gap <= 0) return null;

    const components = results.usmca.component_breakdown || [];
    const nonUsmcaComponents = components.filter(c =>
      !c.is_usmca_member && c.value_percentage > 0
    ).sort((a, b) => b.value_percentage - a.value_percentage);

    const targetComponent = nonUsmcaComponents[0];
    if (!targetComponent) return null;

    // Calculate potential savings from trade volume and gap
    const tradeVolume = results.company?.trade_volume;
    if (!tradeVolume) {
      console.error('❌ [FORM SCHEMA] Missing company.trade_volume in USMCAQualification gap analysis (line 102)');
      return null;
    }

    // CRITICAL FIX: NO FALLBACK for MFN rate - must come from AI/database
    const avgTariffRate = results.product?.mfn_rate;
    if (!avgTariffRate) {
      console.error('❌ [HARDCODING] Missing product.mfn_rate - cannot calculate savings without AI tariff data');
      return null; // Don't show gap analysis without actual tariff rate
    }

    // If they close the gap, calculate savings on the additional qualifying percentage
    const potentialSavings = tradeVolume > 0 && avgTariffRate > 0
      ? Math.round((tradeVolume * (gap / 100) * avgTariffRate))
      : results.savings?.annual_savings || 0;

    return {
      gap,
      currentContent,
      requiredThreshold,
      targetComponent,
      potentialSavings,
      estimatedTimeline: gap > 20 ? '6-12 months' : '3-6 months'
    };
  };

  const gapAnalysis = extractGapAnalysis();

  return (
    <div className="card-content">
      {/* Component Breakdown Table */}
      {results.usmca.component_breakdown && results.usmca.component_breakdown.length > 0 && (
        <div className="element-spacing">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Component</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Origin</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Value %</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                  <Tooltip text="Most Favored Nation rate - standard import duty without trade agreement benefits">
                    MFN Rate
                  </Tooltip>
                </th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                  <Tooltip text="Preferential duty rate for USMCA-qualified goods. Usually 0% (duty-free) when your product qualifies">
                    USMCA Rate
                  </Tooltip>
                </th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                  <Tooltip text="Additional tariffs (Section 301 on China goods, Section 232 on steel/aluminum)">
                    Additional Tariffs
                  </Tooltip>
                </th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                  <Tooltip text="Total duty rate including all policy adjustments (MFN + Section 301 + Section 232)">
                    Total Rate
                  </Tooltip>
                </th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                  <Tooltip text="Annual tariff savings per component (Trade Volume × Value % × (MFN - USMCA Rate))">
                    Annual Savings
                  </Tooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              {results.usmca.component_breakdown.map((component, index) => {
                // ✅ API returns snake_case field names (database canonical format)
                // All fields use underscore: mfn_rate, base_mfn_rate, section_301, usmca_rate, etc.
                // Note: Rates are in decimal format (0-1 range), display multiplies by 100
                // ✅ DEFENSIVE APPROACH: Handle missing data gracefully
                // If any rate is missing, show 'N/A' instead of silent 0 - helps identify pipeline breaks
                const baseMfnRate = component.base_mfn_rate ?? component.mfn_rate ?? null;
                const section301 = component.section_301 ?? null;
                const section232 = component.section_232 ?? null;
                const usmcaRate = component.usmca_rate ?? component.tariff_rates?.usmca_rate ?? null;

                const totalAppliedRate = component.total_rate ?? (baseMfnRate !== null && section301 !== null && section232 !== null ? baseMfnRate + section301 + section232 : null);

                // Savings calculation: Only base MFN is eliminated, policy tariffs remain
                const savingsPercent = (baseMfnRate !== null && usmcaRate !== null) ? (baseMfnRate - usmcaRate) : null;
                const hasCompleteRates = baseMfnRate !== null && usmcaRate !== null;

                // DEBUG: Log what we're receiving from the API - especially missing fields
                if (index === 0) {
                  console.log(`🔍 [FRONTEND] First component from API (defensive parsing):`, {
                    description: component.description,
                    origin: component.origin_country,
                    rawMfnRate: component.mfn_rate,
                    rawBaseMfnRate: component.base_mfn_rate,  // ← Should match mfn_rate for China (0.35)
                    rawUsmcaRate: component.usmca_rate,
                    rawSection301: component.section_301,
                    rawSection232: component.section_232,
                    rawTotalRate: component.total_rate,  // ← Should be 0.95 for China (0.35 + 0.60)
                    parsedBaseMfnRate: baseMfnRate,
                    parsedUsmcaRate: usmcaRate,
                    parsedSection301: section301,
                    parsedTotalRate: totalAppliedRate,
                    displayMfnRate: baseMfnRate !== null ? `${(baseMfnRate * 100).toFixed(1)}%` : 'N/A',
                    displayTotalRate: totalAppliedRate !== null ? `${(totalAppliedRate * 100).toFixed(1)}%` : 'N/A',
                    hasCompleteRates,
                    missingFields: {
                      mfn_rate: component.mfn_rate === undefined || component.mfn_rate === null,
                      base_mfn_rate: component.base_mfn_rate === undefined || component.base_mfn_rate === null,
                      usmca_rate: component.usmca_rate === undefined || component.usmca_rate === null,
                      section_301: component.section_301 === undefined || component.section_301 === null,
                      total_rate: component.total_rate === undefined || component.total_rate === null
                    },
                    allKeys: Object.keys(component)
                  });
                }

                const isExpanded = expandedComponents[index];
                const hasDetails = component.ai_reasoning || component.alternative_codes || component.ai_confidence || component.hs_description;

                return (
                  <React.Fragment key={index}>
                    <tr style={{ borderBottom: '1px solid #e5e7eb', cursor: hasDetails ? 'pointer' : 'default' }}>
                      {/* Column 1: Component */}
                      <td style={{ padding: '0.75rem', color: '#1f2937', wordWrap: 'break-word', overflow: 'visible', whiteSpace: 'normal' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          {hasDetails && (
                            <button
                              onClick={() => toggleComponentDetails(index)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                padding: '0',
                                lineHeight: '1',
                                flexShrink: 0,
                                marginTop: '0.125rem'
                              }}
                              title={isExpanded ? 'Hide details' : 'Show AI analysis details'}
                            >
                              {isExpanded ? '▼' : '▶'}
                            </button>
                          )}
                          <span style={{ wordWrap: 'break-word', whiteSpace: 'normal', overflow: 'visible' }}>{component.description || ('Component ' + (index + 1))}</span>
                        </div>
                      </td>

                      {/* Column 2: Origin */}
                      <td style={{ padding: '0.75rem', color: '#1f2937', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        {component.origin_country || '—'}
                      </td>

                      {/* Column 3: Value % */}
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500', color: '#1f2937', whiteSpace: 'nowrap' }}>
                        {component.value_percentage}%
                      </td>

                      {/* Column 4: MFN Rate */}
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: baseMfnRate !== null ? '#1f2937' : '#9ca3af' }}>
                        {baseMfnRate !== null ? (
                          <span style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>
                            {(baseMfnRate * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>N/A</span>
                        )}
                      </td>

                      {/* Column 5: USMCA Rate */}
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: usmcaRate !== null ? '#059669' : '#9ca3af', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        {usmcaRate !== null ? `${(usmcaRate * 100).toFixed(1)}%` : 'N/A'}
                      </td>

                      {/* Column 6: Additional Tariffs (Section 301 + Section 232) */}
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        {section301 > 0 || section232 > 0 ? (
                          <span style={{ fontWeight: '600', color: '#991b1b' }}>
                            {((section301 + section232) * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span style={{ color: '#059669' }}>0.0%</span>
                        )}
                      </td>

                      {/* Column 7: Total Rate (MFN + Additional) */}
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#1f2937', whiteSpace: 'nowrap' }}>
                        {totalAppliedRate !== null ? (
                          <span>{(totalAppliedRate * 100).toFixed(1)}%</span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>N/A</span>
                        )}
                      </td>

                      {/* Column 8: Annual Savings (in dollars from API) */}
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: component.annual_savings > 0 ? '#059669' : '#6b7280' }}>
                        <span style={{ whiteSpace: 'nowrap' }}>
                          {component.annual_savings !== undefined && component.annual_savings !== null ? `$${component.annual_savings.toLocaleString()}` : '—'}
                        </span>
                      </td>
                    </tr>

                    {/* Expandable Details Row */}
                    {isExpanded && hasDetails && (
                      <tr>
                        <td colSpan="8" style={{ padding: '1rem', backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                          <div style={{ fontSize: '0.875rem' }}>
                            {/* AI Confidence */}
                            {component.confidence && (
                              <div style={{ marginBottom: '0.75rem' }}>
                                <strong style={{ color: '#374151' }}>
                                  <Tooltip text="90-100%: High confidence - AI found exact database match | 75-89%: Medium - AI validated by similar products | <75%: Low - Professional review recommended before customs filing">
                                    AI Confidence:
                                  </Tooltip>
                                </strong>{' '}
                                <span style={{
                                  color: component.confidence >= 90 ? '#059669' : component.confidence >= 75 ? '#d97706' : '#6b7280',
                                  fontWeight: '500'
                                }}>
                                  {component.confidence}% {component.confidence >= 90 ? '(High)' : component.confidence >= 75 ? '(Medium)' : '(Low)'}
                                </span>
                                {component.confidence < 75 && (
                                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#d97706', fontStyle: 'italic' }}>
                                    ⚠️ Consider professional validation before customs filing
                                  </div>
                                )}
                              </div>
                            )}

                            {/* HS Code Description */}
                            {component.hs_description && (
                              <div style={{ marginBottom: '0.75rem' }}>
                                <strong style={{ color: '#374151' }}>HS Code Description:</strong>
                                <div style={{
                                  marginTop: '0.25rem',
                                  padding: '0.75rem',
                                  backgroundColor: '#ffffff',
                                  borderRadius: '4px',
                                  borderLeft: '3px solid #10b981',
                                  color: '#4b5563'
                                }}>
                                  {component.hs_description}
                                </div>
                              </div>
                            )}

                            {/* Tariff Rate Information */}
                            {(component.mfn_rate || component.usmca_rate !== undefined) && (
                              <div style={{ marginBottom: '0.75rem' }}>
                                <strong style={{ color: '#374151' }}>Tariff Rate Details:</strong>
                                <div style={{
                                  marginTop: '0.5rem',
                                  padding: '0.75rem',
                                  backgroundColor: '#ffffff',
                                  borderRadius: '4px',
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(3, 1fr)',
                                  gap: '1rem'
                                }}>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>MFN Rate</div>
                                    <div style={{ fontWeight: '600', color: '#dc2626' }}>{((component.mfn_rate || 0) * 100).toFixed(1)}%</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>USMCA Rate</div>
                                    <div style={{ fontWeight: '600', color: '#059669' }}>{((component.usmca_rate || 0) * 100).toFixed(1)}%</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Savings</div>
                                    <div style={{ fontWeight: '600', color: '#059669' }}>{(((component.mfn_rate || 0) - (component.usmca_rate || 0)) * 100).toFixed(1)}%</div>
                                  </div>
                                </div>

                                {/* EDUCATIONAL: Policy Breakdown Explanation */}
                                {component.policy_adjustments && component.policy_adjustments.length > 0 && (
                                  <div style={{
                                    marginTop: '0.75rem',
                                    padding: '0.75rem',
                                    backgroundColor: '#fffbeb',
                                    borderRadius: '4px',
                                    borderLeft: '3px solid #f59e0b'
                                  }}>
                                    <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                                      📊 How We Calculate {((component.mfn_rate || 0) * 100).toFixed(1)}% Total Rate:
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', color: '#78350f', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      {component.policy_adjustments.map((adj, idx) => {
                                        // ✅ SAFETY: Ensure adj is always a string (AI/DB might return objects)
                                        const safeAdj = typeof adj === 'string' ? adj : JSON.stringify(adj);
                                        return (
                                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ color: '#f59e0b' }}>•</span>
                                            <span>{safeAdj}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#92400e', fontStyle: 'italic' }}>
                                      {component.rate_source === 'database_fallback' || component.stale
                                        ? '⚠️ Data from January 2025 - may not reflect current policy changes'
                                        : '✅ Current October 2025 policy (updated via AI research)'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* STRATEGIC: Supply Chain Alternatives for Policy-Exposed Components */}
                            {section301 > 0 && (
                              <div style={{
                                marginTop: '0.75rem',
                                padding: '0.75rem',
                                backgroundColor: '#fef3c7',
                                borderRadius: '4px',
                                borderLeft: '3px solid #d97706'
                              }}>
                                <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                                  💡 Strategic Opportunity: Eliminate Section 301 Exposure
                                </div>
                                <div style={{ fontSize: '0.8125rem', color: '#78350f', lineHeight: '1.5', marginBottom: '0.5rem' }}>
                                  <strong>Current situation:</strong> Your {component.description || 'component'} from {component.origin_country} is subject to {(section301 * 100).toFixed(1)}% Section 301 tariffs, costing you approximately <strong>${(component.value_percentage / 100 * (results.company?.trade_volume || 0) * (section301) / 12).toFixed(0)}/month</strong>.
                                </div>
                                <div style={{ fontSize: '0.8125rem', color: '#78350f', lineHeight: '1.5' }}>
                                  <strong>Strategic alternative:</strong> Switch to a Mexico-based supplier for this component would:
                                  <ul style={{ marginTop: '0.25rem', marginBottom: '0.25rem', marginLeft: '1.5rem' }}>
                                    <li>Eliminate Section 301 exposure entirely</li>
                                    <li>Increase regional value content (RVC) by ~{component.value_percentage}%</li>
                                    <li>See AI analysis above for industry-specific cost premiums, timelines, and payback calculations</li>
                                  </ul>
                                </div>
                                <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '3px', fontSize: '0.75rem', color: '#5f4800', fontStyle: 'italic' }}>
                                  ⚠️ Cost premiums, timelines, and payback periods vary by industry and product complexity. Refer to the AI-generated strategic alternatives section above for calculations specific to your business.
                                </div>
                              </div>
                            )}

                            {/* AI Reasoning */}
                            {component.ai_reasoning && (
                              <div style={{ marginBottom: '0.75rem' }}>
                                <strong style={{ color: '#374151' }}>AI Classification Reasoning:</strong>
                                <div style={{
                                  marginTop: '0.25rem',
                                  padding: '0.75rem',
                                  backgroundColor: '#ffffff',
                                  borderRadius: '4px',
                                  borderLeft: '3px solid #3b82f6',
                                  color: '#4b5563',
                                  fontStyle: 'italic'
                                }}>
                                  {component.ai_reasoning}
                                </div>
                              </div>
                            )}

                            {/* Alternative HS Codes */}
                            {component.alternative_codes && component.alternative_codes.length > 0 && (
                              <div>
                                <strong style={{ color: '#374151' }}>Alternative HS Codes:</strong>
                                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {component.alternative_codes.map((alt, altIndex) => (
                                    <div
                                      key={altIndex}
                                      style={{
                                        padding: '0.5rem',
                                        backgroundColor: '#ffffff',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                      }}
                                    >
                                      <span style={{ fontFamily: 'monospace', fontWeight: '500', color: '#1f2937' }}>
                                        {alt.code || alt.hs_code}
                                      </span>
                                      <span style={{ color: '#6b7280', fontSize: '0.8125rem' }}>
                                        {alt.confidence || alt.accuracy}% confidence
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Gap Analysis for NOT QUALIFIED products */}
      {!qualified && gapAnalysis && (
        <div className="alert alert-warning" style={{ marginTop: '2rem' }}>
          <div className="alert-content">
            <div className="alert-title">Path to Qualification</div>
            <p className="text-body" style={{ marginBottom: '1rem' }}>
              You need <strong>{gapAnalysis.gap.toFixed(1)}%</strong> more North American content to qualify for USMCA benefits.
            </p>

            <div className="text-body" style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '4px', marginBottom: '1rem' }}>
              <strong>Quick Win:</strong> Replace {gapAnalysis.targetComponent.description} from {gapAnalysis.targetComponent.origin_country} ({gapAnalysis.targetComponent.value_percentage}%) with a Mexico-based supplier
            </div>

            <div className="status-grid">
              <div className="status-card">
                <div className="status-label">Potential Savings</div>
                <div className="status-value">
                  {gapAnalysis.potentialSavings > 0
                    ? `$${gapAnalysis.potentialSavings.toLocaleString()}`
                    : 'Contact us for detailed analysis'}
                </div>
              </div>
              <div className="status-card">
                <div className="status-label">Estimated Timeline</div>
                <div className="status-value">{gapAnalysis.estimatedTimeline}</div>
              </div>
            </div>

            {/* CTA to Professional Services */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link href="/services/logistics-support" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                🇲🇽 Get Expert Help to Qualify
              </Link>
              <p className="text-body" style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                Our Mexico trade experts will help you find qualified suppliers and restructure your supply chain
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
