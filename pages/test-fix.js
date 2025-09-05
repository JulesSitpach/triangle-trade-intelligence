/**
 * Simple test page to verify the AI classification fix works
 * No complex imports or dependencies
 */

import React, { useState } from 'react';

export default function TestFix() {
  const [productDescription, setProductDescription] = useState('');
  const [businessType, setBusinessType] = useState('textile');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const testClassification = async () => {
    setIsLoading(true);
    setResults(null);
    
    try {
      const response = await fetch('/api/dynamic-hs-codes-simple-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessType: businessType,
          productDescription: productDescription
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        const errorData = await response.json();
        setResults({ error: errorData.error });
      }
    } catch (error) {
      setResults({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="test-container">
      <h1>🧪 Test AI Classification Fix</h1>
      
      <div className="test-section">
        <h2>Test the Simplified AI-First Approach</h2>
        <p>This tests whether the fix for the AI-Database disconnect works.</p>
      </div>

      <div className="test-input-row">
        <label>
          <strong>Business Type:</strong>
          <select 
            value={businessType} 
            onChange={(e) => setBusinessType(e.target.value)}
            className="test-select"
          >
            <option value="textile">Textile</option>
            <option value="automotive">Automotive</option>
            <option value="electronics">Electronics</option>
          </select>
        </label>
      </div>

      <div className="test-input-row">
        <label>
          <strong>Product Description:</strong><br/>
          <input
            type="text"
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            placeholder="Try: women's leather handbags"
            className="test-input-full"
          />
        </label>
      </div>

      <button 
        onClick={testClassification}
        disabled={!productDescription || isLoading}
        className="test-button"
      >
        {isLoading ? 'Testing...' : 'Test Classification'}
      </button>

      {/* Results */}
      {results && (
        <div className="test-results">
          <h3>Results:</h3>
          
          {results.error ? (
            <div className="test-error">
              <strong>Error:</strong> {results.error}
            </div>
          ) : (
            <div>
              <div className="test-info-section">
                <strong>Success:</strong> {results.success ? 'Yes' : 'No'}<br/>
                <strong>Total Matches:</strong> {results.data?.total_matches || 0}<br/>
                <strong>Confidence:</strong> {results.data?.classification_confidence}<br/>
              </div>

              {results.data?.matching_hs_codes?.length > 0 && (
                <div>
                  <h4>HS Codes Found:</h4>
                  {results.data.matching_hs_codes.map((item, index) => (
                    <div key={index} className="test-hs-result">
                      <strong>{item.hs_code}</strong>: {item.description}<br/>
                      <small>
                        Confidence: {item.confidence}% | 
                        Chapter: {item.chapter} | 
                        USMCA: {item.usmca_eligible ? 'Yes' : 'No'}
                      </small>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="test-workflow-info">
                <strong>Workflow:</strong><br/>
                {results.data?.workflow_path && Object.entries(results.data.workflow_path).map(([step, desc]) => (
                  <div key={step}>• {desc}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="test-expected-results">
        <h4>Expected Results for &quot;women&apos;s leather handbags&quot;:</h4>
        <ul>
          <li>✅ Should show Chapter 42 codes (420221, 420222, 420231)</li>
          <li>✅ Should have high confidence scores (75-95%)</li>
          <li>❌ Should NOT show textile codes (560890) or photography codes (3701*)</li>
        </ul>
      </div>
    </div>
  );
}