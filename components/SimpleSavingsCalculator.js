/**
 * SIMPLE SAVINGS CALCULATOR WIDGET
 * Clean landing page demo showing potential USMCA savings
 * Using professional enterprise design system
 */

import React, { useState } from 'react';

// Helper function to convert country name to ISO code
const getCountryCode = (countryName) => {
  const countryMap = {
    'China': 'CN',
    'Germany': 'DE', 
    'Japan': 'JP',
    'South Korea': 'KR',
    'Taiwan': 'TW',
    'Vietnam': 'VN',
    'Thailand': 'TH',
    'India': 'IN',
    'Mexico': 'MX',
    'Canada': 'CA',
    'United States': 'US'
  };
  return countryMap[countryName] || 'CN';
};

// Helper function to get volume amount from range
const getVolumeAmount = (volumeRange) => {
  const volumeMap = {
    'Under $500K': 250000,
    '$500K-1M': 750000,
    '$1M-2M': 1500000,
    '$2M-5M': 3500000,
    '$5M-10M': 7500000,
    '$10M+': 15000000,
    'Over $25M': 40000000
  };
  // NO FALLBACK - volume must be provided
  const volume = volumeMap[volumeRange];
  if (!volume) {
    console.error(`❌ [HARDCODING] Invalid volume range: ${volumeRange} - must match dropdown values`);
    return null;
  }
  return volume;
};

