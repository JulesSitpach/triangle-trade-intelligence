import React, { useState } from 'react';
import GuidedProductInputRefactored from './GuidedProductInputRefactored';

/**
 * Test page for the refactored GuidedProductInput component
 * Verifies that all functionality is preserved after refactoring
 */
const RefactorTestPage = () => {
  const [productValue, setProductValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [businessType] = useState('Electronics');

  const handleProductChange = (value) => {
    console.log('Product description changed:', value);
    setProductValue(value);
  };

  const handleCategoryChange = (category) => {
    console.log('Category changed:', category);
    setSelectedCategory(category);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="page-title section-spacing">
        Refactored GuidedProductInput Test
      </h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Component Test</h2>
        
        <GuidedProductInputRefactored
          value={productValue}
          onChange={handleProductChange}
          onCategoryChange={handleCategoryChange}
          businessType={businessType}
        />
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-3">Test State</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Product Value:</strong>
            <p className="mt-1 p-2 bg-white rounded border">
              {productValue || 'Empty'}
            </p>
          </div>
          <div>
            <strong>Selected Category:</strong>
            <p className="mt-1 p-2 bg-white rounded border">
              {selectedCategory || 'None'}
            </p>
          </div>
          <div>
            <strong>Business Type:</strong>
            <p className="mt-1 p-2 bg-white rounded border">
              {businessType}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-3 text-blue-900">Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Try entering a known HS code in the top section (e.g., &quot;080440&quot;)</li>
          <li>Try describing a product in detail (e.g., &quot;Men&apos;s leather dress shoes with rubber soles&quot;)</li>
          <li>Check that AI suggestions appear after typing enough text</li>
          <li>Verify that category selection works when AI suggestions are not available</li>
          <li>Test keyboard navigation (Tab, Enter, Arrow keys)</li>
          <li>Test screen reader accessibility (if available)</li>
          <li>Verify error handling by entering invalid data</li>
          <li>Check that all debouncing works properly (no excessive API calls)</li>
        </ol>
      </div>

      <div className="mt-6 bg-green-50 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-3 text-green-900">Refactoring Improvements</h3>
        <ul className="list-disc list-inside space-y-2 text-green-800">
          <li>✅ Replaced 8+ state variables with useReducer</li>
          <li>✅ Split 706-line component into focused sub-components</li>
          <li>✅ Added proper debouncing (500ms) for API calls</li>
          <li>✅ Extracted all hardcoded values to configuration</li>
          <li>✅ Implemented comprehensive error handling</li>
          <li>✅ Added proper cleanup functions and memory leak prevention</li>
          <li>✅ Enhanced accessibility with ARIA labels and keyboard navigation</li>
          <li>✅ Created service layer for API calls with retry logic</li>
        </ul>
      </div>
    </div>
  );
};

export default RefactorTestPage;