/**
 * USMCA Workflow - Single Page Complete Compliance Solution
 * Replaces multi-stage complexity with streamlined workflow
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TriangleLayout from '../components/TriangleLayout';

const USMCA_CONFIG = {
  COUNTRIES: {
    'US': 'United States',
    'CA': 'Canada', 
    'MX': 'Mexico',
    'AU': 'Australia',
    'BR': 'Brazil',
    'CN': 'China',
    'DE': 'Germany',
    'GB': 'United Kingdom',
    'IN': 'India',
    'IT': 'Italy',
    'JP': 'Japan',
    'KR': 'South Korea',
    'MY': 'Malaysia',
    'NL': 'Netherlands',
    'SG': 'Singapore',
    'TH': 'Thailand',
    'TR': 'Turkey',
    'VN': 'Vietnam'
  },
  BUSINESS_TYPES: [
    'Manufacturing',
    'Import/Export',
    'Electronics',
    'Automotive',
    'Textiles',
    'Machinery',
    'Consumer Goods',
    'Industrial Equipment'
  ],
  TRADE_VOLUMES: [
    'Under $100K',
    '$100K - $500K',
    '$500K - $1M',
    '$1M - $5M',
    '$5M - $10M',
    '$10M+'
  ]
};

export default function USMCAWorkflow() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Form data state
  const [formData, setFormData] = useState({
    // Company Information
    company_name: '',
    business_type: '',
    supplier_country: 'CN',
    trade_volume: '',
    
    // Product Information
    product_description: '',
    manufacturing_location: 'MX',
    
    // Component Origins
    component_origins: [
      { origin_country: 'CN', value_percentage: 60 },
      { origin_country: 'MX', value_percentage: 40 }
    ]
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addComponentOrigin = () => {
    setFormData(prev => ({
      ...prev,
      component_origins: [
        ...prev.component_origins,
        { origin_country: 'US', value_percentage: 0 }
      ]
    }));
  };

  const updateComponentOrigin = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      component_origins: prev.component_origins.map((component, i) => 
        i === index ? { ...component, [field]: value } : component
      )
    }));
  };

  const removeComponentOrigin = (index) => {
    if (formData.component_origins.length > 1) {
      setFormData(prev => ({
        ...prev,
        component_origins: prev.component_origins.filter((_, i) => i !== index)
      }));
    }
  };

  const processWorkflow = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/simple-usmca-compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'complete_workflow',
          data: formData
        })
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        setCurrentStep(4); // Results step
      } else {
        setError(data.error || 'Processing failed');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetWorkflow = () => {
    setCurrentStep(1);
    setResults(null);
    setError(null);
    setFormData({
      company_name: '',
      business_type: '',
      supplier_country: 'CN',
      trade_volume: '',
      product_description: '',
      manufacturing_location: 'MX',
      component_origins: [
        { origin_country: 'CN', value_percentage: 60 },
        { origin_country: 'MX', value_percentage: 40 }
      ]
    });
  };

  const downloadCertificate = () => {
    if (results?.certificate) {
      const certificateText = formatCertificateForDownload(results.certificate);
      const blob = new Blob([certificateText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `USMCA_Certificate_${results.product.hs_code}_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatCertificateForDownload = (certificate) => {
    return `USMCA CERTIFICATE OF ORIGIN
Generated: ${new Date().toLocaleDateString()}

EXPORTER INFORMATION:
Company: ${certificate.exporter_name}
Address: ${certificate.exporter_address}

PRODUCT INFORMATION:
Description: ${certificate.product_description}
HS Code: ${certificate.hs_tariff_classification}
Country of Origin: ${certificate.country_of_origin}

PREFERENCE CRITERION: ${certificate.preference_criterion}

VALIDITY PERIOD:
From: ${certificate.blanket_start}
To: ${certificate.blanket_end}

INSTRUCTIONS:
${results.certificate?.instructions?.join('\n') || 'Complete remaining fields before submission'}

NOTE: This certificate template must be completed with specific shipment details before use.
`;
  };

  const isFormValid = () => {
    return (
      formData.company_name.length > 2 &&
      formData.business_type &&
      formData.product_description.length > 10 &&
      formData.trade_volume &&
      formData.component_origins.every(c => c.origin_country && c.value_percentage > 0)
    );
  };

  const getTotalComponentPercentage = () => {
    return formData.component_origins.reduce((sum, comp) => sum + parseFloat(comp.value_percentage || 0), 0);
  };

  return (
    <TriangleLayout>
      <div className="max-w-4xl mx-auto p-5">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-900 mb-3">USMCA Compliance Workflow</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete HS classification, qualification check, savings calculation, and certificate generation
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex justify-between items-center max-w-3xl mx-auto relative">
            {[
              { step: 1, label: 'Company Info', icon: '🏢' },
              { step: 2, label: 'Product Details', icon: '📦' },
              { step: 3, label: 'Component Origins', icon: '🌍' },
              { step: 4, label: 'Results & Certificate', icon: '📜' }
            ].map((item) => (
              <div 
                key={item.step}
                className="flex flex-col items-center relative z-10"
              >
                <div className={`text-2xl mb-2 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  currentStep >= item.step 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}>{item.icon}</div>
                <div className={`text-sm font-semibold text-center max-w-20 ${
                  currentStep >= item.step ? 'text-blue-600' : 'text-gray-500'
                }`}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-red-800 mb-2">⚠️ Processing Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button onClick={() => setError(null)} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
              Dismiss
            </button>
          </div>
        )}

        {/* Step 1: Company Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl p-10 shadow-lg mb-5">
            <h2 className="text-2xl font-bold text-blue-900 mb-5">Step 1: Company Information</h2>
            
            <div className="mb-8">
              <div className="mb-5">
                <label className="block font-semibold text-gray-800 mb-2">Company Name</label>
                <input
                  type="text"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  value={formData.company_name}
                  onChange={(e) => updateFormData('company_name', e.target.value)}
                  placeholder="Enter your company name"
                />
              </div>

              <div className="mb-5">
                <label className="block font-semibold text-gray-800 mb-2">Business Type</label>
                <select
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  value={formData.business_type}
                  onChange={(e) => updateFormData('business_type', e.target.value)}
                >
                  <option value="">Select business type</option>
                  {USMCA_CONFIG.BUSINESS_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="mb-5">
                  <label className="block font-semibold text-gray-800 mb-2">Primary Supplier Country</label>
                  <select
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    value={formData.supplier_country}
                    onChange={(e) => updateFormData('supplier_country', e.target.value)}
                  >
                    {Object.entries(USMCA_CONFIG.COUNTRIES).map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-5">
                  <label className="block font-semibold text-gray-800 mb-2">Annual Trade Volume</label>
                  <select
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    value={formData.trade_volume}
                    onChange={(e) => updateFormData('trade_volume', e.target.value)}
                  >
                    <option value="">Select volume</option>
                    {USMCA_CONFIG.TRADE_VOLUMES.map(volume => (
                      <option key={volume} value={volume}>{volume}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-10 pt-5 border-t border-gray-200">
              <button 
                onClick={() => setCurrentStep(2)} 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!formData.company_name || !formData.business_type || !formData.trade_volume}
              >
                Next: Product Details →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Product Information */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl p-10 shadow-lg mb-5">
            <h2 className="text-2xl font-bold text-blue-900 mb-5">Step 2: Product Information</h2>
            
            <div className="mb-8">
              <div className="mb-5">
                <label className="block font-semibold text-gray-800 mb-2">Product Description</label>
                <textarea
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-vertical min-h-24"
                  value={formData.product_description}
                  onChange={(e) => updateFormData('product_description', e.target.value)}
                  placeholder="Provide detailed product description for HS classification (minimum 10 characters)"
                  rows={4}
                />
                <div className="text-sm text-gray-500 mt-1">
                  {formData.product_description.length}/10 minimum characters
                </div>
              </div>

              <div className="mb-5">
                <label className="block font-semibold text-gray-800 mb-2">Manufacturing/Assembly Location</label>
                <select
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  value={formData.manufacturing_location}
                  onChange={(e) => updateFormData('manufacturing_location', e.target.value)}
                >
                  {Object.entries(USMCA_CONFIG.COUNTRIES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
                <div className="text-sm text-gray-500 mt-1">
                  Location where final product assembly or manufacturing takes place
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-4 mt-10 pt-5 border-t border-gray-200">
              <button 
                onClick={() => setCurrentStep(1)} 
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors border-2 border-gray-300"
              >
                ← Back
              </button>
              <button 
                onClick={() => setCurrentStep(3)} 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={formData.product_description.length < 10}
              >
                Next: Component Origins →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Component Origins */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl p-10 shadow-lg mb-5">
            <h2 className="text-2xl font-bold text-blue-900 mb-5">Step 3: Component Origins</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Specify the origin countries and value percentages of major components for USMCA qualification
            </p>
            
            <div className="mb-8">
              <div className="border-2 border-gray-200 rounded-lg p-5">
                {formData.component_origins.map((component, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4 p-4 border border-gray-100 rounded-lg bg-gray-50">
                    <div>
                      <label className="block font-semibold text-gray-800 mb-2">Origin Country</label>
                      <select
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                        value={component.origin_country}
                        onChange={(e) => updateComponentOrigin(index, 'origin_country', e.target.value)}
                      >
                        {Object.entries(USMCA_CONFIG.COUNTRIES).map(([code, name]) => (
                          <option key={code} value={code}>{name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block font-semibold text-gray-800 mb-2">Value %</label>
                      <input
                        type="number"
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                        min="0"
                        max="100"
                        value={component.value_percentage}
                        onChange={(e) => updateComponentOrigin(index, 'value_percentage', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      {formData.component_origins.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => removeComponentOrigin(index)}
                          className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                          title="Remove component"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg mb-4">
                  <div className="font-semibold text-gray-800">
                    Total: {getTotalComponentPercentage().toFixed(1)}%
                    {getTotalComponentPercentage() !== 100 && (
                      <span className="text-red-600 text-sm"> (Should total 100%)</span>
                    )}
                  </div>
                </div>
                
                <button 
                  type="button"
                  onClick={addComponentOrigin}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  + Add Component Origin
                </button>
              </div>
            </div>

            <div className="flex justify-between gap-4 mt-10 pt-5 border-t border-gray-200">
              <button 
                onClick={() => setCurrentStep(2)} 
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors border-2 border-gray-300"
              >
                ← Back
              </button>
              <button 
                onClick={processWorkflow}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={!isFormValid() || isLoading}
              >
                {isLoading ? 'Processing...' : 'Process USMCA Compliance ✓'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === 4 && results && (
          <div className="workflow-step results-step">
            <h2>USMCA Compliance Results</h2>
            
            {/* Company Summary */}
            <div className="results-section">
              <h3>Company Profile</h3>
              <div className="company-summary">
                <div className="summary-item">
                  <span className="label">Company:</span>
                  <span className="value">{results.company.name}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Business Type:</span>
                  <span className="value">{results.company.business_type}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Trade Volume:</span>
                  <span className="value">{results.company.trade_volume}</span>
                </div>
              </div>
            </div>

            {/* Product Classification */}
            <div className="results-section">
              <h3>Product Classification</h3>
              <div className="classification-result">
                <div className="hs-code">
                  <span className="label">HS Code:</span>
                  <span className="value hs-code-value">{results.product.hs_code}</span>
                </div>
                <div className="product-desc">
                  <span className="label">Product:</span>
                  <span className="value">{results.product.description}</span>
                </div>
                <div className="confidence">
                  <span className="label">Classification Confidence:</span>
                  <span className="value">{(results.product.classification_confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* USMCA Qualification */}
            <div className="results-section">
              <h3>USMCA Qualification Status</h3>
              <div className={`qualification-result ${results.usmca.qualified ? 'qualified' : 'not-qualified'}`}>
                <div className="qualification-status">
                  <span className="status-icon">
                    {results.usmca.qualified ? '✅' : '❌'}
                  </span>
                  <span className="status-text">
                    {results.usmca.qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}
                  </span>
                </div>
                
                <div className="qualification-details">
                  <div className="detail-item">
                    <span className="label">Rule Applied:</span>
                    <span className="value">{results.usmca.rule}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Reason:</span>
                    <span className="value">{results.usmca.reason}</span>
                  </div>
                  {results.usmca.documentation_required && (
                    <div className="detail-item">
                      <span className="label">Documentation Required:</span>
                      <ul className="doc-list">
                        {results.usmca.documentation_required.map((doc, index) => (
                          <li key={index}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tariff Savings */}
            {results.savings && (
              <div className="results-section">
                <h3>Tariff Savings Analysis</h3>
                <div className="savings-result">
                  <div className="savings-summary">
                    <div className="savings-item primary">
                      <span className="label">Annual Savings:</span>
                      <span className="value savings-amount">
                        ${results.savings.annual_savings.toLocaleString()} USD
                      </span>
                    </div>
                    <div className="savings-item">
                      <span className="label">Monthly Savings:</span>
                      <span className="value">${results.savings.monthly_savings.toLocaleString()}</span>
                    </div>
                    <div className="savings-item">
                      <span className="label">Savings Rate:</span>
                      <span className="value">{results.savings.savings_percentage.toFixed(2)}%</span>
                    </div>
                  </div>
                  
                  <div className="tariff-comparison">
                    <div className="tariff-item">
                      <span className="label">MFN Tariff Rate:</span>
                      <span className="value">{results.savings.mfn_rate}%</span>
                    </div>
                    <div className="tariff-item">
                      <span className="label">USMCA Rate:</span>
                      <span className="value">{results.savings.usmca_rate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Certificate */}
            {results.certificate && (
              <div className="results-section">
                <h3>Certificate of Origin</h3>
                <div className="certificate-result">
                  <div className="certificate-summary">
                    <p>USMCA Certificate of Origin template has been generated for your product.</p>
                    <div className="certificate-details">
                      <div className="cert-item">
                        <span className="label">Valid From:</span>
                        <span className="value">{new Date(results.certificate.blanket_start).toLocaleDateString()}</span>
                      </div>
                      <div className="cert-item">
                        <span className="label">Valid Until:</span>
                        <span className="value">{new Date(results.certificate.blanket_end).toLocaleDateString()}</span>
                      </div>
                      <div className="cert-item">
                        <span className="label">Preference Criterion:</span>
                        <span className="value">{results.certificate.preference_criterion}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={downloadCertificate}
                    className="btn-download"
                  >
                    📄 Download Certificate Template
                  </button>
                  
                  <div className="certificate-disclaimer">
                    <p><strong>Important:</strong> This certificate template must be completed with specific shipment details and signed before use. Consult with customs professionals for proper implementation.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="results-actions">
              <button 
                onClick={resetWorkflow}
                className="btn-secondary"
              >
                🔄 Start New Analysis
              </button>
              
              {results.usmca.qualified && results.savings && results.savings.annual_savings > 0 && (
                <div className="next-steps">
                  <h4>Recommended Next Steps:</h4>
                  <ul>
                    <li>Download and complete the certificate template</li>
                    <li>Gather required documentation</li>
                    <li>Consult with customs broker for implementation</li>
                    <li>Set up supplier compliance procedures</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <h3>Processing USMCA Compliance</h3>
              <div className="loading-steps">
                <div className="loading-step">🔍 Classifying product...</div>
                <div className="loading-step">🌍 Checking USMCA qual