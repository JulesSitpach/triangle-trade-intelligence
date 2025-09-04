/**
 * RecommendedActions - Next steps and recommendations display
 * Shows professional recommendations based on results
 */

import React from 'react';

export default function RecommendedActions({ results }) {
  const showRecommendations = results?.usmca?.qualified && 
                             results?.savings && 
                             (results.savings?.annual_savings || 0) > 0;

  if (!showRecommendations) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-6 text-left">
      <h4 className="text-lg font-bold text-gray-800 mb-4">Recommended Next Steps:</h4>
      <ul className="space-y-2">
        <li className="flex items-start gap-2">
          <span className="text-green-600 font-bold">✓</span>
          <span className="text-gray-700">Download and complete the certificate template</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-600 font-bold">✓</span>
          <span className="text-gray-700">Gather required documentation</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-600 font-bold">✓</span>
          <span className="text-gray-700">Consult with customs broker for implementation</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-600 font-bold">✓</span>
          <span className="text-gray-700">Set up supplier compliance procedures</span>
        </li>
        {results?.trust_assessment?.expert_validation_required && (
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">✓</span>
            <span className="text-gray-700">Consider expert validation for high-value transactions</span>
          </li>
        )}
      </ul>
    </div>
  );
}