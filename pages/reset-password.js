import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);

  const router = useRouter();
  const { token } = router.query;

  // Verify token on page load
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch('/api/auth/verify-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();
      setTokenValid(response.ok);

      if (!response.ok) {
        setError(data.error || 'Invalid or expired reset link');
      }
    } catch (err) {
      setTokenValid(false);
      setError('Failed to verify reset link');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while verifying token
  if (tokenValid === null) {
    return (
      <>
        <Head>
          <title>Reset Password - Triangle Trade Intelligence</title>
        </Head>
        <div className="main-content" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner-large"></div>
            <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>Verifying reset link...</p>
          </div>
        </div>
      </>
    );
  }

  // Invalid token
  if (tokenValid === false) {
    return (
      <>
        <Head>
          <title>Invalid Link - Triangle Trade Intelligence</title>
        </Head>
        <div className="main-content" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
          <div style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
            <div className="content-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--red-600)', marginBottom: '1rem' }}>Invalid Reset Link</h1>
              <p className="text-body" style={{ fontSize: '1rem', color: 'var(--gray-600)', marginBottom: '2rem' }}>
                {error || 'This password reset link is invalid or has expired.'}
              </p>
              <Link href="/forgot-password">
                <button className="btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
                  Request New Reset Link
                </button>
              </Link>
              <Link href="/login">
                <button className="btn-secondary" style={{ width: '100%' }}>
                  Back to Login
                </button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Success state
  if (success) {
    return (
      <>
        <Head>
          <title>Password Reset Successful - Triangle Trade Intelligence</title>
        </Head>
        <div className="main-content" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
          <div style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
            <div className="content-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--green-600)', marginBottom: '1rem' }}>Password Reset Successful!</h1>
              <p className="text-body" style={{ fontSize: '1rem', color: 'var(--gray-600)', marginBottom: '2rem' }}>
                Your password has been updated. Redirecting you to login...
              </p>
              <Link href="/login">
                <button className="btn-primary" style={{ width: '100%' }}>
                  Go to Login
                </button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Reset password form
  return (
    <>
      <Head>
        <title>Reset Password - Triangle Trade Intelligence</title>
      </Head>

      <div className="main-content" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
        <div style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
          <div className="content-card" style={{ padding: '3rem' }}>

            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Link href="/">
                <div className="nav-logo-icon" style={{ margin: '0 auto 1.5rem', width: '64px', height: '64px', fontSize: '2rem' }}>T</div>
              </Link>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>Set New Password</h1>
              <p className="text-body" style={{ fontSize: '1rem', color: 'var(--gray-600)' }}>Choose a strong password for your account</p>
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

            {/* Reset Password Form */}
            <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: '0.875rem' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
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

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: '0.875rem' }}>Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter your password"
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
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>

            {/* Password Requirements */}
            <div style={{ padding: '1rem', background: 'var(--blue-50)', borderRadius: 'var(--radius-base)', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--blue-900)', marginBottom: '0.5rem' }}>Password Requirements:</p>
              <ul style={{ fontSize: '0.75rem', color: 'var(--blue-800)', margin: 0, paddingLeft: '1.25rem' }}>
                <li>At least 8 characters long</li>
                <li>Mix of letters and numbers recommended</li>
                <li>Avoid common passwords</li>
              </ul>
            </div>

            {/* Back to Login */}
            <div style={{ textAlign: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)' }}>
              <Link href="/login" style={{ fontSize: '0.875rem', color: 'var(--blue-500)', textDecoration: 'none', fontWeight: '500' }}>
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
