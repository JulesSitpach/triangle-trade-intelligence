/**
 * 🔒 PRIVACY POLICY
 * Data protection and privacy compliance
 * GDPR/CCPA friendly privacy policy for trade intelligence platform
 */

import Head from 'next/head'
import LegalFooter from '../components/LegalFooter'

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Triangle Intelligence Platform</title>
        <meta name="description" content="Privacy Policy for Canada-Mexico USMCA Intelligence Platform" />
      </Head>

      <div className="privacy-container">
        <header className="privacy-header">
          <div className="header-content">
            <h1>🔒 Privacy Policy</h1>
            <p className="last-updated">Last Updated: August 10, 2025</p>
          </div>
        </header>

        <main className="privacy-content">
          <div className="privacy-body">
            
            <section className="privacy-section">
              <h2>1. Information We Collect</h2>
              
              <h3>Business Information</h3>
              <p>When you use our USMCA calculator and platform, we may collect:</p>
              <ul>
                <li>Company name and business type</li>
                <li>Import volume and supplier information</li>
                <li>Geographic location (state, city, zip code)</li>
                <li>Product descriptions and HS codes</li>
                <li>Trade route preferences and timeline requirements</li>
              </ul>

              <h3>Technical Information</h3>
              <ul>
                <li>IP address and browser information</li>
                <li>Usage patterns and platform interactions</li>
                <li>Session data and calculation results</li>
                <li>Performance metrics and error logs</li>
              </ul>

              <h3>Communication Data</h3>
              <ul>
                <li>Contact information when provided</li>
                <li>Messages sent through our platform</li>
                <li>Specialist marketplace interactions</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>2. How We Use Your Information</h2>
              
              <h3>Primary Uses</h3>
              <ul>
                <li><strong>Trade Analysis:</strong> Calculate USMCA advantages and trade routes</li>
                <li><strong>Institutional Learning:</strong> Improve platform intelligence through pattern analysis</li>
                <li><strong>Specialist Matching:</strong> Connect qualified leads with appropriate specialists</li>
                <li><strong>Service Improvement:</strong> Enhance platform features and accuracy</li>
              </ul>

              <h3>Secondary Uses</h3>
              <ul>
                <li>Generate anonymized industry insights and trends</li>
                <li>Improve government data integration and analysis</li>
                <li>Optimize platform performance and user experience</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>3. Information Sharing</h2>
              
              <div className="sharing-notice">
                <p><strong>We DO NOT sell your personal information.</strong></p>
              </div>

              <h3>Limited Sharing Scenarios</h3>
              <ul>
                <li><strong>Qualified Specialists:</strong> Business contact information shared with claimed specialists (with consent)</li>
                <li><strong>Government Data:</strong> Aggregated, anonymized data may be shared with trade agencies for research</li>
                <li><strong>Service Providers:</strong> Trusted third parties who assist in platform operations</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>

              <h3>Anonymized Data</h3>
              <p>
                We may share aggregated, anonymized insights about:
              </p>
              <ul>
                <li>Industry adoption rates of USMCA benefits</li>
                <li>Popular trade routes and product categories</li>
                <li>Market trends and optimization opportunities</li>
                <li>Platform usage statistics and performance metrics</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>4. Data Storage and Security</h2>
              
              <h3>Storage Location</h3>
              <p>
                Your data is stored securely using Supabase cloud infrastructure with encryption in transit and at rest. Data centers are located in North America for optimal performance and compliance.
              </p>

              <h3>Security Measures</h3>
              <ul>
                <li>Industry-standard encryption protocols</li>
                <li>Secure API endpoints with authentication</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and audit logging</li>
                <li>Data backup and disaster recovery procedures</li>
              </ul>

              <h3>Retention Period</h3>
              <ul>
                <li><strong>Session Data:</strong> 2 years for institutional learning</li>
                <li><strong>Business Information:</strong> Until deletion requested</li>
                <li><strong>Technical Logs:</strong> 90 days for performance monitoring</li>
                <li><strong>Anonymized Insights:</strong> Indefinitely for research</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>5. Your Privacy Rights</h2>
              
              <h3>Access and Control</h3>
              <p>You have the right to:</p>
              <ul>
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Opt-out:</strong> Withdraw consent for data processing</li>
              </ul>

              <h3>California Residents (CCPA)</h3>
              <p>
                California residents have additional rights under the California Consumer Privacy Act:
              </p>
              <ul>
                <li>Right to know what personal information is collected</li>
                <li>Right to delete personal information</li>
                <li>Right to opt-out of sale (we don't sell data)</li>
                <li>Right to non-discrimination for exercising privacy rights</li>
              </ul>

              <h3>European Residents (GDPR)</h3>
              <p>
                European residents have rights under the General Data Protection Regulation:
              </p>
              <ul>
                <li>Legal basis for processing: Legitimate business interest</li>
                <li>Right to object to processing</li>
                <li>Right to data portability</li>
                <li>Right to lodge complaints with supervisory authorities</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>6. Cookies and Tracking</h2>
              
              <h3>Essential Cookies</h3>
              <ul>
                <li>Session management and user authentication</li>
                <li>Platform functionality and preferences</li>
                <li>Security and fraud prevention</li>
              </ul>

              <h3>Analytics Cookies</h3>
              <ul>
                <li>Platform usage and performance monitoring</li>
                <li>Feature adoption and user experience improvement</li>
                <li>Error tracking and system optimization</li>
              </ul>

              <p>
                You can control cookie settings through your browser preferences. Disabling essential cookies may affect platform functionality.
              </p>
            </section>

            <section className="privacy-section">
              <h2>7. Government Data Integration</h2>
              
              <p>
                Our platform integrates official government data from:
              </p>
              <ul>
                <li><strong>Canada:</strong> Open Government Portal, Statistics Canada</li>
                <li><strong>Mexico:</strong> DataMexico, Ministry of Economy</li>
                <li><strong>International:</strong> UN Comtrade database</li>
              </ul>

              <p>
                This integration is governed by respective government data use policies and our platform's legitimate business interests in providing trade intelligence services.
              </p>
            </section>

            <section className="privacy-section">
              <h2>8. Third-Party Services</h2>
              
              <p>
                Our platform may integrate with third-party services for enhanced functionality:
              </p>
              <ul>
                <li><strong>Supabase:</strong> Database and authentication services</li>
                <li><strong>Vercel/Next.js:</strong> Platform hosting and deployment</li>
                <li><strong>Government APIs:</strong> Official trade data sources</li>
              </ul>

              <p>
                These services have their own privacy policies and data handling practices.
              </p>
            </section>

            <section className="privacy-section">
              <h2>9. Data Breach Notification</h2>
              
              <p>
                In the event of a data breach that may affect your personal information:
              </p>
              <ul>
                <li>We will notify affected users within 72 hours</li>
                <li>Relevant authorities will be notified as required by law</li>
                <li>We will provide details about the breach and remediation steps</li>
                <li>Additional security measures will be implemented as needed</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>10. Children's Privacy</h2>
              
              <p>
                Our platform is designed for business use and is not intended for children under 13. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section className="privacy-section">
              <h2>11. International Data Transfers</h2>
              
              <p>
                Data may be transferred and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for international data transfers in compliance with applicable privacy laws.
              </p>
            </section>

            <section className="privacy-section">
              <h2>12. Changes to Privacy Policy</h2>
              
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by:
              </p>
              <ul>
                <li>Updating the "Last Updated" date</li>
                <li>Providing notice through our platform</li>
                <li>Sending email notifications for significant changes</li>
              </ul>
            </section>

            <section className="privacy-section">
              <h2>13. Contact Information</h2>
              
              <p>
                For privacy-related questions, requests, or concerns:
              </p>
              <ul>
                <li><strong>Email:</strong> privacy@triangleintelligence.com</li>
                <li><strong>Subject Line:</strong> Privacy Request - [Your Request Type]</li>
                <li><strong>Response Time:</strong> Within 30 days of receipt</li>
              </ul>

              <div className="contact-notice">
                <p>
                  <strong>Data Protection Officer:</strong> Triangle Intelligence Platform<br />
                  <strong>Platform:</strong> Canada-Mexico USMCA Intelligence<br />
                  <strong>Jurisdiction:</strong> North American Trade Data Protection
                </p>
              </div>
            </section>

            <section className="privacy-section signature">
              <p>
                <strong>Triangle Intelligence Platform</strong><br />
                Committed to protecting your privacy while optimizing trade intelligence<br />
                © 2025 All Rights Reserved
              </p>
            </section>

          </div>
        </main>

        <LegalFooter showBeta={true} />
      </div>

      <style jsx>{`
        .privacy-container {
          min-height: 100vh;
          background: #f8fafc;
        }

        .privacy-header {
          background: linear-gradient(135deg, #1e40af 0%, #ffffff 25%, #16a34a 75%, #1e40af 100%);
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

        .privacy-content {
          max-width: 900px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .privacy-body {
          background: white;
          padding: 3rem;
          border-radius: 1rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .privacy-section {
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .privacy-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .privacy-section h2 {
          color: #1e40af;
          font-size: 1.6rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .privacy-section h3 {
          color: #374151;
          font-size: 1.2rem;
          font-weight: 600;
          margin: 1.5rem 0 1rem 0;
        }

        .privacy-section p {
          color: #374151;
          line-height: 1.7;
          margin-bottom: 1rem;
        }

        .privacy-section ul {
          color: #374151;
          line-height: 1.7;
          padding-left: 2rem;
          margin-bottom: 1.5rem;
        }

        .privacy-section li {
          margin-bottom: 0.7rem;
        }

        .sharing-notice {
          background: #f0f9ff;
          border: 2px solid #0ea5e9;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin: 1rem 0;
          text-align: center;
        }

        .sharing-notice p {
          color: #0c4a6e;
          font-weight: 600;
          font-size: 1.1rem;
          margin: 0;
        }

        .contact-notice {
          background: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin: 1.5rem 0;
        }

        .contact-notice p {
          color: #374151;
          margin: 0;
          line-height: 1.6;
        }

        .signature {
          text-align: center;
          background: #f0f9ff;
          padding: 2rem;
          border-radius: 0.5rem;
          border: 1px solid #0ea5e9;
        }

        .signature p {
          color: #0c4a6e;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .privacy-content {
            padding: 2rem 1rem;
          }

          .privacy-body {
            padding: 2rem;
          }

          .header-content h1 {
            font-size: 2rem;
          }

          .privacy-section h2 {
            font-size: 1.4rem;
          }

          .privacy-section h3 {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </>
  )
}