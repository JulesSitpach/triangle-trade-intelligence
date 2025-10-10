import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Check Your Email - Triangle Trade Intelligence</title>
        </Head>

        <div className="main-content" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
          <div style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
            <div className="content-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--navy-900)', marginBottom: '1rem' }}>Check Your Email</h1>
              <p className="text-body" style={{ fontSize: '1rem', color: 'var(--gray-600)', marginBottom: '2rem' }}>
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <p className="text-body" style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '2rem' }}>
                Didn't receive the email? Check your spam folder or <Link href="/contact-support?reason=Password%20Reset%20Request" style={{ color: 'var(--blue-500)', fontWeight: '500' }}>contact support</Link>.
              </p>
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

  return (
    <>
      <Head>
        <title>Forgot Password - Triangle Trade Intelligence</title>
      </Head>

      <div className="main-content" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
        <div style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
          <div className="content-card" style={{ padding: '3rem' }}>

            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Link href="/">
                <div className="nav-logo-icon" style={{ margin: '0 auto 1.5rem', width: '64px', height: '64px', fontSize: '2rem' }}>T</div>
              </Link>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>Reset Your Password</h1>
              <p className="text-body" style={{ fontSize: '1rem', color: 'var(--gray-600)' }}>Enter your email and we'll send you a reset link</p>
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

            {/* Reset Form */}
            <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: '0.875rem' }}>Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="your.email@company.com"
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
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

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
