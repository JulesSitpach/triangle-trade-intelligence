import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      color: '#fff',
      padding: '4rem 0 2rem',
      marginTop: '4rem'
    }}>
      <div className="container-app">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '3rem',
          marginBottom: '3rem'
        }}>
          {/* Company Info */}
          <div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#fff'
            }}>
              Triangle Trade Intelligence
            </h3>
            <p style={{
              color: '#e0f2fe',
              lineHeight: '1.6',
              marginBottom: '1rem'
            }}>
              USMCA compliance platform helping North American SMBs save on tariffs and optimize supply chains.
            </p>
            <p style={{
              color: '#e0f2fe',
              fontSize: '0.9rem'
            }}>
              Canadian-owned • Mexico-based experts<br/>
              Bilingual team (English/Spanish)
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#fff'
            }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/signup" style={{ color: '#e0f2fe', textDecoration: 'none' }}>
                  Get Started (Free Trial)
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/pricing" style={{ color: '#e0f2fe', textDecoration: 'none' }}>
                  Pricing Plans
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/services" style={{ color: '#e0f2fe', textDecoration: 'none' }}>
                  Expert Services
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/dashboard" style={{ color: '#e0f2fe', textDecoration: 'none' }}>
                  Dashboard Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#fff'
            }}>
              Resources
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/about" style={{ color: '#e0f2fe', textDecoration: 'none' }}>
                  About Us
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/mexico-savings-calculator" style={{ color: '#e0f2fe', textDecoration: 'none' }}>
                  Savings Calculator
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/secure-supply-chain-mexico" style={{ color: '#e0f2fe', textDecoration: 'none' }}>
                  Supply Chain Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#fff'
            }}>
              Support & Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/contact-support" style={{ color: '#e0f2fe', textDecoration: 'none' }}>
                  Contact Support
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/contact" style={{ color: '#e0f2fe', textDecoration: 'none' }}>
                  Contact Us
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="mailto:triangleintel@gmail.com?subject=General%20Inquiry" style={{ color: '#e0f2fe', textDecoration: 'none' }}>
                  Email: triangleintel@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.2)',
          paddingTop: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <p style={{ color: '#e0f2fe', margin: 0 }}>
            © {currentYear} Triangle Trade Intelligence. All rights reserved.
          </p>
          <p style={{ color: '#e0f2fe', margin: 0, fontSize: '0.9rem' }}>
            Not a licensed customs broker. Consulting services only.
          </p>
        </div>
      </div>
    </footer>
  );
}
