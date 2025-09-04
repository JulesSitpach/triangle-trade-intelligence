/**
 * Supply Chain Step - Interactive Component Origin Calculator
 * Real-time USMCA qualification calculation with visual feedback
 * NO HARDCODED SUPPLY CHAIN DATA - All from user input and database validation
 */

import React, { useState, useEffect } from 'react';
// Custom SVG icons to avoid lucide-react ESM import issues
const Route = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="6" cy="19" r="3"/>
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
    <circle cx="18" cy="5" r="3"/>
  </svg>
);

const Plus = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const Trash2 = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const Calculator = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect width="16" height="20" x="4" y="2" rx="2"/>
    <line x1="8" y1="6" x2="16" y2="6"/>
    <line x1="16" y1="14" x2="16" y2="18"/>
    <path d="M16 10h.01"/>
    <path d="M12 10h.01"/>
    <path d="M8 10h.01"/>
    <path d="M12 14h.01"/>
    <path d="M8 14h.01"/>
    <path d="M12 18h.01"/>
    <path d="M8 18h.01"/>
  </svg>
);

const CheckCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);

const AlertCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const Info = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const MapPin = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const Percent = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="5" x2="5" y2="19"/>
    <circle cx="6.5" cy="6.5" r="2.5"/>
    <circle cx="17.5" cy="17.5" r="2.5"/>
  </svg>
);

const Globe = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

