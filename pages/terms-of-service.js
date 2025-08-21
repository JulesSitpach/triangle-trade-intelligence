/**
 * 📄 TERMS OF SERVICE
 * Legal protection for Triangle Intelligence Platform
 * Based on standard SaaS terms with trade intelligence specifics
 */

import Head from 'next/head'
import Link from 'next/link'
import LegalFooter from '../components/LegalFooter'

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms of Service - Triangle Intelligence Platform</title>
        <meta name="description" content="Terms of Service for Canada-Mexico USMCA Intelligence Platform" />
      </Head>

      <div className="terms-container">
        <header className="terms-header">
          <div className="header-content">
            <h1>🏛️ Terms of Service</h1>
            <p className="last-updated">Last Updated: August 10, 2025</p>
          </div>
        </header>

        <main className="terms-content">
          <div className="terms-body">
            
            <section className="terms-section">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing and using the Triangle Intelligence Platform (&quot;Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="terms-section">
              <h2>2. Service Description</h2>
              <p>
                Triangle Intelligence Platform provides trade intelligence, USMCA advantage calculations, and specialist marketplace services for Canada-Mexico trade optimization. The platform is currently in <strong>BETA</strong> status.
              </p>
              <ul>
                <li>Trade route analysis and calculations</li>
                <li>USMCA advantage estimations</li>
                <li>Specialist network connections</li>
                <li>Institutional learning and pattern analysis</li>
                <li>Government data integration and analysis</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>3. Beta Disclaimer</h2>
              <div className="beta-warning">
                <p><strong>IMPORTANT BETA NOTICE:</strong></p>
                <ul>
                  <li>This platform is in BETA/Preview status</li>
                  <li>Calculations are estimates for demonstration purposes</li>
                  <li>Data may not reflect current market conditions</li>
                  <li>Service availability and features may change</li>
                  <li>No warranty is provided for accuracy or completeness</li>
                </ul>
              </div>
            </section>

            <section className="terms-section">
              <h2>4. User Responsibilities</h2>
              <p>You agree to:</p>
              <ul>
                <li>Provide accurate information when using our services</li>
                <li>Use the platform for lawful purposes only</li>
                <li>Not attempt to reverse engineer or compromise our systems</li>
                <li>Respect intellectual property rights</li>
                <li>Consult qualified professionals before making business decisions</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>5. Limitations of Liability</h2>
              <p>
                <strong>IMPORTANT:</strong> Triangle Intelligence Platform provides estimates and analysis for informational purposes only. We are not liable for:
              </p>
              <ul>
                <li>Business decisions made based on our calculations</li>
                <li>Actual trade outcomes or savings realized</li>
                <li>Third-party specialist performance or results</li>
                <li>Government policy changes affecting trade benefits</li>
                <li>Market condition changes or economic factors</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>6. Intellectual Property</h2>
              <p>
                All content, features, and functionality of the Triangle Intelligence Platform, including but not limited to algorithms, calculations, design, and institutional learning patterns, are owned by Triangle Intelligence Platform and are protected by copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="terms-section">
              <h2>7. Privacy and Data Collection</h2>
              <p>
                Your privacy is important to us. Please review our <Link href="/privacy-policy">Privacy Policy</Link>, which also governs your use of the Service, to understand our practices.
              </p>
            </section>

            <section className="terms-section">
              <h2>8. Specialist Marketplace Terms</h2>
              <p>For users of our specialist marketplace:</p>
              <ul>
                <li>Platform commission: 15% of specialist fees</li>
                <li>Specialist payout: 85% of fees collected</li>
                <li>Lead qualification based on proprietary scoring</li>
                <li>No guarantee of lead conversion or results</li>
                <li>Specialists are independent contractors</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>9. Government Data and Compliance</h2>
              <p>
                Our platform integrates official government data from Canada and Mexico. However:
              </p>
              <ul>
                <li>We are not affiliated with any government agency</li>
                <li>Government data may be subject to updates or corrections</li>
                <li>USMCA benefits depend on compliance with current regulations</li>
                <li>Users must verify current trade requirements independently</li>
              </ul>
            </section>

            <section className="terms-section">
              <h2>10. Termination</h2>
              <p>
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
              </p>
            </section>

            <section className="terms-section">
              <h2>11. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section className="terms-section">
              <h2>12. Contact Information</h2>
              <p>
                Questions about the Terms of Service should be sent to us at:
                <br />
                <strong>Triangle Intelligence Platform</strong>
                <br />
                Email: legal@triangleintelligence.com
              </p>
            </section>

            <section className="terms-section signature">
              <p>
                <strong>Triangle Intelligence Platform</strong><br />
                Canada-Mexico USMCA Trade Intelligence<br />
                © 2025 All Rights Reserved
              </p>
            </section>

          </div>
        </main>

        <LegalFooter showBeta={true} />
      </div>

      <style jsx>{`
        .terms-container {
          min-height: 100vh;
          background: #f8fafc;
        }

        .terms-header {
          background: linear-gradient(135deg, #dc2626 0%, #ffffff 25%, #16a34a 75%, #dc2626 100%);
          color: white;
          padding: 3rem 0;
          text-align: center;
        }

        .header-content h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }

        .last-updated {
          font-size: 1.1rem;
          opacity: 0.9;
          font-weight: 500;
        }

        .terms-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .terms-body {
          background: white;
          padding: 3rem;
          border-radius: 1rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .terms-section {
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .terms-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .terms-section h2 {
          color: #dc2626;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .terms-section p {
          color: #374151;
          line-height: 1.7;
          margin-bottom: 1rem;
        }

        .terms-section ul {
          color: #374151;
          line-height: 1.7;
          padding-left: 2rem;
          margin-bottom: 1rem;
        }

        .terms-section li {
          margin-bottom: 0.5rem;
        }

        .beta-warning {
          background: #fef2f2;
          border: 2px solid #fecaca;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin: 1rem 0;
        }

        .beta-warning p {
          color: #dc2626;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .beta-warning ul {
          color: #991b1b;
        }

        .terms-section a {
          color: #dc2626;
          text-decoration: none;
          font-weight: 600;
        }

        .terms-section a:hover {
          text-decoration: underline;
        }

        .signature {
          text-align: center;
          background: #f9fafb;
          padding: 2rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .signature p {
          color: #6b7280;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .terms-content {
            padding: 2rem 1rem;
          }

          .terms-body {
            padding: 2rem;
          }

          .header-content h1 {
            font-size: 2rem;
          }

          .terms-section h2 {
            font-size: 1.3rem;
          }
        }
      `}</style>
    </>
  )
}