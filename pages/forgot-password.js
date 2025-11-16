import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import TriangleLayout from '../components/TriangleLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password | Triangle Trade Intelligence</title>
        <meta name="description" content="Reset your Triangle Trade Intelligence password" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <TriangleLayout>
        <div className="main-content">
          <div className="container-app" style={{maxWidth: '500px'}}>
            <div className="content-card">
              {!submitted ? (
                <>
                  <h1 className="card-title">Reset Your Password</h1>
                  <p className="text-body">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="your.email@company.com"
                      />
                    </div>

                    {error && (
                      <div className="status-error">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>

                    <div className="text-center">
                      <Link href="/login" className="content-card-link">
                        ← Back to Login
                      </Link>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="badge badge-primary">✉️</div>
                    <h1 className="card-title">Check Your Email</h1>
                  </div>

                  <p className="text-body">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>

                  <p className="text-body">
                    Click the link in the email to reset your password. If you don't see the email,
                    check your spam folder.
                  </p>

                  <div className="text-center">
                    <Link href="/login" className="btn-primary">
                      Return to Login
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </TriangleLayout>
    </>
  );
}
