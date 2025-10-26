/**
 * Professional Service Request Form - Non-Subscribers
 * Compact, efficient form aligned with admin API expectations
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function ServiceRequestForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    service_type: '',
    // Company Information
    company_name: '',
    business_type: '', // Business role: Importer, Exporter, etc.
    industry_sector: '', // Industry sector: Agriculture, Automotive, etc.
    company_address: '',
    tax_id: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    // Trade Information
    primary_supplier_country: '',
    destination_market: 'United States',
    trade_volume: '', // Matches admin expectation
    // Product Information
    product_description: '',
    manufacturing_location: '',
    qualification_status: '', // Matches admin expectation
    qualification_problem: '',
    // Component Origins (matches admin expectation)
    component_origins: [
      { description: '', origin_country: '', value_percentage: '', hs_code: '' }
    ]
  });

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await response.json();

        if (data.authenticated && data.user) {
          router.push('/dashboard');
        } else {
          setCheckingAuth(false);
        }
      } catch (error) {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  const services = {
    'trade-health-check': { name: 'Trade Health Check', price: 99 },
    'usmca-advantage': { name: 'USMCA Advantage Sprint', price: 175 },
    'supply-chain-optimization': { name: 'Supply Chain Optimization', price: 275 },
    'pathfinder': { name: 'Pathfinder Market Entry', price: 350 },
    'supply-chain-resilience': { name: 'Supply Chain Resilience', price: 450 },
    'crisis-navigator': { name: 'Crisis Navigator', price: 200 }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleComponentChange = (index, field, value) => {
    const updatedComponents = [...formData.component_origins];
    updatedComponents[index][field] = value;
    setFormData(prev => ({ ...prev, component_origins: updatedComponents }));
  };

  const addComponent = () => {
    setFormData(prev => ({
      ...prev,
      component_origins: [...prev.component_origins, { description: '', origin_country: '', value_percentage: '', hs_code: '' }]
    }));
  };

  const removeComponent = (index) => {
    if (formData.component_origins.length > 1) {
      setFormData(prev => ({
        ...prev,
        component_origins: prev.component_origins.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/stripe/create-public-service-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: formData.service_type,
          service_request_data: formData,
          consent_to_store: privacyConsent
        })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedService = services[formData.service_type];

  if (checkingAuth) {
    return (
      <>
        <Head>
          <title>Request Professional Service - Triangle Trade Intelligence</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div className="main-content">
          <div className="container-app">
            <div className="content-card">
              <p className="text-body">Checking access...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Request Professional Service - Triangle Trade Intelligence</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Navigation */}
      <nav className="nav-fixed">
        <div className="nav-container">
          <Link href="/" className="nav-logo-link">
            <div className="nav-logo-icon">T</div>
            <div>
              <div className="nav-logo-text">Triangle Trade Intelligence</div>
              <div className="nav-logo-subtitle">USMCA Compliance Platform</div>
            </div>
          </Link>

          <button
            className="nav-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            ☰
          </button>

          <div className={`nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <Link href="/services" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Services</Link>
            <Link href="/pricing" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/login" className="nav-cta-button" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <div className="container-app">

          <div className="section-header">
            <h1 className="section-header-title">Request Professional Service</h1>
            <p className="section-header-subtitle">
              Complete this form to request expert assistance from our trade compliance and business development team
            </p>
          </div>

          <form onSubmit={handleSubmit} className="content-card">

            {/* Service Selection */}
            <div className="form-group">
              <label className="form-label">Select Service *</label>
              <select
                name="service_type"
                className="form-input"
                value={formData.service_type}
                onChange={handleChange}
                required
              >
                <option value="">Choose a service...</option>
                <optgroup label="Team Collaboration Services">
                  <option value="trade-health-check">Trade Health Check - $99</option>
                  <option value="usmca-advantage">USMCA Advantage Sprint - $175</option>
                  <option value="supply-chain-optimization">Supply Chain Optimization - $275</option>
                  <option value="pathfinder">Pathfinder Market Entry - $350</option>
                  <option value="supply-chain-resilience">Supply Chain Resilience - $450</option>
                  <option value="crisis-navigator">Crisis Navigator - $200/month</option>
                </optgroup>
              </select>
            </div>

            {/* Price Display */}
            {selectedService && (
              <div className="content-card" style={{backgroundColor: '#f0f9ff', marginBottom: '1.5rem', padding: '1rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <h3 style={{margin: 0, fontSize: '1.125rem'}}>{selectedService.name}</h3>
                    <p style={{margin: 0, fontSize: '0.875rem', color: '#6b7280'}}>Non-subscriber pricing</p>
                  </div>
                  <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#134169'}}>
                    ${selectedService.price}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Company & Contact Information */}
            <h3 className="content-card-title">Step 1 of 3 - Company & Contact Information</h3>

            <div className="grid-2-cols">
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input
                  type="text"
                  name="company_name"
                  className="form-input"
                  placeholder="Legal entity name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Business Type *</label>
                <select
                  name="business_type"
                  className="form-input"
                  value={formData.business_type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select business type</option>
                  <option value="Importer">Importer</option>
                  <option value="Exporter">Exporter</option>
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Distributor">Distributor</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Industry Sector</label>
                <select
                  name="industry_sector"
                  className="form-input"
                  value={formData.industry_sector}
                  onChange={handleChange}
                >
                  <option value="">Select industry (optional)</option>
                  <option value="Agriculture & Food">Agriculture & Food</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Electronics & Technology">Electronics & Technology</option>
                  <option value="Energy Equipment">Energy Equipment</option>
                  <option value="General">General</option>
                  <option value="General Manufacturing">General Manufacturing</option>
                  <option value="Machinery & Equipment">Machinery & Equipment</option>
                  <option value="Other">Other</option>
                  <option value="Textiles & Apparel">Textiles & Apparel</option>
                </select>
              </div>
            </div>

            <div className="grid-2-cols">
              <div className="form-group">
                <label className="form-label">Company Address *</label>
                <input
                  type="text"
                  name="company_address"
                  className="form-input"
                  placeholder="Street, City, State"
                  value={formData.company_address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tax ID / EIN *</label>
                <input
                  type="text"
                  name="tax_id"
                  className="form-input"
                  placeholder="Tax identification number"
                  value={formData.tax_id}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid-2-cols">
              <div className="form-group">
                <label className="form-label">Contact Person *</label>
                <input
                  type="text"
                  name="contact_name"
                  className="form-input"
                  placeholder="Primary contact name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Email *</label>
                <input
                  type="email"
                  name="contact_email"
                  className="form-input"
                  placeholder="email@company.com"
                  value={formData.contact_email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone *</label>
              <input
                type="tel"
                name="contact_phone"
                className="form-input"
                placeholder="(555) 123-4567"
                value={formData.contact_phone}
                onChange={handleChange}
                required
              />
            </div>

            {/* Step 2: Trade & Product Information */}
            <h3 className="content-card-title" style={{marginTop: '2rem'}}>Step 2 of 3 - Trade & Product Information</h3>

            <div className="grid-2-cols">
              <div className="form-group">
                <label className="form-label">Primary Supplier Country *</label>
                <select
                  name="primary_supplier_country"
                  className="form-input"
                  value={formData.primary_supplier_country}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select origin country</option>
                  <option value="China">China</option>
                  <option value="Mexico">Mexico</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="Vietnam">Vietnam</option>
                  <option value="Taiwan">Taiwan</option>
                  <option value="South Korea">South Korea</option>
                  <option value="Japan">Japan</option>
                  <option value="India">India</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Destination Market *</label>
                <select
                  name="destination_market"
                  className="form-input"
                  value={formData.destination_market}
                  onChange={handleChange}
                  required
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="Mexico">Mexico</option>
                </select>
              </div>
            </div>

            <div className="grid-2-cols">
              <div className="form-group">
                <label className="form-label">Annual Trade Volume *</label>
                <input
                  type="text"
                  name="trade_volume"
                  className="form-input"
                  placeholder="$4,800,000 or 4800000"
                  value={formData.trade_volume}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Manufacturing Location *</label>
                <select
                  name="manufacturing_location"
                  className="form-input"
                  value={formData.manufacturing_location}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select location</option>
                  <option value="Mexico">Mexico</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="China">China</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Product Description *</label>
              <textarea
                name="product_description"
                className="form-input"
                rows="3"
                placeholder="Describe your product including materials, construction, and key features"
                value={formData.product_description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid-2-cols">
              <div className="form-group">
                <label className="form-label">Current USMCA Qualification Status *</label>
                <select
                  name="qualification_status"
                  className="form-input"
                  value={formData.qualification_status}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select status</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="NOT_QUALIFIED">Not Qualified</option>
                  <option value="UNKNOWN">Unknown</option>
                  <option value="PARTIAL">Partial Qualification</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Problem You're Solving *</label>
                <input
                  type="text"
                  name="qualification_problem"
                  className="form-input"
                  placeholder="e.g., Too much China content, need Mexico suppliers"
                  value={formData.qualification_problem}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Step 3: Component Breakdown */}
            <h3 className="content-card-title" style={{marginTop: '2rem'}}>Step 3 of 3 - Component Breakdown</h3>

            {formData.component_origins.map((component, index) => (
              <div key={index} style={{backgroundColor: '#f9fafb', borderRadius: '8px', padding: '1rem', marginBottom: '1rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
                  <h4 style={{margin: 0, fontSize: '1rem', fontWeight: '600'}}>Component {index + 1}</h4>
                  {formData.component_origins.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeComponent(index)}
                      className="btn-secondary"
                      style={{padding: '0.25rem 0.75rem', fontSize: '0.875rem'}}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid-2-cols">
                  <div className="form-group">
                    <label className="form-label">Component Description *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Describe this component"
                      value={component.description}
                      onChange={(e) => handleComponentChange(index, 'description', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Origin Country *</label>
                    <select
                      className="form-input"
                      value={component.origin_country}
                      onChange={(e) => handleComponentChange(index, 'origin_country', e.target.value)}
                      required
                    >
                      <option value="">Select country</option>
                      <option value="China">China</option>
                      <option value="Mexico">Mexico</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="Vietnam">Vietnam</option>
                      <option value="Taiwan">Taiwan</option>
                      <option value="South Korea">South Korea</option>
                      <option value="Japan">Japan</option>
                      <option value="India">India</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2-cols">
                  <div className="form-group">
                    <label className="form-label">Value Percentage (%) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0-100"
                      min="0"
                      max="100"
                      value={component.value_percentage}
                      onChange={(e) => handleComponentChange(index, 'value_percentage', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">HS Code (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., 8708.30.50"
                      value={component.hs_code}
                      onChange={(e) => handleComponentChange(index, 'hs_code', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addComponent}
              className="btn-secondary"
              style={{marginBottom: '1.5rem'}}
            >
              + Add Another Component
            </button>

            {/* Privacy Consent */}
            <div style={{backgroundColor: '#f0f9ff', borderRadius: '8px', padding: '1rem', marginBottom: '1rem'}}>
              <div style={{display: 'flex', alignItems: 'flex-start', gap: '0.75rem'}}>
                <input
                  type="checkbox"
                  id="privacy-consent"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  style={{marginTop: '0.25rem', width: '18px', height: '18px', cursor: 'pointer'}}
                />
                <label htmlFor="privacy-consent" style={{flex: 1, cursor: 'pointer', fontSize: '0.9rem', lineHeight: '1.5'}}>
                  <span style={{fontWeight: '600', color: '#134169'}}>Save my business information</span>
                  {' '}
                  <span style={{color: '#6b7280', fontSize: '0.85rem'}}>
                    for better service delivery. Uncheck for one-time use only.
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !formData.service_type}
              className="btn-primary"
              style={{width: '100%', padding: '1rem', fontSize: '1.125rem'}}
            >
              {isSubmitting ? 'Processing...' : `Continue to Payment ${selectedService ? `($${selectedService.price})` : ''}`}
            </button>

            <p style={{textAlign: 'center', marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem'}}>
              🔒 Secure payment via Stripe • Expert assigned within 24 hours
            </p>
          </form>

        </div>
      </div>
    </>
  );
}
