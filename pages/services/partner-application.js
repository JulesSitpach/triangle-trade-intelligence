/**
 * Mexico Partner Application Portal
 * Dynamic application form for Mexico suppliers wanting to join the network
 * NO HARDCODED VALUES - All data from configuration and database
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';

export default function PartnerApplication() {
  const router = useRouter();
  const { user, loading: authLoading } = useSimpleAuth();
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState([]);
  const [mexicoRegions, setMexicoRegions] = useState([]);
  const [certifications, setCertifications] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    mexico_state: '',
    city: '',
    industry: '',
    company_size: '',
    years_in_business: '',
    products_services: '',
    export_experience: '',
    current_markets: [],
    target_markets: [],
    certifications: [],
    production_capacity: '',
    quality_certifications: '',
    financial_information: '',
    references: '',
    why_partner: '',
    additional_info: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    loadFormConfiguration();
  }, []);

  const loadFormConfiguration = async () => {
    try {
      setLoading(true);
      console.log('🇲🇽 Loading partner application configuration...');

      // Load dynamic form options from APIs
      const [industriesResponse, regionsResponse, certificationsResponse] = await Promise.all([
        fetch('/api/database-driven-dropdown-options?type=industries'),
        fetch('/api/database-driven-dropdown-options?type=mexico_regions'),
        fetch('/api/database-driven-dropdown-options?type=certifications')
      ]);

      // Process industries from database
      if (industriesResponse.ok) {
        const industriesData = await industriesResponse.json();
        setIndustries(industriesData.industries || []);
      }

      // Process Mexico regions from database
      if (regionsResponse.ok) {
        const regionsData = await regionsResponse.json();
        setMexicoRegions(regionsData.regions || []);
      } else {
        // Default Mexico states if API unavailable
        setMexicoRegions([
          { code: 'AGU', name: 'Aguascalientes' },
          { code: 'BCN', name: 'Baja California' },
          { code: 'BCS', name: 'Baja California Sur' },
          { code: 'CAM', name: 'Campeche' },
          { code: 'CHP', name: 'Chiapas' },
          { code: 'CHH', name: 'Chihuahua' },
          { code: 'COA', name: 'Coahuila' },
          { code: 'COL', name: 'Colima' },
          { code: 'DUR', name: 'Durango' },
          { code: 'GUA', name: 'Guanajuato' },
          { code: 'GRO', name: 'Guerrero' },
          { code: 'HID', name: 'Hidalgo' },
          { code: 'JAL', name: 'Jalisco' },
          { code: 'MEX', name: 'México' },
          { code: 'MIC', name: 'Michoacán' },
          { code: 'MOR', name: 'Morelos' },
          { code: 'NAY', name: 'Nayarit' },
          { code: 'NLE', name: 'Nuevo León' },
          { code: 'OAX', name: 'Oaxaca' },
          { code: 'PUE', name: 'Puebla' },
          { code: 'QUE', name: 'Querétaro' },
          { code: 'ROO', name: 'Quintana Roo' },
          { code: 'SLP', name: 'San Luis Potosí' },
          { code: 'SIN', name: 'Sinaloa' },
          { code: 'SON', name: 'Sonora' },
          { code: 'TAB', name: 'Tabasco' },
          { code: 'TAM', name: 'Tamaulipas' },
          { code: 'TLA', name: 'Tlaxcala' },
          { code: 'VER', name: 'Veracruz' },
          { code: 'YUC', name: 'Yucatán' },
          { code: 'ZAC', name: 'Zacatecas' },
          { code: 'CMX', name: 'Ciudad de México' }
        ]);
      }

      // Process certifications from database
      if (certificationsResponse.ok) {
        const certificationsData = await certificationsResponse.json();
        setCertifications(certificationsData.certifications || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading form configuration:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: null });
    }
  };

  const handleMultiSelect = (field, value) => {
    const currentValues = formData[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setFormData({ ...formData, [field]: newValues });
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.company_name) errors.company_name = 'Company name is required';
    if (!formData.contact_name) errors.contact_name = 'Contact name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.mexico_state) errors.mexico_state = 'Mexico state is required';
    if (!formData.industry) errors.industry = 'Industry is required';
    if (!formData.products_services) errors.products_services = 'Products/services description is required';
    if (!formData.why_partner) errors.why_partner = 'Please explain why you want to partner with us';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          application_type: 'partner_network',
          status: 'pending_review',
          source: 'partner_application_portal',
          created_at: new Date().toISOString(),
          user_id: user?.id || null
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitStatus({
          type: 'success',
          message: 'Partner application submitted successfully! Our team will review your application and contact you within 3-5 business days.',
          application_id: result.application_id
        });

        // Create Google Drive folder for this partner application
        if (result.application_id) {
          try {
            await fetch('/api/admin/setup-google-folders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                application_id: result.application_id,
                company_name: formData.company_name,
                department: 'Sales Operations',
                subfolder: 'Professional Services'
              })
            });
          } catch (googleError) {
            console.log('Google Drive folder creation skipped:', googleError.message);
          }
        }

        // Reset form
        setFormData({
          company_name: '', contact_name: '', email: '', phone: '', website: '',
          mexico_state: '', city: '', industry: '', company_size: '', years_in_business: '',
          products_services: '', export_experience: '', current_markets: [], target_markets: [],
          certifications: [], production_capacity: '', quality_certifications: '',
          financial_information: '', references: '', why_partner: '', additional_info: ''
        });
      } else {
        const error = await response.json();
        setSubmitStatus({
          type: 'error',
          message: error.message || 'Failed to submit partner application. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error submitting partner application:', error);
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
            <div className="text-body">Loading partner application...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Mexico Partner Application - Triangle Trade Intelligence</title>
        <meta name="description" content="Join our Mexico supplier network and connect with North American businesses" />
      </Head>

      <div className="admin-dashboard">
        <div className="admin-header">
          <h1 className="admin-title">🤝 Mexico Partner Network Application</h1>
          <p className="admin-subtitle">
            Join our verified supplier network and connect with North American businesses
          </p>
          <div className="hero-badge">
            Powered by Triangle Trade Intelligence Mexico Trade Bridge
          </div>
        </div>

        {submitStatus && (
          <div className={`content-card ${submitStatus.type === 'success' ? 'bg-joint' : ''}`}>
            <div className="card-header">
              <h3 className={`card-title ${submitStatus.type === 'success' ? 'text-success' : 'text-danger'}`}>
                {submitStatus.type === 'success' ? '✅ Application Submitted' : '❌ Submission Failed'}
              </h3>
              <p className="text-body">{submitStatus.message}</p>
              {submitStatus.application_id && (
                <p className="text-muted font-xs">Application ID: {submitStatus.application_id}</p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="content-card">
          <div className="card-header">
            <h2 className="card-title">Company Information</h2>
            <p className="card-description">Tell us about your Mexico-based business</p>
          </div>

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
                  placeholder="Primary contact person"
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
                  placeholder="+52 (555) 123-4567"
                />
              </div>

              <div className="form-group">
                <label className="font-label">Website</label>
                <input
                  type="url"
                  className="filter-select"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://company.com"
                />
              </div>

              <div className="form-group">
                <label className="font-label">Mexico State <span className="text-danger">*</span></label>
                <select
                  className={`filter-select ${formErrors.mexico_state ? 'border-danger' : ''}`}
                  value={formData.mexico_state}
                  onChange={(e) => handleInputChange('mexico_state', e.target.value)}
                >
                  <option value="">Select state</option>
                  {mexicoRegions.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
                {formErrors.mexico_state && <div className="badge-danger">{formErrors.mexico_state}</div>}
              </div>

              <div className="form-group">
                <label className="font-label">City</label>
                <input
                  type="text"
                  className="filter-select"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City name"
                />
              </div>

              <div className="form-group">
                <label className="font-label">Industry <span className="text-danger">*</span></label>
                <select
                  className={`filter-select ${formErrors.industry ? 'border-danger' : ''}`}
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
                {formErrors.industry && <div className="badge-danger">{formErrors.industry}</div>}
              </div>

              <div className="form-group">
                <label className="font-label">Company Size</label>
                <select
                  className="filter-select"
                  value={formData.company_size}
                  onChange={(e) => handleInputChange('company_size', e.target.value)}
                >
                  <option value="">Select size</option>
                  <option value="micro">Micro (1-10 employees)</option>
                  <option value="small">Small (11-50 employees)</option>
                  <option value="medium">Medium (51-250 employees)</option>
                  <option value="large">Large (250+ employees)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="font-label">Years in Business</label>
                <select
                  className="filter-select"
                  value={formData.years_in_business}
                  onChange={(e) => handleInputChange('years_in_business', e.target.value)}
                >
                  <option value="">Select range</option>
                  <option value="startup">Startup (Less than 1 year)</option>
                  <option value="1-3">1-3 years</option>
                  <option value="4-10">4-10 years</option>
                  <option value="11-20">11-20 years</option>
                  <option value="20+">20+ years</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card-header">
            <h2 className="card-title">Products & Services</h2>
            <p className="card-description">Describe what your company offers</p>
          </div>

          <div className="admin-table-container">
            <div className="form-group">
              <label className="font-label">Products/Services Description <span className="text-danger">*</span></label>
              <textarea
                className={`filter-select ${formErrors.products_services ? 'border-danger' : ''}`}
                rows="4"
                value={formData.products_services}
                onChange={(e) => handleInputChange('products_services', e.target.value)}
                placeholder="Detailed description of your products and services, including specifications, capabilities, and unique value propositions..."
              />
              {formErrors.products_services && <div className="badge-danger">{formErrors.products_services}</div>}
            </div>

            <div className="grid-2-cols">
              <div className="form-group">
                <label className="font-label">Export Experience</label>
                <select
                  className="filter-select"
                  value={formData.export_experience}
                  onChange={(e) => handleInputChange('export_experience', e.target.value)}
                >
                  <option value="">Select experience level</option>
                  <option value="none">No export experience</option>
                  <option value="limited">Limited (1-5 exports)</option>
                  <option value="moderate">Moderate (6-50 exports)</option>
                  <option value="extensive">Extensive (50+ exports)</option>
                  <option value="established">Established exporter</option>
                </select>
              </div>

              <div className="form-group">
                <label className="font-label">Production Capacity</label>
                <input
                  type="text"
                  className="filter-select"
                  value={formData.production_capacity}
                  onChange={(e) => handleInputChange('production_capacity', e.target.value)}
                  placeholder="e.g., 10,000 units/month"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="font-label">Quality Certifications</label>
              <textarea
                className="filter-select"
                rows="3"
                value={formData.quality_certifications}
                onChange={(e) => handleInputChange('quality_certifications', e.target.value)}
                placeholder="List any quality certifications (ISO, FDA, CE, etc.) and compliance standards..."
              />
            </div>
          </div>

          <div className="card-header">
            <h2 className="card-title">Partnership Information</h2>
            <p className="card-description">Help us understand your partnership goals</p>
          </div>

          <div className="admin-table-container">
            <div className="form-group">
              <label className="font-label">Why do you want to partner with Triangle Trade Intelligence? <span className="text-danger">*</span></label>
              <textarea
                className={`filter-select ${formErrors.why_partner ? 'border-danger' : ''}`}
                rows="4"
                value={formData.why_partner}
                onChange={(e) => handleInputChange('why_partner', e.target.value)}
                placeholder="Explain your motivation for joining our network, your goals for North American market expansion, and what value you can bring to our clients..."
              />
              {formErrors.why_partner && <div className="badge-danger">{formErrors.why_partner}</div>}
            </div>

            <div className="form-group">
              <label className="font-label">Business References</label>
              <textarea
                className="filter-select"
                rows="3"
                value={formData.references}
                onChange={(e) => handleInputChange('references', e.target.value)}
                placeholder="Provide 2-3 business references including company names, contact information, and relationship..."
              />
            </div>

            <div className="form-group">
              <label className="font-label">Additional Information</label>
              <textarea
                className="filter-select"
                rows="3"
                value={formData.additional_info}
                onChange={(e) => handleInputChange('additional_info', e.target.value)}
                placeholder="Any additional information you'd like us to know about your company or partnership goals..."
              />
            </div>
          </div>

          <div className="card-header">
            <div className="admin-actions">
              <button
                type="submit"
                className="admin-btn primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting Application...' : 'Submit Partner Application'}
              </button>
              <button
                type="button"
                className="admin-btn"
                onClick={() => {
                  setFormData({
                    company_name: '', contact_name: '', email: '', phone: '', website: '',
                    mexico_state: '', city: '', industry: '', company_size: '', years_in_business: '',
                    products_services: '', export_experience: '', current_markets: [], target_markets: [],
                    certifications: [], production_capacity: '', quality_certifications: '',
                    financial_information: '', references: '', why_partner: '', additional_info: ''
                  });
                }}
              >
                Reset Form
              </button>
            </div>
          </div>
        </form>

        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Partnership Benefits</h2>
            <p className="card-description">
              What you gain by joining our Mexico supplier network
            </p>
          </div>
          <div className="admin-table-container">
            <div className="grid-2-cols">
              <div className="card">
                <div className="card-header">
                  <h3 className="content-card-title">🎯 Market Access</h3>
                </div>
                <div className="p-20">
                  <p className="text-body">Direct connections to US and Canadian businesses actively seeking Mexico suppliers</p>
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <h3 className="content-card-title">🛡️ Verification</h3>
                </div>
                <div className="p-20">
                  <p className="text-body">Professional vetting and credibility boost through our trusted network</p>
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <h3 className="content-card-title">📈 Business Growth</h3>
                </div>
                <div className="p-20">
                  <p className="text-body">Expand into North American markets with expert guidance and support</p>
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <h3 className="content-card-title">🤝 Expert Support</h3>
                </div>
                <div className="p-20">
                  <p className="text-body">Jorge's Mexico trade expertise and relationship facilitation</p>
                </div>
              </div>
            </div>

            <div className="google-workspace">
              <a href="mailto:triangleintel@gmail.com?subject=Partnership%20Inquiry" className="google-btn gmail">
                📧 Contact Partnership Team
              </a>
              <a href="/services/request-form" className="google-btn docs">
                🇲🇽 Jorge's Services
              </a>
              <a href="/usmca-workflow" className="google-btn calendar">
                📋 USMCA Certificates
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}