/**
 * UNIFIED DASHBOARD HUB
 * Centralized dashboard ensuring Bloomberg style consistency
 * All dashboard types follow the established design patterns
 */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import DashboardTemplate, { 
  MetricCard, 
  DashboardWidget, 
  SectionHeader,
  StatusIndicator,
  DashboardGrid,
  AlertBanner
} from '../components/DashboardTemplate'
import { 
  TrendingUpIcon, 
  DollarSignIcon, 
  MapIcon, 
  ClockIcon, 
  AlertTriangleIcon,
  CheckCircleIcon,
  BellIcon,
  SettingsIcon,
  ChartBarIcon,
  ShieldCheckIcon
} from '../components/Icons'

export default function UnifiedDashboard() {
  const [activeView, setActiveView] = useState('overview')
  const [realTimeData, setRealTimeData] = useState({
    timestamp: new Date().toISOString(),
    activeAlerts: 3,
    pendingActions: 7,
    savingsYTD: 2847000,
    routesOptimized: 47
  })

  // Update real-time data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        timestamp: new Date().toISOString(),
        activeAlerts: 3 + Math.floor(Math.random() * 5),
        pendingActions: 7 + Math.floor(Math.random() * 10)
      }))
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const renderDashboardView = () => {
    switch(activeView) {
      case 'alerts':
        return <TradeAlertsDashboard data={realTimeData} />
      case 'routing':
        return <TriangleRoutingDashboard data={realTimeData} />
      case 'intelligence':
        return <MarketIntelligenceDashboard data={realTimeData} />
      case 'preferences':
        return <UserPreferencesDashboard />
      case 'notifications':
        return <NotificationSettingsDashboard />
      default:
        return <OverviewDashboard data={realTimeData} />
    }
  }

  return (
    <DashboardTemplate
      title="Unified Intelligence Dashboard"
      subtitle="Enterprise Trade Optimization Command Center"
      currentPage="dashboard"
      pageType="dashboard"
    >
      {/* Dashboard Navigation Tabs - Bloomberg Style */}
      <div className="bloomberg-section-full">
        <div className="bloomberg-flex" style={{justifyContent: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)'}}>
          {[
            { key: 'overview', label: 'OVERVIEW', icon: <ChartBarIcon /> },
            { key: 'alerts', label: 'TRADE ALERTS', icon: <BellIcon /> },
            { key: 'routing', label: 'TRIANGLE ROUTING', icon: <MapIcon /> },
            { key: 'intelligence', label: 'MARKET INTELLIGENCE', icon: <TrendingUpIcon /> },
            { key: 'preferences', label: 'PREFERENCES', icon: <SettingsIcon /> },
            { key: 'notifications', label: 'NOTIFICATIONS', icon: <BellIcon /> }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`bloomberg-btn ${activeView === tab.key ? 'bloomberg-btn-primary' : 'bloomberg-btn-secondary'}`}
              style={{fontSize: '0.75rem', padding: 'var(--space-sm) var(--space-md)'}}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Render Active Dashboard View */}
      {renderDashboardView()}
    </DashboardTemplate>
  )
}