export default function SimpleSavingsCalculator() {
  const [productType, setProductType] = useState('automotive');
  const [importVolume, setImportVolume] = useState('$2M-5M');
  const [originCountry, setOriginCountry] = useState('China');
  const [estimatedSavings, setEstimatedSavings] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);
  
  // Dynamic dropdown state
  const [productOptions, setProductOptions] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [volumeOptions, setVolumeOptions] = useState([]);

  // Load dynamic dropdown options from database
  React.useEffect(() => {
    loadDropdownOptions();
  }, []);

  const loadDropdownOptions = async () => {
    try {
      const response = await fetch('/api/database-driven-dropdown-options?category=all');
      const result = await response.json();
      
      if (result.success && result.data) {
        // Update business types from database
        if (result.data.business_types) {
          setProductOptions(result.data.business_types.map(bt => ({
            value: bt.value || bt.label.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
            label: bt.label
          })));
        }
        
        // Update countries from database
        if (result.data.countries) {
          setCountryOptions(result.data.countries.map(country => ({
            value: typeof country === 'string' ? country : country.name || country.label,
            label: typeof country === 'string' ? country : country.name || country.label
          })));
        }
        
        // Update import volumes from database
        if (result.data.trade_volumes) {
          setVolumeOptions(result.data.trade_volumes.map(vol => ({
            value: vol.value,
            label: vol.label
          })));
        }
      }
      
      setDropdownsLoaded(true);
    } catch (error) {
      console.error('Failed to load dropdown options:', error);
      // Keep default values if API fails
      setDropdownsLoaded(true);
    }
  };


  const calculateSavings = async () => {
    setIsCalculating(true);
    try {
      const response = await fetch('/api/simple-savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importVolume,
          supplierCountry: originCountry,
          businessType: 'Manufacturing',
          productDescription: productOptions.find(p => p.value === productType)?.label
        })
      });

      const result = await response.json();
      
      if (result.savings) {
        setEstimatedSavings({
          annual: result.savings.annual_tariff_savings,
          monthly: result.savings.monthly_tariff_savings,
          percentage: result.savings.savings_percentage
        });
      } else {
        // Fallback calculation - get dynamic tariff rates from database via API
        const fallbackResponse = await fetch('/api/simple-savings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            importVolume,
            supplierCountry: getCountryCode(originCountry),
            businessType: productType,
            hsCode: null // Let API determine appropriate rates
          })
        });
        
        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          if (fallbackResult.savings) {
            setEstimatedSavings({
              annual: fallbackResult.savings.annual_tariff_savings,
              monthly: fallbackResult.savings.monthly_tariff_savings,
              percentage: fallbackResult.savings.savings_percentage
            });
            return;
          }
        }
        
        // CRITICAL: NO EMERGENCY FALLBACK - Cannot calculate without AI
        const baseVolume = getVolumeAmount(importVolume);
        if (!baseVolume) {
          console.error('❌ [HARDCODING] Cannot calculate without valid volume');
          alert('Unable to calculate savings - please try again or contact support');
          setIsCalculating(false);
          return;
        }

        // If AI fails, show error instead of fake data
        console.error('❌ [HARDCODING] All AI services failed - cannot calculate savings without real tariff data');
        alert('Our tariff calculation service is temporarily unavailable. Please try again in a few minutes.');
        setIsCalculating(false);
        return;
      }
    } catch (error) {
      console.error('❌ [HARDCODING] Calculation error:', error);
      // NO FAKE DATA - Show error to user
      alert('An error occurred during calculation. Please try again or contact support.');
      setEstimatedSavings(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const handleLeadSubmit = () => {
    if (leadEmail && leadCompany) {
      // In production, this would send to your CRM
      console.log('Lead captured:', { leadEmail, leadCompany, leadPhone });
      setLeadCaptured(true);
    }
  };

  return (
    <div className="content-card calculator-container">
      <div className="section-header calculator-header">
        <h2 className="section-header-title">
          USMCA Route Analysis & Compliance Assessment
        </h2>
        <p className="section-header-subtitle">
          Optimize your supply chain routing through USMCA trade corridors
        </p>
        <div className="status-success">
          Trusted by 500+ companies for trade route optimization
        </div>
      </div>

      <div className="grid-3-cols calculator-form-grid">
        {/* Product Type */}
        <div className="form-group">
          <label className="form-label">Product Type</label>
          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            className="form-select"
          >
            {!dropdownsLoaded ? (
              <option disabled>Loading industries...</option>
            ) : (
              productOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Import Volume */}
        <div className="form-group">
          <label className="form-label">Annual Import Volume</label>
          <select
            value={importVolume}
            onChange={(e) => setImportVolume(e.target.value)}
            className="form-select"
          >
            {!dropdownsLoaded ? (
              <option disabled>Loading volumes...</option>
            ) : (
              volumeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Origin Country */}
        <div className="form-group">
          <label className="form-label">Origin Country</label>
          <select
            value={originCountry}
            onChange={(e) => setOriginCountry(e.target.value)}
            className="form-select"
          >
            {!dropdownsLoaded ? (
              <option disabled>Loading countries...</option>
            ) : (
              countryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Calculate Button */}
      {!estimatedSavings && (
        <div className="calculator-button-section">
          <button
            onClick={calculateSavings}
            disabled={isCalculating}
            className={`btn-primary btn-large ${isCalculating ? 'btn-secondary' : ''}`}
          >
            {isCalculating ? 'Analyzing Trade Routes...' : 'Calculate Potential Savings'}
          </button>
          <p className="text-muted">
            Professional analysis trusted by 500+ enterprise clients
          </p>
        </div>
      )}

      {/* Results */}
      {estimatedSavings && !showLeadCapture && (
        <div className="calculator-results-container">
          <div className="calculator-results-header">
            <h3 className="section-title">USMCA Route Optimization Analysis</h3>
          </div>
          
          <div className="grid-3-cols calculator-metrics-grid">
            <div className="content-card calculator-metric-card">
              <div className="calculator-metric-value success">
                {formatCurrency(estimatedSavings.annual)}
              </div>
              <div className="content-card-title calculator-metric-title">
                Projected Annual Savings
              </div>
              <div className="text-muted">Through USMCA optimization</div>
            </div>
            
            <div className="content-card calculator-metric-card">
              <div className="calculator-metric-value info">
                {formatCurrency(estimatedSavings.monthly)}
              </div>
              <div className="content-card-title calculator-metric-title">
                Monthly Savings
              </div>
              <div className="text-muted">Recurring benefit</div>
            </div>
            
            <div className="content-card calculator-metric-card">
              <div className="calculator-metric-value primary">
                {estimatedSavings.percentage.toFixed(1)}%
              </div>
              <div className="content-card-title calculator-metric-title">
                Optimization Rate
              </div>
              <div className="text-muted">Trade route efficiency</div>
            </div>
          </div>
          
          <div className="status-info calculator-assessment-section">
            <div className="content-card-title">Expert Services Available</div>
            <div className="text-muted">
              Trade Health Check ($99) • USMCA Advantage Sprint ($175) • Supply Chain Optimization ($275) • Pathfinder Market Entry ($350) • Supply Chain Resilience ($450) • Crisis Navigator ($200/mo)
            </div>
          </div>
          
          <div className="calculator-button-group">
            <button
              onClick={() => window.location.href = '/services/request-form'}
              className="btn-primary btn-large"
            >
              Request Professional Assessment
            </button>
            <button
              onClick={() => window.location.href = '/usmca-workflow'}
              className="btn-secondary"
            >
              Start Compliance Workflow
            </button>
          </div>
          
          <p className="text-muted calculator-disclaimer">
            * Analysis based on typical USMCA optimization opportunities. Results vary by specific qualification requirements.
          </p>
        </div>
      )}
            
            {/* Lead Capture Form */}
            {showLeadCapture && !leadCaptured && (
              <div className="card-compact">
                <div className="form-section">
                  <h3 className="form-section-title text-center">
                    Get Your Detailed Mexico Routing Analysis
                  </h3>
                  <p className="form-section-description text-center">
                    Connect with pre-verified Mexico suppliers + detailed tariff impact report
                  </p>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label form-label-required">
                        Business Email
                      </label>
                      <input
                        type="email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label form-label-required">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={leadCompany}
                        onChange={(e) => setLeadCompany(e.target.value)}
                        placeholder="Your Company Inc."
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Phone (for priority Mexico supplier access)
                    </label>
                    <input
                      type="tel"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="alert alert-info">
                    <div className="alert-description">
                      <strong>What you'll receive:</strong>
                      <ul className="form-section">
                        <li>• Detailed Mexico supplier network access</li>
                        <li>• Trump tariff impact analysis for your products</li>
                        <li>• USMCA qualification roadmap</li>
                        <li>• Priority consultation scheduling</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={handleLeadSubmit}
                      disabled={!leadEmail || !leadCompany}
                      className="btn-primary btn-large shadow-soft"
                    >
                      Get My Mexico Routing Analysis →
                    </button>
                    <p className="text-muted">
                      Free consultation • No obligation • Priority response within 24 hours
                    </p>
                  </div>
                </div>
              </div>
            )}
            
      {/* Success Message */}
      {leadCaptured && (
        <div className="content-card calculator-success-card">
          <div className="content-card-title calculator-success-title">
            Success! Analysis Request Received
          </div>
          <div className="content-card-description">
            Our Mexico trade experts will contact you within 24 hours with your detailed analysis and supplier connections.
            Check your email for immediate resources.
          </div>
          <button
            onClick={() => window.location.href = '/usmca-workflow'}
            className="btn-primary"
          >
            Start Full Workflow Now
          </button>
        </div>
      )}
    </div>
  );
}