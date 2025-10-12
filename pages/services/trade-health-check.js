/**
 * Trade Health Check Landing Page
 *
 * $99 paid lead magnet that qualifies prospects and builds relationship
 * before upselling to full services ($175-$450).
 *
 * Credit mechanism: $99 credited toward any service within 30 days
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function TradeHealthCheck() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-service-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: 'trade-health-check',
          service_name: 'Trade Health Check',
          price: 9900, // $99 in cents
          return_url: `${window.location.origin}/services/health-check-success`
        })
      });

      const data = await response.json();

      if (data.success && data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Error processing purchase. Please try again or contact support.');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Trade Health Check - $99 | Triangle Trade Intelligence</title>
        <meta name="description" content="Get a comprehensive trade operations assessment in 1 week. $99 credited toward any full service." />
      </Head>

      <div className="page-container">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Trade Health Check</h1>
            <p className="hero-subtitle">
              Know exactly where your trade operations stand - and which improvements will deliver the biggest ROI.
            </p>
            <div className="hero-price">
              <span className="price-amount">$99</span>
              <span className="price-detail">Delivered in 1 week</span>
            </div>
          </div>
        </section>

        {/* Platform Capabilities Showcase - Visual Proof */}
        <section className="section section-alt">
          <div className="section-content">
            <h2 className="section-header">See What You'll Actually Receive</h2>
            <p className="text-body">
              This isn't just consulting advice - you get real, actionable deliverables from our trade intelligence platform.
            </p>

            {/* Visual Proof Grid */}
            <div className="capabilities-showcase">

              {/* 1. USMCA Certificate Preview */}
              <div className="capability-card">
                <h3>🎯 USMCA Certificate of Origin</h3>
                <div className="document-preview">
                  <div className="document-header">
                    <h4>USMCA CERTIFICATE OF ORIGIN</h4>
                    <p className="document-meta">Automated Generation • Official Format • Compliance Verified</p>
                  </div>
                  <div className="document-body">
                    <div className="form-row">
                      <span className="field-label">Exporter Name:</span>
                      <span className="field-value">ABC Manufacturing Inc.</span>
                    </div>
                    <div className="form-row">
                      <span className="field-label">Product Description:</span>
                      <span className="field-value">Electronic components, HS Code 8542.31</span>
                    </div>
                    <div className="form-row">
                      <span className="field-label">USMCA Qualification:</span>
                      <span className="field-value qualification-status">✓ QUALIFIED</span>
                    </div>
                    <div className="form-row">
                      <span className="field-label">Regional Content:</span>
                      <span className="field-value">68% (exceeds 65% threshold)</span>
                    </div>
                  </div>
                  <p className="document-note">
                    <strong>Platform Advantage:</strong> Auto-generated in minutes using AI analysis of your supply chain
                  </p>
                </div>
              </div>

              {/* 2. Trade Alert Dashboard Preview */}
              <div className="capability-card">
                <h3>⚠️ Trade Risk Monitoring Dashboard</h3>
                <div className="dashboard-preview">
                  <div className="alert-item alert-high">
                    <div className="alert-header">
                      <span className="alert-badge">HIGH RISK</span>
                      <span className="alert-date">2 days ago</span>
                    </div>
                    <h4>China Tariff Increase - Electronics Sector</h4>
                    <p>New 25% tariff on HS 8542 semiconductors effective March 1</p>
                    <div className="alert-impact">
                      <strong>Your Impact:</strong> $120K annual cost increase
                    </div>
                  </div>

                  <div className="alert-item alert-medium">
                    <div className="alert-header">
                      <span className="alert-badge">OPPORTUNITY</span>
                      <span className="alert-date">1 week ago</span>
                    </div>
                    <h4>Mexico Supplier Alternative Available</h4>
                    <p>3 verified Mexico suppliers found for your component</p>
                    <div className="alert-impact">
                      <strong>Potential Savings:</strong> $85K annually via USMCA
                    </div>
                  </div>
                </div>
                <p className="document-note">
                  <strong>Platform Advantage:</strong> Real-time monitoring tailored to YOUR specific supply chain
                </p>
              </div>

              {/* 3. AI Analysis Report Preview */}
              <div className="capability-card">
                <h3>🤖 AI-Enhanced Compliance Analysis</h3>
                <div className="analysis-preview">
                  <div className="analysis-section">
                    <h4>Strategic Recommendations</h4>
                    <div className="recommendation-item">
                      <span className="rec-number">1</span>
                      <div className="rec-content">
                        <strong>Switch to Mexico textile supplier for fabric component</strong>
                        <p>Current India supplier (40% of product value) prevents USMCA qualification.
                        Identified 3 Mexico alternatives that meet quality standards.</p>
                        <div className="rec-impact">Impact: Qualify for USMCA → $85K annual savings</div>
                      </div>
                    </div>
                    <div className="recommendation-item">
                      <span className="rec-number">2</span>
                      <div className="rec-content">
                        <strong>Diversify electronics supplier base</strong>
                        <p>Single Taiwan supplier creates 90% dependency risk. Tariff changes could
                        impact $300K annual costs.</p>
                        <div className="rec-impact">Impact: Reduce risk + maintain 68% regional content</div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="document-note">
                  <strong>Platform Advantage:</strong> AI analyzes your specific components and suggests actionable changes
                </p>
              </div>

            </div>

            <div className="showcase-cta">
              <p className="text-body">
                <strong>These aren't mock-ups.</strong> Every Trade Health Check includes access to our platform
                with real certificates, live alerts, and AI-powered analysis customized to your business.
              </p>
            </div>

          </div>
        </section>

        {/* What You Get Section */}
        <section className="section">
          <div className="section-content">
            <h2 className="section-header">What You Get</h2>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>USMCA Compliance Analysis</h3>
                <p>
                  Quick assessment of your current USMCA qualification status and potential duty savings.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">⚠️</div>
                <h3>Supply Chain Risk Evaluation</h3>
                <p>
                  Identify single points of failure, supplier dependencies, and vulnerability factors.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Prioritized Improvement Roadmap</h3>
                <p>
                  Clear recommendations on which services will deliver the biggest impact for your business.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">💰</div>
                <h3>$99 Credit Toward Services</h3>
                <p>
                  Your $99 is credited toward any recommended service within 30 days - essentially free assessment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="section section-alt">
          <div className="section-content">
            <h2 className="section-header">How It Works</h2>

            <div className="steps-container">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Share Your Trade Details</h3>
                  <p>
                    Complete a simple intake form about your products, suppliers, and trade operations.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Jorge & Cristina Assess</h3>
                  <p>
                    Our team reviews your operations - Jorge evaluates business capability, Cristina checks compliance.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Receive Your Report (1 Week)</h3>
                  <p>
                    Get a comprehensive Trade Health Report with scores, findings, and prioritized service recommendations.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Choose Next Steps</h3>
                  <p>
                    Book a 15-minute consultation to discuss recommendations. Your $99 credits toward any service.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sample Report Section */}
        <section className="section">
          <div className="section-content">
            <h2 className="section-header">What's in Your Report</h2>

            <div className="report-preview">
              <h3>Trade Health Report Sample</h3>
              <div className="report-content">
                <div className="report-section">
                  <h4>Executive Summary</h4>
                  <p className="report-score">Overall Trade Health Score: 67/100</p>
                </div>

                <div className="report-section">
                  <h4>Assessment Breakdown</h4>
                  <ul className="report-list">
                    <li>
                      <strong>USMCA Compliance:</strong> 45/100 - Not qualified ($85K annual savings opportunity)
                    </li>
                    <li>
                      <strong>Supply Chain Efficiency:</strong> 72/100 - Good, optimization possible
                    </li>
                    <li>
                      <strong>Market Expansion Readiness:</strong> 58/100 - Ready with guidance
                    </li>
                    <li>
                      <strong>Risk & Resilience:</strong> 63/100 - Moderate risk, diversification needed
                    </li>
                  </ul>
                </div>

                <div className="report-section">
                  <h4>Recommended Services (Priority Order)</h4>
                  <ol className="report-list">
                    <li>
                      USMCA Optimization ($175) → Unlock $85K annual savings<br />
                      <em>Your $99 credited - pay only $76</em>
                    </li>
                    <li>
                      Supplier Sourcing ($450) → Reduce single-supplier dependency<br />
                      <em>Your $99 credited - pay only $351</em>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing & CTA Section */}
        <section className="section section-cta">
          <div className="section-content">
            <div className="cta-card">
              <h2>Get Your Trade Health Check</h2>
              <div className="cta-price">
                <span className="price-large">$99</span>
                <span className="price-detail">Delivered in 1 week • $99 credit included</span>
              </div>

              <ul className="cta-benefits">
                <li>✓ Comprehensive trade operations assessment</li>
                <li>✓ USMCA qualification analysis</li>
                <li>✓ Supply chain risk evaluation</li>
                <li>✓ Prioritized improvement roadmap</li>
                <li>✓ $99 credit toward recommended services</li>
                <li>✓ 15-minute consultation included</li>
              </ul>

              <button
                onClick={handlePurchase}
                disabled={loading}
                className="btn-primary btn-large"
              >
                {loading ? 'Processing...' : 'Order Trade Health Check - $99 →'}
              </button>

              <p className="cta-guarantee">
                100% Money-Back Guarantee - If you're not satisfied with the assessment, we'll refund your $99.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section">
          <div className="section-content">
            <h2 className="section-header">Frequently Asked Questions</h2>

            <div className="faq-list">
              <div className="faq-item">
                <h3>How long does the assessment take?</h3>
                <p>
                  You'll receive your Trade Health Report within 7 days of submitting your intake form.
                </p>
              </div>

              <div className="faq-item">
                <h3>How does the $99 credit work?</h3>
                <p>
                  If you purchase any recommended service within 30 days, your $99 is credited toward that service.
                  For example, USMCA Optimization is $175 - you'd only pay $76 more.
                </p>
              </div>

              <div className="faq-item">
                <h3>Who performs the assessment?</h3>
                <p>
                  Both Jorge Ochoa (SMB trade specialist) and Cristina Escalante (enterprise logistics expert) review your operations together.
                </p>
              </div>

              <div className="faq-item">
                <h3>What if I don't need any services?</h3>
                <p>
                  That's perfectly fine! You'll still get a comprehensive report with actionable insights you can implement yourself.
                  No pressure to purchase additional services.
                </p>
              </div>

              <div className="faq-item">
                <h3>Is this a one-time payment?</h3>
                <p>
                  Yes, $99 is a one-time payment. No recurring charges unless you choose to purchase additional services.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
