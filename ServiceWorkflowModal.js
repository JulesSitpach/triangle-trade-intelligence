// components/shared/ServiceWorkflowModal.js
import React, { useState } from 'react';

const ServiceWorkflowModal = ({ isOpen, service, request, onClose, onComplete }) => {
  const [currentStage, setCurrentStage] = useState(1);
  const [stageData, setStageData] = useState({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleStageComplete = async (data) => {
    setStageData(prev => ({ ...prev, [`stage${currentStage}`]: data }));
    
    if (currentStage < service.totalStages) {
      setCurrentStage(currentStage + 1);
    } else {
      setLoading(true);
      try {
        await onComplete({ ...stageData, [`stage${currentStage}`]: data });
        onClose();
      } catch (error) {
        console.error('Service completion failed:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{service.title} - {request.client_company}</h2>
          <div className="stage-progress">
            Stage {currentStage} of {service.totalStages}
          </div>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="modal-body">
          {service.renderStage(currentStage, request, stageData, handleStageComplete, loading)}
        </div>
      </div>
    </div>
  );
};

// components/cristina/USMCACertificateTab.js
import React, { useState, useEffect } from 'react';
import ServiceWorkflowModal from '../shared/ServiceWorkflowModal';

const USMCACertificateTab = () => {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadServiceRequests();
  }, []);

  const loadServiceRequests = async () => {
    try {
      const response = await fetch('/api/service-requests?type=usmca_certificate');
      const data = await response.json();
      setServiceRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const service = {
    title: "USMCA Certificate Generation",
    totalStages: 2,
    renderStage: (stage, request, stageData, onComplete, loading) => {
      if (stage === 1) {
        return (
          <div className="stage-content">
            <h3>Data Review</h3>
            <div className="data-display">
              <p><strong>Product:</strong> {request.subscriber_data?.product_description}</p>
              <p><strong>Origin:</strong> {request.subscriber_data?.manufacturing_location}</p>
              <p><strong>Components:</strong> {request.subscriber_data?.component_origins?.length || 0} items</p>
            </div>
            <button 
              onClick={() => onComplete({ dataConfirmed: true })}
              className="btn-primary"
            >
              Data looks good - Generate Certificate
            </button>
          </div>
        );
      }
      
      if (stage === 2) {
        return (
          <div className="stage-content">
            <h3>Certificate Generation</h3>
            {loading ? (
              <div className="loading">Generating USMCA certificate...</div>
            ) : (
              <div>
                <p>Certificate generation will be implemented with OpenRouter API.</p>
                <button 
                  onClick={() => onComplete({ certificateGenerated: true })}
                  className="btn-primary"
                >
                  Complete Service
                </button>
              </div>
            )}
          </div>
        );
      }
    }
  };

  const handleServiceComplete = async (finalData) => {
    console.log('USMCA Certificate service completed:', finalData);
    // Call API to complete service
    await fetch('/api/complete-usmca-certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: selectedRequest.id, data: finalData })
    });
    loadServiceRequests();
  };

  return (
    <div className="service-tab">
      <h2>USMCA Certificate Requests</h2>
      
      <div className="service-requests">
        {serviceRequests.map(request => (
          <div key={request.id} className="service-request-card">
            <h3>USMCA Certificate - {request.client_company}</h3>
            <p>Product: {request.subscriber_data?.product_description}</p>
            <p>Origin: {request.subscriber_data?.manufacturing_location}</p>
            <button 
              onClick={() => setSelectedRequest(request)}
              className="btn-primary"
            >
              Start Certificate Generation
            </button>
          </div>
        ))}
      </div>

      <ServiceWorkflowModal
        isOpen={!!selectedRequest}
        service={service}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onComplete={handleServiceComplete}
      />
    </div>
  );
};

// components/cristina/HSClassificationTab.js
import React, { useState, useEffect } from 'react';
import ServiceWorkflowModal from '../shared/ServiceWorkflowModal';

const HSClassificationTab = () => {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadServiceRequests();
  }, []);

  const loadServiceRequests = async () => {
    try {
      const response = await fetch('/api/service-requests?type=hs_classification');
      const data = await response.json();
      setServiceRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const service = {
    title: "HS Classification Review",
    totalStages: 2,
    renderStage: (stage, request, stageData, onComplete, loading) => {
      if (stage === 1) {
        return (
          <div className="stage-content">
            <h3>Product Review</h3>
            <div className="data-display">
              <p><strong>Product:</strong> {request.subscriber_data?.product_description}</p>
              <p><strong>Components:</strong> {request.subscriber_data?.component_origins?.length || 0} items</p>
              <p><strong>Current HS Code:</strong> {request.subscriber_data?.current_hs_code || 'Not specified'}</p>
            </div>
            <button 
              onClick={() => onComplete({ productReviewed: true })}
              className="btn-primary"
            >
              Verify Classification
            </button>
          </div>
        );
      }
      
      if (stage === 2) {
        return (
          <div className="stage-content">
            <h3>Expert Validation</h3>
            {loading ? (
              <div className="loading">Running classification analysis...</div>
            ) : (
              <div>
                <p>Classification validation will use OpenRouter API for web search.</p>
                <button 
                  onClick={() => onComplete({ classificationValidated: true })}
                  className="btn-primary"
                >
                  Complete Classification
                </button>
              </div>
            )}
          </div>
        );
      }
    }
  };

  const handleServiceComplete = async (finalData) => {
    console.log('HS Classification service completed:', finalData);
    await fetch('/api/complete-hs-classification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: selectedRequest.id, data: finalData })
    });
    loadServiceRequests();
  };

  return (
    <div className="service-tab">
      <h2>HS Classification Requests</h2>
      
      <div className="service-requests">
        {serviceRequests.map(request => (
          <div key={request.id} className="service-request-card">
            <h3>HS Classification - {request.client_company}</h3>
            <p>Product: {request.subscriber_data?.product_description}</p>
            <p>Components: {request.subscriber_data?.component_origins?.length || 0} items</p>
            <button 
              onClick={() => setSelectedRequest(request)}
              className="btn-primary"
            >
              Start Classification Review
            </button>
          </div>
        ))}
      </div>

      <ServiceWorkflowModal
        isOpen={!!selectedRequest}
        service={service}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onComplete={handleServiceComplete}
      />
    </div>
  );
};

// components/cristina/CrisisResponseTab.js
import React, { useState, useEffect } from 'react';
import ServiceWorkflowModal from '../shared/ServiceWorkflowModal';

const CrisisResponseTab = () => {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadServiceRequests();
  }, []);

  const loadServiceRequests = async () => {
    try {
      const response = await fetch('/api/service-requests?type=crisis_response');
      const data = await response.json();
      setServiceRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const service = {
    title: "Crisis Response Analysis",
    totalStages: 3,
    renderStage: (stage, request, stageData, onComplete, loading) => {
      if (stage === 1) {
        return (
          <div className="stage-content">
            <h3>Crisis Description</h3>
            <div className="form-group">
              <label>What crisis occurred?</label>
              <textarea placeholder="Describe the crisis situation"></textarea>
            </div>
            <div className="form-group">
              <label>Current impact on operations?</label>
              <textarea placeholder="Describe operational impact"></textarea>
            </div>
            <button 
              onClick={() => onComplete({ crisisDescribed: true })}
              className="btn-primary"
            >
              Continue to Analysis
            </button>
          </div>
        );
      }
      
      if (stage === 2) {
        return (
          <div className="stage-content">
            <h3>Impact Analysis</h3>
            {loading ? (
              <div className="loading">Analyzing crisis impact...</div>
            ) : (
              <div>
                <p>AI analysis will use OpenRouter API with trade profile data.</p>
                <button 
                  onClick={() => onComplete({ analysisComplete: true })}
                  className="btn-primary"
                >
                  Continue to Action Plan
                </button>
              </div>
            )}
          </div>
        );
      }
      
      if (stage === 3) {
        return (
          <div className="stage-content">
            <h3>Action Plan</h3>
            <div className="form-group">
              <label>Cristina's Recommendations</label>
              <textarea placeholder="Add action plan and recommendations"></textarea>
            </div>
            <button 
              onClick={() => onComplete({ actionPlanCreated: true })}
              className="btn-primary"
            >
              Complete Crisis Response
            </button>
          </div>
        );
      }
    }
  };

  const handleServiceComplete = async (finalData) => {
    console.log('Crisis Response service completed:', finalData);
    await fetch('/api/complete-crisis-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: selectedRequest.id, data: finalData })
    });
    loadServiceRequests();
  };

  return (
    <div className="service-tab">
      <h2>Crisis Response Requests</h2>
      
      <div className="service-requests">
        {serviceRequests.map(request => (
          <div key={request.id} className="service-request-card">
            <h3>Crisis Response - {request.client_company}</h3>
            <p>Trade Profile: {request.subscriber_data?.trade_volume} annual</p>
            <button 
              onClick={() => setSelectedRequest(request)}
              className="btn-primary"
            >
              Start Crisis Analysis
            </button>
          </div>
        ))}
      </div>

      <ServiceWorkflowModal
        isOpen={!!selectedRequest}
        service={service}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onComplete={handleServiceComplete}
      />
    </div>
  );
};

// components/jorge/SupplierSourcingTab.js
import React, { useState, useEffect } from 'react';
import ServiceWorkflowModal from '../shared/ServiceWorkflowModal';

const SupplierSourcingTab = () => {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadServiceRequests();
  }, []);

  const loadServiceRequests = async () => {
    try {
      const response = await fetch('/api/service-requests?type=supplier_sourcing');
      const data = await response.json();
      setServiceRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const service = {
    title: "Supplier Sourcing Research",
    totalStages: 3,
    renderStage: (stage, request, stageData, onComplete, loading) => {
      if (stage === 1) {
        return (
          <div className="stage-content">
            <h3>Sourcing Requirements</h3>
            <div className="form-group">
              <label>Quality certifications needed</label>
              <select>
                <option>ISO 9001</option>
                <option>ISO 14001</option>
                <option>IATF 16949</option>
                <option>None required</option>
              </select>
            </div>
            <div className="form-group">
              <label>Monthly volume (units)</label>
              <input type="number" placeholder="5000" />
            </div>
            <button 
              onClick={() => onComplete({ requirementsCollected: true })}
              className="btn-primary"
            >
              Start AI Analysis
            </button>
          </div>
        );
      }
      
      if (stage === 2) {
        return (
          <div className="stage-content">
            <h3>AI Supplier Discovery</h3>
            {loading ? (
              <div className="loading">Searching for suppliers...</div>
            ) : (
              <div>
                <p>AI will use OpenRouter API to find real Mexican suppliers.</p>
                <button 
                  onClick={() => onComplete({ suppliersFound: true })}
                  className="btn-primary"
                >
                  Continue to Jorge's Review
                </button>
              </div>
            )}
          </div>
        );
      }
      
      if (stage === 3) {
        return (
          <div className="stage-content">
            <h3>Jorge's Network Validation</h3>
            <div className="form-group">
              <label>Jorge's Additional Recommendations</label>
              <textarea placeholder="Add suppliers from Mexico network"></textarea>
            </div>
            <button 
              onClick={() => onComplete({ validationComplete: true })}
              className="btn-primary"
            >
              Complete Supplier Sourcing
            </button>
          </div>
        );
      }
    }
  };

  const handleServiceComplete = async (finalData) => {
    console.log('Supplier Sourcing service completed:', finalData);
    await fetch('/api/complete-supplier-sourcing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: selectedRequest.id, data: finalData })
    });
    loadServiceRequests();
  };

  return (
    <div className="service-tab">
      <h2>Supplier Sourcing Requests</h2>
      
      <div className="service-requests">
        {serviceRequests.map(request => (
          <div key={request.id} className="service-request-card">
            <h3>Supplier Sourcing - {request.client_company}</h3>
            <p>Product: {request.subscriber_data?.product_description}</p>
            <p>Trade Volume: {request.subscriber_data?.trade_volume}</p>
            <button 
              onClick={() => setSelectedRequest(request)}
              className="btn-primary"
            >
              Start Supplier Research
            </button>
          </div>
        ))}
      </div>

      <ServiceWorkflowModal
        isOpen={!!selectedRequest}
        service={service}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onComplete={handleServiceComplete}
      />
    </div>
  );
};

// components/jorge/ManufacturingFeasibilityTab.js
import React, { useState, useEffect } from 'react';
import ServiceWorkflowModal from '../shared/ServiceWorkflowModal';

const ManufacturingFeasibilityTab = () => {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadServiceRequests();
  }, []);

  const loadServiceRequests = async () => {
    try {
      const response = await fetch('/api/service-requests?type=manufacturing_feasibility');
      const data = await response.json();
      setServiceRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const service = {
    title: "Manufacturing Feasibility Analysis",
    totalStages: 3,
    renderStage: (stage, request, stageData, onComplete, loading) => {
      if (stage === 1) {
        return (
          <div className="stage-content">
            <h3>Manufacturing Context</h3>
            <div className="form-group">
              <label>What's driving Mexico manufacturing consideration?</label>
              <div className="checkbox-group">
                <label><input type="checkbox" /> USMCA compliance requirements</label>
                <label><input type="checkbox" /> Cost reduction vs current location</label>
                <label><input type="checkbox" /> Supply chain risk management</label>
              </div>
            </div>
            <div className="form-group">
              <label>Setup budget range</label>
              <select>
                <option>Under $100K</option>
                <option>$100K-$500K</option>
                <option>$500K-$2M</option>
                <option>$2M+</option>
              </select>
            </div>
            <button 
              onClick={() => onComplete({ contextCollected: true })}
              className="btn-primary"
            >
              Start AI Analysis
            </button>
          </div>
        );
      }
      
      if (stage === 2) {
        return (
          <div className="stage-content">
            <h3>AI Analysis</h3>
            {loading ? (
              <div className="loading">Analyzing manufacturing locations...</div>
            ) : (
              <div>
                <p>AI will analyze locations using OpenRouter API.</p>
                <button 
                  onClick={() => onComplete({ analysisComplete: true })}
                  className="btn-primary"
                >
                  Continue to Jorge's Recommendation
                </button>
              </div>
            )}
          </div>
        );
      }
      
      if (stage === 3) {
        return (
          <div className="stage-content">
            <h3>Jorge's Recommendation</h3>
            <div className="form-group">
              <label>Final Recommendation</label>
              <select>
                <option>Go - Proceed with Mexico manufacturing</option>
                <option>No-Go - Stay with current location</option>
                <option>Conditional - Need more analysis</option>
              </select>
            </div>
            <div className="form-group">
              <label>Jorge's Notes</label>
              <textarea placeholder="Add local knowledge and contacts"></textarea>
            </div>
            <button 
              onClick={() => onComplete({ recommendationComplete: true })}
              className="btn-primary"
            >
              Complete Feasibility Analysis
            </button>
          </div>
        );
      }
    }
  };

  const handleServiceComplete = async (finalData) => {
    console.log('Manufacturing Feasibility service completed:', finalData);
    await fetch('/api/complete-manufacturing-feasibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: selectedRequest.id, data: finalData })
    });
    loadServiceRequests();
  };

  return (
    <div className="service-tab">
      <h2>Manufacturing Feasibility Requests</h2>
      
      <div className="service-requests">
        {serviceRequests.map(request => (
          <div key={request.id} className="service-request-card">
            <h3>Manufacturing Feasibility - {request.client_company}</h3>
            <p>Product: {request.subscriber_data?.product_description}</p>
            <p>Current Volume: {request.subscriber_data?.trade_volume}</p>
            <button 
              onClick={() => setSelectedRequest(request)}
              className="btn-primary"
            >
              Start Feasibility Analysis
            </button>
          </div>
        ))}
      </div>

      <ServiceWorkflowModal
        isOpen={!!selectedRequest}
        service={service}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onComplete={handleServiceComplete}
      />
    </div>
  );
};

