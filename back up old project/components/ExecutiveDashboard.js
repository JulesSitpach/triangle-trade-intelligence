/**
 * EXECUTIVE DASHBOARD - 30 Second Scan
 * High-level metrics and strategic overview
 * Bloomberg Terminal inspired design
 * 
 * CONSISTENCY: Follows Bloomberg Style Guide
 * Reference: /styles/BLOOMBERG_STYLE_GUIDE.md
 */

import { useState } from 'react'
import { 
  TrendingUpIcon, 
  DollarSignIcon, 
  MapIcon, 
  ClockIcon, 
  AlertTriangleIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from './Icons'
import { 
  MetricCard, 
  DashboardWidget, 
  SectionHeader,
  StatusIndicator,
  DashboardGrid 
} from './DashboardTemplate'

export default function ExecutiveDashboard({ data }) {
  const [timeRange, setTimeRange] = useState('12M')
  
  // Extract key metrics from data
  const foundation = data?.foundation || {}
  const product = data?.product || {}
  const routing = data?.routing || {}
  
  const annualSavings = routing?.potentialSavings || 1900000
  const importVolume = getImportVolumeValue(foundation?.importVolume)
  const roiPercentage = Math.round((annualSavings / 50000) * 100) / 100
  const recommendedRoute = routing?.selectedRoute || 'mexico-route'

  return (
    <div className="executive-dashboard-container-centered">
      {/* Section Header - Bloomberg Style */}
      <SectionHeader 
        title="EXECUTIVE INTELLIGENCE OVERVIEW"
        subtitle="Real-time metrics and strategic positioning for triangle routing optimization"
      />
      
      {/* Key Metrics Overview - Bloomberg Grid */}
      <div className="executive-metrics-hero">
        <DashboardGrid columns={4}>
          <MetricCard
            icon={<DollarSignIcon />}
            label="Annual Impact"
            value={`$${formatLargeNumber(annualSavings)}`}
            change={`+${Math.round((annualSavings / importVolume) * 100)}% savings rate`}
            changeType="positive"
            period="12 Months"
            isPrimary={true}
          />

          <MetricCard
            icon={<TrendingUpIcon />}
            label="Return on Investment"
            value={`${roiPercentage}%`}
            change="First year return"
            changeType="positive"
            period="ROI"
          />

          <MetricCard
            icon={<ClockIcon />}
            label="Implementation Timeline"
            value="4.2M"
            change="Months to payback"
            changeType="neutral"
            period="Payback"
          />

          <MetricCard
            icon={<MapIcon />}
            label="Optimal Route"
            value="MX"
            change="Route optimized"
            changeType="positive"
            period="Strategy"
          />
        </DashboardGrid>
      </div>

      {/* Strategic Overview Section */}
      <SectionHeader 
        title="STRATEGIC POSITION ANALYSIS"
        subtitle="Current market position and optimization opportunities"
      />
      
      <div className="dashboard-widgets">
        <DashboardGrid columns={2}>
          {/* Current Position Widget */}
          <DashboardWidget
            icon={<TrendingUpIcon />}
            title="Current Position"
            actions={<button className="widget-btn">Details</button>}
          >
            <div className="position-overview">
              <div className="position-metric">
                <div className="position-label">Import Volume</div>
                <div className="position-value">{foundation?.importVolume || '$1M-$5M'}</div>
              </div>
              <div className="position-metric">
                <div className="position-label">Current Tariff Exposure</div>
                <div className="position-value negative">25-30%</div>
              </div>
              <div className="position-metric">
                <div className="position-label">Market Risk</div>
                <div className="position-value warning">High Volatility</div>
              </div>
              <div className="position-metric">
                <div className="position-label">Supplier Concentration</div>
                <div className="position-value warning">
                  {foundation?.primarySupplierCountry || 'China'} focused
                </div>
              </div>
            </div>
          </DashboardWidget>

          {/* Recommended Action Widget */}
          <DashboardWidget
            icon={<CheckCircleIcon />}
            title="Strategic Recommendation"
            isRecommended={true}
            priority="HIGH PRIORITY"
          >
            <div className="recommendation-content">
              <div className="recommendation-title">Execute Triangle Route via Mexico</div>
              <div className="recommendation-impact">
                <div className="impact-metric">
                  <div className="impact-value">${formatLargeNumber(annualSavings)}</div>
                  <div className="impact-label">Annual Savings</div>
                </div>
                <div className="impact-metric">
                  <div className="impact-value">0%</div>
                  <div className="impact-label">USMCA Tariff</div>
                </div>
                <div className="impact-metric">
                  <div className="impact-value">87%</div>
                  <div className="impact-label">Tariff Reduction</div>
                </div>
              </div>
              <div className="recommendation-timeline">
                <div className="timeline-item active">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-title">Immediate: Partner Contact</div>
                    <div className="timeline-subtitle">Next 48 hours</div>
                  </div>
                </div>
              </div>
            </div>
          </DashboardWidget>
        </DashboardGrid>

        {/* Risk & Intelligence Section */}
        <SectionHeader 
          title="RISK & MARKET INTELLIGENCE"
          subtitle="Real-time risk assessment and market insights"
        />
        
        <DashboardGrid columns={2}>
          {/* Risk Monitor Widget */}
          <DashboardWidget
            icon={<AlertTriangleIcon />}
            title="Risk Monitor"
            actions={<StatusIndicator status="warning" label="MEDIUM" size="small" />}
          >
            <div className="risk-indicators">
              <div className="risk-item">
                <div className="risk-category">Political</div>
                <div className="risk-level">
                  <div className="risk-bar">
                    <div className="risk-fill warning" style={{width: '40%'}}></div>
                  </div>
                  <div className="risk-score">4/10</div>
                </div>
              </div>
              <div className="risk-item">
                <div className="risk-category">Currency</div>
                <div className="risk-level">
                  <div className="risk-bar">
                    <div className="risk-fill success" style={{width: '25%'}}></div>
                  </div>
                  <div className="risk-score">2.5/10</div>
                </div>
              </div>
              <div className="risk-item">
                <div className="risk-category">Regulatory</div>
                <div className="risk-level">
                  <div className="risk-bar">
                    <div className="risk-fill success" style={{width: '20%'}}></div>
                  </div>
                  <div className="risk-score">2/10</div>
                </div>
              </div>
              <div className="risk-item">
                <div className="risk-category">Operational</div>
                <div className="risk-level">
                  <div className="risk-bar">
                    <div className="risk-fill warning" style={{width: '35%'}}></div>
                  </div>
                  <div className="risk-score">3.5/10</div>
                </div>
              </div>
            </div>
          </DashboardWidget>

          {/* Market Intelligence */}
          <div className="dashboard-widget">
            <div className="widget-header">
              <div className="widget-title">
                <TrendingUpIcon className="widget-icon" />
                Market Intelligence
              </div>
              <div className="intelligence-score">8.7/10</div>
            </div>
            
            <div className="market-insights">
              <div className="insight-item">
                <div className="insight-indicator success"></div>
                <div className="insight-content">
                  <div className="insight-title">USMCA Treaty Stability</div>
                  <div className="insight-value">95% confidence</div>
                </div>
              </div>
              <div className="insight-item">
                <div className="insight-indicator warning"></div>
                <div className="insight-content">
                  <div className="insight-title">China Tariff Volatility</div>
                  <div className="insight-value">High uncertainty</div>
                </div>
              </div>
              <div className="insight-item">
                <div className="insight-indicator success"></div>
                <div className="insight-content">
                  <div className="insight-title">Mexico Manufacturing</div>
                  <div className="insight-value">Strong capacity</div>
                </div>
              </div>
              <div className="insight-item">
                <div className="insight-indicator info"></div>
                <div className="insight-content">
                  <div className="insight-title">Implementation Time</div>
                  <div className="insight-value">90-120 days</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-widget">
          <div className="widget-header">
            <div className="widget-title">Immediate Actions Required</div>
          </div>
          
          <div className="action-items">
            <div className="action-item priority-high">
              <div className="action-indicator"></div>
              <div className="action-content">
                <div className="action-title">Contact Pre-Vetted Partners</div>
                <div className="action-details">3 Mexico manufacturers ready for evaluation</div>
              </div>
              <div className="action-time">Today</div>
            </div>
            <div className="action-item priority-high">
              <div className="action-indicator"></div>
              <div className="action-content">
                <div className="action-title">Schedule Compliance Review</div>
                <div className="action-details">USMCA documentation requirements</div>
              </div>
              <div className="action-time">Week 1</div>
            </div>
            <div className="action-item priority-medium">
              <div className="action-indicator"></div>
              <div className="action-content">
                <div className="action-title">Pilot Shipment Planning</div>
                <div className="action-details">5% volume risk mitigation test</div>
              </div>
              <div className="action-time">Month 1</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  function getImportVolumeValue(volume) {
    const volumeMap = {
      'Under $500K': 250000,
      '$500K - $1M': 750000,
      '$1M - $5M': 3000000,
      '$5M - $25M': 15000000,
      'Over $25M': 50000000
    }
    return volumeMap[volume] || 1000000
  }

  function formatLargeNumber(num) {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${Math.round(num / 1000)}K`
    }
    return num.toString()
  }
}