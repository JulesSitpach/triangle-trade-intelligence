import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import TriangleLayout from '../components/TriangleLayout';

export default function ViewResults() {
  const router = useRouter();
  const { workflow_id } = router.query;
  const [loading, setLoading] = useState(true);
  const [workflowData, setWorkflowData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (workflow_id) {
      fetchWorkflowResults();
    }
  }, [workflow_id]);

  const fetchWorkflowResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflow-session?workflow_id=${workflow_id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch workflow results');
      }

      const data = await response.json();
      setWorkflowData(data);
    } catch (err) {
      console.error('Error fetching workflow:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TriangleLayout>
        <div className="container">
          <div className="loading-spinner">Loading results...</div>
        </div>
      </TriangleLayout>
    );
  }

  if (error || !workflowData) {
    return (
      <TriangleLayout>
        <div className="container">
          <div className="error-message">
            <h2>Unable to Load Results</h2>
            <p>{error || 'Workflow not found'}</p>
            <button onClick={() => router.push('/dashboard')} className="btn-primary">
              Return to Dashboard
            </button>
          </div>
        </div>
      </TriangleLayout>
    );
  }

  const { workflow_data } = workflowData;
  const { product, usmca, savings, component_origins } = workflow_data || {};

  return (
    <>
      <Head>
        <title>USMCA Analysis Results - Triangle Intelligence</title>
      </Head>

      <TriangleLayout>
        <div className="container">
          {/* Header */}
          <div className="page-header">
            <h1>USMCA Analysis Results</h1>
            <p className="subtitle">Read-only view of your completed analysis</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary"
              style={{ marginTop: '1rem' }}
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Qualification Status Banner */}
          <div className={`status-banner ${usmca?.qualified ? 'qualified' : 'not-qualified'}`}>
            <h2>
              {usmca?.qualified ? '✓ USMCA Qualified' : '✗ Not Qualified'}
              {product?.hs_code && <span>HS {product.hs_code}</span>}
            </h2>

            {usmca?.qualified && (
              <>
                <div className="disclaimer">
                  <h3>🚨 AI-Generated Classifications</h3>
                  <p>
                    These HS code classifications and tariff calculations are AI-generated and should be reviewed
                    by a licensed customs broker before filing. Users are responsible for verifying accuracy of
                    all data submitted to customs authorities.
                  </p>
                </div>
                <p className="qualification-message">
                  Your product meets all requirements for preferential tariff treatment
                </p>
              </>
            )}
          </div>

          {/* Financial Summary */}
          {usmca?.qualified && savings && (
            <div className="financial-summary">
              <h3>💰 Current Annual Savings</h3>
              <div className="savings-display">
                <div className="amount">${savings.annual_savings?.toLocaleString() || 0}</div>
                <div className="monthly">${savings.monthly_savings?.toLocaleString() || 0}/mo</div>
                <div className="rate-comparison">
                  USMCA {((savings.usmca_rate || 0) * 100).toFixed(1)}% vs {((savings.mfn_rate || 0) * 100).toFixed(1)}% MFN
                </div>
              </div>

              <div className="rvc-display">
                <div className="rvc-item">
                  <div className="label">Required</div>
                  <div className="value">{((usmca.threshold_applied || 0) * 100).toFixed(0)}%</div>
                </div>
                <div className="rvc-item">
                  <div className="label">Your Content</div>
                  <div className="value">{((usmca.regional_content || 0) * 100).toFixed(0)}%</div>
                </div>
                <div className="rvc-item">
                  <div className="label">Margin</div>
                  <div className="value success">
                    +{(((usmca.regional_content || 0) - (usmca.threshold_applied || 0)) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <p className="qualification-explanation">
                Your qualification means: You meet USMCA requirements and can pay preferential tariff rates
                instead of standard tariffs.
              </p>
            </div>
          )}

          {/* RVC Breakdown */}
          {usmca?.qualified && (
            <div className="rvc-breakdown">
              <h3>Your Regional Value Content: {((usmca.regional_content || 0) * 100).toFixed(1)}%</h3>
              <p>
                Your product qualifies with {((usmca.regional_content || 0) * 100).toFixed(1)}% total North American content:
              </p>
              <ul>
                <li>• USMCA Components: {((usmca.north_american_content || 0) * 100).toFixed(1)}% (Mexico + Canada + US parts)</li>
                {usmca.labor_credit && (
                  <li>• Manufacturing Labor Credit: +{((usmca.labor_credit || 0) * 100).toFixed(1)}% (US manufacturing)</li>
                )}
              </ul>
              <p>
                You need at least {((usmca.threshold_applied || 0) * 100).toFixed(0)}%, so you have a
                +{(((usmca.regional_content || 0) - (usmca.threshold_applied || 0)) * 100).toFixed(1)}% safety buffer.
              </p>
            </div>
          )}

          {/* Savings Detail */}
          {usmca?.qualified && savings && (
            <div className="savings-detail">
              <h3>💰 Potential Savings: ${savings.annual_savings?.toLocaleString() || 0}/year</h3>
              <p>
                That's ${savings.monthly_savings?.toLocaleString() || 0} per month by using USMCA rates
                instead of standard tariffs ({((savings.savings_percentage || 0) * 100).toFixed(1)}% savings).
              </p>
            </div>
          )}

          {/* Product Classification */}
          {product && (
            <div className="product-classification">
              <h3>📋 Product: {product.hs_code} - {product.hs_description || product.description}</h3>
            </div>
          )}

          {/* Component Origins Table */}
          {component_origins && component_origins.length > 0 && (
            <div className="component-table">
              <h3>Component Origins & Tariff Intelligence</h3>
              <table>
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Origin</th>
                    <th>Value %</th>
                    <th>MFN Rate</th>
                    <th>USMCA Rate</th>
                    <th>Additional Tariffs</th>
                    <th>Total Rate</th>
                    <th>Savings/Potential</th>
                  </tr>
                </thead>
                <tbody>
                  {component_origins.map((component, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="component-details">
                          <div className="component-name">{component.description || component.component_description}</div>
                          {component.hs_code && (
                            <div className="component-meta">
                              <span className="confidence">
                                AI Confidence: {component.confidence || component.classification_confidence || 0}%
                                ({(component.confidence || 0) >= 75 ? 'High' : (component.confidence || 0) >= 50 ? 'Medium' : 'Low'})
                              </span>
                              {(component.confidence || 0) < 75 && (
                                <span className="warning">⚠️ Consider professional validation before customs filing</span>
                              )}
                              <div>HS Code: {component.hs_code} (AI-classified)</div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{component.origin_country || component.country}</td>
                      <td>{component.value_percentage || component.percentage}%</td>
                      <td>{((component.mfn_rate || 0) * 100).toFixed(1)}%</td>
                      <td>{((component.usmca_rate || 0) * 100).toFixed(1)}%</td>
                      <td>{(((component.section_301 || 0) + (component.section_232 || 0)) * 100).toFixed(1)}%</td>
                      <td>{((component.total_rate || 0) * 100).toFixed(1)}%</td>
                      <td>
                        {component.savings_amount ? (
                          <div className="savings-cell">
                            ✓ ${component.savings_amount.toLocaleString()}
                            <span className="savings-label">Current</span>
                          </div>
                        ) : (
                          <div className="duty-free">$0<br/>Duty-Free</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => router.push(`/usmca-certificate-completion?workflow_id=${workflow_id}`)}
              className="btn-primary"
            >
              📄 Preview Certificate
            </button>
            <button
              onClick={() => router.push(`/trade-risk-alternatives?workflow_id=${workflow_id}`)}
              className="btn-primary"
            >
              ⚠️ View Alerts
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary"
            >
              Return to Dashboard
            </button>
          </div>
        </div>

        <style jsx>{`
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
          }

          .page-header {
            margin-bottom: 2rem;
          }

          .page-header h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
          }

          .subtitle {
            color: #666;
            font-size: 1.1rem;
          }

          .status-banner {
            padding: 2rem;
            border-radius: 8px;
            margin-bottom: 2rem;
          }

          .status-banner.qualified {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: white;
          }

          .status-banner.not-qualified {
            background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
            color: white;
          }

          .status-banner h2 {
            margin: 0 0 1rem 0;
            font-size: 1.5rem;
          }

          .disclaimer {
            background: rgba(255, 255, 255, 0.15);
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
          }

          .disclaimer h3 {
            margin: 0 0 0.5rem 0;
            font-size: 1.1rem;
          }

          .disclaimer p {
            margin: 0;
            font-size: 0.95rem;
          }

          .financial-summary,
          .rvc-breakdown,
          .savings-detail,
          .product-classification {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
          }

          .financial-summary h3,
          .rvc-breakdown h3,
          .savings-detail h3,
          .product-classification h3 {
            margin: 0 0 1rem 0;
            font-size: 1.3rem;
          }

          .savings-display {
            display: flex;
            gap: 2rem;
            align-items: center;
            margin-bottom: 1rem;
          }

          .amount {
            font-size: 2.5rem;
            font-weight: bold;
            color: #059669;
          }

          .monthly {
            font-size: 1.5rem;
            color: #666;
          }

          .rvc-display {
            display: flex;
            gap: 2rem;
            margin: 1rem 0;
          }

          .rvc-item {
            flex: 1;
            text-align: center;
          }

          .rvc-item .label {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 0.5rem;
          }

          .rvc-item .value {
            font-size: 1.8rem;
            font-weight: bold;
          }

          .rvc-item .value.success {
            color: #059669;
          }

          .component-table {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            overflow-x: auto;
          }

          .component-table h3 {
            margin: 0 0 1rem 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th {
            background: #f9fafb;
            padding: 0.75rem;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #e5e7eb;
          }

          td {
            padding: 1rem 0.75rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .component-details {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .component-name {
            font-weight: 500;
          }

          .component-meta {
            font-size: 0.85rem;
            color: #666;
          }

          .component-meta .warning {
            color: #dc2626;
            display: block;
            margin-top: 0.25rem;
          }

          .savings-cell {
            color: #059669;
            font-weight: 600;
          }

          .savings-label {
            display: block;
            font-size: 0.8rem;
            font-weight: normal;
          }

          .duty-free {
            color: #666;
          }

          .action-buttons {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
          }

          .loading-spinner,
          .error-message {
            text-align: center;
            padding: 3rem;
          }

          .error-message h2 {
            color: #dc2626;
            margin-bottom: 1rem;
          }
        `}</style>
      </TriangleLayout>
    </>
  );
}