// Overview Dashboard - Main command center view
function OverviewDashboard({ data }) {
  return (
    <>
      <SectionHeader 
        title="COMMAND CENTER OVERVIEW"
        subtitle="Real-time trade optimization intelligence and system status"
      />
      
      {/* Primary Metrics Grid */}
      <DashboardGrid columns={4}>
        <MetricCard
          icon={<DollarSignIcon />}
          label="YTD Savings Generated"
          value={`$${(data.savingsYTD / 1000000).toFixed(1)}M`}
          change="+23% vs last year"
          changeType="positive"
          period="Year to Date"
          isPrimary={true}
        />
        <MetricCard
          icon={<MapIcon />}
          label="Routes Optimized"
          value={data.routesOptimized}
          change="+12 this month"
          changeType="positive"
          period="Total Active"
        />
        <MetricCard
          icon={<BellIcon />}
          label="Active Alerts"
          value={data.activeAlerts}
          change="Requires attention"
          changeType="warning"
          period="Current"
        />
        <MetricCard
          icon={<CheckCircleIcon />}
          label="System Health"
          value="98.7%"
          change="All systems operational"
          changeType="positive"
          period="Uptime"
        />
      </DashboardGrid>

      {/* Dashboard Widgets */}
      <SectionHeader 
        title="STRATEGIC INSIGHTS"
        subtitle="Key opportunities and risk factors"
      />
      
      <DashboardGrid columns={2}>
        <DashboardWidget
          icon={<TrendingUpIcon />}
          title="Top Opportunities"
          actions={<button className="widget-btn">View All</button>}
        >
          <div className="recommendation-content">
            <div className="timeline-item active">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-title">China → Mexico → USA Route</div>
                <div className="timeline-subtitle">Potential savings: $247K/year</div>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-title">India → Canada → USA Route</div>
                <div className="timeline-subtitle">Potential savings: $189K/year</div>
              </div>
            </div>
          </div>
        </DashboardWidget>

        <DashboardWidget
          icon={<AlertTriangleIcon />}
          title="Risk Monitoring"
          actions={<StatusIndicator status="warning" label="2 HIGH" size="small" />}
        >
          <div className="risk-indicators">
            <div className="risk-item">
              <div className="risk-category">Tariff Volatility</div>
              <div className="risk-level">
                <div className="risk-bar">
                  <div className="risk-fill warning" style={{width: '70%'}}></div>
                </div>
                <div className="risk-score">7/10</div>
              </div>
            </div>
            <div className="risk-item">
              <div className="risk-category">Port Congestion</div>
              <div className="risk-level">
                <div className="risk-bar">
                  <div className="risk-fill success" style={{width: '30%'}}></div>
                </div>
                <div className="risk-score">3/10</div>
              </div>
            </div>
          </div>
        </DashboardWidget>
      </DashboardGrid>
    </>
  )
}

// Trade Alerts Dashboard
function TradeAlertsDashboard({ data }) {
  return (
    <>
      <AlertBanner 
        message="⚠️ US-CANADA TARIFF WAR ACTIVE - 25% BILATERAL TARIFFS IN EFFECT"
        type="crisis"
      />
      
      <SectionHeader 
        title="TRADE ALERTS DASHBOARD"
        subtitle="Real-time tariff changes and trade disruption monitoring"
      />
      
      <DashboardGrid columns={3}>
        <MetricCard
          icon={<AlertTriangleIcon />}
          label="Critical Alerts"
          value={data.activeAlerts}
          change="Immediate action required"
          changeType="negative"
          period="Active Now"
        />
        <MetricCard
          icon={<ClockIcon />}
          label="Pending Reviews"
          value={data.pendingActions}
          change="Within 48 hours"
          changeType="warning"
          period="Action Items"
        />
        <MetricCard
          icon={<ShieldCheckIcon />}
          label="Routes Protected"
          value="94%"
          change="USMCA compliant"
          changeType="positive"
          period="Coverage"
        />
      </DashboardGrid>

      <DashboardWidget
        icon={<BellIcon />}
        title="Active Trade Alerts"
        isRecommended={true}
        priority="URGENT"
      >
        <div className="market-insights">
          <div className="insight-item">
            <div className="insight-indicator warning"></div>
            <div className="insight-content">
              <div className="insight-title">China Tariff Increase: 30% → 35%</div>
              <div className="insight-value">Effective: January 20, 2025 | Impact: $2.3M annually</div>
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-indicator info"></div>
            <div className="insight-content">
              <div className="insight-title">Mexico USMCA Rate Confirmed: 0%</div>
              <div className="insight-value">Status: Treaty-locked | Savings opportunity: $847K</div>
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-indicator success"></div>
            <div className="insight-content">
              <div className="insight-title">Port of LA Congestion Cleared</div>
              <div className="insight-value">Transit times normalized | -3 days average</div>
            </div>
          </div>
        </div>
      </DashboardWidget>
    </>
  )
}

