import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle, sending, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', company: '', subject: '', message: '' });
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to send message');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>Contact Us - Triangle Intelligence</title>
        <meta name="description" content="Contact Triangle Intelligence for USMCA compliance and trade services support" />
      </Head>

      <div className="main-content">
        <div className="container-app">
          <div className="content-card">
            {/* Header */}
            <div className="section-header">
              <Link href="/">
                <div className="nav-logo-icon">T</div>
              </Link>
              <h1 className="section-title">Contact Us</h1>
              <p className="text-body">
                Get in touch with our team for support, questions, or partnership inquiries
              </p>
            </div>

            {/* Success Message */}
            {status === 'success' && (
              <div className="card" style={{ backgroundColor: '#f0fdf4', border: '1px solid #16a34a', marginBottom: '2rem' }}>
                <h3 style={{ color: '#16a34a', marginBottom: '0.5rem' }}>Message Sent Successfully!</h3>
                <p className="text-body">
                  Thank you for contacting us. We'll get back to you within 24 hours.
                </p>
              </div>
            )}

            {/* Error Message */}
            {status === 'error' && (
              <div className="card" style={{ backgroundColor: '#fef2f2', border: '1px solid #dc2626', marginBottom: '2rem' }}>
                <h3 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Error Sending Message</h3>
                <p className="text-body">{errorMessage}</p>
              </div>
            )}

            {/* Contact Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="company">Company Name</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="sales">Sales & Pricing</option>
                  <option value="compliance">USMCA Compliance Question</option>
                  <option value="services">Professional Services</option>
                  <option value="partnership">Partnership Inquiry</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  className="form-input"
                  placeholder="Please provide details about your inquiry..."
                />
              </div>

              <button
                type="submit"
                className="hero-primary-button"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Sending...' : 'Send Message'}
              </button>
            </form>

            {/* Contact Information */}
            <div className="card" style={{ marginTop: '3rem', backgroundColor: '#f9fafb' }}>
              <h3 className="card-title">Other Ways to Reach Us</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                <div>
                  <h4 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Email Support</h4>
                  <a href="mailto:support@triangleintelligence.com" className="nav-link">
                    support@triangleintelligence.com
                  </a>
                </div>
                <div>
                  <h4 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Sales Inquiries</h4>
                  <a href="mailto:sales@triangleintelligence.com" className="nav-link">
                    sales@triangleintelligence.com
                  </a>
                </div>
                <div>
                  <h4 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Legal & Privacy</h4>
                  <a href="mailto:legal@triangleintelligence.com" className="nav-link">
                    legal@triangleintelligence.com
                  </a>
                </div>
              </div>
            </div>

            {/* Back to Home */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <Link href="/" className="btn-secondary">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
