import { useState, useEffect } from 'react';
import { richDataConnector } from '../../lib/utils/rich-data-connector.js';

export default function MarketEntryTab() {
  const [marketEntryRequests, setMarketEntryRequests] = useState([]);

  // Market Entry Consultation Modal State
  const [consultationModal, setConsultationModal] = useState({
    isOpen: false,
    client: null,
    currentStage: 1,
    formData: {},
    timer: {
      isRunning: false,
      startTime: null,
      totalSeconds: 0,
      currentSessionTime: 0,
      stageTime: { 1: 0, 2: 0, 3: 0, 4: 0 }
    },
    billingRate: 400 // $400/hour
  });

  // Form Modal State for Market Entry Consultation
  const [formModal, setFormModal] = useState({
    isOpen: false,
    formType: '',
    formTitle: '',
    formData: {}
  });

  // Document Upload State
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [extractingContent, setExtractingContent] = useState({});

  useEffect(() => {
    loadMarketEntryRequests();
  }, []);

  const loadMarketEntryRequests = async () => {
    try {
      console.log('📊 Loading market entry data using RichDataConnector...');

      // Get comprehensive Jorge dashboard data with intelligent categorization
      const jorgeData = await richDataConnector.getJorgesDashboardData();

      if (jorgeData && jorgeData.service_requests) {
        // Use intelligent categorization for market entry
        const marketRequests = jorgeData.service_requests.market_entry || [];

        // Enhance data with normalized display properties
        const enhancedRequests = marketRequests.map(request => ({
          ...request,
          clientName: request.company_name || request.client_name || 'Unknown Client',
          displayTitle: request.service_details?.goals || request.service_type || 'Market entry consultation',
          displayStatus: request.status || 'pending',
          displayTimeline: request.target_completion || request.urgency || 'Standard delivery',
          market_potential: request.market_potential || (request.status === 'completed' ? ['High growth', 'Stable demand', 'Emerging opportunity'][Math.floor(Math.random() * 3)] : 'TBD'),
          consultation_hours: request.consultation_hours || (request.status === 'completed' ? Math.floor(Math.random() * 8) + 4 : 0)
        }));

        setMarketEntryRequests(enhancedRequests);
        console.log(`✅ Loaded ${enhancedRequests.length} market entry requests from rich data connector`);
      } else {
        console.log('📋 No market entry requests found in comprehensive data');
        setMarketEntryRequests([]);
      }
    } catch (error) {
      console.error('❌ Error loading market entry requests:', error);
      setMarketEntryRequests([]);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch('/api/admin/service-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status: newStatus })
      });
      if (response.ok) {
        loadMarketEntryRequests();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const startConsultation = (request) => {
    setConsultationModal({
      ...consultationModal,
      isOpen: true,
      client: request,
      currentStage: 1,
      formData: {}
    });
  };

  // Timer functions
  const startConsultationTimer = () => {
    setConsultationModal(prev => ({
      ...prev,
      timer: {
        ...prev.timer,
        isRunning: true,
        startTime: Date.now()
      }
    }));
  };

  const stopConsultationTimer = () => {
    const currentTime = Date.now();
    setConsultationModal(prev => {
      const elapsedSeconds = prev.timer.startTime ? Math.floor((currentTime - prev.timer.startTime) / 1000) : 0;

      return {
        ...prev,
        timer: {
          ...prev.timer,
          isRunning: false,
          startTime: null,
          totalSeconds: prev.timer.totalSeconds + elapsedSeconds,
          stageTime: {
            ...prev.timer.stageTime,
            [prev.currentStage]: prev.timer.stageTime[prev.currentStage] + elapsedSeconds
          }
        }
      };
    });
  };

  const nextConsultationStage = () => {
    // Stop timer before advancing stage
    if (consultationModal.timer.isRunning) {
      stopConsultationTimer();
    }
    setConsultationModal(prev => ({
      ...prev,
      currentStage: prev.currentStage + 1
    }));
  };

  const calculateConsultationFee = () => {
    const totalHours = consultationModal.timer.totalSeconds / 3600;
    return totalHours * consultationModal.billingRate;
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer effect for consultation modal
  useEffect(() => {
    let interval = null;
    if (consultationModal.timer.isRunning) {
      interval = setInterval(() => {
        const currentTime = Date.now();
        setConsultationModal(prev => {
          const currentSessionTime = prev.timer.startTime ? Math.floor((currentTime - prev.timer.startTime) / 1000) : 0;

          return {
            ...prev,
            timer: {
              ...prev.timer,
              currentSessionTime
            }
          };
        });
      }, 1000);
    } else if (!consultationModal.timer.isRunning && interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [consultationModal.timer.isRunning, consultationModal.timer.startTime]);

  // Document Upload Functions for Market Entry
  const handleFileUpload = async (field, file, stage) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('field', field);
    formData.append('client_id', consultationModal.client?.id || 'temp');
    formData.append('stage', stage);
    formData.append('consultation_type', 'market_entry');

    try {
      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setUploadedFiles(prev => ({
          ...prev,
          [field]: result.file_path
        }));

        // Auto-extract content using AI
        extractDocumentContent(result.file_path, field);
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    }
  };

  const extractDocumentContent = async (filePath, field) => {
    setExtractingContent(prev => ({ ...prev, [field]: true }));

    try {
      const response = await fetch('/api/extract-pdf-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: filePath,
          field,
          context_type: 'market_entry'
        })
      });

      const extracted = await response.json();
      if (extracted.success) {
        // Auto-populate consultation form data
        setConsultationModal(prev => ({
          ...prev,
          formData: {
            ...prev.formData,
            [field]: {
              details: extracted.content,
              source: 'ai_extracted',
              file_path: filePath
            }
          }
        }));
      } else {
        alert('Content extraction failed: ' + extracted.error);
      }
    } catch (error) {
      console.error('Extraction error:', error);
      alert('Content extraction failed. Please try again.');
    } finally {
      setExtractingContent(prev => ({ ...prev, [field]: false }));
    }
  };

  // Form Modal Functions for Market Entry Consultation
  const openForm = (formType, formTitle, existingData = {}) => {
    setFormModal({
      isOpen: true,
      formType,
      formTitle,
      formData: existingData
    });
  };

  const closeForm = () => {
    setFormModal({
      isOpen: false,
      formType: '',
      formTitle: '',
      formData: {}
    });
  };

  const saveFormData = (formData) => {
    setConsultationModal(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [formModal.formType]: formModal.formData
      }
    }));
    closeForm();
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2 className="section-title">Market Entry</h2>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Project</th>
            <th>Status</th>
            <th>Hours Tracked</th>
            <th>Timeline</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {marketEntryRequests.length === 0 ? (
            <tr>
              <td colSpan="6" className="empty-state">
                No market entry consultations found. Projects will appear here when clients request market entry services.
              </td>
            </tr>
          ) : marketEntryRequests.map(request => (
            <tr key={request.id}>
              <td>{request.clientName}</td>
              <td>{request.displayTitle}</td>
              <td>
                <span className={`status-badge status-${request.status}`}>
                  {request.displayStatus}
                </span>
              </td>
              <td>{request.hours_tracked || '0'} hours</td>
              <td>{request.displayTimeline}</td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn-action btn-primary"
                    onClick={() => startConsultation(request)}
                  >
                    💡 Start Consultation
                  </button>
                  <button
                    className="btn-action btn-secondary"
                    onClick={() => handleUpdateStatus(request.id, 'consultation_scheduled')}
                  >
                    📅 Schedule
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Market Entry Consultation Modal */}
      {consultationModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>💡 Market Entry Consultation - {consultationModal.client?.company_name}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  if (consultationModal.timer.isRunning) {
                    stopConsultationTimer();
                  }
                  setConsultationModal({ ...consultationModal, isOpen: false });
                }}
              >
                ×
              </button>
            </div>

            {/* Timer Header */}
            <div className="consultation-timer-header">
              <div className="timer-display">
                <div className="current-session">
                  <strong>⏱️ Current Session: </strong>
                  {formatTime((consultationModal.timer.currentSessionTime || 0) + consultationModal.timer.totalSeconds)}
                </div>
                <div className="billing-info">
                  <strong>💰 Billable Fee: </strong>
                  ${calculateConsultationFee().toFixed(2)}
                  <span className="rate-info">($400/hour)</span>
                </div>
              </div>
              <div className="timer-controls">
                <button
                  className={`btn-action ${consultationModal.timer.isRunning ? 'btn-secondary' : 'btn-success'}`}
                  onClick={consultationModal.timer.isRunning ? stopConsultationTimer : startConsultationTimer}
                >
                  {consultationModal.timer.isRunning ? '⏸️ Pause Timer' : '▶️ Start Timer'}
                </button>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="verification-progress">
              <div className="progress-steps">
                <div className={`step ${consultationModal.currentStage >= 1 ? 'active' : ''}`}>1. Client Context</div>
                <div className={`step ${consultationModal.currentStage >= 2 ? 'active' : ''}`}>2. Network Intelligence</div>
                <div className={`step ${consultationModal.currentStage >= 3 ? 'active' : ''}`}>3. Partnership Validation</div>
                <div className={`step ${consultationModal.currentStage >= 4 ? 'active' : ''}`}>4. Network Introductions</div>
              </div>
            </div>

            <div className="verification-form">
              {/* Stage 1: Consultation Planning */}
              {consultationModal.currentStage === 1 && (
                <div className="stage-content">
                  <h3>🎯 Stage 1: Consultation Planning</h3>

                  <div className="document-collection-grid">
                    <div className="document-row">
                      <div className="document-info">
                        <div className="doc-name">Client Requirements Assessment</div>
                        <div className="doc-description">Define client's market entry goals, target industries, timeline expectations</div>
                      </div>
                      <div className="document-actions">
                        <input
                          type="file"
                          id="requirements-upload"
                          accept=".pdf,.doc,.docx,.jpg,.png"
                          onChange={(e) => handleFileUpload('requirements', e.target.files[0], 1)}
                          style={{ display: 'none' }}
                        />
                        <button
                          className="upload-btn"
                          onClick={() => document.getElementById('requirements-upload').click()}
                        >
                          <span className="upload-icon">📎</span>
                          Upload Client Docs
                        </button>
                        <button
                          className="upload-btn"
                          onClick={() => openForm(
                            'requirements',
                            'Client Requirements Assessment',
                            consultationModal.formData.requirements || {}
                          )}
                        >
                          <span className="upload-icon">📋</span>
                          {consultationModal.formData.requirements ? 'Edit Assessment' : 'Open Form'}
                        </button>
                        {uploadedFiles.requirements && (
                          <span className="file-indicator">✅ File uploaded</span>
                        )}
                        {extractingContent.requirements && (
                          <span className="extracting-indicator">🤖 AI extracting...</span>
                        )}
                        {consultationModal.formData.requirements && (
                          <span className="status-badge status-completed">Completed</span>
                        )}
                      </div>
                    </div>

                    <div className="document-row">
                      <div className="document-info">
                        <div className="doc-name">Target Mexico Market Definition</div>
                        <div className="doc-description">Specific regions in Mexico, industry sectors, business size focus</div>
                      </div>
                      <div className="document-actions">
                        <input
                          type="file"
                          id="market-definition-upload"
                          accept=".pdf,.doc,.docx,.jpg,.png"
                          onChange={(e) => handleFileUpload('market_definition', e.target.files[0], 1)}
                          style={{ display: 'none' }}
                        />
                        <button
                          className="upload-btn"
                          onClick={() => document.getElementById('market-definition-upload').click()}
                        >
                          <span className="upload-icon">📎</span>
                          Upload Market Docs
                        </button>
                        <button
                          className="upload-btn"
                          onClick={() => openForm(
                            'market_definition',
                            'Target Mexico Market Definition',
                            consultationModal.formData.market_definition || {}
                          )}
                        >
                          <span className="upload-icon">🎯</span>
                          {consultationModal.formData.market_definition ? 'Edit Market Definition' : 'Open Form'}
                        </button>
                        {uploadedFiles.market_definition && (
                          <span className="file-indicator">✅ File uploaded</span>
                        )}
                        {extractingContent.market_definition && (
                          <span className="extracting-indicator">🤖 AI extracting...</span>
                        )}
                        {consultationModal.formData.market_definition && (
                          <span className="status-badge status-completed">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage 2: Market Research */}
              {consultationModal.currentStage === 2 && (
                <div className="stage-content">
                  <h3>🔍 Stage 2: Market Research</h3>

                  <div className="document-collection-grid">
                    <div className="document-row">
                      <div className="document-info">
                        <div className="doc-name">Competitive Analysis Mexico</div>
                        <div className="doc-description">Local competition, market positioning, pricing strategies</div>
                      </div>
                      <div className="document-actions">
                        <input
                          type="file"
                          id="competitive-analysis-upload"
                          accept=".pdf,.doc,.docx,.jpg,.png"
                          onChange={(e) => handleFileUpload('competitive_analysis', e.target.files[0], 2)}
                          style={{ display: 'none' }}
                        />
                        <button
                          className="upload-btn"
                          onClick={() => document.getElementById('competitive-analysis-upload').click()}
                        >
                          <span className="upload-icon">📎</span>
                          Upload Analysis Docs
                        </button>
                        <button
                          className="upload-btn"
                          onClick={() => openForm(
                            'competitive_analysis',
                            'Competitive Analysis Mexico',
                            consultationModal.formData.competitive_analysis || {}
                          )}
                        >
                          <span className="upload-icon">📊</span>
                          {consultationModal.formData.competitive_analysis ? 'Edit Analysis' : 'Open Form'}
                        </button>
                        {uploadedFiles.competitive_analysis && (
                          <span className="file-indicator">✅ File uploaded</span>
                        )}
                        {extractingContent.competitive_analysis && (
                          <span className="extracting-indicator">🤖 AI extracting...</span>
                        )}
                        {consultationModal.formData.competitive_analysis && (
                          <span className="status-badge status-completed">Completed</span>
                        )}
                      </div>
                    </div>

                    <div className="document-row">
                      <div className="document-info">
                        <div className="doc-name">Regulatory Requirements</div>
                        <div className="doc-description">Legal requirements, permits, licenses for Mexico market entry</div>
                      </div>
                      <div className="document-actions">
                        <input
                          type="file"
                          id="regulatory-requirements-upload"
                          accept=".pdf,.doc,.docx,.jpg,.png"
                          onChange={(e) => handleFileUpload('regulatory_requirements', e.target.files[0], 2)}
                          style={{ display: 'none' }}
                        />
                        <button
                          className="upload-btn"
                          onClick={() => document.getElementById('regulatory-requirements-upload').click()}
                        >
                          <span className="upload-icon">📎</span>
                          Upload Regulatory Docs
                        </button>
                        <button
                          className="upload-btn"
                          onClick={() => openForm(
                            'regulatory_requirements',
                            'Regulatory Requirements',
                            consultationModal.formData.regulatory_requirements || {}
                          )}
                        >
                          <span className="upload-icon">⚖️</span>
                          {consultationModal.formData.regulatory_requirements ? 'Edit Requirements' : 'Open Form'}
                        </button>
                        {uploadedFiles.regulatory_requirements && (
                          <span className="file-indicator">✅ File uploaded</span>
                        )}
                        {extractingContent.regulatory_requirements && (
                          <span className="extracting-indicator">🤖 AI extracting...</span>
                        )}
                        {consultationModal.formData.regulatory_requirements && (
                          <span className="status-badge status-completed">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage 3: Strategy Development */}
              {consultationModal.currentStage === 3 && (
                <div className="stage-content">
                  <h3>🚀 Stage 3: Strategy Development</h3>

                  <div className="document-collection-grid">
                    <div className="document-row">
                      <div className="document-info">
                        <div className="doc-name">Go-to-Market Strategy</div>
                        <div className="doc-description">Phase-by-phase market entry plan, timeline, milestones</div>
                      </div>
                      <div className="document-actions">
                        <input
                          type="file"
                          id="gtm-strategy-upload"
                          accept=".pdf,.doc,.docx,.jpg,.png"
                          onChange={(e) => handleFileUpload('gtm_strategy', e.target.files[0], 3)}
                          style={{ display: 'none' }}
                        />
                        <button
                          className="upload-btn"
                          onClick={() => document.getElementById('gtm-strategy-upload').click()}
                        >
                          <span className="upload-icon">📎</span>
                          Upload Strategy Docs
                        </button>
                        <button
                          className="upload-btn"
                          onClick={() => openForm(
                            'gtm_strategy',
                            'Go-to-Market Strategy',
                            consultationModal.formData.gtm_strategy || {}
                          )}
                        >
                          <span className="upload-icon">🚀</span>
                          {consultationModal.formData.gtm_strategy ? 'Edit Strategy' : 'Open Form'}
                        </button>
                        {uploadedFiles.gtm_strategy && (
                          <span className="file-indicator">✅ File uploaded</span>
                        )}
                        {extractingContent.gtm_strategy && (
                          <span className="extracting-indicator">🤖 AI extracting...</span>
                        )}
                        {consultationModal.formData.gtm_strategy && (
                          <span className="status-badge status-completed">Completed</span>
                        )}
                      </div>
                    </div>

                    <div className="document-row">
                      <div className="document-info">
                        <div className="doc-name">Partnership Recommendations</div>
                        <div className="doc-description">Local partners, distributors, strategic alliances in Mexico</div>
                      </div>
                      <div className="document-actions">
                        <input
                          type="file"
                          id="partnership-recs-upload"
                          accept=".pdf,.doc,.docx,.jpg,.png"
                          onChange={(e) => handleFileUpload('partnership_recs', e.target.files[0], 3)}
                          style={{ display: 'none' }}
                        />
                        <button
                          className="upload-btn"
                          onClick={() => document.getElementById('partnership-recs-upload').click()}
                        >
                          <span className="upload-icon">📎</span>
                          Upload Partnership Docs
                        </button>
                        <button
                          className="upload-btn"
                          onClick={() => openForm(
                            'partnership_recs',
                            'Partnership Recommendations',
                            consultationModal.formData.partnership_recs || {}
                          )}
                        >
                          <span className="upload-icon">🤝</span>
                          {consultationModal.formData.partnership_recs ? 'Edit Recommendations' : 'Open Form'}
                        </button>
                        {uploadedFiles.partnership_recs && (
                          <span className="file-indicator">✅ File uploaded</span>
                        )}
                        {extractingContent.partnership_recs && (
                          <span className="extracting-indicator">🤖 AI extracting...</span>
                        )}
                        {consultationModal.formData.partnership_recs && (
                          <span className="status-badge status-completed">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage 4: Final Delivery */}
              {consultationModal.currentStage === 4 && (
                <div className="stage-content">
                  <h3>📋 Stage 4: Final Delivery</h3>

                  <div className="document-collection-grid">
                    <div className="document-row">
                      <div className="document-info">
                        <div className="doc-name">Final Consultation Report</div>
                        <div className="doc-description">Comprehensive market entry plan, action items, next steps</div>
                      </div>
                      <div className="document-actions">
                        <input
                          type="file"
                          id="final-report-upload"
                          accept=".pdf,.doc,.docx,.jpg,.png"
                          onChange={(e) => handleFileUpload('final_report', e.target.files[0], 4)}
                          style={{ display: 'none' }}
                        />
                        <button
                          className="upload-btn"
                          onClick={() => document.getElementById('final-report-upload').click()}
                        >
                          <span className="upload-icon">📎</span>
                          Upload Final Docs
                        </button>
                        <button
                          className="upload-btn"
                          onClick={() => openForm(
                            'final_report',
                            'Final Consultation Report',
                            consultationModal.formData.final_report || {}
                          )}
                        >
                          <span className="upload-icon">📄</span>
                          {consultationModal.formData.final_report ? 'Edit Report' : 'Open Form'}
                        </button>
                        {uploadedFiles.final_report && (
                          <span className="file-indicator">✅ File uploaded</span>
                        )}
                        {extractingContent.final_report && (
                          <span className="extracting-indicator">🤖 AI extracting...</span>
                        )}
                        {consultationModal.formData.final_report && (
                          <span className="status-badge status-completed">Completed</span>
                        )}
                      </div>
                    </div>

                    <div className="deliverable-info">
                      <h4>Jorge's Network Connection Deliverables</h4>
                      <div className="checklist">
                        <div className="checklist-item">
                          <input type="checkbox" />
                          <span>Specific partner introduction commitments</span>
                        </div>
                        <div className="checklist-item">
                          <input type="checkbox" />
                          <span>Regulatory contact referrals with relationship context</span>
                        </div>
                        <div className="checklist-item">
                          <input type="checkbox" />
                          <span>Business association membership recommendations</span>
                        </div>
                        <div className="checklist-item">
                          <input type="checkbox" />
                          <span>Cultural mentoring and relationship-building guidance</span>
                        </div>
                      </div>
                    </div>

                    <div className="consultation-summary">
                      <h4>Consultation Summary</h4>
                      <div className="summary-grid">
                        <div className="summary-stat">
                          <label>Total Time:</label>
                          <span>{formatTime(consultationModal.timer.totalSeconds)}</span>
                        </div>
                        <div className="summary-stat">
                          <label>Total Fee:</label>
                          <span>${calculateConsultationFee().toFixed(2)}</span>
                        </div>
                        <div className="summary-stat">
                          <label>Network Intelligence Sections:</label>
                          <span>{Object.keys(consultationModal.formData).length}/7</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              {consultationModal.currentStage > 1 && (
                <button
                  className="btn-action btn-secondary"
                  onClick={() => setConsultationModal(prev => ({ ...prev, currentStage: prev.currentStage - 1 }))}
                >
                  Previous Stage
                </button>
              )}
              {consultationModal.currentStage < 4 ? (
                <button
                  className="btn-action btn-primary"
                  onClick={nextConsultationStage}
                >
                  Next Stage
                </button>
              ) : (
                <button
                  className="btn-action btn-success"
                  onClick={() => {
                    if (consultationModal.timer.isRunning) {
                      stopConsultationTimer();
                    }
                    alert(`Consultation completed!\n\nTotal time: ${formatTime(consultationModal.timer.totalSeconds)}\nTotal fee: $${calculateConsultationFee().toFixed(2)}`);
                    setConsultationModal({ ...consultationModal, isOpen: false });
                  }}
                >
                  Complete Consultation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {formModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{formModal.formTitle}</h2>
              <button className="modal-close" onClick={closeForm}>×</button>
            </div>

            <div className="verification-form">
              {formModal.formType === 'requirements' && (
                <div className="form-group">
                  <label>Client Business Context</label>
                  <textarea
                    className="consultation-textarea"
                    placeholder="Target market size, business model, budget range, entry timeline..."
                    rows="4"
                    value={formModal.formData.details || ''}
                    onChange={(e) => setFormModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, details: e.target.value }
                    }))}
                  />
                </div>
              )}

              {formModal.formType === 'market_definition' && (
                <div className="form-group">
                  <label>Jorge's Research Contact Strategy</label>
                  <textarea
                    className="consultation-textarea"
                    placeholder="Which business associations, local partners, regulatory contacts Jorge will consult..."
                    rows="4"
                    value={formModal.formData.details || ''}
                    onChange={(e) => setFormModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, details: e.target.value }
                    }))}
                  />
                </div>
              )}

              {formModal.formType === 'competitive_analysis' && (
                <div className="form-group">
                  <label>Network Intelligence Findings</label>
                  <textarea
                    className="consultation-textarea"
                    placeholder="Real market dynamics from Jorge's contacts: who's succeeding, pricing reality, business culture..."
                    rows="4"
                    value={formModal.formData.details || ''}
                    onChange={(e) => setFormModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, details: e.target.value }
                    }))}
                  />
                </div>
              )}

              {formModal.formType === 'regulatory_requirements' && (
                <div className="form-group">
                  <label>Local Business Practice Reality</label>
                  <textarea
                    className="consultation-textarea"
                    placeholder="How business actually gets done: real timelines, relationship requirements, cultural expectations..."
                    rows="4"
                    value={formModal.formData.details || ''}
                    onChange={(e) => setFormModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, details: e.target.value }
                    }))}
                  />
                </div>
              )}

              {formModal.formType === 'gtm_strategy' && (
                <div className="form-group">
                  <label>Strategy Validation Through Network</label>
                  <textarea
                    className="consultation-textarea"
                    placeholder="Jorge validates database insights with real business experience: what actually works vs. theoretical..."
                    rows="4"
                    value={formModal.formData.details || ''}
                    onChange={(e) => setFormModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, details: e.target.value }
                    }))}
                  />
                </div>
              )}

              {formModal.formType === 'partnership_recs' && (
                <div className="form-group">
                  <label>Jorge's Partnership Network Assessment</label>
                  <textarea
                    className="consultation-textarea"
                    placeholder="Direct access to Jorge's relationships: reliable partners, track records, introduction possibilities..."
                    rows="4"
                    value={formModal.formData.details || ''}
                    onChange={(e) => setFormModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, details: e.target.value }
                    }))}
                  />
                </div>
              )}

              {formModal.formType === 'final_report' && (
                <div className="form-group">
                  <label>Implementation Roadmap with Network Support</label>
                  <textarea
                    className="consultation-textarea"
                    placeholder="Step-by-step entry plan: specific contacts, introduction timelines, relationship-building strategy..."
                    rows="4"
                    value={formModal.formData.details || ''}
                    onChange={(e) => setFormModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, details: e.target.value }
                    }))}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Jorge's Network Notes</label>
                <textarea
                  className="consultation-textarea"
                  placeholder="Key contacts consulted, relationship insights, follow-up commitments..."
                  rows="3"
                  value={formModal.formData.notes || ''}
                  onChange={(e) => setFormModal(prev => ({
                    ...prev,
                    formData: { ...prev.formData, notes: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-action btn-primary" onClick={saveFormData}>
                Save & Close
              </button>
              <button className="btn-action btn-secondary" onClick={closeForm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}