import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSimpleAuth } from '../lib/contexts/SimpleAuthContext';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user, login } = useSimpleAuth();
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

  return (
    <>
      <Head>
        <title>Sign In - Triangle Trade Intelligence</title>
      </Head>

      <div className="main-content">
        <div className="container-app" style={{maxWidth: '480px'}}>
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
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="input-toggle-btn"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
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

            {/* Footer Note */}
            <div className="text-center" style={{paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)'}}>
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