// Triangle Routing Solutions Dashboard
function TriangleRoutingDashboard({ data }) {
  return (
    <>
      <SectionHeader 
        title="TRIANGLE ROUTING SOLUTIONS"
        subtitle="Optimized USMCA routing strategies and savings analysis"
      />
      
      <DashboardGrid columns={4}>
        <MetricCard
          icon={<MapIcon />}
          label="Active Routes"
          value={data.routesOptimized}
          change="All optimized"
          changeType="positive"
          period="Current"
        />
        <MetricCard
          icon={<DollarSignIcon />}
          label="Avg Savings/Route"
          value="$197K"
          change="+15% efficiency"
          changeType="positive"
          period="Annual"
        />
        <MetricCard
          icon={<CheckCircleIcon />}
          label="USMCA Compliance"
          value="100%"
          change="Fully compliant"
          changeType="positive"
          period="All Routes"
        />
        <MetricCard
          icon={<ClockIcon />}
          label="Setup Time"
          value="8.2 days"
          change="-4 days improved"
          changeType="positive"
          period="Average"
        />
      </DashboardGrid>

      <DashboardGrid columns={2}>
        <DashboardWidget
          icon={<MapIcon />}
          title="Top Performing Routes"
        >
          <div className="position-overview">
            <div className="position-metric">
              <div className="position-label">CN → MX → US</div>
              <div className="position-value">$2.4M saved</div>
            </div>
            <div className="position-metric">
              <div className="position-label">IN → CA → US</div>
              <div className="position-value">$1.8M saved</div>
            </div>
            <div className="position-metric">
              <div className="position-label">VN → MX → US</div>
              <div className="position-value">$1.2M saved</div>
            </div>
          </div>
        </DashboardWidget>

        <DashboardWidget
          icon={<TrendingUpIcon />}
          title="Route Optimization Queue"
          actions={<StatusIndicator status="info" label="3 PENDING" size="small" />}
        >
          <div className="action-items">
            <div className="action-item priority-high">
              <div className="action-indicator"></div>
              <div className="action-content">
                <div className="action-title">Electronics Importer - China Route</div>
                <div className="action-details">Potential: $847K/year | Priority: HIGH</div>
              </div>
              <div className="action-time">2h ago</div>
            </div>
            <div className="action-item priority-medium">
              <div className="action-indicator"></div>
              <div className="action-content">
                <div className="action-title">Textile Company - India Route</div>
                <div className="action-details">Potential: $523K/year | Priority: MEDIUM</div>
              </div>
              <div className="action-time">5h ago</div>
            </div>
          </div>
        </DashboardWidget>
      </DashboardGrid>
    </>
  )
}

// Market Intelligence Dashboard
function MarketIntelligenceDashboard({ data }) {
  return (
    <>
      <SectionHeader 
        title="MARKET INTELLIGENCE FEEDS"
        subtitle="Real-time global trade data and predictive analytics"
      />
      
      <DashboardGrid columns={3}>
        <MetricCard
          icon={<ChartBarIcon />}
          label="Trade Flow Records"
          value="597K+"
          change="Live database"
          changeType="positive"
          period="Total"
        />
        <MetricCard
          icon={<TrendingUpIcon />}
          label="Market Volatility"
          value="HIGH"
          change="Tariff uncertainty"
          changeType="warning"
          period="Current"
        />
        <MetricCard
          icon={<ShieldCheckIcon />}
          label="Protected Volume"
          value="$76.9B"
          change="Under management"
          changeType="positive"
          period="Total"
        />
      </DashboardGrid>

      <DashboardWidget
        icon={<TrendingUpIcon />}
        title="Market Intelligence Summary"
      >
        <div className="market-insights">
          <div className="insight-item">
            <div className="insight-indicator info"></div>
            <div className="insight-content">
              <div className="insight-title">USMCA 2026 Review Approaching</div>
              <div className="insight-value">Timeline: 11 months | Risk: Treaty renegotiation possible</div>
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-indicator warning"></div>
            <div className="insight-content">
              <div className="insight-title">Ontario $1B Emergency Fund Activated</div>
              <div className="insight-value">Support for businesses affected by US tariffs</div>
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-indicator success"></div>
            <div className="insight-content">
              <div className="insight-title">Mexico Manufacturing Capacity +15%</div>
              <div className="insight-value">New facilities coming online Q2 2025</div>
            </div>
          </div>
        </div>
      </DashboardWidget>
    </>
  )
}

