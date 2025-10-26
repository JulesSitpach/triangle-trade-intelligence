/**
 * Stage 4: Report Generation & Delivery
 * Generate and send comprehensive Trade Health Check report to client
 * Capture marketplace intelligence data
 */

import { useState } from 'react';
import MarketplaceIntelligenceForm from '../MarketplaceIntelligenceForm';

export default function ReportGenerationStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [marketplaceIntelligence, setMarketplaceIntelligence] = useState(null);

  const aiAnalysisData = stageData?.stage_3 || {};

  const generateReport = async () => {
    try {
      setGeneratingReport(true);

      // Call API to generate Trade Health Check report
      const response = await fetch('/api/generate-trade-health-check-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceRequestId: request.id,
          clientData: serviceDetails,
          stage1Data: stageData?.stage_1,
          stage2Data: stageData?.stage_2,
          stage3Data: stageData?.stage_3
        })
      });

      const result = await response.json();

      if (result.success) {
        setReportGenerated(true);
        alert('✅ Trade Health Check report sent to client and triangleintel@gmail.com');

        // Mark service as completed
        onComplete({
          report_generated: true,
          report_sent_to: [request.email, 'triangleintel@gmail.com'],
          marketplace_intelligence: marketplaceIntelligence,
          completed_at: new Date().toISOString()
        });
      } else {
        throw new Error(result.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('❌ Failed to generate report: ' + error.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 4: Generate & Send Trade Health Check Report</h3>
        <p>Review draft report and send to client (15 min)</p>
      </div>

      <div className="collaboration-banner">
        <p><strong>👥 Team Review:</strong> Both Jorge and Cristina can review this draft report before sending to client</p>
        <p><strong>📧 Final Step:</strong> Once reviewed and approved by both, click to generate and send professional report</p>
      </div>

      <div className="workflow-summary">
        <h4>📋 Report Summary</h4>

        <div className="summary-section">
          <h6>Client Information:</h6>
          <p><strong>Company:</strong> {request?.company_name}</p>
          <p><strong>Contact:</strong> {request?.contact_name} ({request?.email})</p>
          <p><strong>Product:</strong> {serviceDetails?.product_description}</p>
          <p><strong>Trade Volume:</strong> ${Number(serviceDetails?.trade_volume || 0).toLocaleString()}/year</p>
        </div>

        {aiAnalysisData.ai_analysis && (
          <>
            <div className="summary-section">
              <h6>AI-Generated Health Scores:</h6>
              <div className="score-summary">
                <p><strong>Overall Health Score:</strong> {aiAnalysisData.ai_analysis.overall_score}/100</p>
                <p><strong>USMCA Compliance:</strong> {aiAnalysisData.ai_analysis.usmca_score}/100</p>
                <p><strong>Supply Chain Efficiency:</strong> {aiAnalysisData.ai_analysis.supply_chain_score}/100</p>
                <p><strong>Market Expansion Readiness:</strong> {aiAnalysisData.ai_analysis.market_expansion_score}/100</p>
                <p><strong>Risk & Resilience:</strong> {aiAnalysisData.ai_analysis.risk_resilience_score}/100</p>
              </div>
            </div>

            <div className="summary-section">
              <h6>Prioritized Service Recommendations:</h6>
              {aiAnalysisData.ai_analysis.service_recommendations?.map((rec, idx) => (
                <p key={idx}>
                  <strong>{idx + 1}. {rec.service}</strong> (${rec.price}) - {rec.expected_outcome}
                </p>
              ))}
            </div>
          </>
        )}

        <div className="summary-section">
          <h6>Jorge's Business Insights:</h6>
          <p className="assessment-preview">
            {aiAnalysisData.jorge_validation?.substring(0, 250) || 'AI analysis validated without additional business context'}
            {aiAnalysisData.jorge_validation?.length > 250 && '...'}
          </p>
        </div>

        <div className="summary-section">
          <h6>Cristina's Technical Validation:</h6>
          <p className="assessment-preview">
            {aiAnalysisData.cristina_validation?.substring(0, 250) || 'AI compliance analysis validated'}
            {aiAnalysisData.cristina_validation?.length > 250 && '...'}
          </p>
        </div>
      </div>

      <div className="report-deliverable-info">
        <h4>📧 Report Will Include:</h4>
        <ul>
          <li>Overall Trade Health Score (0-100)</li>
          <li>Category Breakdown: USMCA, Supply Chain, Market Expansion, Risk & Resilience</li>
          <li>Detailed assessment findings from AI + expert validation</li>
          <li>Prioritized service recommendations with ROI projections</li>
          <li>Next steps and $99 credit instructions (applicable to any service)</li>
        </ul>
      </div>

      {/* Marketplace Intelligence Capture */}
      <MarketplaceIntelligenceForm
        serviceType="Trade Health Check"
        onDataChange={setMarketplaceIntelligence}
      />

      <div className="workflow-stage-actions">
        <button
          className="btn-primary"
          onClick={generateReport}
          disabled={generatingReport || reportGenerated || !aiAnalysisData.ai_analysis}
        >
          {generatingReport ? '⏳ Generating Report...' : reportGenerated ? '✅ Report Sent' : '📧 Generate & Send Report'}
        </button>

        {!aiAnalysisData.ai_analysis && (
          <p className="form-helper-text">Complete Stage 3 AI Analysis first before generating report</p>
        )}
      </div>
    </div>
  );
}
