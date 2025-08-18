/**
 * UNIVERSAL DASHBOARD WRAPPER
 * Enforces Foundation design standards across ALL dashboards
 * Reference: /image/foundation.png
 * 
 * MASTER STANDARD REQUIREMENTS:
 * ✅ Dark background with market data overlay (65% opacity)
 * ✅ Left sidebar navigation (TriangleSideNav)
 * ✅ Top metrics bar with 4 key indicators
 * ✅ Consistent card styling (turquoise borders, dark backgrounds)
 * ✅ Same typography and color palette
 * ✅ Bloomberg Terminal professional aesthetic
 */

import Head from 'next/head'
import TriangleSideNav from './TriangleSideNav'
import LanguageSwitcher from './LanguageSwitcher'

/**
 * Universal wrapper ensuring Foundation consistency
 * ALL pages must use this wrapper to maintain design standards
 */
export default function UniversalDashboardWrapper({
  children,
  pageTitle,
  pageSubtitle,
  currentPage,
  topMetrics = [],
  showLanguageSwitcher = true
}) {
  // Default metrics matching Foundation style
  const defaultMetrics = topMetrics.length > 0 ? topMetrics : [
    { label: 'LIVE DATA', value: '597,072', subtext: 'TRADE FLOW RECORDS', status: 'STREAMING' },
    { label: 'TRACKED VALUE', value: '$76.9B', subtext: 'TRADE INTELLIGENCE', status: 'ACTIVE' },
    { label: 'OPTIMIZATION', value: '96.3%', subtext: 'SUCCESS RATE', status: 'OPTIMAL' },
    { label: 'REAL-TIME', value: '17', subtext: 'LIVE INTELLIGENCE', status: 'PROCESSING' }
  ]

  return (
    <>
      <Head>
        <title>{pageTitle} | Triangle Intelligence PRO v2.1</title>
        <meta name="description" content={pageSubtitle} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Main Layout Container - Foundation Standard */}
      <div className="triangle-layout" style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#0a0f1c',
        color: 'white'
      }}>
        
        {/* Left Sidebar - Foundation Standard */}
        <TriangleSideNav currentPage={currentPage} />

        {/* Main Content Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url("/image/datos-financieros.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}>
          
          {/* Top Navigation Bar - Foundation Standard */}
          <nav style={{
            background: 'rgba(0, 0, 0, 0.9)',
            borderBottom: '1px solid #38bdf8',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '700',
                color: '#38bdf8',
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                TRIANGLE INTELLIGENCE PRO v2.1
              </span>
              <StatusIndicator status="success" label="USER: ADMIN@TRIANGLEINTEL.COM" />
            </div>
            
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <StatusIndicator status="info" label="ACTIVE SESSION" />
              <StatusIndicator status="warning" label="3 ALERTS" />
              {showLanguageSwitcher && <LanguageSwitcher />}
              <button style={{
                background: 'transparent',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                LOGOUT
              </button>
            </div>
          </nav>

          {/* Top Metrics Bar - Foundation Standard */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            borderBottom: '1px solid #243045',
            padding: '1rem 1.5rem'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem'
            }}>
              {defaultMetrics.map((metric, index) => (
                <TopMetricCard key={index} {...metric} />
              ))}
            </div>
          </div>

          {/* Page Content Area */}
          <div style={{
            flex: 1,
            padding: '2rem',
            overflowY: 'auto'
          }}>
            <div className="foundation-layout">
              <div className="foundation-layout-centered">
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
 * Top Metric Card - Foundation Standard
 * Matches exact styling from foundation.png
 */
function TopMetricCard({ label, value, subtext, status }) {
  const statusColors = {
    'STREAMING': '#22c55e',
    'ACTIVE': '#0ea5e9',
    'OPTIMAL': '#22c55e',
    'PROCESSING': '#eab308'
  }

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.5)',
      border: '1px solid #38bdf8',
      borderRadius: '0.5rem',
      padding: '1rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        fontSize: '0.625rem',
        textTransform: 'uppercase',
        color: statusColors[status] || '#94a3b8',
        letterSpacing: '0.1em',
        marginBottom: '0.5rem',
        fontWeight: '600'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '1.75rem',
        fontWeight: '700',
        color: '#ffffff',
        lineHeight: '1',
        marginBottom: '0.25rem'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.625rem',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {subtext}
      </div>
      <div style={{
        position: 'absolute',
        top: '0.5rem',
        right: '0.5rem',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: statusColors[status] || '#94a3b8',
        animation: 'pulse 2s infinite'
      }}></div>
    </div>
  )
}

/**
 * Status Indicator - Foundation Standard
 */
function StatusIndicator({ status, label }) {
  const statusStyles = {
    success: { color: '#22c55e', dotColor: '#22c55e' },
    info: { color: '#0ea5e9', dotColor: '#0ea5e9' },
    warning: { color: '#eab308', dotColor: '#eab308' },
    error: { color: '#ef4444', dotColor: '#ef4444' }
  }

  const style = statusStyles[status] || statusStyles.info

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      padding: '0.25rem 0.625rem',
      background: 'rgba(0, 0, 0, 0.4)',
      border: `1px solid ${style.color}33`,
      borderRadius: '0.25rem',
      fontSize: '0.625rem',
      fontWeight: '600',
      color: style.color,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: style.dotColor
      }}></span>
      {label}
    </div>
  )
}

/**
 * Foundation Content Card - Standard Component
 * Must be used for all content sections
 */
export function FoundationCard({ 
  title, 
  subtitle, 
  children, 
  icon,
  rightContent,
  highlighted = false 
}) {
  return (
    <div className="bloomberg-card" style={{
      background: highlighted ? 
        'linear-gradient(145deg, rgba(14, 165, 233, 0.1), rgba(10, 15, 28, 0.95))' :
        'linear-gradient(145deg, rgba(26, 35, 50, 0.95), rgba(16, 23, 42, 0.95))',
      border: `1px solid ${highlighted ? '#0ea5e9' : '#38bdf8'}`,
      borderRadius: '0.75rem',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)'
    }}>
      {title && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #243045'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            {icon && <span style={{fontSize: '1.25rem'}}>{icon}</span>}
            <div>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.25rem'
              }}>
                {title}
              </h3>
              {subtitle && (
                <p style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  margin: 0
                }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {rightContent && <div>{rightContent}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}

/**
 * Intelligence Panel - Foundation Standard
 * Right-side intelligence display
 */
export function IntelligencePanel({ title, children, confidenceScore }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(26, 35, 50, 0.95), rgba(16, 23, 42, 0.95))',
      border: '1px solid #38bdf8',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      height: 'fit-content',
      position: 'sticky',
      top: '1rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #243045'
      }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#ffffff',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🧠 {title}
        </h3>
        <StatusIndicator status="info" label="REAL-TIME" />
      </div>
      
      {confidenceScore && (
        <div style={{textAlign: 'center', marginBottom: '1.5rem'}}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#0ea5e9',
            lineHeight: '1'
          }}>
            {confidenceScore}/10.0
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: '0.5rem'
          }}>
            Intelligence Confidence
          </div>
          <div style={{
            marginTop: '0.75rem',
            padding: '0.25rem 0.75rem',
            background: 'rgba(14, 165, 233, 0.1)',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#0ea5e9'
          }}>
            {Math.floor(confidenceScore * 10)}% Complete
          </div>
        </div>
      )}
      
      {children}
    </div>
  )
}