import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ContactSupport() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { reason } = router.query; // Can pre-fill subject from URL params

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to send message');
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
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Message Sent - Triangle Trade Intelligence</title>
        </Head>

        <div className="main-content" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
          <div style={{ maxWidth: '600px', width: '100%', padding: '2rem' }}>
            <div className="content-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✅</div>
              <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--green-600)', marginBottom: '1rem' }}>Message Sent!</h1>
              <p className="text-body" style={{ fontSize: '1.125rem', color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
                Thank you for contacting us. We've received your message and will respond to <strong>{formData.email}</strong> within 24 hours.
              </p>
              <div style={{ background: 'var(--blue-50)', padding: '1.5rem', borderRadius: 'var(--radius-base)', marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--blue-900)', margin: 0 }}>
                  <strong>What's next?</strong><br/>
                  Our support team will review your request and get back to you as soon as possible. Please check your email (including spam folder) for our response.
                </p>
              </div>
              <Link href="/login">
                <button className="btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
                  Back to Login
                </button>
              </Link>
              <Link href="/">
                <button className="btn-secondary" style={{ width: '100%' }}>
                  Go to Homepage
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
        <title>Contact Support - Triangle Trade Intelligence</title>
      </Head>

      <div className="main-content" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div style={{ maxWidth: '600px', width: '100%', padding: '2rem' }}>
          <div className="content-card" style={{ padding: '3rem' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <Link href="/">
                <div className="nav-logo-icon" style={{ margin: '0 auto 1.5rem', width: '64px', height: '64px', fontSize: '2rem' }}>T</div>
              </Link>
              <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--navy-900)', marginBottom: '0.75rem' }}>Contact Support</h1>
              <p className="text-body" style={{ fontSize: '1rem', color: 'var(--gray-600)' }}>
                Having trouble? Send us a message and we'll help you out.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: 'var(--red-50)',
                border: '1px solid var(--red-300)',
                borderRadius: 'var(--radius-base)',
                padding: '1rem',
                marginBottom: '1.5rem',
                color: 'var(--red-700)',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            {/* Support Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: '0.875rem' }}>
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
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

              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: '0.875rem' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@company.com"
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

              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="subject" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: '0.875rem' }}>
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject || reason || ''}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-base)',
                    fontSize: '1rem',
                    background: 'white',
                    transition: 'all 0.15s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--blue-500)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
                >
                  <option value="">Select a topic...</option>
                  <option value="Password Reset Request">Password Reset Request</option>
                  <option value="Login Issues">Login Issues</option>
                  <option value="Account Access">Account Access</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Billing Question">Billing Question</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="message" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)', fontSize: '0.875rem' }}>
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  placeholder="Please describe your issue in detail..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-base)',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    transition: 'all 0.15s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--blue-500)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
                  For password reset requests, please include your account email address.
                </p>
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
                {isLoading ? 'Sending...' : 'Send Message'}
              </button>
            </form>

            {/* Footer */}
            <div style={{ textAlign: 'center', paddingTop: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--gray-200)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.75rem' }}>
                We typically respond within 24 hours
              </p>
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
