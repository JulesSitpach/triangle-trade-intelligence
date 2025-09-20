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

  // If already logged in, redirect immediately
  useEffect(() => {
    if (user) {
      console.log('User already logged in, redirecting...');
      if (user.isAdmin) {
        router.replace('/admin/collaboration-workspace');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, router]);

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
        // Success - redirect will happen via useEffect when user state updates
        console.log('Login successful, waiting for redirect...');
      }
    } catch (err) {
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
        <title>Sign In - Triangle Intelligence</title>
      </Head>

      <div className="main-content">
        <div className="container-app">
          <div className="content-card" style={{maxWidth: '400px', margin: '0 auto'}}>

            {/* Logo */}
            <div className="section-header">
              <Link href="/">
                <div className="nav-logo-icon">T</div>
              </Link>
              <h1 className="section-title">Welcome Back</h1>
              <p className="text-body">Sign in to your Triangle Intelligence account</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message" style={{
                background: '#fee',
                border: '1px solid #fcc',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '20px',
                color: '#c00'
              }}>
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div style={{position: 'relative'}}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="hero-cta-button"
                disabled={isLoading}
                style={{width: '100%', marginTop: '20px'}}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Footer Links */}
            <div style={{textAlign: 'center', marginTop: '20px'}}>
              <p>
                Don't have an account?{' '}
                <Link href="/signup" style={{color: '#007bff'}}>
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}