/**
 * ProductClassification - Product classification results display
 * Shows HS code and classification confidence
 */

import React from 'react';

export default function ProductClassification({ results, onClassificationAction }) {
  if (!results?.product) return null;

  // Handle user actions from fallback options
  const handleUserOption = (action) => {
    console.log(`User selected fallback action: ${action}`);

    if (onClassificationAction) {
      onClassificationAction(action, results.product);
    } else {
      // Default behaviors
      switch (action) {
        case 'manual':
          alert('Please enter your HS code manually in the product details section');
          break;
        case 'professional':
          alert('Please contact a customs broker for professional classification assistance');
          break;
        case 'accept':
          console.log('User accepted fallback classification');
          break;
        default:
          console.log(`Unknown action: ${action}`);
      }
    }
  };

  // Handle both new AI API format and legacy format
  const confidence = results.product.classification_confidence || results.product.confidence || 0;
  const hsCode = results.product.hs_code || results.product.classified_hs_code;
  const description = results.product.description || results.product.product_description;
  const method = results.product.classification_method || 'ai_enhanced';
  
  // Get confidence level styling
  const getConfidenceColor = (conf) => {
    if (conf >= 90) return 'status-success';
    if (conf >= 75) return 'status-warning';
    return 'status-info';
  };

  return (
    <div className="element-spacing">
      <h3 className="card-title">Product Classification Results</h3>
      <div className="card">
        <div className="classification-grid">
          <div className="classification-item">
            <span className="classification-label">HS Code:</span>
            <span className="classification-value hs-code-display">
              {hsCode}
            </span>
          </div>
          <div className="classification-item">
            <span className="classification-label">Product:</span>
            <span className="classification-value">
              {description}
            </span>
          </div>
          <div className="classification-item">
            <span className="classification-label">AI Confidence:</span>
            <span className={`classification-value ${getConfidenceColor(confidence)}`}>
              {confidence.toFixed(1)}%
            </span>
          </div>
          <div className="classification-item">
            <span className="classification-label">Method:</span>
            <span className="classification-value">
              {method === 'ai_enhanced' ? 'AI-Enhanced Classification' : 
               method === 'manual' ? 'Manual Entry' : 
               method || 'Standard Classification'}
            </span>
          </div>
        </div>

        {/* Comtrade Market Insights */}
        {results.product.comtrade_insights && (
          <div className="classification-insights element-spacing">
            <h4 className="section-subtitle">📊 Market Intelligence</h4>
            <div className="classification-grid">
              {results.product.comtrade_insights.trade_volume_usd && (
                <div className="classification-item">
                  <span className="classification-label">Global Trade Volume:</span>
                  <span className="classification-value">
                    ${(results.product.comtrade_insights.trade_volume_usd / 1000000000).toFixed(1)}B USD
                  </span>
                </div>
              )}
              {results.product.comtrade_insights.growth_trend && (
                <div className="classification-item">
                  <span className="classification-label">Growth Trend:</span>
                  <span className={`classification-value ${results.product.comtrade_insights.growth_trend > 0 ? 'status-success' : 'status-warning'}`}>
                    {results.product.comtrade_insights.growth_trend > 0 ? '+' : ''}{results.product.comtrade_insights.growth_trend}%
                  </span>
                </div>
              )}
              {results.product.comtrade_insights.primary_exporters && (
                <div className="classification-item">
                  <span className="classification-label">Primary Exporters:</span>
                  <span className="classification-value">
                    {Array.isArray(results.product.comtrade_insights.primary_exporters)
                      ? results.product.comtrade_insights.primary_exporters.slice(0, 3).join(', ')
                      : results.product.comtrade_insights.primary_exporters}
                  </span>
                </div>
              )}
              {results.product.comtrade_insights.market_share && (
                <div className="classification-item">
                  <span className="classification-label">Market Share:</span>
                  <span className="classification-value">
                    {results.product.comtrade_insights.market_share}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Fallback Information */}
        {results.product.fallback_info && (
          <div className="classification-fallback element-spacing">
            <div className="alert alert-info">
              <div className="alert-content">
                <h4 className="alert-title">Classification Notice</h4>
                <p className="text-body">{results.product.fallback_info.user_message}</p>

                {results.product.fallback_info.requires_user_decision && (
                  <div className="hero-button-group element-spacing">
                    {results.product.fallback_info.user_options?.map((option, index) => (
                      <button
                        key={index}
                        className={option.recommended ? 'btn-primary' : 'btn-secondary'}
                        onClick={() => handleUserOption(option.action)}
                      >
                        {option.label}
                        {option.confidence && (
                          <span className="confidence-indicator">
                            ({option.confidence} confidence)
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="text-muted">
                  Fallback method: {results.product.fallback_info.method}
                  {results.product.fallback_info.confidence && (
                    <> • Confidence: {results.product.fallback_info.confidence}</>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tariff Information if available */}
        {results.product.tariff_rates && (
          <div className="classification-tariffs">
            <h4 className="form-label">Tariff Rates</h4>
            <div className="tariff-comparison">
              <div className="tariff-item">
                <span className="tariff-label">MFN Rate:</span>
                <span className="tariff-value">
                  {results.product.tariff_rates.mfn_rate || '0'}%
                </span>
              </div>
              <div className="tariff-item">
                <span className="tariff-label">USMCA Rate:</span>
                <span className="tariff-value status-success">
                  {results.product.tariff_rates.usmca_rate || '0'}%
                </span>
              </div>
              {results.product.tariff_rates.savings_percent && (
                <div className="tariff-item">
                  <span className="tariff-label">Potential Savings:</span>
                  <span className="tariff-value status-success">
                    {results.product.tariff_rates.savings_percent}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Analysis Details */}
        {confidence >= 85 && (
          <div className="alert alert-success">
            <div className="alert-content">
              <strong>High Confidence Classification:</strong> Our AI system is highly confident in this classification based on the product description and business context.
            </div>
          </div>
        )}
        
        {confidence < 75 && (
          <div className="alert alert-warning">
            <div className="alert-content">
              <strong>Manual Review Recommended:</strong> Consider verifying this classification with a trade expert or customs broker.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}