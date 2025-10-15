/**
 * CompanyInformationStep - Step 1 of USMCA workflow
 * Focused component under 150 lines
 * Using professional enterprise design system
 */

import React, { useState, useEffect } from 'react';
import { SYSTEM_CONFIG } from '../../config/system-config.js';
import { BUSINESS_TYPES } from '../../config/business-types.js';

// Professional SVG icons for form fields
// Icons removed - no longer using icon placeholders

export default function CompanyInformationStep({
  formData,
  updateFormData,
  dropdownOptions,
  isLoadingOptions,
  onNext,
  isStepValid,
  onNewAnalysis
}) {
  // Fix hydration mismatch by using state for client-side calculations
  const [isClient, setIsClient] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Clear validation error when user starts filling in fields
  useEffect(() => {
    if (attemptedSubmit && validationError) {
      // Check if any previously missing fields are now filled
      const stillMissing = [];
      if (!formData.company_name) stillMissing.push('Company Name');
      if (!formData.business_type) stillMissing.push('Business Type');
      if (!formData.industry_sector) stillMissing.push('Industry Sector');
      if (!formData.company_address) stillMissing.push('Company Address');
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
                        !formData.industry_sector ||
                        !formData.trade_volume ||
                        !formData.company_address ||
                        !formData.contact_person ||
                        !formData.contact_phone ||
                        !formData.contact_email;

  const handleContinue = () => {
    setAttemptedSubmit(true);

    // Check which required fields are missing
    const missingFields = [];
    if (!formData.company_name) missingFields.push('Company Name');
    if (!formData.business_type) missingFields.push('Business Type');
    if (!formData.industry_sector) missingFields.push('Industry Sector');
    if (!formData.company_address) missingFields.push('Company Address');
    if (!formData.contact_person) missingFields.push('Contact Person');
    if (!formData.contact_phone) missingFields.push('Contact Phone');
    if (!formData.contact_email) missingFields.push('Contact Email');
    if (!formData.trade_volume) missingFields.push('Annual Trade Volume');

    if (missingFields.length > 0) {
      setValidationError(missingFields);
      return;
    }

    setValidationError(null);
    onNext();
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
              onChange={(e) => updateFormData('business_type', e.target.value)}
              required
            >
              <option value="">Select business role</option>
              {BUSINESS_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <div className="form-help">Your role in the supply chain</div>
          </div>

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
            <label className="form-label">Tax ID / EIN</label>
            <input
              type="text"
              className="form-input"
              value={formData.tax_id || ''}
              onChange={(e) => updateFormData('tax_id', e.target.value)}
              placeholder="Tax identification number"
            />
            <div className="form-help">Federal tax ID or EIN</div>
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
                value={formData.trade_volume || ''}
                onChange={(e) => updateFormData('trade_volume', e.target.value)}
                placeholder="4,800,000"
                required
              />
            </div>
            <div className="form-help">Estimated annual import value</div>
          </div>
        </div>

        <h3 className="form-section-title">Trade Routes</h3>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Primary Supplier Country</label>
            <select
              className={`form-select ${formData.supplier_country ? 'has-value' : ''}`}
              value={formData.supplier_country || ''}
              onChange={(e) => updateFormData('supplier_country', e.target.value)}
            >
              {isLoadingOptions ? (
                <option disabled>Loading...</option>
              ) : (
                <>
                  <option value="">Select supplier country</option>
                  {dropdownOptions.countries?.map(country => {
                    const countryName = typeof country === 'string' ? country : country.name || country.label;
                    const countryCode = typeof country === 'string' ? getCountryCode(country) : country.code || country.value;
                    return (
                      <option key={countryCode} value={countryCode}>{countryName}</option>
                    );
                  })}
                </>
              )}
            </select>
            <div className="form-help">Where products originate</div>
          </div>

          <div className="form-group">
            <label className="form-label">Destination Market</label>
            <select
              className="form-select"
              value={formData.destination_country || SYSTEM_CONFIG.countries.defaultDestination}
              onChange={(e) => updateFormData('destination_country', e.target.value)}
            >
              {dropdownOptions.usmcaCountries?.map(country => {
                const countryCode = country.code || country.value;
                const countryName = country.label || country.name;
                return (
                  <option key={countryCode} value={countryCode}>{countryName}</option>
                );
              })}
              <optgroup label="Other Markets">
                {dropdownOptions.countries?.filter(country => {
                  const code = typeof country === 'string' ? getCountryCode(country) : country.code || country.value;
                  return !SYSTEM_CONFIG.countries.usmcaCountries.includes(code);
                }).map(country => {
                  const countryName = typeof country === 'string' ? country : country.name || country.label;
                  const countryCode = typeof country === 'string' ? getCountryCode(country) : country.code || country.value;
                  return (
                    <option key={countryCode} value={countryCode}>{countryName}</option>
                  );
                })}
              </optgroup>
            </select>
            <div className="form-help">Import destination country</div>
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
            >
              Continue to Product Details
            </button>
          </div>
        </div>
    </>
  );
}