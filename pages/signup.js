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
    fullName: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signInWithGoogle, user } = useSimpleAuth();
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
  }, [user, plan, router]);

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

    return true;
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      // ✅ FIX: Pass the selected plan to OAuth so callback knows where to redirect
      const result = await signInWithGoogle(plan || 'trial');

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
      }
      // On success, Supabase will redirect to Google automatically
    } catch (err) {
      setError('Failed to sign up with Google');
      setIsLoading(false);
    }
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
        formData.fullName || 'My Company', // Use full name as company name to reduce signup friction
        formData.fullName
      );

      if (error) {
        setError(error);
      } else {
        // ✅ CONVERSION FIX: Check if instant access was granted (trial users)
        if (data.instant_access && data.session) {
          console.log('🚀 Trial signup complete - redirecting to dashboard');

          // Store session for the auth context
          if (typeof window !== 'undefined' && data.session) {
            // The session is already set by the API via cookies
            // Just redirect - the SimpleAuthContext will pick it up
            setTimeout(() => {
              router.push('/dashboard?welcome=true');
            }, 500);
          }
        } else if (plan && plan !== 'trial') {
          // ✅ For paid plans, redirect to login and then back to pricing
          if (typeof window !== 'undefined') {
            localStorage.setItem('pendingSubscriptionPlan', plan);
            localStorage.setItem('pendingSubscriptionTimestamp', Date.now().toString());
          }
          alert(`✅ Account Created Successfully!\n\n📧 IMPORTANT: Check your email to verify your account.\n\n⏰ Email may take 2-5 minutes to arrive\n📬 Check your spam/junk folder\n💬 No email? Contact triangleintel@gmail.com\n\nAfter verification, you'll be able to subscribe to the ${plan} plan.`);
          router.push(`/login?redirect=/pricing&message=Please verify your email to complete subscription`);
        } else {
          // Fallback: should not reach here for trial, but handle gracefully
          console.log('Registration successful, redirecting to dashboard');
          router.push('/dashboard?welcome=true');
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
        <div className="container-app auth-container">
          <div className="content-card">
            {/* Logo & Header */}
            <div className="text-center">
              <Link href="/" className="nav-logo-link">
                <div className="nav-logo-icon">T</div>
              </Link>
              <h1 className="section-header-title">
                {plan === 'starter' && 'Create Your Account'}
                {plan === 'professional' && 'Create Your Account'}
                {plan === 'premium' && 'Create Your Account'}
                {(!plan || plan === 'trial') && 'Start Your Free Trial'}
              </h1>
              <p className="section-header-subtitle">
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

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="btn-primary"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.75rem'}}>
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
              </svg>
              {isLoading ? 'Signing up...' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <span className="auth-divider-text">OR</span>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="John Smith"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="you@company.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="form-input"
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Confirm your password"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    required
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
            <div className="text-center element-spacing">
              <p className="form-help">
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

            {/* Contact Support */}
            <div className="text-center element-spacing">
              <p className="form-help">
                Need help? <Link href="/support" className="content-card-link">Contact Support</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}