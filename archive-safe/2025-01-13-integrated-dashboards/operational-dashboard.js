/**
 * JORGE'S OPERATIONAL BUSINESS DASHBOARD
 * Real Mexico partnership development and market intelligence tools
 * Replaces mockup dashboards with functional business operations
 */

import React, { useState, useEffect } from 'react';
import TriangleLayout from '../../components/TriangleLayout';

export default function JorgeOperationalDashboard() {
  const [partnerPipeline, setPartnerPipeline] = useState([]);
  const [clientAssignments, setClientAssignments] = useState([]);
  const [collaborationQueue, setCollaborationQueue] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [activeTab, setActiveTab] = useState('pipeline');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOperationalData();
  }, []);

  const loadOperationalData = async () => {
    try {
      console.log('🇲🇽 Loading Jorge\'s operational business data...');

      // Load all operational data in parallel
      const [pipelineRes, assignmentsRes, collaborationRes] = await Promise.all([
        fetch('/api/operations/partner-pipeline'),
        fetch('/api/operations/client-assignment'),
        fetch('/api/operations/collaboration-queue?assigned_to=jorge')
      ]);

      if (pipelineRes.ok) {
        const pipelineData = await pipelineRes.json();
        setPartnerPipeline(pipelineData.pipeline || []);
        setMetrics(prev => ({ ...prev, ...pipelineData.metrics, jorge_performance: pipelineData.jorge_performance }));
      }

      if (assignmentsRes.ok) {
        const assignmentData = await assignmentsRes.json();
        setClientAssignments(assignmentData.assignments || []);
        setMetrics(prev => ({ ...prev, assignments: assignmentData.metrics }));
      }

      if (collaborationRes.ok) {
        const collaborationData = await collaborationRes.json();
        setCollaborationQueue(collaborationData.queue || []);
        setMetrics(prev => ({ ...prev, collaboration: collaborationData.metrics }));
      }

      console.log('✅ Operational data loaded successfully');

    } catch (error) {
      console.error('Error loading operational data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestBrokerAssessment = async (partnerId, notes) => {
    try {
      const response = await fetch('/api/operations/partner-pipeline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: partnerId,
          stage: 'broker_assessment',
          jorge_notes: notes,
          request_broker_assessment: true
        })
      });

      if (response.ok) {
        console.log('✅ Broker assessment requested');
        loadOperationalData(); // Reload data
      }
    } catch (error) {
      console.error('Error requesting broker assessment:', error);
    }
  };

  const handleCreateCollaboration = async (itemData) => {
    try {
      const response = await fetch('/api/operations/collaboration-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...itemData,
          requested_by: 'jorge'
        })
      });

      if (response.ok) {
        console.log('✅ Collaboration item created');
        loadOperationalData(); // Reload data
      }
    } catch (error) {
      console.error('Error creating collaboration item:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <TriangleLayout>
        <div className="container-app">
          <div className="content-card">
            <div className="content-card-header">
              <h1 className="content-card-title">Loading Operational Dashboard</h1>
            </div>
            <div className="content-card-content">
              <p className="text-body">Loading Jorge's business operations...</p>
            </div>
          </div>
        </div>
      </TriangleLayout>
    );
  }

  return (
    <TriangleLayout>
      <div className="container-app">
        {/* Professional Header */}
        <div className="section-header">
          <h1 className="section-header-title">Jorge's Mexico Partnership Operations</h1>
          <p className="section-header-subtitle">
            Partnership Development • Market Intelligence • B2B Sales Expert
            <br />Mérida, Yucatán • {partnerPipeline.length} active partners • {clientAssignments.filter(c => c.assigned_to_sales).length} assigned clients
          </p>
        </div>

        {/* Operational Metrics */}
        <div className="grid-3-cols">
          <div className="content-card analytics">
            <div className="content-card-header">
              <h3 className="content-card-title">Partnership Pipeline</h3>
            </div>
            <div className="content-card-content">
              <p className="content-card-value">{partnerPipeline.length}</p>
              <p className="text-body">Total value: {formatCurrency(metrics.total_pipeline_value || 0)}</p>
            </div>
          </div>

          <div className="content-card compliance">
            <div className="content-card-header">
              <h3 className="content-card-title">Client Assignments</h3>
            </div>
            <div className="content-card-content">
              <p className="content-card-value">{metrics.assignments?.jorge_assignments || 0}</p>
              <p className="text-body">Complexity avg: {Math.round(metrics.assignments?.average_complexity || 0)}</p>
            </div>
          </div>

          <div className="content-card certificates">
            <div className="content-card-header">
              <h3 className="content-card-title">Collaboration Items</h3>
            </div>
            <div className="content-card-content">
              <p className="content-card-value">{collaborationQueue.length}</p>
              <p className="text-body">With Cristina</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hero-button-group">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={activeTab === 'pipeline' ? 'btn-primary' : 'btn-secondary'}
          >
            Partner Pipeline ({partnerPipeline.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={activeTab === 'assignments' ? 'btn-primary' : 'btn-secondary'}
          >
            Client Assignments ({metrics.assignments?.jorge_assignments || 0})
          </button>
          <button
            onClick={() => setActiveTab('collaboration')}
            className={activeTab === 'collaboration' ? 'btn-primary' : 'btn-secondary'}
          >
            Collaboration Queue ({collaborationQueue.length})
          </button>
        </div>

        {/* Partner Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div>
            <div className="section-header">
              <h2 className="section-header-title">🇲🇽 Mexico Partnership Development</h2>
              <p className="section-header-subtitle">Real partnership pipeline - no mockup companies</p>
            </div>

            <div className="grid-2-cols">
              {partnerPipeline.map(partner => (
                <div key={partner.id} className={`content-card ${partner.stage === 'approved' ? 'compliance' : partner.stage === 'broker_assessment' ? 'certificates' : 'analytics'}`}>
                  <div className="content-card-header">
                    <h3 className="content-card-title">{partner.company_name}</h3>
                    <p className="text-body">{partner.location} • {partner.industry}</p>
                  </div>
                  <div className="content-card-content">
                    <div className="text-body">
                      <strong>Contact:</strong> {partner.contact_person} ({partner.contact_email})<br/>
                      <strong>Stage:</strong> {partner.stage}<br/>
                      <strong>Annual Capacity:</strong> {formatCurrency(partner.annual_capacity_usd)}<br/>
                      <strong>Potential Value:</strong> {formatCurrency(partner.potential_annual_value)}<br/>
                      <strong>HS Codes:</strong> {partner.hs_codes?.join(', ')}<br/>
                      <strong>Cristina Assessment:</strong> {partner.cristina_rating}
                    </div>
                  </div>

                  <div className="content-card analytics">
                    <div className="content-card-content">
                      <p className="text-body">
                        <strong>Jorge's Notes:</strong><br/>
                        {partner.jorge_notes}
                      </p>
                    </div>
                  </div>

                  <div className="insights-button-group">
                    {partner.stage === 'qualification' && (
                      <button
                        className="btn-primary"
                        onClick={() => handleRequestBrokerAssessment(partner.id, 'Ready for Cristina\'s logistics assessment')}
                      >
                        Request Broker Assessment
                      </button>
                    )}

                    {partner.stage === 'approved' && (
                      <button
                        className="btn-primary"
                        onClick={() => handleCreateCollaboration({
                          item_type: 'client_assessment',
                          title: `Match clients with ${partner.company_name}`,
                          description: `Identify SMB clients who could benefit from ${partner.company_name} partnership`,
                          assigned_to: 'jorge',
                          priority: 'medium',
                          related_partner_id: partner.id
                        })}
                      >
                        Find Client Matches
                      </button>
                    )}

                    <button
                      className="btn-secondary"
                      onClick={() => window.open(`mailto:${partner.contact_email}?subject=Mexico Trade Bridge Partnership - ${partner.company_name}`)}
                    >
                      Contact Partner
                    </button>
                  </div>
                </div>
              ))}

              {partnerPipeline.length === 0 && (
                <div className="content-card">
                  <div className="content-card-content">
                    <p className="text-body">No partners in pipeline yet. Start prospecting Mexico suppliers!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Client Assignments Tab */}
        {activeTab === 'assignments' && (
          <div>
            <div className="section-header">
              <h2 className="section-header-title">🎯 Jorge's Client Assignments</h2>
              <p className="section-header-subtitle">SMB clients assigned based on partnership opportunities and complexity</p>
            </div>

            <div className="grid-2-cols">
              {clientAssignments
                .filter(assignment => assignment.assigned_to_sales)
                .map(assignment => (
                <div key={assignment.id} className={`content-card ${assignment.collaboration_required ? 'certificates' : 'analytics'}`}>
                  <div className="content-card-header">
                    <h3 className="content-card-title">{assignment.company_name}</h3>
                    <p className="text-body">Complexity Score: {assignment.complexity_score}/10</p>
                  </div>
                  <div className="content-card-content">
                    <div className="text-body">
                      <strong>Contact:</strong> {assignment.email}<br/>
                      <strong>Industry:</strong> {assignment.industry || 'Not specified'}<br/>
                      <strong>Assignment Reason:</strong> {assignment.assignment_reason}<br/>
                      <strong>Needs Collaboration:</strong> {assignment.collaboration_required ? 'Yes (with Cristina)' : 'Jorge only'}<br/>
                      <strong>Status:</strong> {assignment.status}
                    </div>
                  </div>

                  <div className="insights-button-group">
                    <button
                      className="btn-primary"
                      onClick={() => window.open(`mailto:${assignment.email}?subject=Mexico Partnership Opportunities - ${assignment.company_name}`)}
                    >
                      Contact Client
                    </button>

                    {assignment.collaboration_required && (
                      <button
                        className="btn-secondary"
                        onClick={() => handleCreateCollaboration({
                          item_type: 'client_assessment',
                          title: `Joint assessment for ${assignment.company_name}`,
                          description: `High-complexity client requiring both partnership development and broker coordination`,
                          assigned_to: 'both',
                          priority: assignment.complexity_score >= 8 ? 'high' : 'medium',
                          related_client_id: assignment.user_id
                        })}
                      >
                        Request Cristina Collaboration
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {clientAssignments.filter(a => a.assigned_to_sales).length === 0 && (
                <div className="content-card">
                  <div className="content-card-content">
                    <p className="text-body">No clients currently assigned to Jorge.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collaboration Queue Tab */}
        {activeTab === 'collaboration' && (
          <div>
            <div className="section-header">
              <h2 className="section-header-title">🤝 Jorge-Cristina Collaboration</h2>
              <p className="section-header-subtitle">Cross-team coordination on complex clients and partner assessments</p>
            </div>

            <div className="grid-2-cols">
              {collaborationQueue.map(item => (
                <div key={item.id} className={`content-card ${item.priority === 'high' ? 'certificates' : item.priority === 'urgent' ? 'compliance' : 'analytics'}`}>
                  <div className="content-card-header">
                    <h3 className="content-card-title">{item.title}</h3>
                    <p className="text-body">{item.item_type} • Priority: {item.priority}</p>
                  </div>
                  <div className="content-card-content">
                    <div className="text-body">
                      <strong>Description:</strong> {item.description}<br/>
                      <strong>Assigned to:</strong> {item.assigned_to}<br/>
                      <strong>Status:</strong> {item.status}<br/>
                      {item.partner_context && (
                        <>
                          <strong>Related Partner:</strong> {item.partner_context.company_name} ({item.partner_context.location})<br/>
                        </>
                      )}
                      {item.client_context && (
                        <>
                          <strong>Related Client:</strong> {item.client_context.company_name}<br/>
                        </>
                      )}
                    </div>
                  </div>

                  {item.jorge_input && (
                    <div className="content-card compliance">
                      <div className="content-card-content">
                        <p className="text-body">
                          <strong>Jorge's Input:</strong><br/>
                          {item.jorge_input}
                        </p>
                      </div>
                    </div>
                  )}

                  {item.cristina_input && (
                    <div className="content-card certificates">
                      <div className="content-card-content">
                        <p className="text-body">
                          <strong>Cristina's Input:</strong><br/>
                          {item.cristina_input}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="insights-button-group">
                    <button className="btn-primary">
                      Add Jorge Input
                    </button>
                    <button className="btn-secondary">
                      View Details
                    </button>
                  </div>
                </div>
              ))}

              {collaborationQueue.length === 0 && (
                <div className="content-card">
                  <div className="content-card-content">
                    <p className="text-body">No active collaboration items. All coordination up to date!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Summary */}
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">Jorge's Business Performance</h3>
          </div>
          <div className="content-card-content">
            <div className="text-body">
              <strong>Quarterly Target:</strong> {metrics.jorge_performance?.quarterly_target || 15} partners<br/>
              <strong>Current Pipeline:</strong> {partnerPipeline.length} partners<br/>
              <strong>Pipeline Value:</strong> {formatCurrency(metrics.total_pipeline_value || 0)}<br/>
              <strong>Average Deal Size:</strong> {formatCurrency(metrics.average_deal_size || 0)}<br/>
              <strong>Broker Approval Rate:</strong> {metrics.broker_approval_rate || 0}%<br/>
              <strong>Client Assignment Load:</strong> {metrics.assignments?.jorge_assignments || 0} clients
            </div>
          </div>
          <div className="insights-button-group">
            <button className="btn-primary">Export Pipeline Report</button>
            <button className="btn-secondary">View Analytics</button>
          </div>
        </div>
      </div>
    </TriangleLayout>
  );
}