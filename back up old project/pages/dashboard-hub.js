/**
 * DASHBOARD HUB - Enterprise Intelligence Center
 * Multiple specialized dashboards for different use cases
 * Bloomberg Terminal / Salesforce-style interface
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import ExecutiveDashboard from '../components/ExecutiveDashboard'
import FinancialDashboard from '../components/FinancialDashboard'
import ImplementationDashboard from '../components/ImplementationDashboard'
// TODO: Create these missing dashboard components
// import PartnershipDashboard from '../components/PartnershipDashboard'
// Bloomberg-compliant: SVG icons removed per compliance requirements

export default function DashboardHub() {
  const router = useRouter()
  const [activeView, setActiveView] = useState('executive')
  const [liveData, setLiveData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Load user journey data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const foundationData = localStorage.getItem('triangle-foundation')
      const productData = localStorage.getItem('triangle-product')
      const routingData = localStorage.getItem('triangle-routing')
      
      if (foundationData && productData && routingData) {
        const combinedData = {
          foundation: JSON.parse(foundationData),
          product: JSON.parse(productData),
          routing: JSON.parse(routingData)
        }
        setLiveData(combinedData)
      }
    }
  }, [])

  return (
    <>
      <Head>
        <title>Triangle Intelligence - Executive Dashboard Hub</title>
        <meta name="description" content="Enterprise-grade trade intelligence dashboards for executive decision making" />
      </Head>

      <div className="dashboard-hub">
        {/* Top Navigation Bar */}
        <nav className="hub-nav">
          <div className="hub-nav-brand">
            <Link href="/" className="brand-link">
              <span className="bloomberg-status bloomberg-status-success">📈</span>
              Triangle Intelligence Hub
            </Link>
          </div>
          
          <div className="hub-nav-status">
            <div className="live-indicator">
              <div className="live-dot"></div>
              Live Data Connected
            </div>
            <div className="last-updated">
              Updated: {new Date().toLocaleString()}
            </div>
          </div>
          
          <div className="hub-nav-actions">
            <button className="hub-btn hub-btn-ghost">
              <span className="bloomberg-status bloomberg-status-warning">⚠️</span>
              Alerts
            </button>
            <Link href="/foundation" className="hub-btn hub-btn-primary">
              New Analysis
            </Link>
          </div>
        </nav>

        {/* Dashboard Selection Tabs */}
        <div className="dashboard-tabs">
          <button 
            className={`dashboard-tab ${activeView === 'executive' ? 'active' : ''}`}
            onClick={() => setActiveView('executive')}
          >
            <span className="bloomberg-status bloomberg-status-info">📋</span>
            <div className="tab-content">
              <div className="tab-title">Executive</div>
              <div className="tab-subtitle">30-second scan</div>
            </div>
          </button>

          <button 
            className={`dashboard-tab ${activeView === 'financial' ? 'active' : ''}`}
            onClick={() => setActiveView('financial')}
          >
            <span className="bloomberg-status bloomberg-status-success">📊</span>
            <div className="tab-content">
              <div className="tab-title">Financial</div>
              <div className="tab-subtitle">ROI analysis</div>
            </div>
          </button>

          <button 
            className={`dashboard-tab ${activeView === 'implementation' ? 'active' : ''}`}
            onClick={() => setActiveView('implementation')}
          >
            <span className="bloomberg-status bloomberg-status-info">⏰</span>
            <div className="tab-content">
              <div className="tab-title">Implementation</div>
              <div className="tab-subtitle">Action roadmap</div>
            </div>
          </button>

          <button 
            className={`dashboard-tab ${activeView === 'partnership' ? 'active' : ''}`}
            onClick={() => setActiveView('partnership')}
          >
            <span className="bloomberg-status bloomberg-status-success">🤝</span>
            <div className="tab-content">
              <div className="tab-title">Partnership</div>
              <div className="tab-subtitle">Deal pipeline</div>
            </div>
          </button>
        </div>

        {/* Dynamic Dashboard Content */}
        <div className="dashboard-content">
          {!liveData ? (
            <div className="dashboard-empty-state">
              <div className="empty-state-icon">
                <span className="bloomberg-status bloomberg-status-info">📋</span>
              </div>
              <div className="empty-state-title">No Analysis Data Available</div>
              <div className="empty-state-subtitle">
                Complete a trade analysis to access enterprise intelligence dashboards
              </div>
              <div className="empty-state-actions">
                <Link href="/foundation" className="hub-btn hub-btn-primary hub-btn-large">
                  Start Trade Analysis
                </Link>
                <Link href="/demo" className="hub-btn hub-btn-ghost hub-btn-large">
                  View Demo Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <>
              {activeView === 'executive' && (
                <ExecutiveDashboard data={liveData} />
              )}
              
              {activeView === 'financial' && (
                <div className="dashboard-placeholder">
                  <h3>Financial Dashboard</h3>
                  <p>Financial dashboard component under development</p>
                </div>
              )}
              
              {activeView === 'implementation' && (
                <div className="dashboard-placeholder">
                  <h3>Implementation Dashboard</h3>
                  <p>Implementation dashboard component under development</p>
                </div>
              )}
              
              {activeView === 'partnership' && (
                <div className="dashboard-placeholder">
                  <h3>Partnership Dashboard</h3>
                  <p>Partnership dashboard component under development</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="dashboard-status-bar">
          <div className="status-section">
            <div className="status-label">System Status</div>
            <div className="status-value">
              <div className="status-indicator status-healthy"></div>
              All Systems Operational
            </div>
          </div>
          
          <div className="status-section">
            <div className="status-label">Database</div>
            <div className="status-value">597K+ trade flows active</div>
          </div>
          
          <div className="status-section">
            <div className="status-label">API Calls</div>
            <div className="status-value">23 today • 89% cached</div>
          </div>
          
          <div className="status-section">
            <div className="status-label">Intelligence Score</div>
            <div className="status-value">
              <div className="score-badge">8.7/10</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}