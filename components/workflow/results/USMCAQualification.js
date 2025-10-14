/**
 * USMCAQualification - Component Analysis
 * Shows component breakdown and regional content analysis
 * NO duplicate qualification status (shown in hero section)
 */

import React from 'react';
import Link from 'next/link';

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

    const potentialSavings = results.savings?.annual_savings || 0;

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
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>HS Code</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Origin</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Value %</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>MFN Rate</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>USMCA Rate</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Savings</th>
                <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.usmca.component_breakdown.map((component, index) => {
                const mfnRate = component.mfn_rate || component.tariff_rates?.mfn_rate || 0;
                const usmcaRate = component.usmca_rate || component.tariff_rates?.usmca_rate || 0;
                const savingsPercent = mfnRate - usmcaRate;
                const hasRates = mfnRate > 0 || usmcaRate >= 0;

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
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#1f2937', whiteSpace: 'nowrap' }}>
                        {hasRates ? `${mfnRate.toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#059669', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        {hasRates ? `${usmcaRate.toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: savingsPercent > 0 ? '#059669' : '#6b7280', whiteSpace: 'nowrap' }}>
                        {hasRates ? `${savingsPercent.toFixed(1)}%` : '—'}
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
                                <strong style={{ color: '#374151' }}>AI Confidence:</strong>{' '}
                                <span style={{
                                  color: component.confidence >= 90 ? '#059669' : component.confidence >= 75 ? '#d97706' : '#6b7280',
                                  fontWeight: '500'
                                }}>
                                  {component.confidence}% {component.confidence >= 90 ? '(High)' : component.confidence >= 75 ? '(Medium)' : '(Low)'}
                                </span>
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

          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>North American Content</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>{(results.usmca.north_american_content || 0).toFixed(1)}%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Required Threshold</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>{results.usmca.threshold_applied}%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Qualifying Components</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                {results.usmca.component_breakdown.filter(c => c.is_usmca_member).length} of {results.usmca.component_breakdown.length}
              </div>
            </div>
          </div>

          {/* Component Savings Breakdown */}
          {results.savings && results.savings.annual_savings > 0 && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#ecfdf5', border: '1px solid #059669', borderRadius: '4px' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#065f46', marginBottom: '0.75rem' }}>
                💰 Component Savings Breakdown
              </h4>
              <div style={{ fontSize: '0.875rem', color: '#047857', marginBottom: '0.75rem' }}>
                Based on annual trade volume of ${(results.company?.trade_volume || results.company?.annual_trade_volume || 0).toLocaleString()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {results.usmca.component_breakdown
                  .map((component, index) => {
                    const mfnRate = component.mfn_rate || component.tariff_rates?.mfn_rate || 0;
                    const usmcaRate = component.usmca_rate || component.tariff_rates?.usmca_rate || 0;
                    const savingsPercent = (mfnRate - usmcaRate) / 100;
                    const tradeVolume = results.company?.trade_volume || results.company?.annual_trade_volume || 0;
                    const componentValue = tradeVolume * (component.value_percentage / 100);
                    const componentSavings = componentValue * savingsPercent;

                    return {
                      ...component,
                      index,
                      componentSavings,
                      savingsPercent: mfnRate - usmcaRate
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
                          {component.value_percentage}% of product • {component.savingsPercent.toFixed(1)}% tariff savings
                        </div>
                      </div>
                      <div style={{ fontWeight: '600', color: '#065f46', fontSize: '1rem', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                        ${component.componentSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  ))
                }
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
              {results.origin_criterion || results.certificate?.preference_criterion || 'Criterion B'}
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

        {reason && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', fontSize: '0.875rem', color: '#4b5563' }}>
            {reason}
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
                <div className="status-value">${gapAnalysis.potentialSavings > 0 ? gapAnalysis.potentialSavings.toLocaleString() : 'TBD'}</div>
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
