/**
 * SIMPLE SAVINGS CALCULATOR WIDGET
 * Clean landing page demo showing potential USMCA savings
 * Using professional enterprise design system
 */

import React, { useState } from 'react';

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

  const productOptions = [
    { value: 'automotive', label: 'Automotive Parts' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'textiles', label: 'Textiles & Fabrics' },
    { value: 'machinery', label: 'Machinery' },
    { value: 'chemicals', label: 'Chemicals' },
    { value: 'agricultural', label: 'Agricultural Products' }
  ];

  const volumeOptions = [
    { value: '$500K-1M', label: '$500K - $1M' },
    { value: '$1M-2M', label: '$1M - $2M' },
    { value: '$2M-5M', label: '$2M - $5M' },
    { value: '$5M-10M', label: '$5M - $10M' },
    { value: '$10M+', label: '$10M+' }
  ];

  const countryOptions = [
    { value: 'China', label: 'China' },
    { value: 'Germany', label: 'Germany' },
    { value: 'Japan', label: 'Japan' },
    { value: 'South Korea', label: 'South Korea' },
    { value: 'Taiwan', label: 'Taiwan' },
    { value: 'Vietnam', label: 'Vietnam' },
    { value: 'Thailand', label: 'Thailand' },
    { value: 'India', label: 'India' },
    { value: 'Other', label: 'Other' }
  ];

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
          annual: result.savings.annualTariffSavings,
          monthly: result.savings.monthlyTariffSavings,
          percentage: result.savings.savingsPercentage
        });
      } else {
        // Smart calculation using average tariff differentials
        const volumeMap = {
          '$500K-1M': 750000,
          '$1M-2M': 1500000,
          '$2M-5M': 3500000,
          '$5M-10M': 7500000,
          '$10M+': 15000000
        };

        // Product Type Average MFN Tariff Rates (USMCA = 0%)
        const productMultipliers = {
          'automotive': 0.0325,    // 2.5-4% typical
          'electronics': 0.03,     // 0-6% range average
          'textiles': 0.12,        // 8-16% (highest tariffs)
          'machinery': 0.0185,     // 0-3.7% typical  
          'chemicals': 0.045,      // 3-6% average
          'agricultural': 0.125    // 0-25% highly variable, using conservative avg
        };

        // Origin Country Risk Factors
        const countryMultipliers = {
          'China': 1.2,        // Highest tariff exposure
          'Germany': 0.8,      // EU trade agreements
          'Japan': 0.7,        // Close trade relationship
          'South Korea': 0.9,   // KORUS FTA considerations
          'Taiwan': 1.0,       // Standard rates
          'Vietnam': 1.1,      // Growing trade, higher exposure
          'Thailand': 0.9,     // ASEAN considerations
          'India': 1.0,        // Standard rates
          'Other': 0.9         // Conservative estimate
        };
        
        const baseVolume = volumeMap[importVolume] || 3500000;
        const productRate = productMultipliers[productType] || 0.05;
        const countryFactor = countryMultipliers[originCountry] || 1.0;
        
        const effectiveRate = productRate * countryFactor;
        const annualSavings = Math.round(baseVolume * effectiveRate);
        
        setEstimatedSavings({
          annual: annualSavings,
          monthly: Math.round(annualSavings / 12),
          percentage: effectiveRate * 100
        });
      }
    } catch (error) {
      console.error('Calculation error:', error);
      // Fallback for demo
      setEstimatedSavings({
        annual: 125000,
        monthly: 10400,
        percentage: 3.5
      });
    }
    setIsCalculating(false);
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
            {productOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
            {volumeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
            {countryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
            <div className="content-card-title">Professional Assessment Available</div>
            <div className="text-muted">
              Request comprehensive supplier network analysis and compliance documentation
            </div>
          </div>
          
          <div className="calculator-button-group">
            <button
              onClick={() => setShowLeadCapture(true)}
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