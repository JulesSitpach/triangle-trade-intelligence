/**
 * Triangle Intelligence Platform - Terms of Service
 * Copyright © 2025 Triangle Intelligence Platform. All rights reserved.
 *
 * Last Updated: November 17, 2025
 */

import Head from 'next/head';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms of Service | Triangle Intelligence Platform</title>
        <meta name="description" content="Terms of Service for Triangle Intelligence Platform USMCA certificate generation" />
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
            <h1 className="form-section-title">Terms of Service</h1>
            <p className="text-body" style={{ marginBottom: '1rem' }}>
              <strong>Last Updated:</strong> November 17, 2025
            </p>
            <p className="text-body" style={{ marginBottom: '2rem' }}>
              Welcome to Triangle Intelligence Platform. By accessing or using our platform, you agree to be bound by these Terms of Service.
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>1. Service Description</h2>
              <p className="text-body">
                Triangle Intelligence Platform provides a <strong>self-serve SaaS platform</strong> for:
              </p>
              <ul className="text-body" style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li>USMCA (United States-Mexico-Canada Agreement) certificate generation</li>
                <li>AI-powered HS code classification</li>
                <li>Tariff rate analysis and savings calculations</li>
                <li>Regional Value Content (RVC) calculations</li>
                <li>Trade policy alert monitoring</li>
              </ul>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>2. User Responsibilities</h2>
              <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                <div className="alert-content">
                  <div className="alert-title">CRITICAL: You Are Responsible for Data Accuracy</div>
                  <div className="text-body">
                    This platform provides calculation tools only. You are solely responsible for verifying all data accuracy before submission to customs authorities.
                  </div>
                </div>
              </div>
              <p className="text-body">By using this platform, you agree that:</p>
              <ul className="text-body" style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li><strong>You own all data you submit</strong> (company information, component specifications, origins)</li>
                <li><strong>You must verify all outputs</strong> before using certificates for customs compliance</li>
                <li><strong>You assume full liability</strong> for any customs audit outcomes, penalties, or duties</li>
                <li><strong>You acknowledge this is not legal or professional advice</strong></li>
                <li><strong>You will consult licensed customs brokers</strong> when required for official certifications</li>
              </ul>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>3. Intellectual Property Rights</h2>
              <p className="text-body" style={{ marginBottom: '1rem' }}>
                <strong>What We Own (Proprietary):</strong>
              </p>
              <ul className="text-body" style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                <li>AI-powered USMCA qualification analysis methodology</li>
                <li>Tariff volatility classification system (3-tier system)</li>
                <li>Business intelligence framework and strategic roadmap algorithms</li>
                <li>Database enrichment layers (volatility tiers, policy overlays, USMCA mappings)</li>
                <li>Platform user interface, design, and source code</li>
                <li>AI prompts and classification logic</li>
              </ul>
              <p className="text-body" style={{ marginBottom: '1rem' }}>
                <strong>What You Own:</strong>
              </p>
              <ul className="text-body" style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                <li>Company information you submit</li>
                <li>Component specifications and origin data you provide</li>
                <li>Generated certificates (as official compliance documents)</li>
              </ul>
              <p className="text-body">
                <strong>Public Domain:</strong> Base HS codes and USITC tariff rate data are public domain information.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>4. Prohibited Uses</h2>
              <p className="text-body">You may NOT:</p>
              <ul className="text-body" style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li>Reverse engineer, decompile, or disassemble the platform's AI classification system</li>
                <li>Extract, scrape, or bulk download the HS code database or enrichment data</li>
                <li>Copy, reproduce, or redistribute our analysis methodology or algorithms</li>
                <li>Share subscription access across multiple companies or resell platform access</li>
                <li>Use automated tools to access the platform without written permission</li>
                <li>Attempt to circumvent subscription limits or payment requirements</li>
                <li>Use the platform for any illegal purpose or in violation of trade laws</li>
              </ul>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>5. Subscription and Payment</h2>
              <ul className="text-body" style={{ marginLeft: '1.5rem' }}>
                <li><strong>Billing:</strong> Subscriptions are billed monthly via Stripe</li>
                <li><strong>Usage Limits:</strong> Each tier has monthly analysis limits (Trial: 1, Starter: 15, Professional: 100, Premium: 500)</li>
                <li><strong>Overages:</strong> Additional analyses beyond your tier limit require upgrade or wait until next billing cycle</li>
                <li><strong>Refunds:</strong> No refunds for unused analyses within a billing period</li>
                <li><strong>Cancellation:</strong> You may cancel at any time; access continues until end of billing period</li>
              </ul>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>6. Certificate Usage and Liability</h2>
              <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                <div className="alert-content">
                  <div className="alert-title">IMPORTANT: Certificate Liability</div>
                  <div className="text-body">
                    USMCA certificates generated by this platform are official CBP compliance documents. You are solely responsible for their accuracy and any consequences of their use.
                  </div>
                </div>
              </div>
              <ul className="text-body" style={{ marginLeft: '1.5rem' }}>
                <li>Certificates must be retained for 5 years per CBP requirements</li>
                <li>You must verify all fields before submission to customs authorities</li>
                <li>Platform is not liable for customs audits, penalties, duties, or legal consequences</li>
                <li>Trial tier certificates include watermarks and are for evaluation only</li>
              </ul>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>7. Disclaimers and Limitations</h2>
              <p className="text-body" style={{ marginBottom: '1rem' }}>
                <strong>NOT PROFESSIONAL ADVICE:</strong> This platform does not provide legal, tax, customs brokerage, or professional consulting services. All analysis is for informational purposes only.
              </p>
              <p className="text-body" style={{ marginBottom: '1rem' }}>
                <strong>NO WARRANTY:</strong> The platform is provided "AS IS" without warranty of any kind. We do not guarantee:
              </p>
              <ul className="text-body" style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                <li>100% accuracy of tariff rates (rates change frequently per USTR policy)</li>
                <li>Correctness of AI-generated HS code classifications (user must verify)</li>
                <li>Continuous, uninterrupted service availability</li>
                <li>That results will meet your specific compliance requirements</li>
              </ul>
              <p className="text-body">
                <strong>LIMITATION OF LIABILITY:</strong> Triangle Intelligence Platform shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities arising from use of the platform.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>8. Data Retention</h2>
              <ul className="text-body" style={{ marginLeft: '1.5rem' }}>
                <li><strong>Workflow data:</strong> Stored until you delete it or close your account</li>
                <li><strong>Completed certificates:</strong> Retained for 5 years (CBP audit period requirement)</li>
                <li><strong>Usage analytics:</strong> Aggregated and anonymized for platform improvement</li>
                <li><strong>Account data:</strong> Retained as long as your account is active</li>
              </ul>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>9. Termination</h2>
              <p className="text-body">
                We reserve the right to suspend or terminate your account if you violate these Terms. You may close your account at any time. Upon termination, your access to the platform ceases immediately, though we may retain data as required by law or for compliance purposes.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>10. Changes to Terms</h2>
              <p className="text-body">
                We may update these Terms from time to time. Continued use of the platform after changes constitutes acceptance of the new Terms. We will notify users of material changes via email or platform notification.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>11. Governing Law</h2>
              <p className="text-body">
                These Terms are governed by the laws of the United States. Any disputes shall be resolved in accordance with applicable U.S. federal and state law.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>12. Contact Information</h2>
              <p className="text-body">
                For questions about these Terms of Service, contact us at:<br />
                <strong>Email:</strong> legal@triangleintelligence.com<br />
                <strong>Platform:</strong> Triangle Intelligence Platform
              </p>
            </div>

            <div className="alert alert-info">
              <div className="alert-content">
                <div className="alert-title">Agreement</div>
                <div className="text-body">
                  By creating an account or using the Triangle Intelligence Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <Link href="/signup" className="btn-primary" style={{ marginRight: '1rem' }}>
                Create Account
              </Link>
              <Link href="/privacy-policy" className="btn-secondary">
                Privacy Policy
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
