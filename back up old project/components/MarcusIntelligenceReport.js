/**
 * MARCUS STERLING INTELLIGENCE REPORT
 * 3-page focused executive intelligence brief
 * Dense, actionable recommendations - no consultant fluff
 */

import { useState } from 'react'
import { DocumentIcon, DownloadIcon, PrintIcon } from './Icons'

export default function MarcusIntelligenceReport({ 
  foundationData, 
  productData, 
  calculations, 
  selectedRoute, 
  routingOptions 
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)

  const selectedRouteData = routingOptions?.find(r => r.id === selectedRoute)
  const annualSavings = calculations?.annualSavings || 1900000
  const savingsPercentage = calculations?.savingsPercentage || 87

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    
    // Simulate AI report generation
    setTimeout(() => {
      setIsGenerating(false)
      setReportGenerated(true)
    }, 2000)
  }

  if (!reportGenerated) {
    return (
      <div className="marcus-report-generator">
        <div className="report-generator-header">
          <div className="report-generator-icon">
            <DocumentIcon className="icon icon-xl" />
          </div>
          <div className="report-generator-content">
            <h3>Generate Marcus Sterling Intelligence Report</h3>
            <p>3-page executive brief with actionable recommendations and implementation roadmap</p>
          </div>
        </div>
        
        <div className="report-preview">
          <h4>Report Contents:</h4>
          <div className="report-contents">
            <div className="report-page">
              <div className="page-number">Page 1</div>
              <div className="page-title">Executive Summary & Recommendation</div>
              <div className="page-details">Key decision, financial impact, immediate actions</div>
            </div>
            <div className="report-page">
              <div className="page-number">Page 2</div>
              <div className="page-title">Financial Analysis & ROI Model</div>
              <div className="page-details">3-year projections, risk scenarios, break-even analysis</div>
            </div>
            <div className="report-page">
              <div className="page-number">Page 3</div>
              <div className="page-title">Implementation Plan & Next Steps</div>
              <div className="page-details">Timeline, partner contacts, compliance checklist</div>
            </div>
          </div>
        </div>

        <button 
          className="btn btn-primary btn-large" 
          onClick={handleGenerateReport}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating Intelligence Report...' : 'Generate Executive Report'}
        </button>
      </div>
    )
  }

  return (
    <div className="marcus-intelligence-report">
      {/* Report Header */}
      <div className="report-header">
        <div className="report-header-content">
          <div className="report-title">Marcus Sterling Intelligence Brief</div>
          <div className="report-subtitle">Triangle Trade Route Analysis • {foundationData?.companyName}</div>
          <div className="report-meta">
            Generated: {new Date().toLocaleDateString()} • Confidential Analysis
          </div>
        </div>
        <div className="report-actions">
          <button className="btn btn-ghost">
            <PrintIcon className="icon" />
            Print
          </button>
          <button className="btn btn-ghost">
            <DownloadIcon className="icon" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Page 1: Executive Summary */}
      <div className="report-page-container">
        <div className="report-page-header">
          <div className="page-indicator">Page 1 of 3</div>
          <div className="page-title">Executive Summary & Strategic Recommendation</div>
        </div>
        
        <div className="executive-decision-box">
          <div className="decision-header">STRATEGIC RECOMMENDATION</div>
          <div className="decision-content">
            <div className="decision-title">Execute {selectedRouteData?.name || 'Mexico Triangle Route'}</div>
            <div className="decision-impact">
              Annual Savings: <span className="highlight-green">${Math.round(annualSavings / 1000)}K</span> • 
              ROI: <span className="highlight-green">{Math.round(annualSavings / 50000)}%</span> • 
              Payback: <span className="highlight-blue">{calculations?.paybackMonths || 4} months</span>
            </div>
          </div>
        </div>

        <div className="analysis-sections">
          <div className="analysis-section">
            <h4>Market Intelligence</h4>
            <div className="intelligence-points">
              <div className="intelligence-point">
                <span className="point-label">Current Exposure:</span>
                <span className="point-value">Paying {getCurrentTariffDisplay()} on ${foundationData?.importVolume} volume</span>
              </div>
              <div className="intelligence-point">
                <span className="point-label">USMCA Advantage:</span>
                <span className="point-value">0% tariff rate locked by treaty, immune to political volatility</span>
              </div>
              <div className="intelligence-point">
                <span className="point-label">Risk Assessment:</span>
                <span className="point-value">Low implementation risk, established partner network available</span>
              </div>
            </div>
          </div>

          <div className="analysis-section">
            <h4>Competitive Position</h4>
            <div className="competitive-analysis">
              <div className="competitive-factor">
                <div className="factor-title">First-Mover Advantage</div>
                <div className="factor-content">
                  Early triangle routing adoption provides 2-3 year cost advantage before competitors catch up
                </div>
              </div>
              <div className="competitive-factor">
                <div className="factor-title">Supply Chain Resilience</div>
                <div className="factor-content">
                  Diversified routing reduces single-point-of-failure risk in volatile trade environment
                </div>
              </div>
            </div>
          </div>

          <div className="analysis-section critical-success-factors">
            <h4>Critical Success Factors</h4>
            <div className="success-factors">
              <div className="success-factor">
                <div className="factor-priority">HIGH</div>
                <div className="factor-text">Partner qualification and quality control systems</div>
              </div>
              <div className="success-factor">
                <div className="factor-priority">HIGH</div>
                <div className="factor-text">USMCA compliance documentation and processes</div>
              </div>
              <div className="success-factor">
                <div className="factor-priority">MEDIUM</div>
                <div className="factor-text">Cross-border logistics coordination and timing</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page 2: Financial Analysis */}
      <div className="report-page-container">
        <div className="report-page-header">
          <div className="page-indicator">Page 2 of 3</div>
          <div className="page-title">Financial Analysis & Investment Model</div>
        </div>

        <div className="financial-model">
          <div className="financial-overview">
            <div className="financial-metric-primary">
              <div className="metric-value">${Math.round(annualSavings / 1000)}K</div>
              <div className="metric-label">Annual Savings</div>
            </div>
            <div className="financial-metrics-secondary">
              <div className="financial-metric">
                <div className="metric-value">${Math.round((calculations?.additionalCosts || 50000) / 1000)}K</div>
                <div className="metric-label">Setup Investment</div>
              </div>
              <div className="financial-metric">
                <div className="metric-value">{calculations?.paybackMonths || 4}</div>
                <div className="metric-label">Payback Months</div>
              </div>
              <div className="financial-metric">
                <div className="metric-value">{Math.round(annualSavings / 50000)}%</div>
                <div className="metric-label">First Year ROI</div>
              </div>
            </div>
          </div>

          <div className="investment-breakdown">
            <h4>Investment Requirements</h4>
            <div className="investment-items">
              <div className="investment-item">
                <span className="investment-category">Partner Qualification</span>
                <span className="investment-amount">$15K</span>
              </div>
              <div className="investment-item">
                <span className="investment-category">Compliance Setup</span>
                <span className="investment-amount">$12K</span>
              </div>
              <div className="investment-item">
                <span className="investment-category">Quality Systems</span>
                <span className="investment-amount">$18K</span>
              </div>
              <div className="investment-item">
                <span className="investment-category">Working Capital</span>
                <span className="investment-amount">$25K</span>
              </div>
              <div className="investment-total">
                <span className="investment-category">Total Investment</span>
                <span className="investment-amount">${Math.round((calculations?.additionalCosts || 50000) / 1000)}K</span>
              </div>
            </div>
          </div>

          <div className="scenario-modeling">
            <h4>Scenario Analysis (3-Year Outlook)</h4>
            <div className="scenario-table">
              <div className="scenario-row scenario-header">
                <div className="scenario-cell">Scenario</div>
                <div className="scenario-cell">Probability</div>
                <div className="scenario-cell">Year 1</div>
                <div className="scenario-cell">Year 2</div>
                <div className="scenario-cell">Year 3</div>
              </div>
              <div className="scenario-row">
                <div className="scenario-cell">Conservative</div>
                <div className="scenario-cell">70%</div>
                <div className="scenario-cell">$1.4M</div>
                <div className="scenario-cell">$1.6M</div>
                <div className="scenario-cell">$1.7M</div>
              </div>
              <div className="scenario-row scenario-likely">
                <div className="scenario-cell">Most Likely</div>
                <div className="scenario-cell">85%</div>
                <div className="scenario-cell">$1.9M</div>
                <div className="scenario-cell">$2.1M</div>
                <div className="scenario-cell">$2.2M</div>
              </div>
              <div className="scenario-row">
                <div className="scenario-cell">Optimistic</div>
                <div className="scenario-cell">60%</div>
                <div className="scenario-cell">$2.4M</div>
                <div className="scenario-cell">$2.6M</div>
                <div className="scenario-cell">$2.8M</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page 3: Implementation Plan */}
      <div className="report-page-container">
        <div className="report-page-header">
          <div className="page-indicator">Page 3 of 3</div>
          <div className="page-title">Implementation Roadmap & Action Plan</div>
        </div>

        <div className="implementation-roadmap">
          <div className="immediate-actions">
            <h4>Immediate Actions (Next 48 Hours)</h4>
            <div className="action-checklist">
              <div className="action-item-checklist">
                <div className="action-checkbox"></div>
                <div className="action-text">Contact Grupo Industrial Monterrey (+52 81 8123 4567)</div>
                <div className="action-owner">CEO/VP Operations</div>
              </div>
              <div className="action-item-checklist">
                <div className="action-checkbox"></div>
                <div className="action-text">Schedule compliance consultation with USMCA specialist</div>
                <div className="action-owner">Operations Manager</div>
              </div>
              <div className="action-item-checklist">
                <div className="action-checkbox"></div>
                <div className="action-text">Compile product documentation for partner review</div>
                <div className="action-owner">Product Team</div>
              </div>
            </div>
          </div>

          <div className="implementation-timeline">
            <h4>30-60-90 Day Implementation Plan</h4>
            <div className="timeline-phases">
              <div className="timeline-phase">
                <div className="phase-period">Days 1-30</div>
                <div className="phase-title">Partner Qualification</div>
                <div className="phase-deliverables">
                  <div className="deliverable">Financial stability verification</div>
                  <div className="deliverable">Facility audit completion</div>
                  <div className="deliverable">Quality system assessment</div>
                  <div className="deliverable">Trial agreement execution</div>
                </div>
              </div>
              <div className="timeline-phase">
                <div className="phase-period">Days 31-60</div>
                <div className="phase-title">Pilot Execution</div>
                <div className="phase-deliverables">
                  <div className="deliverable">5% volume pilot shipment</div>
                  <div className="deliverable">Quality control validation</div>
                  <div className="deliverable">Compliance verification</div>
                  <div className="deliverable">Cost savings measurement</div>
                </div>
              </div>
              <div className="timeline-phase">
                <div className="phase-period">Days 61-90</div>
                <div className="phase-title">Scale & Optimize</div>
                <div className="phase-deliverables">
                  <div className="deliverable">Ramp to 25% volume</div>
                  <div className="deliverable">Process optimization</div>
                  <div className="deliverable">Full rollout planning</div>
                  <div className="deliverable">ROI validation</div>
                </div>
              </div>
            </div>
          </div>

          <div className="key-contacts">
            <h4>Key Implementation Contacts</h4>
            <div className="contacts-grid">
              <div className="contact-card">
                <div className="contact-type">Primary Partner</div>
                <div className="contact-name">Grupo Industrial Monterrey</div>
                <div className="contact-person">Carlos Rodriguez, Director</div>
                <div className="contact-info">+52 81 8123 4567</div>
                <div className="contact-specialty">Electronics Manufacturing</div>
              </div>
              <div className="contact-card">
                <div className="contact-type">Compliance Specialist</div>
                <div className="contact-name">USMCA Trade Services</div>
                <div className="contact-person">Maria Santos, Partner</div>
                <div className="contact-info">+1 214 555 0123</div>
                <div className="contact-specialty">Regulatory Affairs</div>
              </div>
              <div className="contact-card">
                <div className="contact-type">Logistics Coordinator</div>
                <div className="contact-name">Cross-Border Solutions</div>
                <div className="contact-person">David Chen, VP</div>
                <div className="contact-info">+1 619 555 0145</div>
                <div className="contact-specialty">Mexico-US Trade Corridor</div>
              </div>
            </div>
          </div>

          <div className="success-metrics">
            <h4>Success Metrics & Milestones</h4>
            <div className="metrics-grid">
              <div className="metric-target">
                <div className="target-value">30 days</div>
                <div className="target-label">Partner Agreement Signed</div>
              </div>
              <div className="metric-target">
                <div className="target-value">60 days</div>
                <div className="target-label">First Pilot Shipment Complete</div>
              </div>
              <div className="metric-target">
                <div className="target-value">90 days</div>
                <div className="target-label">$158K Monthly Savings Achieved</div>
              </div>
              <div className="metric-target">
                <div className="target-value">120 days</div>
                <div className="target-label">Full ROI Validation</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Footer */}
      <div className="report-footer">
        <div className="footer-content">
          <div className="confidence-assessment">
            <div className="confidence-score">8.7/10</div>
            <div className="confidence-label">Implementation Confidence</div>
          </div>
          <div className="footer-text">
            <strong>Bottom Line:</strong> High-confidence opportunity with established mitigation strategies. 
            Conservative 4-month pilot protects downside while capturing 85% of projected savings.
          </div>
        </div>
        <div className="report-signature">
          <div className="signature-line">Marcus Sterling Intelligence Analysis</div>
          <div className="signature-date">Generated: {new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  )

  function getCurrentTariffDisplay() {
    const origin = foundationData?.primarySupplierCountry || 'China'
    const tariffRates = {
      'China': '25-30%',
      'CN': '25-30%',
      'India': '15-20%',
      'IN': '15-20%',
      'Vietnam': '0-15%',
      'VN': '0-15%'
    }
    return tariffRates[origin] || '15-25%'
  }
}