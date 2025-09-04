/**
 * PARTNER SOLUTIONS COMPONENT
 * Shows alternative USMCA suppliers for crisis scenarios
 * Integrates with crisis alerts to provide solution pathways
 */

import React, { useState, useEffect } from 'react';

// Simple icon components
const CheckCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);

const Users = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const MapPin = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const Clock = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const DollarSign = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const Phone = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const ChevronDown = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6,9 12,15 18,9"/>
  </svg>
);

const ChevronUp = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="18,15 12,9 6,15"/>
  </svg>
);

export default function PartnerSolutions({ 
  hsCode, 
  userProfile, 
  crisisAlertId = null,
  subscriptionTier = 'basic' // basic, professional, enterprise
}) {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSupplier, setExpandedSupplier] = useState(null);
  const [introductionRequests, setIntroductionRequests] = useState(new Set());

  useEffect(() => {
    if (hsCode) {
      loadSuppliersForHSCode(hsCode);
    }
  }, [hsCode]);

  const loadSuppliersForHSCode = async (code) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading suppliers for HS code:', code);
      
      const response = await fetch('/api/crisis-solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_suppliers_for_hs_code',
          hs_code: code,
          user_profile: userProfile
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load suppliers');
      }

      console.log('Suppliers loaded:', result.suppliers?.length || 0);
      setSuppliers(result.suppliers || []);
      
    } catch (err) {
      console.error('Failed to load suppliers:', err);
      setError(err.message);
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const requestIntroduction = async (supplier) => {
    try {
      console.log('Requesting introduction for supplier:', supplier.company_name);
      
      const response = await fetch('/api/crisis-solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_supplier_introduction',
          supplier_id: supplier.id,
          user_profile: userProfile,
          hs_code: hsCode,
          crisis_alert_id: crisisAlertId,
          timeline_urgency: '30_days',
          specific_requirements: `Crisis response for HS ${hsCode} - seeking USMCA-compliant alternative`
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to request introduction');
      }

      // Mark as requested
      setIntroductionRequests(prev => new Set(prev.add(supplier.id)));
      
      // Show success message
      alert(`Introduction request submitted! ${result.message}`);
      
    } catch (err) {
      console.error('Failed to request introduction:', err);
      alert(`Failed to request introduction: ${err.message}`);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '$0';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getAccessLevel = () => {
    switch (subscriptionTier?.toLowerCase()) {
      case 'professional':
      case 'enterprise':
        return 'full';
      default:
        return 'basic';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <h4 className="font-bold text-green-900">Finding USMCA Alternative Suppliers...</h4>
        </div>
        <p className="text-green-800 text-sm">
          Searching broker-verified suppliers for HS code {hsCode}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-4">
        <h4 className="font-bold text-yellow-900 mb-2">
          ⚠️ Supplier Search Error
        </h4>
        <p className="text-yellow-800 text-sm mb-4">{error}</p>
        <button 
          onClick={() => loadSuppliersForHSCode(hsCode)}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-4">
        <h4 className="font-bold text-blue-900 mb-2">
          🌐 Expanding Supplier Network
        </h4>
        <p className="text-blue-800 text-sm mb-4">
          No verified suppliers found for HS {hsCode} yet. Our broker network is actively identifying new USMCA-compliant partners.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={() => requestIntroduction({ id: 'custom', company_name: 'Custom Sourcing Request' })}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Request Custom Sourcing ($2,500)
          </button>
          <button className="border border-blue-300 text-blue-700 px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors">
            Get Notified When Available
          </button>
        </div>
      </div>
    );
  }

  const accessLevel = getAccessLevel();
  const displaySuppliers = suppliers.slice(0, 5); // Show top 5 matches

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-green-600" />
          <h4 className="font-bold text-green-900">
            🤝 USMCA Alternative Suppliers Found: {suppliers.length}
          </h4>
        </div>
        {suppliers.filter(s => s.broker_verified).length > 0 && (
          <div className="text-sm bg-green-200 text-green-800 px-3 py-1 rounded-full">
            ✅ {suppliers.filter(s => s.broker_verified).length} Broker-Verified
          </div>
        )}
      </div>

      <div className="space-y-3">
        {displaySuppliers.map((supplier, index) => (
          <SupplierCard 
            key={supplier.id} 
            supplier={supplier} 
            userProfile={userProfile}
            accessLevel={accessLevel}
            isExpanded={expandedSupplier === supplier.id}
            onToggleExpand={() => setExpandedSupplier(
              expandedSupplier === supplier.id ? null : supplier.id
            )}
            onRequestIntroduction={() => requestIntroduction(supplier)}
            isRequested={introductionRequests.has(supplier.id)}
            priority={index + 1}
          />
        ))}
      </div>

      {/* Subscription Upgrade Prompt for Basic Tier */}
      {accessLevel === 'basic' && (
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h5 className="font-semibold text-orange-900 mb-2">
            🚀 Unlock Full Supplier Details
          </h5>
          <p className="text-sm text-orange-800 mb-3">
            Upgrade to Professional ($299/month) for complete supplier contact information, 
            broker recommendations, and direct introduction services.
          </p>
          <div className="flex gap-2">
            <button className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700 transition-colors">
              Upgrade to Professional
            </button>
            <button className="border border-orange-300 text-orange-700 px-4 py-2 rounded text-sm hover:bg-orange-50 transition-colors">
              View Pricing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SupplierCard({ 
  supplier, 
  userProfile, 
  accessLevel,
  isExpanded,
  onToggleExpand,
  onRequestIntroduction,
  isRequested,
  priority
}) {
  const hasFullAccess = accessLevel === 'full';
  const benefits = supplier.solution_benefits || {};
  
  const formatBenefit = (amount) => {
    if (!amount || amount === 0) return '$0';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      signDisplay: amount > 0 ? 'always' : 'never'
    }).format(amount);
  };

  return (
    <div className="bg-white border border-green-200 rounded-lg p-4 hover:border-green-300 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                #{priority}
              </span>
              <h5 className="font-semibold text-gray-900">
                {supplier.company_name}
              </h5>
            </div>
            {supplier.broker_verified && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                ✅ Broker Verified
              </span>
            )}
            {supplier.usmca_qualified && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                🇺🇸🇲🇽🇨🇦 USMCA Ready
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{supplier.location}</span>
            </div>
            {supplier.usmca_certification_time_days && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{supplier.usmca_certification_time_days} days certification</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          {benefits.annual_savings !== undefined && (
            <div className="text-right mb-2">
              <p className="text-lg font-bold text-green-600">
                {formatBenefit(benefits.annual_savings)}
              </p>
              <p className="text-xs text-green-500">Annual net savings</p>
            </div>
          )}
          {supplier.pricing_premium_percent !== undefined && (
            <p className="text-sm text-gray-500">
              +{supplier.pricing_premium_percent}% pricing vs Chinese
            </p>
          )}
        </div>
      </div>

      {/* Benefits Summary */}
      {Object.keys(benefits).length > 0 && (
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg mb-3">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">Tariff Savings</p>
            <p className="text-lg font-bold text-green-600">
              {formatBenefit(benefits.tariff_savings)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">Net Benefit</p>
            <p className="text-lg font-bold text-blue-600">
              {benefits.net_benefit_percent?.toFixed(1) || '0.0'}%
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 items-center">
        <button 
          onClick={onRequestIntroduction}
          disabled={isRequested || !hasFullAccess}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isRequested 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : hasFullAccess
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isRequested ? (
            <>
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Introduction Requested
            </>
          ) : hasFullAccess ? (
            <>
              <Phone className="w-4 h-4 inline mr-1" />
              Request Introduction
            </>
          ) : (
            'Upgrade for Contact Info'
          )}
        </button>
        
        <button 
          onClick={onToggleExpand}
          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 inline mr-1" />
              Less Details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 inline mr-1" />
              More Details
            </>
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h6 className="font-semibold text-gray-900 mb-2">Company Details</h6>
              <div className="space-y-1 text-sm text-gray-600">
                {hasFullAccess && supplier.contact_person && (
                  <p><strong>Contact:</strong> {supplier.contact_person}</p>
                )}
                {hasFullAccess && supplier.contact_title && (
                  <p><strong>Title:</strong> {supplier.contact_title}</p>
                )}
                {supplier.production_capacity && (
                  <p><strong>Capacity:</strong> {supplier.production_capacity}</p>
                )}
                {supplier.quality_certifications?.length > 0 && (
                  <p><strong>Certifications:</strong> {supplier.quality_certifications.join(', ')}</p>
                )}
              </div>
            </div>
            
            <div>
              <h6 className="font-semibold text-gray-900 mb-2">HS Code Expertise</h6>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Specializes in:</strong> HS {supplier.hs_specialties?.join(', ')}</p>
                {supplier.successful_partnerships > 0 && (
                  <p><strong>Successful partnerships:</strong> {supplier.successful_partnerships}</p>
                )}
                {supplier.broker_notes && hasFullAccess && (
                  <p><strong>Broker notes:</strong> {supplier.broker_notes}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}