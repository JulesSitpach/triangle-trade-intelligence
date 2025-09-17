/**
 * CompanyInformationStep - Step 1 of USMCA workflow
 * Focused component under 150 lines
 * Using professional enterprise design system
 */

import React, { useState, useEffect } from 'react';
import { SYSTEM_CONFIG } from '../../config/system-config.js';

// Professional SVG icons for form fields
// Icons removed - no longer using icon placeholders

export default function CompanyInformationStep({
  formData,
  updateFormData,
  dropdownOptions,
  isLoadingOptions,
  onNext,
  isStepValid
}) {
  // Fix hydration mismatch by using state for client-side calculations
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const isNextDisabled = !isClient || !formData.company_name || 
                        !formData.business_type || 
                        !formData.trade_volume ||
                        !formData.company_address ||
                        !formData.contact_person ||
                        !formData.contact_phone ||
                        !formData.contact_email;

  const getCountryCode = (countryName) => {
    const codes = SYSTEM_CONFIG.countries.codeMappings;
    return codes[countryName] || countryName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">USMCA Compliance Analysis</h1>
        <p className="dashboard-subtitle">Professional Trade Classification & Certificate Generation Platform</p>
      </div>
      
      <div className="form-section">
        <h2 className="form-section-title">
          Company Information
        </h2>
        <p className="form-section-description">
          Step 1 of 3 - Establish your business profile for compliance analysis
        </p>
        
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label required">
              Company Name
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.company_name || ''}
              onChange={(e) => {
                console.log('Input onChange fired:', e.target.value);
                updateFormData('company_name', e.target.value);
              }}
              placeholder="Enter your legal entity name"
              required
            />
            <div className="form-help">
              Legal entity name as registered with authorities
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">
              Business Type
            </label>
            <select
                className="form-select"
                value={formData.business_type || ''}
                onChange={(e) => updateFormData('business_type', e.target.value)}
                required
              >
                <option value="">Select your primary business activity</option>
                {isLoadingOptions ? (
                  <option disabled>Loading business types...</option>
                ) : (
                  dropdownOptions.businessTypes?.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  )) || []
                )}
            </select>
            <div className="form-help">
              Primary business activity for accurate trade classification
            </div>
          </div>
        </div>

        {/* Company Contact & Address Information */}
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label required">
              Company Address
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.company_address || ''}
              onChange={(e) => updateFormData('company_address', e.target.value)}
              placeholder="Street address, City, State/Province"
              required
            />
            <div className="form-help">
              Physical business address for certificate documentation
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Tax ID / EIN
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.tax_id || ''}
              onChange={(e) => updateFormData('tax_id', e.target.value)}
              placeholder="Tax identification number"
            />
            <div className="form-help">
              Federal tax ID or employer identification number
            </div>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label required">
              Contact Person
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.contact_person || ''}
              onChange={(e) => updateFormData('contact_person', e.target.value)}
              placeholder="Primary contact for trade matters"
              required
            />
            <div className="form-help">
              Person responsible for trade compliance
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">
              Contact Phone
            </label>
            <input
              type="tel"
              className="form-input"
              value={formData.contact_phone || ''}
              onChange={(e) => updateFormData('contact_phone', e.target.value)}
              placeholder="(214) 555-0147"
              required
            />
            <div className="form-help">
              Business phone number for certificate documentation
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label required">
            Contact Email
          </label>
          <input
            type="email"
            className="form-input"
            value={formData.contact_email || ''}
            onChange={(e) => updateFormData('contact_email', e.target.value)}
            placeholder="compliance@fashionforward.com"
            required
          />
          <div className="form-help">
            Business email for official correspondence and certificate delivery
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">
              Primary Supplier Country
            </label>
            <select
                className="form-select"
                value={formData.supplier_country || ''}
                onChange={(e) => updateFormData('supplier_country', e.target.value)}
              >
                {isLoadingOptions ? (
                  <option disabled>Loading...</option>
                ) : (
                  <>
                    <option value="">Select primary supplier country</option>
                    {dropdownOptions.countries?.map(country => {
                      const countryName = typeof country === 'string' ? country : country.name || country.label;
                      const countryCode = typeof country === 'string' ? getCountryCode(country) : country.code || country.value;
                      return (
                        <option key={countryCode} value={countryCode}>
                          {countryName}
                        </option>
                      );
                    })}
                  </>
                )}
            </select>
            <div className="form-help">
              Country where products originate
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Destination Market
            </label>
            <select
                className="form-select"
                value={formData.destination_country || SYSTEM_CONFIG.countries.defaultDestination}
                onChange={(e) => updateFormData('destination_country', e.target.value)}
              >
                {dropdownOptions.usmcaCountries?.map(country => {
                  const countryCode = country.code || country.value;
                  const countryName = country.label || country.name;
                  return (
                    <option key={countryCode} value={countryCode}>
                      {countryName}
                    </option>
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
                      <option key={countryCode} value={countryCode}>
                        {countryName}
                      </option>
                    );
                  })}
                </optgroup>
            </select>
            <div className="form-help">
              Where will the finished product be imported?
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label required">
            Annual Trade Volume
          </label>
          <div className="professional-input-group">
            <div className="input-with-prefix">
              <span className="input-prefix">$</span>
              <input
                type="text"
                className="form-input"
                value={formData.trade_volume || ''}
                onChange={(e) => updateFormData('trade_volume', e.target.value)}
                placeholder="4,800,000 or 4800000"
                required
              />
            </div>
          </div>
          <div className="form-help">
            Enter your estimated annual import value (accepts commas: $4,800,000 or plain: $4800000)
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

        <div className="dashboard-actions">
          <div className="dashboard-actions-left">
            <span className="form-help">Step 1 of 3 - All required fields must be completed</span>
          </div>
          <div className="dashboard-actions-right">
            <button 
              onClick={() => onNext()}
              className="btn-primary"
              disabled={isNextDisabled}
            >
              Continue to Product Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}