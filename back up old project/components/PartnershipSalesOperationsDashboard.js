/**
 * PARTNERSHIP SALES OPERATIONS DASHBOARD - Internal Team Tool
 * FOR: Husband's Mexican specialist network management
 * PURPOSE: Lead pipeline, commission tracking, deal management
 * FOCUS: Converting Triangle Intelligence platform leads into partnership revenue
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function PartnershipSalesOperationsDashboard() {
  const [salesData, setSalesData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load sales operations data
    loadSalesOperationsData()
  }, [])

  const loadSalesOperationsData = async () => {
    // Simulate real sales data - in production, this would come from your CRM/database
    const mockData = {
      // Pipeline Overview
      pipeline: {
        totalLeads: 47,
        qualifiedLeads: 23,
        activeDeals: 12,
        closedThisMonth: 3,
        avgDealSize: 125000,
        conversionRate: 24.5
      },

      // Commission Tracking
      commissions: {
        thisMonth: 67500,
        thisQuarter: 185000,
        ytd: 425000,
        target: 600000,
        avgCommission: 22500,
        topDeal: 45000
      },

      // Recent Leads from Platform
      recentLeads: [
        {
          id: 'TI-001',
          company: 'Southwest Electronics Inc',
          contact: 'Maria Rodriguez',
          leadSource: 'Triangle Intelligence Analysis',
          importVolume: '$2.3M annually',
          potentialSavings: '$690K',
          estimatedCommission: '$34,500',
          status: 'Qualified',
          priority: 'high',
          lastActivity: '2 hours ago',
          nextAction: 'Technical call scheduled',
          assignedSpecialist: 'Carlos Mendez - Mexico City'
        },
        {
          id: 'TI-002',
          company: 'Pacific Manufacturing Group',
          contact: 'David Chen',
          leadSource: 'Triangle Intelligence Analysis',
          importVolume: '$5.1M annually',
          potentialSavings: '$1.53M',
          estimatedCommission: '$76,500',
          status: 'Initial Contact',
          priority: 'critical',
          lastActivity: '6 hours ago',
          nextAction: 'Send partnership proposal',
          assignedSpecialist: 'Ana Gutierrez - Guadalajara'
        },
        {
          id: 'TI-003',
          company: 'Heritage Automotive Parts',
          contact: 'Jennifer Smith',
          leadSource: 'Triangle Intelligence Analysis',
          importVolume: '$800K annually',
          potentialSavings: '$240K',
          estimatedCommission: '$12,000',
          status: 'Follow-up',
          priority: 'medium',
          lastActivity: '1 day ago',
          nextAction: 'Schedule Mexico facility tour',
          assignedSpecialist: 'Roberto Silva - Tijuana'
        }
      ],

      // Specialist Network Performance
      specialists: [
        {
          name: 'Carlos Mendez',
          location: 'Mexico City',
          specialty: 'Electronics & Tech',
          activeDeals: 5,
          closedThisQuarter: 7,
          avgDealSize: 145000,
          commissionGenerated: 87500,
          rating: 4.9,
          responseTime: '2.3 hours',
          status: 'available'
        },
        {
          name: 'Ana Gutierrez',
          location: 'Guadalajara',
          specialty: 'Manufacturing & Industrial',
          activeDeals: 4,
          closedThisQuarter: 5,
          avgDealSize: 180000,
          commissionGenerated: 112500,
          rating: 4.8,
          responseTime: '1.8 hours',
          status: 'busy'
        },
        {
          name: 'Roberto Silva',
          location: 'Tijuana',
          specialty: 'Automotive & Parts',
          activeDeals: 3,
          closedThisQuarter: 6,
          avgDealSize: 95000,
          commissionGenerated: 67500,
          rating: 4.7,
          responseTime: '3.1 hours',
          status: 'available'
        }
      ],

      // Performance Metrics
      performance: {
        leadsFromPlatform: 34,
        platformConversionRate: 31.2,
        avgTimeToClose: 18,
        customerSatisfaction: 4.6,
        repeatBusiness: 23,
        referralRate: 18
      },

      // Monthly Targets
      targets: {
        newLeads: { target: 50, actual: 47, percentage: 94 },
        qualifiedDeals: { target: 25, actual: 23, percentage: 92 },
        closedDeals: { target: 8, actual: 3, percentage: 38 },
        revenue: { target: 200000, actual: 67500, percentage: 34 }
      }
    }

    setSalesData(mockData)
    setLoading(false)
  }

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount/1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount/1000).toFixed(0)}K`
    return `$${Math.round(amount).toLocaleString()}`
  }

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'qualified': return 'success'
      case 'initial contact': return 'warning'
      case 'follow-up': return 'info'
      case 'closed': return 'success'
      case 'lost': return 'error'
      default: return 'info'
    }
  }

  const getPriorityColor = (priority) => {
    switch(priority.toLowerCase()) {
      case 'critical': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'info'
    }
  }

  if (loading || !salesData) {
    return (
      <div className="bloomberg-card">
        <div className="bloomberg-text-center bloomberg-p-xl">
          <div className="loading-spinner"></div>
          <h3>Loading Sales Operations...</h3>
          <p>Retrieving pipeline and commission data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="sales-operations-dashboard">
      {/* Header with Key Metrics */}
      <div className="bloomberg-card bloomberg-mb-lg">
        <div className="bloomberg-card-header">
          <h2 className="bloomberg-card-title">🤝 Partnership Sales Operations</h2>
          <div className="bloomberg-status bloomberg-status-success">
            <div className="bloomberg-status-dot"></div>
            LIVE PIPELINE
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="bloomberg-grid bloomberg-grid-4 bloomberg-mb-lg">
          <div className="bloomberg-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-success">{formatCurrency(salesData.commissions.thisMonth)}</div>
              <div className="bloomberg-metric-label">This Month Commissions</div>
            </div>
            <div className="metric-change positive">+{((salesData.commissions.thisMonth / salesData.commissions.target) * 100).toFixed(0)}% of target</div>
          </div>

          <div className="bloomberg-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-warning">{salesData.pipeline.activeDeals}</div>
              <div className="bloomberg-metric-label">Active Deals</div>
            </div>
            <div className="metric-change positive">Avg: {formatCurrency(salesData.pipeline.avgDealSize)}</div>
          </div>

          <div className="bloomberg-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-info">{salesData.pipeline.qualifiedLeads}</div>
              <div className="bloomberg-metric-label">Qualified Leads</div>
            </div>
            <div className="metric-change positive">{salesData.pipeline.conversionRate}% conversion</div>
          </div>

          <div className="bloomberg-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-primary">{salesData.performance.leadsFromPlatform}</div>
              <div className="bloomberg-metric-label">Platform Leads</div>
            </div>
            <div className="metric-change positive">{salesData.performance.platformConversionRate}% convert</div>
          </div>
        </div>
      </div>

      {/* Recent Leads from Triangle Intelligence Platform */}
      <div className="bloomberg-card bloomberg-mb-lg">
        <div className="bloomberg-card-header">
          <h3 className="bloomberg-card-title">🎯 Hot Leads from Triangle Intelligence Platform</h3>
          <div className="bloomberg-status bloomberg-status-warning">ACTION REQUIRED</div>
        </div>

        <div className="leads-table">
          {salesData.recentLeads.map((lead) => (
            <div key={lead.id} className="lead-row">
              <div className="lead-main">
                <div className="lead-header">
                  <div className="lead-company">{lead.company}</div>
                  <div className={`bloomberg-status bloomberg-status-${getPriorityColor(lead.priority)} small`}>
                    {lead.priority.toUpperCase()}
                  </div>
                </div>
                
                <div className="lead-details">
                  <div className="lead-contact">Contact: {lead.contact}</div>
                  <div className="lead-volume">Volume: {lead.importVolume}</div>
                  <div className="lead-savings">Potential Savings: {lead.potentialSavings}</div>
                </div>

                <div className="lead-specialist">
                  <strong>Assigned:</strong> {lead.assignedSpecialist}
                </div>
              </div>

              <div className="lead-actions">
                <div className="lead-commission text-success">{lead.estimatedCommission}</div>
                <div className="lead-commission-label">Est. Commission</div>
                
                <div className={`lead-status bloomberg-status bloomberg-status-${getStatusColor(lead.status)}`}>
                  {lead.status}
                </div>

                <div className="lead-next-action">
                  <strong>Next:</strong> {lead.nextAction}
                </div>

                <div className="lead-buttons">
                  <button className="bloomberg-btn bloomberg-btn-primary bloomberg-btn-small">
                    Follow Up
                  </button>
                  <button className="bloomberg-btn bloomberg-btn-secondary bloomberg-btn-small">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mexican Specialist Network Performance */}
      <div className="bloomberg-grid bloomberg-grid-2 bloomberg-mb-lg">
        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">🇲🇽 Specialist Network Performance</h3>
            <div className="bloomberg-status bloomberg-status-success">ACTIVE</div>
          </div>

          <div className="specialists-list">
            {salesData.specialists.map((specialist, index) => (
              <div key={index} className="specialist-card">
                <div className="specialist-header">
                  <div className="specialist-info">
                    <div className="specialist-name">{specialist.name}</div>
                    <div className="specialist-location">{specialist.location}</div>
                  </div>
                  <div className={`specialist-status ${specialist.status}`}>
                    {specialist.status.toUpperCase()}
                  </div>
                </div>

                <div className="specialist-details">
                  <div className="specialist-specialty">{specialist.specialty}</div>
                  <div className="specialist-metrics">
                    <span>Active: {specialist.activeDeals}</span>
                    <span>Closed Q: {specialist.closedThisQuarter}</span>
                    <span>Rating: ⭐{specialist.rating}</span>
                  </div>
                </div>

                <div className="specialist-performance">
                  <div className="performance-metric">
                    <span className="metric-label">Commission Generated:</span>
                    <span className="metric-value text-success">{formatCurrency(specialist.commissionGenerated)}</span>
                  </div>
                  <div className="performance-metric">
                    <span className="metric-label">Avg Deal Size:</span>
                    <span className="metric-value">{formatCurrency(specialist.avgDealSize)}</span>
                  </div>
                  <div className="performance-metric">
                    <span className="metric-label">Response Time:</span>
                    <span className="metric-value">{specialist.responseTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">📊 Monthly Performance Targets</h3>
            <div className="bloomberg-status bloomberg-status-info">TRACKING</div>
          </div>

          <div className="targets-grid">
            {Object.entries(salesData.targets).map(([metric, data]) => (
              <div key={metric} className="target-item">
                <div className="target-header">
                  <div className="target-name">{metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                  <div className={`target-percentage ${data.percentage >= 80 ? 'success' : data.percentage >= 50 ? 'warning' : 'error'}`}>
                    {data.percentage}%
                  </div>
                </div>
                
                <div className="target-progress">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${data.percentage >= 80 ? 'success' : data.percentage >= 50 ? 'warning' : 'error'}`}
                      style={{width: `${Math.min(data.percentage, 100)}%`}}
                    ></div>
                  </div>
                </div>

                <div className="target-numbers">
                  <span className="target-actual">{typeof data.actual === 'number' && data.actual > 1000 ? formatCurrency(data.actual) : data.actual}</span>
                  <span className="target-separator">/</span>
                  <span className="target-goal">{typeof data.target === 'number' && data.target > 1000 ? formatCurrency(data.target) : data.target}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="targets-summary bloomberg-mt-lg">
            <div className="summary-metric">
              <span className="summary-label">YTD Commission Total:</span>
              <span className="summary-value text-success">{formatCurrency(salesData.commissions.ytd)}</span>
            </div>
            <div className="summary-metric">
              <span className="summary-label">Annual Target Progress:</span>
              <span className="summary-value">{((salesData.commissions.ytd / salesData.commissions.target) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Integration & Success Metrics */}
      <div className="bloomberg-card">
        <div className="bloomberg-card-header">
          <h3 className="bloomberg-card-title">🔄 Platform Integration Success</h3>
          <div className="bloomberg-status bloomberg-status-success">OPTIMIZED</div>
        </div>

        <div className="bloomberg-grid bloomberg-grid-3 bloomberg-mb-lg">
          <div className="bloomberg-metric">
            <div className="bloomberg-metric-value text-success">{salesData.performance.platformConversionRate}%</div>
            <div className="bloomberg-metric-label">Platform Lead Conversion</div>
          </div>
          <div className="bloomberg-metric">
            <div className="bloomberg-metric-value text-info">{salesData.performance.avgTimeToClose} days</div>
            <div className="bloomberg-metric-label">Average Close Time</div>
          </div>
          <div className="bloomberg-metric">
            <div className="bloomberg-metric-value text-warning">⭐{salesData.performance.customerSatisfaction}</div>
            <div className="bloomberg-metric-label">Customer Satisfaction</div>
          </div>
        </div>

        <div className="integration-insights">
          <div className="insight-item">
            <h4>🎯 Key Insight</h4>
            <p>Platform-generated leads convert {salesData.performance.platformConversionRate - 15}% higher than cold outreach, with {salesData.performance.avgTimeToClose - 5} day faster close times.</p>
          </div>
          
          <div className="insight-item">
            <h4>📈 Growth Opportunity</h4>
            <p>Repeat business rate of {salesData.performance.repeatBusiness}% indicates strong customer success. Focus on referral program to amplify platform leads.</p>
          </div>
        </div>

        <div className="bloomberg-hero-actions bloomberg-mt-lg">
          <Link href="/partnership" className="bloomberg-btn bloomberg-btn-primary">
            Generate New Leads →
          </Link>
          <button className="bloomberg-btn bloomberg-btn-secondary">
            Export Pipeline Report
          </button>
          <Link href="/specialists" className="bloomberg-btn bloomberg-btn-ghost">
            Manage Network
          </Link>
        </div>
      </div>
    </div>
  )
}