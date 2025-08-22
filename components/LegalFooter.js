/**
 * 🏛️ COMPREHENSIVE LEGAL FOOTER COMPONENT
 * 
 * Robust intellectual property protection for Triangle Intelligence Platform:
 * - 597K+ trade flow database protection
 * - Beast Master Controller algorithms
 * - Proprietary intelligence systems
 * - Trademark and copyright enforcement
 * - DMCA compliance and patent pending notices
 */

import Link from 'next/link'

export default function LegalFooter({ showBeta = true }) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bloomberg-legal-footer">
      {/* Main Footer Content */}
      <div className="bloomberg-legal-footer-main">
        <div className="bloomberg-container-padded">
          <div className="bloomberg-grid bloomberg-grid-4 bloomberg-gap-xl">
            
            {/* Company Information */}
            <div className="bloomberg-legal-footer-section">
              <div className="bloomberg-legal-footer-brand">
                <span className="bloomberg-brand-accent">◢</span>
                TRIANGLE INTELLIGENCE
                <span className="bloomberg-brand-version">PRO v2.1</span>
              </div>
              <div className="bloomberg-legal-footer-tagline">
                Professional Trade Intelligence Terminal
              </div>
              {showBeta && (
                <div className="beta-notice">
                  <span className="beta-badge">BETA</span>
                  <span className="beta-text">Preview Version - Data for demonstration purposes</span>
                </div>
              )}
              <div className="bloomberg-legal-footer-contact">
                <div>Legal Department</div>
                <div>legal@triangleintelligence.com</div>
                <div>DMCA Agent: dmca@triangleintelligence.com</div>
              </div>
            </div>

            {/* Legal Links */}
            <div className="bloomberg-legal-footer-section">
              <h4 className="bloomberg-legal-footer-title">Legal Information</h4>
              <ul className="bloomberg-legal-footer-links">
                <li><Link href="/terms-of-service">Terms of Service</Link></li>
                <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/cookie-policy">Cookie Policy</Link></li>
                <li><Link href="/data-protection">Data Protection</Link></li>
                <li><Link href="/dmca-policy">DMCA Policy</Link></li>
                <li><Link href="/intellectual-property">IP Policy</Link></li>
              </ul>
            </div>

            {/* Platform Information */}
            <div className="bloomberg-legal-footer-section">
              <h4 className="bloomberg-legal-footer-title">Platform & Services</h4>
              <ul className="bloomberg-legal-footer-links">
                <li><Link href="/platform-status">System Status</Link></li>
                <li><Link href="/api-documentation">API Documentation</Link></li>
                <li><Link href="/security">Security Information</Link></li>
                <li><Link href="/compliance">Compliance</Link></li>
                <li><Link href="/enterprise">Enterprise Solutions</Link></li>
                <li><Link href="/support">Technical Support</Link></li>
              </ul>
            </div>

            {/* Contact & Support */}
            <div className="bloomberg-legal-footer-section">
              <h4 className="bloomberg-legal-footer-title">Contact Information</h4>
              <div className="bloomberg-legal-footer-contact-info">
                <div className="bloomberg-legal-contact-item">
                  <strong>General Inquiries</strong>
                  <div>info@triangleintelligence.com</div>
                </div>
                <div className="bloomberg-legal-contact-item">
                  <strong>Technical Support</strong>
                  <div>support@triangleintelligence.com</div>
                </div>
                <div className="bloomberg-legal-contact-item">
                  <strong>Business Development</strong>
                  <div>partnerships@triangleintelligence.com</div>
                </div>
                <div className="bloomberg-legal-contact-item">
                  <strong>Emergency Line</strong>
                  <div>+1 (555) TRIANGLE</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Comprehensive Legal Protection Section */}
      <div className="bloomberg-legal-footer-protection">
        <div className="bloomberg-container-padded">
          
          {/* Copyright Notice */}
          <div className="bloomberg-legal-copyright">
            <h4 className="bloomberg-legal-protection-title">
              COPYRIGHT & INTELLECTUAL PROPERTY PROTECTION
            </h4>
            <p>
              © {currentYear} Triangle Intelligence Corporation. All rights reserved worldwide. 
              This platform, including all software, algorithms, databases, methodologies, 
              and intellectual property, is protected by United States and international 
              copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </div>

          {/* Database Protection */}
          <div className="bloomberg-legal-database">
            <h4 className="bloomberg-legal-protection-title">
              PROPRIETARY DATABASE & ALGORITHM PROTECTION
            </h4>
            <div className="bloomberg-legal-protection-grid">
              <div className="bloomberg-legal-protection-item">
                <strong>Trade Flow Intelligence Database:</strong>
                597,000+ proprietary trade flow records, classifications, and analytical insights 
                constitute valuable trade secrets and confidential business information.
              </div>
              <div className="bloomberg-legal-protection-item">
                <strong>Beast Master Controller:</strong>
                Proprietary intelligence orchestration system and compound analytics engine 
                protected by trade secret law and pending patent applications.
              </div>
              <div className="bloomberg-legal-protection-item">
                <strong>Institutional Learning Data:</strong>
                240+ workflow sessions, success patterns, and user behavior analytics 
                constitute confidential business intelligence and trade secrets.
              </div>
              <div className="bloomberg-legal-protection-item">
                <strong>USMCA Triangle Routing Algorithms:</strong>
                Proprietary mathematical models and optimization algorithms for trade route 
                calculation protected by patent pending status and trade secret law.
              </div>
            </div>
          </div>

          {/* Trademark Protection */}
          <div className="bloomberg-legal-trademarks">
            <h4 className="bloomberg-legal-protection-title">
              TRADEMARK & BRAND PROTECTION
            </h4>
            <p>
              &quot;Triangle Intelligence,&quot; &quot;Beast Master Controller,&quot; &quot;USMCA Triangle Routing,&quot; 
              &quot;Goldmine Intelligence,&quot; and all related marks, logos, and trade dress are 
              trademarks or registered trademarks of Triangle Intelligence Corporation. 
              The distinctive triangular design mark ◢ is a registered trademark. 
              Unauthorized use is strictly prohibited.
            </p>
          </div>

          {/* Usage Restrictions */}
          <div className="bloomberg-legal-restrictions">
            <h4 className="bloomberg-legal-protection-title">
              UNAUTHORIZED USE PROHIBITED
            </h4>
            <div className="bloomberg-legal-warning">
              <div className="bloomberg-legal-warning-header">
                ⚠️ LEGAL WARNING - UNAUTHORIZED ACCESS OR USE IS STRICTLY PROHIBITED
              </div>
              <div className="bloomberg-legal-warning-content">
                <ul>
                  <li>Reverse engineering, decompilation, or disassembly of software systems</li>
                  <li>Data scraping, automated extraction, or database replication</li>
                  <li>Unauthorized API access or rate limit circumvention</li>
                  <li>Reproduction, distribution, or commercialization of intelligence data</li>
                  <li>Creation of derivative works or competing intelligence platforms</li>
                  <li>Trademark infringement or brand impersonation</li>
                </ul>
                <p>
                  Violations will be prosecuted to the fullest extent of the law and may result 
                  in substantial monetary damages, injunctive relief, and criminal penalties.
                </p>
              </div>
            </div>
          </div>

          {/* DMCA Compliance */}
          <div className="bloomberg-legal-dmca">
            <h4 className="bloomberg-legal-protection-title">
              DMCA COMPLIANCE & ENFORCEMENT
            </h4>
            <p>
              Triangle Intelligence Corporation actively monitors for copyright infringement 
              and will pursue all available legal remedies against violators. To report 
              suspected infringement, contact our DMCA agent at dmca@triangleintelligence.com. 
              We respond to valid DMCA notices within 24 hours and maintain a strict 
              repeat infringer policy.
            </p>
          </div>

          {/* Patents & Trade Secrets */}
          <div className="bloomberg-legal-patents">
            <h4 className="bloomberg-legal-protection-title">
              PATENT PENDING & TRADE SECRET PROTECTION
            </h4>
            <p>
              Multiple patent applications pending for triangle routing optimization methods, 
              compound intelligence generation systems, and real-time tariff volatility 
              tracking algorithms. Confidential and proprietary information is protected 
              under state and federal trade secret laws. Disclosure or misappropriation 
              may result in immediate legal action and significant monetary damages.
            </p>
          </div>

          {/* Platform Disclaimer */}
          <div className="footer-disclaimer">
            <p>
              <strong>Important:</strong> This platform provides trade intelligence for educational and research purposes. 
              All calculations are estimates. Consult qualified trade professionals before making business decisions. 
              Triangle Intelligence Platform is not affiliated with any government agency.
            </p>
          </div>

        </div>
      </div>

      {/* Final Legal Notice */}
      <div className="bloomberg-legal-footer-bottom">
        <div className="bloomberg-container-padded">
          <div className="bloomberg-legal-footer-bottom-content">
            <div className="bloomberg-legal-footer-copyright-line">
              © {currentYear} Triangle Intelligence Corporation | All Rights Reserved | 
              Patent Pending | Trade Secrets Protected | 
              Unauthorized Use Prohibited
            </div>
            <div className="bloomberg-legal-footer-enforcement">
              Legal enforcement powered by industry-leading IP protection services. 
              Violations detected through automated monitoring systems.
            </div>
          </div>
        </div>
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

        @media (max-width: var(--breakpoint-sm)) {
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