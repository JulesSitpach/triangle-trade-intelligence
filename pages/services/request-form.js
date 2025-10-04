/**
 * Professional Service Request Form - Non-Subscribers
 * Full business information form with direct payment
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function ServiceRequestForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    service_type: '',
    // Step 1: Company Information
    company_name: '',
    business_type: '',
    company_address: '',
    tax_id: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    primary_supplier_country: '',
    destination_market: 'United States',
    annual_trade_volume: '',
    // Step 2: Product Overview
    product_description: '',
    manufacturing_location: '',
    current_qualification_status: '',
    qualification_problem: '',
    // Step 3: Component Breakdown
    components: [
      { description: '', origin_country: '', value_percentage: '', hs_code: '' }
    ]
  });

  const services = {
    'usmca-certificate': { name: 'USMCA Certificate Generation', price: 300 },
    'hs-classification': { name: 'HS Code Classification', price: 240 },
    'crisis-response': { name: 'Crisis Response Management', price: 480 },
    'supplier-sourcing': { name: 'Supplier Sourcing', price: 540 },
    'manufacturing-feasibility': { name: 'Manufacturing Feasibility', price: 780 },
    'market-entry': { name: 'Market Entry Strategy', price: 660 }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleComponentChange = (index, field, value) => {
    const updatedComponents = [...formData.components];
    updatedComponents[index][field] = value;
    setFormData(prev => ({ ...prev, components: updatedComponents }));
  };

  const addComponent = () => {
    setFormData(prev => ({
      ...prev,
      components: [...prev.components, { description: '', origin_country: '', value_percentage: '', hs_code: '' }]
    }));
  };

  const removeComponent = (index) => {
    if (formData.components.length > 1) {
      setFormData(prev => ({
        ...prev,
        components: prev.components.filter((_, i) => i !== index)
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
          service_request_data: formData
        })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe TEST checkout (using test keys from .env.local)
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

          {/* Mobile Menu Button */}
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
            <Link href="/api/auth/login" className="nav-cta-button" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <div className="container-app">

          <div className="section-header">
            <h1 className="section-header-title">Request Professional Service</h1>
            <p className="section-header-subtitle">
              Complete this form to request expert assistance from our licensed customs broker or Mexico trade specialist
            </p>
          </div>

          {/* Subscriber Discount Notice */}
          <div className="content-card" style={{border: '2px solid #f59e0b', backgroundColor: '#fffbeb', marginBottom: '2rem'}}>
            <h3 className="content-card-title">💡 Save 20% with Subscriber Pricing</h3>
            <p className="content-card-description">
              Complete our <Link href="/usmca-workflow" className="nav-link">free USMCA workflow analysis</Link> first to qualify for subscriber discounts and skip most of this form.
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
                <optgroup label="Compliance Services - Licensed Customs Broker">
                  <option value="usmca-certificate">USMCA Certificate Generation - $300</option>
                  <option value="hs-classification">HS Code Classification - $240</option>
                  <option value="crisis-response">Crisis Response Management - $480</option>
                </optgroup>
                <optgroup label="Mexico Trade Services - B2B Expert">
                  <option value="supplier-sourcing">Supplier Sourcing - $540</option>
                  <option value="manufacturing-feasibility">Manufacturing Feasibility - $780</option>
                  <option value="market-entry">Market Entry Strategy - $660</option>
                </optgroup>
              </select>
            </div>

            {/* Price Display */}
            {selectedService && (
              <div className="content-card" style={{backgroundColor: '#f0f9ff', marginBottom: '1.5rem'}}>
                <div className="header-actions">
                  <div>
                    <h3 className="content-card-title">{selectedService.name}</h3>
                    <p className="content-card-description">Non-subscriber pricing</p>
                  </div>
                  <div className="text-bold" style={{fontSize: '1.5rem', color: '#134169'}}>
                    ${selectedService.price}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Company Information */}
            <h3 className="content-card-title">Step 1 of 3 - Company Information</h3>
            <p className="text-small" style={{marginBottom: '1.5rem', color: '#6b7280'}}>
              Establish your business profile for compliance analysis
            </p>

            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input
                type="text"
                name="company_name"
                className="form-input"
                placeholder="Enter your legal entity name"
                value={formData.company_name}
                onChange={handleChange}
                required
              />
              <p className="text-small" style={{marginTop: '0.25rem', color: '#6b7280'}}>Legal entity name as registered with authorities</p>
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
                <option value="">Select your primary business activity</option>
                <option value="Importer">Importer</option>
                <option value="Exporter">Exporter</option>
                <option value="Manufacturer">Manufacturer</option>
                <option value="Distributor">Distributor</option>
              </select>
              <p className="text-small" style={{marginTop: '0.25rem', color: '#6b7280'}}>Primary business activity for accurate trade classification</p>
            </div>

            <div className="form-group">
              <label className="form-label">Company Address *</label>
              <input
                type="text"
                name="company_address"
                className="form-input"
                placeholder="Street address, City, State/Province"
                value={formData.company_address}
                onChange={handleChange}
                required
              />
              <p className="text-small" style={{marginTop: '0.25rem', color: '#6b7280'}}>Physical business address for certificate documentation</p>
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
              <p className="text-small" style={{marginTop: '0.25rem', color: '#6b7280'}}>Federal tax ID or employer identification number</p>
            </div>

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
                <p className="text-small" style={{marginTop: '0.25rem', color: '#6b7280'}}>Country where products originate</p>
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
                <p className="text-small" style={{marginTop: '0.25rem', color: '#6b7280'}}>Where will the finished product be imported?</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Annual Trade Volume *</label>
              <input
                type="text"
                name="annual_trade_volume"
                className="form-input"
                placeholder="$4,800,000 or 4800000"
                value={formData.annual_trade_volume}
                onChange={handleChange}
                required
              />
              <p className="text-small" style={{marginTop: '0.25rem', color: '#6b7280'}}>Enter your estimated annual import value (accepts commas: $4,800,000 or plain: 4800000)</p>
            </div>

            {/* Step 2: Product Overview */}
            <h3 className="content-card-title" style={{marginTop: '2rem'}}>Step 2 of 3 - Product Overview</h3>

            <div className="form-group">
              <label className="form-label">Complete Product Description *</label>
              <textarea
                name="product_description"
                className="form-input"
                rows="4"
                placeholder="Provide detailed product description including material composition, style, and specifications (e.g., '100% cotton crew neck t-shirts with reinforced seams, medium weight jersey knit fabric')"
                value={formData.product_description}
                onChange={handleChange}
                required
              />
              <p className="text-small" style={{marginTop: '0.25rem', color: '#6b7280'}}>Detailed product description including materials, construction, and key features for accurate classification</p>
            </div>

            <div className="form-group">
              <label className="form-label">Manufacturing/Assembly Location *</label>
              <select
                name="manufacturing_location"
                className="form-input"
                value={formData.manufacturing_location}
                onChange={handleChange}
                required
              >
                <option value="">Select manufacturing location</option>
                <option value="Mexico">Mexico</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="China">China</option>
                <option value="Other">Other</option>
              </select>
              <p className="text-small" style={{marginTop: '0.25rem', color: '#6b7280'}}>Where is the final product assembled/manufactured?</p>
            </div>

            <div className="form-group">
              <label className="form-label">Current USMCA Qualification Status *</label>
              <select
                name="current_qualification_status"
                className="form-input"
                value={formData.current_qualification_status}
                onChange={handleChange}
                required
              >
                <option value="">Select status</option>
                <option value="Qualified">Qualified</option>
                <option value="Not Qualified">Not Qualified</option>
                <option value="Unknown">Unknown</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">What problem are you trying to solve? *</label>
              <textarea
                name="qualification_problem"
                className="form-input"
                rows="3"
                placeholder="Example: 'Too much content from China, need Mexico suppliers' or 'Facing new tariffs, need crisis response'"
                value={formData.qualification_problem}
                onChange={handleChange}
                required
              />
            </div>

            {/* Step 3: Component Breakdown */}
            <h3 className="content-card-title" style={{marginTop: '2rem'}}>Step 3 of 3 - Component Breakdown</h3>
            <p className="text-small" style={{marginBottom: '1rem', color: '#6b7280'}}>
              Break down your product into its major components. Each component should represent a significant portion of the product's value.
            </p>

            {formData.components.map((component, index) => (
              <div key={index} className="content-card" style={{backgroundColor: '#f9fafb', marginBottom: '1rem', padding: '1rem'}}>
                <div className="header-actions" style={{marginBottom: '1rem'}}>
                  <h4 className="text-bold">Component {index + 1}</h4>
                  {formData.components.length > 1 && (
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

                <div className="form-group">
                  <label className="form-label">Component Description *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Describe this component in detail"
                    value={component.description}
                    onChange={(e) => handleComponentChange(index, 'description', e.target.value)}
                    required
                  />
                </div>

                <div className="grid-2-cols">
                  <div className="form-group">
                    <label className="form-label">Origin Country *</label>
                    <select
                      className="form-input"
                      value={component.origin_country}
                      onChange={(e) => handleComponentChange(index, 'origin_country', e.target.value)}
                      required
                    >
                      <option value="">Select origin country...</option>
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
                    <label className="form-label">Value Percentage * (%)</label>
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
            ))}

            <button
              type="button"
              onClick={addComponent}
              className="btn-secondary"
              style={{marginBottom: '2rem'}}
            >
              + Add Another Component
            </button>

            {/* Contact Information */}
            <h3 className="content-card-title">Contact Information</h3>

            <div className="grid-2-cols">
              <div className="form-group">
                <label className="form-label">Contact Person *</label>
                <input
                  type="text"
                  name="contact_name"
                  className="form-input"
                  placeholder="Primary contact for trade matters"
                  value={formData.contact_name}
                  onChange={handleChange}
                  required
                />
                <p className="text-small" style={{marginTop: '0.25rem', color: '#6b7280'}}>Person responsible for trade compliance</p>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone *</label>
                <input
                  type="tel"
                  name="contact_phone"
                  className="form-input"
                  placeholder="(214) 555-0147"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  required
                />
                <p className="text-small" style={{marginTop: '0.25rem', color: '#6b7280'}}>Business phone number for certificate documentation</p>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Email *</label>
                <input
                  type="email"
                  name="contact_email"
                  className="form-input"
                  placeholder="compliance@company.com"
                  value={formData.contact_email}
                  onChange={handleChange}
                  required
                />
                <p className="text-small" style={{marginTop: '0.25rem', color: '#6b7280'}}>Business email for official correspondence and certificate delivery</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="hero-buttons" style={{marginTop: '2rem'}}>
              <button
                type="submit"
                disabled={isSubmitting || !formData.service_type}
                className="btn-primary"
                style={{width: '100%', padding: '1rem', fontSize: '1.125rem'}}
              >
                {isSubmitting ? 'Processing...' : `Continue to Payment ${selectedService ? `($${selectedService.price})` : ''}`}
              </button>
            </div>

            <p className="text-small" style={{textAlign: 'center', marginTop: '1rem', color: '#6b7280'}}>
              🔒 Secure payment via Stripe • Expert assigned within 24 hours
            </p>
          </form>

        </div>
      </div>
    </>
  );
}
