import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../lib/contexts/ProductionAuthContext';
import { useRouter } from 'next/router';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      router.push('/dashboard');
    }

    // Check for URL parameters for messages and email pre-fill
    if (router.query.message) {
      setMessage(router.query.message);
    }
    if (router.query.error) {
      setError(router.query.error);
    }
    if (router.query.verified === 'true') {
      setMessage('✅ Email verified successfully! Please sign in with your password.');
    }
    if (router.query.email) {
      setFormData(prev => ({
        ...prev,
        email: decodeURIComponent(router.query.email)
      }));
    }
  }, [user]); // Only track user changes to prevent infinite loops

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await signIn(formData.email, formData.password);

      if (error) {
        setError(error);
      } else {
        // Login successful, ProductionAuthContext handles redirect
        console.log('Login successful, redirecting...');
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
        <title>Sign In - Triangle Intelligence</title>
        <meta name="description" content="Sign in to Triangle Intelligence" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="main-content">
        <div className="container-app">
          <div className="content-card">
            {/* Logo */}
            <div className="section-header">
              <Link href="/">
                <div className="nav-logo-icon">T</div>
              </Link>
              <h1 className="section-header-title">Welcome Back</h1>
              <p className="text-body">Sign in to your Triangle Intelligence account</p>
            </div>

            {/* Success Message */}
            {message && (
              <div className="hero-badge">
                ✅ {message}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="hero-badge">
                ❌ {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="text-body form-label">
                  Email Address
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
                    className="form-input password-input"
                    placeholder="Your password"
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

              {/* Forgot Password Link */}
              <div className="element-spacing">
                <Link href="/forgot-password" className="nav-link">
                  Forgot your password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="hero-primary-button"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Create Account Link */}
            <div className="element-spacing">
              <div className="text-body">
                Don't have an account?{' '}
                <Link href="/signup" className="nav-link">
                  Start Free Trial
                </Link>
              </div>
            </div>

            {/* Back to Home */}
            <div className="element-spacing">
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