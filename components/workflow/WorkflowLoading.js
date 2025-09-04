/**
 * WorkflowLoading - Loading overlay for workflow processing
 * Professional loading indicator with processing steps
 */

import React from 'react';

export default function WorkflowLoading({ isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-10 text-center max-w-md w-11/12">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-5"></div>
        <h3 className="text-xl font-bold text-gray-800 mb-5">Processing USMCA Compliance</h3>
        <div className="text-left space-y-2">
          <div className="text-gray-600">🔍 Classifying product...</div>
          <div className="text-gray-600">🌍 Checking USMCA qualification...</div>
          <div className="text-gray-600">💰 Calculating tariff savings...</div>
          <div className="text-gray-600">📜 Generating certificate...</div>
        </div>
      </div>
    </div>
  );
}