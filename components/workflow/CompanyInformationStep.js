/**
 * CompanyInformationStep - Step 1 of USMCA workflow
 * Focused component under 150 lines
 * Using professional enterprise design system
 */

import React from 'react';

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
    const codes = {
      'China': 'CN', 'Mexico': 'MX', 'Canada': 'CA', 'United States': 'US',
      'India': 'IN', 'Vietnam': 'VN', 'Germany': 'DE', 'Japan': 'JP'
    };
    return codes[countryName] || countryName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="content-card">
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="content-card-title">
          Company Information
        </h2>
        <p className="content-card-description">
          Step 1 of 3 - Establish your business profile for compliance analysis
        </p>
      </div>
        
        <div className="form-group">
          <label className="form-label">
            Company Name <span className="text-red">*</span>
          </label>
          <input
            type="text"
            className={`form-input ${!formData.company_name ? 'form-input-error' : 'form-input-success'}`}
            value={formData.company_name}
            onChange={(e) => updateFormData('company_name', e.target.value)}
            placeholder="Enter your legal entity name"
            required
          />
          <p className="form-help-text">
            Legal entity name as registered with authorities
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">
            Business Type <span className="text-red">*</span>
          </label>
          <select
            className={`form-select ${!formData.business_type ? 'form-input-error' : 'form-input-success'}`}
            value={formData.business_type}
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
          <p className="form-help-text">
            Primary business activity for accurate trade classification
          </p>
        </div>

        <div className="grid-2-cols">
          <div className="form-group">
            <label className="form-label">
              Primary Supplier Country
            </label>
            <select
              className="form-select"
              value={formData.supplier_country}
              onChange={(e) => updateFormData('supplier_country', e.target.value)}
            >
              {isLoadingOptions ? (
                <option disabled>Loading...</option>
              ) : (
                <>
                  <option value="">Select primary supplier country</option>
                  {dropdownOptions.countries?.map(country => {
                    const countryName = typeof country === 'string' ? country : country.label;
                    const countryCode = typeof country === 'string' ? getCountryCode(country) : country.value;
                    return (
                      <option key={countryCode} value={countryCode}>
                        {countryName}
                      </option>
                    );
                  })}
                </>
              )}
            </select>
            <p className="text-muted">
              Country where products originate
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Destination Market
            </label>
            <select
              className="form-select"
              value={formData.destination_country || 'US'}
              onChange={(e) => updateFormData('destination_country', e.target.value)}
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="MX">Mexico</option>
              <optgroup label="Other Markets">
                {dropdownOptions.countries?.filter(country => {
                  const code = typeof country === 'string' ? getCountryCode(country) : country.value;
                  return !['US', 'CA', 'MX'].includes(code);
                }).map(country => {
                  const countryName = typeof country === 'string' ? country : country.label;
                  const countryCode = typeof country === 'string' ? getCountryCode(country) : country.value;
                  return (
                    <option key={countryCode} value={countryCode}>
                      {countryName}
                    </option>
                  );
                })}
              </optgroup>
            </select>
            <p className="text-muted">
              Where will the finished product be imported?
            </p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Annual Trade Volume <span className="text-red">*</span>
          </label>
          <select
            className={`form-select ${!formData.trade_volume ? 'form-input-error' : 'form-input-success'}`}
            value={formData.trade_volume}
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
          <p className="form-help-text">
            Estimated annual import value for compliance assessment
          </p>
        </div>

        <div className="form-actions">
          <div className="form-security-notice">
            <span className="trust-icon">🔒</span>
            <span className="form-help-text">Your information is encrypted and secure</span>
          </div>
          <button 
            onClick={() => onNext('default')}
            className={`btn-primary btn-large ${isNextDisabled ? 'btn-secondary' : ''}`}
            disabled={isNextDisabled}
          >
            Continue to Product Details →
          </button>
        </div>
    </div>
  );
}