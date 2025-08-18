/**
 * ⚠️ DISCLAIMER PAGE
 * Legal disclaimers and risk notices for trade intelligence platform
 * Protects against liability for business decisions and market changes
 */

import Head from 'next/head'
import LegalFooter from '../components/LegalFooter'

export default function Disclaimer() {
  return (
    <>
      <Head>
        <title>Disclaimer - Triangle Intelligence Platform</title>
        <meta name="description" content="Important disclaimers and risk notices for Canada-Mexico USMCA Intelligence Platform" />
      </Head>

      <div className="disclaimer-container">
        <header className="disclaimer-header">
          <div className="header-content">
            <h1>⚠️ Important Disclaimer</h1>
            <p className="last-updated">Last Updated: August 10, 2025</p>
          </div>
        </header>

        <main className="disclaimer-content">
          <div className="disclaimer-body">
            
            <section className="disclaimer-section critical">
              <div className="critical-notice">
                <h2>🚨 CRITICAL NOTICE</h2>
                <p>
                  <strong>Triangle Intelligence Platform is currently in BETA status.</strong> All calculations, analyses, and recommendations are estimates for informational and educational purposes only. This platform is NOT a substitute for professional trade advice, legal counsel, or financial consultation.
                </p>
              </div>
            </section>

            <section className="disclaimer-section">
              <h2>1. Nature of Service</h2>
              
              <h3>Trade Intelligence Platform</h3>
              <p>
                Triangle Intelligence Platform provides:
              </p>
              <ul>
                <li>Estimated USMCA trade advantages and potential savings</li>
                <li>Trade route analysis and recommendations</li>
                <li>Specialist marketplace connections</li>
                <li>Pattern analysis based on historical data</li>
                <li>Government data integration and interpretation</li>
              </ul>

              <h3>What We Are NOT</h3>
              <ul>
                <li>Professional trade consultants or advisors</li>
                <li>Government agency or official trade representatives</li>
                <li>Financial advisors or investment counselors</li>
                <li>Legal experts on trade law or compliance</li>
                <li>Guarantors of actual business results or savings</li>
              </ul>
            </section>

            <section className="disclaimer-section">
              <h2>2. Accuracy and Reliability</h2>
              
              <div className="accuracy-warning">
                <h3>⚠️ No Warranty of Accuracy</h3>
                <p>
                  We make no representations or warranties regarding the accuracy, completeness, or reliability of:
                </p>
                <ul>
                  <li>Savings calculations and projections</li>
                  <li>Trade route recommendations</li>
                  <li>Government data interpretation</li>
                  <li>Market condition assessments</li>
                  <li>Specialist performance predictions</li>
                </ul>
              </div>

              <h3>Data Sources and Limitations</h3>
              <p>
                Our platform integrates data from various sources including:
              </p>
              <ul>
                <li><strong>Government Sources:</strong> Canadian Open Government Portal, DataMexico, UN Comtrade</li>
                <li><strong>Market Data:</strong> Industry reports and trend analysis</li>
                <li><strong>Historical Patterns:</strong> Anonymized user journey data</li>
                <li><strong>Third-Party APIs:</strong> External data providers and services</li>
              </ul>
              
              <p>
                <strong>Important:</strong> All data sources may contain errors, omissions, or outdated information. Market conditions and government policies change frequently.
              </p>
            </section>

            <section className="disclaimer-section">
              <h2>3. Financial and Business Risk Disclaimers</h2>
              
              <div className="risk-warning">
                <h3>🔺 HIGH-RISK ACTIVITIES</h3>
                <p>
                  International trade and cross-border business activities involve significant financial, legal, and operational risks including but not limited to:
                </p>
                <ul>
                  <li>Currency exchange rate fluctuations</li>
                  <li>Changes in government policies and trade agreements</li>
                  <li>Regulatory compliance failures and penalties</li>
                  <li>Supply chain disruptions and delays</li>
                  <li>Political and economic instability</li>
                  <li>Market condition changes and demand shifts</li>
                </ul>
              </div>

              <h3>No Guarantee of Results</h3>
              <ul>
                <li>Projected savings may not materialize</li>
                <li>Implementation costs may exceed projections</li>
                <li>Timeline estimates may be inaccurate</li>
                <li>Market opportunities may not persist</li>
                <li>Regulatory changes may affect viability</li>
              </ul>
            </section>

            <section className="disclaimer-section">
              <h2>4. USMCA and Trade Agreement Disclaimers</h2>
              
              <h3>Trade Agreement Changes</h3>
              <p>
                The United States-Mexico-Canada Agreement (USMCA) and related trade policies are subject to:
              </p>
              <ul>
                <li>Ongoing review and modification by member governments</li>
                <li>Changes in interpretation and implementation</li>
                <li>Disputes and resolution procedures</li>
                <li>Periodic renegotiation or termination</li>
              </ul>

              <h3>Compliance Requirements</h3>
              <div className="compliance-notice">
                <p>
                  <strong>CRITICAL:</strong> USMCA benefits require strict compliance with:
                </p>
                <ul>
                  <li>Rules of origin requirements</li>
                  <li>Documentation and certification procedures</li>
                  <li>Customs and border regulations</li>
                  <li>Industry-specific requirements</li>
                  <li>Environmental and labor standards</li>
                </ul>
                <p>
                  <strong>Failure to comply may result in penalties, duty assessments, and loss of trade benefits.</strong>
                </p>
              </div>
            </section>

            <section className="disclaimer-section">
              <h2>5. Specialist Marketplace Disclaimers</h2>
              
              <h3>Independent Contractors</h3>
              <p>
                All specialists in our marketplace are independent contractors. Triangle Intelligence Platform:
              </p>
              <ul>
                <li>Does not employ or directly control specialists</li>
                <li>Cannot guarantee specialist performance or results</li>
                <li>Is not liable for specialist actions or omissions</li>
                <li>Does not warranty specialist qualifications or expertise</li>
              </ul>

              <h3>Lead Qualification</h3>
              <ul>
                <li>Lead scores are algorithmic estimates, not guarantees</li>
                <li>Actual conversion rates may vary significantly</li>
                <li>Market conditions may affect lead viability</li>
                <li>Companies may change requirements or cancel projects</li>
              </ul>
            </section>

            <section className="disclaimer-section">
              <h2>6. Government Data Integration</h2>
              
              <h3>No Government Affiliation</h3>
              <div className="gov-disclaimer">
                <p>
                  <strong>IMPORTANT:</strong> Triangle Intelligence Platform is NOT affiliated with, endorsed by, or representing any government agency including:
                </p>
                <ul>
                  <li>Government of Canada or Canadian trade agencies</li>
                  <li>Government of Mexico or Mexican trade departments</li>
                  <li>United States government or trade representatives</li>
                  <li>United Nations or international trade organizations</li>
                </ul>
              </div>

              <h3>Data Interpretation</h3>
              <p>
                Our interpretation of government data:
              </p>
              <ul>
                <li>May differ from official government interpretations</li>
                <li>Is provided for informational purposes only</li>
                <li>Should not be considered official guidance</li>
                <li>May become outdated as policies change</li>
              </ul>
            </section>

            <section className="disclaimer-section">
              <h2>7. Technology and Platform Limitations</h2>
              
              <h3>Beta Software</h3>
              <p>
                As beta software, our platform may experience:
              </p>
              <ul>
                <li>Technical glitches and system downtime</li>
                <li>Data processing errors and calculation mistakes</li>
                <li>Feature limitations and incomplete functionality</li>
                <li>Security vulnerabilities and data risks</li>
                <li>Performance issues and slow response times</li>
              </ul>

              <h3>Institutional Learning Limitations</h3>
              <ul>
                <li>Pattern analysis based on limited historical data</li>
                <li>Algorithmic biases and statistical variations</li>
                <li>Correlation vs. causation interpretation errors</li>
                <li>Market condition changes affecting pattern validity</li>
              </ul>
            </section>

            <section className="disclaimer-section">
              <h2>8. Professional Consultation Required</h2>
              
              <div className="consultation-required">
                <h3>🏛️ SEEK PROFESSIONAL ADVICE</h3>
                <p>
                  Before making any business decisions based on our platform analysis, you MUST consult with qualified professionals:
                </p>
                <ul>
                  <li><strong>Trade Lawyers:</strong> For USMCA compliance and legal requirements</li>
                  <li><strong>Customs Brokers:</strong> For import/export procedures and documentation</li>
                  <li><strong>Tax Advisors:</strong> For tax implications and optimization strategies</li>
                  <li><strong>Financial Advisors:</strong> For investment decisions and risk assessment</li>
                  <li><strong>Industry Experts:</strong> For sector-specific requirements and challenges</li>
                </ul>
              </div>
            </section>

            <section className="disclaimer-section">
              <h2>9. Limitation of Liability</h2>
              
              <div className="liability-limit">
                <h3>⚖️ MAXIMUM LIABILITY</h3>
                <p>
                  <strong>TO THE FULLEST EXTENT PERMITTED BY LAW:</strong>
                </p>
                <ul>
                  <li>Triangle Intelligence Platform's total liability shall not exceed $100 USD</li>
                  <li>We are not liable for indirect, consequential, or punitive damages</li>
                  <li>We are not responsible for business losses, lost profits, or opportunity costs</li>
                  <li>Users assume all risks associated with platform use and business decisions</li>
                </ul>
              </div>
            </section>

            <section className="disclaimer-section">
              <h2>10. User Acknowledgment</h2>
              
              <p>
                By using Triangle Intelligence Platform, you acknowledge and agree that:
              </p>
              <ul>
                <li>You have read, understood, and accept all disclaimers</li>
                <li>You will seek appropriate professional advice before making business decisions</li>
                <li>You understand the risks associated with international trade</li>
                <li>You will not rely solely on platform calculations for business planning</li>
                <li>You assume full responsibility for your business decisions and their outcomes</li>
              </ul>
            </section>

            <section className="disclaimer-section signature">
              <div className="final-notice">
                <h3>📋 FINAL NOTICE</h3>
                <p>
                  <strong>Triangle Intelligence Platform</strong> is a trade intelligence tool designed to assist in research and analysis. It is not a comprehensive business solution, professional service, or guarantee of success. Use at your own risk and always consult qualified professionals for important business decisions.
                </p>
                
                <p className="copyright">
                  <strong>Triangle Intelligence Platform</strong><br />
                  Canada-Mexico USMCA Intelligence<br />
                  © 2025 All Rights Reserved
                </p>
              </div>
            </section>

          </div>
        </main>

        <LegalFooter showBeta={true} />
      </div>

      <style jsx>{`
        .disclaimer-container {
          min-height: 100vh;
          background: #f8fafc;
        }

        .disclaimer-header {
          background: linear-gradient(135deg, #ef4444 0%, #ffffff 25%, #f59e0b 75%, #ef4444 100%);
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

        .disclaimer-content {
          max-width: 900px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .disclaimer-body {
          background: white;
          padding: 3rem;
          border-radius: 1rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .disclaimer-section {
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .disclaimer-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .disclaimer-section.critical {
          border-bottom: 2px solid #ef4444;
          margin-bottom: 4rem;
          padding-bottom: 3rem;
        }

        .disclaimer-section h2 {
          color: #ef4444;
          font-size: 1.6rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .disclaimer-section h3 {
          color: #374151;
          font-size: 1.2rem;
          font-weight: 600;
          margin: 1.5rem 0 1rem 0;
        }

        .disclaimer-section p {
          color: #374151;
          line-height: 1.7;
          margin-bottom: 1rem;
        }

        .disclaimer-section ul {
          color: #374151;
          line-height: 1.7;
          padding-left: 2rem;
          margin-bottom: 1.5rem;
        }

        .disclaimer-section li {
          margin-bottom: 0.7rem;
        }

        .critical-notice {
          background: #fee2e2;
          border: 3px solid #ef4444;
          border-radius: 0.75rem;
          padding: 2rem;
          margin: 1rem 0;
        }

        .critical-notice h2 {
          color: #dc2626;
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }

        .critical-notice p {
          color: #991b1b;
          font-weight: 600;
          font-size: 1.1rem;
          margin: 0;
        }

        .accuracy-warning, .risk-warning, .compliance-notice, .liability-limit {
          background: #fef2f2;
          border: 2px solid #fca5a5;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin: 1.5rem 0;
        }

        .accuracy-warning h3, .risk-warning h3, .compliance-notice p, .liability-limit h3 {
          color: #dc2626;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .gov-disclaimer, .consultation-required {
          background: #f0f9ff;
          border: 2px solid #60a5fa;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin: 1.5rem 0;
        }

        .gov-disclaimer p, .consultation-required h3 {
          color: #1d4ed8;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .final-notice {
          background: #f9fafb;
          border: 2px solid #d1d5db;
          border-radius: 0.75rem;
          padding: 2rem;
          text-align: center;
        }

        .final-notice h3 {
          color: #374151;
          margin-bottom: 1rem;
        }

        .final-notice p {
          color: #374151;
          font-weight: 500;
          line-height: 1.8;
        }

        .copyright {
          color: #6b7280 !important;
          font-size: 0.9rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .disclaimer-content {
            padding: 2rem 1rem;
          }

          .disclaimer-body {
            padding: 2rem;
          }

          .header-content h1 {
            font-size: 2rem;
          }

          .disclaimer-section h2 {
            font-size: 1.4rem;
          }

          .disclaimer-section h3 {
            font-size: 1.1rem;
          }

          .critical-notice, .accuracy-warning, .risk-warning, .compliance-notice, .liability-limit, .gov-disclaimer, .consultation-required {
            padding: 1rem;
          }
        }
      `}</style>
    </>
  )
}