/**
 * 🏛️ LEGAL FOOTER COMPONENT
 * Copyright, Terms, Privacy - Platform Protection
 * Beta disclaimer for launch protection
 */

import Link from 'next/link'

export default function LegalFooter({ showBeta = true }) {
  return (
    <footer className="legal-footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="copyright">
            <p>© 2025 Triangle Intelligence Platform. All rights reserved.</p>
            {showBeta && (
              <div className="beta-notice">
                <span className="beta-badge">BETA</span>
                <span className="beta-text">Preview Version - Data for demonstration purposes</span>
              </div>
            )}
          </div>
        </div>

        <div className="footer-section">
          <div className="legal-links">
            <Link href="/terms-of-service" className="legal-link">
              Terms of Service
            </Link>
            <Link href="/privacy-policy" className="legal-link">
              Privacy Policy
            </Link>
            <Link href="/disclaimer" className="legal-link">
              Disclaimer
            </Link>
          </div>
        </div>

        <div className="footer-section">
          <div className="platform-info">
            <p className="platform-name">🇨🇦🇲🇽 Canada-Mexico USMCA Intelligence</p>
            <p className="platform-tagline">Optimizing the $56 Billion Trade Relationship</p>
          </div>
        </div>
      </div>

      <div className="footer-disclaimer">
        <p>
          <strong>Important:</strong> This platform provides trade intelligence for educational and research purposes. 
          All calculations are estimates. Consult qualified trade professionals before making business decisions. 
          Triangle Intelligence Platform is not affiliated with any government agency.
        </p>
      </div>

      <style jsx>{`
        .legal-footer {
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          color: white;
          padding: 2rem 0 1rem 0;
          margin-top: 4rem;
          border-top: 3px solid #dc2626;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .footer-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .copyright {
          text-align: left;
        }

        .copyright p {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #f9fafb;
        }

        .beta-notice {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .beta-badge {
          background: #ef4444;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .beta-text {
          font-size: 0.8rem;
          color: #d1d5db;
          font-weight: 500;
        }

        .legal-links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .legal-link {
          color: #d1d5db;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
          font-size: 0.9rem;
        }

        .legal-link:hover {
          color: #f59e0b;
          text-decoration: underline;
        }

        .platform-info {
          text-align: right;
        }

        .platform-name {
          font-weight: 700;
          font-size: 1.1rem;
          color: #f9fafb;
          margin-bottom: 0.25rem;
        }

        .platform-tagline {
          font-size: 0.8rem;
          color: #9ca3af;
          font-weight: 500;
        }

        .footer-disclaimer {
          background: rgba(0, 0, 0, 0.3);
          padding: 1rem 2rem;
          border-top: 1px solid #374151;
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-disclaimer p {
          font-size: 0.8rem;
          color: #d1d5db;
          line-height: 1.5;
          margin: 0;
          text-align: center;
        }

        .footer-disclaimer strong {
          color: #f59e0b;
        }

        @media (max-width: 768px) {
          .footer-content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .platform-info {
            text-align: left;
          }

          .footer-disclaimer {
            padding: 1rem;
          }

          .footer-disclaimer p {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </footer>
  )
}