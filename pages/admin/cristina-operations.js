/**
 * Cristina Operations Dashboard - Admin View
 * USMCA compliance and logistics specialist operations
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';

export default function CristinaOperations() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [operationalData, setOperationalData] = useState({
    brokerOperations: [],
    complianceQueue: [],
    logisticsOptimization: [],
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
      loadCristinaOperationalData();
    } catch (e) {
      router.push('/login');
    }
  }, []);

  const loadCristinaOperationalData = async () => {
    try {
      setLoading(true);
      console.log('🚢 Loading Cristina\'s operational business data...');

      // Simulate Cristina's operational data
      const mockData = {
        brokerOperations: [
          {
            id: '1',
            client_name: 'TechCorp Industries',
            shipment_type: 'Electronics Components',
            route: 'Canada → Mexico → US',
            status: 'customs_clearance',
            usmca_status: 'Qualified',
            savings_generated: '$45,000',
            timeline: '5 days remaining',
            complexity: 'High'
          },
          {
            id: '2',
            client_name: 'Automotive Parts Ltd',
            shipment_type: 'Auto Components',
            route: 'Mexico → US',
            status: 'documentation_complete',
            usmca_status: 'Verified',
            savings_generated: '$28,500',
            timeline: 'Ready for shipment',
            complexity: 'Medium'
          }
        ],
        complianceQueue: [
          {
            id: '1',
            company: 'Manufacturas Mexicanas SA',
            request_type: 'USMCA Qualification Review',
            priority: 'high',
            cristina_assessment: 'Regional content verified at 72%, meets electronics threshold',
            jorge_referral: 'High-value partnership opportunity',
            status: 'in_review',
            estimated_completion: '2 business days'
          }
        ],
        logisticsOptimization: [
          {
            id: '1',
            client: 'Global Electronics Inc',
            current_route: 'China → US (Direct)',
            proposed_route: 'China → Mexico → US (Triangle)',
            potential_savings: '$125,000 annually',
            timeline_impact: '+3 days transit',
            usmca_benefits: 'Eliminate 15% tariff',
            implementation_status: 'Design phase'
          }
        ],
        metrics: {
          active_shipments: 24,
          avg_clearance_time: '3.2 days',
          compliance_success_rate: '98.5%',
          total_savings_facilitated: '$2.1M',
          cristina_performance: {
            cases_this_month: 18,
            avg_processing_time: '2.8 days',
            client_satisfaction: '97%',
            jorge_collaborations: 6
          }
        }
      };

      setOperationalData(mockData);
    } catch (error) {
      console.error('Error loading Cristina operational data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="hero-badge">Loading Cristina's operations...</div>
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
            <h1 className="section-header-title">🚢 Cristina's Broker Operations</h1>
            <p className="section-header-subtitle">
              USMCA compliance specialist and logistics optimization expert
            </p>
          </div>

          {/* Performance Metrics */}
          <div className="content-card">
            <h2 className="content-card-title">📊 Cristina's Performance Dashboard</h2>

            <div className="grid-4-cols">
              <div className="status-card success">
                <div className="status-label">Active Shipments</div>
                <div className="status-value">{operationalData.metrics.active_shipments}</div>
              </div>
              <div className="status-card">
                <div className="status-label">Avg Clearance Time</div>
                <div className="status-value">{operationalData.metrics.avg_clearance_time}</div>
              </div>
              <div className="status-card success">
                <div className="status-label">Compliance Success</div>
                <div className="status-value">{operationalData.metrics.compliance_success_rate}</div>
              </div>
              <div className="status-card">
                <div className="status-label">Total Savings</div>
                <div className="status-value">{operationalData.metrics.total_savings_facilitated}</div>
              </div>
            </div>

            <div className="grid-3-cols">
              <div className="status-card">
                <div className="status-label">Cases This Month</div>
                <div className="status-value">{operationalData.metrics.cristina_performance.cases_this_month}</div>
              </div>
              <div className="status-card">
                <div className="status-label">Client Satisfaction</div>
                <div className="status-value">{operationalData.metrics.cristina_performance.client_satisfaction}</div>
              </div>
              <div className="status-card">
                <div className="status-label">Jorge Collaborations</div>
                <div className="status-value">{operationalData.metrics.cristina_performance.jorge_collaborations}</div>
              </div>
            </div>
          </div>

          {/* Active Broker Operations */}
          <div className="content-card">
            <h2 className="content-card-title">🚛 Active Broker Operations</h2>

            {operationalData.brokerOperations.map(operation => (
              <div key={operation.id} className="content-card">
                <div className="grid-2-cols">
                  <div>
                    <h3 className="content-card-title">{operation.client_name}</h3>
                    <p className="content-card-description">
                      📦 {operation.shipment_type}<br/>
                      🛣️ Route: {operation.route}<br/>
                      💰 Savings Generated: {operation.savings_generated}<br/>
                      ⏰ Timeline: {operation.timeline}
                    </p>
                  </div>
                  <div>
                    <div className={`badge ${operation.usmca_status === 'Qualified' ? 'badge-success' : 'badge-warning'}`}>
                      USMCA: {operation.usmca_status}
                    </div>
                    <div className={`badge ${operation.complexity === 'High' ? 'badge-danger' : 'badge-info'}`}>
                      {operation.complexity} Complexity
                    </div>
                    <div className="element-spacing">
                      <div className={`status-card ${operation.status === 'customs_clearance' ? 'warning' : 'success'}`}>
                        <div className="status-label">Status</div>
                        <div className="status-value">{operation.status.replace('_', ' ').toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compliance Queue */}
          <div className="content-card">
            <h2 className="content-card-title">⚖️ USMCA Compliance Queue</h2>

            {operationalData.complianceQueue.map(item => (
              <div key={item.id} className="content-card">
                <h3 className="content-card-title">{item.company}</h3>
                <p className="content-card-description">
                  <strong>Request:</strong> {item.request_type}<br/>
                  <strong>Jorge's Referral:</strong> {item.jorge_referral}<br/>
                  <strong>Estimated Completion:</strong> {item.estimated_completion}
                </p>

                <div className="alert alert-info">
                  <div className="alert-content">
                    <div className="alert-title">Cristina's Assessment</div>
                    <div className="text-body">{item.cristina_assessment}</div>
                  </div>
                </div>

                <div className="grid-2-cols">
                  <div className={`badge ${item.priority === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                    {item.priority.toUpperCase()} PRIORITY
                  </div>
                  <button className="hero-primary-button">Update Assessment</button>
                </div>
              </div>
            ))}
          </div>

          {/* Logistics Optimization Projects */}
          <div className="content-card">
            <h2 className="content-card-title">🔄 Triangle Routing Optimization</h2>

            {operationalData.logisticsOptimization.map(project => (
              <div key={project.id} className="content-card">
                <h3 className="content-card-title">{project.client}</h3>

                <div className="grid-2-cols">
                  <div>
                    <h4 className="content-card-title">Current vs Proposed</h4>
                    <p className="text-body">
                      <strong>Current:</strong> {project.current_route}<br/>
                      <strong>Proposed:</strong> {project.proposed_route}
                    </p>
                  </div>
                  <div>
                    <h4 className="content-card-title">Impact Analysis</h4>
                    <p className="text-body">
                      <strong>Annual Savings:</strong> {project.potential_savings}<br/>
                      <strong>Timeline Impact:</strong> {project.timeline_impact}<br/>
                      <strong>USMCA Benefits:</strong> {project.usmca_benefits}
                    </p>
                  </div>
                </div>

                <div className="status-card info">
                  <div className="status-label">Implementation Status</div>
                  <div className="status-value">{project.implementation_status}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Collaboration with Jorge */}
          <div className="content-card">
            <h2 className="content-card-title">🤝 Cristina-Jorge Partnership Pipeline</h2>

            <div className="alert alert-success">
              <div className="alert-content">
                <div className="alert-title">Active Collaborations</div>
                <div className="text-body">
                  Currently working with Jorge on {operationalData.metrics.cristina_performance.jorge_collaborations} joint client projects,
                  focusing on Mexico partnership development combined with logistics optimization.
                </div>
              </div>
            </div>

            <div className="grid-2-cols">
              <button className="hero-primary-button">View Joint Projects</button>
              <button className="hero-secondary-button">Request Jorge Input</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}