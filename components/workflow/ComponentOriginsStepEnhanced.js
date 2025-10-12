/**
 * ComponentOriginsStepEnhanced - Step 2 of USMCA workflow
 * Includes component descriptions and HS code lookup
 * Real-world approach to multi-component products
 * Enhanced with real-time AI agent assistance
 */

import React, { useState, useEffect } from 'react';
import AgentSuggestionBadge from '../agents/AgentSuggestionBadge';
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
        hs_suggestions: [],
        manufacturing_location: formData.manufacturing_location || ''
      }
    ];
  });

  const [searchingHS, setSearchingHS] = useState({});
  const [agentSuggestions, setAgentSuggestions] = useState({});
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Update parent form data when components change
  useEffect(() => {
    updateFormData('component_origins', components);
  }, [components]);

  const updateComponent = (index, field, value) => {
    const newComponents = [...components];
    newComponents[index][field] = value;
    setComponents(newComponents);
  };

  // Get AI agent suggestion for specific component
  const getComponentHSSuggestion = async (index) => {
    const component = components[index];

    // Validate all required fields are filled
    if (!component.description || component.description.length < 10) {
      console.log('Description too short or missing');
      return;
    }
    if (!component.origin_country) {
      console.log('Origin country not selected');
      return;
    }
    if (!component.value_percentage || component.value_percentage <= 0) {
      console.log('Value percentage not entered');
      return;
    }

    setSearchingHS(prev => ({ ...prev, [index]: true }));

    try {
      // Send complete business context for accurate AI classification
      const response = await fetch('/api/agents/classification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest_hs_code',
          productDescription: component.description,
          componentOrigins: [{
            description: component.description,
            origin_country: component.origin_country,
            value_percentage: component.value_percentage
          }],
          additionalContext: {
            // Complete product context from Step 1
            overallProduct: formData.product_description,
            businessType: formData.business_type,
            manufacturingLocation: formData.manufacturing_location,
            exportDestination: formData.export_destination,
            tradeVolume: formData.annual_trade_volume,
            companyName: formData.company_name,
            primarySupplier: formData.primary_supplier_country,

            // All components for context
            allComponents: components.map(c => ({
              description: c.description,
              origin: c.origin_country,
              percentage: c.value_percentage
            })).filter(c => c.description) // Only send filled components
          }
        })
      });

      const result = await response.json();
      console.log(`🤖 Agent Classification Result for Component ${index + 1}:`, result);

      if (result.success && result.data) {
        const suggestion = {
          hsCode: result.data.hsCode,
          description: result.data.description, // ✅ REAL HTS DESCRIPTION
          confidence: result.data.confidence || result.data.adjustedConfidence,
          explanation: result.data.reasoning || result.data.explanation,
          source: 'AI Classification Agent',
          // Enhanced features from API (we're paying for this data - show it!)
          alternativeCodes: result.enhanced_features?.alternative_codes || [],
          mfnRate: result.tariff_analysis?.mfn_rate || null,
          usmcaRate: result.tariff_analysis?.usmca_rate || null,
          qualifiesForUSMCA: result.tariff_analysis?.qualifies_for_usmca || false
        };
        console.log(`✅ Setting agent suggestion for component ${index + 1}:`, suggestion);
        setAgentSuggestions(prev => ({ ...prev, [index]: suggestion }));
      } else {
        console.log(`❌ No valid suggestion returned for component ${index + 1}`);
      }
    } catch (error) {
      console.error(`Agent classification error for component ${index + 1}:`, error);
    } finally {
      setSearchingHS(prev => ({ ...prev, [index]: false }));
    }
  };

  // Manual HS Code lookup function
  const lookupHSCode = async (index) => {
    const component = components[index];
    
    if (!component.description || component.description.length < 3) {
      alert('Please enter a product description first');
      return;
    }
    
    setSearchingHS({ ...searchingHS, [index]: true });
    
    try {
      const response = await fetch('/api/lightweight-hs-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription: component.description,
          businessContext: { 
            companyType: formData.business_type || 'Manufacturing'
          }
        })
      });

      const result = await response.json();
      
      if (result.success && result.suggestions && result.suggestions.length > 0) {
        // Convert lightweight API results to component format
        const suggestions = result.suggestions.map(item => ({
          hsCode: item.hsCode,
          description: item.description,
          confidence: item.accuracy,
          confidenceText: `${item.accuracy}% accuracy`,
          reasoning: item.reasoning,
          source: item.source
        }));
        
        const newComponents = [...components];
        newComponents[index].hs_suggestions = suggestions;
        
        // Auto-select best match if accuracy is high  
        if (suggestions.length > 0 && suggestions[0].confidence >= 85) {
          newComponents[index].hs_code = suggestions[0].hsCode;
        }
        
        setComponents(newComponents);
      } else {
        // No suggestions found
        const newComponents = [...components];
        newComponents[index].hs_suggestions = [];
        setComponents(newComponents);
        alert('No HS code suggestions found. Try a more specific product description.');
      }
    } catch (error) {
      console.error('HS code lookup failed:', error);
      alert('HS code lookup failed. Please try again or enter the code manually.');
    } finally {
      setSearchingHS({ ...searchingHS, [index]: false });
    }
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
      hs_suggestions: [],
      manufacturing_location: formData.manufacturing_location || ''
    }]);

    // Scroll to the new component after it's added
    setTimeout(() => {
      const newComponentIndex = components.length;
      const componentElement = document.querySelector(`[data-component-index="${newComponentIndex}"]`);
      if (componentElement) {
        componentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const removeComponent = (index) => {
    if (components.length > 1) {
      setComponents(components.filter((_, i) => i !== index));
    }
  };

  const getTotalPercentage = () => {
    return components.reduce((sum, c) => sum + (parseFloat(c.value_percentage) || 0), 0);
  };

  const selectHSCode = (index, suggestion) => {
    const newComponents = [...components];
    newComponents[index].hs_code = suggestion.hsCode;
    newComponents[index].hs_description = suggestion.description;
    newComponents[index].showSuggestions = false;
    setComponents(newComponents);

    // Update main formData with HS classification and tariff rates for certificate workflow
    updateFormData('classified_hs_code', suggestion.hsCode);
    updateFormData('current_tariff_rate', suggestion.mfnRate || 0);
    updateFormData('usmca_tariff_rate', suggestion.usmcaRate || 0);
    
    // Calculate and save annual savings based on trade volume
    // Use the same parsing logic as the API to ensure consistency
    const parseTradeVolume = (volumeText) => {
      if (typeof volumeText === 'number') {
        return volumeText;
      }
      
      if (typeof volumeText !== 'string') {
        return 0;
      }
      
      const input = volumeText.trim();
      
      // Map of known range strings to their numeric midpoint values
      // Based on your API dropdown options - keeping this dynamic and in sync
      const rangeMap = {
        'Under $100K': 50000,
        '$100K - $500K': 300000,
        '$500K - $1M': 750000,
        '$1M - $5M': 3000000,
        '$5M - $25M': 15000000,
        '$25M - $100M': 62500000,
        'Over $100M': 500000000
      };
      
      // Check if it's a known range first
      if (rangeMap[input]) {
        return rangeMap[input];
      }
      
      // Fallback to parsing for custom values
      return parseFloat(input.replace(/[$,]/g, '')) || 0;
    };

    const tradeVolume = parseTradeVolume(formData.trade_volume);
    const mfnRate = parseFloat(suggestion.mfnRate || 0);
    const usmcaRate = parseFloat(suggestion.usmcaRate || 0);
    const tariffSavings = (mfnRate - usmcaRate) / 100; // Convert percentage to decimal
    const annualSavings = tradeVolume * tariffSavings;
    
    updateFormData('calculated_savings', Math.round(annualSavings));
    updateFormData('monthly_savings', Math.round(annualSavings / 12));
    
    console.log('Updated formData with HS classification results:', {
      hsCode: suggestion.hsCode,
      mfnRate: suggestion.mfnRate,
      usmcaRate: suggestion.usmcaRate,
      tradeVolumeText: formData.trade_volume,
      tradeVolumeNumeric: tradeVolume,
      tariffSavingsRate: tariffSavings,
      annualSavings: Math.round(annualSavings),
      monthlySavings: Math.round(annualSavings / 12)
    });
  };

  const isValid = () => {
    const total = getTotalPercentage();
    // HS code is now optional - will be classified during analysis if not provided
    const allFieldsFilled = components.every(c =>
      c.description && c.origin_country && c.value_percentage > 0
    );
    return total === 100 && allFieldsFilled;
  };

  // Validate workflow data before proceeding
  const handleValidateAndProceed = async () => {
    if (!isValid()) return;

    // Basic workflow validation (not certificate validation)
    const workflowValidation = {
      hasCompanyInfo: !!formData.company_name && !!formData.business_type,
      hasComponents: components.length > 0 && components.every(c => c.description && c.origin_country),
      totalIs100: getTotalPercentage() === 100
    };

    const workflowValid = workflowValidation.hasCompanyInfo &&
                         workflowValidation.hasComponents &&
                         workflowValidation.totalIs100;

    if (!workflowValid) {
      setValidationResult({
        success: true,
        data: {
          valid: false,
          errors: [
            !workflowValidation.hasCompanyInfo && { message: 'Company information incomplete' },
            !workflowValidation.hasComponents && { message: 'Component information incomplete' },
            !workflowValidation.totalIs100 && { message: 'Components must total 100%' }
          ].filter(Boolean)
        }
      });
      return;
    }

    // If workflow is valid, proceed directly
    console.log('🚀 ========== STEP 2 SUBMIT: COMPONENT DATA ==========');
    console.log('📦 Component Data Being Submitted:', {
      component_count: components.length,
      components: components.map((c, i) => ({
        index: i + 1,
        description: c.description,
        origin_country: c.origin_country,
        value_percentage: c.value_percentage,
        hs_code: c.hs_code,
        manufacturing_location: c.manufacturing_location
      })),
      total_percentage: components.reduce((sum, c) => sum + parseFloat(c.value_percentage || 0), 0)
    });
    console.log('🏢 Company Data from formData:', {
      company_name: formData.company_name,
      business_type: formData.business_type,
      trade_volume: formData.trade_volume,
      product_description: formData.product_description,
      manufacturing_location: formData.manufacturing_location
    });
    console.log('========== END COMPONENT DATA ==========');

    onProcessWorkflow();
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
      </div>

      {/* Product Overview Section */}
      <div className="form-section">
        <h3 className="form-section-title">Product Overview</h3>
        
        <div className="form-grid-2">
          {/* Main Product Description */}
          <div className="form-group">
            <label className="form-label">
              Complete Product Description
            </label>
            <textarea
              value={formData.product_description || ''}
              onChange={(e) => updateFormData('product_description', e.target.value)}
              placeholder="Example: '100% cotton crew neck t-shirts with reinforced seams, medium weight jersey knit fabric'"
              className="form-input"
              rows="3"
            />
            <div className="form-help">
              Detailed product description including materials, construction, and key features for accurate classification
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
              className={`form-select ${formData.manufacturing_location ? 'has-value' : ''}`}
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

          {/* Origin Criterion - USMCA Certificate Field #8 */}
          <div className="form-group">
            <label className="form-label">
              Origin Criterion
            </label>
            <select
              value={formData.origin_criterion || ''}
              onChange={(e) => updateFormData('origin_criterion', e.target.value)}
              className={`form-select ${formData.origin_criterion ? 'has-value' : ''}`}
            >
              <option value="">Select origin criterion...</option>
              <option value="A">A - Wholly Obtained</option>
              <option value="B">B - Tariff Shift and Regional Value Content</option>
              <option value="C">C - Specific Processing/Value Requirement</option>
            </select>
            <div className="form-help">
              How does your product qualify under USMCA? (Certificate Field #8)
            </div>
          </div>

          {/* Method of Qualification - USMCA Certificate Field #10 */}
          <div className="form-group">
            <label className="form-label">
              Method of Qualification
            </label>
            <select
              value={formData.method_of_qualification || ''}
              onChange={(e) => updateFormData('method_of_qualification', e.target.value)}
              className={`form-select ${formData.method_of_qualification ? 'has-value' : ''}`}
            >
              <option value="">Select calculation method...</option>
              <option value="TS">TS - Tariff Shift</option>
              <option value="TV">TV - Transaction Value (RVC)</option>
              <option value="NC">NC - Net Cost (RVC)</option>
              <option value="NO">NO - No Requirement</option>
            </select>
            <div className="form-help">
              Method used to calculate regional value content (Certificate Field #10)
            </div>
          </div>
        </div>
      </div>

      {/* Component Breakdown Section */}
      <div className="element-spacing">
        <h2 className="form-section-title">Component Breakdown</h2>
        <p className="text-body">
          Break down your product into its major components. Each component should represent a significant portion of the product's value.
        </p>
      </div>

      <div className="element-spacing">
        {components.map((component, index) => (
          <div key={index} className="form-section" data-component-index={index}>
            <div className="dashboard-actions">
              <div className="dashboard-actions-left">
                <h3 className="form-section-title">Component {index + 1}</h3>
              </div>
              {components.length > 1 && (
                <div className="dashboard-actions-right">
                  <button
                    type="button"
                    onClick={() => removeComponent(index)}
                    className="btn-danger"
                    title="Remove component"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="form-grid-2">
              {/* Component Description */}
              <div className="form-group">
                <label className="form-label">
                  Component Description
                </label>
                <input
                  type="text"
                  value={component.description}
                  onChange={(e) => {
                    updateComponent(index, 'description', e.target.value);
                  }}
                  placeholder="Example: 'Polyester fabric outer shell' or 'Stainless steel fasteners'"
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
                  className={`form-select ${component.origin_country ? 'has-value' : ''}`}
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
                    value={component.value_percentage || ''}
                    onChange={(e) => updateComponent(index, 'value_percentage', parseFloat(e.target.value) || '')}
                    placeholder="Example: 45"
                    className="form-input"
                  />
                  <span className="form-input-suffix">%</span>
                </div>
              </div>

              {/* HS Code Input - Simple Hybrid Approach */}
              <div className="form-group">
                <label className="form-label">
                  HS Code (Optional)
                </label>
                <input
                  type="text"
                  value={component.hs_code}
                  onChange={(e) => updateComponent(index, 'hs_code', e.target.value)}
                  placeholder="Enter if known (e.g., 8544.42.90)"
                  className="form-input"
                />
                <div className="form-help">
                  Don't know your HS code? Get AI suggestion below.
                </div>

                {/* Get AI Suggestion Button */}
                <button
                  type="button"
                  onClick={() => getComponentHSSuggestion(index)}
                  disabled={
                    !component.description ||
                    component.description.length < 10 ||
                    !component.origin_country ||
                    !component.value_percentage ||
                    searchingHS[index]
                  }
                  className="btn-secondary btn-ai-suggestion"
                >
                  {searchingHS[index] ? '🤖 Analyzing...' : '🤖 Get AI HS Code Suggestion'}
                </button>
              </div>
            </div>

            {/* AI Agent HS Code Suggestion - FULL WIDTH outside grid */}
            {agentSuggestions[index] && (
              <AgentSuggestionBadge
                suggestion={{
                  success: true,
                  data: {
                    hsCode: agentSuggestions[index].hsCode,
                    description: agentSuggestions[index].description,
                    value: `HS Code: ${agentSuggestions[index].hsCode}`,
                    confidence: agentSuggestions[index].confidence,
                    explanation: agentSuggestions[index].explanation,
                    source: agentSuggestions[index].source,
                    alternativeCodes: agentSuggestions[index].alternativeCodes,
                    mfnRate: agentSuggestions[index].mfnRate,
                    usmcaRate: agentSuggestions[index].usmcaRate,
                    qualifiesForUSMCA: agentSuggestions[index].qualifiesForUSMCA
                  }
                }}
                onAccept={() => {
                  updateComponent(index, 'hs_code', agentSuggestions[index].hsCode);
                  const newSuggestions = { ...agentSuggestions };
                  delete newSuggestions[index];
                  setAgentSuggestions(newSuggestions);
                }}
                onDismiss={() => {
                  const newSuggestions = { ...agentSuggestions };
                  delete newSuggestions[index];
                  setAgentSuggestions(newSuggestions);
                }}
              />
            )}
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

      {/* Validation Results */}
      {validationResult && !validationResult.data?.valid && (
        <div className="alert alert-warning">
          <div className="alert-content">
            <h3>⚠️ Validation Issues Detected</h3>
            <ul>
              {validationResult.data?.errors?.map((error, idx) => (
                <li key={idx}>{error.message}</li>
              ))}
            </ul>
            <button
              onClick={() => {
                setValidationResult(null);
                onProcessWorkflow();
              }}
              className="btn-primary"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="dashboard-actions section-spacing">
        <button
          onClick={onPrevious}
          className="btn-secondary"
        >
          ← Previous
        </button>
        <button
          onClick={handleValidateAndProceed}
          disabled={!isValid() || isLoading || isValidating}
          className={`${isValid() && !isLoading && !isValidating ? 'btn-primary' : 'btn-secondary'} ${!isValid() || isLoading || isValidating ? 'disabled' : ''}`}
        >
          {isLoading || isValidating ? (
            <>{isValidating ? 'Validating...' : 'Processing...'}</>
          ) : (
            <>
              Continue to USMCA Analysis
            </>
          )}
        </button>
      </div>
    </div>
  );
}