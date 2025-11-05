import Head from 'next/head';
import Link from 'next/link';
import TriangleLayout from '../components/TriangleLayout';

export default function Support() {
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

              <div style={{ marginBottom: '40px' }}>
                <h2 className="content-card-title">📧 Contact Us</h2>
                <p className="text-body">
                  <strong>Email:</strong> <a href="mailto:triangleintel@gmail.com" style={{ color: '#2563EB' }}>triangleintel@gmail.com</a>
                </p>
                <p className="text-body">
                  We typically respond within 24 hours during business days.
                </p>
              </div>

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
