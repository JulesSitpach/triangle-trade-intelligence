/**
 * CompanyInformationStep - Step 1 of USMCA workflow
 * Focused component under 150 lines
 * Using professional enterprise design system
 */

import React, { useState, useEffect } from 'react';
import { SYSTEM_CONFIG } from '../../config/system-config.js';
import { BUSINESS_TYPES, CERTIFIER_TYPES, mapBusinessTypeToCertifierType } from '../../config/business-types.js';

// Professional SVG icons for form fields
// Icons removed - no longer using icon placeholders

export default function CompanyInformationStep({
  formData,
  updateFormData,
  dropdownOptions,
  isLoadingOptions,
  onNext,
  isStepValid,
  onNewAnalysis,
  saveWorkflowToDatabase
}) {
  // Fix hydration mismatch by using state for client-side calculations
  const [isClient, setIsClient] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 🔍 DIAGNOSTIC: Log what businessTypes the component is receiving
  useEffect(() => {
    console.log('🔍 [CompanyInformationStep] Received dropdownOptions:', {
      businessTypesCount: dropdownOptions.businessTypes?.length || 0,
      businessTypes: dropdownOptions.businessTypes?.map(bt => bt.label) || [],
      isLoading: isLoadingOptions,
      allKeys: Object.keys(dropdownOptions)
    });
  }, [dropdownOptions, isLoadingOptions]);

  // Auto-calculate trade flow type and cache strategy when countries are selected
  useEffect(() => {
    if (formData.company_country && formData.destination_country) {
      // Normalize country codes
      const normalizeCountryCode = (country) => {
        if (country.includes('Canada') || country === 'CA') return 'CA';
        if (country.includes('Mexico') || country === 'MX') return 'MX';
        if (country.includes('United States') || country.includes('USA') || country === 'US') return 'US';
        return country;
      };

      const originCode = normalizeCountryCode(formData.company_country);
      const destCode = normalizeCountryCode(formData.destination_country);

      // Calculate trade flow type (e.g., "CA→MX", "MX→US")
      const tradeFlowType = `${originCode}→${destCode}`;

      // Determine tariff cache strategy based on destination
      const cacheStrategy = destCode === 'MX' ? 'database' :
                           destCode === 'CA' ? 'ai_90day' :
                           destCode === 'US' ? 'ai_24hr' : 'ai_24hr';

      // Update form data with calculated values
      updateFormData('trade_flow_type', tradeFlowType);
      updateFormData('tariff_cache_strategy', cacheStrategy);
    }
  }, [formData.company_country, formData.destination_country, updateFormData]);

  // Clear validation error when user starts filling in fields
  useEffect(() => {
    if (attemptedSubmit && validationError) {
      // Check if any previously missing fields are now filled
      const stillMissing = [];
      if (!formData.company_name) stillMissing.push('Company Name');
      if (!formData.business_type) stillMissing.push('Business Type');
      // certifier_type removed - auto-calculated from business_type, not used by AI
      if (!formData.industry_sector) stillMissing.push('Industry Sector');
      if (!formData.company_address) stillMissing.push('Company Address');
      if (!formData.company_country) stillMissing.push('Company Country');
      if (!formData.destination_country) stillMissing.push('Destination Market');  // NEW: Required
      if (!formData.contact_person) stillMissing.push('Contact Person');
      if (!formData.contact_phone) stillMissing.push('Contact Phone');
      if (!formData.contact_email) stillMissing.push('Contact Email');
      if (!formData.trade_volume) stillMissing.push('Annual Trade Volume');

      // If all fields are now filled, clear the error
      if (stillMissing.length === 0) {
        setValidationError(null);
      }
    }
  }, [formData, attemptedSubmit, validationError]);

  const isNextDisabled = !isClient || !formData.company_name ||
                        !formData.business_type ||
                        // certifier_type removed - auto-calculated, not needed for validation
                        !formData.industry_sector ||
                        !formData.trade_volume ||
                        !formData.company_address ||
                        !formData.company_country ||
                        !formData.destination_country ||  // NEW: Required for tariff intelligence
                        !formData.contact_person ||
                        !formData.contact_phone ||
                        !formData.contact_email;

  const handleContinue = async () => {
    setAttemptedSubmit(true);

    // Check which required fields are missing (ALL 13 fields)
    const missingFields = [];
    if (!formData.company_name) missingFields.push('Company Name');
    if (!formData.business_type) missingFields.push('Business Type');
    // certifier_type removed - auto-calculated from business_type, not used by AI
    if (!formData.industry_sector) missingFields.push('Industry Sector');
    if (!formData.company_address) missingFields.push('Company Address');
    if (!formData.company_country) missingFields.push('Company Country');
    if (!formData.tax_id) missingFields.push('Tax ID / EIN');
    if (!formData.contact_person) missingFields.push('Contact Person');
    if (!formData.contact_phone) missingFields.push('Contact Phone');
    if (!formData.contact_email) missingFields.push('Contact Email');
    if (!formData.trade_volume) missingFields.push('Annual Trade Volume');
    if (!formData.supplier_country) missingFields.push('Primary Supplier Country');
    if (!formData.destination_country) missingFields.push('Destination Market');

    if (missingFields.length > 0) {
      setValidationError(missingFields);
      return;
    }

    setValidationError(null);

    // ✅ Save to database before proceeding (1 save instead of 150+)
    setIsSaving(true);
    const saveResult = await saveWorkflowToDatabase();
    setIsSaving(false);

    if (saveResult.success) {
      console.log('✅ Company data saved, proceeding to components step');
      onNext();
    } else {
      console.warn('⚠️ Save failed but proceeding anyway (localStorage has data)');
      onNext(); // Still proceed - localStorage has the data
    }
  };

  const getCountryCode = (countryName) => {
    const codes = SYSTEM_CONFIG.countries.codeMappings;
    return codes[countryName] || countryName.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <div className="dashboard-actions">
        <div className="dashboard-actions-left">
          <h2 className="form-section-title">Company Information</h2>
        </div>
        {onNewAnalysis && (
          <div className="dashboard-actions-right">
            <button
              onClick={onNewAnalysis}
              className="btn-primary"
            >
              + New Analysis
            </button>
          </div>
        )}
      </div>
      <p className="form-section-description">Step 1 of 3 - Business profile for compliance analysis</p>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label required">Company Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.company_name || ''}
              onChange={(e) => updateFormData('company_name', e.target.value)}
              placeholder="Enter legal entity name"
              required
            />
            <div className="form-help">Legal name as registered with authorities</div>
          </div>

          <div className="form-group">
            <label className="form-label required">Business Type</label>
            <select
              className={`form-select ${formData.business_type ? 'has-value' : ''}`}
              value={formData.business_type || ''}
              onChange={(e) => {
                const newBusinessType = e.target.value;
                updateFormData('business_type', newBusinessType);

                // Automatically set certifier type based on business type
                if (newBusinessType) {
                  const certifierType = mapBusinessTypeToCertifierType(newBusinessType);
                  updateFormData('certifier_type', certifierType);
                }
              }}
              required
            >
              <option value="">Select business role</option>
              {BUSINESS_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label_with_cert}
                </option>
              ))}
            </select>
            <div className="form-help">USMCA certificate type shown first, your business role in parentheses</div>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label required">Industry Sector</label>
            <select
              className={`form-select ${formData.industry_sector ? 'has-value' : ''}`}
              value={formData.industry_sector || ''}
              onChange={(e) => updateFormData('industry_sector', e.target.value)}
              required
            >
              <option value="">Select industry</option>
              {isLoadingOptions ? (
                <option disabled>Loading industries...</option>
              ) : (
                dropdownOptions.businessTypes?.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                )) || []
              )}
            </select>
            <div className="form-help">Primary product category for HS classification</div>
          </div>

          <div className="form-group">
            <label className="form-label required">Tax ID / EIN</label>
            <input
              type="text"
              className="form-input"
              value={formData.tax_id || ''}
              onChange={(e) => updateFormData('tax_id', e.target.value)}
              placeholder="Tax identification number"
              required
            />
            <div className="form-help">Federal tax ID or EIN (required for certificates)</div>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label required">Company Address</label>
            <input
              type="text"
              className="form-input"
              value={formData.company_address || ''}
              onChange={(e) => updateFormData('company_address', e.target.value)}
              placeholder="Street, City, State/Province"
              required
            />
            <div className="form-help">Physical business address</div>
          </div>

          <div className="form-group">
            <label className="form-label required">Company Country</label>
            <select
              className={`form-select ${formData.company_country ? 'has-value' : ''}`}
              value={formData.company_country || ''}
              onChange={(e) => updateFormData('company_country', e.target.value)}
              required
            >
              <option value="">Select country</option>
              {dropdownOptions.usmcaCountries?.map(country => {
                const countryCode = country.code || country.value;
                const countryName = country.label || country.name;
                return (
                  <option key={`usmca-${countryCode}`} value={countryCode}>{countryName}</option>
                );
              })}
              <optgroup label="Other Countries">
                {dropdownOptions.countries?.filter(country => {
                  const code = typeof country === 'string' ? getCountryCode(country) : country.code || country.value;
                  return !SYSTEM_CONFIG.countries.usmcaCountries.includes(code);
                }).map((country, index) => {
                  const countryName = typeof country === 'string' ? country : country.name || country.label;
                  const countryCode = typeof country === 'string' ? getCountryCode(country) : country.code || country.value;
                  return (
                    <option key={`other-${countryCode}-${index}`} value={countryCode}>{countryName}</option>
                  );
                })}
              </optgroup>
            </select>
            <div className="form-help">Country where your company is registered</div>
          </div>
        </div>

        <h3 className="form-section-title">Contact Information</h3>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label required">Contact Person</label>
            <input
              type="text"
              className="form-input"
              value={formData.contact_person || ''}
              onChange={(e) => updateFormData('contact_person', e.target.value)}
              placeholder="Primary contact name"
              required
            />
            <div className="form-help">Trade compliance contact</div>
          </div>

          <div className="form-group">
            <label className="form-label required">Contact Phone</label>
            <input
              type="tel"
              className="form-input"
              value={formData.contact_phone || ''}
              onChange={(e) => updateFormData('contact_phone', e.target.value)}
              placeholder="(214) 555-0147"
              required
            />
            <div className="form-help">Business phone number</div>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label required">Contact Email</label>
            <input
              type="email"
              className="form-input"
              value={formData.contact_email || ''}
              onChange={(e) => updateFormData('contact_email', e.target.value)}
              placeholder="compliance@company.com"
              required
            />
            <div className="form-help">Email for official correspondence</div>
          </div>

          <div className="form-group">
            <label className="form-label required">Annual Trade Volume (US $)</label>
            <div className="professional-input-group">
              <input
                type="text"
                className="form-input"
                value={formData.trade_volume ? formData.trade_volume.toLocaleString('en-US') : ''}
                onChange={(e) => {
                  // ✅ FIXED: Parse as number immediately, remove comma formatting
                  // Store numeric value in formData, display with commas in UI
                  const numericValue = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
                  updateFormData('trade_volume', isNaN(numericValue) ? null : numericValue);
                }}
                placeholder="4,800,000"
                required
              />
            </div>
            <div className="form-help">Estimated annual import/export value (numbers only)</div>
          </div>
        </div>

        <h3 className="form-section-title">Trade Routes</h3>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label required">Primary Supplier Country</label>
            <select
              className={`form-select ${formData.supplier_country ? 'has-value' : ''}`}
              value={formData.supplier_country || ''}
              onChange={(e) => updateFormData('supplier_country', e.target.value)}
              required
            >
              {isLoadingOptions ? (
                <option disabled>Loading...</option>
              ) : (
                <>
                  <option value="">Select supplier country</option>
                  {dropdownOptions.countries?.map((country, idx) => {
                    const countryName = typeof country === 'string' ? country : country.name || country.label;
                    const countryCode = typeof country === 'string' ? getCountryCode(country) : country.code || country.value;
                    return (
                      <option key={`supplier-${countryCode}-${idx}`} value={countryCode}>{countryName}</option>
                    );
                  })}
                </>
              )}
            </select>
            <div className="form-help">Where you purchase raw materials or components from (required for AI analysis)</div>
          </div>

          <div className="form-group">
            <label className="form-label required">Destination Market</label>
            <select
              className={`form-select ${formData.destination_country ? 'has-value' : ''}`}
              value={formData.destination_country || ''}
              onChange={(e) => updateFormData('destination_country', e.target.value)}
              required
            >
              <option value="">Select destination country</option>
              {dropdownOptions.usmcaCountries?.map(country => {
                const countryCode = country.code || country.value;
                const countryName = country.label || country.name;
                return (
                  <option key={`dest-usmca-${countryCode}`} value={countryCode}>{countryName}</option>
                );
              })}
              <optgroup label="Other Markets">
                {dropdownOptions.countries?.filter(country => {
                  const code = typeof country === 'string' ? getCountryCode(country) : country.code || country.value;
                  return !SYSTEM_CONFIG.countries.usmcaCountries.includes(code);
                }).map((country, index) => {
                  const countryName = typeof country === 'string' ? country : country.name || country.label;
                  const countryCode = typeof country === 'string' ? getCountryCode(country) : country.code || country.value;
                  return (
                    <option key={`dest-other-${countryCode}-${index}`} value={countryCode}>{countryName}</option>
                  );
                })}
              </optgroup>
            </select>
            <div className="form-help">Where goods are exported to (determines tariff rates and compliance rules)</div>
          </div>
        </div>

        <div className="alert alert-info">
          <div className="alert-icon">
            
          </div>
          <div className="alert-content">
            <div className="alert-title">Enterprise Data Security</div>
            All company information is encrypted and protected in compliance with enterprise data governance requirements. Your data remains confidential and is used solely for USMCA compliance analysis.
          </div>
        </div>

        {/* Validation Error Notice - Right above button */}
        {validationError && validationError.length > 0 && (
          <div className="validation-error-notice">
            <div className="validation-error-content">
              <span className="validation-error-icon">⚠️</span>
              <div className="validation-error-body">
                <h4 className="validation-error-title">
                  Please Complete Required Fields
                </h4>
                <p className="validation-error-description">
                  The following fields are missing:
                </p>
                <ul className="validation-error-list">
                  {validationError.map((field, index) => (
                    <li key={index}>
                      <strong>{field}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-actions">
          <div className="dashboard-actions-left">
            {isClient && !validationError && !isNextDisabled && (
              <span className="form-help success">
                ✓ All required fields completed
              </span>
            )}
          </div>
          <div className="dashboard-actions-right">
            <button
              onClick={handleContinue}
              className="btn-primary"
              disabled={isSaving}
            >
              {isSaving ? '💾 Saving...' : 'Continue to Product Details'}
            </button>
          </div>
        </div>
    </>
  );
}