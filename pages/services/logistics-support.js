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
  const [formData, setFormData] = useState({
    company_name: '',
    business_type: '',
    product_description: '',
    trade_volume: '',
    manufacturing_location: '',
    contact_name: '',
    phone: ''
  });

  const services = [
    // Compliance Services
    {
      id: 'usmca-certificate',
      icon: '📜',
      title: 'USMCA Certificate Generation',
      price: 250,
      expert: 'Compliance Services - Licensed Customs Broker',
      benefits: [
        'Avoid 35% tariffs with proper USMCA compliance',
        'Professional liability coverage',
        'Zero risk of customs rejection',
        'Expert validation of North American content'
      ],
      deliverables: [
        'Complete USMCA Certificate of Origin',
        'Supporting documentation package',
        'Compliance verification report',
        'Delivered within 24-48 hours'
      ],
      whyNeed: 'With new 35% tariffs on non-compliant goods, a proper USMCA certificate can save thousands per shipment'
    },
    {
      id: 'hs-classification',
      icon: '🔍',
      title: 'HS Code Classification',
      price: 200,
      expert: 'Compliance Services - Licensed Customs Broker',
      benefits: [
        'Audit-proof classifications',
        'Minimize duty payments legally',
        'Avoid costly reclassification penalties',
        'Expert research and documentation'
      ],
      deliverables: [
        'Verified HS code with supporting rationale',
        'Classification ruling documentation',
        'Alternative code analysis if applicable',
        'Delivered within 1-2 business days'
      ],
      whyNeed: 'Wrong HS codes lead to penalties, duty overpayments, and shipment delays'
    },
    {
      id: 'crisis-response',
      icon: '🚨',
      title: 'Crisis Response Management',
      price: 400,
      expert: 'Compliance Services - Licensed Customs Broker',
      benefits: [
        'Emergency 24-48 hour response',
        'Immediate action plan to minimize damage',
        'Root cause analysis and prevention',
        'Direct expert consultation'
      ],
      deliverables: [
        'Emergency compliance analysis',
        'Step-by-step action plan',
        'Prevention strategy for future issues',
        'Direct expert support until resolved'
      ],
      whyNeed: 'When tariffs change suddenly or shipments are held, every hour costs money'
    },

    // Mexico Trade Services
    {
      id: 'supplier-sourcing',
      icon: '🔍',
      title: 'Supplier Sourcing',
      price: 450,
      expert: 'Mexico Trade Services - B2B Sales Expert',
      benefits: [
        'AI-powered supplier discovery with web search',
        'Expert validates findings with industry knowledge',
        'Bilingual advantage for Mexico sourcing',
        'Direct workflow integration with your data'
      ],
      deliverables: [
        'AI supplier analysis validated by expert',
        'Strategic recommendations report',
        'Implementation guidance and next steps',
        'Analysis completed within 3-5 business days'
      ],
      whyNeed: 'Get AI-powered supplier insights validated by B2B expertise and Mexico market knowledge.'
    },
    {
      id: 'manufacturing-feasibility',
      icon: '🏭',
      title: 'Manufacturing Feasibility',
      price: 650,
      expert: 'Mexico Trade Services - B2B Sales Expert',
      benefits: [
        'Comprehensive AI feasibility analysis',
        'Expert validates locations and cost estimates',
        'Risk assessment with mitigation strategies',
        'USMCA qualification strategy included'
      ],
      deliverables: [
        'AI feasibility analysis validated by expert',
        'Location recommendations with pros/cons',
        'Financial projections and timeline',
        'Analysis completed within 5-7 business days'
      ],
      whyNeed: 'Get comprehensive feasibility analysis combining AI research with manufacturing expertise.'
    },
    {
      id: 'market-entry',
      icon: '🚀',
      title: 'Market Entry Strategy',
      price: 550,
      expert: 'Mexico Trade Services - B2B Sales Expert',
      benefits: [
        'AI-powered market research and analysis',
        'Expert validates opportunities with local knowledge',
        'Competitive landscape assessment',
        'Entry strategy with actionable roadmap'
      ],
      deliverables: [
        'AI market analysis validated by expert',
        'Market opportunity assessment',
        'Strategic entry recommendations',
        'Analysis completed within 3-5 business days'
      ],
      whyNeed: 'Get AI market intelligence validated by on-the-ground Mexico business expertise.'
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

    // If no workflow data and not a subscriber, show intake form
    if (!hasWorkflowData && !isSubscriber) {
      setShowIntakeForm(serviceId);
      return;
    }

    // Proceed to checkout
    await proceedToCheckout(serviceId);
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

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-service-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          service_request_data: serviceRequestData
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.company_name || !formData.business_type || !formData.product_description ||
        !formData.trade_volume || !formData.contact_name) {
      alert('Please fill in all required fields');
      return;
    }

    // Close form and proceed to checkout
    const serviceId = showIntakeForm;
    setShowIntakeForm(null);
    await proceedToCheckout(serviceId);
  };

  return (
    <>
      <Head>
        <title>Professional Services - Triangle Intelligence</title>
        <meta name="description" content="Expert USMCA compliance, HS classification, and Mexico trade services" />
      </Head>

      {/* Intake Form Modal */}
      {showIntakeForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Business Information Required</h2>
              <button
                className="modal-close"
                onClick={() => setShowIntakeForm(null)}
              >
                ×
              </button>
            </div>

            <p className="text-body">
              To provide you with expert service, we need some information about your business.
              Subscribers skip this step!
            </p>

            <form onSubmit={handleFormSubmit}>
              <div className="filter-section">
                <div className="filter-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleFormChange}
                    required
                    className="filter-select"
                  />
                </div>

                <div className="filter-group">
                  <label>Business Type *</label>
                  <select
                    name="business_type"
                    value={formData.business_type}
                    onChange={handleFormChange}
                    required
                    className="filter-select"
                  >
                    <option value="">Select business type</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Import/Export">Import/Export</option>
                    <option value="Distribution">Distribution</option>
                    <option value="Retail">Retail</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Annual Trade Volume *</label>
                  <select
                    name="trade_volume"
                    value={formData.trade_volume}
                    onChange={handleFormChange}
                    required
                    className="filter-select"
                  >
                    <option value="">Select volume</option>
                    <option value="Under $100K">Under $100K</option>
                    <option value="$100K - $500K">$100K - $500K</option>
                    <option value="$500K - $1M">$500K - $1M</option>
                    <option value="$1M - $5M">$1M - $5M</option>
                    <option value="Over $5M">Over $5M</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Product Description *</label>
                  <textarea
                    name="product_description"
                    value={formData.product_description}
                    onChange={handleFormChange}
                    required
                    className="filter-select"
                    rows="3"
                    placeholder="Describe your products or manufacturing project"
                  />
                </div>

                <div className="filter-group">
                  <label>Manufacturing Location</label>
                  <input
                    type="text"
                    name="manufacturing_location"
                    value={formData.manufacturing_location}
                    onChange={handleFormChange}
                    className="filter-select"
                    placeholder="Current or planned location"
                  />
                </div>

                <div className="filter-group">
                  <label>Contact Name *</label>
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleFormChange}
                    required
                    className="filter-select"
                  />
                </div>

                <div className="filter-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="filter-select"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowIntakeForm(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Continue to Payment
                </button>
              </div>
            </form>
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
            Professional Services
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
            Expert completion by licensed professionals. Avoid 35% tariffs and compliance risks.
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
                    ${service.price}
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
                  : `Request Service - $${service.price}`
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