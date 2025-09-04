/**
 * USMCAQualification - USMCA qualification status display
 * Shows qualification status with detailed reasoning
 */

import React from 'react';

export default function USMCAQualification({ results }) {
  if (!results?.usmca) return null;

  const { qualified, rule, reason, documentation_required } = results.usmca;

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">USMCA Qualification Status</h3>
      <div className={`border-2 rounded-lg p-6 ${
        qualified 
          ? 'bg-green-50 border-green-300' 
          : 'bg-red-50 border-red-300'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">
            {qualified ? '✅' : '❌'}
          </span>
          <span className={`text-2xl font-bold ${
            qualified ? 'text-green-800' : 'text-red-800'
          }`}>
            {qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}
          </span>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Rule Applied:</span>
            <span className="font-semibold text-gray-900">{rule}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="font-medium text-gray-600">Reason:</span>
            <span className="font-semibold text-gray-900 text-right max-w-md">{reason}</span>
          </div>
          {documentation_required && documentation_required.length > 0 && (
            <div>
              <span className="font-medium text-gray-600 block mb-2">Documentation Required:</span>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {documentation_required.map((doc, index) => (
                  <li key={index}>{doc}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}