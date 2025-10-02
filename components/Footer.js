import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      backgroundColor: '#134169',
      color: '#fff',
      padding: '3rem 0 1.5rem',
      marginTop: '4rem'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div>
            <h3 className="card-title" style={{ color: '#fff', marginBottom: '0.75rem' }}>
              Triangle Intelligence
            </h3>
            <p className="text-body" style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
              Professional USMCA compliance and trade services platform for North American importers and exporters.
            </p>
          </div>

          <div>
            <h4 className="card-title" style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.75rem' }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/pricing">
                  <a className="nav-link" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Pricing</a>
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/services">
                  <a className="nav-link" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Services</a>
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/dashboard">
                  <a className="nav-link" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Dashboard</a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="card-title" style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.75rem' }}>
              Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/terms-of-service">
                  <a className="nav-link" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Terms of Service</a>
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/privacy-policy">
                  <a className="nav-link" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Privacy Policy</a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="card-title" style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.75rem' }}>
              Contact
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="mailto:legal@triangleintelligence.com" className="nav-link" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Legal Inquiries
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="mailto:privacy@triangleintelligence.com" className="nav-link" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Privacy Concerns
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          paddingTop: '1.5rem',
          textAlign: 'center'
        }}>
          <p className="text-body" style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
            © {currentYear} Triangle Intelligence. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
