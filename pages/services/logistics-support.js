/**
 * Professional Services - Expert Completion
 * Clear service cards with benefits, deliverables, pricing, and payment buttons
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';

export default function ProfessionalServices() {
  const { user, loading: authLoading } = useSimpleAuth();
  const [isProcessing, setIsProcessing] = useState({});
  const [showIntakeForm, setShowIntakeForm] = useState(null); // serviceId when form is shown
  const [isSubscriberForm, setIsSubscriberForm] = useState(false); // True if user has workflow data
  const [formData, setFormData] = useState({
    // Simple form for subscribers
    concerns: '',

    // Full form for non-subscribers
    company_name: '',
    business_type: '',
    product_description: '',
    trade_volume: '',
    manufacturing_location: '',
    contact_name: '',
    phone: '',
    current_qualification_status: '',
    qualification_problem: '',
    component_origins_china: '',
    component_origins_mexico: '',
    component_origins_usmca: '',
    component_origins_other: '',
    hs_codes: '',
    current_suppliers: '',
    target_markets: []
  });

  const services = [
    {
      id: 'trade-health-check',
      icon: '🏥',
      title: 'Trade Health Check',
      price: 99, // Internal base price
      displayPrice: 99, // Same price for all (no non-subscriber markup)
      subscriberPrice: 99,
      expert: 'Team Collaboration - Expert Assessment',
      benefits: [
        'Complete trade health assessment',
        'Prioritized improvement recommendations',
        'Service recommendation strategy',
        '$99 credit toward any follow-up service'
      ],
      deliverables: [
        'Overall Trade Health Score (0-100)',
        'Prioritized improvement action plan',
        'Follow-up service recommendations',
        'Delivered within 1 week'
      ],
      whyNeed: 'Perfect entry point for new clients. Get comprehensive assessment of trade opportunities and clear recommendations for optimization.',
      recurring: false
    },
    {
      id: 'usmca-advantage',
      icon: '📜',
      title: 'USMCA Advantage Sprint',
      price: 175,
      displayPrice: 175,
      subscriberPrice: 175,
      expert: 'Compliance Lead • Business Development Support',
      benefits: [
        'Complete USMCA qualification assessment',
        'Compliance gap analysis',
        'Optimization roadmap with implementation guidance',
        'Product audit and documentation review'
      ],
      deliverables: [
        'USMCA qualification assessment report',
        'Compliance gap analysis with remediation steps',
        'Optimization roadmap with timeline',
        'Delivered within 1 week'
      ],
      whyNeed: 'Don\'t qualify for USMCA benefits? Need professional guidance to restructure supply chain? Compliance expert leads product audit while business development provides supplier insights.',
      recurring: false,
      disclaimer: 'For official USMCA certificates, we partner with licensed customs brokers'
    },
    {
      id: 'supply-chain-optimization',
      icon: '🔧',
      title: 'Supply Chain Optimization',
      price: 275,
      displayPrice: 275,
      subscriberPrice: 275,
      expert: 'Compliance Lead • Sourcing Specialist Support',
      benefits: [
        'AI analysis validated by compliance expert',
        'Cost reduction opportunities identified',
        'Process optimization recommendations',
        'Logistics efficiency improvements'
      ],
      deliverables: [
        'Complete supply chain efficiency audit',
        'Cost reduction opportunity analysis',
        'Process optimization roadmap',
        'Delivered within 1-2 weeks'
      ],
      whyNeed: 'Already qualified but want to reduce costs? Compliance expert validates AI analysis while sourcing specialist identifies improvements.',
      recurring: false
    },
    {
      id: 'pathfinder',
      icon: '🚀',
      title: 'Pathfinder Market Entry',
      price: 350,
      displayPrice: 350,
      subscriberPrice: 350,
      expert: 'Business Development Lead • Compliance Support',
      benefits: [
        'Complete Mexico market analysis',
        'Distribution partner recommendations',
        '90-day implementation plan',
        'Regulatory requirements validation'
      ],
      deliverables: [
        'Mexico market opportunity assessment',
        'Distribution partner recommendations',
        '90-day go-to-market implementation plan',
        'Go-to-market presentation delivered'
      ],
      whyNeed: 'Want to establish Mexico presence for USMCA qualification? Business development specialist leads market research while compliance expert validates regulatory requirements.',
      recurring: false
    },
    {
      id: 'supply-chain-resilience',
      icon: '🛡️',
      title: 'Supply Chain Resilience',
      price: 450,
      displayPrice: 450,
      subscriberPrice: 450,
      expert: 'Sourcing Specialist Lead • Compliance Support',
      benefits: [
        '3-5 verified alternative supplier options',
        'USMCA qualification status for each',
        'Risk mitigation and contingency plan',
        'Supplier capability assessment'
      ],
      deliverables: [
        '3-5 alternative supplier options with analysis',
        'USMCA qualification verification for each',
        'Risk mitigation and contingency plan',
        'Delivered within 2-3 weeks'
      ],
      whyNeed: 'Dependent on single supplier? Facing geopolitical risks? Sourcing specialist finds alternatives while compliance expert validates qualifications.',
      recurring: false
    },
    {
      id: 'crisis-navigator',
      icon: '🆘',
      title: 'Crisis Navigator',
      price: 200,
      displayPrice: 200,
      subscriberPrice: 200,
      expert: 'Compliance Lead • Business Development Support',
      benefits: [
        'Priority 4-hour emergency response time',
        'Monthly regulatory updates and monitoring',
        'Unlimited trade consultation',
        'Emergency compliance resolution'
      ],
      deliverables: [
        'Priority emergency response (4-hour SLA)',
        'Monthly regulatory change monitoring',
        'Unlimited trade consultation access',
        '$200/month ongoing retainer'
      ],
      whyNeed: 'Got a trade risk alert? Shipment held at customs? Tariffs changed overnight? Compliance expert leads crisis response while business development handles continuity.',
      recurring: true
    }
  ];

  const handleServiceRequest = async (serviceId) => {
    // Check if user is authenticated
    if (!user) {
      alert('Please sign in to request professional services');
      window.location.href = '/login?redirect=/services/logistics-support';
      return;
    }

    // Check if user has workflow data
    const workflowData = JSON.parse(localStorage.getItem('usmca_workflow_results') || '{}');
    const hasWorkflowData = workflowData.company?.name;

    // Check subscription status
    const subscriptionData = JSON.parse(localStorage.getItem('subscription_data') || '{}');
    const isSubscriber = subscriptionData.status === 'active' || subscriptionData.status === 'trialing';

    // If user has workflow data OR is subscriber, show simple form
    if (hasWorkflowData || isSubscriber) {
      setIsSubscriberForm(true);
      setShowIntakeForm(serviceId);
      return;
    }

    // If no workflow data and not a subscriber, show full intake form with 20% markup
    setIsSubscriberForm(false);
    setShowIntakeForm(serviceId);
  };

  const proceedToCheckout = async (serviceId) => {
    setIsProcessing(prev => ({ ...prev, [serviceId]: true }));

    try {
      console.log(`Requesting service: ${serviceId}`);

      // Get user's workflow data from localStorage
      const workflowData = JSON.parse(localStorage.getItem('usmca_workflow_results') || '{}');
      const userProfile = JSON.parse(localStorage.getItem('triangleUserData') || '{}');

      // Use intake form data if available, otherwise use workflow/profile data
      const useFormData = formData.company_name !== '';

      // Prepare service request data for Stripe metadata
      const serviceRequestData = {
        company_name: useFormData ? formData.company_name : (workflowData.company?.name || userProfile.company?.name || 'Unknown Company'),
        client_info: {
          company: useFormData ? formData.company_name : (workflowData.company?.name || userProfile.company?.name || 'Unknown Company'),
          email: user?.email || 'client@example.com',
          contact_name: useFormData ? formData.contact_name : (userProfile.contact_name || 'Client Contact'),
          phone: useFormData ? formData.phone : (userProfile.phone || 'Not provided')
        },
        service_details: {
          product_description: useFormData ? formData.product_description : (workflowData.product?.description || userProfile.product_description || 'Manufacturing project'),
          business_type: useFormData ? formData.business_type : (workflowData.company?.business_type || userProfile.business_type || 'Manufacturing'),
          trade_volume: useFormData ? formData.trade_volume : (workflowData.company?.trade_volume || userProfile.trade_volume || 'Standard volume'),
          manufacturing_location: useFormData ? formData.manufacturing_location : (workflowData.company?.manufacturing_location || 'To be determined'),
          timeline: 'Standard delivery (5-7 business days)',
          urgency: 'Standard'
        },
        subscriber_data: {
          product_description: useFormData ? formData.product_description : (workflowData.product?.description || 'Manufacturing project'),
          industry: useFormData ? formData.business_type : (workflowData.company?.business_type || 'Manufacturing'),
          volume: useFormData ? formData.trade_volume : (workflowData.company?.trade_volume || 'Standard volume'),
          quality_standards: 'ISO 9001 certification required',
          target_price_range: '$10-25 per unit',
          geographic_preference: 'Mexico regions with USMCA advantages',
          timeline: '5-7 business days analysis'
        }
      };

      // Calculate price with 20% markup for non-subscribers (convert to cents)
      const basePriceDollars = services.find(s => s.id === serviceId)?.price || 500;
      const finalPriceDollars = isSubscriberForm ? basePriceDollars : Math.round(basePriceDollars * 1.2);
      const finalPriceCents = finalPriceDollars * 100;

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-service-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          service_request_data: serviceRequestData,
          price_override: isSubscriberForm ? null : finalPriceCents // 20% markup for non-subscribers
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url, sessionId } = await response.json();

      // Redirect to Stripe checkout
      console.log(`Redirecting to Stripe checkout: ${sessionId}`);
      window.location.href = url;

    } catch (error) {
      console.error('Service request error:', error);
      alert('Error processing payment. Please try again.');
      setIsProcessing(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      // Handle target markets checkboxes
      if (name === 'target_markets') {
        setFormData(prev => ({
          ...prev,
          target_markets: checked
            ? [...prev.target_markets, value]
            : prev.target_markets.filter(m => m !== value)
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleComponentOriginChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      component_origins: prev.component_origins.map((origin, i) =>
        i === index ? { ...origin, [field]: value } : origin
      )
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (isSubscriberForm) {
      // Simple validation for subscribers - just need concerns
      if (!formData.concerns || formData.concerns.trim().length < 10) {
        alert('Please describe your concerns (at least 10 characters)');
        return;
      }
    } else {
      // Full validation for non-subscribers
      if (!formData.company_name || !formData.business_type || !formData.product_description ||
          !formData.trade_volume || !formData.contact_name || !formData.current_qualification_status ||
          !formData.qualification_problem) {
        alert('Please fill in all required fields marked with *');
        return;
      }

      // Validate at least one component origin is filled
      const hasComponentOrigins = formData.component_origins_china || formData.component_origins_mexico ||
                                   formData.component_origins_usmca || formData.component_origins_other;
      if (!hasComponentOrigins) {
        alert('Please provide at least one component origin percentage');
        return;
      }
    }

    // Close form and proceed to checkout
    const serviceId = showIntakeForm;
    setShowIntakeForm(null);
    await proceedToCheckout(serviceId);
  };

  return (
    <>
      <Head>
        <title>Professional Services - Triangle Trade Intelligence</title>
        <meta name="description" content="Expert USMCA compliance, HS classification, and Mexico trade services" />
      </Head>

      {/* Intake Form Modal */}
      {showIntakeForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{isSubscriberForm ? 'Request Professional Service' : 'Business Information Required (+20% Non-Subscriber Fee)'}</h2>
              <button
                className="modal-close"
                onClick={() => setShowIntakeForm(null)}
              >
                ×
              </button>
            </div>

            {isSubscriberForm ? (
              // SIMPLE FORM FOR SUBSCRIBERS
              <>
                <form onSubmit={handleFormSubmit}>
                  <div className="filter-section">
                    <div className="filter-group" style={{width: '100%'}}>
                      <label>Describe your situation *</label>
                      <textarea
                        name="concerns"
                        value={formData.concerns}
                        onChange={handleFormChange}
                        required
                        className="filter-select"
                        rows="4"
                        placeholder="Briefly describe what you need help with..."
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowIntakeForm(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Continue to Payment
                    </button>
                  </div>
                </form>
              </>
            ) : (
              // FULL FORM FOR NON-SUBSCRIBERS
              <>
                <p className="text-body" style={{backgroundColor: '#fef3c7', padding: '12px', borderRadius: '8px', color: '#92400e'}}>
                  <strong>Note:</strong> Non-subscribers pay 20% more. Complete our USMCA workflow or subscribe to skip this form and save money!
                </p>

                <form onSubmit={handleFormSubmit}>
                  <div className="filter-section">
                    {/* Basic Business Info */}
                    <div className="filter-group">
                      <label>Company Name *</label>
                      <input type="text" name="company_name" value={formData.company_name} onChange={handleFormChange} required className="filter-select" />
                    </div>

                    <div className="filter-group">
                      <label>Business Type *</label>
                      <select name="business_type" value={formData.business_type} onChange={handleFormChange} required className="filter-select">
                        <option value="">Select type</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Import/Export">Import/Export</option>
                        <option value="Distribution">Distribution</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="filter-group">
                      <label>Annual Trade Volume *</label>
                      <select name="trade_volume" value={formData.trade_volume} onChange={handleFormChange} required className="filter-select">
                        <option value="">Select volume</option>
                        <option value="Under $100K">Under $100K</option>
                        <option value="$100K-$500K">$100K-$500K</option>
                        <option value="$500K-$1M">$500K-$1M</option>
                        <option value="$1M-$5M">$1M-$5M</option>
                        <option value="Over $5M">Over $5M</option>
                      </select>
                    </div>

                    <div className="filter-group" style={{gridColumn: '1 / -1'}}>
                      <label>Product Description *</label>
                      <textarea name="product_description" value={formData.product_description} onChange={handleFormChange} required className="filter-select" rows="3" placeholder="What do you manufacture or import?" />
                    </div>

                    {/* USMCA Qualification Status */}
                    <div className="filter-group" style={{gridColumn: '1 / -1'}}>
                      <label>Do you currently qualify for USMCA? *</label>
                      <select name="current_qualification_status" value={formData.current_qualification_status} onChange={handleFormChange} required className="filter-select">
                        <option value="">Select status</option>
                        <option value="qualified">Yes, we qualify</option>
                        <option value="not-qualified">No, we don't qualify</option>
                        <option value="unsure">Unsure / Haven't checked</option>
                        <option value="borderline">Borderline / Close to 75%</option>
                      </select>
                    </div>

                    <div className="filter-group" style={{gridColumn: '1 / -1'}}>
                      <label>What problem are you trying to solve? *</label>
                      <textarea name="qualification_problem" value={formData.qualification_problem} onChange={handleFormChange} required className="filter-select" rows="3" placeholder="Example: 'Too much content from China, need Mexico suppliers' or 'Facing new tariffs, need crisis response'" />
                    </div>

                    {/* Component Origins */}
                    <div className="filter-group" style={{gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '16px'}}>
                      <label style={{fontSize: '1.1rem', fontWeight: '600', color: '#134169'}}>Where do your components/materials come from? *</label>
                      <small className="text-body" style={{display: 'block', color: '#6b7280', marginBottom: '12px'}}>
                        Provide approximate percentages (must add up to 100% or close)
                      </small>
                    </div>

                    <div className="filter-group">
                      <label>China %</label>
                      <input type="number" name="component_origins_china" value={formData.component_origins_china} onChange={handleFormChange} className="filter-select" placeholder="0-100" min="0" max="100" />
                    </div>

                    <div className="filter-group">
                      <label>Mexico %</label>
                      <input type="number" name="component_origins_mexico" value={formData.component_origins_mexico} onChange={handleFormChange} className="filter-select" placeholder="0-100" min="0" max="100" />
                    </div>

                    <div className="filter-group">
                      <label>USA/Canada %</label>
                      <input type="number" name="component_origins_usmca" value={formData.component_origins_usmca} onChange={handleFormChange} className="filter-select" placeholder="0-100" min="0" max="100" />
                    </div>

                    <div className="filter-group">
                      <label>Other %</label>
                      <input type="number" name="component_origins_other" value={formData.component_origins_other} onChange={handleFormChange} className="filter-select" placeholder="0-100" min="0" max="100" />
                    </div>

                    {/* Additional Info */}
                    <div className="filter-group">
                      <label>Current Suppliers (if known)</label>
                      <input type="text" name="current_suppliers" value={formData.current_suppliers} onChange={handleFormChange} className="filter-select" placeholder="Company names or regions" />
                    </div>

                    <div className="filter-group">
                      <label>HS Codes (if known)</label>
                      <input type="text" name="hs_codes" value={formData.hs_codes} onChange={handleFormChange} className="filter-select" placeholder="e.g. 8517.62, 8471.30" />
                    </div>

                    <div className="filter-group">
                      <label>Manufacturing Location</label>
                      <input type="text" name="manufacturing_location" value={formData.manufacturing_location} onChange={handleFormChange} className="filter-select" placeholder="Current or planned" />
                    </div>

                    {/* Contact Info */}
                    <div className="filter-group" style={{gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '16px'}}>
                      <label style={{fontSize: '1.1rem', fontWeight: '600', color: '#134169'}}>Contact Information *</label>
                    </div>

                    <div className="filter-group">
                      <label>Contact Name *</label>
                      <input type="text" name="contact_name" value={formData.contact_name} onChange={handleFormChange} required className="filter-select" />
                    </div>

                    <div className="filter-group">
                      <label>Phone Number</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleFormChange} className="filter-select" placeholder="(555) 123-4567" />
                    </div>

                    {/* Target Markets */}
                    <div className="filter-group" style={{gridColumn: '1 / -1'}}>
                      <label>Target Markets (check all that apply)</label>
                      <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px'}}>
                        {['USA', 'Canada', 'Mexico', 'Latin America', 'Europe', 'Asia'].map(market => (
                          <label key={market} style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                            <input
                              type="checkbox"
                              name="target_markets"
                              value={market}
                              checked={formData.target_markets.includes(market)}
                              onChange={handleFormChange}
                              style={{marginRight: '6px'}}
                            />
                            {market}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowIntakeForm(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Continue to Payment (+20% Fee)
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#134169', marginBottom: '16px' }}>
            Expert Services for USMCA Qualification Issues
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#6b7280', maxWidth: '700px', margin: '0 auto' }}>
            Don't qualify for USMCA benefits? Facing trade risks? Need supply chain optimization?
            Our expert team restructures your operations, responds to crises, and helps you achieve qualification.
          </p>

          {!authLoading && (
            <>
              {(() => {
                const workflowData = JSON.parse(localStorage.getItem('usmca_workflow_results') || '{}');
                const subscriptionData = JSON.parse(localStorage.getItem('subscription_data') || '{}');
                const hasWorkflowData = workflowData.company?.name;
                const isSubscriber = subscriptionData.status === 'active' || subscriptionData.status === 'trialing';

                if (!user) {
                  return (
                    <div className="card" style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fef3c7', border: '1px solid #fbbf24' }}>
                      <p className="text-body" style={{ margin: 0, color: '#92400e', textAlign: 'center' }}>
                        <strong>Sign in required:</strong> Please sign in to request professional services
                      </p>
                    </div>
                  );
                } else if (!hasWorkflowData && !isSubscriber) {
                  return (
                    <div className="card" style={{ marginTop: '30px', padding: '20px', backgroundColor: '#dbeafe', border: '1px solid #3b82f6' }}>
                      <p className="text-body" style={{ margin: 0, color: '#1e40af', textAlign: 'center' }}>
                        <strong>Note:</strong> You'll be asked to provide business information before payment.
                        <a href="/usmca-workflow" style={{ marginLeft: '8px', color: '#2563eb', textDecoration: 'underline' }}>
                          Complete our workflow
                        </a> or <a href="/pricing" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                          subscribe
                        </a> to skip this step!
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '30px',
          marginBottom: '40px'
        }}>
          {services.map((service) => (
            <div
              key={service.id}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '30px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '2rem', marginRight: '12px' }}>{service.icon}</span>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#134169', margin: '0' }}>
                    {service.title}
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                    {service.expert}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#134169' }}>
                    ${service.displayPrice}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'line-through' }}>
                    ${service.subscriberPrice}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>
                    Subscribers save ${service.displayPrice - service.subscriberPrice}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#92400e', fontSize: '1rem' }}>Why You Need This:</h4>
                <p style={{ margin: '0', color: '#92400e', fontSize: '0.9rem' }}>{service.whyNeed}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#134169', fontSize: '1rem' }}>Benefits:</h4>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#374151' }}>
                  {service.benefits.map((benefit, index) => (
                    <li key={index} style={{ marginBottom: '4px', fontSize: '0.9rem' }}>{benefit}</li>
                  ))}
                </ul>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#134169', fontSize: '1rem' }}>What You'll Receive:</h4>
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#374151' }}>
                  {service.deliverables.map((deliverable, index) => (
                    <li key={index} style={{ marginBottom: '4px', fontSize: '0.9rem' }}>{deliverable}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleServiceRequest(service.id)}
                disabled={isProcessing[service.id]}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: isProcessing[service.id] ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isProcessing[service.id] ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!isProcessing[service.id]) {
                    e.target.style.backgroundColor = '#1d4ed8';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isProcessing[service.id]) {
                    e.target.style.backgroundColor = '#2563eb';
                  }
                }}
              >
                {isProcessing[service.id]
                  ? 'Processing...'
                  : `Request Service - $${service.displayPrice}`
                }
              </button>
            </div>
          ))}
        </div>

        <div style={{
          textAlign: 'center',
          padding: '30px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ color: '#134169', marginBottom: '16px' }}>Need Multiple Services?</h3>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            Contact us for package pricing on multiple services or ongoing support needs.
          </p>
          <a
            href="mailto:support@triangleintelligence.com"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#16a34a',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500'
            }}
          >
            Contact for Custom Pricing
          </a>
        </div>
      </div>
    </>
  );
}