/**
 * Triangle Intelligence Platform - Privacy Policy
 * Copyright © 2025 Triangle Intelligence Platform. All rights reserved.
 *
 * Last Updated: November 17, 2025
 */

import Head from 'next/head';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Triangle Intelligence Platform</title>
        <meta name="description" content="Privacy Policy for Triangle Intelligence Platform USMCA certificate generation" />
      </Head>

      <div className="auth-container">
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
          {/* Logo - clickable to return home */}
          <div className="text-center" style={{marginBottom: '2rem'}}>
            <Link href="/" className="nav-logo-link">
              <div className="nav-logo-icon">T</div>
            </Link>
          </div>

          <div className="form-section">
            <h1 className="form-section-title">Privacy Policy</h1>
            <p className="text-body" style={{ marginBottom: '1rem' }}>
              <strong>Last Updated:</strong> November 17, 2025
            </p>
            <p className="text-body" style={{ marginBottom: '2rem' }}>
              Triangle Intelligence Platform ("we," "our," or "us") respects your privacy and is committed to protecting your personal and business data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>1. Information We Collect</h2>

              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', marginTop: '1rem' }}>Account Information</h3>
              <ul className="text-body" style={{ marginLeft: '1.5rem' }}>
                <li>Email address (for login and notifications)</li>
                <li>Password (encrypted, never stored in plain text)</li>
                <li>Subscription tier and billing information</li>
                <li>Account creation date and usage history</li>
              </ul>

              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', marginTop: '1rem' }}>Business Data You Provide</h3>
              <ul className="text-body" style={{ marginLeft: '1.5rem' }}>
                <li>Company name, address, and tax identification numbers</li>
                <li>Product component descriptions and specifications</li>
                <li>HS codes and tariff classifications</li>
                <li>Origin countries and manufacturing locations</li>
                <li>Trade volumes and supplier information</li>
                <li>Regional Value Content (RVC) calculations</li>
              </ul>

              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', marginTop: '1rem' }}>Automatically Collected Data</h3>
              <ul className="text-body" style={{ marginLeft: '1.5rem' }}>
                <li>Browser type and version</li>
                <li>IP address (for security and fraud prevention)</li>
                <li>Pages visited and features used</li>
                <li>Session duration and timestamps</li>
                <li>Error logs for debugging purposes</li>
              </ul>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>2. How We Use Your Information</h2>
              <ul className="text-body" style={{ marginLeft: '1.5rem' }}>
                <li><strong>USMCA Analysis:</strong> Processing your component data to calculate qualification status and tariff savings</li>
                <li><strong>Certificate Generation:</strong> Populating USMCA Form D certificates with your business information</li>
                <li><strong>Policy Alerts:</strong> Matching your products to relevant Section 301/232 tariff policy changes</li>
                <li><strong>Account Management:</strong> Tracking subscription usage, billing, and authentication</li>
                <li><strong>Platform Improvement:</strong> Analyzing aggregate usage patterns to improve features</li>
                <li><strong>Security:</strong> Detecting and preventing fraudulent or unauthorized access</li>
                <li><strong>Legal Compliance:</strong> Meeting regulatory requirements and responding to legal requests</li>
              </ul>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>3. What We DO NOT Do</h2>
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                <div className="alert-content">
                  <div className="alert-title">Your Data is Protected</div>
                  <div className="text-body">
                    We respect your business confidentiality and competitive information.
                  </div>
                </div>
              </div>
              <ul className="text-body" style={{ marginLeft: '1.5rem' }}>
                <li><strong>We DO NOT sell your data</strong> to third parties</li>
                <li><strong>We DO NOT share</strong> your component specifications with competitors</li>
                <li><strong>We DO NOT use</strong> your business data to train public AI models</li>
                <li><strong>We DO NOT provide</strong> your information to marketing companies</li>
                <li><strong>We DO NOT disclose</strong> your supplier relationships to anyone</li>
              </ul>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>4. Data Retention</h2>
              <ul className="text-body" style={{ marginLeft: '1.5rem' }}>
                <li><strong>Workflow Sessions:</strong> Retained until you delete them or close your account</li>
                <li><strong>Completed Certificates:</strong> Retained for <strong>5 years</strong> to comply with CBP audit requirements</li>
                <li><strong>Account Information:</strong> Retained as long as your account is active</li>
                <li><strong>Usage Analytics:</strong> Retained in aggregated, anonymized form indefinitely</li>
                <li><strong>Billing Records:</strong> Retained as required by tax and financial regulations</li>
              </ul>
              <p className="text-body" style={{ marginTop: '1rem' }}>
                <strong>Why 5-Year Retention?</strong> U.S. Customs and Border Protection (CBP) requires USMCA certificates to be kept for 5 years from the date of importation for audit purposes. We retain your certificates to help you meet this compliance requirement.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>5. Data Security</h2>
              <p className="text-body" style={{ marginBottom: '1rem' }}>We implement industry-standard security measures:</p>
              <ul className="text-body" style={{ marginLeft: '1.5rem' }}>
                <li><strong>Encryption:</strong> All data transmitted via HTTPS/TLS encryption</li>
                <li><strong>Password Security:</strong> Passwords are hashed using bcrypt (never stored in plain text)</li>
                <li><strong>Database Security:</strong> Supabase PostgreSQL with row-level security policies</li>
                <li><strong>Authentication:</strong> Secure JWT tokens with httpOnly cookies</li>
                <li><strong>Access Controls:</strong> Role-based permissions and audit logging</li>
                <li><strong>Infrastructure:</strong> Hosted on Vercel with enterprise-grade security</li>
              </ul>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>6. Third-Party Services</h2>
              <p className="text-body" style={{ marginBottom: '1rem' }}>We use the following third-party services:</p>
              <ul className="text-body" style={{ marginLeft: '1.5rem' }}>
                <li><strong>Supabase:</strong> Database hosting (your data is stored here securely)</li>
                <li><strong>Vercel:</strong> Application hosting and deployment</li>
                <li><strong>Stripe:</strong> Payment processing (we never see your full credit card number)</li>
                <li><strong>OpenRouter/Anthropic:</strong> AI services for HS code classification (data processed but not stored by them)</li>
              </ul>
              <p className="text-body" style={{ marginTop: '1rem' }}>
                Each service has its own privacy policy and security certifications. We only share the minimum data necessary for them to provide their services.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>7. Your Rights</h2>
              <p className="text-body" style={{ marginBottom: '1rem' }}>You have the right to:</p>
              <ul className="text-body" style={{ marginLeft: '1.5rem' }}>
                <li><strong>Access:</strong> Request a copy of all data we have about you</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data (subject to 5-year certificate retention requirement)</li>
                <li><strong>Portability:</strong> Export your workflow data in standard formats</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails (transactional emails required for service)</li>
              </ul>
              <p className="text-body" style={{ marginTop: '1rem' }}>
                To exercise these rights, contact us at privacy@triangleintelligence.com
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>8. Cookies and Tracking</h2>
              <p className="text-body" style={{ marginBottom: '1rem' }}>We use cookies for:</p>
              <ul className="text-body" style={{ marginLeft: '1.5rem' }}>
                <li><strong>Essential Cookies:</strong> Session management and authentication (required for platform to work)</li>
                <li><strong>Functional Cookies:</strong> Remembering your preferences and workflow progress</li>
                <li><strong>Analytics Cookies:</strong> Understanding how users interact with the platform (aggregated data only)</li>
              </ul>
              <p className="text-body" style={{ marginTop: '1rem' }}>
                We do NOT use third-party advertising cookies or tracking pixels.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>9. Legal Disclosures</h2>
              <p className="text-body">
                We may disclose your information if required by law, such as:
              </p>
              <ul className="text-body" style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li>Response to valid subpoenas, court orders, or legal processes</li>
                <li>Cooperation with law enforcement investigations</li>
                <li>Protection of our rights, property, or safety</li>
                <li>Compliance with U.S. customs and trade regulations</li>
              </ul>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>10. International Users</h2>
              <p className="text-body">
                This platform is designed for USMCA trade (United States, Mexico, Canada). If you access the platform from outside these countries, your data will be transferred to and processed in the United States. By using the platform, you consent to this transfer.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>11. Children's Privacy</h2>
              <p className="text-body">
                This platform is intended for business use by adults. We do not knowingly collect information from children under 18. If you believe a child has provided us with personal information, contact us immediately.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>12. Changes to This Policy</h2>
              <p className="text-body">
                We may update this Privacy Policy from time to time. We will notify you of material changes via email or platform notification. Continued use after changes constitutes acceptance of the updated policy.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>13. Contact Us</h2>
              <p className="text-body">
                For privacy-related questions or to exercise your data rights:<br />
                <strong>Email:</strong> privacy@triangleintelligence.com<br />
                <strong>Subject Line:</strong> Privacy Request - [Your Request Type]
              </p>
            </div>

            <div className="alert alert-info">
              <div className="alert-content">
                <div className="alert-title">Your Privacy Matters</div>
                <div className="text-body">
                  We understand that your trade data contains sensitive business intelligence. We are committed to protecting your information and never sharing it with competitors or third parties for their own purposes.
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <Link href="/signup" className="btn-primary" style={{ marginRight: '1rem' }}>
                Create Account
              </Link>
              <Link href="/terms-of-service" className="btn-secondary">
                Terms of Service
              </Link>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem', color: '#666' }}>
            <p>© 2025 Triangle Intelligence Platform. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
}
