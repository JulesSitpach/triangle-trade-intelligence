import { useState, useEffect } from 'react'
import Head from 'next/head'
import PartnershipSalesChatBot from '../components/PartnershipSalesChatBot'

export default function PartnershipCRM() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [revenueMetrics, setRevenueMetrics] = useState({
    monthlyCommissions: 127300,
    q4Target: 400000,
    q4Earned: 381200,
    annualEarned: 1847300,
    pipelineValue: 312000,
    activeLeads: 8,
    closedDeals: 4,
    responseRate: 89
  })

  const [leads, setLeads] = useState([
    {
      id: 1,
      company: 'Apex Manufacturing',
      contact: 'David Chen',
      importVolume: 4200000,
      currentRoute: 'China → USA',
      savings: 1050000,
      commission: 52500,
      status: 'proposal_sent',
      urgency: 'high',
      daysInPipeline: 3,
      industry: 'Electronics',
      lastContact: '2024-12-15',
      nextAction: 'Follow up on proposal',
      probability: 85
    },
    {
      id: 2,
      company: 'TechFlow Industries',
      contact: 'Sarah Johnson',
      importVolume: 2800000,
      currentRoute: 'India → USA',
      savings: 840000,
      commission: 42000,
      status: 'decision_pending',
      urgency: 'high',
      daysInPipeline: 7,
      industry: 'Technology',
      lastContact: '2024-12-13',
      nextAction: 'Decision promised by Friday',
      probability: 75
    },
    {
      id: 3,
      company: 'MegaCorp Electronics',
      contact: 'Michael Torres',
      importVolume: 5600000,
      currentRoute: 'China → USA',
      savings: 1780000,
      commission: 89000,
      status: 'intro_scheduled',
      urgency: 'medium',
      daysInPipeline: 1,
      industry: 'Electronics',
      lastContact: '2024-12-16',
      nextAction: 'Introduction call Wed 2pm',
      probability: 60
    }
  ])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <>
      <Head>
        <title>Partnership Sales CRM - Triangle Intelligence</title>
        <meta name="description" content="Internal Partnership Sales CRM for revenue optimization" />
      </Head>

      <div className="partnership-crm">
        {/* Header */}
        <nav className="crm-header">
          <div className="crm-brand">
            <span className="text-success">◢</span>
            <span className="brand-text">Partnership Sales CRM</span>
            <span className="badge badge-warning">INTERNAL</span>
          </div>
          <div className="crm-user-info">
            <div className="user-metrics">
              <span className="metric-item">
                <strong>{formatCurrency(revenueMetrics.monthlyCommissions)}</strong>
                <small>Dec Commissions</small>
              </span>
              <span className="metric-item">
                <strong>{revenueMetrics.activeLeads}</strong>
                <small>Active Leads</small>
              </span>
            </div>
            <div className="user-avatar">
              <span>👨‍💼</span>
            </div>
          </div>
        </nav>

        {/* Tab Navigation */}
        <div className="crm-tabs">
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Revenue Dashboard
          </button>
          <button 
            className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            🎯 Lead Pipeline
          </button>
          <button 
            className={`tab-btn ${activeTab === 'specialists' ? 'active' : ''}`}
            onClick={() => setActiveTab('specialists')}
          >
            🇲🇽 Mexican Specialists
          </button>
          <button 
            className={`tab-btn ${activeTab === 'forecasting' ? 'active' : ''}`}
            onClick={() => setActiveTab('forecasting')}
          >
            🔮 Revenue Forecasting
          </button>
        </div>

        {/* Main Content */}
        <div className="crm-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-tab">
              {/* Revenue Metrics */}
              <div className="metrics-grid">
                <div className="metric-card primary">
                  <div className="metric-header">
                    <h4>December Performance</h4>
                    <span className="badge badge-success">+23% vs Nov</span>
                  </div>
                  <div className="metric-value">{formatCurrency(revenueMetrics.monthlyCommissions)}</div>
                  <div className="metric-details">
                    <small>{revenueMetrics.closedDeals} deals closed • {revenueMetrics.responseRate}% response rate</small>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <h4>Q4 Target Progress</h4>
                    <span className="badge badge-info">95% Complete</span>
                  </div>
                  <div className="metric-value">{formatCurrency(revenueMetrics.q4Earned)}</div>
                  <div className="metric-details">
                    <small>Target: {formatCurrency(revenueMetrics.q4Target)} • Remaining: {formatCurrency(revenueMetrics.q4Target - revenueMetrics.q4Earned)}</small>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <h4>Pipeline Value</h4>
                    <span className="badge badge-warning">{revenueMetrics.activeLeads} Active</span>
                  </div>
                  <div className="metric-value">{formatCurrency(revenueMetrics.pipelineValue)}</div>
                  <div className="metric-details">
                    <small>Weighted forecast • 80% avg close rate</small>
                  </div>
                </div>

                <div className="metric-card success">
                  <div className="metric-header">
                    <h4>2024 Annual</h4>
                    <span className="badge badge-success">123% of Target</span>
                  </div>
                  <div className="metric-value">{formatCurrency(revenueMetrics.annualEarned)}</div>
                  <div className="metric-details">
                    <small>Exceptional year! Target: $1.5M</small>
                  </div>
                </div>
              </div>

              {/* Top Opportunities */}
              <div className="opportunities-section">
                <h3>🔥 Top Opportunities This Week</h3>
                <div className="opportunities-grid">
                  {leads.filter(lead => lead.probability > 70).map(lead => (
                    <div key={lead.id} className="opportunity-card">
                      <div className="opportunity-header">
                        <h4>{lead.company}</h4>
                        <span className="badge badge-info">
                          {lead.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="opportunity-details">
                        <div className="detail-row">
                          <span>Commission:</span>
                          <strong>{formatCurrency(lead.commission)}</strong>
                        </div>
                        <div className="detail-row">
                          <span>Probability:</span>
                          <strong>{lead.probability}%</strong>
                        </div>
                        <div className="detail-row">
                          <span>Next Action:</span>
                          <span>{lead.nextAction}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="leads-tab">
              <div className="leads-header">
                <h3>🎯 Active Lead Pipeline</h3>
                <div className="leads-stats">
                  <span className="stat">
                    <strong>{leads.length}</strong> Active Leads
                  </span>
                  <span className="stat">
                    <strong>{formatCurrency(leads.reduce((sum, lead) => sum + lead.commission, 0))}</strong> Total Commission Potential
                  </span>
                </div>
              </div>

              <div className="leads-list">
                {leads.map(lead => (
                  <div key={lead.id} className="lead-card">
                    <div className="lead-header">
                      <h4>{lead.company}</h4>
                      <span className="commission">{formatCurrency(lead.commission)}</span>
                    </div>
                    <div className="lead-details">
                      <div className="detail-row">
                        <span>Contact:</span>
                        <span>{lead.contact} • {lead.industry}</span>
                      </div>
                      <div className="detail-row">
                        <span>Import Volume:</span>
                        <span>{formatCurrency(lead.importVolume)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Status:</span>
                        <span className="badge badge-info">{lead.status.replace('_', ' ')}</span>
                      </div>
                      <div className="detail-row">
                        <span>Probability:</span>
                        <span><strong>{lead.probability}%</strong></span>
                      </div>
                      <div className="detail-row">
                        <span>Next Action:</span>
                        <span>{lead.nextAction}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'specialists' && (
            <div className="specialists-tab">
              <h3>🇲🇽 Mexican Specialist Network</h3>
              <div className="specialists-grid">
                <div className="specialist-card available">
                  <div className="specialist-header">
                    <h4>Carlos Mendoza</h4>
                    <span className="status-badge available">AVAILABLE</span>
                  </div>
                  <div className="specialist-details">
                    <div className="detail-row"><span>📍 Location:</span><span>Tijuana Electronics Hub</span></div>
                    <div className="detail-row"><span>🎯 Specialization:</span><span>Electronics & Automotive</span></div>
                    <div className="detail-row"><span>⭐ Success Rate:</span><strong>94%</strong></div>
                    <div className="detail-row"><span>⏱️ Avg Timeline:</span><span>22 days</span></div>
                    <div className="detail-row"><span>💰 Your Commissions:</span><strong>$87,000</strong></div>
                  </div>
                </div>

                <div className="specialist-card available">
                  <div className="specialist-header">
                    <h4>Ana Rodriguez</h4>
                    <span className="status-badge available">AVAILABLE</span>
                  </div>
                  <div className="specialist-details">
                    <div className="detail-row"><span>📍 Location:</span><span>BorderTech Juárez</span></div>
                    <div className="detail-row"><span>🎯 Specialization:</span><span>Electronics + Automotive</span></div>
                    <div className="detail-row"><span>⭐ Success Rate:</span><strong>97%</strong></div>
                    <div className="detail-row"><span>⏱️ Avg Timeline:</span><span>19 days</span></div>
                    <div className="detail-row"><span>💰 Your Commissions:</span><strong>$156,000</strong></div>
                  </div>
                </div>

                <div className="specialist-card busy">
                  <div className="specialist-header">
                    <h4>Roberto Silva</h4>
                    <span className="status-badge busy">BUSY</span>
                  </div>
                  <div className="specialist-details">
                    <div className="detail-row"><span>📍 Location:</span><span>Nuevo Laredo Manufacturing</span></div>
                    <div className="detail-row"><span>🎯 Specialization:</span><span>Manufacturing & Logistics</span></div>
                    <div className="detail-row"><span>⭐ Success Rate:</span><strong>100%</strong></div>
                    <div className="detail-row"><span>⏱️ Avg Timeline:</span><span>16.3 days</span></div>
                    <div className="detail-row"><span>💰 Your Commissions:</span><strong>$127,400</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Partnership Sales ChatBot */}
        <PartnershipSalesChatBot />
      </div>

      <style jsx>{`
        .partnership-crm {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          color: white;
        }

        .crm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: rgba(0,0,0,0.3);
          border-bottom: 2px solid #333;
        }

        .crm-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .text-success { color: #00d4aa; }
        .brand-text { color: white; }

        .crm-user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-metrics {
          display: flex;
          gap: 1rem;
        }

        .metric-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .metric-item strong {
          color: #00d4aa;
          font-size: 1.1rem;
        }

        .metric-item small {
          color: #ccc;
          font-size: 0.8rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: #333;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .crm-tabs {
          display: flex;
          background: rgba(0,0,0,0.2);
          border-bottom: 1px solid #333;
        }

        .tab-btn {
          padding: 1rem 2rem;
          background: none;
          border: none;
          color: #ccc;
          cursor: pointer;
          transition: all 0.3s;
          border-bottom: 3px solid transparent;
        }

        .tab-btn:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .tab-btn.active {
          color: #00d4aa;
          border-bottom-color: #00d4aa;
          background: rgba(0,212,170,0.1);
        }

        .crm-content {
          padding: 2rem;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .metric-card.primary {
          background: linear-gradient(135deg, rgba(0,212,170,0.2), rgba(0,150,136,0.1));
          border-color: #00d4aa;
        }

        .metric-card.success {
          background: linear-gradient(135deg, rgba(76,175,80,0.2), rgba(56,142,60,0.1));
          border-color: #4caf50;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .metric-header h4 {
          margin: 0;
          color: #ccc;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-value {
          font-size: 2rem;
          font-weight: bold;
          color: #00d4aa;
          margin-bottom: 0.5rem;
        }

        .metric-details small {
          color: #aaa;
          font-size: 0.8rem;
        }

        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: bold;
          text-transform: uppercase;
        }

        .badge-success { background: #4caf50; color: white; }
        .badge-warning { background: #ff9800; color: white; }
        .badge-info { background: #2196f3; color: white; }

        .opportunities-section, .leads-header {
          margin-top: 2rem;
        }

        .opportunities-section h3, .leads-header h3 {
          margin-bottom: 1rem;
          color: #00d4aa;
        }

        .opportunities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .opportunity-card {
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 1.5rem;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .opportunity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .opportunity-header h4 {
          margin: 0;
          color: white;
        }

        .opportunity-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .detail-row span:first-child {
          color: #ccc;
          font-size: 0.9rem;
        }

        .leads-stats {
          display: flex;
          gap: 2rem;
          margin-bottom: 1rem;
        }

        .stat {
          color: #ccc;
        }

        .stat strong {
          color: #00d4aa;
        }

        .leads-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .lead-card {
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .lead-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .lead-header h4 {
          margin: 0;
          color: white;
          font-size: 1.2rem;
        }

        .commission {
          font-size: 1.2rem;
          font-weight: bold;
          color: #00d4aa;
        }

        .lead-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
        }

        .specialists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .specialist-card {
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 1.5rem;
          border: 2px solid rgba(255,255,255,0.2);
        }

        .specialist-card.available {
          border-color: #4caf50;
          background: rgba(76,175,80,0.1);
        }

        .specialist-card.busy {
          border-color: #ff9800;
          background: rgba(255,152,0,0.1);
        }

        .specialist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .specialist-header h4 {
          margin: 0;
          color: white;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: bold;
        }

        .status-badge.available {
          background: #4caf50;
          color: white;
        }

        .status-badge.busy {
          background: #ff9800;
          color: white;
        }

        .specialist-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .crm-header {
            padding: 1rem;
          }
          
          .crm-tabs {
            overflow-x: auto;
          }
          
          .tab-btn {
            padding: 0.8rem 1rem;
            font-size: 0.9rem;
            white-space: nowrap;
          }
          
          .crm-content {
            padding: 1rem;
          }
          
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          
          .opportunities-grid {
            grid-template-columns: 1fr;
          }
          
          .specialists-grid {
            grid-template-columns: 1fr;
          }
          
          .lead-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}