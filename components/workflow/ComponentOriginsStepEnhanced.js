/**
 * ComponentOriginsStepEnhanced - Step 2 of USMCA workflow
 * Includes component descriptions and HS code lookup
 * Real-world approach to multi-component products
 */

import React, { useState, useEffect } from 'react';
// Direct API call - no intermediate helper files

export default function ComponentOriginsStepEnhanced({
  formData,
  updateFormData,
  dropdownOptions,
  isLoadingOptions,
  onNext,
  onPrevious,
  onProcessWorkflow,
  isFormValid,
  isLoading
}) {
  const [components, setComponents] = useState(() => {
    // FORCE EMPTY DEFAULTS - ignore any existing data
    return [
      { 
        description: '', 
        origin_country: '', 
        value_percentage: '', 
        hs_code: '',
        hs_suggestions: []
      }
    ];
  });
  
  const [searchingHS, setSearchingHS] = useState({});

  // Update parent form data when components change
  useEffect(() => {
    updateFormData('component_origins', components);
  }, [components]);

  const updateComponent = async (index, field, value) => {
    const newComponents = [...components];
    newComponents[index][field] = value;
    
    // Only search for HS codes when ALL 3 fields are filled by user
    const hasAllFields = newComponents[index].description && newComponents[index].description.length > 3 && 
                        newComponents[index].origin_country && 
                        newComponents[index].value_percentage;
    
    if (hasAllFields && !newComponents[index].hs_suggestions?.length) {
      setSearchingHS({ ...searchingHS, [index]: true });
      try {
        const response = await fetch('/api/ai-classification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productDescription: newComponents[index].description,
            businessContext: { 
              companyType: formData.business_type || 'Manufacturing'
            },
            userProfile: {}
          })
        });

        const result = await response.json();
        
        if (result.results && result.results.length > 0) {
          // Convert AI classification results to expected format
          const suggestions = result.results.map(item => ({
            hsCode: item.hsCode || item.hs_code,
            description: item.description,
            confidence: item.confidence,
            confidenceText: `${item.confidence}% confidence`,
            mfnRate: item.mfnRate || item.mfn_rate || '0',
            usmcaRate: item.usmcaRate || item.usmca_rate || '0'
          }));
          
          newComponents[index].hs_suggestions = suggestions;
          
          // Auto-select best match if confidence is high
          if (suggestions.length > 0 && suggestions[0].confidence >= 75) {
            newComponents[index].hs_code = suggestions[0].hsCode;
          }
        } else {
          newComponents[index].hs_suggestions = [];
        }
      } catch (error) {
        console.error('HS code search failed:', error);
        newComponents[index].hs_suggestions = [];
      }
      setSearchingHS({ ...searchingHS, [index]: false });
    }
    
    // If user manually entered HS code, capture it for database improvement
    if (field === 'hs_code' && value.length >= 4) {
      captureUserHSCode(value, newComponents[index].description);
    }
    
    setComponents(newComponents);
  };

  // Function to capture user-contributed HS codes
  const captureUserHSCode = async (hsCode, description) => {
    if (!hsCode || !description) return;
    
    try {
      const response = await fetch('/api/user-contributed-hs-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hs_code: hsCode,
          product_description: description,
          business_type: formData.business_type || 'general',
          company_name: formData.company_name || 'Unknown',
          user_confidence: 8 // User-provided codes have high confidence
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ HS code captured:', result.message);
      }
    } catch (error) {
      console.error('Failed to capture HS code:', error);
      // Fail silently - don't disrupt user experience
    }
  };

  const addComponent = () => {
    setComponents([...components, { 
      description: '', 
      origin_country: '', 
      value_percentage: '', 
      hs_code: '',
      hs_suggestions: []
    }]);
  };

  const removeComponent = (index) => {
    if (components.length > 1) {
      setComponents(components.filter((_, i) => i !== index));
    }
  };

  const getTotalPercentage = () => {
    return components.reduce((sum, c) => sum + (parseFloat(c.value_percentage) || 0), 0);
  };

  const selectHSCode = (index, hsCode, description) => {
    const newComponents = [...components];
    newComponents[index].hs_code = hsCode;
    newComponents[index].hs_description = description;
    newComponents[index].showSuggestions = false;
    setComponents(newComponents);
  };

  const isValid = () => {
    const total = getTotalPercentage();
    const allFieldsFilled = components.every(c => 
      c.description && c.origin_country && c.value_percentage > 0 && c.hs_code
    );
    return total === 100 && allFieldsFilled;
  };

  // Educational template - shows format without specific compliance data
  const loadExample = () => {
    // Set example format - no specific compliance data
    updateFormData('product_description', '[Enter your complete product description here]');
    updateFormData('manufacturing_location', '');
    
    // Set component structure example - user must fill actual data
    setComponents([
      { 
        description: '[Describe major component #1]', 
        origin_country: '', 
        value_percentage: 0, 
        hs_code: '',
        hs_suggestions: []
      },
      { 
        description: '[Describe major component #2]', 
        origin_country: '', 
        value_percentage: 0, 
        hs_code: '',
        hs_suggestions: []
      },
      { 
        description: '[Describe major component #3]', 
        origin_country: '', 
        value_percentage: 0, 
        hs_code: '',
        hs_suggestions: []
      }
    ]);
  };

  return (
    <div className="dashboard-container">
      <div className="form-section">
        <h2 className="form-section-title">
          Step 2: Product & Component Analysis
        </h2>
        <p className="form-section-description">
          Describe your product, manufacturing location, and break it down into components with their origins and HS codes
        </p>
        
        {/* Educational template button */}
        <div className="alert alert-info">
          <div className="alert-content">
            <button
              type="button"
              onClick={loadExample}
              className="btn-secondary"
            >
              Show form structure example (educational only)
            </button>
          </div>
        </div>
      </div>

      {/* Product Overview Section */}
      <div className="form-section">
        <h3 className="form-section-title">Product Overview</h3>
        
        <div className="form-grid-2">
          {/* Main Product Description */}
          <div className="form-group">
            <label className="form-label">
              Main Product Description
            </label>
            <input
              type="text"
              value={formData.product_description || ''}
              onChange={(e) => updateFormData('product_description', e.target.value)}
              placeholder="Describe your complete product (e.g., Electronic device, Machinery assembly, Textile product)"
              className="form-input"
            />
            <div className="form-help">
              Brief description of your complete product
            </div>
          </div>

          {/* Manufacturing Location */}
          <div className="form-group">
            <label className="form-label">
              Manufacturing/Assembly Location
            </label>
            <select
              value={formData.manufacturing_location || ''}
              onChange={(e) => updateFormData('manufacturing_location', e.target.value)}
              className="form-select"
            >
              <option value="">Select manufacturing country...</option>
              {dropdownOptions.countries?.map(country => {
                const countryCode = typeof country === 'string' ? country : country.value || country.code;
                const countryName = typeof country === 'string' ? country : country.label || country.name;
                return (
                  <option key={countryCode} value={countryCode}>
                    {countryName}
                  </option>
                );
              })}
            </select>
            <div className="form-help">
              Where is the final product assembled/manufactured?
            </div>
          </div>
        </div>
      </div>

      {/* Component Breakdown Section */}
      <div className="element-spacing">
        <h3 className="card-title">Component Breakdown</h3>
        <p className="text-muted">
          Break down your product into its major components. Each component should represent a significant portion of the product's value.
        </p>
      </div>

      <div className="element-spacing">
        {components.map((component, index) => (
          <div key={index} className="form-section">
            <div className="header-actions tight-spacing">
              <h3 className="card-title">Component {index + 1}</h3>
              {components.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeComponent(index)}
                  className="btn-danger"
                  title="Remove component"
                >
                </button>
              )}
            </div>

            <div className="grid-2">
              {/* Component Description */}
              <div className="form-group">
                <label className="form-label">
                  Component Description
                </label>
                <input
                  type="text"
                  value={component.description}
                  onChange={(e) => updateComponent(index, 'description', e.target.value)}
                  placeholder="Describe this component (system will suggest HS codes)"
                  className="form-input"
                />
              </div>

              {/* Origin Country */}
              <div className="form-group">
                <label className="form-label">
                  Origin Country
                </label>
                <select
                  value={component.origin_country}
                  onChange={(e) => updateComponent(index, 'origin_country', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select origin country...</option>
                  {dropdownOptions.countries?.map(country => {
                    const countryCode = typeof country === 'string' ? country : country.value || country.code;
                    const countryName = typeof country === 'string' ? country : country.label || country.name;
                    return (
                      <option key={countryCode} value={countryCode}>
                        {countryName}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Value Percentage */}
              <div className="form-group">
                <label className="form-label">
                  Value Percentage
                </label>
                <div className="form-input-group">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={component.value_percentage}
                    onChange={(e) => updateComponent(index, 'value_percentage', parseFloat(e.target.value) || 0)}
                    className="form-input"
                  />
                  <span className="form-input-suffix">%</span>
                </div>
              </div>

              {/* HS Code Input with Suggestions */}
              <div className="form-group">
                <label className="form-label">
                  HS Code
                  {searchingHS[index] && (
                    <span className="status-info">Searching...</span>
                  )}
                  <span className="status-success">
                    (Manual entries help improve our database)
                  </span>
                </label>
                <div className="form-input-container">
                  <input
                    type="text"
                    value={component.hs_code}
                    onChange={(e) => updateComponent(index, 'hs_code', e.target.value)}
                    placeholder="Enter HS code or select from suggestions"
                    className="form-input"
                  />
                  
                  {/* HS Code Suggestions */}
                  {component.hs_suggestions && component.hs_suggestions.length > 0 && (
                    <div className="hs-suggestions-container">
                      <div className="hs-suggestions-header">
                        Suggested HS codes based on description:
                      </div>
                      {component.hs_suggestions.slice(0, 5).map((suggestion, sIndex) => (
                        <button
                          key={sIndex}
                          type="button"
                          onClick={() => selectHSCode(index, suggestion.hsCode, suggestion.description)}
                          className="btn-secondary hs-suggestion-button"
                        >
                          <div className="hs-suggestion-content">
                            <div className="hs-suggestion-info">
                              <div className="hs-code-display">{suggestion.hsCode}</div>
                              <div className="hs-description">
                                {suggestion.description}
                              </div>
                            </div>
                            <div className="hs-confidence">
                              <span className={
                                suggestion.confidence >= 75 ? 'status-success' :
                                suggestion.confidence >= 50 ? 'status-warning' :
                                'status-info'
                              }>
                                {suggestion.confidenceText}
                              </span>
                            </div>
                          </div>
                          <div className="hs-rates-display">
                            MFN: {suggestion.mfnRate}% | USMCA: {suggestion.usmcaRate}%
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Component Button */}
        <button
          type="button"
          onClick={addComponent}
          className="btn-secondary add-component-button"
        >
          Add Component
        </button>

        {/* Total Percentage Display */}
        <div className={getTotalPercentage() === 100 ? 'percentage-summary success' : 'percentage-summary warning'}>
          <div className="percentage-display">
            <span className="percentage-label">Total Value Percentage:</span>
            <span className="percentage-value">
              {getTotalPercentage().toFixed(1)}%
            </span>
          </div>
          {getTotalPercentage() !== 100 && (
            <p className="form-help">
              Components must total exactly 100% of product value
            </p>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="dashboard-actions section-spacing">
        <button
          onClick={onPrevious}
          className="btn-secondary"
        >
          ← Previous
        </button>
        <button
          onClick={onProcessWorkflow}
          disabled={!isValid() || isLoading}
          className={`${isValid() && !isLoading ? 'btn-primary' : 'btn-secondary'} ${!isValid() || isLoading ? 'disabled' : ''}`}
        >
          {isLoading ? (
            <>Processing...</>
          ) : (
            <>
              Process USMCA Compliance
            </>
          )}
        </button>
      </div>
    </div>
  );
}