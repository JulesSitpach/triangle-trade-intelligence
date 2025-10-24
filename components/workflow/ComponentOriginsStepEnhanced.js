/**
 * ComponentOriginsStepEnhanced - Step 2 of USMCA workflow
 * Includes component descriptions and HS code lookup
 * Real-world approach to multi-component products
 * Enhanced with real-time AI agent assistance
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AgentSuggestionBadge from '../agents/AgentSuggestionBadge';
import { canAddComponent, getComponentLimitMessage, getUpgradeMessage, SUBSCRIPTION_TIERS } from '../../config/subscription-limits';
import { logDevIssue, DevIssue } from '../../lib/utils/logDevIssue.js';
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
  isLoading,
  userTier = SUBSCRIPTION_TIERS.FREE_TRIAL
}) {
  // ✅ FIX #3: Ensure all component fields are always defined to prevent React controlled/uncontrolled warning
  const normalizeComponent = (component) => {
    return {
      description: component?.description ?? '',
      origin_country: component?.origin_country ?? '',
      value_percentage: component?.value_percentage ?? '',
      hs_code: component?.hs_code ?? '',
      hs_suggestions: component?.hs_suggestions ?? [],
      manufacturing_location: component?.manufacturing_location ?? formData.manufacturing_location ?? '',
      enrichment_error: component?.enrichment_error ?? null,
      mfn_rate: component?.mfn_rate ?? null,
      usmca_rate: component?.usmca_rate ?? null,
      is_usmca_member: component?.is_usmca_member ?? false
    };
  };

  const [components, setComponents] = useState(() => {
    // RESTORATION: Check if formData already has components from previous navigation
    if (formData.component_origins && formData.component_origins.length > 0) {
      console.log(`📂 Restoring ${formData.component_origins.length} components from formData`);
      // ✅ Normalize each component to ensure all fields exist
      return formData.component_origins.map(normalizeComponent);
    }
    // Otherwise initialize with empty template
    return [
      normalizeComponent({
        manufacturing_location: formData.manufacturing_location
      })
    ];
  });

  const [searchingHS, setSearchingHS] = useState({});
  const [agentSuggestions, setAgentSuggestions] = useState({});
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Update parent form data when components change
  // CRITICAL: Only update if components actually changed (not on every render)
  // This prevents infinite loop with the sync effect below
  useEffect(() => {
    // Don't update on initial render (components will be [{}])
    if (components.length === 1 && !components[0].description) {
      return; // Skip initial empty component
    }
    updateFormData('component_origins', components);
  }, [components, updateFormData]);

  // Restore components when navigating back and formData changes
  // This handles browser back button and in-app navigation
  // Only depend on formData.component_origins, not components, to avoid circular dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (formData.component_origins &&
        formData.component_origins.length > 0 &&
        JSON.stringify(formData.component_origins) !== JSON.stringify(components)) {
      console.log(`🔄 Syncing components from formData (navigation restore)`);
      setComponents(formData.component_origins);
    }
  }, [formData.component_origins]);

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

    // CRITICAL: Validate formData business_type (REQUIRED by AI classification agent)
    if (!formData.business_type) {
      console.error('❌ Cannot classify component: business_type is required from Step 1');
      alert('Please complete company information (business type) in Step 1 before requesting AI classification.');
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
            industryContext: formData.business_type, // Required field, validated above
            businessType: formData.business_type,
            manufacturingLocation: formData.manufacturing_location,
            exportDestination: formData.export_destination,
            tradeVolume: formData.trade_volume,  // ✅ FIXED: Use trade_volume, not annual_trade_volume (matches CompanyInformationStep)
            companyName: formData.company_name,
            primarySupplier: formData.primary_supplier_country,

            // PROGRESSIVE CONTEXT: Send previously classified components (before this index)
            // This prevents duplicate HS codes - AI knows what codes it already assigned
            previouslyClassifiedComponents: components.slice(0, index)
              .filter(c => c.description && c.hs_code) // Only components with HS codes
              .map(c => ({
                description: c.description,
                origin_country: c.origin_country,
                value_percentage: c.value_percentage,
                hs_code: c.hs_code
              }))
          }
        })
      });

      const result = await response.json();
      console.log(`🤖 Agent Classification Result for Component ${index + 1}:`, result);

      if (result.success && result.data) {
        // ✅ SAFETY: Ensure explanation is always a string (AI might return objects)
        const rawExplanation = result.data.reasoning || result.data.explanation;
        const safeExplanation = typeof rawExplanation === 'string'
          ? rawExplanation
          : JSON.stringify(rawExplanation || 'AI classification completed');

        // ✅ SAFETY: Ensure alternativeCodes are safe (normalize any nested objects)
        const safeAlternativeCodes = (result.enhanced_features?.alternative_codes || []).map(alt => ({
          code: typeof alt.code === 'string' ? alt.code : String(alt.code || ''),
          reason: typeof alt.reason === 'string' ? alt.reason : (alt.reason?.status || String(alt.reason || 'Alternative option')),
          confidence: Number(alt.confidence) || 0
        }));

        const suggestion = {
          hsCode: result.data.hsCode,
          description: result.data.description, // ✅ REAL HTS DESCRIPTION
          confidence: result.data.confidence || result.data.adjustedConfidence,
          explanation: safeExplanation,
          source: 'AI Classification Agent',
          // Enhanced features from API - HS CLASSIFICATION ONLY (tariff rates looked up separately)
          alternativeCodes: safeAlternativeCodes
        };
        console.log(`✅ Setting agent suggestion for component ${index + 1}:`, suggestion);
        setAgentSuggestions(prev => ({ ...prev, [index]: suggestion }));

        // ✅ REMOVED AUTO-ACCEPT - User now sees suggestion and decides to accept or not
        // This gives user time to read AI explanation before committing
      } else {
        console.log(`❌ No valid suggestion returned for component ${index + 1}`);
      }
    } catch (error) {
      console.error(`Agent classification error for component ${index + 1}:`, error);
      await DevIssue.apiError('component_origins_step', '/api/agents/classification', error, {
        componentIndex: index,
        componentDescription: component.description,
        originCountry: component.origin_country
      });
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

    // CRITICAL: Validate formData business_type (improves AI accuracy)
    if (!formData.business_type) {
      console.error('❌ Cannot lookup HS code: business_type missing from Step 1');
      alert('Please complete company information (business type) in Step 1 for better HS code accuracy.');
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
            companyType: formData.business_type // Required field, validated above
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
      await DevIssue.apiError('component_origins_step', '/api/lightweight-hs-lookup', error, {
        componentIndex: index,
        productDescription: component.description
      });
      alert('HS code lookup failed. Please try again or enter the code manually.');
    } finally {
      setSearchingHS({ ...searchingHS, [index]: false });
    }
  };

  // Function to capture user-contributed HS codes
  const captureUserHSCode = async (hsCode, description) => {
    if (!hsCode || !description) return;

    // CRITICAL: Validate required fields before calling API (Fail Loudly Protocol)
    if (!formData.company_name) {
      console.error('❌ Cannot capture HS code: company_name is required');
      return; // Skip optional HS code capture if company data is missing
    }

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
          company_name: formData.company_name, // Required field, validated above
          user_confidence: 8 // User-provided codes have high confidence
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ HS code captured:', result.message);
      }
    } catch (error) {
      console.error('Failed to capture HS code:', error);
      // Fail silently - don't disrupt user experience (no dev issue log needed for optional feature)
    }
  };

  const addComponent = () => {
    // Check component limit before adding
    if (!canAddComponent(userTier, components.length)) {
      setShowUpgradeModal(true);
      return;
    }

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
    // HS code is REQUIRED - user must either input it manually or get AI suggestion
    // This ensures all HS codes are pre-classified before main USMCA analysis API call
    const allFieldsFilled = components.every(c =>
      c.description &&
      c.origin_country &&
      c.value_percentage > 0 &&
      c.hs_code &&
      c.hs_code.trim() !== ''
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
            <label className="form-label required">
              Manufacturing/Assembly Location
            </label>
            <select
              value={formData.manufacturing_location || ''}
              onChange={(e) => updateFormData('manufacturing_location', e.target.value)}
              className={`form-select ${formData.manufacturing_location ? 'has-value' : ''}`}
              required
            >
              <option value="">Select manufacturing country...</option>
              <option value="DOES_NOT_APPLY">Does Not Apply (Imported/Distributed Only)</option>
              {dropdownOptions.countries?.map((country, idx) => {
                const countryCode = typeof country === 'string' ? country : country.value || country.code;
                const countryName = typeof country === 'string' ? country : country.label || country.name;
                return (
                  <option key={`mfg-loc-${countryCode}-${idx}`} value={countryCode}>
                    {countryName}
                  </option>
                );
              })}
            </select>
            <div className="form-help">
              Where is the final product assembled/manufactured? (Select &quot;Does Not Apply&quot; if you import/distribute only)
            </div>

            {/* Substantial Transformation Checkbox - Only show for USMCA countries */}
            {formData.manufacturing_location && ['US', 'MX', 'CA', 'United States', 'Mexico', 'Canada'].includes(formData.manufacturing_location) && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.substantial_transformation || false}
                    onChange={(e) => updateFormData('substantial_transformation', e.target.checked)}
                    style={{ marginTop: '0.125rem', marginRight: '0.5rem', flexShrink: 0 }}
                  />
                  <span style={{ color: '#0c4a6e', lineHeight: '1.5' }}>
                    <strong>Manufacturing involves substantial transformation</strong> (not just simple assembly)
                    <br />
                    <span style={{ fontSize: '0.8125rem', color: '#075985', fontStyle: 'italic' }}>
                      Check this if your manufacturing process creates significant value beyond basic assembly (welding, forming, heat treatment, etc.)
                    </span>
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* REMOVED: origin_criterion and method_of_qualification dropdowns
              These fields confused users because AI determines them based on USMCA treaty rules.
              Allowing users to "choose" created false sense of control - AI must apply correct rules
              regardless of user selection (e.g., automotive products MUST use Net Cost method).

              These values are now determined by AI and shown in results/certificate. */}
        </div>
      </div>

      {/* Component Breakdown Section */}
      <div className="element-spacing">
        <h2 className="form-section-title">Component Breakdown</h2>
        <p className="text-body">
          Break down your product into its major components. Each component should represent a significant portion of the product&apos;s value.
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
                  value={component.description || ''}
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
                  value={component.origin_country || ''}
                  onChange={(e) => updateComponent(index, 'origin_country', e.target.value)}
                  className={`form-select ${component.origin_country ? 'has-value' : ''}`}
                >
                  <option value="">Select origin country...</option>
                  {dropdownOptions.countries?.map((country, idx) => {
                    const countryCode = typeof country === 'string' ? country : country.value || country.code;
                    const countryName = typeof country === 'string' ? country : country.label || country.name;
                    return (
                      <option key={`origin-${countryCode}-${idx}`} value={countryCode}>
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
                  HS Code *
                </label>
                <div className="form-help">
                  Required for accurate AI classification (like a tax form needs accurate information)
                </div>
                <input
                  type="text"
                  value={component.hs_code || ''}
                  onChange={(e) => updateComponent(index, 'hs_code', e.target.value)}
                  placeholder="Enter if known (e.g., 8544.42.90)"
                  className="form-input"
                />
                <div className="form-help">
                  Don&apos;t know your HS code? Get AI suggestion below.
                </div>

                {/* Get AI Suggestion Button - Turns BLUE when all fields are filled (like Continue button) */}
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
                  className={
                    component.description && component.description.length >= 10 &&
                    component.origin_country && component.value_percentage && !searchingHS[index]
                      ? 'btn-primary btn-ai-suggestion'  // BLUE when all required fields filled
                      : 'btn-secondary btn-ai-suggestion'  // Gray when fields incomplete
                  }
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
                    requiredDocumentation: agentSuggestions[index].requiredDocumentation
                  }
                }}
                onAccept={() => {
                  // EDUCATIONAL: Preserve AI reasoning in component data
                  const suggestion = agentSuggestions[index];
                  updateComponent(index, 'hs_code', suggestion.hsCode);
                  updateComponent(index, 'hs_description', suggestion.description);
                  updateComponent(index, 'ai_reasoning', suggestion.explanation);
                  updateComponent(index, 'confidence', suggestion.confidence);
                  updateComponent(index, 'alternative_codes', suggestion.alternativeCodes || []);
                  updateComponent(index, 'required_documentation', suggestion.requiredDocumentation || []);
                  updateComponent(index, 'classification_source', 'ai_agent');

                  // Clear the suggestion badge (user accepted it)
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

            {/* EDUCATIONAL: Show AI classification indicator after acceptance */}
            {!agentSuggestions[index] && component.classification_source === 'ai_agent' && component.hs_code && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: '#f0f9ff',
                borderRadius: '4px',
                borderLeft: '3px solid #0ea5e9',
                fontSize: '0.8125rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#075985' }}>
                  <span>🤖</span>
                  <span style={{ fontWeight: '500' }}>
                    AI-classified ({component.confidence}% confidence)
                  </span>
                  {component.ai_reasoning && (
                    <button
                      type="button"
                      onClick={() => {
                        // Show reasoning in alert for now (could be a modal in future)
                        alert(`AI Classification Reasoning:\n\n${component.ai_reasoning}\n\nRequired Documentation:\n${(component.required_documentation || []).map((doc, i) => `${i + 1}. ${doc}`).join('\n')}`);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0ea5e9',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontSize: '0.75rem',
                        padding: 0
                      }}
                    >
                      View reasoning
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Component Button with Limit Status - Turns BLUE when last component is filled */}
        <div className="element-spacing">
          <button
            type="button"
            onClick={addComponent}
            className={(() => {
              // Check if last component is fully filled
              const lastComponent = components[components.length - 1];
              const isLastComponentComplete = lastComponent &&
                lastComponent.description && lastComponent.description.trim().length >= 10 &&
                lastComponent.origin_country &&
                lastComponent.value_percentage > 0 &&
                lastComponent.hs_code;

              return isLastComponentComplete ? 'btn-primary add-component-button' : 'btn-secondary add-component-button';
            })()}
          >
            Add Component
          </button>
          <div className="form-help" style={{marginTop: '0.5rem', textAlign: 'center'}}>
            {getComponentLimitMessage(userTier, components.length)}
            {!canAddComponent(userTier, components.length) && (
              <span style={{color: '#f59e0b', marginLeft: '0.5rem'}}>
                {getUpgradeMessage(userTier, 'component_limit')}
              </span>
            )}
          </div>
        </div>

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
          className="btn-primary"
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

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚀 Component Limit Reached</h2>
              <button onClick={() => setShowUpgradeModal(false)} className="modal-close">×</button>
            </div>

            <div className="modal-body">
              <p className="text-body" style={{marginBottom: '1.5rem'}}>
                Your product needs more than 3 components for complete analysis?
                Most products require 5-7 components for accurate USMCA qualification.
              </p>

              <div style={{background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem'}}>Starter Plan - $99/mo</h3>
                <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                  <li style={{marginBottom: '0.5rem'}}>✓ 10 components per analysis</li>
                  <li style={{marginBottom: '0.5rem'}}>✓ 10 analyses per month</li>
                  <li style={{marginBottom: '0.5rem'}}>✓ Full certificate download</li>
                  <li style={{marginBottom: '0.5rem'}}>✓ Email crisis alerts</li>
                </ul>
              </div>

              <div style={{background: '#ede9fe', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '0.75rem'}}>
                  <h3 style={{fontSize: '1.125rem', fontWeight: 600, margin: 0}}>Professional Plan - $299/mo</h3>
                  <span style={{
                    background: '#8b5cf6',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    marginLeft: '0.75rem'
                  }}>POPULAR</span>
                </div>
                <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                  <li style={{marginBottom: '0.5rem'}}>✓ 25 components per analysis</li>
                  <li style={{marginBottom: '0.5rem'}}>✓ Unlimited analyses</li>
                  <li style={{marginBottom: '0.5rem'}}>✓ 15% service discounts</li>
                  <li style={{marginBottom: '0.5rem'}}>✓ Priority support (48hr)</li>
                </ul>
              </div>

              <p className="form-help" style={{textAlign: 'center', marginBottom: '1rem'}}>
                💡 Pro Tip: You can continue with 3 components to get started,
                but complex products need full analysis for accurate USMCA qualification.
              </p>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowUpgradeModal(false)} className="btn-secondary">
                Continue with 3 Components
              </button>
              <Link href="/pricing" className="btn-primary">
                View Plans & Upgrade
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}