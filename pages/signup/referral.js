import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Referrer mapping
const REFERRERS = {
  adam: {
    name: 'Adam Williams',
    title: 'Private Equity Fund Manager',
    company: 'Elevest Capital'
  },
  anthony: {
    name: 'Anthony Robinson',
    title: 'CEO',
    company: 'ShipScience'
  }
};

export default function ReferralSignup() {
  const router = useRouter();
  const { ref } = router.query;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const referrer = ref ? REFERRERS[ref.toLowerCase()] : null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!formData.companyName.trim()) {
      setError('Company name is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          company_name: formData.companyName,
          full_name: formData.fullName,
          referred_by: referrer ? referrer.name : ref || 'Unknown',
          referral_source: 'linkedin',
          referral_code: ref
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
      } else {
        // Success - show trial info and redirect to dashboard
        alert(`✅ 30-Day Professional Trial Activated!\n\nYou now have full access to:\n• Unlimited USMCA analyses\n• Real-time trade alerts\n• 15% discount on professional services\n• Priority support\n\nYour trial expires in 30 days. We'll remind you before it ends.`);
        router.push('/dashboard?trial=active');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>30-Day Trial - Triangle Trade Intelligence</title>
        <meta name="description" content="Start your 30-day Professional tier trial with full access to USMCA compliance tools" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="main-content">
        <div className="container-app">
          <div className="content-card" style={{maxWidth: '500px', margin: '0 auto'}}>
            {/* Logo */}
            <div className="section-header">
              <Link href="/">
                <div className="nav-logo-icon">T</div>
              </Link>

              {/* Referral Badge */}
              {referrer && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#ecfdf5',
                  border: '2px solid #10b981',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎁</div>
                  <div style={{ fontWeight: '600', color: '#065f46', marginBottom: '0.25rem' }}>
                    Referred by {referrer.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#047857' }}>
                    {referrer.title} at {referrer.company}
                  </div>
                </div>
              )}

              <h1 className="section-title">30-Day Professional Trial</h1>
              <p className="text-body">Full access to USMCA compliance tools - no credit card required</p>

              {/* Trial Benefits */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                marginTop: '1rem',
                textAlign: 'left'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
                  ✅ Your Trial Includes:
                </div>
                <ul style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.6', paddingLeft: '1.25rem' }}>
                  <li>Unlimited USMCA analyses</li>
                  <li>Real-time tariff policy alerts</li>
                  <li>Crisis monitoring for trade disputes</li>
                  <li>15% discount on professional services</li>
                  <li>Priority support (48hr response)</li>
                  <li>Full access to Mexico trade experts</li>
                </ul>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  💡 No credit card required • Cancel anytime
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="status-error">
                <div className="badge badge-error">⚠</div>
                <div className="text-body">{error}</div>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="John Smith"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Your Company Inc."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Work Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="you@company.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="form-input password-input"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                  >
                    {showPassword ? '◯' : '●'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="form-input password-input"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle-btn"
                  >
                    {showConfirmPassword ? '◯' : '●'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    required
                    style={{marginRight: '0.5rem'}}
                  />
                  <span className="text-body">
                    I agree to the <Link href="/terms-of-service" target="_blank" className="nav-link">Terms of Service</Link> and <Link href="/privacy-policy" target="_blank" className="nav-link">Privacy Policy</Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Activating Trial...' : '🎁 Start 30-Day Trial'}
              </button>
            </form>

            {/* Already have account */}
            <div className="element-spacing">
              <div className="text-body">
                Already have an account?{' '}
                <Link href="/login" className="text-body">
                  Sign in here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
