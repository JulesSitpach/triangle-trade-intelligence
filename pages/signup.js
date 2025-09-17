import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../lib/contexts/ProductionAuthContext';
import { useRouter } from 'next/router';

export default function Signup() {
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
  const { signUp, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      router.push('/dashboard');
    }
  }, [user]);

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
      const { data, error } = await signUp(
        formData.email,
        formData.password,
        formData.companyName,
        formData.fullName
      );

      if (error) {
        setError(error);
      } else {
        // Registration successful with email confirmation
        console.log('Registration successful, check email for confirmation');
        setError(''); // Clear any previous errors
        // Show success message instead of redirecting
        alert('Account created successfully! Please check your email to verify your account before signing in.');
        router.push('/login?message=Please check your email to verify your account');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Start Free Trial - Triangle Intelligence</title>
        <meta name="description" content="Start your free trial with Triangle Intelligence" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="main-content">
        <div className="container-app">
          <div style={{ maxWidth: '400px', margin: '0 auto', padding: '40px 0' }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <Link href="/">
                <div className="nav-logo-icon" style={{
                  width: '60px',
                  height: '60px',
                  fontSize: '24px',
                  margin: '0 auto 16px'
                }}>
                  T
                </div>
              </Link>
              <h1 className="section-header-title">Start Your Free Trial</h1>
              <p className="text-body">Get started with Triangle Intelligence today</p>

              {/* Trial Benefits */}
              <div className="hero-badge" style={{ margin: '20px 0' }}>
                7-Day Free Trial • No Credit Card Required
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="hero-badge" style={{
                backgroundColor: '#dc2626',
                color: 'white',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            {/* Signup Form */}
            <div className="content-card">
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label className="text-body" style={{ display: 'block', marginBottom: '8px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="John Smith"
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label className="text-body" style={{ display: 'block', marginBottom: '8px' }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Your Company Inc."
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label className="text-body" style={{ display: 'block', marginBottom: '8px' }}>
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="you@company.com"
                  />
                </div>

                <div className="form-group">
                  <label className="text-body form-label">
                    Password
                  </label>
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
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="text-body form-label">
                    Confirm Password
                  </label>
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
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="hero-primary-button"
                  style={{
                    width: '100%',
                    marginBottom: '20px',
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  {isLoading ? 'Creating Account...' : 'Start Free Trial'}
                </button>
              </form>

              <div style={{ textAlign: 'center' }}>
                <p className="text-body" style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>

                <p className="text-body">
                  Already have an account?{' '}
                  <Link href="/login" className="nav-link">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Trial Benefits */}
            <div className="content-card" style={{ marginTop: '20px' }}>
              <h3 className="content-card-title" style={{ fontSize: '16px', marginBottom: '12px' }}>
                What's included in your free trial:
              </h3>
              <div>
                <p className="text-body">✓ 1 free HS code classification</p>
                <p className="text-body">✓ Basic USMCA qualification workflow</p>
                <p className="text-body">✓ Tariff savings calculator</p>
                <p className="text-body">✓ Email support</p>
              </div>
            </div>

            {/* Back to Home */}
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <Link href="/" className="nav-link">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}