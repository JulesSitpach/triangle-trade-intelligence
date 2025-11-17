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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Submit to contact form API (which logs to database and sends to triangleintel@gmail.com)
      const response = await fetch('/api/contact-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: '', // Optional
          phone: '', // Optional
          message: `[${formData.category.toUpperCase()}] ${formData.subject}\n\n${formData.message}`,
          industry: formData.category,
          lead_source: 'support_form'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        // Reset form
        setFormData({
          name: '',
          email: '',
          category: 'support',
          subject: '',
          message: ''
        });
      } else {
        alert(`Error: ${data.message || 'Failed to send message. Please try again or email us directly.'}`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Failed to send message. Please try again or email us directly at triangleintel@gmail.com');
    } finally {
      setLoading(false);
    }
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
          <div className="container-app" style={{maxWidth: '800px'}}>
            <div className="content-card">
              <h1 className="card-title">Support & Help</h1>

              {!submitted ? (
                <>
                  <div className="element-spacing">
                    <h2 className="content-card-title">📧 Contact Us</h2>
                    <p className="text-body">
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
                          <option value="feedback">Feature Request/Feedback</option>
                        </select>
                        <p className="form-help">
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
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                      >
                        {loading ? 'Sending...' : 'Send Message'}
                      </button>

                      <p className="form-help text-center">
                        Or email us directly at{' '}
                        <a
                          href="mailto:triangleintel@gmail.com?subject=[SUPPORT] General Inquiry"
                          className="content-card-link"
                        >
                          triangleintel@gmail.com
                        </a>
                      </p>
                    </form>
                  </div>
                </>
              ) : (
                <div className="alert-info text-center">
                  <div className="badge badge-success">✅</div>
                  <h2 className="content-card-title">
                    Message Sent!
                  </h2>
                  <p className="text-body">
                    Your message has been sent to our support team at triangleintel@gmail.com
                  </p>
                  <p className="text-body">
                    We'll get back to you within 24 hours during business days.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="btn-secondary"
                  >
                    ← Send Another Message
                  </button>
                </div>
              )}

              <div className="element-spacing">
                <h2 className="content-card-title">🔧 Common Issues</h2>

                <div className="element-spacing">
                  <h3 className="form-section-title">
                    Can't log in?
                  </h3>
                  <p className="text-body">
                    Try the <Link href="/forgot-password" className="content-card-link">password reset</Link> page.
                    If issues persist, contact us at triangleintel@gmail.com
                  </p>
                </div>

                <div className="element-spacing">
                  <h3 className="form-section-title">
                    Subscription or billing questions?
                  </h3>
                  <p className="text-body">
                    Visit your <Link href="/dashboard" className="content-card-link">dashboard</Link> to manage
                    your subscription, or email us for billing assistance.
                  </p>
                </div>

                <div className="element-spacing">
                  <h3 className="form-section-title">
                    Need help with USMCA qualification?
                  </h3>
                  <p className="text-body">
                    Our platform provides automated analysis, but for complex cases or legal advice,
                    please consult a licensed customs broker or trade attorney.
                  </p>
                </div>
              </div>

              <div className="element-spacing">
                <h2 className="content-card-title">📚 Resources</h2>
                <ul className="bullet-list">
                  <li className="text-body">
                    <Link href="/usmca-workflow" className="content-card-link">Start a new USMCA analysis</Link>
                  </li>
                  <li className="text-body">
                    <Link href="/pricing" className="content-card-link">View subscription plans</Link>
                  </li>
                  <li className="text-body">
                    <Link href="/dashboard" className="content-card-link">Access your dashboard</Link>
                  </li>
                </ul>
              </div>

              <div className="alert-info">
                <h3 className="form-section-title">
                  💡 Tip: User Responsibility
                </h3>
                <p className="text-body">
                  Triangle provides tools to help you analyze USMCA compliance, but you are responsible
                  for verifying the accuracy of all data submitted. Always review your certificates
                  before using them for customs filings.
                </p>
              </div>

              <div className="element-spacing text-center">
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
