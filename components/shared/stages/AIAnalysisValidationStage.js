/**
 * Stage 3: AI Analysis & Validation
 * AI generates health scores, Jorge and Cristina validate
 * Jorge leads this stage (client relationship) but both can view
 */

import { useState } from 'react';

export default function AIAnalysisValidationStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [jorgeValidation, setJorgeValidation] = useState('');
  const [cristinaValidation, setCristinaValidation] = useState('');
  const [showPreviousStages, setShowPreviousStages] = useState(false);

  const jorgeIntakeData = stageData?.stage_1 || {};
  const cristinaReviewData = stageData?.stage_2 || {};

  const runAIAnalysis = async () => {
    try {
      setAnalysisRunning(true);

      // Call AI analysis API with complete business context
      const response = await fetch('/api/generate-trade-health-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceRequestId: request.id,
          clientData: {
            company: request.company_name,
            product: serviceDetails.product_description,
            trade_volume: serviceDetails.trade_volume,
            manufacturing_location: serviceDetails.manufacturing_location,
            usmca_status: serviceDetails.qualification_status,
            component_origins: serviceDetails.component_origins,
            annual_tariff_cost: serviceDetails.annual_tariff_cost,
            potential_savings: serviceDetails.potential_usmca_savings
          },
          jorgeContext: jorgeIntakeData,
          cristinaContext: cristinaReviewData
        })
      });

      const result = await response.json();

      if (result.success) {
        setAiAnalysis(result.analysis);
      } else {
        throw new Error(result.error || 'AI analysis failed');
      }
    } catch (error) {
      console.error('Error running AI analysis:', error);
      alert('❌ Failed to run AI analysis: ' + error.message);
    } finally {
      setAnalysisRunning(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!aiAnalysis) {
      alert('Please run AI analysis first');
      return;
    }

    onComplete({
      ai_analysis: aiAnalysis,
      jorge_validation: jorgeValidation,
      cristina_validation: cristinaValidation,
      analysis_completed_at: new Date().toISOString()
    });
  };

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 3: AI Analysis & Team Validation</h3>
        <p>Either Jorge or Cristina triggers AI → Both validate results (30 min total)</p>
      </div>

      <div className="collaboration-banner">
        <p><strong>⚡ Efficiency:</strong> AI does heavy analysis → Team validates accuracy and adds expert insights</p>
        <p><strong>👥 Collaboration:</strong> Whoever is ready can trigger AI analysis. Both Jorge and Cristina validate before generating report.</p>
      </div>

      {/* Previous Stages Summary (Collapsible) */}
      <div className="client-data-section">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowPreviousStages(!showPreviousStages)}
        >
          {showPreviousStages ? '▼ Hide' : '▶ Show'} Previous Stage Notes
        </button>

        {showPreviousStages && (
          <div className="workflow-data-review">
            <h4>📋 Stage 1 & 2 Summary</h4>
            <div className="data-grid">
              <div className="data-section">
                <h6>Jorge's Intake (Stage 1):</h6>
                <p className="intake-notes"><strong>Priorities:</strong> {jorgeIntakeData.client_priorities || 'Not provided'}</p>
                <p className="intake-notes"><strong>Pain Points:</strong> {jorgeIntakeData.pain_points || 'Not provided'}</p>
                <p className="intake-notes"><strong>Goals:</strong> {jorgeIntakeData.goals || 'Not provided'}</p>
              </div>

              <div className="data-section">
                <h6>Cristina's Review (Stage 2):</h6>
                <p className="intake-notes"><strong>Document Status:</strong> {cristinaReviewData.document_completeness || 'Not provided'}</p>
                {cristinaReviewData.compliance_red_flags && (
                  <p className="intake-notes"><strong>Red Flags:</strong> {cristinaReviewData.compliance_red_flags}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Analysis Trigger */}
      {!aiAnalysis && (
        <div className="ai-analysis-trigger">
          <h4>🤖 Step 1: Run AI Health Check Analysis</h4>
          <p>AI will analyze:</p>
          <ul>
            <li>USMCA compliance status and qualification gaps</li>
            <li>Supply chain efficiency and optimization opportunities</li>
            <li>Market expansion readiness assessment</li>
            <li>Risk & resilience evaluation</li>
            <li>Prioritized service recommendations with ROI projections</li>
          </ul>

          <button
            className="btn-primary"
            onClick={runAIAnalysis}
            disabled={analysisRunning}
          >
            {analysisRunning ? '⏳ AI Analyzing...' : '🚀 Run AI Analysis'}
          </button>
        </div>
      )}

      {/* AI Results + Validation Form */}
      {aiAnalysis && (
        <form onSubmit={handleSubmit} className="workflow-form">
          {/* AI Generated Health Scores */}
          <div className="ai-results-section">
            <h4>🤖 AI-Generated Trade Health Assessment</h4>

            <div className="health-scores">
              <div className="score-card">
                <h6>Overall Health Score</h6>
                <div className="score-display">{aiAnalysis.overall_score}/100</div>
              </div>

              <div className="score-breakdown">
                <div className="score-item">
                  <span>USMCA Compliance:</span>
                  <span className="score-value">{aiAnalysis.usmca_score}/100</span>
                </div>
                <div className="score-item">
                  <span>Supply Chain Efficiency:</span>
                  <span className="score-value">{aiAnalysis.supply_chain_score}/100</span>
                </div>
                <div className="score-item">
                  <span>Market Expansion Readiness:</span>
                  <span className="score-value">{aiAnalysis.market_expansion_score}/100</span>
                </div>
                <div className="score-item">
                  <span>Risk & Resilience:</span>
                  <span className="score-value">{aiAnalysis.risk_resilience_score}/100</span>
                </div>
              </div>
            </div>

            {/* AI Assessment Details */}
            <div className="ai-assessment-breakdown">
              <h6>📋 AI Assessment Details:</h6>

              <div className="assessment-section">
                <strong>USMCA Compliance Status:</strong>
                <p>{aiAnalysis.usmca_assessment}</p>
              </div>

              <div className="assessment-section">
                <strong>Supply Chain Analysis:</strong>
                <p>{aiAnalysis.supply_chain_assessment}</p>
              </div>

              <div className="assessment-section">
                <strong>Market Expansion Opportunities:</strong>
                <p>{aiAnalysis.market_expansion_assessment}</p>
              </div>

              <div className="assessment-section">
                <strong>Risk Factors:</strong>
                <p>{aiAnalysis.risk_assessment}</p>
              </div>
            </div>

            {/* AI Service Recommendations */}
            <div className="ai-recommendations">
              <h6>🎯 AI-Prioritized Service Recommendations:</h6>
              {aiAnalysis.service_recommendations?.map((rec, idx) => (
                <div key={idx} className="recommendation-card">
                  <div className="rec-priority">Priority {idx + 1}</div>
                  <div className="rec-service">{rec.service} (${rec.price})</div>
                  <div className="rec-roi">Expected Outcome: {rec.expected_outcome}</div>
                  <div className="rec-rationale">{rec.rationale}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Jorge's Validation (10 min) */}
          <div className="form-group">
            <label><strong>👨‍💼 Jorge: Business Context Validation (10 min)</strong></label>
            <p className="form-helper-text">
              Review AI findings with client conversation context:<br/>
              • Do recommendations align with client priorities from intake call?<br/>
              • Any quick wins AI missed based on Mexico market knowledge?<br/>
              • Timeline/urgency adjustments needed?<br/>
              • Budget reality check on recommended services
            </p>
            <textarea
              className="form-input"
              rows="6"
              value={jorgeValidation}
              onChange={(e) => setJorgeValidation(e.target.value)}
              placeholder="Example:

✅ AI ACCURATE: Supplier Sourcing priority aligns with client's stated concern about China dependency

💡 ADDITIONAL INSIGHT: Client mentioned Q3 2025 Mexico facility plans - bump Market Entry priority to help with location selection

⏱️ TIMING: Client has Q4 budget freeze - recommend USMCA Optimization ($175) now, defer larger services to Q1

💰 QUICK WIN: Based on textile volume, they qualify for Mexico PROSEC program - will mention in follow-up"
            />
          </div>

          {/* Cristina's Validation (20 min) */}
          <div className="form-group">
            <label><strong>👩‍💼 Cristina: Technical Compliance Validation (20 min)</strong></label>
            <p className="form-helper-text">
              Validate AI compliance analysis with customs expertise:<br/>
              • Verify USMCA calculations and thresholds<br/>
              • Catch HS code classification errors<br/>
              • Add regulatory nuances and enforcement trends<br/>
              • Technical corrections for client report
            </p>
            <textarea
              className="form-input"
              rows="6"
              value={cristinaValidation}
              onChange={(e) => setCristinaValidation(e.target.value)}
              placeholder="Example:

✅ AI CORRECT: USMCA 30% vs 55% gap calculation accurate for textiles (yarn-forward rule)

⚠️ CORRECTION: India cotton has GSP duty reduction - actual duty is 5.2% not 8.3%. Adjust savings calc.

🚨 REGULATORY FLAG: New textile labor rules Q3 2025 will disqualify India sourcing - creates urgency for Mexico transition

📋 HIGH RISK: Missing origin certificates for claimed Mexico content - immediate customs audit exposure"
            />
          </div>

          <div className="workflow-stage-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Complete Validation → Generate Report'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
