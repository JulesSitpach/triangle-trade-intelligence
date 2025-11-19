import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSimpleAuth } from '../lib/contexts/SimpleAuthContext';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user, login, signInWithGoogle } = useSimpleAuth();
  const router = useRouter();
  const { redirect, message } = router.query;

  // Note: Removed automatic redirect on page load
  // Server-side authentication handles redirects properly now
  // This prevents infinite redirect loops

  // Show message from query parameter (e.g., from signup flow)
  useEffect(() => {
    if (message) {
      setError(message);
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.error) {
        setError(result.error);
      } else {
        // Success - redirect based on return URL or user role
        console.log('Login successful, redirecting...');

        // Priority 1: Use redirect query parameter if provided
        if (redirect) {
          router.push(redirect);
        }
        // Priority 2: Admin users go to admin monitoring dashboard
        else if (result.user && result.user.isAdmin) {
          router.push('/admin-dev-monitor');
        }
        // Priority 3: Regular users go to user dashboard
        else {
          router.push('/dashboard');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      const result = await signInWithGoogle();

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
      }
      // On success, Supabase will redirect to Google automatically
      // No need to set isLoading false - page will redirect
    } catch (err) {
      setError('Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In - Triangle Trade Intelligence</title>
      </Head>

      <div className="main-content">
        <div className="container-app auth-container">
          <div className="content-card">

            {/* Logo */}
            <div className="text-center">
              <Link href="/" className="nav-logo-link">
                <div className="nav-logo-icon">T</div>
              </Link>
              <h1 className="section-header-title">WELCOME BACK</h1>
              <p className="section-header-subtitle">Sign in to your Triangle Trade Intelligence account</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="status-error">
                {error}
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
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <span className="auth-divider-text">OR</span>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className="form-input"
                />
              </div>

              <div className="text-right">
                <Link href="/forgot-password" className="content-card-link">
                  Forgot your password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

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