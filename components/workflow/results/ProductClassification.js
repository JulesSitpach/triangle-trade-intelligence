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
  // Ensure confidence is always a valid number (AI might return string "85" instead of 85)
  let confidence = Number(results.product.classification_confidence || results.product.confidence || 0);

  // ✅ FIX: AI might return decimal (0.95) instead of percentage (95)
  // Convert 0-1 scale to 0-100 percentage
  if (confidence > 0 && confidence <= 1) {
    confidence = confidence * 100;
  }

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
    <div className="card-content">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>HS Code</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>{hsCode}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>AI Confidence</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
            {confidence >= 90 ? 'High' : confidence >= 75 ? 'Medium' : 'Low'} ({confidence.toFixed(0)}%)
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.9375rem', color: '#374151' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: '500' }}>Product:</span> {description}
        </div>
        <div>
          <span style={{ fontWeight: '500' }}>Company:</span> {results.company?.name || results.company?.company_name || 'N/A'}
        </div>
      </div>

      {/* Warnings for low confidence */}
      {confidence < 75 && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fef3c7', borderLeft: '3px solid #f59e0b', borderRadius: '4px', fontSize: '0.875rem' }}>
          <strong>⚠️ Review Recommended:</strong> Consider verifying this classification with a customs broker.
        </div>
      )}
    </div>
  );
}