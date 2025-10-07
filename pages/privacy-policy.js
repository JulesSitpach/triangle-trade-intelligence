import Head from 'next/head';
import Link from 'next/link';
import Footer from '../components/Footer';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Triangle Trade Intelligence</title>
        <meta name="description" content="Triangle Trade Intelligence Platform Privacy Policy" />
      </Head>

      <div className="container">
        <div className="card" style={{ marginTop: '2rem', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
          <h1 style={{ marginBottom: '1rem' }}>Privacy Policy</h1>
          <p className="text-body" style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '2rem' }}>
            Last Updated: October 2, 2025
          </p>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">1. Information We Collect</h2>
            <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '1rem' }}>Information You Provide</h3>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">Account information (name, email, company name)</li>
              <li className="text-body">Business information (product descriptions, component origins, trade volumes)</li>
              <li className="text-body">Payment information (processed securely by Stripe)</li>
              <li className="text-body">Communications with our team</li>
            </ul>

            <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '1rem' }}>Automatically Collected Information</h3>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">Usage data (pages visited, features used)</li>
              <li className="text-body">Device information (browser type, operating system)</li>
              <li className="text-body">IP address and location data</li>
              <li className="text-body">Cookies and similar technologies</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">2. How We Use Your Information</h2>
            <p className="text-body">We use your information to:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">Provide and improve our services</li>
              <li className="text-body">Process payments and subscriptions</li>
              <li className="text-body">Send service-related communications</li>
              <li className="text-body">Analyze usage patterns and optimize features</li>
              <li className="text-body">Comply with legal obligations</li>
              <li className="text-body">Prevent fraud and ensure security</li>
            </ul>

            <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '1rem' }}>Automatic Workflow Data Storage</h3>
            <p className="text-body" style={{ marginTop: '0.5rem' }}>
              <strong>When you complete a USMCA workflow analysis or vulnerability assessment, we automatically save your analysis data to:</strong>
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">Enable trade risk alerts and monitoring</li>
              <li className="text-body">Provide context for professional service requests</li>
              <li className="text-body">Allow certificate regeneration and historical access</li>
              <li className="text-body">Display your analysis history in the dashboard</li>
            </ul>
            <p className="text-body" style={{ marginTop: '0.5rem' }}>
              You can delete saved analyses at any time from your dashboard settings or by contacting privacy@triangleintelligence.com. Deleting analysis data will disable related alerts and service features.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">3. How We Share Your Information</h2>
            <p className="text-body">We do not sell your personal information. We may share your information with:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">Service providers (Stripe for payments, Supabase for data storage)</li>
              <li className="text-body">Professional consultants working on your service requests</li>
              <li className="text-body">Law enforcement when required by law</li>
              <li className="text-body">Business successors in case of merger or acquisition</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">4. Data Security</h2>
            <p className="text-body">
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">Encryption in transit (HTTPS/TLS)</li>
              <li className="text-body">Encryption at rest for sensitive data</li>
              <li className="text-body">Regular security audits and updates</li>
              <li className="text-body">Access controls and authentication</li>
              <li className="text-body">Secure httpOnly cookies for session management</li>
            </ul>
            <p className="text-body" style={{ marginTop: '0.5rem' }}>
              However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">5. Data Retention</h2>
            <p className="text-body">
              We retain your information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain information for legal compliance, dispute resolution, and legitimate business purposes for up to 7 years.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">6. Your Rights</h2>
            <p className="text-body">You have the right to:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">Access your personal information</li>
              <li className="text-body">Correct inaccurate information</li>
              <li className="text-body">Delete your account and data</li>
              <li className="text-body">Object to certain data processing</li>
              <li className="text-body">Export your data (data portability)</li>
              <li className="text-body">Withdraw consent for marketing communications</li>
            </ul>
            <p className="text-body" style={{ marginTop: '0.5rem' }}>
              To exercise these rights, contact us at privacy@triangleintelligence.com
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">7. Cookies and Tracking</h2>
            <p className="text-body">
              We use cookies and similar technologies for authentication, preferences, and analytics. You can control cookies through your browser settings, but disabling cookies may limit functionality.
            </p>
            <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '1rem' }}>Types of Cookies We Use:</h3>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body"><strong>Essential:</strong> Authentication and security (httpOnly cookies)</li>
              <li className="text-body"><strong>Functional:</strong> Remember preferences and settings</li>
              <li className="text-body"><strong>Analytics:</strong> Understand how users interact with the Service</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">8. Third-Party Services</h2>
            <p className="text-body">
              Our Service integrates with third-party services that have their own privacy policies:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">Stripe (payment processing): <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>stripe.com/privacy</a></li>
              <li className="text-body">Supabase (data storage): <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>supabase.com/privacy</a></li>
              <li className="text-body">OpenRouter (AI processing): <a href="https://openrouter.ai/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>openrouter.ai/privacy</a></li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">9. International Data Transfers</h2>
            <p className="text-body">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for international data transfers in compliance with applicable laws (GDPR, CCPA).
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">10. Children's Privacy</h2>
            <p className="text-body">
              Our Service is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will delete it immediately.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">11. Changes to This Policy</h2>
            <p className="text-body">
              We may update this Privacy Policy from time to time. We will notify you of material changes via email or through the Service. Your continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">12. Contact Us</h2>
            <p className="text-body">
              For questions about this Privacy Policy or our data practices, please contact:
            </p>
            <p className="text-body" style={{ marginTop: '0.5rem' }}>
              Email: privacy@triangleintelligence.com<br />
              Website: https://triangleintelligence.com
            </p>
          </section>

          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <Link href="/" className="btn-primary">
              Return to Home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
