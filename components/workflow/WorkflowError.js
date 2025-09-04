/**
 * WorkflowError - Error display component for workflow failures
 * Professional error handling with recovery options
 */

import React from 'react';

export default function WorkflowError({ error, onDismiss, onRetry }) {
  if (!error) return null;

  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2">
        ⚠️ Processing Error
      </h3>
      <p className="text-red-700 mb-4">{error}</p>
      <div className="flex gap-3">
        <button 
          onClick={onDismiss} 
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Dismiss
        </button>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
      <div className="mt-4 p-3 bg-red-100 rounded">
        <p className="text-sm text-red-800">
          <strong>Professional Support Available:</strong> If this error persists, 
          consider consulting with a licensed customs broker for manual classification.
        </p>
      </div>
    </div>
  );
}