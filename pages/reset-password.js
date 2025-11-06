/**
 * Password Reset Page
 * Users land here after clicking the reset link in their email
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import TriangleLayout from '../components/TriangleLayout';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);

  // Check if we have a valid reset token from URL hash
  useEffect(() => {
    const checkToken = async () => {
      // First check if there's a hash in the URL (Supabase sends access_token in hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      // If we have a recovery token in the URL, this is valid
      if (accessToken && type === 'recovery') {
        setValidToken(true);
        return;
      }

      // Otherwise check for existing session
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setValidToken(true);
      } else {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    };

    checkToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err) {
      setError('Failed to reset password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password | Triangle Trade Intelligence</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <TriangleLayout>
        <div className="main-content">
          <div className="container-app">
            <div className="content-card" style={{ maxWidth: '500px', margin: '50px auto' }}>
              {!success ? (
                <>
                  <h1 className="card-title">Reset Your Password</h1>

                  {validToken ? (
                    <>
                      <p className="text-body" style={{ marginBottom: '30px' }}>
                        Enter your new password below.
                      </p>

                      <form onSubmit={handleSubmit}>
                        <div className="form-group">
                          <label htmlFor="password" className="form-label">New Password</label>
                          <input
                            type="password"
                            id="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength="8"
                            placeholder="At least 8 characters"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                          <input
                            type="password"
                            id="confirmPassword"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-enter your password"
                          />
                        </div>

                        {error && (
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#FEE2E2',
                            border: '1px solid #FCA5A5',
                            borderRadius: '6px',
                            marginBottom: '20px'
                          }}>
                            <p style={{ color: '#DC2626', margin: 0 }}>{error}</p>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={loading}
                          style={{ width: '100%', marginBottom: '20px' }}
                        >
                          {loading ? 'Resetting Password...' : 'Reset Password'}
                        </button>

                        <div style={{ textAlign: 'center' }}>
                          <Link href="/login" style={{ color: '#2563EB', textDecoration: 'none' }}>
                            ← Back to Login
                          </Link>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#FEE2E2',
                      border: '1px solid #FCA5A5',
                      borderRadius: '6px',
                      marginBottom: '20px'
                    }}>
                      <p style={{ color: '#DC2626', margin: 0 }}>{error}</p>
                      <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <Link href="/forgot-password" className="btn-primary">
                          Request New Reset Link
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
                  <h1 className="card-title">Password Reset Successful!</h1>
                  <p className="text-body" style={{ marginBottom: '20px' }}>
                    Your password has been updated. Redirecting you to login...
                  </p>
                  <Link href="/login" className="btn-primary">
                    Go to Login Now
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </TriangleLayout>
    </>
  );
}
