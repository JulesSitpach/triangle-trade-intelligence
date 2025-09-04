/**
 * ProductClassification - Product classification results display
 * Shows HS code and classification confidence
 */

import React from 'react';

export default function ProductClassification({ results }) {
  if (!results?.product) return null;

  // Confidence is already stored as percentage (95), not decimal (0.95)
  const confidence = results.product.classification_confidence || results.product.confidence || 0;

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Product Classification</h3>
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">HS Code:</span>
            <span className="font-bold text-xl text-blue-900 bg-white px-3 py-1 rounded">
              {results.product.hs_code}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="font-medium text-gray-600">Product:</span>
            <span className="font-semibold text-gray-900 text-right max-w-md">
              {results.product.description}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Classification Confidence:</span>
            <span className="font-semibold text-green-700">
              {confidence.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}