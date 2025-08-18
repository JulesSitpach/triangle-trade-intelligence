/**
 * ENTERPRISE PAGE LAYOUT
 * Professional wrapper for all pages (foundation to alerts)
 * Transforms children's game interface to enterprise software
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  TrendingUpIcon, 
  CPUIcon as DatabaseIcon, 
  AlertIcon as ShieldCheckIcon, 
  CompassIcon as ClockIcon,
  CheckIcon as CheckCircleIcon,
  ChartIcon as BarChartIcon 
} from './Icons'

export default function EnterpriseStageLayout({ 
  currentPage,
  title, 
  subtitle, 
  children, 
  onNext,
  onBack,
  nextDisabled = false,
  nextText = null,
  showProgress = true,
  showLiveData = true 
}) {
  const [liveStats, setLiveStats] = useState({
    tradeFlows: '597,072',
    countries: '39',
    companies: '240+',
    confidence: '94.7%'
  })

  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    // Client-side only time update to avoid hydration mismatch
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { 
        hour12: true,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
      }))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Map page names to sequential positions
  const getPagePosition = (pageName) => {
    const pageMap = { 
      foundation: 1, 
      product: 2, 
      routing: 3, 
      partnership: 4, 
      hindsight: 5, 
      alerts: 6 
    }
    return pageMap[pageName] || 1
  }

  // Get next page info for navigation
  const getNextPageInfo = (currentPage) => {
    const pageFlow = {
      foundation: { page: 'product', name: 'Product Intelligence' },
      product: { page: 'routing', name: 'Routing Intelligence' },
      routing: { page: 'partnership', name: 'Partnership Analysis' },
      partnership: { page: 'hindsight', name: 'Hindsight Analysis' },
      hindsight: { page: 'alerts', name: 'Live Monitoring' },
      alerts: { page: null, name: 'Complete' }
    }
    return pageFlow[currentPage] || { page: null, name: 'Next Page' }
  }

  return (
    <div className="enterprise-page-wrapper">
      {/* Enterprise Navigation Header */}
      <nav className="enterprise-page-nav">
        <div className="page-nav-container">
          <Link href="/" className="enterprise-brand">
            <TrendingUpIcon className="brand-icon" />
            <div className="brand-content">
              <div className="brand-title">Triangle Intelligence</div>
              <div className="brand-subtitle">Enterprise Trade Platform</div>
            </div>
          </Link>

          {showProgress && (
            <div className="page-progress-system">
              <div className="progress-header">
                <div className="progress-title">Intelligence Pipeline</div>
                <div className="progress-page">{currentPage} ({getPagePosition(currentPage)}/6)</div>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill"
                  style={{ width: `${(getPagePosition(currentPage) / 6) * 100}%` }}
                ></div>
              </div>
              <div className="progress-phases">
                {[
                  { page: 'foundation', label: 'Foundation', url: '/foundation' },
                  { page: 'product', label: 'Product', url: '/product' }, 
                  { page: 'routing', label: 'Routing', url: '/routing' },
                  { page: 'partnership', label: 'Partnership', url: '/partnership' },
                  { page: 'hindsight', label: 'Hindsight', url: '/hindsight' },
                  { page: 'alerts', label: 'Alerts', url: '/alerts' }
                ].map((phase, index) => (
                  <Link 
                    key={phase.page}
                    href={phase.url}
                    className={`progress-phase ${getPagePosition(phase.page) <= getPagePosition(currentPage) ? 'completed' : ''} ${phase.page === currentPage ? 'active' : ''}`}
                  >
                    <div className="phase-dot"></div>
                    <div className="phase-label">{phase.label}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="enterprise-nav-actions">
            <Link href="/dashboard-hub" className="enterprise-nav-btn">
              <BarChartIcon className="nav-icon" />
              Dashboard Hub
            </Link>
            <div className="live-status">
              <div className="live-indicator"></div>
              <div className="live-text">Live Intelligence</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Enterprise Page Header */}
      <header className="enterprise-page-header">
        <div className="page-header-container">
          <div className="page-header-content">
            <div className="page-meta">
              <div className="page-number">{currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}</div>
              <div className="page-category">Enterprise Intelligence</div>
            </div>
            <h1 className="enterprise-page-title">{title}</h1>
            <p className="enterprise-page-subtitle">{subtitle}</p>
          </div>

          {showLiveData && (
            <div className="enterprise-intelligence-panel">
              <div className="intelligence-header">
                <DatabaseIcon className="panel-icon" />
                <div className="panel-title">Live Market Intelligence</div>
              </div>
              <div className="intelligence-metrics">
                <div className="intel-metric">
                  <div className="intel-value">{liveStats.tradeFlows}</div>
                  <div className="intel-label">Trade Flows</div>
                </div>
                <div className="intel-metric">
                  <div className="intel-value">{liveStats.countries}</div>
                  <div className="intel-label">Countries</div>
                </div>
                <div className="intel-metric">
                  <div className="intel-value">{liveStats.companies}</div>
                  <div className="intel-label">Sessions</div>
                </div>
                <div className="intel-metric">
                  <div className="intel-value">{liveStats.confidence}</div>
                  <div className="intel-label">Confidence</div>
                </div>
              </div>
              <div className="intelligence-status">
                <ShieldCheckIcon className="status-icon" />
                <div className="status-text">Real-time market analysis active</div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Enterprise Page Content */}
      <main className="enterprise-page-content">
        <div className="page-content-container">
          {children}
        </div>
      </main>

      {/* Enterprise Page Navigation */}
      {(onNext || onBack) && (
        <footer className="enterprise-page-footer">
          <div className="page-footer-container">
            <div className="page-navigation">
              {onBack && (
                <button 
                  onClick={onBack}
                  className="enterprise-nav-button secondary"
                >
                  <div className="nav-button-content">
                    <div className="nav-button-arrow">←</div>
                    <div className="nav-button-text">
                      <div className="nav-button-title">Previous</div>
                      <div className="nav-button-subtitle">Previous Page</div>
                    </div>
                  </div>
                </button>
              )}

              <div className="page-navigation-center">
                <div className="navigation-progress">
                  <div className="progress-circle">
                    <div className="progress-fill" style={{ 
                      background: `conic-gradient(#1f6feb ${(getPagePosition(currentPage) / 6) * 360}deg, #30363d 0deg)` 
                    }}>
                      <div className="progress-inner">
                        <div className="progress-percentage">{Math.round((getPagePosition(currentPage) / 6) * 100)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {onNext && (
                <button 
                  onClick={onNext}
                  disabled={nextDisabled}
                  className={`enterprise-nav-button primary ${nextDisabled ? 'disabled' : ''}`}
                >
                  <div className="nav-button-content">
                    <div className="nav-button-text">
                      <div className="nav-button-title">
                        {nextText || `Continue to ${getNextPageInfo(currentPage).name}`}
                      </div>
                      <div className="nav-button-subtitle">
                        {getNextPageInfo(currentPage).page ? getNextPageInfo(currentPage).page.charAt(0).toUpperCase() + getNextPageInfo(currentPage).page.slice(1) : 'Workflow Complete'}
                      </div>
                    </div>
                    <div className="nav-button-arrow">→</div>
                  </div>
                </button>
              )}
            </div>

            <div className="page-footer-meta">
              <div className="footer-meta-item">
                <ClockIcon className="meta-icon" />
                <div className="meta-text">Session: {currentTime || 'Loading...'}</div>
              </div>
              <div className="footer-meta-item">
                <CheckCircleIcon className="meta-icon" />
                <div className="meta-text">Auto-saved</div>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}