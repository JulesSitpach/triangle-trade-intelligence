import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function ContactPage() {
  const [isClient, setIsClient] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    importVolume: '',
    message: '',
    consultationType: 'free-analysis'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('')

    try {
      const response = await fetch('/api/contact-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({
          name: '',
          email: '',
          company: '',
          phone: '',
          importVolume: '',
          message: '',
          consultationType: 'free-analysis'
        })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      setSubmitStatus('error')
    }

    setIsSubmitting(false)
  }

  return (
    <>
      <Head>
        <title>Contact Triangle Intelligence - Mexico-Based USMCA Optimization Experts</title>
        <meta name="description" content="Contact Triangle Intelligence for USMCA optimization consultation. Mexico-based business with verified platform. Schedule free analysis or consultation." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Contact Banner */}
      <div className="bloomberg-accent-banner">
        <span>MEXICO-BASED BUSINESS: Professional USMCA optimization consultation • Free analysis available</span>
        <span className="bloomberg-status bloomberg-status-success">97% Deployment Ready</span>
      </div>

      {/* Terminal Status Bar */}
      <div className="bloomberg-card" style={{margin: 0, borderRadius: 0, borderBottom: '1px solid var(--bloomberg-gray-700)'}}>
        <div className="bloomberg-status bloomberg-status-success">
          <div className="bloomberg-status-dot"></div>
          TRIANGLE INTELLIGENCE PROFESSIONAL TERMINAL
          <span className="text-muted">SESSION: CONTACT | STATUS: ACTIVE | {isClient ? new Date().toLocaleString() : 'Loading...'}</span>
        </div>
      </div>

      {/* Terminal Navigation */}
      <nav className="bloomberg-nav">
        <div className="bloomberg-container-padded">
          <div className="bloomberg-flex" style={{justifyContent: 'space-between', alignItems: 'center'}}>
            <Link href="/" className="bloomberg-nav-brand">
              <span className="text-success">◢</span>
              TRIANGLE INTELLIGENCE
              <span className="text-primary">PRO v2.1</span>
            </Link>
            <div className="bloomberg-flex" style={{justifyContent: 'flex-end', flexWrap: 'wrap'}}>
              <Link href="/marketing/features" className="bloomberg-nav-link">FEATURES</Link>
              <Link href="/about" className="bloomberg-nav-link">ABOUT</Link>
              <Link href="/pricing" className="bloomberg-nav-link">PRICING</Link>
              <Link href="/marketing/contact" className="bloomberg-nav-link">CONTACT</Link>
              <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
                START FREE ANALYSIS
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), url('/image/datos-financieros.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh'
      }}>

        {/* Hero Section */}
        <div className="bloomberg-hero">
          <div className="bloomberg-container-padded">
            <div className="bloomberg-hero-content">
              <h1 className="bloomberg-hero-title">
                Schedule Your USMCA Optimization Consultation
              </h1>
              <p className="bloomberg-hero-subtitle">
                Mexico-based Triangle Intelligence offers professional USMCA optimization consultation. 
                Start with a free analysis or schedule a comprehensive consultation with our platform experts.
              </p>
              <div className="bloomberg-hero-actions">
                <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary bloomberg-btn-large">
                  Start Free Analysis Now
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Options */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <h2 className="bloomberg-section-title">CONSULTATION OPTIONS</h2>
            
            <div className="bloomberg-grid bloomberg-grid-3 bloomberg-mb-xl">
              <div className="bloomberg-card">
                <div className="bloomberg-card-header">
                  <h3 className="bloomberg-card-title">FREE ANALYSIS</h3>
                  <span className="bloomberg-status bloomberg-status-success">IMMEDIATE</span>
                </div>
                <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                  Start your 6-stage USMCA optimization journey with an immediate free analysis using our verified platform.
                </p>
                <div className="bloomberg-mb-lg">
                  <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                    • Immediate platform access<br/>
                    • Foundation stage assessment<br/>
                    • Triangle routing analysis<br/>
                    • Savings potential calculation<br/>
                    • No credit card required
                  </div>
                </div>
                <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary" style={{width: '100%'}}>
                  Start Free Analysis
                </Link>
              </div>

              <div className="bloomberg-card">
                <div className="bloomberg-card-header">
                  <h3 className="bloomberg-card-title">CONSULTATION CALL</h3>
                  <span className="bloomberg-status bloomberg-status-warning">SCHEDULED</span>
                </div>
                <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                  Schedule a consultation with our Mexico-based USMCA optimization experts for personalized guidance.
                </p>
                <div className="bloomberg-mb-lg">
                  <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                    • 30-minute consultation<br/>
                    • Platform demonstration<br/>
                    • Custom implementation plan<br/>
                    • ROI analysis for your business<br/>
                    • Pricing and plan recommendations
                  </div>
                </div>
                <button 
                  onClick={() => document.getElementById('consultation-form').scrollIntoView({behavior: 'smooth'})}
                  className="bloomberg-btn bloomberg-btn-primary" 
                  style={{width: '100%'}}
                >
                  Schedule Consultation
                </button>
              </div>

              <div className="bloomberg-card">
                <div className="bloomberg-card-header">
                  <h3 className="bloomberg-card-title">ENTERPRISE DEMO</h3>
                  <span className="bloomberg-status bloomberg-status-info">CUSTOM</span>
                </div>
                <p className="bloomberg-card-subtitle bloomberg-mb-lg">
                  Enterprise organizations can schedule a comprehensive platform demonstration with API access review.
                </p>
                <div className="bloomberg-mb-lg">
                  <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                    • 60-minute enterprise demo<br/>
                    • API and integration review<br/>
                    • Custom deployment planning<br/>
                    • Enterprise security features<br/>
                    • Volume pricing discussion
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setFormData(prev => ({...prev, consultationType: 'enterprise-demo'}))
                    document.getElementById('consultation-form').scrollIntoView({behavior: 'smooth'})
                  }}
                  className="bloomberg-btn bloomberg-btn-primary" 
                  style={{width: '100%'}}
                >
                  Request Enterprise Demo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Business Information */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">TRIANGLE INTELLIGENCE BUSINESS INFORMATION</h3>
                <span className="bloomberg-status bloomberg-status-success">
                  <div className="bloomberg-status-dot"></div>
                  MEXICO-BASED
                </span>
              </div>
              
              <div className="bloomberg-grid bloomberg-grid-2">
                <div>
                  <h4 className="bloomberg-card-title bloomberg-mb-md">Business Operations</h4>
                  <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                    <strong>Triangle Intelligence</strong><br/>
                    Mexico-Based USMCA Optimization Platform<br/>
                    Professional Trade Intelligence Services<br/><br/>
                    
                    <strong>Platform Status:</strong> 97% Deployment Ready<br/>
                    <strong>Database Records:</strong> 500K+ Trade Flows<br/>
                    <strong>Intelligence Systems:</strong> 6 Operational<br/>
                    <strong>API Cost Reduction:</strong> 80% Optimized<br/><br/>
                    
                    <strong>Business Hours:</strong><br/>
                    Platform: 24/7 Automated Access<br/>
                    Consultation: Monday-Friday, Business Hours (Mexico Time)<br/>
                    Support: Response within 24 hours
                  </div>
                </div>

                <div>
                  <h4 className="bloomberg-card-title bloomberg-mb-md">USMCA Expertise</h4>
                  <div style={{fontSize: '0.875rem', color: 'var(--bloomberg-gray-300)', lineHeight: '1.6'}}>
                    <strong>Trilingual Platform Support:</strong><br/>
                    • English: Primary platform language<br/>
                    • Español: Mexico operations<br/>
                    • Français: Quebec markets<br/><br/>
                    
                    <strong>USMCA Countries Covered:</strong><br/>
                    🇺🇸 United States: Market intelligence, trade flow analysis<br/>
                    🇨🇦 Canada: Platform architecture, technical infrastructure<br/>
                    🇲🇽 Mexico: Business operations, partnership networks<br/><br/>
                    
                    <strong>Verification & Credentials:</strong><br/>
                    • 500K+ verified trade flow records<br/>
                    • 97% platform deployment readiness<br/>
                    • 6 operational intelligence systems<br/>
                    • Database-powered volatile/stable optimization
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="bloomberg-section" id="consultation-form">
          <div className="bloomberg-container-padded">
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">SCHEDULE CONSULTATION</h3>
                <span className="bloomberg-status bloomberg-status-info">
                  <div className="bloomberg-status-dot"></div>
                  SECURE FORM
                </span>
              </div>
              
              {submitStatus === 'success' && (
                <div className="alert alert-success">
                  <strong>Consultation Scheduled!</strong> We&apos;ll contact you within 24 hours to confirm your consultation appointment.
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="alert alert-error">
                  <strong>Error:</strong> Unable to schedule consultation. Please try again or use the free analysis option.
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="bloomberg-grid bloomberg-grid-2" style={{gap: 'var(--space-lg)'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem', fontWeight: '600', color: 'var(--bloomberg-gray-300)'}}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="bloomberg-input"
                      required
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label style={{display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem', fontWeight: '600', color: 'var(--bloomberg-gray-300)'}}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="bloomberg-input"
                      required
                      placeholder="your.email@company.com"
                    />
                  </div>

                  <div>
                    <label style={{display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem', fontWeight: '600', color: 'var(--bloomberg-gray-300)'}}>
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="bloomberg-input"
                      required
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <label style={{display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem', fontWeight: '600', color: 'var(--bloomberg-gray-300)'}}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bloomberg-input"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label style={{display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem', fontWeight: '600', color: 'var(--bloomberg-gray-300)'}}>
                      Annual Import Volume
                    </label>
                    <select
                      name="importVolume"
                      value={formData.importVolume}
                      onChange={handleInputChange}
                      className="bloomberg-select"
                    >
                      <option value="">Select volume range</option>
                      <option value="under-100k">Under $100K</option>
                      <option value="100k-500k">$100K - $500K</option>
                      <option value="500k-1m">$500K - $1M</option>
                      <option value="1m-5m">$1M - $5M</option>
                      <option value="5m-10m">$5M - $10M</option>
                      <option value="over-10m">Over $10M</option>
                    </select>
                  </div>

                  <div>
                    <label style={{display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem', fontWeight: '600', color: 'var(--bloomberg-gray-300)'}}>
                      Consultation Type
                    </label>
                    <select
                      name="consultationType"
                      value={formData.consultationType}
                      onChange={handleInputChange}
                      className="bloomberg-select"
                    >
                      <option value="free-analysis">Free Analysis (Immediate)</option>
                      <option value="consultation">Consultation Call (30 min)</option>
                      <option value="enterprise-demo">Enterprise Demo (60 min)</option>
                      <option value="pricing-discussion">Pricing Discussion</option>
                    </select>
                  </div>
                </div>

                <div style={{marginTop: 'var(--space-lg)'}}>
                  <label style={{display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem', fontWeight: '600', color: 'var(--bloomberg-gray-300)'}}>
                    Message (Optional)
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="bloomberg-textarea"
                    placeholder="Tell us about your USMCA optimization needs, current challenges, or specific questions..."
                    rows={4}
                  />
                </div>

                <div style={{marginTop: 'var(--space-xl)'}}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bloomberg-btn bloomberg-btn-primary bloomberg-btn-lg"
                    style={{width: '100%'}}
                  >
                    {isSubmitting ? 'Scheduling...' : 'Schedule Consultation'}
                  </button>
                  
                  <p style={{marginTop: 'var(--space-md)', fontSize: '0.875rem', color: 'var(--bloomberg-gray-400)', textAlign: 'center'}}>
                    Or start immediately with a <Link href="/foundation" className="text-primary">free analysis</Link> • No credit card required
                  </p>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="bloomberg-section">
          <div className="bloomberg-container-padded">
            <div className="bloomberg-card">
              <div className="bloomberg-hero-content">
                <h2 className="bloomberg-hero-title" style={{fontSize: '2rem'}}>
                  Ready to Start Your USMCA Optimization?
                </h2>
                <p className="bloomberg-hero-subtitle">
                  Begin immediately with our free analysis or schedule a consultation to discuss your specific needs with our Mexico-based USMCA experts.
                </p>
                <div className="bloomberg-flex">
                  <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary bloomberg-btn-large">
                    Start Free Analysis
                  </Link>
                  <Link href="/pricing" className="bloomberg-btn bloomberg-btn-secondary bloomberg-btn-large">
                    View Pricing Plans
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}