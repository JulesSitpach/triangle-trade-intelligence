/**
 * Company Information Step - Professional Certificate Completion
 * Pre-populates known data, intelligently collects missing information
 * NO HARDCODED COMPANY DATA - All from user input and database
 * Updated with null safety
 */

import React, { useState, useEffect } from 'react';
// Custom SVG icons to avoid lucide-react ESM import issues
const Building = ({ className }) => (
  <span className={className}>[building]</span>
);

const MapPin = ({ className }) => (
  <span className={className}>[location]</span>
);

const Phone = ({ className }) => (
  <span className={className}>[phone]</span>
);

const Mail = ({ className }) => (
  <span className={className}>[mail]</span>
);

const CreditCard = ({ className }) => (
  <span className={className}>[credit-card]</span>
);

const AlertCircle = ({ className }) => (
  <span className={className}>[alert]</span>
);

const CheckCircle = ({ className }) => (
  <span className={className}>[check]</span>
);

const Info = ({ className }) => (
  <span className={className}>[info]</span>
);
import { SAFE_ENDPOINTS, SAFE_COUNTRIES } from '../../config/safe-config.js';

export default function CompanyInfoStep({ data = {}, onChange, validation = { errors: [] } }) {
  const [countries, setCountries] = useState([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [addressSuggestions, setAddressSuggestions] = useState({
    exporter: [],
    importer: []
  });

  // Load countries from database
  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      setIsLoadingCountries(true);
      const response = await fetch(`${SAFE_ENDPOINTS.dropdownOptions}?category=countries`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCountries(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading countries:', error);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  const handleFieldChange = (field, value) => {
    onChange({ [field]: value });
  };

  const validateTaxId = (taxId, country) => {
    if (!taxId) return null;
    
    // Basic validation patterns for common countries
    const patterns = {
      [SAFE_COUNTRIES.US]: /^\d{2}-\d{7}$|^\d{9}$/,
      [SAFE_COUNTRIES.CA]: /^\d{9}RT\d{4}$|^\d{15}$/,
      [SAFE_COUNTRIES.MX]: /^[A-Z]{3,4}\d{6}[A-Z\d]{3}$/
    };

    const pattern = patterns[country];
    if (pattern && !pattern.test(taxId.replace(/\s+/g, ''))) {
      return `Invalid ${country} tax ID format`;
    }
    return null;
  };

  const renderFormSection = (title, IconComponent, children) => (
    <div className="form-section">
      <div className="form-section-header">
        <IconComponent className="icon-md status-info" />
        <h3 className="form-section-title">{title}</h3>
      </div>
      {children}
    </div>
  );

  const renderValidationMessage = (field) => {
    if (!validation.errors) return null;
    const error = validation.errors.find(e => e.includes(field));
    if (!error) return null;

    return (
      <div className="form-error">
        <AlertCircle className="icon-sm" />
        {error}
      </div>
    );
  };

  const renderInputField = (label, field, type = 'text', placeholder, required = false, helpText = null) => {
    const value = (data && data[field]) || '';
    const hasError = validation?.errors?.some(e => e.toLowerCase().includes(field.toLowerCase().replace('_', ' ')));

    return (
      <div className="form-group">
        <label className={`form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
        <input
          type={type}
          value={value}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          placeholder={placeholder}
          className={`form-input ${
            hasError ? 'form-input-error' : ''
          }`}
        />
        {helpText && (
          <div className="form-help">
            <Info className="icon-xs" />
            {helpText}
          </div>
        )}
        {renderValidationMessage(field)}
      </div>
    );
  };

  const renderCountrySelect = (label, field, required = false) => {
    const value = data[field] || '';
    const hasError = validation.errors?.some(e => e.toLowerCase().includes(field.toLowerCase().replace('_', ' ')));

    return (
      <div className="form-group">
        <label className={`form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
        <select
          value={value}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          className={`form-select ${
            hasError ? 'form-input-error' : ''
          }`}
        >
          <option value="">Select country...</option>
          {countries.map(country => (
            <option key={country.value} value={country.value}>
              {country.label}
            </option>
          ))}
        </select>
        {renderValidationMessage(field)}
      </div>
    );
  };

  return (
    <div className="element-spacing">
      <div className="alert alert-info">
        <div className="alert-icon">
          <CheckCircle className="icon-md" />
        </div>
        <div className="alert-content">
          <div className="alert-title">Professional Certificate Completion</div>
          <div className="text-body">
            Complete accurate company information for both exporter and importer. 
            All fields marked with * are required for USMCA certificate generation.
          </div>
        </div>
      </div>

      {/* Exporter Information */}
      {renderFormSection('Exporter Information', Building, (
        <div className="form-grid-2">
          {renderInputField(
            'Company Name',
            'exporter_name',
            'text',
            'Enter exporter company name',
            true,
            'Legal name as it appears on business registration'
          )}
          
          {renderInputField(
            'Business Address',
            'exporter_address',
            'text',
            'Enter complete business address',
            true,
            'Street address, city, state/province, postal code'
          )}
          
          {renderCountrySelect('Country', 'exporter_country', true)}
          
          {renderInputField(
            'Tax ID / Business Number',
            'exporter_tax_id',
            'text',
            'Enter tax identification number',
            false,
            'Format varies by country (e.g., US: 12-3456789, CA: 123456789RT0001)'
          )}
          
          {renderInputField(
            'Phone Number',
            'exporter_phone',
            'tel',
            '+1 (555) 123-4567',
            false
          )}
          
          {renderInputField(
            'Email Address',
            'exporter_email',
            'email',
            'contact@company.com',
            false
          )}
        </div>
      ))}

      {/* Importer Information */}
      {renderFormSection('Importer Information', MapPin, (
        <div className="element-spacing">
          <div className="alert alert-warning">
            <div className="alert-icon">
              <Info className="icon-sm" />
            </div>
            <div className="alert-content">
              <div className="text-body">
                Importer information may be completed later if not known at time of export
              </div>
            </div>
          </div>
          
          <div className="form-grid-2">
            {renderInputField(
              'Importer Company Name',
              'importer_name',
              'text',
              'Enter importer company name',
              true,
              'Name of the importing company'
            )}
            
            {renderInputField(
              'Importer Address',
              'importer_address',
              'text',
              'Enter importer address',
              true,
              'Complete address including postal code'
            )}
            
            {renderCountrySelect('Importer Country', 'importer_country', false)}
            
            {renderInputField(
              'Importer Tax ID',
              'importer_tax_id',
              'text',
              'Enter importer tax ID if known',
              false
            )}
          </div>
        </div>
      ))}

      {/* Validation Summary */}
      {validation.errors && validation.errors.length > 0 && (
        <div className="alert alert-error">
          <div className="alert-icon">
            <AlertCircle className="icon-md" />
          </div>
          <div className="alert-content">
            <div className="alert-title">Please complete the following:</div>
            <ul className="validation-errors">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Success State */}
      {validation.isValid && (
        <div className="alert alert-success">
          <div className="alert-icon">
            <CheckCircle className="icon-md" />
          </div>
          <div className="alert-content">
            <div className="alert-title">Company information complete</div>
            <div className="text-body">
              All required company information has been provided. You can proceed to the next step.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}