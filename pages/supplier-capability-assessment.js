import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SupplierCapabilityAssessment() {
  const router = useRouter();
  const { client, supplier, token } = router.query;

  const [formData, setFormData] = useState({
    // Company Information
    company_name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    company_website: '',
    years_in_business: '',

    // Production Capabilities
    production_capacity: '',
    manufacturing_processes: [],
    quality_certifications: [],
    production_lead_times: '',
    minimum_order_quantity: '',

    // Infrastructure
    facility_size: '',
    equipment_overview: '',
    workforce_size: '',
    location_advantages: '',

    // Quality & Compliance
    quality_management_system: '',
    export_experience: '',
    usmca_compliance: '',
    sustainability_practices: '',

    // Partnership Details
    pricing_structure: '',
    payment_terms: '',
    partnership_interest_level: '',
    additional_capabilities: '',
    references: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const manufacturingProcesses = [
    'CNC Machining', 'Injection Molding', 'Sheet Metal Fabrication',
    'Welding', 'Assembly', 'Packaging', 'Quality Testing', 'Electronics Assembly',
    'Casting', 'Forging', 'Stamping', 'Extrusion', 'Surface Treatment'
  ];

  const qualityCertifications = [
    'ISO 9001', 'ISO 14001', 'IATF 16949', 'AS9100', 'FDA Registered',
    'CE Marking', 'RoHS Compliant', 'REACH Compliant', 'UL Listed',
    'CSA Certified', 'Mexican Official Standards (NOM)'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMultiSelectChange = (field, option) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(option)
        ? prev[field].filter(item => item !== option)
        : [...prev[field], option]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/supplier-capability-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          client_company: client,
          supplier_name: supplier,
          assessment_token: token,
          submitted_at: new Date().toISOString()
        })
      });

      const result = await response.json();

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || 'Failed to submit assessment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container-app">
        <div className="main-content" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
          <div className="content-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{ color: '#059669', marginBottom: '1rem' }}>Assessment Submitted Successfully!</h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '2rem' }}>
              Thank you for completing the supplier capability assessment.
              Jorge Martinez will review your submission and contact you within 2-3 business days.
            </p>
            <div className="content-card" style={{ background: '#f0f9ff', padding: '1.5rem', margin: '2rem 0' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1e40af' }}>Next Steps:</h3>
              <ul style={{ textAlign: 'left', color: '#374151' }}>
                <li style={{ marginBottom: '0.5rem' }}>✓ Your assessment has been forwarded to our Mexico trade specialists</li>
                <li style={{ marginBottom: '0.5rem' }}>📞 Expect a follow-up call to discuss partnership opportunities</li>
                <li style={{ marginBottom: '0.5rem' }}>📋 Prepare any additional documentation for qualification review</li>
                <li>🤝 Potential introduction to {client || 'our client'} if qualifications align</li>
              </ul>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              <strong>Reference ID:</strong> {token?.substring(0, 8)?.toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app">
      <div className="main-content" style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
        <div className="content-card" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ color: '#134169', marginBottom: '0.5rem' }}>
              Supplier Capability Assessment
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '1rem' }}>
              Partnership Opportunity with {client || 'North American Manufacturing Company'}
            </p>
            <div className="hero-badge" style={{ display: 'inline-block' }}>
              🤝 Confidential Partnership Evaluation
            </div>
          </div>

          {error && (
            <div className="content-card" style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', marginBottom: '2rem' }}>
              <p style={{ color: '#dc2626', margin: 0 }}>❌ {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Company Information Section */}
            <div className="form-section" style={{ marginBottom: '3rem' }}>
              <h2 style={{ color: '#134169', marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e5e7eb' }}>
                🏢 Company Information
              </h2>

              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Your company name"
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '1rem' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                    placeholder="Primary contact name"
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '1rem' }}
                  />
                </div>
              </div>

              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="contact@yourcompany.com"
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '1rem' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="+52 xxx xxx xxxx"
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '1rem' }}
                  />
                </div>
              </div>

              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    Company Website
                  </label>
                  <input
                    type="url"
                    value={formData.company_website}
                    onChange={(e) => handleInputChange('company_website', e.target.value)}
                    placeholder="https://www.yourcompany.com"
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '1rem' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    Years in Business *
                  </label>
                  <select
                    required
                    value={formData.years_in_business}
                    onChange={(e) => handleInputChange('years_in_business', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '1rem' }}
                  >
                    <option value="">Select...</option>
                    <option value="1-5">1-5 years</option>
                    <option value="6-10">6-10 years</option>
                    <option value="11-20">11-20 years</option>
                    <option value="20+">20+ years</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Production Capabilities Section */}
            <div className="form-section" style={{ marginBottom: '3rem' }}>
              <h2 style={{ color: '#134169', marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e5e7eb' }}>
                🏭 Production Capabilities
              </h2>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  Monthly Production Capacity *
                </label>
                <select
                  required
                  value={formData.production_capacity}
                  onChange={(e) => handleInputChange('production_capacity', e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '1rem' }}
                >
                  <option value="">Select capacity range...</option>
                  <option value="1000-5000">1,000 - 5,000 units</option>
                  <option value="5000-20000">5,000 - 20,000 units</option>
                  <option value="20000-100000">20,000 - 100,000 units</option>
                  <option value="100000+">100,000+ units</option>
                  <option value="custom">Custom/Project-based</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  Manufacturing Processes (Select all that apply)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', padding: '1rem', border: '2px solid #e5e7eb', borderRadius: '6px' }}>
                  {manufacturingProcesses.map(process => (
                    <label key={process} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.manufacturing_processes.includes(process)}
                        onChange={() => handleMultiSelectChange('manufacturing_processes', process)}
                      />
                      <span style={{ fontSize: '0.9rem' }}>{process}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    Typical Lead Times
                  </label>
                  <select
                    value={formData.production_lead_times}
                    onChange={(e) => handleInputChange('production_lead_times', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '1rem' }}
                  >
                    <option value="">Select lead time...</option>
                    <option value="1-2 weeks">1-2 weeks</option>
                    <option value="3-4 weeks">3-4 weeks</option>
                    <option value="6-8 weeks">6-8 weeks</option>
                    <option value="10-12 weeks">10-12 weeks</option>
                    <option value="custom">Project-dependent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    Minimum Order Quantity
                  </label>
                  <input
                    type="text"
                    value={formData.minimum_order_quantity}
                    onChange={(e) => handleInputChange('minimum_order_quantity', e.target.value)}
                    placeholder="e.g., 1,000 pieces"
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '1rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Quality & Compliance Section */}
            <div className="form-section" style={{ marginBottom: '3rem' }}>
              <h2 style={{ color: '#134169', marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e5e7eb' }}>
                ✅ Quality & Compliance
              </h2>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  Quality Certifications (Select all that apply)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', padding: '1rem', border: '2px solid #e5e7eb', borderRadius: '6px' }}>
                  {qualityCertifications.map(cert => (
                    <label key={cert} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.quality_certifications.includes(cert)}
                        onChange={() => handleMultiSelectChange('quality_certifications', cert)}
                      />
                      <span style={{ fontSize: '0.9rem' }}>{cert}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    Export Experience *
                  </label>
                  <select
                    required
                    value={formData.export_experience}
                    onChange={(e) => handleInputChange('export_experience', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '1rem' }}
                  >
                    <option value="">Select experience...</option>
                    <option value="none">No export experience</option>
                    <option value="limited">Limited (1-3 countries)</option>
                    <option value="moderate">Moderate (4-10 countries)</option>
                    <option value="extensive">Extensive (10+ countries)</option>
                    <option value="usmca-focused">USMCA region focused</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    USMCA Compliance Knowledge
                  </label>
                  <select
                    value={formData.usmca_compliance}
                    onChange={(e) => handleInputChange('usmca_compliance', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '1rem' }}
                  >
                    <option value="">Select level...</option>
                    <option value="expert">Expert - Full compliance team</option>
                    <option value="good">Good - Basic compliance knowledge</option>
                    <option value="learning">Learning - Willing to implement</option>
                    <option value="need-support">Need support and guidance</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Partnership Interest Section */}
            <div className="form-section" style={{ marginBottom: '3rem' }}>
              <h2 style={{ color: '#134169', marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid #e5e7eb' }}>
                🤝 Partnership Details
              </h2>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  Interest Level in This Partnership *
                </label>
                <select
                  required
                  value={formData.partnership_interest_level}
                  onChange={(e) => handleInputChange('partnership_interest_level', e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '1rem' }}
                >
                  <option value="">Select interest level...</option>
                  <option value="very-high">Very High - Ready to start immediately</option>
                  <option value="high">High - Serious consideration</option>
                  <option value="moderate">Moderate - Exploring opportunities</option>
                  <option value="preliminary">Preliminary - Information gathering</option>
                </select>
              </div>

              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    Preferred Pricing Structure
                  </label>
                  <select
                    value={formData.pricing_structure}
                    onChange={(e) => handleInputChange('pricing_structure', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '1rem' }}
                  >
                    <option value="">Select structure...</option>
                    <option value="unit-based">Per unit pricing</option>
                    <option value="volume-tiers">Volume-based tiers</option>
                    <option value="project-based">Project-based quotes</option>
                    <option value="annual-contracts">Annual contract pricing</option>
                    <option value="flexible">Flexible - Open to discussion</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                    Preferred Payment Terms
                  </label>
                  <select
                    value={formData.payment_terms}
                    onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '1rem' }}
                  >
                    <option value="">Select terms...</option>
                    <option value="net-15">Net 15 days</option>
                    <option value="net-30">Net 30 days</option>
                    <option value="net-60">Net 60 days</option>
                    <option value="letter-of-credit">Letter of Credit</option>
                    <option value="flexible">Flexible - Negotiable</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  Additional Capabilities or Special Services
                </label>
                <textarea
                  value={formData.additional_capabilities}
                  onChange={(e) => handleInputChange('additional_capabilities', e.target.value)}
                  placeholder="Describe any unique capabilities, special services, or value-add offerings your company provides..."
                  rows={4}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Submit Section */}
            <div className="form-actions" style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn-action btn-primary"
                style={{
                  padding: '1rem 3rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  background: submitting ? '#9ca3af' : undefined,
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? '📤 Submitting Assessment...' : '🚀 Submit Capability Assessment'}
              </button>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '1rem' }}>
                This assessment is confidential and will be reviewed by Triangle Intelligence Platform specialists.
                <br />
                You will receive a response within 2-3 business days.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}