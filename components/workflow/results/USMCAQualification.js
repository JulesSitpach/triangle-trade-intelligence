/**
 * USMCAQualification - Component Analysis
 * Shows component breakdown and regional content analysis
 * NO duplicate qualification status (shown in hero section)
 */

import React from 'react';
import Link from 'next/link';

// EDUCATIONAL: Simple tooltip component for trade terminology
const Tooltip = ({ text, children }) => {
  const [show, setShow] = React.useState(false);

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
  const [expandedComponents, setExpandedComponents] = React.useState({});

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
              <col style={{ width: '12%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Component</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                  <Tooltip text="Harmonized System code - international standard for classifying traded products">
                    HS Code
                  </Tooltip>
                </th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Origin</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Value %</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                  <Tooltip text="Most Favored Nation rate - standard import duty without trade agreement benefits. May include Section 301, IEEPA, or other policy adjustments">
                    MFN Rate
                  </Tooltip>
                </th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                  <Tooltip text="Preferential duty rate for USMCA-qualified goods. Usually 0% (duty-free) when your product qualifies">
                    USMCA Rate
                  </Tooltip>
                </th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>
                  <Tooltip text="Tariff savings if you qualify for USMCA (MFN Rate - USMCA Rate)">
                    Savings
                  </Tooltip>
                </th>
                <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.usmca.component_breakdown.map((component, index) => {
                // ✅ ISSUE #2 FIX: Use base_mfn_rate for display, not total_rate
                // Total rate = base_mfn + section_301 + section_232
                // Savings = base_mfn - usmca_rate (only the base duty is eliminated)
                const baseMfnRate = component.base_mfn_rate || component.mfn_rate || 0;
                const section301 = component.section_301 || 0;
                const section232 = component.section_232 || 0;
                const totalAppliedRate = component.total_rate || baseMfnRate + section301 + section232;
                const usmcaRate = component.usmca_rate || component.tariff_rates?.usmca_rate || 0;

                // Savings calculation: Only base MFN is eliminated, policy tariffs remain
                const savingsPercent = baseMfnRate - usmcaRate;
                const hasRates = (baseMfnRate !== undefined && baseMfnRate !== null) || (usmcaRate !== undefined && usmcaRate !== null);

                const isExpanded = expandedComponents[index];
                const hasDetails = component.ai_reasoning || component.alternative_codes || component.confidence || component.hs_description;

                return (
                  <React.Fragment key={index}>
                    <tr style={{ borderBottom: '1px solid #e5e7eb', cursor: hasDetails ? 'pointer' : 'default' }}>
                      <td style={{ padding: '0.75rem', color: '#1f2937', wordWrap: 'break-word', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                                flexShrink: 0
                              }}
                              title={isExpanded ? 'Hide details' : 'Show AI analysis details'}
                            >
                              {isExpanded ? '▼' : '▶'}
                            </button>
                          )}
                          <span style={{ wordWrap: 'break-word', overflow: 'hidden' }}>{component.description || ('Component ' + (index + 1))}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#1f2937', fontFamily: 'monospace', fontSize: '0.8125rem', wordWrap: 'break-word' }}>
                        {component.hs_code || component.classified_hs_code || '—'}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#1f2937', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        {component.origin_country}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500', color: '#1f2937', whiteSpace: 'nowrap' }}>
                        {component.value_percentage}%
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#1f2937' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                          {/* ✅ ISSUE #2 FIX: Show complete tariff breakdown with Section 301 clearly visible */}
                          {hasRates ? (
                            <>
                              <div style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>
                                {(baseMfnRate * 100).toFixed(1)}%
                                {section301 > 0 && <span style={{ fontSize: '0.75rem', color: '#dc2626', marginLeft: '0.25rem' }}>+{(section301 * 100).toFixed(1)}%</span>}
                              </div>
                              {/* Show breakdown when Section 301 or other policies apply */}
                              {(section301 > 0 || section232 > 0) && (
                                <div style={{
                                  fontSize: '0.6875rem',
                                  color: '#6b7280',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.125rem',
                                  alignItems: 'flex-end',
                                  marginTop: '0.25rem'
                                }}>
                                  {baseMfnRate > 0 && (
                                    <span style={{
                                      whiteSpace: 'nowrap',
                                      backgroundColor: '#f0fdf4',
                                      padding: '0.125rem 0.375rem',
                                      borderRadius: '3px',
                                      color: '#166534'
                                    }}>
                                      Base: {(baseMfnRate * 100).toFixed(1)}%
                                    </span>
                                  )}
                                  {section301 > 0 && (
                                    <span style={{
                                      whiteSpace: 'nowrap',
                                      backgroundColor: '#fef2f2',
                                      padding: '0.125rem 0.375rem',
                                      borderRadius: '3px',
                                      color: '#991b1b',
                                      fontWeight: '500'
                                    }}>
                                      Section 301: {(section301 * 100).toFixed(1)}%
                                    </span>
                                  )}
                                  {section232 > 0 && (
                                    <span style={{
                                      whiteSpace: 'nowrap',
                                      backgroundColor: '#fef2f2',
                                      padding: '0.125rem 0.375rem',
                                      borderRadius: '3px',
                                      color: '#991b1b'
                                    }}>
                                      Steel/Aluminum: {(section232 * 100).toFixed(1)}%
                                    </span>
                                  )}
                                  <span style={{
                                    whiteSpace: 'nowrap',
                                    backgroundColor: '#f3f4f6',
                                    padding: '0.125rem 0.375rem',
                                    borderRadius: '3px',
                                    color: '#1f2937',
                                    fontWeight: '600',
                                    borderTop: '1px solid #d1d5db',
                                    marginTop: '0.25rem'
                                  }}>
                                    Total: {(totalAppliedRate * 100).toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <span>—</span>
                          )}

                          {/* Data freshness indicator */}
                          {component.rate_source && (
                            <span style={{
                              fontSize: '0.6875rem',
                              color: component.rate_source === 'database_fallback' || component.stale ? '#d97706' : '#059669',
                              whiteSpace: 'nowrap',
                              marginTop: '0.25rem'
                            }}>
                              {component.rate_source === 'database_fallback' || component.stale
                                ? '⚠️ Jan 2025 data'
                                : '✓ Current 2025'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#059669', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.125rem' }}>
                          <span>{hasRates ? `${(usmcaRate * 100).toFixed(1)}%` : '—'}</span>
                          {/* ✅ ISSUE #2 FIX: Clarify that Section 301 remains despite USMCA qualification */}
                          {section301 > 0 && (
                            <span style={{
                              fontSize: '0.6875rem',
                              color: '#991b1b',
                              fontWeight: '500',
                              whiteSpace: 'nowrap'
                            }}>
                              +{(section301 * 100).toFixed(1)}% Section 301
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: savingsPercent > 0 ? '#059669' : '#6b7280' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.125rem' }}>
                          <span style={{ whiteSpace: 'nowrap' }}>
                            {/* ✅ ISSUE #2 FIX: Show savings clearly - ONLY base MFN is eliminated */}
                            {hasRates ? `${(savingsPercent * 100).toFixed(1)}%` : '—'}
                          </span>
                          {section301 > 0 && (
                            <span style={{
                              fontSize: '0.6875rem',
                              color: '#dc2626',
                              fontWeight: '400',
                              whiteSpace: 'nowrap'
                            }}>
                              (base only)
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {component.is_usmca_member ? (
                          <span style={{ color: '#059669', fontWeight: '500' }}>✓ Qualifies</span>
                        ) : (
                          <span style={{ color: '#6b7280', fontWeight: '500' }}>✗ Non-USMCA</span>
                        )}
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
                                    <div style={{ fontWeight: '600', color: '#dc2626' }}>{(component.mfn_rate || 0).toFixed(1)}%</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>USMCA Rate</div>
                                    <div style={{ fontWeight: '600', color: '#059669' }}>{(component.usmca_rate || 0).toFixed(1)}%</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Savings</div>
                                    <div style={{ fontWeight: '600', color: '#059669' }}>{((component.mfn_rate || 0) - (component.usmca_rate || 0)).toFixed(1)}%</div>
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
                                      📊 How We Calculate {(component.mfn_rate || 0).toFixed(1)}% Total Rate:
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
                                  <strong>Current situation:</strong> Your {component.description || 'component'} from {component.origin_country} is subject to {(section301 * 100).toFixed(1)}% Section 301 tariffs, costing you approximately <strong>${(component.value_percentage / 100 * (results.company?.trade_volume || 0) * section301 / 12).toFixed(0)}/month</strong>.
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
                                        {alt.code || alt.hsCode}
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

          {/* RVC Breakdown - Material + Labor */}
          <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#f0f9ff', border: '2px solid #3b82f6', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e40af', marginBottom: '1rem', textAlign: 'center' }}>
              📊 Regional Value Content (RVC) Breakdown
            </h4>

            {/* Material RVC */}
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: '500', color: '#1e40af' }}>
                  <Tooltip text="Components from US, Mexico, or Canada that count toward USMCA qualification">
                    Material Components (USMCA)
                  </Tooltip>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>
                  {(() => {
                    const materialRVC = results.usmca.component_breakdown
                      .filter(c => c.is_usmca_member)
                      .reduce((sum, c) => sum + (c.value_percentage || 0), 0);
                    return materialRVC.toFixed(1);
                  })()}%
                </div>
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                {results.usmca.component_breakdown.filter(c => c.is_usmca_member).map(c => c.description).join(', ')}
              </div>
            </div>

            {/* Labor RVC (if applicable) */}
            {(() => {
              const materialRVC = results.usmca.component_breakdown
                .filter(c => c.is_usmca_member)
                .reduce((sum, c) => sum + (c.value_percentage || 0), 0);
              const totalRVC = results.usmca.north_american_content || 0;
              const laborRVC = totalRVC - materialRVC;

              if (laborRVC > 0.1) {
                return (
                  <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.9375rem', fontWeight: '500', color: '#1e40af' }}>
                        <Tooltip text="Value added through substantial transformation (welding, forming, machining, etc.) performed in USMCA countries">
                          Labor & Manufacturing Value-Added
                        </Tooltip>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>
                        {laborRVC.toFixed(1)}%
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                      Manufacturing in {results.manufacturing_location || results.usmca?.manufacturing_location || 'USMCA region'} with substantial transformation
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Total RVC */}
            <div style={{ padding: '1rem', backgroundColor: qualified ? '#ecfdf5' : '#fef2f2', borderRadius: '6px', border: qualified ? '2px solid #059669' : '2px solid #dc2626' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: qualified ? '#065f46' : '#991b1b' }}>
                  Total Regional Value Content
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: qualified ? '#059669' : '#dc2626' }}>
                  {(results.usmca.north_american_content || 0).toFixed(1)}%
                </div>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: qualified ? '#047857' : '#991b1b', fontWeight: '500' }}>
                {qualified
                  ? `✓ Exceeds ${results.usmca.threshold_applied}% threshold - QUALIFIED`
                  : `✗ Below ${results.usmca.threshold_applied}% threshold - NOT QUALIFIED`}
              </div>
            </div>

            {/* Educational Note */}
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#fffbeb', borderRadius: '4px', fontSize: '0.8125rem', color: '#92400e', borderLeft: '3px solid #f59e0b' }}>
              <strong>💡 Why can RVC exceed 100%?</strong> Under USMCA Net Cost method, material components + labor value-added can sum to more than 100%. This is normal and correct - both material costs AND manufacturing labor count toward regional content.
            </div>
          </div>

          {/* Additional Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                <Tooltip text="Number of components sourced from USMCA countries (US, Mexico, Canada)">
                  Qualifying Components
                </Tooltip>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                {results.usmca.component_breakdown.filter(c => c.is_usmca_member).length} of {results.usmca.component_breakdown.length}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                <Tooltip text="Minimum North American content required for your product category under USMCA treaty rules">
                  Required Threshold
                </Tooltip>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>{results.usmca.threshold_applied}%</div>
            </div>
          </div>

          {/* Component Savings Breakdown */}
          {results.savings && results.savings.annual_savings > 0 && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#ecfdf5', border: '1px solid #059669', borderRadius: '4px' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#065f46', marginBottom: '0.75rem' }}>
                💰 Component Savings Breakdown
              </h4>
              <div style={{ fontSize: '0.875rem', color: '#047857', marginBottom: '0.75rem' }}>
                {(() => {
                  const tv = results.company?.trade_volume;
                  if (!tv) {
                    console.error('❌ [FORM SCHEMA] Missing company.trade_volume in USMCAQualification line 623');
                    return 'Based on annual trade volume of $0 (ERROR: Missing data)';
                  }
                  return `Based on annual trade volume of $${Number(tv).toLocaleString()}`;
                })()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* ✅ ISSUE #1: Component-level breakdown (NOT a conflicting calculation)
                    This breaks down the AI's total savings to show top contributors.
                    Uses component rates FROM the AI response, not independent calculation.
                    Does NOT affect the total annual_savings shown in TariffSavings. */}
                {(() => {
                  const tv = results.company?.trade_volume;
                  if (!tv) {
                    console.error('❌ [FORM SCHEMA] Missing company.trade_volume in USMCAQualification component mapping');
                    return null;
                  }
                  return results.usmca.component_breakdown
                    .map((component, index) => {
                      const mfnRate = component.mfn_rate || component.tariff_rates?.mfn_rate || 0;
                      const usmcaRate = component.usmca_rate || component.tariff_rates?.usmca_rate || 0;
                      // ✅ Rates are DECIMAL format (0.25 = 25%), NO /100 needed for calculation
                      const savingsPercent = mfnRate - usmcaRate;  // Both already decimal
                      const tradeVolume = tv;
                      const componentValue = tradeVolume * (component.value_percentage / 100);
                      const componentSavings = componentValue * savingsPercent;

                      return {
                        ...component,
                        index,
                        componentSavings,
                        savingsPercent  // Already in decimal format for display
                      };
                  })
                  .filter(c => c.componentSavings > 0)
                  .sort((a, b) => b.componentSavings - a.componentSavings)
                  .slice(0, 5) // Top 5 contributors
                  .map((component) => (
                    <div
                      key={component.index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem',
                        backgroundColor: '#ffffff',
                        borderRadius: '4px',
                        border: '1px solid #d1fae5'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', color: '#065f46' }}>
                          {component.description || 'Component ' + (component.index + 1)}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#047857' }}>
                          {component.value_percentage}% of product • {(component.savingsPercent * 100).toFixed(1)}% tariff savings
                        </div>
                      </div>
                      <div style={{ fontWeight: '600', color: '#065f46', fontSize: '1rem', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                        ${component.componentSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    ))
                })()}
              </div>
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #d1fae5', fontSize: '0.8125rem', color: '#047857' }}>
                💡 <strong>Optimization Tip:</strong> Focus on these high-value components for maximum USMCA savings impact
              </div>
            </div>
          )}
        </div>
      )}

      {/* Qualification Details */}
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Rule Applied</div>
            <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>{rule}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Preference Criterion</div>
            <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>
              {/* ✅ REMOVED: || 'Criterion B' default (line 610)
                  REASON: Defaulting to 'B' is FALSE CERTIFICATION - violates USMCA Article 5.2
                  FIX: AI must determine criterion, never default */}
              {results.origin_criterion || results.certificate?.preference_criterion || '⚠️ Not determined'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Method of Qualification</div>
            <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>
              {results.method_of_qualification ? (
                <>
                  {results.method_of_qualification}
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                    {results.method_of_qualification === 'TV' ? '(Transaction Value)' :
                     results.method_of_qualification === 'NC' ? '(Net Cost)' :
                     results.method_of_qualification === 'TS' ? '(Tariff Shift)' :
                     results.method_of_qualification === 'NO' ? '(No Requirement)' : ''}
                  </div>
                </>
              ) : '—'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>RVC Achieved</div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: qualified ? '#059669' : '#dc2626'
            }}>
              {(results.usmca.north_american_content || 0).toFixed(1)}%
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem', fontWeight: '400' }}>
                {qualified ? `✓ Exceeds ${results.usmca.threshold_applied}%` : `✗ Below ${results.usmca.threshold_applied}%`}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Certificate Validity</div>
            <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>1 Year (Blanket Period)</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Country of Origin</div>
            <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>
              {results.manufacturing_location || results.usmca?.manufacturing_location || '—'}
            </div>
          </div>
        </div>

        {/* EXECUTIVE SUMMARY - Business Advisory */}
        {reason && (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: qualified ? '#f0fdf4' : '#fef2f2',
            border: qualified ? '2px solid #22c55e' : '2px solid #ef4444',
            borderRadius: '8px',
            lineHeight: '1.6'
          }}>
            <div style={{
              fontSize: '0.9375rem',
              color: qualified ? '#15803d' : '#991b1b',
              fontWeight: '500',
              marginBottom: '0.75rem'
            }}>
              {qualified ? '✓ Qualification Assessment' : '⚠️ Qualification Status'}
            </div>

            <div style={{
              fontSize: '0.9375rem',
              color: '#1f2937',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}>
              {reason}
            </div>

            {/* Financial Impact Callout (if available from AI response) */}
            {results.financial_impact?.annual_tariff_savings > 0 && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.6)',
                borderRadius: '4px',
                borderLeft: '3px solid #059669'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>ANNUAL TARIFF SAVINGS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#059669' }}>
                  ${(results.financial_impact.annual_tariff_savings || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {results.financial_impact.monthly_tariff_savings > 0 && (
                    <>≈ ${(results.financial_impact.monthly_tariff_savings || 0).toLocaleString()}/month</>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
