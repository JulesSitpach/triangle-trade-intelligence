import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      color: '#fff',
      padding: '2.5rem 0 1.5rem',
      marginTop: '3rem'
    }}>
      <div className="container-app">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Column 1: Company */}
          <div>
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#fff'
            }}>
              Triangle Intelligence Platform
            </h3>
            <p style={{
              color: '#e0f2fe',
              lineHeight: '1.6',
              marginBottom: '1rem',
              fontSize: '0.95rem'
            }}>
              AI-powered USMCA analysis in 5 minutes. Reduce broker fees 65% while keeping professional validation.
            </p>
            <p style={{
              color: '#e0f2fe',
              fontSize: '0.85rem'
            }}>
              Canadian-owned • Mexico-based<br/>
              Bilingual support (EN/ES)
            </p>
          </div>

          {/* Column 2: Platform */}
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#fff'
            }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/signup" style={{ color: '#e0f2fe', textDecoration: 'none', fontSize: '0.9rem' }}>
                  Get Started (Free Trial)
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/pricing" style={{ color: '#e0f2fe', textDecoration: 'none', fontSize: '0.9rem' }}>
                  Pricing Plans
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/certificate-of-origin" style={{ color: '#e0f2fe', textDecoration: 'none', fontSize: '0.9rem' }}>
                  How It Works
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/login" style={{ color: '#e0f2fe', textDecoration: 'none', fontSize: '0.9rem' }}>
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#fff'
            }}>
              Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/terms-of-service" style={{ color: '#e0f2fe', textDecoration: 'none', fontSize: '0.9rem' }}>
                  Terms of Service
                </Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/privacy-policy" style={{ color: '#e0f2fe', textDecoration: 'none', fontSize: '0.9rem' }}>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Support */}
          <div>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#fff'
            }}>
              Support
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link href="/support" style={{ color: '#e0f2fe', textDecoration: 'none', fontSize: '0.9rem' }}>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.2)',
          paddingTop: '1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '0.75rem'
          }}>
            <p style={{ color: '#e0f2fe', margin: 0, fontSize: '0.9rem' }}>
              © {currentYear} Triangle Intelligence Platform. All rights reserved.
            </p>
          </div>

          {/* Legal Disclaimer */}
          <p style={{
            color: '#94a3b8',
            fontSize: '0.75rem',
            textAlign: 'center',
            margin: '0 0 0.75rem 0',
            lineHeight: '1.4'
          }}>
            All tariff rates and compliance calculations are AI-generated and should be verified with a licensed customs broker before use. You are responsible for the accuracy of data you submit.
          </p>

          {/* Trust Badges */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            <span style={{ color: '#e0f2fe', fontSize: '0.85rem' }}>
              🔒 Stripe Verified
            </span>
            <span style={{ color: '#e0f2fe', fontSize: '0.85rem' }}>
              🛡️ SSL Encrypted
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