// components/jorge/MarketEntryTab.js
import React, { useState, useEffect } from 'react';
import ServiceWorkflowModal from '../shared/ServiceWorkflowModal';

const MarketEntryTab = () => {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadServiceRequests();
  }, []);

  const loadServiceRequests = async () => {
    try {
      const response = await fetch('/api/service-requests?type=market_entry');
      const data = await response.json();
      setServiceRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const service = {
    title: "Market Entry Strategy",
    totalStages: 3,
    renderStage: (stage, request, stageData, onComplete, loading) => {
      if (stage === 1) {
        return (
          <div className="stage-content">
            <h3>Market Goals</h3>
            <div className="form-group">
              <label>Target market</label>
              <div className="checkbox-group">
                <label><input type="checkbox" /> Mexico</label>
                <label><input type="checkbox" /> Canada</label>
                <label><input type="checkbox" /> Both USMCA markets</label>
              </div>
            </div>
            <div className="form-group">
              <label>Entry timeline</label>
              <select>
                <option>3-6 months</option>
                <option>6-12 months</option>
                <option>12-18 months</option>
                <option>18+ months</option>
              </select>
            </div>
            <button 
              onClick={() => onComplete({ goalsCollected: true })}
              className="btn-primary"
            >
              Start Market Analysis
            </button>
          </div>
        );
      }
      
      if (stage === 2) {
        return (
          <div className="stage-content">
            <h3>Market Analysis</h3>
            {loading ? (
              <div className="loading">Analyzing market opportunities...</div>
            ) : (
              <div>
                <p>AI will research market opportunities using OpenRouter API.</p>
                <button 
                  onClick={() => onComplete({ analysisComplete: true })}
                  className="btn-primary"
                >
                  Continue to Jorge's Strategy
                </button>
              </div>
            )}
          </div>
        );
      }
      
      if (stage === 3) {
        return (
          <div className="stage-content">
            <h3>Jorge's Strategy</h3>
            <div className="form-group">
              <label>Partnership Recommendations</label>
              <textarea placeholder="Add local market knowledge and partnership contacts"></textarea>
            </div>
            <div className="form-group">
              <label>Market Entry Strategy</label>
              <textarea placeholder="Recommended approach and next steps"></textarea>
            </div>
            <button 
              onClick={() => onComplete({ strategyComplete: true })}
              className="btn-primary"
            >
              Complete Market Entry Strategy
            </button>
          </div>
        );
      }
    }
  };

  const handleServiceComplete = async (finalData) => {
    console.log('Market Entry service completed:', finalData);
    await fetch('/api/complete-market-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: selectedRequest.id, data: finalData })
    });
    loadServiceRequests();
  };

  return (
    <div className="service-tab">
      <h2>Market Entry Requests</h2>
      
      <div className="service-requests">
        {serviceRequests.map(request => (
          <div key={request.id} className="service-request-card">
            <h3>Market Entry - {request.client_company}</h3>
            <p>Business: {request.subscriber_data?.business_type}</p>
            <p>Product: {request.subscriber_data?.product_description}</p>
            <button 
              onClick={() => setSelectedRequest(request)}
              className="btn-primary"
            >
              Start Market Analysis
            </button>
          </div>
        ))}
      </div>

      <ServiceWorkflowModal
        isOpen={!!selectedRequest}
        service={service}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onComplete={handleServiceComplete}
      />
    </div>
  );
};

export {
  USMCACertificateTab,
  HSClassificationTab,
  CrisisResponseTab,
  SupplierSourcingTab,
  ManufacturingFeasibilityTab,
  MarketEntryTab,
  ServiceWorkflowModal
};