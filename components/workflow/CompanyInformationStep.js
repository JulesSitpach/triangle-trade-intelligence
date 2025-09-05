/**
 * CompanyInformationStep - Step 1 of USMCA workflow
 * Focused component under 150 lines
 * Using professional enterprise design system
 */

import React from 'react';
import { SYSTEM_CONFIG } from '../../config/system-config.js';

// Professional SVG icons for form fields
const Building = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
    <path d="M6 12h12"/>
    <path d="M6 16h12"/>
  </svg>
);

const Briefcase = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const Globe = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="m2 12 20 0"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const Target = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const TrendingUp = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/>
    <polyline points="16,7 22,7 22,13"/>
  </svg>
);

const Shield = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 13c0 5-3.5 7.5-8 7.5s-8-2.5-8-7.5c0-1 0-3 0-3s0-2 8-2 8 1 8 2 0 2 0 3"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

export default function CompanyInformationStep({
  formData,
  updateFormData,
  dropdownOptions,
  isLoadingOptions,
  onNext,
  isStepValid
}) {
  const isNextDisabled = !formData.company_name || 
                        !formData.business_type || 
                        !formData.trade_volume;

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
              <Building className="icon-sm" />
              Company Name
            </label>
            <div className="professional-input-group">
              <input
                type="text"
                className="form-input"
                value={formData.company_name || ''}
                onChange={(e) => updateFormData('company_name', e.target.value)}
                placeholder="Enter your legal entity name"
                required
              />
            </div>
            <div className="form-help">
              Legal entity name as registered with authorities
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">
              <Briefcase className="icon-sm" />
              Business Type
            </label>
            <div className="professional-input-group">
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
            </div>
            <div className="form-help">
              Primary business activity for accurate trade classification
            </div>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">
              <Globe className="icon-sm" />
              Primary Supplier Country
            </label>
            <div className="professional-input-group">
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
            </div>
            <div className="form-help">
              Country where products originate
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Target className="icon-sm" />
              Destination Market
            </label>
            <div className="professional-input-group">
              <select
                className="form-select"
                value={formData.destination_country || SYSTEM_CONFIG.countries.defaultDestination}
                onChange={(e) => updateFormData('destination_country', e.target.value)}
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="MX">Mexico</option>
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
            </div>
            <div className="form-help">
              Where will the finished product be imported?
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label required">
            <TrendingUp className="icon-sm" />
            Annual Trade Volume
          </label>
          <div className="professional-input-group">
            <select
              className="form-select"
              value={formData.trade_volume || ''}
              onChange={(e) => updateFormData('trade_volume', e.target.value)}
              required
            >
              <option value="">Select your annual import volume</option>
              {isLoadingOptions ? (
                <option disabled>Loading volume options...</option>
              ) : (
                dropdownOptions.importVolumes?.map(volume => (
                  <option key={volume.value} value={volume.value}>
                    {volume.label}
                  </option>
                )) || []
              )}
            </select>
          </div>
          <div className="form-help">
            Estimated annual import value for compliance assessment
          </div>
        </div>

        <div className="alert alert-info">
          <div className="alert-icon">
            <Shield className="icon-md" />
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
              onClick={() => onNext('default')}
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