/**
 * Product Details Step - HS Code Verification and Product Description
 * Validates classified HS codes against database, allows manual verification
 * NO HARDCODED PRODUCT DATA - All from classification results and user input
 */

import React, { useState, useEffect } from 'react';
// Custom SVG icons to avoid lucide-react ESM import issues
const Package = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.29,7 12,12 20.71,7"/>
    <line x1="12" y1="22" x2="12" y2="12"/>
  </svg>
);

const Search = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
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

const Shield = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const FileText = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

const Eye = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

export default function ProductDetailsStep({ data, productInfo, onChange, validation }) {
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-2">
          <Shield className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-blue-900">Classification Results</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700 font-medium">HS Code:</span>
            <span className="ml-2 font-mono">{productInfo.hs_code}</span>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Confidence:</span>
            <span className="ml-2">{((productInfo.confidence || 0) * 100).toFixed(1)}%</span>
          </div>
          <div className="col-span-2">
            <span className="text-blue-700 font-medium">Method:</span>
            <span className="ml-2 capitalize">{productInfo.method?.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderHsCodeField = () => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        HS Tariff Classification <span className="text-red-500">*</span>
      </label>
      
      <div className="flex space-x-3">
        <div className="flex-1">
          <input
            type="text"
            value={data.hs_code || ''}
            onChange={(e) => handleHsCodeChange(e.target.value)}
            placeholder="e.g., 420221"
            className={`
              w-full px-3 py-2 border rounded-md font-mono text-lg
              ${validation.errors?.some(e => e.includes('HS code')) 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
              }
              focus:outline-none focus:ring-1
            `}
          />
        </div>
        
        <button
          onClick={() => verifyHsCode(data.hs_code)}
          disabled={!data.hs_code || isVerifyingHsCode}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {isVerifyingHsCode ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Verifying...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Verify
            </>
          )}
        </button>
      </div>
      
      {hsCodeVerification && (
        <div className={`mt-3 p-3 rounded-md ${hsCodeVerification.verified ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center">
            {hsCodeVerification.verified ? (
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
            )}
            <span className={`text-sm font-medium ${hsCodeVerification.verified ? 'text-green-900' : 'text-red-900'}`}>
              {hsCodeVerification.verified ? 'HS Code Verified' : 'HS Code Not Found'}
            </span>
          </div>
          {hsCodeVerification.source && (
            <p className="text-xs text-gray-600 mt-1">
              Source: {hsCodeVerification.source}
            </p>
          )}
        </div>
      )}
    </div>
  );

  const renderProductDescription = () => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Product Description <span className="text-red-500">*</span>
      </label>
      
      <textarea
        value={data.product_description || ''}
        onChange={(e) => onChange({ product_description: e.target.value })}
        placeholder="Enter detailed product description for certificate"
        rows={4}
        className={`
          w-full px-3 py-2 border rounded-md resize-none
          ${validation.errors?.some(e => e.includes('description')) 
            ? 'border-red-300 focus:border-red-500' 
            : 'border-gray-300 focus:border-blue-500'
          }
          focus:outline-none focus:ring-1
        `}
      />
      
      <p className="text-xs text-gray-500 mt-1">
        This description will appear on the official USMCA certificate. Be precise and professional.
      </p>
    </div>
  );

  const renderCommercialDescription = () => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Commercial Description (Optional)
      </label>
      
      <input
        type="text"
        value={data.commercial_description || ''}
        onChange={(e) => onChange({ commercial_description: e.target.value })}
        placeholder="Brand name, model number, or commercial identifier"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:border-blue-500"
      />
      
      <p className="text-xs text-gray-500 mt-1">
        Additional commercial information for internal reference (not required for certificate)
      </p>
    </div>
  );

  const renderTariffInformation = () => {
    if (!tariffInformation) return null;

    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-3">
          <FileText className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="font-medium text-gray-900">Tariff Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {tariffInformation.rates?.map((rate, index) => (
            <div key={index} className="bg-white p-3 rounded border">
              <div className="font-medium text-gray-900">{rate.country}</div>
              <div className="text-gray-600">MFN Rate: {rate.mfn_rate}%</div>
              <div className="text-green-600">USMCA Rate: {rate.usmca_rate}%</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAlternativeHsCodes = () => {
    if (!alternativeHsCodes || alternativeHsCodes.length === 0) return null;

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-3">
          <Info className="w-5 h-5 text-yellow-600 mr-2" />
          <h3 className="font-medium text-yellow-900">Alternative Classifications</h3>
        </div>
        
        <p className="text-sm text-yellow-800 mb-3">
          These alternative HS codes might also apply to your product:
        </p>
        
        <div className="space-y-2">
          {alternativeHsCodes.map((alt, index) => (
            <div key={index} className="bg-white p-3 rounded border flex justify-between items-start">
              <div className="flex-1">
                <div className="font-mono font-medium">{alt.hs_code}</div>
                <div className="text-sm text-gray-600">{alt.description}</div>
                <div className="text-xs text-gray-500">Confidence: {((alt.confidence || 0) * 100).toFixed(1)}%</div>
              </div>
              
              <button
                onClick={() => selectAlternativeHsCode(alt.hs_code, alt.description)}
                className="ml-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
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
    <div className="border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Classification Verification</h3>
        <div className={`px-3 py-1 rounded-full text-sm ${
          data.tariff_classification_verified 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {data.tariff_classification_verified ? 'Verified' : 'Requires Verification'}
        </div>
      </div>

      {!data.tariff_classification_verified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="font-medium text-yellow-900">Verification Required</span>
          </div>
          
          <p className="text-sm text-yellow-800 mb-4">
            Please verify that the HS code and product description are accurate for your certificate.
          </p>
          
          <div className="space-y-2">
            <button
              onClick={handleManualVerification}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              I Verify This Classification is Correct
            </button>
            
            <p className="text-xs text-yellow-700 text-center">
              By verifying, you confirm the HS code and description accurately represent your product
            </p>
          </div>
        </div>
      )}

      {data.tariff_classification_verified && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <span className="font-medium text-green-900">Classification Verified</span>
              <p className="text-sm text-green-700">
                {data.verification_date && 
                  `Verified on ${new Date(data.verification_date).toLocaleDateString()}`
                }
                {data.verification_source && ` via ${data.verification_source}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-center mb-2">
          <Package className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-medium text-blue-900">Product Classification & Verification</span>
        </div>
        <p className="text-sm text-blue-700">
          Verify the HS code classification and provide accurate product descriptions for your certificate.
        </p>
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