import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { getWaitingListStats } from '../lib/specialist-intelligence'
import { getSocialProofStats } from '../lib/similarity-intelligence'

export default function SignupPage() {
  const [selectedPlan, setSelectedPlan] = useState('professional')
  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    businessType: '',
    importVolume: '',
    referralSource: ''
  })
  const [specialistStats, setSpecialistStats] = useState(null)
  const [socialProof, setSocialProof] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load dynamic stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [specialists, social] = await Promise.all([
          getWaitingListStats(),
          getSocialProofStats({ businessType: 'Manufacturing' }, 'signup')
        ])
        setSpecialistStats(specialists)
        setSocialProof(social)
      } catch (err) {
        console.warn('Stats loading failed:', err)
      }
    }
    loadStats()
  }, [])

  const pricingPlans = {
    starter: {
      name: 'Triangle Starter',
      price: '$297',
      period: '/month',
      description: 'Perfect for small importers ready to optimize USMCA routes',
      features: [
        '3 triangle route analyses per month',
        'Basic HS code mapping',
        'Email support',
        'Access to intelligence database',
        'Standard reporting'
      ],
      cta: 'Start Optimizing',
      popular: false,
      savings: 'Save up to $50K annually'
    },
    professional: {
      name: 'Triangle Professional',
      price: '$697',
      period: '/month',
      description: 'Most popular - Complete triangle intelligence for growing businesses',
      features: [
        'Unlimited triangle analyses',
        'AI-powered HS code optimization',
        'Specialist network access (Coming Soon)',
        'Priority support',
        'Advanced reporting & insights',
        'API access',
        'Custom routing strategies'
      ],
      cta: 'Go Professional',
      popular: true,
      savings: 'Save up to $200K annually'
    },
    enterprise: {
      name: 'Triangle Enterprise',
      price: '$1,997',
      period: '/month',
      description: 'Enterprise-grade for serious importers with complex needs',
      features: [
        'Everything in Professional',
        'Dedicated specialist consultant',
        'Custom integration support',
        'White-label options',
        'Advanced compliance tools',
        'Multi-user accounts',
        'SLA guarantees'
      ],
      cta: 'Contact Sales',
      popular: false,
      savings: 'Save $500K+ annually'
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate signup process
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Store signup data for potential integration
    const signupData = {
      ...formData,
      selectedPlan,
      timestamp: new Date().toISOString(),
      pricing: pricingPlans[selectedPlan]
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('triangle-signup', JSON.stringify(signupData))
    }
    
    // Redirect to success or analysis start
    window.location.href = selectedPlan === 'enterprise' ? '/contact' : '/stage1?signup=true'
  }

  return (
    <>
      <Head>
        <title>Join Triangle Intelligence - USMCA Optimization Platform</title>
        <meta name="description" content="Start saving $200K+ annually with Triangle Intelligence USMCA routing optimization" />
      </Head>
      
      <nav className="bloomberg-nav">
        <Link href="/" className="bloomberg-nav-brand">Triangle Intelligence</Link>
        
        <div className="nav-links">
          <Link href="/pricing" className="bloomberg-nav-link">Pricing</Link>
          <Link href="/markets" className="bloomberg-nav-link">Markets</Link>
          <Link href="/stage1" className="bloomberg-btn bloomberg-btn-primary">Start Analysis</Link>
        </div>
      </nav>
      
      <main className="main">
        <div className="container">
          
          {/* Hero Section */}
          <section className="signup-hero">
            <h1 className="signup-title">Join 240+ Companies Using Triangle Intelligence</h1>
            <p className="signup-subtitle">
              Start optimizing your USMCA routes and saving $200K+ annually with institutional intelligence
            </p>
            
            {/* Dynamic Social Proof */}
            {socialProof && (
              <div className="social-proof">
                <div className="social-proof-title">
                  🏆 {socialProof.similarCompanies}+ similar companies already optimizing
                </div>
                <div className="social-proof-text">
                  {socialProof.successStories} success stories • Platform intelligence grows with every user
                </div>
              </div>
            )}
          </section>

          {/* Pricing Cards */}
          <section className="pricing-section">
            <div className="pricing-grid">
              {Object.entries(pricingPlans).map(([key, plan]) => (
                <div 
                  key={key}
                  className={`pricing-card ${selectedPlan === key ? 'pricing-card-selected' : ''} ${plan.popular ? 'pricing-card-popular' : ''}`}
                  onClick={() => setSelectedPlan(key)}
                >
                  {plan.popular && (
                    <div className="pricing-badge">MOST POPULAR</div>
                  )}
                  
                  <h3 className="pricing-plan-name">{plan.name}</h3>
                  <div className="pricing-plan-price">
                    {plan.price}<span className="pricing-period">{plan.period}</span>
                  </div>
                  <p className="pricing-description">{plan.description}</p>
                  <div className="pricing-savings">{plan.savings}</div>
                  
                  <ul className="pricing-features">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="pricing-feature">
                        ✓ {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Signup Form */}
          <section className="signup-form-section">
            <div className="signup-form-container">
              <h2 className="signup-form-title">
                Start with {pricingPlans[selectedPlan].name}
              </h2>
              <p className="signup-form-subtitle">
                Begin your triangle intelligence journey - {pricingPlans[selectedPlan].savings.toLowerCase()}
              </p>
              
              <form onSubmit={handleSubmit} className="signup-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Business Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your@company.com"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Company Name</label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="Your Company Inc."
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Business Type</label>
                    <select
                      required
                      value={formData.businessType}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                    >
                      <option value="">Select Industry</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Automotive">Automotive</option>
                      <option value="Textiles">Textiles</option>
                      <option value="Medical">Medical</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Annual Import Volume</label>
                    <select
                      required
                      value={formData.importVolume}
                      onChange={(e) => handleInputChange('importVolume', e.target.value)}
                    >
                      <option value="">Select Volume</option>
                      <option value="Under $500K">Under $500K</option>
                      <option value="$500K - $1M">$500K - $1M</option>
                      <option value="$1M - $5M">$1M - $5M</option>
                      <option value="$5M - $25M">$5M - $25M</option>
                      <option value="Over $25M">Over $25M</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>How did you hear about us? (Optional)</label>
                  <select
                    value={formData.referralSource}
                    onChange={(e) => handleInputChange('referralSource', e.target.value)}
                  >
                    <option value="">Select Source</option>
                    <option value="Search Engine">Google/Search</option>
                    <option value="Industry Publication">Trade Publication</option>
                    <option value="Referral">Referred by colleague</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Conference">Industry Conference</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  className="signup-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 
                   selectedPlan === 'enterprise' ? 'Contact Sales' : `Start ${pricingPlans[selectedPlan].name}`}
                </button>
                
                <p className="signup-terms">
                  By signing up, you agree to our Terms of Service and Privacy Policy.<br/>
                  Start your free analysis immediately - billing begins after your first optimization.
                </p>
              </form>
            </div>
          </section>

          {/* Trust Signals */}
          {specialistStats && (
            <section className="trust-section">
              <div className="trust-stats">
                <div className="trust-stat">
                  <span className="trust-number">{specialistStats.totalWaiting}+</span>
                  <span className="trust-label">Companies Using Platform</span>
                </div>
                <div className="trust-stat">
                  <span className="trust-number">${Math.round(specialistStats.averageSavings / 1000)}K</span>
                  <span className="trust-label">Average Annual Savings</span>
                </div>
                <div className="trust-stat">
                  <span className="trust-number">15,079</span>
                  <span className="trust-label">Trade Records Analyzed</span>
                </div>
                <div className="trust-stat">
                  <span className="trust-number">240+</span>
                  <span className="trust-label">Successful Journeys</span>
                </div>
              </div>
            </section>
          )}

        </div>
      </main>
    </>
  )
}