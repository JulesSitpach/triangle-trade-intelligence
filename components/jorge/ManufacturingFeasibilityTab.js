import { useState } from 'react';

export default function ManufacturingFeasibilityTab({ requests = [], onRequestUpdate }) {
  const [workflowModal, setWorkflowModal] = useState({
    isOpen: false,
    request: null,
    currentStage: 1,
    formData: {},
    collectedData: {
      manufacturingContext: null,
      aiAnalysis: null,
      jorgeRecommendation: null
    }
  });

  const startFeasibilityWorkflow = (request) => {
    setWorkflowModal({
      isOpen: true,
      request: request,
      currentStage: 1,
      formData: {},
      collectedData: {
        manufacturingContext: null,
        aiAnalysis: null,
        jorgeRecommendation: null
      }
    });
  };

  const closeModal = () => {
    setWorkflowModal({
      isOpen: false,
      request: null,
      currentStage: 1,
      formData: {},
      collectedData: {
        manufacturingContext: null,
        aiAnalysis: null,
        jorgeRecommendation: null
      }
    });
  };

  const handleStageComplete = async () => {
    const { currentStage, formData, request } = workflowModal;

    if (currentStage === 1) {
      // Stage 1: Manufacturing Context collected
      setWorkflowModal(prev => ({
        ...prev,
        collectedData: {
          ...prev.collectedData,
          manufacturingContext: formData
        },
        currentStage: 2
      }));
    } else if (currentStage === 2) {
      // Stage 2: AI Analysis
      try {
        console.log('🤖 Running AI analysis with subscriber data + context...');

        const analysisData = {
          subscriber_data: request.subscriber_data || {},
          manufacturing_context: workflowModal.collectedData.manufacturingContext,
          service_type: 'manufacturing_feasibility'
        };

        const response = await fetch('/api/manufacturing-feasibility-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analysisData)
        });

        const aiResult = await response.json();

        setWorkflowModal(prev => ({
          ...prev,
          collectedData: {
            ...prev.collectedData,
            aiAnalysis: aiResult
          },
          currentStage: 3
        }));

      } catch (error) {
        console.error('AI Analysis error:', error);
        alert('Error running AI analysis. Please try again.');
      }
    } else if (currentStage === 3) {
      // Stage 3: Jorge's final recommendation
      const finalData = {
        ...workflowModal.collectedData,
        jorgeRecommendation: formData
      };

      // Mark service as completed
      if (onRequestUpdate) {
        onRequestUpdate(request.id, {
          status: 'completed',
          feasibility_data: finalData,
          completed_at: new Date().toISOString()
        });
      }

      alert('✅ Manufacturing Feasibility analysis completed!');
      closeModal();
    }
  };

  return (
    <div className="service-tab">
      <div className="service-header">
        <h3>🏭 Manufacturing Feasibility ($650)</h3>
        <p>3-stage workflow: Context → AI Analysis → Jorge's Recommendation</p>
      </div>

      {/* Service Requests */}
      <div className="service-requests">
        {requests?.filter(r => r.service_type === 'Manufacturing Feasibility').map((request) => (
          <div key={request.id} className="service-request">
            <h4>Manufacturing Feasibility - {request.company_name}</h4>
            <div className="request-details">
              <p><strong>Product:</strong> {request.service_details?.product_description}</p>
              <p><strong>Trade Volume:</strong> {request.service_details?.volume}</p>
              <p><strong>Current Challenges:</strong> {request.service_details?.current_challenges}</p>
              <p><strong>Status:</strong> {request.status}</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => startFeasibilityWorkflow(request)}
              disabled={request.status === 'completed'}
            >
              {request.status === 'completed' ? 'Completed' : 'Start Feasibility Analysis'}
            </button>
          </div>
        ))}

        {requests?.filter(r => r.service_type === 'manufacturing-feasibility').length === 0 && (
          <div className="no-requests">
            <p>No manufacturing feasibility requests pending.</p>
          </div>
        )}
      </div>

      {/* Workflow Modal */}
      {workflowModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content workflow-modal">
            <div className="modal-header">
              <h2>Manufacturing Feasibility Analysis</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="stage-progress">
              <div className={`stage ${workflowModal.currentStage >= 1 ? 'active' : ''}`}>1. Context</div>
              <div className={`stage ${workflowModal.currentStage >= 2 ? 'active' : ''}`}>2. AI Analysis</div>
              <div className={`stage ${workflowModal.currentStage >= 3 ? 'active' : ''}`}>3. Recommendation</div>
            </div>

            <div className="stage-content">
              {workflowModal.currentStage === 1 && (
                <div>
                  <h3>Stage 1: Manufacturing Context</h3>
                  <p>Using your USMCA workflow data + manufacturing-specific context</p>

                  {/* Subscriber Data Summary */}
                  <div className="subscriber-summary">
                    <h4>📊 Your Business Profile</h4>
                    <div className="data-grid">
                      <div><strong>Company:</strong> {workflowModal.request?.client_info?.company}</div>
                      <div><strong>Product:</strong> {workflowModal.request?.subscriber_data?.product_description}</div>
                      <div><strong>Trade Volume:</strong> {workflowModal.request?.subscriber_data?.trade_volume}</div>
                      <div><strong>Current Location:</strong> {workflowModal.request?.subscriber_data?.manufacturing_location}</div>
                    </div>
                  </div>

                  {/* Manufacturing Context Questions */}
                  <div className="context-questions">
                    <h4>🏭 Manufacturing Context (5 questions)</h4>

                    <div className="form-group">
                      <label>Why considering Mexico move?</label>
                      <input
                        type="text"
                        value={workflowModal.formData.why_mexico || ''}
                        onChange={(e) => setWorkflowModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, why_mexico: e.target.value }
                        }))}
                        placeholder="e.g., Reduce costs by 30%, USMCA tariff savings, diversify from China risks"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Current manufacturing challenges?</label>
                      <input
                        type="text"
                        value={workflowModal.formData.challenges || ''}
                        onChange={(e) => setWorkflowModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, challenges: e.target.value }
                        }))}
                        placeholder="e.g., Labor costs $25/hr, 25% tariffs, 3-week shipping delays"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Timeline expectations?</label>
                      <input
                        type="text"
                        value={workflowModal.formData.timeline || ''}
                        onChange={(e) => setWorkflowModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, timeline: e.target.value }
                        }))}
                        placeholder="e.g., Need operational by Q2 2025, lease expires Dec 2024"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Quality certifications required?</label>
                      <input
                        type="text"
                        value={workflowModal.formData.certifications || ''}
                        onChange={(e) => setWorkflowModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, certifications: e.target.value }
                        }))}
                        placeholder="e.g., ISO 9001 + IATF 16949, FDA Part 820, UL listing"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Budget range for setup?</label>
                      <input
                        type="text"
                        value={workflowModal.formData.budget || ''}
                        onChange={(e) => setWorkflowModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, budget: e.target.value }
                        }))}
                        placeholder="e.g., $2-5M for equipment + facility, $500K lean start"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="stage-actions">
                    <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                    <button
                      className="btn-primary"
                      onClick={handleStageComplete}
                      disabled={!workflowModal.formData.why_mexico?.trim() || !workflowModal.formData.timeline?.trim()}
                    >
                      Start AI Analysis →
                    </button>
                  </div>
                </div>
              )}

              {workflowModal.currentStage === 2 && (
                <div>
                  <h3>Stage 2: AI Analysis</h3>
                  <p>AI analyzing locations based on your data + manufacturing context</p>

                  {workflowModal.collectedData.aiAnalysis ? (
                    <div className="ai-analysis-results">
                      <h4>🤖 AI Analysis Complete</h4>
                      <div className="analysis-summary">
                        <p><strong>Locations Found:</strong> {workflowModal.collectedData.aiAnalysis.locations_identified || 'Multiple options'}</p>
                        <p><strong>Cost Estimates:</strong> Available</p>
                        <p><strong>Feasibility Score:</strong> {workflowModal.collectedData.aiAnalysis.overall_feasibility_score || 'Calculated'}</p>
                      </div>

                      <div className="stage-actions">
                        <button
                          className="btn-primary"
                          onClick={handleStageComplete}
                        >
                          Continue to Jorge's Review →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="analysis-loading">
                      <p>🔄 AI analyzing Mexico manufacturing locations...</p>
                      <p>This typically takes 30-60 seconds.</p>
                    </div>
                  )}
                </div>
              )}

              {workflowModal.currentStage === 3 && (
                <div>
                  <h3>Stage 3: Jorge's Recommendation</h3>
                  <p>Jorge reviews AI analysis + adds local knowledge</p>

                  {/* AI Analysis Summary */}
                  {workflowModal.collectedData.aiAnalysis && (
                    <div className="ai-summary">
                      <h4>📊 AI Analysis Summary</h4>
                      <p>{workflowModal.collectedData.aiAnalysis.summary || 'Analysis completed successfully'}</p>
                    </div>
                  )}

                  {/* Jorge's Final Recommendation */}
                  <div className="jorge-recommendation">
                    <h4>🎯 Jorge's Final Recommendation</h4>

                    <div className="form-group">
                      <label>Overall Recommendation</label>
                      <select
                        value={workflowModal.formData.final_recommendation || ''}
                        onChange={(e) => setWorkflowModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, final_recommendation: e.target.value }
                        }))}
                        className="form-input"
                      >
                        <option value="">Select recommendation...</option>
                        <option value="highly_recommended">HIGHLY RECOMMENDED - Strong business case</option>
                        <option value="recommended">RECOMMENDED - Good opportunity</option>
                        <option value="conditional">CONDITIONAL - Feasible with requirements</option>
                        <option value="not_recommended">NOT RECOMMENDED - Significant barriers</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Best Location & Why</label>
                      <textarea
                        value={workflowModal.formData.best_location || ''}
                        onChange={(e) => setWorkflowModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, best_location: e.target.value }
                        }))}
                        placeholder="e.g., Tijuana - proximity to US, electronics cluster, skilled labor pool"
                        className="form-input"
                        rows={3}
                      />
                    </div>

                    <div className="form-group">
                      <label>Cost Estimate & Savings</label>
                      <textarea
                        value={workflowModal.formData.cost_estimate || ''}
                        onChange={(e) => setWorkflowModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, cost_estimate: e.target.value }
                        }))}
                        placeholder="e.g., Setup: $2-3M, Annual savings: $1.5M (30% vs current), ROI: 18 months"
                        className="form-input"
                        rows={3}
                      />
                    </div>

                    <div className="form-group">
                      <label>Next Steps (2-3 specific actions)</label>
                      <textarea
                        value={workflowModal.formData.next_steps || ''}
                        onChange={(e) => setWorkflowModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, next_steps: e.target.value }
                        }))}
                        placeholder="e.g., 1) Site visit Tijuana Q1, 2) Meet with Jorge's facility contact Maria Gonzalez, 3) IMMEX permit application"
                        className="form-input"
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="stage-actions">
                    <button className="btn-secondary" onClick={() => setWorkflowModal(prev => ({...prev, currentStage: 2}))}>
                      ← Back to AI Analysis
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleStageComplete}
                      disabled={!workflowModal.formData.final_recommendation || !workflowModal.formData.next_steps?.trim()}
                    >
                      Complete Analysis & Generate PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}