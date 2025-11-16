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
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true  // This is critical for password reset!
    }
  }
);

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [accessToken, setAccessToken] = useState('');

  // Check if we have a valid reset token from URL hash
  useEffect(() => {
    const checkToken = async () => {
      // Extract and save access token IMMEDIATELY before anything else
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const token = hashParams.get('access_token');
      const type = hashParams.get('type');

      if (token && type === 'recovery') {
        setAccessToken(token);
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
      // Use the saved access token from page load
      if (!accessToken) {
        setError('Invalid reset link. Please request a new one.');
        setLoading(false);
        return;
      }

      // Call server-side API to update password
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: accessToken,
          newPassword: password
        })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to reset password');
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
          <div className="container-app" style={{maxWidth: '500px'}}>
            <div className="content-card">
              {!success ? (
                <>
                  <h1 className="card-title">Reset Your Password</h1>

                  {validToken ? (
                    <>
                      <p className="text-body">
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
                          <div className="status-error">
                            {error}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={loading}
                        >
                          {loading ? 'Resetting Password...' : 'Reset Password'}
                        </button>

                        <div className="text-center">
                          <Link href="/login" className="content-card-link">
                            ← Back to Login
                          </Link>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="status-error">
                      {error}
                      <div className="text-center">
                        <Link href="/forgot-password" className="btn-primary">
                          Request New Reset Link
                        </Link>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <div className="badge badge-success">✅</div>
                  <h1 className="card-title">Password Reset Successful!</h1>
                  <p className="text-body">
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
