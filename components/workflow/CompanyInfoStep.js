/**
 * Company Information Step - Professional Certificate Completion
 * Pre-populates known data, intelligently collects missing information
 * NO HARDCODED COMPANY DATA - All from user input and database
 */

import React, { useState, useEffect } from 'react';
// Custom SVG icons to avoid lucide-react ESM import issues
const Building = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
    <path d="M6 12h4v6h4v-6h4"/>
  </svg>
);

const MapPin = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const Phone = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const Mail = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const CreditCard = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect width="20" height="14" x="2" y="5" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);

const AlertCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const CheckCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);

const Info = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);
import { SAFE_ENDPOINTS, SAFE_COUNTRIES } from '../../config/safe-config.js';

export default function CompanyInfoStep({ data, onChange, validation }) {
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
    <div className="bg-gray-50 rounded-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <IconComponent className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const renderValidationMessage = (field) => {
    if (!validation.errors) return null;
    const error = validation.errors.find(e => e.includes(field));
    if (!error) return null;

    return (
      <div className="flex items-center mt-1 text-sm text-red-600">
        <AlertCircle className="w-4 h-4 mr-1" />
        {error}
      </div>
    );
  };

  const renderInputField = (label, field, type = 'text', placeholder, required = false, helpText = null) => {
    const value = data[field] || '';
    const hasError = validation.errors?.some(e => e.toLowerCase().includes(field.toLowerCase().replace('_', ' ')));

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={type}
          value={value}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          placeholder={placeholder}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 
            ${hasError 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
          `}
        />
        {helpText && (
          <div className="flex items-center mt-1 text-xs text-gray-500">
            <Info className="w-3 h-3 mr-1" />
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
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={value}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 
            ${hasError 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
          `}
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
    <div className="space-y-6">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-center mb-2">
          <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-medium text-blue-900">Professional Certificate Completion</span>
        </div>
        <p className="text-sm text-blue-700">
          Complete accurate company information for both exporter and importer. 
          All fields marked with * are required for USMCA certificate generation.
        </p>
      </div>

      {/* Exporter Information */}
      {renderFormSection('Exporter Information', Building, (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="space-y-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <Info className="w-4 h-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                Importer information may be completed later if not known at time of export
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <h4 className="font-medium text-red-900">Please complete the following:</h4>
          </div>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success State */}
      {validation.isValid && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-medium text-green-900">Company information complete</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            All required company information has been provided. You can proceed to the next step.
          </p>
        </div>
      )}
    </div>
  );
}