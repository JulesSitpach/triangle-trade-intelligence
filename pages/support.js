import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import TriangleLayout from '../components/TriangleLayout';

export default function Support() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'support',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Create Gmail subject with label
    const labelPrefix = `[${formData.category.toUpperCase()}]`;
    const gmailSubject = `${labelPrefix} ${formData.subject}`;

    // Create mailto link with pre-filled content
    const mailtoBody = `Name: ${formData.name}%0D%0AEmail: ${formData.email}%0D%0ACategory: ${formData.category}%0D%0A%0D%0AMessage:%0D%0A${encodeURIComponent(formData.message)}`;
    const mailtoLink = `mailto:triangleintel@gmail.com?subject=${encodeURIComponent(gmailSubject)}&body=${mailtoBody}`;

    // Open user's email client
    window.location.href = mailtoLink;

    setSubmitted(true);
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Support | Triangle Trade Intelligence</title>
        <meta name="description" content="Get help with Triangle Trade Intelligence" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <TriangleLayout>
        <div className="main-content">
          <div className="container-app">
            <div className="content-card" style={{ maxWidth: '800px', margin: '50px auto' }}>
              <h1 className="card-title">Support & Help</h1>

              {!submitted ? (
                <>
                  <div style={{ marginBottom: '40px' }}>
                    <h2 className="content-card-title">📧 Contact Us</h2>
                    <p className="text-body" style={{ marginBottom: '20px' }}>
                      Fill out the form below and we'll get back to you within 24 hours during business days.
                    </p>

                    <form onSubmit={handleSubmit}>
                      <div className="form-group">
                        <label htmlFor="name" className="form-label">Your Name *</label>
                        <input
                          type="text"
                          id="name"
                          className="form-input"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="John Doe"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="email" className="form-label">Your Email *</label>
                        <input
                          type="email"
                          id="email"
                          className="form-input"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          placeholder="john@company.com"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="category" className="form-label">Category *</label>
                        <select
                          id="category"
                          className="form-input"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          required
                        >
                          <option value="support">Technical Support</option>
                          <option value="sales">Sales Inquiry</option>
                          <option value="subscription">Subscription/Billing</option>
                          <option value="services">Professional Services</option>
                        </select>
                        <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '5px' }}>
                          This helps us route your message to the right team
                        </p>
                      </div>

                      <div className="form-group">
                        <label htmlFor="subject" className="form-label">Subject *</label>
                        <input
                          type="text"
                          id="subject"
                          className="form-input"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          required
                          placeholder="Brief description of your issue"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="message" className="form-label">Message *</label>
                        <textarea
                          id="message"
                          className="form-input"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          required
                          rows="6"
                          placeholder="Please provide details about your question or issue..."
                          style={{ minHeight: '150px' }}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: '100%' }}
                      >
                        {loading ? 'Opening Email Client...' : 'Send Message'}
                      </button>

                      <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '10px', textAlign: 'center' }}>
                        Or email us directly at{' '}
                        <a
                          href="mailto:triangleintel@gmail.com?subject=[SUPPORT] General Inquiry"
                          style={{ color: '#2563EB' }}
                        >
                          triangleintel@gmail.com
                        </a>
                      </p>
                    </form>
                  </div>
                </>
              ) : (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '8px',
                  marginBottom: '40px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>📧</div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: '#1E40AF' }}>
                    Email Client Opened!
                  </h2>
                  <p className="text-body" style={{ marginBottom: '15px' }}>
                    Your default email client should have opened with your message pre-filled.
                  </p>
                  <p className="text-body" style={{ marginBottom: '20px' }}>
                    If it didn't open, please email us directly at{' '}
                    <a href="mailto:triangleintel@gmail.com" style={{ color: '#2563EB', fontWeight: 'bold' }}>
                      triangleintel@gmail.com
                    </a>
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="btn-secondary"
                  >
                    ← Send Another Message
                  </button>
                </div>
              )}

              <div style={{ marginBottom: '40px' }}>
                <h2 className="content-card-title">🔧 Common Issues</h2>

                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                    Can't log in?
                  </h3>
                  <p className="text-body">
                    Try the <Link href="/forgot-password" style={{ color: '#2563EB' }}>password reset</Link> page.
                    If issues persist, contact us at triangleintel@gmail.com
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                    Subscription or billing questions?
                  </h3>
                  <p className="text-body">
                    Visit your <Link href="/dashboard" style={{ color: '#2563EB' }}>dashboard</Link> to manage
                    your subscription, or email us for billing assistance.
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                    Need help with USMCA qualification?
                  </h3>
                  <p className="text-body">
                    Our platform provides automated analysis, but for complex cases or legal advice,
                    please consult a licensed customs broker or trade attorney.
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '40px' }}>
                <h2 className="content-card-title">📚 Resources</h2>
                <ul style={{ paddingLeft: '20px' }}>
                  <li className="text-body" style={{ marginBottom: '10px' }}>
                    <Link href="/usmca-workflow" style={{ color: '#2563EB' }}>Start a new USMCA analysis</Link>
                  </li>
                  <li className="text-body" style={{ marginBottom: '10px' }}>
                    <Link href="/pricing" style={{ color: '#2563EB' }}>View subscription plans</Link>
                  </li>
                  <li className="text-body" style={{ marginBottom: '10px' }}>
                    <Link href="/dashboard" style={{ color: '#2563EB' }}>Access your dashboard</Link>
                  </li>
                </ul>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#1E40AF' }}>
                  💡 Tip: User Responsibility
                </h3>
                <p className="text-body" style={{ margin: 0 }}>
                  Triangle provides tools to help you analyze USMCA compliance, but you are responsible
                  for verifying the accuracy of all data submitted. Always review your certificates
                  before using them for customs filings.
                </p>
              </div>

              <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <Link href="/" className="btn-secondary">
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </TriangleLayout>
    </>
  );
}
