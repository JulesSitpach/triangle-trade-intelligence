import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h3 className="footer-title">
              Triangle Intelligence
            </h3>
            <p className="footer-text">
              Professional USMCA compliance and trade services platform for North American importers and exporters.
            </p>
          </div>

          <div>
            <h4 className="footer-subtitle">
              Platform
            </h4>
            <ul className="footer-list">
              <li>
                <Link href="/pricing" className="footer-link">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/services" className="footer-link">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="footer-link">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="footer-subtitle">
              Legal
            </h4>
            <ul className="footer-list">
              <li>
                <Link href="/terms-of-service" className="footer-link">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="footer-link">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="footer-subtitle">
              Contact
            </h4>
            <ul className="footer-list">
              <li>
                <a href="mailto:legal@triangleintelligence.com" className="footer-link">
                  Legal Inquiries
                </a>
              </li>
              <li>
                <a href="mailto:privacy@triangleintelligence.com" className="footer-link">
                  Privacy Concerns
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-divider">
          <p className="footer-copyright">
            © {currentYear} Triangle Intelligence. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
