/**
 * PARTNER SOLUTIONS COMPONENT
 * Shows alternative USMCA suppliers for crisis scenarios
 * Integrates with crisis alerts to provide solution pathways
 */

import React, { useState, useEffect } from 'react';

// Simple icon components
const CheckCircle = ({ className }) => (
  <span className={className}>[check]</span>
);

const Users = ({ className }) => (
  <span className={className}>[users]</span>
);

const MapPin = ({ className }) => (
  <span className={className}>[location]</span>
);

const Clock = ({ className }) => (
  <span className={className}>[clock]</span>
);

const DollarSign = ({ className }) => (
  <span className={className}>[dollar]</span>
);

const Phone = ({ className }) => (
  <span className={className}>[phone]</span>
);

const ChevronDown = ({ className }) => (
  <span className={className}>[chevron-down]</span>
);

const ChevronUp = ({ className }) => (
  <span className={className}>[chevron-up]</span>
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
      <div className="content-card">
        <div className="hero-button-group">
          <div className="content-card-icon">⏳</div>
          <h4 className="content-card-title">Finding USMCA Alternative Suppliers...</h4>
        </div>
        <p className="text-body">
          Searching broker-verified suppliers for HS code {hsCode}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-card">
        <h4 className="content-card-title">
          ⚠️ Supplier Search Error
        </h4>
        <p className="text-body">{error}</p>
        <button 
          onClick={() => loadSuppliersForHSCode(hsCode)}
          className="btn-secondary"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="content-card">
        <h4 className="content-card-title">
          🌐 Expanding Supplier Network
        </h4>
        <p className="text-body">
          No verified suppliers found for HS {hsCode} yet. Our broker network is actively identifying new USMCA-compliant partners.
        </p>
        <div className="hero-button-group">
          <button 
            onClick={() => requestIntroduction({ id: 'custom', company_name: 'Custom Sourcing Request' })}
            className="btn-primary"
          >
            Request Custom Sourcing ($2,500)
          </button>
          <button className="btn-secondary">
            Get Notified When Available
          </button>
        </div>
      </div>
    );
  }

  const accessLevel = getAccessLevel();
  const displaySuppliers = suppliers.slice(0, 5); // Show top 5 matches

  return (
    <div className="content-card">
      <div className="hero-button-group">
        <div className="hero-button-group">
          <Users className="content-card-icon" />
          <h4 className="content-card-title">
            🤝 USMCA Alternative Suppliers Found: {suppliers.length}
          </h4>
        </div>
        {suppliers.filter(s => s.broker_verified).length > 0 && (
          <div className="nav-cta-button">
            ✅ {suppliers.filter(s => s.broker_verified).length} Broker-Verified
          </div>
        )}
      </div>

      <div className="grid-2-cols">
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
        <div className="content-card">
          <h5 className="content-card-title">
            🚀 Unlock Full Supplier Details
          </h5>
          <p className="text-body">
            Upgrade to Professional ($299/month) for complete supplier contact information, 
            broker recommendations, and direct introduction services.
          </p>
          <div className="hero-button-group">
            <button className="btn-primary">
              Upgrade to Professional
            </button>
            <button className="btn-secondary">
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
    <div className="content-card">
      <div className="hero-button-group">
        <div className="hero-button-group">
          <div className="hero-button-group">
            <div className="hero-button-group">
              <span className="content-card-title">
                #{priority}
              </span>
              <h5 className="content-card-title">
                {supplier.company_name}
              </h5>
            </div>
            {supplier.broker_verified && (
              <span className="nav-cta-button">
                ✅ Broker Verified
              </span>
            )}
            {supplier.usmca_qualified && (
              <span className="nav-cta-button">
                🇺🇸🇲🇽🇨🇦 USMCA Ready
              </span>
            )}
          </div>
          
          <div className="hero-button-group">
            <div className="hero-button-group">
              <MapPin className="content-card-icon" />
              <span>{supplier.location}</span>
            </div>
            {supplier.usmca_certification_time_days && (
              <div className="hero-button-group">
                <Clock className="content-card-icon" />
                <span>{supplier.usmca_certification_time_days} days certification</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-body">
          {benefits.annual_savings !== undefined && (
            <div className="text-body">
              <p className="content-card-title">
                {formatBenefit(benefits.annual_savings)}
              </p>
              <p className="text-body">Annual net savings</p>
            </div>
          )}
          {supplier.pricing_premium_percent !== undefined && (
            <p className="text-body">
              +{supplier.pricing_premium_percent}% pricing vs Chinese
            </p>
          )}
        </div>
      </div>

      {/* Benefits Summary */}
      {Object.keys(benefits).length > 0 && (
        <div className="grid-2-cols">
          <div className="content-card">
            <p className="text-body">Tariff Savings</p>
            <p className="content-card-title">
              {formatBenefit(benefits.tariff_savings)}
            </p>
          </div>
          <div className="content-card">
            <p className="text-body">Net Benefit</p>
            <p className="content-card-title">
              {benefits.net_benefit_percent?.toFixed(1) || '0.0'}%
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="hero-button-group">
        <button 
          onClick={onRequestIntroduction}
          disabled={isRequested || !hasFullAccess}
          className={isRequested || !hasFullAccess ? 'btn-secondary' : 'btn-primary'}
        >
          {isRequested ? (
            <>
              <CheckCircle className="icon-sm" />
              Introduction Requested
            </>
          ) : hasFullAccess ? (
            <>
              <Phone className="icon-sm" />
              Request Introduction
            </>
          ) : (
            'Upgrade for Contact Info'
          )}
        </button>
        
        <button 
          onClick={onToggleExpand}
          className="btn-secondary"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="icon-sm" />
              Less Details
            </>
          ) : (
            <>
              <ChevronDown className="icon-sm" />
              More Details
            </>
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="content-card">
          <div className="grid-2-cols">
            <div>
              <h6 className="content-card-title">Company Details</h6>
              <div className="text-body">
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
              <h6 className="content-card-title">HS Code Expertise</h6>
              <div className="text-body">
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