export default function SupplyChainStep({ data, onChange, validation }) {
  const [countries, setCountries] = useState([]);
  const [usmcaThresholds, setUsmcaThresholds] = useState(null);
  const [qualificationResults, setQualificationResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Initialize with existing data or defaults
  const [componentOrigins, setComponentOrigins] = useState(() => {
    // If we have proper component origins data, use it
    if (data.component_origins && data.component_origins.length > 0) {
      return data.component_origins;
    }
    // Otherwise start with empty component
    return [{ origin_country: '', value_percentage: 0, description: '' }];
  });
  const [manufacturingLocation, setManufacturingLocation] = useState(
    data.manufacturing_location || ''
  );

  useEffect(() => {
    loadCountries();
    loadUsmcaThresholds();
  }, []);

  useEffect(() => {
    // Update parent data when local state changes
    onChange({
      component_origins: componentOrigins,
      manufacturing_location: manufacturingLocation,
      regional_value_content: calculateRegionalContent()
    });
  }, [componentOrigins, manufacturingLocation]);

  useEffect(() => {
    // Auto-calculate qualification when supply chain changes
    if (componentOrigins.length > 0 && manufacturingLocation) {
      calculateUSMCAQualification();
    }
  }, [componentOrigins, manufacturingLocation]);

  const loadCountries = async () => {
    try {
      const response = await fetch('/api/database-driven-dropdown-options?category=countries');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCountries(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const loadUsmcaThresholds = async () => {
    try {
      const response = await fetch('/api/trust/usmca-thresholds');
      if (response.ok) {
        const result = await response.json();
        setUsmcaThresholds(result);
      }
    } catch (error) {
      console.error('Error loading USMCA thresholds:', error);
    }
  };

  const calculateRegionalContent = () => {
    const usmcaCountries = ['US', 'CA', 'MX'];
    return componentOrigins.reduce((total, component) => {
      if (usmcaCountries.includes(component.origin_country)) {
        return total + (parseFloat(component.value_percentage) || 0);
      }
      return total;
    }, 0);
  };

  const calculateUSMCAQualification = async () => {
    setIsCalculating(true);
    try {
      const response = await fetch('/api/trust/calculate-qualification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          component_origins: componentOrigins,
          manufacturing_location: manufacturingLocation,
          hs_code: data.hs_code || ''
        })
      });

      if (response.ok) {
        const results = await response.json();
        setQualificationResults(results);
        
        if (results.qualified) {
          onChange({ 
            supply_chain_verified: true,
            qualification_results: results
          });
        }
      }
    } catch (error) {
      console.error('USMCA qualification calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const addComponentOrigin = () => {
    setComponentOrigins([
      ...componentOrigins,
      { origin_country: '', value_percentage: 0, description: '' }
    ]);
  };

  const removeComponentOrigin = (index) => {
    setComponentOrigins(componentOrigins.filter((_, i) => i !== index));
  };

  const updateComponentOrigin = (index, field, value) => {
    const updated = componentOrigins.map((component, i) => {
      if (i === index) {
        return { ...component, [field]: value };
      }
      return component;
    });
    setComponentOrigins(updated);
  };

  const getTotalPercentage = () => {
    return componentOrigins.reduce((total, component) => {
      return total + (parseFloat(component.value_percentage) || 0);
    }, 0);
  };

  const getCountryFlag = (countryCode) => {
    const usmcaCountries = ['US', 'CA', 'MX'];
    return usmcaCountries.includes(countryCode) ? '🇺🇸' : '🌍';
  };

  const renderComponentOriginForm = (component, index) => {
    const totalPercentage = getTotalPercentage();
    const isUsmcaMember = ['US', 'CA', 'MX'].includes(component.origin_country);

    return (
      <div key={index} className={`p-4 border-2 rounded-lg mb-4 ${
        isUsmcaMember ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-medium text-gray-900">Component {index + 1}</h4>
          <div className="flex items-center space-x-2">
            {isUsmcaMember && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                USMCA Member
              </span>
            )}
            {componentOrigins.length > 1 && (
              <button
                onClick={() => removeComponentOrigin(index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Origin Country <span className="text-red-500">*</span>
            </label>
            <select
              value={component.origin_country}
              onChange={(e) => updateComponentOrigin(index, 'origin_country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:border-blue-500"
            >
              <option value="">Select country...</option>
              {countries.map(country => (
                <option key={country.value} value={country.value}>
                  {getCountryFlag(country.value)} {country.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value Percentage <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={component.value_percentage}
                onChange={(e) => updateComponentOrigin(index, 'value_percentage', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:border-blue-500"
              />
              <Percent className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            {totalPercentage > 100 && (
              <p className="text-xs text-red-600 mt-1">Total exceeds 100%</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Component Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={component.description}
              onChange={(e) => updateComponentOrigin(index, 'description', e.target.value)}
              placeholder="e.g., Copper electrical wire, Automotive connectors"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:border-blue-500"
            />
            {!component.description && (
              <p className="text-xs text-red-600 mt-1">Component description is required for certificate</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSupplyChainSummary = () => {
    const regionalContent = calculateRegionalContent();
    const totalPercentage = getTotalPercentage();
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-3">
          <Calculator className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-blue-900">Supply Chain Analysis</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-3 rounded border">
            <div className="text-blue-700 font-medium">Total Components</div>
            <div className="text-2xl font-bold text-gray-900">{totalPercentage.toFixed(1)}%</div>
            <div className={`text-xs ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPercentage === 100 ? 'Complete' : totalPercentage > 100 ? 'Exceeds 100%' : 'Incomplete'}
            </div>
          </div>

          <div className="bg-white p-3 rounded border">
            <div className="text-blue-700 font-medium">USMCA Content</div>
            <div className="text-2xl font-bold text-green-600">{regionalContent.toFixed(1)}%</div>
            <div className="text-xs text-gray-600">North American content</div>
          </div>

          <div className="bg-white p-3 rounded border">
            <div className="text-blue-700 font-medium">Non-USMCA Content</div>
            <div className="text-2xl font-bold text-gray-600">{(totalPercentage - regionalContent).toFixed(1)}%</div>
            <div className="text-xs text-gray-600">Other countries</div>
          </div>
        </div>
      </div>
    );
  };

  const renderManufacturingLocation = () => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Manufacturing/Assembly Location <span className="text-red-500">*</span>
      </label>
      
      <select
        value={manufacturingLocation}
        onChange={(e) => setManufacturingLocation(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:border-blue-500"
      >
        <option value="">Select manufacturing country...</option>
        {countries.map(country => (
          <option key={country.value} value={country.value}>
            {getCountryFlag(country.value)} {country.label}
          </option>
        ))}
      </select>
      
      <p className="text-xs text-gray-500 mt-1">
        Country where the final product is manufactured or assembled
      </p>
    </div>
  );

  const renderQualificationResults = () => {
    if (!qualificationResults) return null;

    return (
      <div className={`border-2 rounded-lg p-4 ${
        qualificationResults.qualified ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      }`}>
        <div className="flex items-center mb-3">
          {qualificationResults.qualified ? (
            <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
          ) : (
            <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
          )}
          <h3 className={`font-medium ${qualificationResults.qualified ? 'text-green-900' : 'text-red-900'}`}>
            USMCA Qualification: {qualificationResults.qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-900">Required Threshold:</div>
            <div className="text-lg">{qualificationResults.threshold_required}%</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">Your Content:</div>
            <div className={`text-lg ${qualificationResults.qualified ? 'text-green-600' : 'text-red-600'}`}>
              {qualificationResults.regional_content}%
            </div>
          </div>
        </div>

        <div className="mt-3 p-3 bg-white rounded border">
          <div className="font-medium text-gray-900 mb-2">Qualification Rule:</div>
          <div className="text-sm text-gray-700">{qualificationResults.rule_description}</div>
        </div>

        {!qualificationResults.qualified && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="text-sm text-yellow-800">
              <strong>Recommendation:</strong> Increase North American content to {qualificationResults.threshold_required}% 
              or consider triangle routing through Mexico to achieve USMCA qualification.
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderVerificationSection = () => (
    <div className="border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Supply Chain Verification</h3>
        <div className={`px-3 py-1 rounded-full text-sm ${
          data.supply_chain_verified 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {data.supply_chain_verified ? 'Verified' : 'Requires Verification'}
        </div>
      </div>

      {!data.supply_chain_verified && getTotalPercentage() === 100 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="font-medium text-yellow-900">Verification Required</span>
          </div>
          
          <p className="text-sm text-yellow-800 mb-4">
            Please verify that the supply chain breakdown is accurate and complete.
          </p>
          
          <button
            onClick={() => onChange({ supply_chain_verified: true })}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            I Verify This Supply Chain Information is Accurate
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-center mb-2">
          <Route className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-medium text-blue-900">Supply Chain & Regional Content Calculator</span>
        </div>
        <p className="text-sm text-blue-700">
          Add all component origins to calculate USMCA qualification and regional value content.
        </p>
      </div>

      {renderSupplyChainSummary()}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Component Origins</h3>
          <button
            onClick={addComponentOrigin}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Component
          </button>
        </div>

        {componentOrigins.map((component, index) => 
          renderComponentOriginForm(component, index)
        )}
      </div>

      {renderManufacturingLocation()}
      
      {isCalculating && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
          <span>Calculating USMCA qualification...</span>
        </div>
      )}

      {renderQualificationResults()}
      {renderVerificationSection()}

      {/* Validation Messages */}
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
    </div>
  );
}