import { useState } from 'react';

export default function USMCACertificateTab({ requests = [], onRequestUpdate }) {
  const [workflowModal, setWorkflowModal] = useState({
    isOpen: false,
    request: null,
    currentStage: 1,
    formData: {},
    collectedData: {
      dataReview: null,
      certificateGenerated: null
    }
  });

  const startCertificateWorkflow = (request) => {
    setWorkflowModal({
      isOpen: true,
      request: request,
      currentStage: 1,
      formData: {},
      collectedData: {
        dataReview: null,
        certificateGenerated: null
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
        dataReview: null,
        certificateGenerated: null
      }
    });
  };

  const handleStageComplete = async () => {
    const { currentStage, request } = workflowModal;

    if (currentStage === 1) {
      // Stage 1: Data Review completed
      setWorkflowModal(prev => ({
        ...prev,
        collectedData: {
          ...prev.collectedData,
          dataReview: 'confirmed'
        },
        currentStage: 2
      }));
    } else if (currentStage === 2) {
      // Stage 2: Certificate Generation
      try {
        console.log('🤖 Generating USMCA certificate...');

        const certificateData = {
          subscriber_data: request.service_details || {},
          service_type: 'usmca_certificate'
        };

        const response = await fetch('/api/generate-usmca-certificate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(certificateData)
        });

        const result = await response.json();

        if (result.success) {
          // Mark service as completed
          if (onRequestUpdate) {
            onRequestUpdate(request.id, {
              status: 'completed',
              certificate_data: result,
              completed_at: new Date().toISOString()
            });
          }

          alert('✅ USMCA Certificate generated successfully!');
          closeModal();
        } else {
          alert('❌ Certificate generation failed: ' + (result.error || 'Unknown error'));
        }

      } catch (error) {
        console.error('Certificate generation error:', error);
        alert('Error generating certificate. Please try again.');
      }
    }
  };

  return (
    <div className="service-tab">
      <div className="service-header">
        <h3>📜 USMCA Certificates ($250)</h3>
        <p>2-stage workflow: Data Review → Certificate Generation</p>
      </div>

      {/* Service Requests Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Product</th>
              <th>Origin</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests?.filter(r => r.service_type === 'USMCA Certificates' || r.service_type === 'usmca-certificate').map((request) => (
              <tr key={request.id}>
                <td>
                  <div className="client-info">
                    <strong>{request.company_name}</strong>
                    <div className="contact-name">{request.contact_name}</div>
                  </div>
                </td>
                <td>{request.service_details?.product_description || 'Product details'}</td>
                <td>{request.service_details?.manufacturing_location || 'Location'}</td>
                <td>
                  <span className={`status-badge ${request.status?.replace('_', '-')}`}>
                    {request.status?.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-primary"
                    onClick={() => startCertificateWorkflow(request)}
                    disabled={request.status === 'completed'}
                  >
                    {request.status === 'completed' ? 'Completed' : 'Start Certificate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {requests?.filter(r => r.service_type === 'USMCA Certificates' || r.service_type === 'usmca-certificate').length === 0 && (
          <div className="no-requests">
            <p>No USMCA certificate requests pending.</p>
            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Requests will appear here when clients submit USMCA certificate service requests.
            </p>
          </div>
        )}
      </div>

      {/* Workflow Modal */}
      {workflowModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content workflow-modal">
            <div className="modal-header">
              <h2>USMCA Certificate Generation</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="stage-progress">
              <div className={`stage ${workflowModal.currentStage >= 1 ? 'active' : ''}`}>1. Data Review</div>
              <div className={`stage ${workflowModal.currentStage >= 2 ? 'active' : ''}`}>2. Certificate</div>
            </div>

            <div className="stage-content">
              {workflowModal.currentStage === 1 && (
                <div>
                  <h3>Stage 1: Data Review</h3>
                  <p>Review existing subscriber data - no new forms needed</p>

                  {/* Subscriber Data Summary */}
                  <div className="subscriber-summary">
                    <h4>📊 Client Business Profile</h4>
                    <div className="data-grid">
                      <div><strong>Company:</strong> {workflowModal.request?.company_name}</div>
                      <div><strong>Product:</strong> {workflowModal.request?.service_details?.product_description}</div>
                      <div><strong>Trade Volume:</strong> {workflowModal.request?.service_details?.volume}</div>
                      <div><strong>Origin:</strong> {workflowModal.request?.service_details?.manufacturing_location}</div>
                    </div>
                  </div>

                  <div className="stage-actions">
                    <button className="btn-secondary" onClick={closeModal}>Cancel</button>
                    <button
                      className="btn-primary"
                      onClick={handleStageComplete}
                    >
                      Data looks good - Generate Certificate →
                    </button>
                  </div>
                </div>
              )}

              {workflowModal.currentStage === 2 && (
                <div>
                  <h3>Stage 2: Certificate Generation</h3>
                  <p>Enhanced Classification Agent processing subscriber data...</p>

                  <div className="certificate-generation">
                    <p>🔄 Generating USMCA Certificate of Origin...</p>
                    <p>This typically takes 30-60 seconds.</p>

                    <div className="generation-steps">
                      <p>✓ Validating product classification</p>
                      <p>✓ Checking North American content rules</p>
                      <p>✓ Generating compliance documentation</p>
                      <p>🔄 Creating PDF certificate...</p>
                    </div>
                  </div>

                  <div className="stage-actions">
                    <button
                      className="btn-primary"
                      onClick={handleStageComplete}
                    >
                      Complete & Download Certificate
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