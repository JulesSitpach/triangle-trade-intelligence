/**
 * ComponentOriginsStepEnhanced - Step 2 of USMCA workflow
 * Includes component descriptions and HS code lookup
 * Real-world approach to multi-component products
 */

import React, { useState, useEffect } from 'react';
import { findHSCodes } from '../../lib/classification/simple-hs-matcher';
// Custom SVG icons to avoid lucide-react ESM import issues
const Search = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const Plus = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const X = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const Info = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const Check = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

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
  const [components, setComponents] = useState(formData.component_origins || [
    { 
      description: '', 
      origin_country: 'CN', 
      value_percentage: 0, 
      hs_code: '',
      hs_suggestions: []
    }
  ]);
  
  const [searchingHS, setSearchingHS] = useState({});

  // Update parent form data when components change
  useEffect(() => {
    updateFormData('component_origins', components);
  }, [components]);

  const updateComponent = async (index, field, value) => {
    const newComponents = [...components];
    newComponents[index][field] = value;
    
    // If description changed, search for HS codes
    if (field === 'description' && value.length > 3) {
      setSearchingHS({ ...searchingHS, [index]: true });
      try {
        const matches = await findHSCodes(value);
        newComponents[index].hs_suggestions = matches;
        
        // Auto-select best match if confidence is high
        if (matches.length > 0 && matches[0].confidence >= 75) {
          newComponents[index].hs_code = matches[0].hsCode;
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
      origin_country: 'CN', 
      value_percentage: 0, 
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
    <div className="card">
      <div className="element-spacing">
        <h2 className="section-title">
          Step 2: Product & Component Analysis
        </h2>
        <p className="text-muted">
          Describe your product, manufacturing location, and break it down into components with their origins and HS codes
        </p>
        
        {/* Educational template button */}
        <button
          type="button"
          onClick={loadExample}
          className="btn-secondary"
          style={{ marginTop: '12px' }}
        >
          Show form structure example (educational only)
        </button>
      </div>

      {/* Product Overview Section */}
      <div className="section-spacing card">
        <h3 className="card-title">Product Overview</h3>
        
        <div className="grid-2">
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
            <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
              Brief description of your complete product
            </p>
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
              <option value="CN">China</option>
              <option value="MX">Mexico</option>
              <option value="CA">Canada</option>
              <option value="US">United States</option>
              <option value="IN">India</option>
              <option value="VN">Vietnam</option>
              <option value="DE">Germany</option>
              <option value="JP">Japan</option>
              <option value="KR">South Korea</option>
              <option value="TW">Taiwan</option>
            </select>
            <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
              Where is the final product assembled/manufactured?
            </p>
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

      <div style={{ marginBottom: '16px' }}>
        {components.map((component, index) => (
          <div key={index} className="card-compact" style={{ marginBottom: '16px' }}>
            <div className="header-actions" style={{ marginBottom: '12px' }}>
              <h3 className="card-title">Component {index + 1}</h3>
              {components.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeComponent(index)}
                  className="btn-danger"
                  title="Remove component"
                  style={{ padding: '6px' }}
                >
                  <X className="icon-sm" />
                </button>
              )}
            </div>

            <div className="grid-2">
              {/* Component Description */}
              <div style={{ gridColumn: '1 / -1' }} className="form-group">
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
                  <option value="CN">China</option>
                  <option value="MX">Mexico</option>
                  <option value="CA">Canada</option>
                  <option value="US">United States</option>
                  <option value="IN">India</option>
                  <option value="VN">Vietnam</option>
                  <option value="DE">Germany</option>
                  <option value="JP">Japan</option>
                  <option value="KR">South Korea</option>
                  <option value="TW">Taiwan</option>
                </select>
              </div>

              {/* Value Percentage */}
              <div className="form-group">
                <label className="form-label">
                  Value Percentage
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={component.value_percentage}
                    onChange={(e) => updateComponent(index, 'value_percentage', parseFloat(e.target.value) || 0)}
                    className="form-input"
                  />
                  <span className="text-muted" style={{ marginLeft: '8px' }}>%</span>
                </div>
              </div>

              {/* HS Code Input with Suggestions */}
              <div style={{ gridColumn: '1 / -1' }} className="form-group">
                <label className="form-label">
                  HS Code
                  {searchingHS[index] && (
                    <span className="status-info" style={{ marginLeft: '8px' }}>Searching...</span>
                  )}
                  <span className="status-success" style={{ marginLeft: '8px' }}>
                    (Manual entries help improve our database)
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={component.hs_code}
                    onChange={(e) => updateComponent(index, 'hs_code', e.target.value)}
                    placeholder="Enter HS code or select from suggestions"
                    className="form-input"
                  />
                  
                  {/* HS Code Suggestions */}
                  {component.hs_suggestions && component.hs_suggestions.length > 0 && (
                    <div className="card-compact" style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                      <div className="text-muted" style={{ padding: '8px', borderBottom: '1px solid var(--border-light)', fontSize: '12px' }}>
                        Suggested HS codes based on description:
                      </div>
                      {component.hs_suggestions.slice(0, 5).map((suggestion, sIndex) => (
                        <button
                          key={sIndex}
                          type="button"
                          onClick={() => selectHSCode(index, suggestion.hsCode, suggestion.description)}
                          className="btn-secondary"
                          style={{ 
                            width: '100%', 
                            textAlign: 'left', 
                            padding: '8px',
                            borderBottom: sIndex < component.hs_suggestions.slice(0, 5).length - 1 ? '1px solid var(--border-light)' : 'none',
                            borderRadius: '0'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ flex: 1 }}>
                              <div className="text-body" style={{ fontWeight: '500', fontSize: '14px' }}>{suggestion.hsCode}</div>
                              <div className="text-muted" style={{ fontSize: '12px' }}>
                                {suggestion.description}
                              </div>
                            </div>
                            <div style={{ marginLeft: '8px' }}>
                              <span className={
                                suggestion.confidence >= 75 ? 'status-success' :
                                suggestion.confidence >= 50 ? 'status-warning' :
                                'status-info'
                              }>
                                {suggestion.confidenceText}
                              </span>
                            </div>
                          </div>
                          <div className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
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
          className="btn-secondary"
          style={{ 
            width: '100%', 
            padding: '12px', 
            border: '2px dashed var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Plus className="icon-sm" />
          Add Component
        </button>

        {/* Total Percentage Display */}
        <div className={getTotalPercentage() === 100 ? 'status-success' : 'status-warning'} 
             style={{ 
               padding: '16px', 
               borderRadius: 'var(--radius-lg)',
               border: getTotalPercentage() === 100 ? '1px solid var(--green-200)' : '1px solid var(--amber-200)',
               backgroundColor: getTotalPercentage() === 100 ? 'var(--green-50)' : 'var(--amber-50)'
             }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-body" style={{ fontWeight: '600' }}>Total Value Percentage:</span>
            <span className="metric-value" style={{ 
              fontSize: '18px',
              color: getTotalPercentage() === 100 ? 'var(--green-700)' : 'var(--amber-700)'
            }}>
              {getTotalPercentage().toFixed(1)}%
            </span>
          </div>
          {getTotalPercentage() !== 100 && (
            <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>
              Components must total exactly 100% of product value
            </p>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="header-actions section-divider" style={{ paddingTop: '24px' }}>
        <button
          onClick={onPrevious}
          className="btn-secondary"
        >
          ← Previous
        </button>
        <button
          onClick={onProcessWorkflow}
          disabled={!isValid() || isLoading}
          className={isValid() && !isLoading ? 'btn-primary' : 'btn-secondary'}
          style={{ 
            opacity: isValid() && !isLoading ? 1 : 0.5,
            cursor: isValid() && !isLoading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isLoading ? (
            <>Processing...</>
          ) : (
            <>
              Process USMCA Compliance
              <Check className="icon-sm" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}