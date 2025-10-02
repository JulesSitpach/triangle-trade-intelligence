import Head from 'next/head';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms of Service - Triangle Intelligence</title>
        <meta name="description" content="Triangle Intelligence Platform Terms of Service" />
      </Head>

      <div className="container">
        <div className="card" style={{ marginTop: '2rem', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}>
          <h1 style={{ marginBottom: '1rem' }}>Terms of Service</h1>
          <p className="text-body" style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '2rem' }}>
            Last Updated: October 2, 2025
          </p>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">1. Acceptance of Terms</h2>
            <p className="text-body">
              By accessing or using the Triangle Intelligence Platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">2. Description of Service</h2>
            <p className="text-body">
              Triangle Intelligence provides USMCA compliance analysis, certificate generation, and professional trade services to North American importers and exporters. Our services include but are not limited to:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li className="text-body">USMCA qualification analysis</li>
              <li className="text-body">Certificate of Origin generation</li>
              <li className="text-body">HS code classification</li>
              <li className="text-body">Mexico supplier sourcing</li>
              <li className="text-body">Manufacturing feasibility analysis</li>
              <li className="text-body">Market entry strategy consulting</li>
              <li className="text-body">Trade compliance consulting</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">3. User Accounts</h2>
            <p className="text-body">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">4. Subscription and Payment Terms</h2>
            <p className="text-body">
              Subscription fees are billed in advance on a monthly or annual basis. You authorize us to charge your payment method for all fees incurred. Subscriptions automatically renew unless cancelled before the renewal date.
            </p>
            <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '1rem' }}>Free Trial</h3>
            <p className="text-body">
              New users receive a 14-day free trial. Your payment method will be charged at the end of the trial period unless you cancel before the trial ends.
            </p>
            <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '1rem' }}>Cancellation</h3>
            <p className="text-body">
              You may cancel your subscription at any time. Cancellations take effect at the end of the current billing period. No refunds are provided for partial months.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">5. Professional Services</h2>
            <p className="text-body">
              Professional services (e.g., supplier sourcing, feasibility studies, market entry consulting) are billed separately from subscriptions. All professional service fees are non-refundable once work has commenced.
            </p>
            <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '1rem' }}>Service Delivery</h3>
            <p className="text-body">
              Professional services are delivered according to agreed timelines. We strive to meet all deadlines but are not liable for delays caused by factors outside our reasonable control.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">6. Intellectual Property</h2>
            <p className="text-body">
              All content, features, and functionality of the Service are owned by Triangle Intelligence and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or reverse engineer any part of the Service.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">7. Disclaimer of Warranties</h2>
            <p className="text-body">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. Triangle Intelligence does not guarantee that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.
            </p>
            <p className="text-body" style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
              Legal Compliance Disclaimer: While our services assist with USMCA compliance, they do not constitute legal advice. Users should consult with qualified legal professionals for specific compliance questions.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">8. Limitation of Liability</h2>
            <p className="text-body">
              To the maximum extent permitted by law, Triangle Intelligence shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">9. Indemnification</h2>
            <p className="text-body">
              You agree to indemnify and hold harmless Triangle Intelligence from any claims, damages, losses, liabilities, and expenses arising out of your use of the Service or violation of these Terms.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">10. Governing Law</h2>
            <p className="text-body">
              These Terms shall be governed by and construed in accordance with the laws of the United States and the State of California, without regard to its conflict of law provisions.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">11. Changes to Terms</h2>
            <p className="text-body">
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 className="card-title">12. Contact Information</h2>
            <p className="text-body">
              For questions about these Terms, please contact us at:
            </p>
            <p className="text-body" style={{ marginTop: '0.5rem' }}>
              Email: legal@triangleintelligence.com<br />
              Website: https://triangleintelligence.com
            </p>
          </section>

          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <Link href="/">
              <a className="btn-primary">Return to Home</a>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
