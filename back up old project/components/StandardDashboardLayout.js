/**
 * STANDARD DASHBOARD LAYOUT
 * Master template ensuring ALL dashboards match Foundation design
 * Reference: /image/foundation.png
 * 
 * REQUIREMENTS:
 * ✅ Same dark background with market data overlay
 * ✅ Same left sidebar navigation
 * ✅ Same card styling (rounded corners, shadows)
 * ✅ Same typography hierarchy
 * ✅ Same color palette (blues, greens, whites)
 * ✅ Same metric display style
 * ✅ Same professional Bloomberg aesthetic
 */

import Head from 'next/head'
import TriangleSideNav from './TriangleSideNav'
import LanguageSwitcher from './LanguageSwitcher'

export default function StandardDashboardLayout({ 
  children, 
  title,
  subtitle,
  currentPage,
  showMetrics = true,
  metricsData = null
}) {
  return (
    <>
      <Head>
        <title>{title} | Triangle Intelligence PRO v2.1</title>
        <meta name="description" content={subtitle} />
      </Head>

      {/* Main Layout Container - Dark Background */}
      <div 
        className="triangle-layout"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), url("/image/datos-financieros.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Left Sidebar Navigation - Exact Foundation Style */}
        <TriangleSideNav currentPage={currentPage} />

        {/* Main Content Area */}
        <div className="main-content" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
          {/* Top Navigation Bar - Foundation Style */}
          <nav className="bloomberg-nav" style={{
            background: '#000000',
            borderBottom: '1px solid var(--bloomberg-gray-700)',
            padding: '0.75rem 1.5rem'
          }}>
            <div className="bloomberg-flex" style={{justifyContent: 'space-between', alignItems: 'center'}}>
              {/* Left: Brand & Status */}
              <div className="bloomberg-flex" style={{gap: '1.5rem'}}>
                <span className="bloomberg-nav-brand" style={{
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: '#ffffff',
                  letterSpacing: '0.05em'
                }}>
                  TRIANGLE INTELLIGENCE PRO v2.1
                </span>
                <div className="bloomberg-status bloomberg-status-success small">
                  <span className="bloomberg-status-dot"></span>
                  USER: ADMIN@TRIANGLEINTEL.COM
                </div>
              </div>
              
              {/* Right: Session Info & Actions */}
              <div className="bloomberg-flex" style={{gap: '1rem'}}>
                <div className="bloomberg-status bloomberg-status-info small">
                  <span className="bloomberg-status-dot"></span>
                  ACTIVE SESSION
                </div>
                <div className="bloomberg-status bloomberg-status-warning small">
                  🔔 3 ALERTS
                </div>
                <LanguageSwitcher />
                <button className="bloomberg-btn bloomberg-btn-ghost" style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.75rem'
                }}>
                  LOGOUT
                </button>
              </div>
            </div>
          </nav>

          {/* Metrics Bar - Foundation Style */}
          {showMetrics && metricsData && (
            <div className="foundation-metrics" style={{
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--bloomberg-gray-700)'
            }}>
              <div className="bloomberg-grid bloomberg-grid-4">
                {metricsData.map((metric, index) => (
                  <MetricCard key={index} {...metric} />
                ))}
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className="page-content" style={{
            flex: 1,
            padding: '2rem',
            overflowY: 'auto'
          }}>
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Metric Card Component - Foundation Standard
 * Dark background with turquoise accent border
 */
export function MetricCard({ label, value, status, trend, icon }) {
  return (
    <div className="metric-card" style={{
      background: 'rgba(0, 0, 0, 0.4)',
      border: '1px solid var(--bloomberg-blue-light)',
      borderRadius: '0.5rem',
      padding: '1rem',
      textAlign: 'center',
      transition: 'all 0.3s ease'
    }}>
      {icon && <div style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>{icon}</div>}
      <div className="metric-header" style={{
        fontSize: '0.625rem',
        textTransform: 'uppercase',
        color: 'var(--bloomberg-gray-400)',
        letterSpacing: '0.05em',
        marginBottom: '0.25rem'
      }}>
        {status && <span className={`bloomberg-status-dot ${status}`}></span>}
        {label}
      </div>
      <div className="metric-value" style={{
        fontSize: '1.75rem',
        fontWeight: '700',
        color: '#ffffff',
        lineHeight: '1'
      }}>
        {value}
      </div>
      {trend && (
        <div className={`metric-trend ${trend.type}`} style={{
          fontSize: '0.75rem',
          marginTop: '0.25rem',
          color: trend.type === 'positive' ? 'var(--bloomberg-green)' : 
                 trend.type === 'negative' ? 'var(--bloomberg-red)' : 
                 'var(--bloomberg-gray-400)'
        }}>
          {trend.value}
        </div>
      )}
    </div>
  )
}

/**
 * Content Card Component - Foundation Standard
 * Consistent rounded corners, shadows, spacing
 */
export function ContentCard({ title, subtitle, children, icon, actions, highlight = false }) {
  return (
    <div className="bloomberg-card" style={{
      background: highlight ? 
        'linear-gradient(145deg, rgba(14, 165, 233, 0.1), rgba(10, 15, 28, 0.9))' :
        'linear-gradient(145deg, var(--bloomberg-gray-800), var(--bloomberg-gray-900))',
      border: `1px solid ${highlight ? 'var(--bloomberg-blue)' : 'var(--bloomberg-blue-light)'}`,
      borderRadius: '0.75rem',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.3s ease'
    }}>
      {(title || actions) && (
        <div className="bloomberg-card-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--bloomberg-gray-700)'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            {icon && <span style={{fontSize: '1.25rem'}}>{icon}</span>}
            <div>
              <h3 className="bloomberg-card-title" style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
              }}>
                {title}
              </h3>
              {subtitle && (
                <p className="bloomberg-card-subtitle" style={{
                  fontSize: '0.75rem',
                  color: 'var(--bloomberg-gray-400)',
                  marginTop: '0.25rem'
                }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  )
}

/**
 * Progress Bar Component - Foundation Standard
 */
export function ProgressBar({ value, max = 100, label, color = 'blue' }) {
  const percentage = (value / max) * 100
  
  return (
    <div className="progress-container" style={{marginBottom: '1rem'}}>
      {label && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.5rem'
        }}>
          <span style={{fontSize: '0.75rem', color: 'var(--bloomberg-gray-400)'}}>
            {label}
          </span>
          <span style={{fontSize: '0.75rem', color: '#ffffff', fontWeight: '600'}}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
      <div className="progress-bar" style={{
        width: '100%',
        height: '8px',
        background: 'var(--bloomberg-gray-700)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div className="progress-fill" style={{
          width: `${percentage}%`,
          height: '100%',
          background: color === 'green' ? 'var(--bloomberg-green)' :
                      color === 'yellow' ? 'var(--bloomberg-yellow)' :
                      color === 'red' ? 'var(--bloomberg-red)' :
                      'linear-gradient(90deg, var(--bloomberg-blue), var(--bloomberg-blue-light))',
          transition: 'width 0.5s ease'
        }}></div>
      </div>
    </div>
  )
}

/**
 * Status Badge Component - Foundation Standard
 */
export function StatusBadge({ status, label, size = 'normal' }) {
  const statusStyles = {
    success: { background: 'rgba(34, 197, 94, 0.1)', color: 'var(--bloomberg-green)', border: '1px solid rgba(34, 197, 94, 0.3)' },
    warning: { background: 'rgba(234, 179, 8, 0.1)', color: 'var(--bloomberg-yellow)', border: '1px solid rgba(234, 179, 8, 0.3)' },
    error: { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--bloomberg-red)', border: '1px solid rgba(239, 68, 68, 0.3)' },
    info: { background: 'rgba(14, 165, 233, 0.1)', color: 'var(--bloomberg-blue)', border: '1px solid rgba(14, 165, 233, 0.3)' }
  }
  
  const style = statusStyles[status] || statusStyles.info
  
  return (
    <div className={`bloomberg-status ${size === 'small' ? 'small' : ''}`} style={{
      ...style,
      padding: size === 'small' ? '0.125rem 0.5rem' : '0.25rem 0.75rem',
      borderRadius: '0.25rem',
      fontSize: size === 'small' ? '0.625rem' : '0.75rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem'
    }}>
      <span className="bloomberg-status-dot" style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'currentColor'
      }}></span>
      {label}
    </div>
  )
}

/**
 * Grid Layout Component - Foundation Standard
 */
export function DashboardGrid({ columns = 3, gap = '1.5rem', children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: gap,
      marginBottom: '1.5rem'
    }}>
      {children}
    </div>
  )
}