// User Preferences Dashboard
function UserPreferencesDashboard() {
  return (
    <>
      <SectionHeader 
        title="USER PREFERENCE PANEL"
        subtitle="Customize your dashboard experience and alert settings"
      />
      
      <DashboardGrid columns={2}>
        <DashboardWidget
          icon={<SettingsIcon />}
          title="Display Preferences"
        >
          <div className="form-section">
            <div className="bloomberg-form-group">
              <label className="bloomberg-label">Dashboard Theme</label>
              <select className="bloomberg-input bloomberg-select">
                <option>Bloomberg Dark (Default)</option>
                <option>Bloomberg Light</option>
                <option>High Contrast</option>
              </select>
            </div>
            <div className="bloomberg-form-group">
              <label className="bloomberg-label">Data Refresh Rate</label>
              <select className="bloomberg-input bloomberg-select">
                <option>Real-time (Live)</option>
                <option>Every 30 seconds</option>
                <option>Every minute</option>
              </select>
            </div>
            <div className="bloomberg-form-group">
              <label className="bloomberg-label">Default Currency</label>
              <select className="bloomberg-input bloomberg-select">
                <option>USD - US Dollar</option>
                <option>CAD - Canadian Dollar</option>
                <option>MXN - Mexican Peso</option>
              </select>
            </div>
          </div>
        </DashboardWidget>

        <DashboardWidget
          icon={<BellIcon />}
          title="Alert Preferences"
        >
          <div className="form-section">
            <div className="bloomberg-form-group">
              <label className="bloomberg-label">Alert Threshold</label>
              <select className="bloomberg-input bloomberg-select">
                <option>All changes</option>
                <option>Savings > $100K</option>
                <option>Savings > $500K</option>
                <option>Critical only</option>
              </select>
            </div>
            <div className="bloomberg-form-group">
              <label className="bloomberg-label">Notification Method</label>
              <select className="bloomberg-input bloomberg-select">
                <option>Dashboard + Email</option>
                <option>Dashboard only</option>
                <option>Email only</option>
                <option>SMS + Email (Premium)</option>
              </select>
            </div>
            <div className="bloomberg-form-group">
              <label className="bloomberg-label">Report Frequency</label>
              <select className="bloomberg-input bloomberg-select">
                <option>Daily summary</option>
                <option>Weekly digest</option>
                <option>Monthly report</option>
                <option>Real-time only</option>
              </select>
            </div>
          </div>
        </DashboardWidget>
      </DashboardGrid>
    </>
  )
}

// Notification Settings Dashboard
function NotificationSettingsDashboard() {
  return (
    <>
      <SectionHeader 
        title="NOTIFICATION SETTINGS"
        subtitle="Configure alert channels and notification preferences"
      />
      
      <DashboardWidget
        icon={<BellIcon />}
        title="Notification Configuration"
      >
        <div className="form-section">
          <div className="bloomberg-grid bloomberg-grid-2">
            <div className="bloomberg-form-group">
              <label className="bloomberg-label">Tariff Change Alerts</label>
              <select className="bloomberg-input bloomberg-select">
                <option>Immediate notification</option>
                <option>Daily summary</option>
                <option>Weekly digest</option>
                <option>Disabled</option>
              </select>
            </div>
            <div className="bloomberg-form-group">
              <label className="bloomberg-label">Route Optimization Alerts</label>
              <select className="bloomberg-input bloomberg-select">
                <option>When savings > $100K</option>
                <option>When savings > $500K</option>
                <option>All opportunities</option>
                <option>Disabled</option>
              </select>
            </div>
            <div className="bloomberg-form-group">
              <label className="bloomberg-label">Market Intelligence Updates</label>
              <select className="bloomberg-input bloomberg-select">
                <option>Real-time critical</option>
                <option>Daily briefing</option>
                <option>Weekly report</option>
                <option>Monthly summary</option>
              </select>
            </div>
            <div className="bloomberg-form-group">
              <label className="bloomberg-label">System Maintenance Alerts</label>
              <select className="bloomberg-input bloomberg-select">
                <option>24 hours advance</option>
                <option>1 week advance</option>
                <option>Email only</option>
                <option>Disabled</option>
              </select>
            </div>
          </div>
          
          <div className="bloomberg-hero-actions" style={{marginTop: 'var(--space-xl)'}}>
            <button className="bloomberg-btn bloomberg-btn-secondary">Reset to Defaults</button>
            <button className="bloomberg-btn bloomberg-btn-primary">Save Preferences</button>
          </div>
        </div>
      </DashboardWidget>
    </>
  )
}

// Helper function for number formatting
function formatLargeNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K'
  }
  return num.toString()
}