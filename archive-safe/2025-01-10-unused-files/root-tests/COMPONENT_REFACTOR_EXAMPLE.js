/**
 * ComponentOriginsStepEnhanced - REFACTORED VERSION
 * 
 * BEFORE: Mixed light/dark theme with inconsistent styling
 * AFTER: Professional enterprise design system implementation
 * 
 * Key Changes:
 * - Replaced `bg-white` with `.card` class
 * - Replaced ad-hoc Tailwind classes with design system classes
 * - Enhanced dropdown suggestions with proper styling
 * - Improved validation and status indicators
 * - Better responsive design patterns
 */

import React, { useState, useEffect } from 'react';
import { findHSCodes } from '../../lib/classification/simple-hs-matcher';

// Custom SVG icons (unchanged)
const Search = ({ className }) => (
  <span className={className}>[search]</span>
);

const Plus = ({ className }) => (
  <span className={className}>[plus]</span>
);

const X = ({ className }) => (
  <span className={className}>[x]</span>
);

const Info = ({ className }) => (
  <span className={className}>[info]</span>
);

const Check = ({ className }) => (
  <span className={className}>[check]</span>
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

  // Function to capture user-contributed HS codes (unchanged)
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
          user_confidence: 8
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ HS code captured:', result.message);
      }
    } catch (error) {
      console.error('Failed to capture HS code:', error);
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

  const loadExample = () => {
    updateFormData('product_description', '[Enter your complete product description here]');
    updateFormData('manufacturing_location', '');
    
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
    {/* 🔧 FIXED: Replaced `bg-white rounded-xl p-8 shadow-lg` with design system class */}
    <div className="card">
      <div className="card-body">
        {/* 🔧 FIXED: Using form-section-title instead of custom text colors */}
        <h2 className="form-section-title">
          Step 2: Product & Component Analysis
        </h2>
        
        {/* 🔧 FIXED: Using form-section-description class */}
        <p className="form-section-description">
          Describe your product, manufacturing location, and break it down into components with their origins and HS codes
        </p>
        
        {/* Educational template button - using btn classes */}
        <button
          type="button"
          onClick={loadExample}
          className="btn-secondary"
        >
          <Info className="content-card-icon" />
          Show form structure example
        </button>

        {/* 🔧 FIXED: Product Overview Section using form-section */}
        <div className="form-section">
          <h3 className="form-section-title">Product Overview</h3>
          
          {/* 🔧 FIXED: Using form-row for responsive grid */}
          <div className="form-row">
            {/* Main Product Description */}
            <div className="form-group">
              <label className="form-label form-label-required">
                Main Product Description
              </label>
              <input
                type="text"
                value={formData.product_description || ''}
                onChange={(e) => updateFormData('product_description', e.target.value)}
                placeholder="Describe your complete product (e.g., Electronic device, Machinery assembly, Textile product)"
                className="form-input"
              />
              <span className="form-help-text">
                Brief description of your complete product
              </span>
            </div>

            {/* Manufacturing Location */}
            <div className="form-group">
              <label className="form-label form-label-required">
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
              <span className="form-help-text">
                Where is the final product assembled/manufactured?
              </span>
            </div>
          </div>
        </div>

        {/* 🔧 FIXED: Component Breakdown Section */}
        <div className="form-section">
          <h3 className="form-section-title">Component Breakdown</h3>
          <p className="form-section-description">
            Break down your product into its major components. Each component should represent a significant portion of the product's value.
          </p>

          <div className="content-card">
            {components.map((component, index) => (
              {/* 🔧 FIXED: Using component-card instead of border-gray-200 bg-gray-50 */}
              <div key={index} className="component-card">
                {/* 🔧 FIXED: Using component-header class */}
                <div className="component-header">
                  <h4 className="component-title">Component {index + 1}</h4>
                  {components.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeComponent(index)}
                      className="remove-component-btn"
                      title="Remove component"
                    >
                      <X className="content-card-icon" />
                    </button>
                  )}
                </div>

                {/* 🔧 FIXED: Using form-row and form-group */}
                <div className="form-row">
                  {/* Component Description */}
                  <div className="form-group md:col-span-2">
                    <label className="form-label form-label-required">
                      Component Description
                      {searchingHS[index] && (
                        <span className="ml-2 badge badge-info">Searching...</span>
                      )}
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
                    <label className="form-label form-label-required">
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
                    <label className="form-label form-label-required">
                      Value Percentage
                    </label>
                    <div className="nav-menu">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={component.value_percentage}
                        onChange={(e) => updateComponent(index, 'value_percentage', parseFloat(e.target.value) || 0)}
                        className="form-input"
                      />
                      <span className="text-body">%</span>
                    </div>
                  </div>

                  {/* 🔧 FIXED: HS Code Input with Enhanced Suggestions */}
                  <div className="form-group md:col-span-2">
                    <label className="form-label form-label-required">
                      HS Code
                      <span className="ml-2 badge badge-success">
                        Manual entries improve database
                      </span>
                    </label>
                    
                    <div className="relative">
                      <input
                        type="text"
                        value={component.hs_code}
                        onChange={(e) => updateComponent(index, 'hs_code', e.target.value)}
                        placeholder="Enter HS code or select from suggestions"
                        className="form-input"
                      />
                      
                      {/* 🔧 FIXED: Enhanced HS Code Suggestions with design system */}
                      {component.hs_suggestions && component.hs_suggestions.length > 0 && (
                        <div className="dropdown-suggestions">
                          <div className="dropdown-header">
                            Suggested HS codes based on description:
                          </div>
                          {component.hs_suggestions.slice(0, 5).map((suggestion, sIndex) => (
                            <button
                              key={sIndex}
                              type="button"
                              onClick={() => selectHSCode(index, suggestion.hsCode, suggestion.description)}
                              className="dropdown-item"
                            >
                              <div className="nav-menu">
                                <div className="flex-1">
                                  <div className="dropdown-item-title">{suggestion.hsCode}</div>
                                  <div className="dropdown-item-subtitle">
                                    {suggestion.description}
                                  </div>
                                </div>
                                <div className="hero-button-group">
                                  <span className={`confidence-badge ${
                                    suggestion.confidence >= 75 ? 'confidence-high' :
                                    suggestion.confidence >= 50 ? 'confidence-medium' :
                                    'confidence-low'
                                  }`}>
                                    {suggestion.confidenceText}
                                  </span>
                                </div>
                              </div>
                              <div className="dropdown-item-meta">
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

            {/* 🔧 FIXED: Add Component Button using design system */}
            <button
              type="button"
              onClick={addComponent}
              className="add-component-btn"
            >
              <Plus className="content-card-icon" />
              Add Component
            </button>

            {/* 🔧 FIXED: Total Percentage Display using validation classes */}
            <div className={`validation-summary ${
              getTotalPercentage() === 100 ? 'valid' : 'invalid'
            }`}>
              <div className={`validation-text ${
                getTotalPercentage() === 100 ? 'valid' : 'invalid'
              }`}>
                <span>Total Value Percentage:</span>
                <span className="section-header-title">
                  {getTotalPercentage().toFixed(1)}%
                </span>
              </div>
              {getTotalPercentage() !== 100 && (
                <p className="validation-detail">
                  Components must total exactly 100% of product value
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 🔧 FIXED: Navigation Buttons using design system */}
        <div className="hero-button-group">
          <button
            onClick={onPrevious}
            className="btn btn-secondary"
          >
            ← Previous
          </button>
          <button
            onClick={onProcessWorkflow}
            disabled={!isValid() || isLoading}
            className={`btn ${
              isValid() && !isLoading ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            {isLoading ? (
              <>Processing...</>
            ) : (
              <>
                Process USMCA Compliance
                <Check className="content-card-icon" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/*
=================================================
KEY CHANGES MADE FOR DESIGN SYSTEM CONSISTENCY:
=================================================

1. 🔧 MAIN CONTAINER
   BEFORE: bg-white rounded-xl p-8 shadow-lg  
   AFTER:  card + card-body

2. 🔧 TYPOGRAPHY
   BEFORE: text-2xl font-bold text-blue-900, text-gray-600
   AFTER:  form-section-title, form-section-description

3. 🔧 FORM FIELDS
   BEFORE: border-gray-300 focus:ring-blue-500
   AFTER:  form-input, form-select (with dark theme)

4. 🔧 COMPONENT CARDS
   BEFORE: border-gray-200 bg-gray-50
   AFTER:  component-card (professional glass effect)

5. 🔧 BUTTONS
   BEFORE: bg-blue-600 hover:bg-blue-700
   AFTER:  btn btn-primary (with gradient + glow effects)

6. 🔧 VALIDATION
   BEFORE: bg-green-50 border-green-200 text-green-700
   AFTER:  validation-summary valid/invalid

7. 🔧 DROPDOWNS
   BEFORE: border-gray-200 bg-white hover:bg-blue-50
   AFTER:  dropdown-suggestions + dropdown-item (pro styling)

8. 🔧 BADGES
   BEFORE: bg-green-100 text-green-800
   AFTER:  confidence-badge confidence-high/medium/low

RESULT: Consistent enterprise dark theme throughout!
*/