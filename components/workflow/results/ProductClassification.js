/**
 * ProductClassification - Product classification results display
 * Shows HS code and classification confidence
 */

import React from 'react';

export default function ProductClassification({ results }) {
  if (!results?.product) return null;

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