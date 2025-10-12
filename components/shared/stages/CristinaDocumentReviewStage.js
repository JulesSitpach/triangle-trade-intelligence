/**
 * Stage 2: Cristina - Document Review & Technical Assessment
 * Cristina reviews documents for completeness and flags compliance issues
 * Can see Jorge's intake notes for context
 */

import { useState } from 'react';

export default function CristinaDocumentReviewStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  // Technical Document Quality
  const [invoiceQuality, setInvoiceQuality] = useState('');
  const [bolQuality, setBolQuality] = useState('');
  const [certificatesQuality, setCertificatesQuality] = useState('');
  const [componentBreakdownQuality, setComponentBreakdownQuality] = useState('');
  const [documentIssues, setDocumentIssues] = useState('');

  // Compliance Risk Assessment
  const [complianceRiskLevel, setComplianceRiskLevel] = useState('');
  const [riskRationale, setRiskRationale] = useState('');

  // Technical Corrections for AI
  const [usmcaThresholdCorrection, setUsmcaThresholdCorrection] = useState('');
  const [hsCodeCorrection, setHsCodeCorrection] = useState('');
  const [tariffRateCorrection, setTariffRateCorrection] = useState('');
  const [rvcCalculationNote, setRvcCalculationNote] = useState('');
  const [regulatoryContext, setRegulatoryContext] = useState('');

  const [showJorgeNotes, setShowJorgeNotes] = useState(false);
  const [showClientData, setShowClientData] = useState(false);

  const jorgeIntakeData = stageData?.stage_1 || {};

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!complianceRiskLevel) {
      alert('Please select a Compliance Risk Level');
      return;
    }

    if (!riskRationale.trim()) {
      alert('Please provide your expert rationale for the risk assessment');
      return;
    }

    onComplete({
      // Technical Document Quality
      invoice_quality: invoiceQuality,
      bol_quality: bolQuality,
      certificates_quality: certificatesQuality,
      component_breakdown_quality: componentBreakdownQuality,
      document_issues: documentIssues,

      // Compliance Risk
      compliance_risk_level: complianceRiskLevel,
      risk_rationale: riskRationale,

      // Technical Corrections
      usmca_threshold_correction: usmcaThresholdCorrection,
      hs_code_correction: hsCodeCorrection,
      tariff_rate_correction: tariffRateCorrection,
      rvc_calculation_note: rvcCalculationNote,
      regulatory_context: regulatoryContext,

      review_completed_at: new Date().toISOString()
    });
  };

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 2: Cristina - Document Review & Technical Assessment</h3>
        <p>Review document completeness and flag compliance issues (10 minutes)</p>
      </div>

      <div className="collaboration-banner">
        <p><strong>👩‍💼 Cristina's Professional Technical Review:</strong></p>
        <ul className="task-checklist">
          <li>✓ Assess technical quality of documents Jorge collected</li>
          <li>✓ Apply your 17 years Motorola/Arris enterprise logistics expertise</li>
          <li>✓ Identify compliance risks based on real-world audit patterns you've seen</li>
          <li>✓ Provide technical corrections so AI generates accurate analysis</li>
          <li>✓ Flag regulatory enforcement trends you're seeing in the market</li>
        </ul>
      </div>

      {/* Jorge's Intake Notes (Collapsible) */}
      <div className="client-data-section">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowJorgeNotes(!showJorgeNotes)}
        >
          {showJorgeNotes ? '▼ Hide' : '▶ Show'} Jorge's Intake Call Notes
        </button>

        {showJorgeNotes && (
          <div className="workflow-data-review">
            <h4>📋 Jorge's Client Intake Summary</h4>
            <div className="data-grid">
              <div className="data-section">
                <h6>Client Priorities:</h6>
                <p className="intake-notes">{jorgeIntakeData.client_priorities || 'Not provided'}</p>
              </div>

              <div className="data-section">
                <h6>Pain Points:</h6>
                <p className="intake-notes">{jorgeIntakeData.pain_points || 'Not provided'}</p>
              </div>

              <div className="data-section">
                <h6>Goals:</h6>
                <p className="intake-notes">{jorgeIntakeData.goals || 'Not provided'}</p>
              </div>

              {jorgeIntakeData.timeline && (
                <div className="data-section">
                  <h6>Timeline & Urgency:</h6>
                  <p className="intake-notes">{jorgeIntakeData.timeline}</p>
                </div>
              )}

              {jorgeIntakeData.budget_considerations && (
                <div className="data-section">
                  <h6>Budget Considerations:</h6>
                  <p className="intake-notes">{jorgeIntakeData.budget_considerations}</p>
                </div>
              )}

              {jorgeIntakeData.documents_collected && (
                <div className="data-section">
                  <h6>📄 Documents Jorge Collected:</h6>
                  <p className="intake-notes">{jorgeIntakeData.documents_collected}</p>
                </div>
              )}

              {jorgeIntakeData.missing_information && (
                <div className="data-section">
                  <h6>⚠️ Missing Information:</h6>
                  <p className="intake-notes">{jorgeIntakeData.missing_information}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* All Available Client Data (Collapsible) */}
      <div className="client-data-section">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowClientData(!showClientData)}
        >
          {showClientData ? '▼ Hide' : '▶ Show'} All Available Client Data (For Document Review)
        </button>

        {showClientData && (
          <div className="workflow-data-review">
            <h4>📋 Complete Client Intelligence</h4>
            <div className="data-grid">
              <div className="data-section">
                <h6>Company Information</h6>
                <div className="data-row"><span>Company:</span> <span>{request?.company_name || 'Not provided'}</span></div>
                <div className="data-row"><span>Contact:</span> <span>{request?.contact_name || 'Not provided'}</span></div>
                <div className="data-row"><span>Email:</span> <span>{serviceDetails?.contact_email || request?.email || 'Not provided'}</span></div>
                <div className="data-row"><span>Business Type:</span> <span>{serviceDetails?.business_type || request?.industry || 'Not provided'}</span></div>
              </div>

              <div className="data-section">
                <h6>Product & Trade Information</h6>
                <div className="data-row"><span>Product:</span> <span>{serviceDetails?.product_description || subscriberData?.product_description || 'Not specified'}</span></div>
                <div className="data-row"><span>Trade Volume:</span> <span>${Number(serviceDetails?.trade_volume || 0).toLocaleString()}/year</span></div>
                <div className="data-row"><span>Manufacturing:</span> <span>{serviceDetails?.manufacturing_location || subscriberData?.manufacturing_location || 'Not specified'}</span></div>
                <div className="data-row"><span>USMCA Status:</span> <span>{serviceDetails?.qualification_status || subscriberData?.qualification_status || 'Not determined'}</span></div>
              </div>

              {serviceDetails?.component_origins && serviceDetails.component_origins.length > 0 && (
                <div className="data-section">
                  <h6>Supply Chain Breakdown</h6>
                  {serviceDetails.component_origins.map((comp, idx) => (
                    <div key={idx} className="data-row">
                      <span>{comp.origin_country || comp.country}:</span>
                      <span>{comp.value_percentage || comp.percentage}% - {comp.description || comp.component_type}</span>
                    </div>
                  ))}
                </div>
              )}

              {(serviceDetails?.annual_tariff_cost || serviceDetails?.potential_usmca_savings) && (
                <div className="data-section financial-impact-section">
                  <h6>💰 Financial Opportunity</h6>
                  {serviceDetails?.annual_tariff_cost && (
                    <div className="data-row">
                      <span><strong>Annual Tariff Cost:</strong></span>
                      <span className="highlight-cost">${Number(serviceDetails.annual_tariff_cost).toLocaleString()}</span>
                    </div>
                  )}
                  {serviceDetails?.potential_usmca_savings && (
                    <div className="data-row">
                      <span><strong>USMCA Savings Potential:</strong></span>
                      <span className="highlight-savings">${Number(serviceDetails.potential_usmca_savings).toLocaleString()}/year</span>
                    </div>
                  )}
                  {serviceDetails?.regional_content_percentage != null && (
                    <div className="data-row">
                      <span><strong>Current Regional Content:</strong></span>
                      <span>{serviceDetails.regional_content_percentage}%</span>
                    </div>
                  )}
                  {serviceDetails?.required_threshold != null && (
                    <div className="data-row">
                      <span><strong>Required Threshold:</strong></span>
                      <span>{serviceDetails.required_threshold}%</span>
                    </div>
                  )}
                </div>
              )}

              {serviceDetails?.compliance_gaps && serviceDetails.compliance_gaps.length > 0 && (
                <div className="data-section">
                  <h6>🚨 Compliance Gaps</h6>
                  {serviceDetails.compliance_gaps.map((gap, idx) => (
                    <div key={idx} className="data-row compliance-gap">
                      <span>•</span>
                      <span>{gap}</span>
                    </div>
                  ))}
                </div>
              )}

              {serviceDetails?.vulnerability_factors && serviceDetails.vulnerability_factors.length > 0 && (
                <div className="data-section">
                  <h6>⚠️ Risk Factors</h6>
                  {serviceDetails.vulnerability_factors.map((risk, idx) => (
                    <div key={idx} className="data-row vulnerability-factor">
                      <span>•</span>
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              )}

              {serviceDetails?.recommendations && serviceDetails.recommendations.length > 0 && (
                <div className="data-section">
                  <h6>💡 USMCA Workflow Recommendations</h6>
                  {serviceDetails.recommendations.map((rec, idx) => (
                    <div key={idx} className="data-row recommendation">
                      <span>{idx + 1}.</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}

              {serviceDetails?.certificate_generated && (
                <div className="data-section">
                  <h6>📄 Certificate Status</h6>
                  <div className="data-row">
                    <span><strong>Certificate Generated:</strong></span>
                    <span className="highlight-success">✓ Yes</span>
                  </div>
                  {serviceDetails.certificate_number && (
                    <div className="data-row">
                      <span><strong>Certificate Number:</strong></span>
                      <span>{serviceDetails.certificate_number}</span>
                    </div>
                  )}
                </div>
              )}

              {serviceDetails?.alerts_subscribed && (
                <div className="data-section">
                  <h6>🔔 Trade Alerts Status</h6>
                  <div className="data-row">
                    <span><strong>Alerts Subscribed:</strong></span>
                    <span className="highlight-success">✓ Active</span>
                  </div>
                  {serviceDetails.alert_types && (
                    <div className="data-row">
                      <span><strong>Monitoring:</strong></span>
                      <span>{serviceDetails.alert_types.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}

              {(serviceDetails?.notes || serviceDetails?.special_considerations) && (
                <div className="data-section">
                  <h6>📝 Additional Notes</h6>
                  {serviceDetails.notes && (
                    <div className="data-row">
                      <p className="notes-text">{serviceDetails.notes}</p>
                    </div>
                  )}
                  {serviceDetails.special_considerations && (
                    <div className="data-row">
                      <p className="notes-text"><strong>Special Considerations:</strong> {serviceDetails.special_considerations}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cristina's Technical Review Form */}
      <form onSubmit={handleSubmit} className="workflow-form">

        {/* Section 1: Technical Document Quality Assessment */}
        <div className="client-data-section">
          <h4>📋 1. Technical Document Quality Assessment</h4>
          <p className="form-helper-text">Jorge collected these documents - your professional assessment of their technical quality:</p>

          <div className="data-grid">
            <div className="form-group">
              <label><strong>Invoices/Commercial Docs:</strong></label>
              <select
                className="form-input"
                value={invoiceQuality}
                onChange={(e) => setInvoiceQuality(e.target.value)}
              >
                <option value="">Select quality...</option>
                <option value="complete">✓ Complete (all details present)</option>
                <option value="missing_details">⚠️ Missing details (need clarification)</option>
                <option value="insufficient">✗ Insufficient (can't calculate RVC)</option>
              </select>
            </div>

            <div className="form-group">
              <label><strong>Bills of Lading:</strong></label>
              <select
                className="form-input"
                value={bolQuality}
                onChange={(e) => setBolQuality(e.target.value)}
              >
                <option value="">Select quality...</option>
                <option value="complete">✓ Complete (origin verified)</option>
                <option value="missing_details">⚠️ Missing details (unclear routing)</option>
                <option value="insufficient">✗ Insufficient (can't verify origin)</option>
              </select>
            </div>

            <div className="form-group">
              <label><strong>Certificates of Origin:</strong></label>
              <select
                className="form-input"
                value={certificatesQuality}
                onChange={(e) => setCertificatesQuality(e.target.value)}
              >
                <option value="">Select quality...</option>
                <option value="valid">✓ Valid (properly certified)</option>
                <option value="questionable">⚠️ Questionable (need verification)</option>
                <option value="missing">✗ Missing/Invalid</option>
              </select>
            </div>

            <div className="form-group">
              <label><strong>Component Breakdown:</strong></label>
              <select
                className="form-input"
                value={componentBreakdownQuality}
                onChange={(e) => setComponentBreakdownQuality(e.target.value)}
              >
                <option value="">Select quality...</option>
                <option value="detailed">✓ Detailed (mfg costs included)</option>
                <option value="vague">⚠️ Vague (materials only)</option>
                <option value="incomplete">✗ Incomplete (can't use for analysis)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label><strong>Critical Technical Issues:</strong></label>
            <p className="form-helper-text">
              Based on your Motorola/Arris experience, what documentation issues will cause problems?
            </p>
            <textarea
              className="form-input"
              rows="3"
              value={documentIssues}
              onChange={(e) => setDocumentIssues(e.target.value)}
              placeholder="Example:
🚨 Manufacturing costs not included in component breakdown - can't calculate RVC
⚠️ No INCOTERMS on invoices - will cause valuation disputes
⚠️ Origin certificates expired - customs won't accept"
            />
          </div>
        </div>

        {/* Section 2: Professional Compliance Risk Assessment */}
        <div className="client-data-section">
          <h4>⚖️ 2. Professional Compliance Risk Assessment</h4>
          <p className="form-helper-text">Based on your 17 years enterprise logistics experience - what's the real risk level?</p>

          <div className="form-group">
            <label><strong>Compliance Risk Level:</strong> <span className="required">*</span></label>
            <div className="workflow-input-group">
              <label className="workflow-recommendation-label">
                <input
                  type="radio"
                  name="riskLevel"
                  value="high"
                  checked={complianceRiskLevel === 'high'}
                  onChange={(e) => setComplianceRiskLevel(e.target.value)}
                  className="workflow-recommendation-checkbox"
                />
                🚨 High Risk (audit likely, immediate action needed)
              </label>
            </div>
            <div className="workflow-input-group">
              <label className="workflow-recommendation-label">
                <input
                  type="radio"
                  name="riskLevel"
                  value="medium"
                  checked={complianceRiskLevel === 'medium'}
                  onChange={(e) => setComplianceRiskLevel(e.target.value)}
                  className="workflow-recommendation-checkbox"
                />
                ⚠️ Medium Risk (compliance gaps, needs fixing)
              </label>
            </div>
            <div className="workflow-input-group">
              <label className="workflow-recommendation-label">
                <input
                  type="radio"
                  name="riskLevel"
                  value="low"
                  checked={complianceRiskLevel === 'low'}
                  onChange={(e) => setComplianceRiskLevel(e.target.value)}
                  className="workflow-recommendation-checkbox"
                />
                ✅ Low Risk (minor issues, can be addressed in report)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label><strong>Your Expert Rationale:</strong> <span className="required">*</span></label>
            <p className="form-helper-text">
              Why this risk level? What patterns from your Fortune 500 experience apply here?
            </p>
            <textarea
              className="form-input"
              rows="4"
              value={riskRationale}
              onChange={(e) => setRiskRationale(e.target.value)}
              placeholder="Example:
HIGH RISK: No origin certificates on file + claiming Mexico content = CBP audit trigger pattern

I saw this exact situation cause $50K penalties at Motorola in 2019. CBP is actively targeting textile imports with Mexico claims but no documentation.

Client's $500K volume puts them on radar. Need certificates ASAP before next shipment."
              required
            />
          </div>
        </div>

        {/* Section 3: Technical Corrections for AI */}
        <div className="client-data-section">
          <h4>🔧 3. Technical Corrections for AI Analysis</h4>
          <p className="form-helper-text">Where will AI make mistakes without your expertise? Guide it with your technical knowledge:</p>

          <div className="form-group">
            <label><strong>USMCA Threshold Corrections:</strong></label>
            <p className="form-helper-text">
              Is the USMCA threshold correct for this product type?
            </p>
            <textarea
              className="form-input"
              rows="2"
              value={usmcaThresholdCorrection}
              onChange={(e) => setUsmcaThresholdCorrection(e.target.value)}
              placeholder="Example: AI will use 62.5% for textiles, but yarn-forward rule is actually 55% threshold"
            />
          </div>

          <div className="form-group">
            <label><strong>HS Code Classification Corrections:</strong></label>
            <p className="form-helper-text">
              Are the HS codes correct? What should they be?
            </p>
            <textarea
              className="form-input"
              rows="2"
              value={hsCodeCorrection}
              onChange={(e) => setHsCodeCorrection(e.target.value)}
              placeholder="Example: Component should be 8471.50 (processing units) not 8517.62 (network equipment)"
            />
          </div>

          <div className="form-group">
            <label><strong>Tariff Rate Corrections:</strong></label>
            <p className="form-helper-text">
              Are there tariff preferences or special programs AI won't know about?
            </p>
            <textarea
              className="form-input"
              rows="2"
              value={tariffRateCorrection}
              onChange={(e) => setTariffRateCorrection(e.target.value)}
              placeholder="Example: India GSP reduces duty to 5.2% not 8.3% - adjust savings calculation"
            />
          </div>

          <div className="form-group">
            <label><strong>RVC Calculation Notes:</strong></label>
            <p className="form-helper-text">
              How should Regional Value Content be calculated correctly?
            </p>
            <textarea
              className="form-input"
              rows="2"
              value={rvcCalculationNote}
              onChange={(e) => setRvcCalculationNote(e.target.value)}
              placeholder="Example: Must include manufacturing labor costs in RVC - client only provided material costs"
            />
          </div>

          <div className="form-group">
            <label><strong>Regulatory Context & Enforcement Trends:</strong></label>
            <p className="form-helper-text">
              What regulatory changes or enforcement trends should AI consider? What are you seeing in the market?
            </p>
            <textarea
              className="form-input"
              rows="3"
              value={regulatoryContext}
              onChange={(e) => setRegulatoryContext(e.target.value)}
              placeholder="Example:
- New textile labor rules effective Q3 2025 will disqualify India sourcing (Section 301 compliance)
- CBP increasing audits on Mexico content claims - saw 3 clients audited last quarter
- Auto parts enforcement shifted from tariff classification to RVC verification (2024 policy change)"
            />
          </div>
        </div>

        <div className="workflow-stage-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Complete Technical Review → Trigger AI Analysis'}
          </button>
        </div>
      </form>
    </div>
  );
}
