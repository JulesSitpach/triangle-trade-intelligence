/**
 * Professional Services - Expert Completion
 * Workflow dropdown pattern for subscribers, clean form for non-subscribers
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ProfessionalServices() {
  const { user, loading: authLoading } = useSimpleAuth();
  const [isProcessing, setIsProcessing] = useState({});
  const [showIntakeForm, setShowIntakeForm] = useState(null);
  const [isSubscriberForm, setIsSubscriberForm] = useState(false);
  const [userWorkflows, setUserWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [formData, setFormData] = useState({
    // Subscriber form
    concerns: '',
    selected_workflow_id: '',

    // Non-subscriber form
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
    component_origins_other: ''
  });

  const services = [
    {
      id: 'trade-health-check',
      icon: '🏥',
      title: 'Trade Health Check',
      price: 99,
      displayPrice: 99,
      expert: 'Team Collaboration',
      benefits: [
        'Complete trade health assessment',
        'Prioritized improvement recommendations',
        'Service recommendation strategy',
        '$99 credit toward follow-up service'
      ],
      deliverables: [
        'Overall Trade Health Score (0-100)',
        'Prioritized improvement action plan',
        'Delivered within 1 week'
      ],
      whyNeed: 'Perfect entry point. Get comprehensive assessment of trade opportunities and clear recommendations.'
    },
    {
      id: 'usmca-advantage',
      icon: '📜',
      title: 'USMCA Advantage Sprint',
      price: 175,
      displayPrice: 175,
      expert: 'Cristina Lead (70%) • Jorge Support (30%)',
      benefits: [
        'Complete USMCA qualification assessment',
        'Compliance gap analysis',
        'Optimization roadmap with timeline',
        'Product audit and documentation review'
      ],
      deliverables: [
        'USMCA qualification assessment report',
        'Compliance gap analysis with remediation steps',
        'Delivered within 1 week'
      ],
      whyNeed: 'Don\'t qualify for USMCA benefits? Need professional guidance to restructure supply chain?',
      disclaimer: 'For official USMCA certificates, we partner with licensed customs brokers'
    },
    {
      id: 'supply-chain-optimization',
      icon: '🔧',
      title: 'Supply Chain Optimization',
      price: 275,
      displayPrice: 275,
      expert: 'Cristina Lead (60%) • Jorge Support (40%)',
      benefits: [
        'AI analysis validated by compliance expert',
        'Cost reduction opportunities identified',
        'Process optimization recommendations',
        'Logistics efficiency improvements'
      ],
      deliverables: [
        'Complete supply chain efficiency audit',
        'Cost reduction opportunity analysis',
        'Delivered within 1-2 weeks'
      ],
      whyNeed: 'Already qualified but want to reduce costs? Get expert analysis and improvements.'
    },
    {
      id: 'pathfinder',
      icon: '🚀',
      title: 'Pathfinder Market Entry',
      price: 350,
      displayPrice: 350,
      expert: 'Jorge Lead (65%) • Cristina Support (35%)',
      benefits: [
        'Complete Mexico market analysis',
        'Distribution partner recommendations',
        '90-day implementation plan',
        'Regulatory requirements validation'
      ],
      deliverables: [
        'Mexico market opportunity assessment',
        '90-day go-to-market implementation plan',
        'Go-to-market presentation delivered'
      ],
      whyNeed: 'Want to establish Mexico presence for USMCA qualification? Get expert market entry guidance.'
    },
    {
      id: 'supply-chain-resilience',
      icon: '🛡️',
      title: 'Supply Chain Resilience',
      price: 450,
      displayPrice: 450,
      expert: 'Jorge Lead (60%) • Cristina Support (40%)',
      benefits: [
        '3-5 verified alternative supplier options',
        'USMCA qualification status for each',
        'Risk mitigation and contingency plan',
        'Supplier capability assessment'
      ],
      deliverables: [
        '3-5 alternative supplier options with analysis',
        'USMCA qualification verification',
        'Delivered within 2-3 weeks'
      ],
      whyNeed: 'Dependent on single supplier? Facing geopolitical risks? Get alternatives.'
    },
    {
      id: 'crisis-navigator',
      icon: '🆘',
      title: 'Crisis Navigator',
      price: 200,
      displayPrice: 200,
      expert: 'Cristina Lead (60%) • Jorge Support (40%)',
      recurring: true,
      benefits: [
        'Priority 4-hour emergency response',
        'Monthly regulatory updates',
        'Unlimited trade consultation',
        'Emergency compliance resolution'
      ],
      deliverables: [
        'Priority emergency response (4-hour SLA)',
        'Monthly regulatory monitoring',
        '$200/month ongoing retainer'
      ],
      whyNeed: 'Shipment held at customs? Tariffs changed overnight? Get emergency response.'
    }
  ];

  // Fetch user's workflows when form opens (for subscribers)
  useEffect(() => {
    if (showIntakeForm && isSubscriberForm && user) {
      fetchUserWorkflows();
    }
  }, [showIntakeForm, isSubscriberForm, user]);

  const fetchUserWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('usmca_workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUserWorkflows(data);
        // Auto-select first workflow
        if (data.length > 0) {
          setSelectedWorkflowId(data[0].id);
          setSelectedWorkflow(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const handleWorkflowSelect = (e) => {
    const workflowId = e.target.value;
    setSelectedWorkflowId(workflowId);
    const workflow = userWorkflows.find(w => w.id === workflowId);
    setSelectedWorkflow(workflow);
    setFormData(prev => ({ ...prev, selected_workflow_id: workflowId }));
  };

  const handleServiceRequest = async (serviceId) => {
    if (!user) {
      alert('Please sign in to request professional services');
      window.location.href = '/login?redirect=/services/logistics-support';
      return;
    }

    // Check if user has workflows in database
    const { data: workflows, error } = await supabase
      .from('usmca_workflows')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    const hasWorkflows = !error && workflows && workflows.length > 0;

    // Subscribers with workflows see dropdown form
    if (hasWorkflows) {
      setIsSubscriberForm(true);
      setShowIntakeForm(serviceId);
      return;
    }

    // Non-subscribers see full form with +20% markup
    setIsSubscriberForm(false);
    setShowIntakeForm(serviceId);
  };

  const proceedToCheckout = async (serviceId) => {
    setIsProcessing(prev => ({ ...prev, [serviceId]: true }));

    try {
      // Prepare service request data
      let serviceRequestData;

      if (isSubscriberForm && selectedWorkflow) {
        // Use selected workflow data
        const workflowData = selectedWorkflow.workflow_data || {};
        serviceRequestData = {
          workflow_id: selectedWorkflow.id,
          company_name: workflowData.company_name || 'Unknown Company',
          concerns: formData.concerns,
          client_info: {
            company: workflowData.company_name,
            email: user?.email,
            contact_name: workflowData.contact_name || 'Contact'
          },
          service_details: {
            product_description: workflowData.product_description,
            business_type: workflowData.business_type,
            trade_volume: workflowData.trade_volume,
            manufacturing_location: workflowData.manufacturing_location
          },
          subscriber_data: workflowData
        };
      } else {
        // Use form data for non-subscribers
        serviceRequestData = {
          company_name: formData.company_name,
          client_info: {
            company: formData.company_name,
            email: user?.email,
            contact_name: formData.contact_name,
            phone: formData.phone
          },
          service_details: {
            product_description: formData.product_description,
            business_type: formData.business_type,
            trade_volume: formData.trade_volume,
            manufacturing_location: formData.manufacturing_location,
            current_qualification_status: formData.current_qualification_status,
            qualification_problem: formData.qualification_problem
          },
          subscriber_data: formData
        };
      }

      // Calculate price (20% markup for non-subscribers)
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
          price_override: isSubscriberForm ? null : finalPriceCents
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
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

    if (isSubscriberForm) {
      // Validate subscriber form
      if (!selectedWorkflowId) {
        alert('Please select a workflow');
        return;
      }
      if (!formData.concerns || formData.concerns.trim().length < 10) {
        alert('Please describe your concerns (at least 10 characters)');
        return;
      }
    } else {
      // Validate non-subscriber form
      if (!formData.company_name || !formData.business_type ||
          !formData.product_description || !formData.trade_volume ||
          !formData.contact_name || !formData.current_qualification_status ||
          !formData.qualification_problem) {
        alert('Please fill in all required fields marked with *');
        return;
      }
    }

    // Proceed to checkout
    const serviceId = showIntakeForm;
    setShowIntakeForm(null);
    await proceedToCheckout(serviceId);
  };

  return (
    <>
      <Head>
        <title>Professional Services - Triangle Trade Intelligence</title>
        <meta name="description" content="Expert USMCA compliance and Mexico trade services" />
      </Head>

      {/* Intake Form Modal */}
      {showIntakeForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '800px'}}>
            <div className="modal-header">
              <h2>{isSubscriberForm ? 'Request Professional Service' : 'Business Information Required (+20% Fee)'}</h2>
              <button className="modal-close" onClick={() => setShowIntakeForm(null)}>×</button>
            </div>

            {isSubscriberForm ? (
              /* ===== SUBSCRIBER FORM: WORKFLOW DROPDOWN ===== */
              <form onSubmit={handleFormSubmit}>
                <div className="form-section">
                  {/* Workflow Selector */}
                  <div className="form-group">
                    <label className="form-label">Select Workflow/Certificate *</label>
                    <select
                      className="form-input"
                      value={selectedWorkflowId}
                      onChange={handleWorkflowSelect}
                      required
                    >
                      <option value="">Choose a workflow...</option>
                      {userWorkflows.map(workflow => {
                        const data = workflow.workflow_data || {};
                        const createdDate = new Date(workflow.created_at).toLocaleDateString();
                        return (
                          <option key={workflow.id} value={workflow.id}>
                            {data.company_name || 'Unnamed Workflow'} - {data.product_description?.substring(0, 40) || 'No description'} ({createdDate})
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-small" style={{marginTop: '0.5rem', color: '#6b7280'}}>
                      Select which workflow/certificate you want this service for
                    </p>
                  </div>

                  {/* Workflow Preview */}
                  {selectedWorkflow && (
                    <div className="content-card" style={{backgroundColor: '#f0f9ff', marginBottom: '1.5rem'}}>
                      <h3 className="content-card-title">Selected Workflow Preview</h3>
                      <div className="text-body">
                        <p><strong>Company:</strong> {selectedWorkflow.workflow_data?.company_name}</p>
                        <p><strong>Product:</strong> {selectedWorkflow.workflow_data?.product_description}</p>
                        <p><strong>Business Type:</strong> {selectedWorkflow.workflow_data?.business_type}</p>
                        <p><strong>Trade Volume:</strong> {selectedWorkflow.workflow_data?.trade_volume}</p>
                        <p><strong>Manufacturing:</strong> {selectedWorkflow.workflow_data?.manufacturing_location}</p>
                        <p><strong>Status:</strong> <span style={{
                          color: selectedWorkflow.workflow_data?.qualified ? '#16a34a' : '#dc2626',
                          fontWeight: '600'
                        }}>
                          {selectedWorkflow.workflow_data?.qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}
                        </span></p>
                      </div>
                    </div>
                  )}

                  {/* Additional Concerns */}
                  <div className="form-group">
                    <label className="form-label">Describe your situation *</label>
                    <textarea
                      name="concerns"
                      value={formData.concerns}
                      onChange={handleFormChange}
                      required
                      className="form-input"
                      rows="4"
                      placeholder="What specific help do you need with this workflow? Example: 'Need help finding Mexico suppliers to replace China components' or 'Want to verify AI qualification calculation'"
                    />
                    <p className="text-small" style={{marginTop: '0.5rem', color: '#6b7280'}}>
                      Minimum 10 characters. Be specific so our team can provide the best help.
                    </p>
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
            ) : (
              /* ===== NON-SUBSCRIBER FORM: CLEAN LAYOUT ===== */
              <>
                <div className="content-card" style={{backgroundColor: '#fef3c7', marginBottom: '1.5rem'}}>
                  <p className="text-body" style={{margin: 0, color: '#92400e'}}>
                    <strong>💡 Save 20%:</strong> Complete our{' '}
                    <a href="/usmca-workflow" style={{color: '#2563eb', textDecoration: 'underline'}}>
                      free USMCA workflow
                    </a>{' '}
                    first to skip this form and pay base price!
                  </p>
                </div>

                <form onSubmit={handleFormSubmit}>
                  <div className="form-section">
                    <h3 className="form-section-title">Company Information</h3>

                    <div className="grid-2-cols">
                      <div className="form-group">
                        <label className="form-label">Company Name *</label>
                        <input type="text" name="company_name" value={formData.company_name} onChange={handleFormChange} required className="form-input" />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Business Type *</label>
                        <select name="business_type" value={formData.business_type} onChange={handleFormChange} required className="form-input">
                          <option value="">Select type</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Import/Export">Import/Export</option>
                          <option value="Distribution">Distribution</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Annual Trade Volume *</label>
                        <select name="trade_volume" value={formData.trade_volume} onChange={handleFormChange} required className="form-input">
                          <option value="">Select volume</option>
                          <option value="Under $100K">Under $100K</option>
                          <option value="$100K-$500K">$100K-$500K</option>
                          <option value="$500K-$1M">$500K-$1M</option>
                          <option value="$1M-$5M">$1M-$5M</option>
                          <option value="Over $5M">Over $5M</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Contact Name *</label>
                        <input type="text" name="contact_name" value={formData.contact_name} onChange={handleFormChange} required className="form-input" />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleFormChange} className="form-input" placeholder="(555) 123-4567" />
                      </div>
                    </div>

                    <h3 className="form-section-title" style={{marginTop: '2rem'}}>Product & USMCA Status</h3>

                    <div className="form-group">
                      <label className="form-label">Product Description *</label>
                      <textarea name="product_description" value={formData.product_description} onChange={handleFormChange} required className="form-input" rows="3" placeholder="What do you manufacture or import?" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Manufacturing Location</label>
                      <input type="text" name="manufacturing_location" value={formData.manufacturing_location} onChange={handleFormChange} className="form-input" placeholder="Current or planned" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Do you currently qualify for USMCA? *</label>
                      <select name="current_qualification_status" value={formData.current_qualification_status} onChange={handleFormChange} required className="form-input">
                        <option value="">Select status</option>
                        <option value="qualified">Yes, we qualify</option>
                        <option value="not-qualified">No, we don't qualify</option>
                        <option value="unsure">Unsure / Haven't checked</option>
                        <option value="borderline">Borderline / Close to threshold</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">What problem are you trying to solve? *</label>
                      <textarea name="qualification_problem" value={formData.qualification_problem} onChange={handleFormChange} required className="form-input" rows="3" placeholder="Example: 'Too much content from China, need Mexico suppliers' or 'Facing new tariffs, need crisis response'" />
                    </div>

                    <h3 className="form-section-title" style={{marginTop: '2rem'}}>Component Origins (Optional)</h3>
                    <p className="text-small" style={{marginBottom: '1rem', color: '#6b7280'}}>
                      Approximate percentages help us understand your supply chain
                    </p>

                    <div className="grid-2-cols">
                      <div className="form-group">
                        <label className="form-label">China %</label>
                        <input type="number" name="component_origins_china" value={formData.component_origins_china} onChange={handleFormChange} className="form-input" placeholder="0-100" min="0" max="100" />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Mexico %</label>
                        <input type="number" name="component_origins_mexico" value={formData.component_origins_mexico} onChange={handleFormChange} className="form-input" placeholder="0-100" min="0" max="100" />
                      </div>

                      <div className="form-group">
                        <label className="form-label">USA/Canada %</label>
                        <input type="number" name="component_origins_usmca" value={formData.component_origins_usmca} onChange={handleFormChange} className="form-input" placeholder="0-100" min="0" max="100" />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Other %</label>
                        <input type="number" name="component_origins_other" value={formData.component_origins_other} onChange={handleFormChange} className="form-input" placeholder="0-100" min="0" max="100" />
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

      {/* Service Cards */}
      <div className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title">Expert Services for USMCA Qualification</h1>
            <p className="section-header-subtitle">
              Don't qualify for USMCA benefits? Facing trade risks? Our expert team helps you achieve qualification.
            </p>
          </div>

          {!authLoading && !user && (
            <div className="content-card" style={{backgroundColor: '#fef3c7', marginBottom: '2rem'}}>
              <p className="text-body" style={{margin: 0, color: '#92400e', textAlign: 'center'}}>
                <strong>Sign in required:</strong> Please sign in to request professional services
              </p>
            </div>
          )}

          <div className="grid-3-cols">
            {services.map((service) => (
              <div key={service.id} className="content-card">
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
                  <span style={{fontSize: '2rem', marginRight: '0.75rem'}}>{service.icon}</span>
                  <div>
                    <h3 className="content-card-title">{service.title}</h3>
                    <p className="text-small" style={{color: '#6b7280', margin: 0}}>{service.expert}</p>
                  </div>
                  <div style={{marginLeft: 'auto', textAlign: 'right'}}>
                    <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#134169'}}>
                      ${service.displayPrice}{service.recurring ? '/mo' : ''}
                    </div>
                  </div>
                </div>

                <div style={{marginBottom: '1rem', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '8px'}}>
                  <p style={{margin: 0, color: '#92400e', fontSize: '0.9rem'}}>{service.whyNeed}</p>
                </div>

                <div style={{marginBottom: '1rem'}}>
                  {service.benefits.map((benefit, idx) => (
                    <p key={idx} className="text-body" style={{marginBottom: '0.25rem'}}>
                      ✓ {benefit}
                    </p>
                  ))}
                </div>

                {service.disclaimer && (
                  <p className="text-small" style={{fontStyle: 'italic', color: '#6b7280', marginBottom: '1rem'}}>
                    Note: {service.disclaimer}
                  </p>
                )}

                <button
                  onClick={() => window.location.href = '/services/request-form'}
                  className="btn-primary"
                  style={{width: '100%'}}
                >
                  Request Service - ${service.displayPrice}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
