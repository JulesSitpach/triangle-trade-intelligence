import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../lib/contexts/ProductionAuthContext';
import { useRouter } from 'next/router';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      router.push('/dashboard');
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!formData.companyName.trim()) {
      setError('Company name is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { data, error } = await signUp(
        formData.email,
        formData.password,
        formData.companyName,
        formData.fullName
      );

      if (error) {
        setError(error);
      } else {
        // Registration successful with email confirmation
        console.log('Registration successful, check email for confirmation');
        setError(''); // Clear any previous errors
        // Show success message instead of redirecting
        alert('Account created successfully! Please check your email to verify your account before signing in.');
        router.push('/login?message=Please check your email to verify your account');
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
        <title>Start Free Trial - Triangle Intelligence</title>
        <meta name="description" content="Start your free trial with Triangle Intelligence" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Clean Centered SaaS Signup - Matching Login Style */}
      <div className="main-content">
        <div className="container-app">
          <div className="content-card" style={{maxWidth: '400px', margin: '0 auto'}}>
            {/* Logo */}
            <div className="section-header">
              <Link href="/">
                <div className="nav-logo-icon">T</div>
              </Link>
              <h1 className="section-title">Start Free Trial</h1>
              <p className="text-body">Get started with Triangle Intelligence</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="status-error">
                <div className="badge badge-error">⚠</div>
                <div className="text-body">{error}</div>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="John Smith"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Your Company Inc."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Work Email Address
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
                <label className="form-label">
                  Password
                </label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="form-input password-input"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                  >
                    {showPassword ? '◯' : '●'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Confirm Password
                </label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="form-input password-input"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle-btn"
                  >
                    {showConfirmPassword ? '◯' : '●'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Creating Account...' : 'Start Free Trial'}
              </button>
            </form>

            {/* Already have account */}
            <div className="element-spacing">
              <div className="text-body">
                Already have an account?{' '}
                <Link href="/login" className="text-body">
                  Sign in here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}