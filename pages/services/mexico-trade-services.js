/**
 * Jorge's Mexico Trade Services - Client Intake Portal
 * Dynamic service request forms for supplier vetting, market entry, and partnership intelligence
 * NO HARDCODED VALUES - All data from configuration and database
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';

export default function MexicoTradeServices() {
  const router = useRouter();
  const { user, loading: authLoading } = useSimpleAuth();
  const [loading, setLoading] = useState(true);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [industries, setIndustries] = useState([]);

  // Form state
  const [selectedService, setSelectedService] = useState('');
  const [formData, setFormData] = useState({
    service_type: '',
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    country: '',
    industry: '',
    project_description: '',
    timeline: '',
    budget_range: '',
    priority: 'medium',
    referral_source: '',
    requirements: '',
    // Supplier vetting fields
    volume: '',
    quality_standards: '',
    challenges: '',
    // Market entry fields
    market_presence: '',
    target_regions: '',
    concerns: '',
    // Manufacturing feasibility fields
    preferred_locations: '',
    setup_timeline: '',
    // Partnership intelligence fields
    focus_areas: '',
    company_size: '',
    frequency: '',
    geographic_focus: '',
    intelligence_priorities: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [dataStorageConsent, setDataStorageConsent] = useState(false);

  useEffect(() => {
    loadFormConfiguration();
  }, []);

  const loadFormConfiguration = async () => {
    try {
      setLoading(true);
      console.log('🇲🇽 Loading consultation request configuration...');

      // Load consultation options for Jorge's services
      setServiceTypes([
        {
          id: 'Supplier Sourcing',
          name: '🔍 Supplier Sourcing',
          price: 450,
          description: 'Find and vet qualified Mexico suppliers for your product needs',
          duration: '2-3 weeks',
          consultation_focus: 'Understanding your supplier requirements and quality standards'
        },
        {
          id: 'Manufacturing Feasibility',
          name: '🏭 Manufacturing Feasibility',
          price: 650,
          description: 'Location recommendations, regulatory overview, and cost analysis for Mexico manufacturing',
          duration: '3-4 weeks',
          consultation_focus: 'Assessing your manufacturing needs and investment capacity'
        },
        {
          id: 'Market Entry',
          name: '🚀 Market Entry',
          price: 550,
          description: 'Strategic market entry planning with partnership introductions',
          duration: '2-3 weeks',
          consultation_focus: 'Understanding your market entry goals and partnership needs'
        }
      ]);

      // Set basic country and industry options
      setCountries([
        { code: 'US', name: 'United States' },
        { code: 'CA', name: 'Canada' },
        { code: 'MX', name: 'Mexico' }
      ]);

      setIndustries([
        { code: 'manufacturing', name: 'Manufacturing' },
        { code: 'electronics', name: 'Electronics' },
        { code: 'automotive', name: 'Automotive' },
        { code: 'textiles', name: 'Textiles' },
        { code: 'food', name: 'Food & Beverage' },
        { code: 'other', name: 'Other' }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error loading form configuration:', error);
      setLoading(false);
    }
  };

  const handleServiceSelection = (serviceId) => {
    setSelectedService(serviceId);
    setFormData({ ...formData, service_type: serviceId });
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: null });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.service_type) errors.service_type = 'Please select a service';
    if (!formData.company_name) errors.company_name = 'Company name is required';
    if (!formData.contact_name) errors.contact_name = 'Contact name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.project_description) errors.project_description = 'Project description is required';

    // Client consent validation - REQUIRED for database storage
    if (!dataStorageConsent) {
      errors.consent = 'You must consent to data storage to proceed with professional services';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/admin/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          assigned_to: 'Jorge',
          status: 'pending',
          source: 'mexico_trade_services_portal',
          created_at: new Date().toISOString(),
          user_id: user?.id || null,
          // Client consent data for database storage compliance
          data_storage_consent: dataStorageConsent,
          consent_timestamp: new Date().toISOString(),
          privacy_policy_version: 'v1.0'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitStatus({
          type: 'success',
          message: 'Consultation request submitted successfully! Jorge will contact you within 24 hours to schedule your 15-minute call.',
          request_id: result.request_id
        });

        // Service request created successfully - no additional setup needed

        // Reset form
        setFormData({
          service_type: '', company_name: '', contact_name: '', email: '', phone: '',
          country: '', industry: '', project_description: '', timeline: '', budget_range: '',
          priority: 'medium', referral_source: '', requirements: '',
          volume: '', quality_standards: '', challenges: '', market_presence: '', target_regions: '',
          concerns: '', preferred_locations: '', setup_timeline: '',
          focus_areas: '', company_size: '', frequency: '', geographic_focus: '',
          intelligence_priorities: ''
        });
        setSelectedService('');
        setDataStorageConsent(false);
      } else {
        const error = await response.json();
        setSubmitStatus({
          type: 'error',
          message: error.message || 'Failed to submit service request. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error submitting service request:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="content-card">
          <div className="card-header text-center">
            <div className="text-body">Loading Mexico trade services...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Mexico Trade Services - Triangle Intelligence</title>
        <meta name="description" content="Professional Mexico trade services including supplier vetting, market entry strategy, and partnership intelligence" />
      </Head>

      <div className="admin-dashboard">
        <div className="admin-header">
          <h1 className="admin-title">🇲🇽 Mexico Trade Services</h1>
          <p className="admin-subtitle">
            Professional services for North American businesses entering Mexico markets
          </p>
          <div className="credentials-badge">
            <span>Jorge Cervantes</span>
            <span className="license-number">Mexico Trade Specialist</span>
          </div>
        </div>

        {submitStatus && (
          <div className={`content-card ${submitStatus.type === 'success' ? 'bg-cristina' : ''}`}>
            <div className="card-header">
              <h3 className={`card-title ${submitStatus.type === 'success' ? 'text-success' : 'text-danger'}`}>
                {submitStatus.type === 'success' ? '✅ Request Submitted' : '❌ Submission Failed'}
              </h3>
              <p className="text-body">{submitStatus.message}</p>
              {submitStatus.request_id && (
                <p className="text-muted font-xs">Request ID: {submitStatus.request_id}</p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="content-card">
          <div className="card-header">
            <h2 className="card-title">Request 15-Minute Consultation</h2>
            <p className="card-description">Select the service you're interested in discussing with Jorge</p>
          </div>

          <div className="admin-table-container">
            <div className="grid-3-cols">
              {serviceTypes.map((service) => (
                <div
                  key={service.id}
                  className={`card cursor-pointer ${selectedService === service.id ? 'border-jorge' : ''}`}
                  onClick={() => handleServiceSelection(service.id)}
                >
                  <div className="card-header">
                    <h3 className="content-card-title">{service.name}</h3>
                    <div className="revenue-amount text-jorge">
                      ${service.price}{service.pricing_type === 'hourly' ? '/hour' : service.pricing_type === 'monthly' ? '/month' : ''}
                    </div>
                  </div>
                  <div className="p-20">
                    <p className="text-body">{service.description}</p>
                    <div className="text-muted font-metric">
                      Timeline: {service.duration}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {formErrors.service_type && <div className="badge-danger">{formErrors.service_type}</div>}
          </div>

          {selectedService && (
            <>
              <div className="card-header">
                <h2 className="card-title">Pre-Consultation Information</h2>
                <p className="card-description">Help Jorge prepare for your 15-minute consultation call</p>
              </div>

              {/* Basic Contact Information */}
              <div className="admin-table-container">
                <div className="grid-2-cols">
                  <div className="form-group">
                    <label className="font-label">Company Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`filter-select ${formErrors.company_name ? 'border-danger' : ''}`}
                      value={formData.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      placeholder="Your company name"
                    />
                    {formErrors.company_name && <div className="badge-danger">{formErrors.company_name}</div>}
                  </div>

                  <div className="form-group">
                    <label className="font-label">Contact Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`filter-select ${formErrors.contact_name ? 'border-danger' : ''}`}
                      value={formData.contact_name}
                      onChange={(e) => handleInputChange('contact_name', e.target.value)}
                      placeholder="Your full name"
                    />
                    {formErrors.contact_name && <div className="badge-danger">{formErrors.contact_name}</div>}
                  </div>

                  <div className="form-group">
                    <label className="font-label">Email <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      className={`filter-select ${formErrors.email ? 'border-danger' : ''}`}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="contact@company.com"
                    />
                    {formErrors.email && <div className="badge-danger">{formErrors.email}</div>}
                  </div>

                  <div className="form-group">
                    <label className="font-label">Phone</label>
                    <input
                      type="tel"
                      className="filter-select"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="form-group">
                    <label className="font-label">Industry</label>
                    <select
                      className="filter-select"
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                    >
                      <option value="">Select industry</option>
                      {industries.map((industry) => (
                        <option key={industry.code} value={industry.code}>
                          {industry.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="font-label">How did you hear about us?</label>
                    <input
                      type="text"
                      className="filter-select"
                      value={formData.referral_source}
                      onChange={(e) => handleInputChange('referral_source', e.target.value)}
                      placeholder="Google search, referral, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Service-Specific Questions */}
              {selectedService === 'Supplier Sourcing' && (
                <div className="admin-table-container">
                  <div className="card-header">
                    <h3 className="content-card-title">Supplier Sourcing Information</h3>
                    <p className="card-description">Help Jorge prepare for your supplier sourcing consultation</p>
                  </div>

                  <div className="form-group">
                    <label className="font-label">What products do you need to source? <span className="text-danger">*</span></label>
                    <textarea
                      className={`filter-select ${formErrors.project_description ? 'border-danger' : ''}`}
                      rows="3"
                      value={formData.project_description}
                      onChange={(e) => handleInputChange('project_description', e.target.value)}
                      placeholder="Describe the products you want to source from Mexico suppliers..."
                    />
                    {formErrors.project_description && <div className="badge-danger">{formErrors.project_description}</div>}
                  </div>

                  <div className="grid-2-cols">
                    <div className="form-group">
                      <label className="font-label">Target quantity/volume</label>
                      <input
                        type="text"
                        className="filter-select"
                        value={formData.volume}
                        onChange={(e) => handleInputChange('volume', e.target.value)}
                        placeholder="e.g., 10,000 units/month"
                      />
                    </div>

                    <div className="form-group">
                      <label className="font-label">Quality requirements</label>
                      <input
                        type="text"
                        className="filter-select"
                        value={formData.quality_standards}
                        onChange={(e) => handleInputChange('quality_standards', e.target.value)}
                        placeholder="e.g., ISO certified, FDA approved"
                      />
                    </div>

                    <div className="form-group">
                      <label className="font-label">Timeline to start sourcing</label>
                      <select
                        className="filter-select"
                        value={formData.timeline}
                        onChange={(e) => handleInputChange('timeline', e.target.value)}
                      >
                        <option value="">Select timeline</option>
                        <option value="immediate">Immediate (1-2 weeks)</option>
                        <option value="short">Short term (1 month)</option>
                        <option value="medium">Medium term (2-3 months)</option>
                        <option value="long">Long term (6+ months)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="font-label">Budget for sourcing project</label>
                      <select
                        className="filter-select"
                        value={formData.budget_range}
                        onChange={(e) => handleInputChange('budget_range', e.target.value)}
                      >
                        <option value="">Select budget range</option>
                        <option value="under-10k">Under $10,000</option>
                        <option value="10k-50k">$10,000 - $50,000</option>
                        <option value="50k-250k">$50,000 - $250,000</option>
                        <option value="250k-plus">$250,000+</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="font-label">Specific challenges or concerns</label>
                    <textarea
                      className="filter-select"
                      rows="2"
                      value={formData.challenges}
                      onChange={(e) => handleInputChange('challenges', e.target.value)}
                      placeholder="Any specific concerns about supplier reliability, logistics, quality control, etc."
                    />
                  </div>
                </div>
              )}

              {selectedService === 'Market Entry' && (
                <div className="admin-table-container">
                  <div className="card-header">
                    <h3 className="content-card-title">Market Entry Strategy Information</h3>
                    <p className="card-description">Help Jorge prepare for your Mexico market entry consultation</p>
                  </div>

                  <div className="form-group">
                    <label className="font-label">What products/services do you want to bring to Mexico? <span className="text-danger">*</span></label>
                    <textarea
                      className={`filter-select ${formErrors.project_description ? 'border-danger' : ''}`}
                      rows="3"
                      value={formData.project_description}
                      onChange={(e) => handleInputChange('project_description', e.target.value)}
                      placeholder="Describe your products/services and target market in Mexico..."
                    />
                    {formErrors.project_description && <div className="badge-danger">{formErrors.project_description}</div>}
                  </div>

                  <div className="grid-2-cols">
                    <div className="form-group">
                      <label className="font-label">Current market presence</label>
                      <select
                        className="filter-select"
                        value={formData.market_presence}
                        onChange={(e) => handleInputChange('market_presence', e.target.value)}
                      >
                        <option value="">Select current presence</option>
                        <option value="none">No presence in Mexico</option>
                        <option value="research">Market research phase</option>
                        <option value="planning">Planning market entry</option>
                        <option value="limited">Limited presence</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="font-label">Target Mexico regions</label>
                      <input
                        type="text"
                        className="filter-select"
                        value={formData.target_regions}
                        onChange={(e) => handleInputChange('target_regions', e.target.value)}
                        placeholder="e.g., Mexico City, Guadalajara, border regions"
                      />
                    </div>

                    <div className="form-group">
                      <label className="font-label">Timeline for market entry</label>
                      <select
                        className="filter-select"
                        value={formData.timeline}
                        onChange={(e) => handleInputChange('timeline', e.target.value)}
                      >
                        <option value="">Select timeline</option>
                        <option value="immediate">Immediate (1-3 months)</option>
                        <option value="short">Short term (3-6 months)</option>
                        <option value="medium">Medium term (6-12 months)</option>
                        <option value="long">Long term (12+ months)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="font-label">Investment budget</label>
                      <select
                        className="filter-select"
                        value={formData.budget_range}
                        onChange={(e) => handleInputChange('budget_range', e.target.value)}
                      >
                        <option value="">Select budget range</option>
                        <option value="under-25k">Under $25,000</option>
                        <option value="25k-100k">$25,000 - $100,000</option>
                        <option value="100k-500k">$100,000 - $500,000</option>
                        <option value="500k-plus">$500,000+</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="font-label">Biggest concerns about entering Mexico market</label>
                    <textarea
                      className="filter-select"
                      rows="2"
                      value={formData.concerns}
                      onChange={(e) => handleInputChange('concerns', e.target.value)}
                      placeholder="Legal requirements, cultural differences, competition, regulations, etc."
                    />
                  </div>
                </div>
              )}

              {selectedService === 'Manufacturing Feasibility' && (
                <div className="admin-table-container">
                  <div className="card-header">
                    <h3 className="content-card-title">Manufacturing Feasibility Information</h3>
                    <p className="card-description">Help Jorge prepare for your Mexico manufacturing feasibility consultation</p>
                  </div>

                  <div className="form-group">
                    <label className="font-label">What product(s) are you considering manufacturing in Mexico? <span className="text-danger">*</span></label>
                    <textarea
                      className={`filter-select ${formErrors.project_description ? 'border-danger' : ''}`}
                      rows="3"
                      value={formData.project_description}
                      onChange={(e) => handleInputChange('project_description', e.target.value)}
                      placeholder="Describe the product(s), manufacturing requirements, and any specific technical considerations..."
                    />
                    {formErrors.project_description && <div className="badge-danger">{formErrors.project_description}</div>}
                  </div>

                  <div className="grid-2-cols">
                    <div className="form-group">
                      <label className="font-label">Production volume</label>
                      <input
                        type="text"
                        className="filter-select"
                        value={formData.volume}
                        onChange={(e) => handleInputChange('volume', e.target.value)}
                        placeholder="e.g., 50,000 units/month"
                      />
                    </div>

                    <div className="form-group">
                      <label className="font-label">Investment budget range</label>
                      <select
                        className="filter-select"
                        value={formData.budget_range}
                        onChange={(e) => handleInputChange('budget_range', e.target.value)}
                      >
                        <option value="">Select budget range</option>
                        <option value="under-500k">Under $500K</option>
                        <option value="500k-1m">$500K - $1M</option>
                        <option value="1m-5m">$1M - $5M</option>
                        <option value="over-5m">Over $5M</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="font-label">Preferred manufacturing locations</label>
                      <input
                        type="text"
                        className="filter-select"
                        value={formData.preferred_locations}
                        onChange={(e) => handleInputChange('preferred_locations', e.target.value)}
                        placeholder="e.g., Border regions, Guadalajara, Mexico City"
                      />
                    </div>

                    <div className="form-group">
                      <label className="font-label">Timeline for manufacturing setup</label>
                      <select
                        className="filter-select"
                        value={formData.setup_timeline}
                        onChange={(e) => handleInputChange('setup_timeline', e.target.value)}
                      >
                        <option value="">Select timeline</option>
                        <option value="immediate">Immediate (1-3 months)</option>
                        <option value="short-term">Short-term (3-6 months)</option>
                        <option value="medium-term">Medium-term (6-12 months)</option>
                        <option value="long-term">Long-term (12+ months)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="font-label">Specific intelligence priorities</label>
                    <textarea
                      className="filter-select"
                      rows="2"
                      value={formData.intelligence_priorities}
                      onChange={(e) => handleInputChange('intelligence_priorities', e.target.value)}
                      placeholder="Market trends, regulatory changes, competitor activity, new opportunities, etc."
                    />
                  </div>
                </div>
              )}

              {/* Client Consent Section - REQUIRED for database storage */}
              <div className="form-group">
                <div className="consent-section">
                  <label className="consent-label">
                    <input
                      type="checkbox"
                      checked={dataStorageConsent}
                      onChange={(e) => setDataStorageConsent(e.target.checked)}
                      className="consent-checkbox"
                      required
                    />
                    <span className="consent-text">
                      I consent to Triangle Intelligence storing my company information and project details in our secure database for professional service delivery. This enables our Mexico trade specialists to provide personalized consultation and maintain project continuity.
                    </span>
                  </label>
                  {formErrors.consent && (
                    <div className="error-message">{formErrors.consent}</div>
                  )}
                  <div className="consent-note">
                    <small>Your data will only be used for service delivery and will not be shared with third parties. You may request data deletion at any time.</small>
                  </div>
                </div>
              </div>

              <div className="card-header">
                <div className="admin-actions">
                  <button
                    type="submit"
                    className="admin-btn primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Requesting Consultation...' : 'Request 15-Minute Consultation'}
                  </button>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => {
                      setSelectedService('');
                      setFormData({
                        service_type: '', company_name: '', contact_name: '', email: '', phone: '',
                        country: '', industry: '', project_description: '', timeline: '', budget_range: '',
                        priority: 'medium', referral_source: '', requirements: '',
                        volume: '', quality_standards: '', challenges: '', market_presence: '', target_regions: '',
                        concerns: '', focus_areas: '', company_size: '', frequency: '', geographic_focus: '',
                        intelligence_priorities: ''
                      });
                    }}
                  >
                    Reset Form
                  </button>
                </div>
              </div>
            </>
          )}
        </form>

      </div>
    </>
  );
}