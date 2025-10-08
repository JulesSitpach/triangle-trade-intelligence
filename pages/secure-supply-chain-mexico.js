/**
 * Mexico Supply Chain Solutions Landing Page
 * Strategic positioning for USMCA uncertainty and nearshoring trend
 */

import TriangleLayout from '../components/TriangleLayout';

export default function SecureSupplyChainMexico() {
  return (
    <TriangleLayout>
      <div className="dashboard-container">

        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">⚠️ USMCA Under Threat – Act Now</div>
            <h1 className="hero-title">
              USMCA is Uncertain.<br />
              Geography Isn't.
            </h1>
            <p className="hero-description">
              Build your Mexico supply chain before bilateral deals change the game.
              Even without USMCA, Mexico's 2-week shipping beats any tariff rate.
            </p>
            <div className="hero-buttons">
              <button
                onClick={() => window.location.href = '/mexico-savings-calculator'}
                className="btn-primary"
              >
                Calculate Your Savings
              </button>
              <button
                onClick={() => window.location.href = '/usmca-workflow'}
                className="btn-secondary"
              >
                Get Free Analysis
              </button>
            </div>
          </div>
        </div>

        {/* The Problem */}
        <div className="form-section">
          <h2 className="section-header">The Supply Chain Crisis SMBs Face in 2025</h2>

          <div className="form-grid-2">
            <div className="alert alert-error">
              <div className="alert-content">
                <div className="alert-title">🇨🇳 China Risk</div>
                <div className="text-body">
                  25% Section 301 tariffs remain. Companies importing from China pay massive premiums with no guarantee policies won't worsen.
                </div>
              </div>
            </div>

            <div className="alert alert-warning">
              <div className="alert-content">
                <div className="alert-title">🇪🇺 EU Energy Crisis</div>
                <div className="text-body">
                  German manufacturing costs up 25-35% due to energy crisis. Reliability concerns mount as European factories struggle.
                </div>
              </div>
            </div>

            <div className="alert alert-error">
              <div className="alert-content">
                <div className="alert-title">⚠️ USMCA Uncertainty</div>
                <div className="text-body">
                  Trump administration considering bilateral deals instead of USMCA. Companies relying on 0% tariffs need backup plans NOW.
                </div>
              </div>
            </div>

            <div className="alert alert-warning">
              <div className="alert-content">
                <div className="alert-title">📦 Supply Chain Delays</div>
                <div className="text-body">
                  6-8 week ocean shipping from Asia means massive inventory costs and vulnerability to Suez/Panama Canal disruptions.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The Solution */}
        <div className="form-section">
          <h2 className="section-header">The Mexico Advantage: Geography + Expertise</h2>
          <p className="text-body">
            Our expert services team combines AI-powered supply chain analysis with on-the-ground Mexico expertise
            to help you build resilient, cost-effective sourcing strategies.
          </p>

          <div className="status-grid">
            <div className="status-card">
              <div className="status-label">⚡ Shipping Time</div>
              <div className="status-value success">1-2 weeks</div>
              <div className="form-help">vs 6-8 weeks from Asia</div>
            </div>

            <div className="status-card">
              <div className="status-label">💰 Potential Savings</div>
              <div className="status-value success">15-25%</div>
              <div className="form-help">Tariffs + inventory costs</div>
            </div>

            <div className="status-card">
              <div className="status-label">🌎 Same Time Zone</div>
              <div className="status-value success">Real-time comms</div>
              <div className="form-help">vs 12-hour delay with Asia</div>
            </div>

            <div className="status-card">
              <div className="status-label">🚛 Direct Trucking</div>
              <div className="status-value success">Ground shipping</div>
              <div className="form-help">vs ocean freight uncertainty</div>
            </div>
          </div>
        </div>

        {/* The Process */}
        <div className="form-section">
          <h2 className="section-header">How We Help You Succeed in Mexico</h2>

          <div className="timeline-steps">
            <div className="timeline-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="card-title">AI Vulnerability Analysis</h3>
                <p className="text-body">
                  Our AI analyzes your supply chain component-by-component, identifying specific vulnerabilities,
                  calculating dollar-amount exposures, and flagging USMCA qualification gaps.
                </p>
                <div className="hero-buttons">
                  <button
                    onClick={() => window.location.href = '/usmca-workflow'}
                    className="btn-secondary"
                  >
                    Start Free Analysis
                  </button>
                </div>
              </div>
            </div>

            <div className="timeline-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="card-title">Expert Service Matching</h3>
                <p className="text-body">
                  Based on your specific vulnerabilities, our team recommends the right services:
                  supplier sourcing, manufacturing feasibility, market entry strategy, or compliance support.
                </p>
              </div>
            </div>

            <div className="timeline-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="card-title">On-the-Ground Execution</h3>
                <p className="text-body">
                  Our Mexico-based experts find vetted suppliers, verify capabilities, handle customs compliance,
                  and bridge cultural/language gaps. You get actionable results, not just research.
                </p>
              </div>
            </div>

            <div className="timeline-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3 className="card-title">Ongoing Relationship Support</h3>
                <p className="text-body">
                  We provide crisis response, policy change navigation, and continuous monitoring
                  to ensure your Mexico partnerships succeed long-term.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded Calculator CTA */}
        <div className="alert alert-info">
          <div className="alert-content">
            <div className="alert-title">📊 See Your Potential Savings</div>
            <div className="text-body">
              Use our interactive calculator to see realistic savings from switching to Mexico-based suppliers.
              Compare current costs (China, Germany, Vietnam, India) vs Mexico scenarios with real 2025 tariff data.
            </div>
            <div className="hero-buttons">
              <button
                onClick={() => window.location.href = '/mexico-savings-calculator'}
                className="btn-primary"
              >
                Calculate My Savings
              </button>
            </div>
          </div>
        </div>

        {/* Services Overview */}
        <div className="form-section">
          <h2 className="section-header">Our Mexico-Focused Expert Services</h2>

          <div className="form-grid-2">
            {/* Supplier Sourcing */}
            <div className="card">
              <h3 className="card-title">🔍 Mexico Supplier Sourcing</h3>
              <div className="text-body">
                <p><strong>$450</strong> (15% off for Professional, 25% off for Premium subscribers)</p>
                <ul>
                  <li>Find vetted Mexico suppliers for your specific components</li>
                  <li>On-the-ground verification of capabilities and capacity</li>
                  <li>Relationship building and cultural bridge support</li>
                  <li>4-week DIY implementation roadmap</li>
                </ul>
                <p className="form-help">
                  <strong>Why now:</strong> Even without USMCA, Mexico beats Asia on shipping time.
                  Build relationships before bilateral deal changes.
                </p>
              </div>
            </div>

            {/* Manufacturing Feasibility */}
            <div className="card">
              <h3 className="card-title">🏭 Manufacturing Feasibility Analysis</h3>
              <div className="text-body">
                <p><strong>$650</strong> (15% off for Professional, 25% off for Premium subscribers)</p>
                <ul>
                  <li>Evaluate 3 Mexico manufacturing locations for your product</li>
                  <li>Cost estimates, labor availability, infrastructure analysis</li>
                  <li>Proximity advantages vs current manufacturing location</li>
                  <li>Implementation timeline and next steps</li>
                </ul>
                <p className="form-help">
                  <strong>Why now:</strong> Geography matters regardless of tariff agreements.
                  Prepare for potential USMCA changes.
                </p>
              </div>
            </div>

            {/* Market Entry */}
            <div className="card">
              <h3 className="card-title">🌎 Mexico Market Entry Strategy</h3>
              <div className="text-body">
                <p><strong>$550</strong> (15% off for Professional, 25% off for Premium subscribers)</p>
                <ul>
                  <li>Research 3-4 Mexico market opportunities for your products</li>
                  <li>Distribution channel analysis and entry barriers</li>
                  <li>Competitive landscape and positioning recommendations</li>
                  <li>Actionable go-to-market roadmap</li>
                </ul>
                <p className="form-help">
                  <strong>Why now:</strong> Diversify beyond US market exposure.
                  Long-term strategic positioning in Latin America.
                </p>
              </div>
            </div>

            {/* USMCA Certificate */}
            <div className="card">
              <h3 className="card-title">📜 USMCA Certificate Generation</h3>
              <div className="text-body">
                <p><strong>$250</strong> (15% off for Professional, 25% off for Premium subscribers)</p>
                <ul>
                  <li>Professional certification by licensed customs broker</li>
                  <li>Regulatory compliance validation and risk assessment</li>
                  <li>Official PDF certificate for customs clearance</li>
                  <li>Expert guidance on documentation requirements</li>
                </ul>
                <p className="form-help">
                  <strong>Why now:</strong> Lock in current 0% benefits while USMCA exists.
                  Prepare for bilateral scenario.
                </p>
              </div>
            </div>

            {/* HS Classification */}
            <div className="card">
              <h3 className="card-title">🏷️ Expert HS Code Classification</h3>
              <div className="text-body">
                <p><strong>$200</strong> (15% off for Professional, 25% off for Premium subscribers)</p>
                <ul>
                  <li>Professional HS code validation by customs expert</li>
                  <li>Regulatory compliance review for Mexico/USMCA</li>
                  <li>Documentation of classification reasoning</li>
                  <li>Foundation for any tariff scenario (USMCA, bilateral, MFN)</li>
                </ul>
                <p className="form-help">
                  <strong>Why now:</strong> Correct classification needed regardless of trade agreement.
                  Avoid costly misclassification penalties.
                </p>
              </div>
            </div>

            {/* Crisis Response */}
            <div className="card">
              <h3 className="card-title">🚨 Supply Chain Crisis Response</h3>
              <div className="text-body">
                <p><strong>$500</strong> (15% off for Professional, 25% off for Premium subscribers)</p>
                <ul>
                  <li>Immediate crisis assessment and impact analysis</li>
                  <li>Expert guidance through USMCA renegotiation and policy changes</li>
                  <li>Alternative sourcing strategies with timeline</li>
                  <li>Professional action plan with implementation support</li>
                </ul>
                <p className="form-help">
                  <strong>Why now:</strong> Companies need expert guidance through trade uncertainty.
                  Policy changes happening in 2025-2026.
                </p>
              </div>
            </div>
          </div>

          <div className="hero-buttons">
            <button
              onClick={() => window.location.href = '/services/logistics-support'}
              className="btn-primary"
            >
              View All Services
            </button>
          </div>
        </div>

        {/* Why Mexico Works (Regardless of USMCA) */}
        <div className="form-section">
          <h2 className="section-header">Why Mexico Makes Sense With or Without USMCA</h2>

          <div className="text-body">
            <div className="form-grid-2">
              <div>
                <h4><strong>✓ Geographic Advantages:</strong></h4>
                <ul>
                  <li>2-week shipping vs 6-8 weeks from Asia</li>
                  <li>Direct trucking to US/Canada (no ocean freight)</li>
                  <li>Same business hours (vs 12-hour delay)</li>
                  <li>2-hour flights for site visits (vs 14-hour)</li>
                </ul>
              </div>

              <div>
                <h4><strong>✓ Cost Benefits:</strong></h4>
                <ul>
                  <li>Labor costs 40-60% of US wages</li>
                  <li>Lower inventory carrying costs (faster delivery)</li>
                  <li>Reduced air freight needs for urgent shipments</li>
                  <li>Minimal time zone coordination costs</li>
                </ul>
              </div>

              <div>
                <h4><strong>✓ Operational Resilience:</strong></h4>
                <ul>
                  <li>Less vulnerable to Suez/Panama Canal disruptions</li>
                  <li>More stable than long-distance supply chains</li>
                  <li>Easier quality control and oversight</li>
                  <li>Faster response to demand changes</li>
                </ul>
              </div>

              <div>
                <h4><strong>✓ Expert Support:</strong></h4>
                <ul>
                  <li>Bilingual teams bridge business practices</li>
                  <li>Licensed customs brokers ensure compliance</li>
                  <li>On-the-ground supplier verification</li>
                  <li>Cultural understanding of Mexico market</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="alert alert-warning">
          <div className="alert-content">
            <div className="alert-title">⏰ Time-Sensitive Opportunity</div>
            <div className="text-body">
              With USMCA under bilateral deal consideration, companies that build Mexico relationships NOW will have:
              <br />✓ Current 0% USMCA benefits (while they last)
              <br />✓ Established partnerships if bilateral deals change terms
              <br />✓ Geographic advantages that persist regardless of policy
              <br />✓ Diversified supply chains resilient to trade uncertainty
              <br /><br />
              <strong>Don't wait for policy changes to force reactive decisions.</strong>
            </div>
            <div className="hero-buttons">
              <button
                onClick={() => window.location.href = '/usmca-workflow'}
                className="btn-primary"
              >
                Start Free USMCA Analysis
              </button>
              <button
                onClick={() => window.location.href = '/mexico-savings-calculator'}
                className="btn-secondary"
              >
                Calculate My Savings
              </button>
            </div>
          </div>
        </div>

      </div>
    </TriangleLayout>
  );
}
