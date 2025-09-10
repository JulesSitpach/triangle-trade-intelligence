/**
 * Product Details Step - HS Code Verification and Product Description
 * Validates classified HS codes against database, allows manual verification
 * NO HARDCODED PRODUCT DATA - All from classification results and user input
 */

import React, { useState, useEffect } from 'react';
// Custom SVG icons to avoid lucide-react ESM import issues
const Package = ({ className }) => (
  <span className={className}>[package]</span>
);

const Search = ({ className }) => (
  <span className={className}>[search]</span>
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

const Shield = ({ className }) => (
  <span className={className}>[shield]</span>
);

const FileText = ({ className }) => (
  <span className={className}>[document]</span>
);

const Eye = ({ className }) => (
  <span className={className}>[view]</span>
);

export default function ProductDetailsStep({ data = {}, productInfo, onChange, validation = { errors: [] } }) {
  const [hsCodeVerification, setHsCodeVerification] = useState(null);
  const [isVerifyingHsCode, setIsVerifyingHsCode] = useState(false);
  const [alternativeHsCodes, setAlternativeHsCodes] = useState([]);
  const [tariffInformation, setTariffInformation] = useState(null);
  const [showHsCodeDetails, setShowHsCodeDetails] = useState(false);

  // Initialize with pre-classified data
  useEffect(() => {
    if (productInfo && !data.hs_code) {
      onChange({
        hs_code: productInfo.hs_code,
        product_description: productInfo.description,
        classification_confidence: productInfo.confidence,
        classification_method: productInfo.method
      });
      
      // Auto-verify if confidence is high
      if (productInfo.confidence >= 0.9) {
        verifyHsCode(productInfo.hs_code);
      }
    }
  }, [productInfo]);

  const verifyHsCode = async (hsCode) => {
    if (!hsCode) return;
    
    setIsVerifyingHsCode(true);
    try {
      const response = await fetch('/api/trust/verify-hs-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hs_code: hsCode })
      });

      if (response.ok) {
        const result = await response.json();
        setHsCodeVerification(result);
        setTariffInformation(result.tariff_info);
        
        if (result.verified) {
          onChange({ 
            tariff_classification_verified: true,
            verification_source: result.source,
            verification_date: new Date().toISOString()
          });
        }

        if (result.alternatives) {
          setAlternativeHsCodes(result.alternatives);
        }
      }
    } catch (error) {
      console.error('HS code verification error:', error);
      setHsCodeVerification({
        verified: false,
        error: 'Verification service unavailable'
      });
    } finally {
      setIsVerifyingHsCode(false);
    }
  };

  const handleHsCodeChange = (newHsCode) => {
    onChange({ 
      hs_code: newHsCode,
      tariff_classification_verified: false,
      verification_source: null
    });
    setHsCodeVerification(null);
    setTariffInformation(null);
  };

  const handleManualVerification = () => {
    onChange({ 
      tariff_classification_verified: true,
      verification_method: 'manual',
      verification_date: new Date().toISOString()
    });
  };

  const selectAlternativeHsCode = (hsCode, description) => {
    onChange({
      hs_code: hsCode,
      product_description: description,
      tariff_classification_verified: false,
      classification_method: 'manual_selection'
    });
    verifyHsCode(hsCode);
  };

  const renderClassificationSummary = () => {
    if (!productInfo) return null;

    return (
      <div className="alert alert-info">
        <div className="alert-icon">
          <Shield className="icon-md" />
        </div>
        <div className="alert-content">
          <div className="alert-title">Classification Results</div>
        <div className="grid-2-cols">
          <div>
            <span className="text-body">HS Code:</span>
            <span className="hs-code-display">{productInfo.hs_code}</span>
          </div>
          <div>
            <span className="text-body">Confidence:</span>
            <span className="small-text">{((productInfo.confidence || 0) * 100).toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-body">Method:</span>
            <span className="small-text">{productInfo.method?.replace(/_/g, ' ')}</span>
          </div>
        </div>
        </div>
      </div>
    );
  };

  const renderHsCodeField = () => (
    <div className="form-group">
      <label className="form-label required">
        HS Tariff Classification
      </label>
      
      <div className="form-input-group">
        <div className="form-input-container">
          <input
            type="text"
            value={data.hs_code || ''}
            onChange={(e) => handleHsCodeChange(e.target.value)}
            placeholder="e.g., 420221"
            className={`form-input hs-code-input ${
              validation.errors?.some(e => e.includes('HS code')) 
                ? 'form-input-error' 
                : ''
            }`}
          />
        </div>
        
        <button
          onClick={() => verifyHsCode(data.hs_code)}
          disabled={!data.hs_code || isVerifyingHsCode}
          className="btn-primary"
        >
          {isVerifyingHsCode ? (
            <>
              <div className="loading-spinner"></div>
              Verifying...
            </>
          ) : (
            <>
              <Search className="icon-sm" />
              Verify
            </>
          )}
        </button>
      </div>
      
      {hsCodeVerification && (
        <div className={`alert ${hsCodeVerification.verified ? 'alert-success' : 'alert-error'}`}>
          <div className="alert-icon">
            {hsCodeVerification.verified ? (
              <CheckCircle className="icon-sm" />
            ) : (
              <AlertCircle className="icon-sm" />
            )}
          </div>
          <div className="alert-content">
            <div className="alert-title">
              {hsCodeVerification.verified ? 'HS Code Verified' : 'HS Code Not Found'}
            </div>
            {hsCodeVerification.source && (
              <div className="form-help">
                Source: {hsCodeVerification.source}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderProductDescription = () => (
    <div className="form-group">
      <label className="form-label required">
        Product Description
      </label>
      
      <textarea
        value={data.product_description || ''}
        onChange={(e) => onChange({ product_description: e.target.value })}
        placeholder="Enter detailed product description for certificate"
        rows={4}
        className={`form-textarea ${
          validation.errors?.some(e => e.includes('description')) 
            ? 'form-input-error' 
            : ''
        }`}
      />
      
      <div className="form-help">
        This description will appear on the official USMCA certificate. Be precise and professional.
      </div>
    </div>
  );

  const renderCommercialDescription = () => (
    <div className="form-group">
      <label className="form-label">
        Commercial Description (Optional)
      </label>
      
      <input
        type="text"
        value={data.commercial_description || ''}
        onChange={(e) => onChange({ commercial_description: e.target.value })}
        placeholder="Brand name, model number, or commercial identifier"
        className="form-input"
      />
      
      <div className="form-help">
        Additional commercial information for internal reference (not required for certificate)
      </div>
    </div>
  );

  const renderTariffInformation = () => {
    if (!tariffInformation) return null;

    return (
      <div className="card">
        <div className="card-header">
          <FileText className="icon-md" />
          <h3 className="card-title">Tariff Information</h3>
        </div>
        
        <div className="grid-3-cols">
          {tariffInformation.rates?.map((rate, index) => (
            <div key={index} className="content-card">
              <div className="card-title">{rate.country}</div>
              <div className="text-body">MFN Rate: {rate.mfn_rate}%</div>
              <div className="status-success">USMCA Rate: {rate.usmca_rate}%</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAlternativeHsCodes = () => {
    if (!alternativeHsCodes || alternativeHsCodes.length === 0) return null;

    return (
      <div className="alert alert-warning">
        <div className="alert-icon">
          <Info className="icon-md" />
        </div>
        <div className="alert-content">
          <div className="alert-title">Alternative Classifications</div>
          <div className="text-body">
            These alternative HS codes might also apply to your product:
          </div>
        </div>
        
        <div className="element-spacing">
          {alternativeHsCodes.map((alt, index) => (
            <div key={index} className="card">
              <div className="card-content">
                <div className="hs-code-display">{alt.hs_code}</div>
                <div className="text-body">{alt.description}</div>
                <div className="small-text">Confidence: {((alt.confidence || 0) * 100).toFixed(1)}%</div>
              </div>
              
              <button
                onClick={() => selectAlternativeHsCode(alt.hs_code, alt.description)}
                className="btn-secondary"
              >
                Select
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVerificationSection = () => (
    <div className="form-section">
      <div className="section-header">
        <h3 className="section-header-title">Classification Verification</h3>
        <div className={`status-badge ${
          data.tariff_classification_verified 
            ? 'status-success' 
            : 'status-error'
        }`}>
          {data.tariff_classification_verified ? 'Verified' : 'Requires Verification'}
        </div>
      </div>

      {!data.tariff_classification_verified && (
        <div className="alert alert-warning">
          <div className="alert-icon">
            <AlertCircle className="icon-md" />
          </div>
          <div className="alert-content">
            <div className="alert-title">Verification Required</div>
            <div className="text-body">
              Please verify that the HS code and product description are accurate for your certificate.
            </div>
          </div>
          
          <div className="element-spacing">
            <button
              onClick={handleManualVerification}
              className="btn-primary"
            >
              <CheckCircle className="icon-sm" />
              I Verify This Classification is Correct
            </button>
            
            <div className="form-help">
              By verifying, you confirm the HS code and description accurately represent your product
            </div>
          </div>
        </div>
      )}

      {data.tariff_classification_verified && (
        <div className="alert alert-success">
          <div className="alert-icon">
            <CheckCircle className="icon-md" />
          </div>
          <div className="alert-content">
            <div className="alert-title">Classification Verified</div>
            <div className="text-body">
              {data.verification_date && 
                `Verified on ${new Date(data.verification_date).toLocaleDateString()}`
              }
              {data.verification_source && ` via ${data.verification_source}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="element-spacing">
      <div className="alert alert-info">
        <div className="alert-icon">
          <Package className="icon-md" />
        </div>
        <div className="alert-content">
          <div className="alert-title">Product Classification & Verification</div>
          <div className="text-body">
            Verify the HS code classification and provide accurate product descriptions for your certificate.
          </div>
        </div>
      </div>

      {renderClassificationSummary()}
      {renderHsCodeField()}
      {renderTariffInformation()}
      {renderAlternativeHsCodes()}
      {renderProductDescription()}
      {renderCommercialDescription()}
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