import { useState } from 'react';

export default function CrisisResponseTab({ requests = [], onRequestUpdate }) {
  const [workflowModal, setWorkflowModal] = useState({
    isOpen: false,
    request: null,
    currentStage: 1,
    formData: {},
    collectedData: {
      crisisDescription: null,
      aiAnalysis: null,
      actionPlan: null
    }
  });

  const startCrisisWorkflow = (request) => {
    setWorkflowModal({
      isOpen: true,
      request: request,
      currentStage: 1,
      formData: {},
      collectedData: {
        crisisDescription: null,
        aiAnalysis: null,
        actionPlan: null
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
        crisisDescription: null,
        aiAnalysis: null,
        actionPlan: null
      }
    });
  };

  const handleStageComplete = async () => {
    const { currentStage, formData, request } = workflowModal;

    if (currentStage === 1) {
      // Stage 1: Crisis Description collected
      setWorkflowModal(prev => ({
        ...prev,
        collectedData: {
          ...prev.collectedData,
          crisisDescription: formData
        },
        currentStage: 2
      }));
    } else if (currentStage === 2) {
      // Stage 2: AI Analysis
      try {
        console.log('🤖 Running crisis analysis...');

        const analysisData = {
          subscriber_data: request.service_details || {},
          crisis_description: workflowModal.collectedData.crisisDescription,
          service_type: 'crisis_response'
        };

        const response = await fetch('/api/crisis-response-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analysisData)
        });

        const result = await response.json();

        setWorkflowModal(prev => ({
          ...prev,
          collectedData: {
            ...prev.collectedData,
            aiAnalysis: result
          },
          currentStage: 3
        }));

      } catch (error) {
        console.error('Crisis analysis error:', error);
        alert('Error running crisis analysis. Please try again.');
      }
    } else if (currentStage === 3) {
      // Stage 3: Action Plan completed
      const finalData = {
        ...workflowModal.collectedData,
        actionPlan: formData
      };

      // Mark service as completed
      if (onRequestUpdate) {
        onRequestUpdate(request.id, {
          status: 'completed',
          crisis_data: finalData,
          completed_at: new Date().toISOString()
        });
      }

      alert('✅ Crisis Response plan completed!');
      closeModal();
    }
  };

  return (
    <div className="service-tab">
      <div className="service-header">
        <h3>🚨 Crisis Response ($500)</h3>
        <p>3-stage workflow: Crisis Description → Analysis → Action Plan</p>
      </div>

      {/* Service Requests Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Trade Volume</th>
              <th>Risk Factors</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests?.filter(r => r.service_type === 'Crisis Response').map((request) => (
              <tr key={request.id}>
                <td>
                  <div className="client-info">
                    <strong>{request.company_name}</strong>
                    <div className="contact-name">{request.contact_name}</div>
                  </div>
                </td>
                <td>{request.service_details?.volume || request.trade_volume ? `$${(request.trade_volume/1000000).toFixed(1)}M` : 'N/A'}</td>
                <td>{request.service_details?.risk_factors || 'Trade disruption'}</td>
                <td>
                  <span className={`status-badge ${request.status?.replace('_', '-')}`}>
                    {request.status?.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-primary"
                    onClick={() => startCrisisWorkflow(request)}
                    disabled={request.status === 'completed'}
                  >
                    {request.status === 'completed' ? 'Completed' : 'Start Crisis Analysis'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {requests?.filter(r => r.service_type === 'Crisis Response').length === 0 && (
          <div className="no-requests">
            <p>No crisis response requests pending.</p>
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Requests will appear here when clients submit crisis response service requests.
            </p>
          </div>
        )}
      </div>

      {/* Workflow Modal */}
      {workflowModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content workflow-modal">
            <div className="modal-header">
              <h2>Crisis Response Management</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="stage-progress">
              <div className={`stage ${workflowModal.currentStage >= 1 ? 'active' : ''}`}>1. Crisis Description</div>
              <div className={`stage ${workflowModal.currentStage >= 2 ? 'active' : ''}`}>2. Analysis</div>
              <div className={`stage ${workflowModal.currentStage >= 3 ? 'active' : ''}`}>3. Action Plan</div>
            </div>

            <div className="stage-content">
              {workflowModal.currentStage === 1 && (
                <div>
                  <h3>Stage 1: Crisis Description</h3>
                  <p>Describe the crisis situation for targeted analysis</p>

                  {/* Subscriber Data Summary */}
                  <div className="subscriber-summary">
                    <h4>📊 Client Trade Profile</h4>
                    <div className="data-grid">
                      <div><strong>Company:</strong> {workflowModal.request?.company_name}</div>
                      <div><strong>Trade Volume:</strong> {workflowModal.request?.service_details?.volume}</div>
                      <div><strong>Industry:</strong> {workflowModal.request?.industry}</div>
                    </div>
                  </div>

                  {/* Crisis Description Questions */}
                  <div className="context-questions">
                    <h4>🚨 Crisis Details (4 questions)</h4>

                    <div className="form-group">
                      <label>What crisis occurred?</label>
                      <input
                        type="text"
                        value={workflowModal.formData.crisis_type || ''}
                        onChange={(e) => setWorkflowModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, crisis_type: e.target.value }
                        }))}
                        placeholder="e.g., Sudden tariff increase, supply chain disruption, trade war escalation"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>When did it happen?</label>
                      <input
                        type="text"
                        value={workflowModal.formData.timeline || ''}
                        onChange={(e) => setWorkflowModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, timeline: e.target.value }
                        }))}
                        placeholder="e.g., Yesterday morning, Last week, This month"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Current impact on operations?</label>
                      <textarea
                        value={workflowModal.formData.current_impact || ''}
                        onChange={(e) => setWorkflowModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, current_impact: e.target.value }
                        }))}
                        placeholder="e.g., 50% cost increase, shipments delayed 2 weeks, can't access key suppliers"
                        className="form-input"
                        rows={3}
                      />
                    </div>

                    <div className="form-group">
                      <label>Immediate concerns?</label>
                      <textarea
                        value={workflowModal.formData.immediate_concerns || ''}
                        onChange={(e) => setWorkflowModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, immediate_concerns: e.target.value }
                        }))}
                        placeholder="e.g., Customer contracts at risk, cash flow impact, need alternative routes by Friday"
                        className="form-input"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="stage-actions">
                    <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                    <button
                      className="btn-primary"
                      onClick={handleStageComplete}
                      disabled={!workflowModal.formData.crisis_type?.trim() || !workflowModal.formData.current_impact?.trim()}
                    >
                      Start AI Analysis →
                    </button>
                  </div>
                </div>
              )}

              {workflowModal.currentStage === 2 && (
                <div>
                  <h3>Stage 2: AI Analysis</h3>
                  <p>AI analyzing crisis impact based on trade profile + situation</p>

                  {workflowModal.collectedData.aiAnalysis ? (
                    <div className="ai-analysis-results">
                      <h4>🤖 AI Analysis Complete</h4>
                      <div className="analysis-summary">
                        <p><strong>Impact Assessment:</strong> {workflowModal.collectedData.aiAnalysis.impact_level || 'High severity'}</p>
                        <p><strong>Resolution Timeline:</strong> {workflowModal.collectedData.aiAnalysis.timeline || '24-48 hours'}</p>
                        <p><strong>Recommended Actions:</strong> {workflowModal.collectedData.aiAnalysis.action_count || '5'} immediate steps identified</p>
                      </div>

                      <div className="stage-actions">
                        <button
                          className="btn-primary"
                          onClick={handleStageComplete}
                        >
                          Continue to Action Plan →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="analysis-loading">
                      <p>🔄 AI analyzing crisis situation...</p>
                      <p>This typically takes 30-60 seconds.</p>
                    </div>
                  )}
                </div>
              )}

              {workflowModal.currentStage === 3 && (
                <div>
                  <h3>Stage 3: Action Plan</h3>
                  <p>Cristina creates specific action plan with timeline</p>

                  {/* AI Analysis Summary */}
                  {workflowModal.collectedData.aiAnalysis && (
                    <div className="ai-summary">
                      <h4>📊 AI Analysis Summary</h4>
                      <p>{workflowModal.collectedData.aiAnalysis.summary || 'Crisis analysis completed successfully'}</p>
                    </div>
                  )}

                  {/* Crisis Action Plan */}
                  <div className="action-plan">
                    <h4>📋 Cristina's Action Plan</h4>

                    <div className="form-group">
                      <label>Immediate Actions (24 hours)</label>
                      <textarea
                        value={workflowModal.formData.immediate_actions || ''}
                        onChange={(e) => setWorkflowModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, immediate_actions: e.target.value }
                        }))}
                        placeholder="e.g., 1) Contact alternative suppliers, 2) File emergency exemption request, 3) Notify key customers"
                        className="form-input"
                        rows={4}
                      />
                    </div>

                    <div className="form-group">
                      <label>Short-term Resolution (1-2 weeks)</label>
                      <textarea
                        value={workflowModal.formData.short_term_plan || ''}
                        onChange={(e) => setWorkflowModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, short_term_plan: e.target.value }
                        }))}
                        placeholder="e.g., Negotiate new supplier contracts, adjust pricing with customers, file trade remedy petitions"
                        className="form-input"
                        rows={4}
                      />
                    </div>

                    <div className="form-group">
                      <label>Prevention Measures</label>
                      <textarea
                        value={workflowModal.formData.prevention_measures || ''}
                        onChange={(e) => setWorkflowModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, prevention_measures: e.target.value }
                        }))}
                        placeholder="e.g., Diversify supplier base, monitor trade alerts, establish contingency contracts"
                        className="form-input"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="stage-actions">
                    <button className="btn-secondary" onClick={() => setWorkflowModal(prev => ({...prev, currentStage: 2}))}>
                      ← Back to Analysis
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleStageComplete}
                      disabled={!workflowModal.formData.immediate_actions?.trim() || !workflowModal.formData.short_term_plan?.trim()}
                    >
                      Complete & Generate Action Plan PDF
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