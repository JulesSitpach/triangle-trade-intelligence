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
        // Priority 2: Admin users go to admin dev dashboard
        else if (result.user && result.user.isAdmin) {
          router.push('/admin/dev-dashboard');
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

      <div className="main-content" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
        <div style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
          <div className="content-card" style={{ padding: '3rem' }}>

            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Link href="/">
                <div className="nav-logo-icon" style={{ margin: '0 auto 1.5rem', width: '64px', height: '64px', fontSize: '2rem' }}>T</div>
              </Link>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>WELCOME BACK</h1>
              <p className="text-body" style={{ fontSize: '1rem', color: 'var(--gray-600)' }}>Sign in to your Triangle Trade Intelligence account</p>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: 'var(--red-50)',
                border: '1px solid var(--red-300)',
                borderRadius: 'var(--radius-base)',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                color: 'var(--red-700)',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: '0.875rem' }}>Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-base)',
                    fontSize: '1rem',
                    transition: 'all 0.15s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--blue-500)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: '0.875rem' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      padding: '0.75rem 3rem 0.75rem 1rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-base)',
                      fontSize: '1rem',
                      transition: 'all 0.15s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--blue-500)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      padding: '0.25rem',
                      color: 'var(--gray-500)'
                    }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--blue-500)',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  Forgot your password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  justifyContent: 'center'
                }}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Footer Note */}
            <div style={{ textAlign: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', margin: 0 }}>
                Need help? <Link href="/contact-support?reason=Login%20Issues" style={{ color: 'var(--blue-500)', textDecoration: 'none', fontWeight: '500' }}>Contact Support</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}