/**
 * Stage 1: Jorge - Client Intake Call & Business Context Collection
 * Jorge conducts intake call, gathers priorities, pain points, goals, timeline
 * Shows all available client data for preparation
 */

import { useState } from 'react';

export default function JorgeClientIntakeStage({ request, subscriberData, serviceDetails, onComplete, loading }) {
  const [clientPriorities, setClientPriorities] = useState('');
  const [painPoints, setPainPoints] = useState('');
  const [goals, setGoals] = useState('');
  const [timeline, setTimeline] = useState('');
  const [budgetConsiderations, setBudgetConsiderations] = useState('');
  const [missingInfo, setMissingInfo] = useState('');
  const [documentsCollected, setDocumentsCollected] = useState('');
  const [expectationsSet, setExpectationsSet] = useState('');
  const [showClientData, setShowClientData] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!clientPriorities.trim() || !painPoints.trim() || !goals.trim()) {
      alert('Please fill in at least: Client Priorities, Pain Points, and Goals');
      return;
    }

    onComplete({
      client_priorities: clientPriorities,
      pain_points: painPoints,
      goals: goals,
      timeline: timeline,
      budget_considerations: budgetConsiderations,
      missing_information: missingInfo,
      documents_collected: documentsCollected,
      expectations_set: expectationsSet,
      intake_completed_at: new Date().toISOString()
    });
  };

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 1: Jorge - Client Onboarding & Setup</h3>
        <p>Complete client onboarding (25 minutes)</p>
      </div>

      <div className="collaboration-banner">
        <p><strong>👨‍💼 Jorge's Tasks:</strong></p>
        <ul className="task-checklist">
          <li>✓ Review all available client data from user journey</li>
          <li>✓ Conduct intake call to confirm details and gather missing information</li>
          <li>✓ Identify priorities, pain points, and goals</li>
          <li>✓ Collect any missing trade documents</li>
          <li>✓ Set expectations for 1-week delivery timeline</li>
        </ul>
      </div>

      {/* Standard Documentation Checklist */}
      <div className="client-data-section">
        <h4>📋 Standard Documentation Checklist for Trade Health Check</h4>
        <p className="form-helper-text">Request these documents during intake call and upload as you receive them:</p>

        <div className="workflow-data-review">
          <div className="data-grid">
            <div className="data-section">
              <h6>Core Documents (Always Request):</h6>
              <ul>
                <li>Recent shipping documents (last 3-6 months)</li>
                <li>Bills of lading</li>
                <li>Commercial invoices with component breakdown</li>
                <li>Current HS code classifications</li>
                <li>Certificates of origin (if claiming USMCA)</li>
              </ul>
            </div>

            <div className="data-section">
              <h6>Supply Chain Documents (If Applicable):</h6>
              <ul>
                <li>Current supplier contracts</li>
                <li>Lead time data / delivery performance</li>
                <li>Quality issue documentation</li>
                <li>Supplier contact information</li>
              </ul>
            </div>

            <div className="data-section">
              <h6>Compliance Documents (If Applicable):</h6>
              <ul>
                <li>Current import documentation</li>
                <li>Previous customs rulings</li>
                <li>Audit correspondence (if any)</li>
                <li>Regulatory approvals for target markets</li>
              </ul>
            </div>
          </div>

          <div className="workflow-status-card workflow-status-info">
            <p className="workflow-status-info-text">
              💡 <strong>Pro Tip:</strong> Clients from USMCA workflow already provided most data - just verify and request certificates.
              Marketing intake clients need full documentation package.
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible Client Data Section */}
      <div className="client-data-section">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowClientData(!showClientData)}
        >
          {showClientData ? '▼ Hide' : '▶ Show'} All Available Client Data (For Call Preparation)
        </button>

        {showClientData && (
          <div className="workflow-data-review">
            <h4>📋 Available Client Intelligence</h4>
            <div className="data-grid">
              <div className="data-section">
                <h6>Company Information</h6>
                <div className="data-row"><span>Company:</span> <span>{request?.company_name || 'Not provided'}</span></div>
                <div className="data-row"><span>Contact:</span> <span>{request?.contact_name || 'Not provided'}</span></div>
                <div className="data-row"><span>Email:</span> <span>{serviceDetails?.contact_email || request?.email || 'Not provided'}</span></div>
                <div className="data-row"><span>Business Type (Role):</span> <span>{serviceDetails?.business_type || 'Not provided'}</span></div>
                <div className="data-row"><span>Industry Sector:</span> <span>{serviceDetails?.industry_sector || serviceDetails?.industry || 'Not provided'}</span></div>
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

      {/* Jorge's Intake Form */}
      <form onSubmit={handleSubmit} className="workflow-form">
        <div className="form-group">
          <label><strong>What are the client's top 3 priorities?</strong> <span className="required">*</span></label>
          <p className="form-helper-text">
            What did they say matters most? (Cost savings? Supply chain reliability? Market expansion? Compliance?)
          </p>
          <textarea
            className="form-input"
            rows="4"
            value={clientPriorities}
            onChange={(e) => setClientPriorities(e.target.value)}
            placeholder="Example:
1. Reduce annual tariff costs (mentioned $85K current cost)
2. Diversify from single China supplier (worried about trade tensions)
3. Explore Mexico manufacturing within 12 months"
            required
          />
        </div>

        <div className="form-group">
          <label><strong>What pain points did they mention?</strong> <span className="required">*</span></label>
          <p className="form-helper-text">
            What's keeping them up at night? What problems are they facing today?
          </p>
          <textarea
            className="form-input"
            rows="4"
            value={painPoints}
            onChange={(e) => setPainPoints(e.target.value)}
            placeholder="Example:
- 100% dependent on one supplier in China - no backup plan
- Paying full tariffs because don't qualify for USMCA
- Recent quality issues with current supplier
- Long lead times (90+ days) causing inventory problems"
            required
          />
        </div>

        <div className="form-group">
          <label><strong>What are their goals/desired outcomes?</strong> <span className="required">*</span></label>
          <p className="form-helper-text">
            What do they want to achieve? Where do they want to be in 6-12 months?
          </p>
          <textarea
            className="form-input"
            rows="4"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="Example:
- Qualify for USMCA to save $85K annually on tariffs
- Find 2-3 Mexico backup suppliers within 6 months
- Reduce lead times from 90 days to 30-45 days
- Evaluate Mexico manufacturing for Q3 2025 launch"
            required
          />
        </div>

        <div className="form-group">
          <label><strong>Timeline & Urgency</strong></label>
          <p className="form-helper-text">
            When do they need solutions? Any deadline pressures?
          </p>
          <textarea
            className="form-input"
            rows="3"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            placeholder="Example:
- Urgent: Need backup suppliers ASAP (current supplier having quality issues)
- Medium-term: USMCA qualification within 6 months
- Long-term: Mexico manufacturing by Q3 2025"
          />
        </div>

        <div className="form-group">
          <label><strong>Budget Considerations</strong></label>
          <p className="form-helper-text">
            Any budget constraints mentioned? Investment capacity for solutions?
          </p>
          <textarea
            className="form-input"
            rows="3"
            value={budgetConsiderations}
            onChange={(e) => setBudgetConsiderations(e.target.value)}
            placeholder="Example:
- Q4 budget already allocated, prefer services in Q1 2025
- Can invest $10-15K if ROI is clear (tariff savings justify it)
- CFO approval needed for anything over $5K"
          />
        </div>

        <div className="form-group">
          <label><strong>📋 Missing Information/Documents Needed</strong></label>
          <p className="form-helper-text">
            What information or documents are we missing? What did you request from the client?
          </p>
          <textarea
            className="form-input"
            rows="3"
            value={missingInfo}
            onChange={(e) => setMissingInfo(e.target.value)}
            placeholder="Example:
- Requested: Certificates of origin for claimed Mexico content
- Requested: HS code classifications for semiconductor components
- Need: Complete supplier contact information for China manufacturers
- Client will send by Friday"
          />
        </div>

        <div className="form-group">
          <label><strong>📄 Documents Collected/Uploaded</strong></label>
          <p className="form-helper-text">
            What documents did the client provide during the call? What did you upload to the platform?
          </p>
          <textarea
            className="form-input"
            rows="3"
            value={documentsCollected}
            onChange={(e) => setDocumentsCollected(e.target.value)}
            placeholder="Example:
✅ Uploaded: Bill of lading from last 3 shipments
✅ Uploaded: Current supplier invoice with component breakdown
✅ Uploaded: Manufacturing cost breakdown spreadsheet
✅ Client will email certificates of origin separately"
          />
        </div>

        <div className="form-group">
          <label><strong>⏱️ Expectations Set with Client</strong></label>
          <p className="form-helper-text">
            What expectations did you set for delivery timeline and next steps?
          </p>
          <textarea
            className="form-input"
            rows="3"
            value={expectationsSet}
            onChange={(e) => setExpectationsSet(e.target.value)}
            placeholder="Example:
✅ Told client: 1-week delivery timeline for complete Trade Health Check report
✅ Explained: We'll email if we need any additional documents
✅ Set expectation: Report will include prioritized service recommendations
✅ Confirmed: $99 credit applicable to any follow-up service"
          />
        </div>

        <div className="workflow-stage-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Complete Onboarding → Pass to Cristina'}
          </button>
        </div>
      </form>
    </div>
  );
}
