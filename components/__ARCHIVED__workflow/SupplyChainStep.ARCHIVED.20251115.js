/**
 * Supply Chain Step - Interactive Component Origin Calculator
 * Real-time USMCA qualification calculation with visual feedback
 * NO HARDCODED SUPPLY CHAIN DATA - All from user input and database validation
 */

import React, { useState, useEffect } from 'react';
// Custom SVG icons to avoid lucide-react ESM import issues
const Route = ({ className }) => (
  <span className={className}>[route]</span>
);

const Plus = ({ className }) => (
  <span className={className}>[plus]</span>
);

const Trash2 = ({ className }) => (
  <span className={className}>[trash]</span>
);

const Calculator = ({ className }) => (
  <span className={className}>[calculator]</span>
);

const CheckCircle = ({ className }) => (
  <span className={className}>[check]</span>
);

const AlertCircle = ({ className }) => (
  <span className={className}>[alert]</span>
);

const Info = ({ className }) => (
  <span className={className}>[info]</span>
);

const MapPin = ({ className }) => (
  <span className={className}>[location]</span>
);

const Percent = ({ className }) => (
  <span className={className}>[percent]</span>
);

const Globe = ({ className }) => (
  <span className={className}>[globe]</span>
);

export default function SupplyChainStep({ data = {}, onChange, validation = { errors: [] } }) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Auto-calculate qualification when supply chain changes
    if (componentOrigins.length > 0 && manufacturingLocation) {
      calculateUSMCAQualification();
    }
  }, [componentOrigins, manufacturingLocation]);
    // eslint-disable-next-line react-hooks/exhaustive-deps

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
      <div key={index} className={`card ${
        isUsmcaMember ? 'card-success' : ''
      }`}>
        <div className="card-header">
          <h4 className="card-title">Component {index + 1}</h4>
          <div className="header-actions">
            {isUsmcaMember && (
              <span className="status-success">
                USMCA Member
              </span>
            )}
            {componentOrigins.length > 1 && (
              <button
                onClick={() => removeComponentOrigin(index)}
                className="btn-danger"
              >
                <Trash2 className="icon-sm" />
              </button>
            )}
          </div>
        </div>

        <div className="grid-3-cols">
          <div className="form-group">
            <label className="form-label required">
              Origin Country
            </label>
            <select
              value={component.origin_country}
              onChange={(e) => updateComponentOrigin(index, 'origin_country', e.target.value)}
              className="form-select"
            >
              <option value="">Select country...</option>
              {/* USMCA countries first (Canada, Mexico, USA) */}
              {countries.filter(country => ['CA', 'MX', 'US'].includes(country.value)).map(country => (
                <option key={`usmca-${country.value}`} value={country.value}>
                  {getCountryFlag(country.value)} {country.label}
                </option>
              ))}
              {/* Other countries grouped below */}
              <optgroup label="Other Countries">
                {countries.filter(country => !['CA', 'MX', 'US'].includes(country.value)).map(country => (
                  <option key={`other-${country.value}`} value={country.value}>
                    {getCountryFlag(country.value)} {country.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">
              Value Percentage
            </label>
            <div className="form-input-group">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={component.value_percentage}
                onChange={(e) => updateComponentOrigin(index, 'value_percentage', parseFloat(e.target.value) || 0)}
                className="form-input"
              />
              <span className="form-input-suffix">%</span>
            </div>
            {totalPercentage > 100 && (
              <div className="form-error">Total exceeds 100%</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label required">
              Component Description
            </label>
            <input
              type="text"
              value={component.description}
              onChange={(e) => updateComponentOrigin(index, 'description', e.target.value)}
              placeholder="e.g., Copper electrical wire, Automotive connectors"
              className="form-input"
            />
            {!component.description && (
              <div className="form-error">Component description is required for certificate</div>
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
      <div className="alert alert-info">
        <div className="alert-icon">
          <Calculator className="icon-md" />
        </div>
        <div className="alert-content">
          <div className="alert-title">Supply Chain Analysis</div>
        </div>

        <div className="grid-3-cols">
          <div className="content-card">
            <div className="card-title">Total Components</div>
            <div className="dashboard-metric">{totalPercentage.toFixed(1)}%</div>
            <div className={`status-text ${totalPercentage === 100 ? 'status-success' : 'status-error'}`}>
              {totalPercentage === 100 ? 'Complete' : totalPercentage > 100 ? 'Exceeds 100%' : 'Incomplete'}
            </div>
          </div>

          <div className="content-card">
            <div className="card-title">USMCA Content</div>
            <div className="dashboard-metric status-success">{regionalContent.toFixed(1)}%</div>
            <div className="small-text">North American content</div>
          </div>

          <div className="content-card">
            <div className="card-title">Non-USMCA Content</div>
            <div className="dashboard-metric">{(totalPercentage - regionalContent).toFixed(1)}%</div>
            <div className="small-text">Other countries</div>
          </div>
        </div>
      </div>
    );
  };

  const renderManufacturingLocation = () => (
    <div className="form-group">
      <label className="form-label required">
        Manufacturing/Assembly Location
      </label>
      
      <select
        value={manufacturingLocation}
        onChange={(e) => setManufacturingLocation(e.target.value)}
        className="form-select"
      >
        <option value="">Select manufacturing country...</option>
        {/* USMCA countries first (Canada, Mexico, USA) */}
        {countries.filter(country => ['CA', 'MX', 'US'].includes(country.value)).map(country => (
          <option key={`mfg-usmca-${country.value}`} value={country.value}>
            {getCountryFlag(country.value)} {country.label}
          </option>
        ))}
        {/* Other countries grouped below */}
        <optgroup label="Other Countries">
          {countries.filter(country => !['CA', 'MX', 'US'].includes(country.value)).map(country => (
            <option key={`mfg-other-${country.value}`} value={country.value}>
              {getCountryFlag(country.value)} {country.label}
            </option>
          ))}
        </optgroup>
      </select>
      
      <div className="form-help">
        Country where the final product is manufactured or assembled
      </div>
    </div>
  );

  const renderQualificationResults = () => {
    if (!qualificationResults) return null;

    return (
      <div className={`alert ${
        qualificationResults.qualified ? 'alert-success' : 'alert-error'
      }`}>
        <div className="alert-icon">
          {qualificationResults.qualified ? (
            <CheckCircle className="icon-lg" />
          ) : (
            <AlertCircle className="icon-lg" />
          )}
        </div>
        <div className="alert-content">
          <div className="alert-title">
            USMCA Qualification: {qualificationResults.qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}
          </div>
        </div>

        <div className="grid-2-cols">
          <div>
            <div className="card-title">Required Threshold:</div>
            <div className="dashboard-metric">{qualificationResults.threshold_required}%</div>
          </div>
          <div>
            <div className="card-title">Your Content:</div>
            <div className={`dashboard-metric ${qualificationResults.qualified ? 'status-success' : 'status-error'}`}>
              {qualificationResults.regional_content}%
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Qualification Rule:</div>
          <div className="text-body">{qualificationResults.rule_description}</div>
        </div>

        {!qualificationResults.qualified && (
          <div className="alert alert-warning">
            <div className="text-body">
              <strong>Recommendation:</strong> Increase North American content to {qualificationResults.threshold_required}% 
              or consider triangle routing through Mexico to achieve USMCA qualification.
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderVerificationSection = () => (
    <div className="form-section">
      <div className="section-header">
        <h3 className="section-header-title">Supply Chain Verification</h3>
        <div className={`status-badge ${
          data.supply_chain_verified 
            ? 'status-success' 
            : 'status-error'
        }`}>
          {data.supply_chain_verified ? 'Verified' : 'Requires Verification'}
        </div>
      </div>

      {!data.supply_chain_verified && getTotalPercentage() === 100 && (
        <div className="alert alert-warning">
          <div className="alert-icon">
            <AlertCircle className="icon-md" />
          </div>
          <div className="alert-content">
            <div className="alert-title">Verification Required</div>
            <div className="text-body">
              Please verify that the supply chain breakdown is accurate and complete.
            </div>
          </div>
          
          <button
            onClick={() => onChange({ supply_chain_verified: true })}
            className="btn-primary"
          >
            <CheckCircle className="icon-sm" />
            I Verify This Supply Chain Information is Accurate
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="element-spacing">
      <div className="alert alert-info">
        <div className="alert-icon">
          <Route className="icon-md" />
        </div>
        <div className="alert-content">
          <div className="alert-title">Supply Chain & Regional Content Calculator</div>
          <div className="text-body">
            Add all component origins to calculate USMCA qualification and regional value content.
          </div>
        </div>
      </div>

      {renderSupplyChainSummary()}

      <div>
        <div className="section-header">
          <h3 className="section-header-title">Component Origins</h3>
          <button
            onClick={addComponentOrigin}
            className="btn-primary"
          >
            <Plus className="icon-sm" />
            Add Component
          </button>
        </div>

        {componentOrigins.map((component, index) => 
          renderComponentOriginForm(component, index)
        )}
      </div>

      {renderManufacturingLocation()}
      
      {isCalculating && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span>Calculating USMCA qualification...</span>
        </div>
      )}

      {renderQualificationResults()}
      {renderVerificationSection()}

      {/* Validation Messages */}
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
    </div>
  );
}