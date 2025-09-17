/**
 * Jorge Operations Dashboard - Admin View
 * Real Mexico partnership development and market intelligence tools
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';

export default function JorgeOperations() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [operationalData, setOperationalData] = useState({
    partnerPipeline: [],
    clientAssignments: [],
    collaborationQueue: [],
    metrics: {}
  });

  useEffect(() => {
    // Check admin authentication
    const stored = localStorage.getItem('triangle_user_session') || localStorage.getItem('current_user');
    if (!stored) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(stored);
      if (!userData.isAdmin) {
        router.push('/dashboard');
        return;
      }
      setUser(userData);
      loadJorgeOperationalData();
    } catch (e) {
      router.push('/login');
    }
  }, []);

  const loadJorgeOperationalData = async () => {
    try {
      setLoading(true);
      console.log('🇲🇽 Loading Jorge\'s operational business data...');

      // Simulate Jorge's operational data
      const mockData = {
        partnerPipeline: [
          {
            id: '1',
            name: 'Manufacturas Mexicanas SA',
            location: 'Guadalajara, Jalisco',
            specialization: 'Electronics Manufacturing',
            stage: 'qualification',
            jorge_rating: 'High Potential',
            cristina_rating: 'Pending Assessment',
            jorge_notes: 'Strong USMCA compliance infrastructure, established supply chain',
            priority: 'high'
          },
          {
            id: '2',
            name: 'Textiles del Norte',
            location: 'Tijuana, Baja California',
            specialization: 'Textile Manufacturing',
            stage: 'broker_assessment',
            jorge_rating: 'Moderate Potential',
            cristina_rating: 'Logistics Review Required',
            jorge_notes: 'Good local connections, needs logistics optimization',
            priority: 'medium'
          }
        ],
        clientAssignments: [
          {
            id: '1',
            client_name: 'TechCorp Industries',
            business_type: 'Electronics',
            trade_volume: '$2.5M',
            complexity_score: 8,
            collaboration_required: true,
            jorge_status: 'Partnership sourcing in progress',
            assigned_date: '2025-09-15'
          }
        ],
        collaborationQueue: [
          {
            id: '1',
            title: 'Electronics Supplier Assessment',
            description: 'Joint assessment of Guadalajara electronics manufacturer',
            type: 'partner_evaluation',
            jorge_input: 'Market potential confirmed, strong relationships established',
            cristina_input: 'Logistics capacity under review, USMCA documentation verified',
            status: 'active'
          }
        ],
        metrics: {
          active_partnerships: 12,
          pipeline_value: '$15.2M',
          avg_qualification_time: '14 days',
          success_rate: '78%',
          jorge_performance: {
            partnerships_this_month: 3,
            revenue_generated: '$1.2M',
            client_satisfaction: '94%'
          }
        }
      };

      setOperationalData(mockData);
    } catch (error) {
      console.error('Error loading Jorge operational data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestBrokerAssessment = async (partnerId, notes) => {
    console.log(`🤝 Requesting Cristina's assessment for partner ${partnerId}: ${notes}`);
    // This would integrate with the collaboration system
    alert('Broker assessment request sent to Cristina');
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="hero-badge">Loading Jorge's operations...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminNavigation user={user} />

      <div className="main-content">
        <div className="container-app">
          {/* Header */}
          <div className="section-header">
            <h1 className="section-header-title">🇲🇽 Jorge's Partnership Operations</h1>
            <p className="section-header-subtitle">
              Mexico partnership development and Latin America market intelligence
            </p>
          </div>

          {/* Performance Metrics */}
          <div className="content-card">
            <h2 className="content-card-title">📊 Jorge's Business Performance</h2>

            <div className="grid-4-cols">
              <div className="status-card success">
                <div className="status-label">Active Partnerships</div>
                <div className="status-value">{operationalData.metrics.active_partnerships}</div>
              </div>
              <div className="status-card">
                <div className="status-label">Pipeline Value</div>
                <div className="status-value">{operationalData.metrics.pipeline_value}</div>
              </div>
              <div className="status-card">
                <div className="status-label">Success Rate</div>
                <div className="status-value">{operationalData.metrics.success_rate}</div>
              </div>
              <div className="status-card">
                <div className="status-label">Client Satisfaction</div>
                <div className="status-value">{operationalData.metrics.jorge_performance?.client_satisfaction}</div>
              </div>
            </div>
          </div>

          {/* Partner Pipeline */}
          <div className="content-card">
            <h2 className="content-card-title">🏢 Mexico Partner Pipeline</h2>

            {operationalData.partnerPipeline.map(partner => (
              <div key={partner.id} className="content-card">
                <div className="grid-2-cols">
                  <div>
                    <h3 className="content-card-title">{partner.name}</h3>
                    <p className="content-card-description">
                      📍 {partner.location}<br/>
                      🏭 {partner.specialization}<br/>
                      <strong>Jorge's Assessment:</strong> {partner.jorge_rating}<br/>
                      <strong>Cristina Assessment:</strong> {partner.cristina_rating}
                    </p>
                  </div>
                  <div>
                    <div className={`badge ${partner.priority === 'high' ? 'badge-success' : 'badge-warning'}`}>
                      {partner.priority.toUpperCase()} PRIORITY
                    </div>
                    <div className="element-spacing">
                      <p className="text-body">
                        <strong>Jorge's Notes:</strong><br/>
                        {partner.jorge_notes}
                      </p>
                      {partner.stage === 'qualification' && (
                        <button
                          className="hero-primary-button"
                          onClick={() => handleRequestBrokerAssessment(partner.id, 'Ready for Cristina\'s logistics assessment')}
                        >
                          Request Broker Assessment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Client Assignments */}
          <div className="content-card">
            <h2 className="section-header-title">🎯 Jorge's Client Assignments</h2>

            {operationalData.clientAssignments.length > 0 ? (
              operationalData.clientAssignments.map(assignment => (
                <div key={assignment.id} className="content-card">
                  <h3 className="content-card-title">{assignment.client_name}</h3>
                  <p className="content-card-description">
                    <strong>Business Type:</strong> {assignment.business_type}<br/>
                    <strong>Trade Volume:</strong> {assignment.trade_volume}<br/>
                    <strong>Complexity Score:</strong> {assignment.complexity_score}/10<br/>
                    <strong>Needs Collaboration:</strong> {assignment.collaboration_required ? 'Yes (with Cristina)' : 'Jorge only'}<br/>
                    <strong>Status:</strong> {assignment.jorge_status}
                  </p>

                  {assignment.collaboration_required && (
                    <button className="hero-secondary-button">
                      Request Cristina Collaboration
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="alert alert-info">
                <div className="alert-content">
                  <p className="text-body">No clients currently assigned to Jorge.</p>
                </div>
              </div>
            )}
          </div>

          {/* Jorge-Cristina Collaboration */}
          <div className="content-card">
            <h2 className="section-header-title">🤝 Jorge-Cristina Collaboration</h2>

            {operationalData.collaborationQueue.map(item => (
              <div key={item.id} className="content-card">
                <h3 className="content-card-title">{item.title}</h3>
                <p className="content-card-description">{item.description}</p>

                <div className="grid-2-cols">
                  <div>
                    <h4 className="content-card-title">Jorge's Input:</h4>
                    <p className="text-body">{item.jorge_input}</p>
                  </div>
                  <div>
                    <h4 className="content-card-title">Cristina's Input:</h4>
                    <p className="text-body">{item.cristina_input}</p>
                  </div>
                </div>

                <div className="element-spacing">
                  <button className="hero-primary-button">
                    Add Jorge Input
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}