/**
 * DASHBOARD TEMPLATE - Bloomberg Consistency Framework
 * Ensures strict adherence to Bloomberg Style Guide across all dashboards
 * Reference: /styles/BLOOMBERG_STYLE_GUIDE.md
 */

import Head from 'next/head'
import TriangleSideNav from './TriangleSideNav'
import LanguageSwitcher from './LanguageSwitcher'

/**
 * Standard Dashboard Layout Template
 * Maintains Bloomberg Terminal consistency across all dashboard types:
 * - Trade alerts dashboard
 * - Triangle routing solutions view
 * - Market intelligence feeds
 * - User preference panels
 * - Notification settings
 */
export default function DashboardTemplate({ 
  title,
  subtitle,
  children,
  currentPage,
  showSideNav = true,
  showLanguageSwitcher = true,
  className = '',
  pageType = 'dashboard'
}) {
  return (
    <>
      <Head>
        <title>{title} | Triangle Intelligence</title>
        <meta name="description" content={subtitle} />
      </Head>

      <div className="triangle-layout">
        {/* Side Navigation - Bloomberg Style */}
        {showSideNav && (
          <TriangleSideNav currentPage={currentPage} />
        )}

        {/* Main Content Area */}
        <div className="main-content">
          {/* Top Navigation Bar - Post-signin style */}
          <nav className="bloomberg-nav">
            <div className="bloomberg-container-full">
              <div className="bloomberg-flex" style={{justifyContent: 'space-between'}}>
                <div className="bloomberg-flex">
                  <span className="bloomberg-nav-brand">TRIANGLE INTELLIGENCE</span>
                  <div className="bloomberg-status bloomberg-status-success small">
                    <span className="bloomberg-status-dot"></span>
                    ACTIVE SESSION
                  </div>
                </div>
                
                <div className="bloomberg-flex">
                  {/* User Session Info */}
                  <div className="bloomberg-status bloomberg-status-info small">
                    USER: admin@triangleintel.com
                  </div>
                  
                  {/* System Notifications */}
                  <div className="bloomberg-status bloomberg-status-warning small">
                    🔔 3 ALERTS
                  </div>
                  
                  {/* Language Switcher */}
                  {showLanguageSwitcher && (
                    <LanguageSwitcher />
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* Page Content with Bloomberg Background */}
          <div 
            className={`page-content ${className}`}
            style={{
              backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url("/image/datos-financieros.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
              minHeight: 'calc(100vh - 60px)'
            }}
          >
            {/* Dashboard Grid Container */}
            <div className="dashboard-grid">
              <div className="dashboard-grid-centered">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Metric Card Component - Bloomberg Style
 * Consistent 20% opacity background with turquoise borders
 */
export function MetricCard({ 
  icon, 
  label, 
  value, 
  change, 
  changeType = 'neutral',
  period,
  isPrimary = false,
  className = ''
}) {
  return (
    <div className={`metric-card ${isPrimary ? 'primary' : ''} ${className}`}>
      <div className="metric-header">
        {icon && <div className="metric-icon">{icon}</div>}
        {period && <div className="metric-period">{period}</div>}
      </div>
      <div className="metric-value">{value}</div>
      {label && <div className="bloomberg-metric-label">{label}</div>}
      {change && (
        <div className={`metric-change ${changeType}`}>
          {changeType === 'positive' && '↑'}
          {changeType === 'negative' && '↓'}
          {change}
        </div>
      )}
    </div>
  )
}

/**
 * Dashboard Widget Component - Bloomberg Style
 * Gradient background with consistent border styling
 */
export function DashboardWidget({
  icon,
  title,
  children,
  actions,
  isRecommended = false,
  priority = null,
  className = ''
}) {
  return (
    <div className={`dashboard-widget ${isRecommended ? 'recommended' : ''} ${className}`}>
      <div className="widget-header">
        <div className="widget-title">
          {icon && <div className="widget-icon">{icon}</div>}
          {title}
        </div>
        {priority && (
          <div className="recommendation-priority">{priority}</div>
        )}
        {actions && (
          <div className="widget-actions">
            {actions}
          </div>
        )}
      </div>
      <div className="widget-content">
        {children}
      </div>
    </div>
  )
}

/**
 * Section Header Component - Bloomberg Style
 * Uppercase with consistent spacing
 */
export function SectionHeader({ title, subtitle, className = '' }) {
  return (
    <div className={`bloomberg-section ${className}`}>
      <h2 className="bloomberg-section-title">{title}</h2>
      {subtitle && (
        <p className="bloomberg-section-subtitle">{subtitle}</p>
      )}
    </div>
  )
}

/**
 * Status Indicator Component - Bloomberg Style
 */
export function StatusIndicator({ status, label, size = 'normal' }) {
  const statusClass = {
    success: 'bloomberg-status-success',
    warning: 'bloomberg-status-warning',
    error: 'bloomberg-status-error',
    info: 'bloomberg-status-info'
  }[status] || 'bloomberg-status-info'

  return (
    <div className={`bloomberg-status ${statusClass} ${size === 'small' ? 'small' : ''}`}>
      <span className="bloomberg-status-dot"></span>
      {label}
    </div>
  )
}

/**
 * Grid Layout Component - Bloomberg Style
 * Fixed width centered columns
 */
export function DashboardGrid({ columns = 3, children, className = '' }) {
  const gridClass = `bloomberg-grid-${columns}`
  return (
    <div className={`bloomberg-grid ${gridClass} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Alert Banner Component - Crisis Alert Style
 */
export function AlertBanner({ message, type = 'crisis' }) {
  if (type === 'crisis') {
    return (
      <div className="crisis-alert">
        {message}
      </div>
    )
  }
  
  return (
    <div className="bloomberg-accent-banner">
      {message}
    </div>
  )
}