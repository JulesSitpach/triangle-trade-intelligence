import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSimpleAuth } from '../lib/contexts/SimpleAuthContext';
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
  const { signUp, user } = useSimpleAuth();
  const router = useRouter();
  const { plan } = router.query; // Get selected plan from URL

  useEffect(() => {
    // If user is already logged in, redirect to appropriate page
    if (user) {
      // If they selected a paid plan, go to pricing to complete subscription
      if (plan && plan !== 'trial') {
        router.push('/pricing');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, plan]);

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

        // Redirect based on selected plan
        if (plan && plan !== 'trial') {
          // For paid plans, redirect to login and then back to pricing
          alert(`✅ Account Created Successfully!\n\n📧 IMPORTANT: Check your email to verify your account.\n\n⏰ Email may take 2-5 minutes to arrive\n📬 Check your spam/junk folder\n💬 No email? Contact triangleintel@gmail.com\n\nAfter verification, you'll be able to subscribe to the ${plan} plan.`);
          router.push(`/login?redirect=/pricing&message=Please verify your email to complete subscription`);
        } else {
          // For trial, show email verification notice
          alert(`✅ Account Created Successfully!\n\n📧 IMPORTANT: Check your email to verify your account.\n\n⏰ Email may take 2-5 minutes to arrive\n📬 Check your spam/junk folder\n💬 No email? Contact triangleintel@gmail.com\n\nAfter verification, you can sign in and start your free trial.`);
          router.push('/login?message=Please check your email to verify your account before signing in.');
        }
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
        <title>Create Account - Triangle Trade Intelligence</title>
        <meta name="description" content="Create your account to access professional USMCA compliance tools and expert support" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Clean Centered SaaS Signup - Matching Login Style */}
      <div className="main-content">
        <div className="container-app">
          <div className="content-card" style={{maxWidth: '400px', margin: '0 auto'}}>
            {/* Logo & Header */}
            <div style={{textAlign: 'center', marginBottom: '2rem'}}>
              <Link href="/" style={{display: 'inline-block', marginBottom: '1.5rem'}}>
                <div className="nav-logo-icon">T</div>
              </Link>
              <h1 style={{fontSize: '1.75rem', fontWeight: '600', margin: '0 0 0.5rem 0', color: '#111'}}>
                {plan === 'starter' && 'Create Your Account'}
                {plan === 'professional' && 'Create Your Account'}
                {plan === 'premium' && 'Create Your Account'}
                {(!plan || plan === 'trial') && 'Start Your Free Trial'}
              </h1>
              <p style={{fontSize: '0.9375rem', color: '#666', margin: '0'}}>
                {plan === 'starter' && 'Subscribe to Starter plan after signup'}
                {plan === 'professional' && 'Subscribe to Professional plan after signup'}
                {plan === 'premium' && 'Subscribe to Premium plan after signup'}
                {(!plan || plan === 'trial') && 'No credit card required'}
              </p>
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
                <label className="form-label">
                  Full Name
                </label>
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
                <label className="form-label">
                  Company Name
                </label>
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
                <label className="form-label">
                  Work Email Address
                </label>
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
                <label className="form-label">
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
                    {showPassword ? '◯' : '●'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
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
                    I agree to the <Link href="/terms-of-service" target="_blank" className="nav-link">Terms of Service</Link> and <Link href="/privacy-policy" target="_blank" className="nav-link">Privacy Policy</Link>, including automatic storage of workflow data for alerts and services.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Creating Account...' :
                  plan === 'starter' ? 'Create Account & Subscribe' :
                  plan === 'professional' ? 'Create Account & Subscribe' :
                  plan === 'premium' ? 'Create Account & Subscribe' :
                  'Start Free Trial'
                }
              </button>
            </form>

            {/* Simple Footer Text - No Boxes */}
            <div style={{marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee', textAlign: 'center'}}>
              <p className="text-body" style={{fontSize: '0.875rem', color: '#666', margin: '0'}}>
                {(!plan || plan === 'trial') && 'Free trial includes 1 analysis • No credit card required'}
                {plan === 'starter' && 'After signup, complete payment via Stripe'}
                {plan === 'professional' && 'After signup, complete payment via Stripe'}
                {plan === 'premium' && 'After signup, complete payment via Stripe'}
              </p>
            </div>

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