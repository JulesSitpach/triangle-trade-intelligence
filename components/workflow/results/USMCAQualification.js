/**
 * USMCAQualification - Component Analysis
 * Shows component breakdown and regional content analysis
 * NO duplicate qualification status (shown in hero section)
 */

import React from 'react';
import Link from 'next/link';

export default function USMCAQualification({ results }) {
  console.log('🚨 USMCAQualification component called with:', results);
  if (!results?.usmca) return null;

  const { qualified, rule, reason, documentation_required } = results.usmca;

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
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Component</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Origin</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Value %</th>
                <th style={{ textAlign: 'center', padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.usmca.component_breakdown.map((component, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem', color: '#1f2937' }}>{component.description || 'Component ' + (index + 1)}</td>
                  <td style={{ padding: '0.75rem', color: '#1f2937', fontWeight: '500' }}>{component.origin_country}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500', color: '#1f2937' }}>{component.value_percentage}%</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {component.is_usmca_member ? (
                      <span style={{ color: '#059669', fontWeight: '500' }}>✓ Qualifies</span>
                    ) : (
                      <span style={{ color: '#6b7280', fontWeight: '500' }}>✗ Non-USMCA</span>
                    )}
                  </td>
                </tr>
              ))}
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
        </div>
      )}

      {/* Qualification Details */}
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Rule Applied</div>
            <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>{rule}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Preference Criterion</div>
            <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>{results.certificate?.preference_criterion || 'Criterion B'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Certificate Validity</div>
            <div style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>1 Year</div>
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
