import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

/**
 * TriangleLayout Component
 * 
 * Clean header-only navigation layout for Triangle Intelligence platform.
 * Features:
 * - Fixed header with logo and navigation
 * - Mobile-responsive with hamburger menu
 * - Crisis alert banner support
 * - No sidebar - full-width content area
 */
export default function TriangleLayout({ children, showCrisisBanner = false }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [crisisBannerVisible, setCrisisBannerVisible] = useState(showCrisisBanner)
  const router = useRouter()

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [router.pathname])

  const navigationItems = [
    {
      path: '/',
      label: 'Home',
      description: 'Platform overview'
    },
    {
      path: '/usmca-workflow',
      label: 'USMCA Workflow',
      description: 'Complete compliance analysis'
    },
    {
      path: '/trump-tariff-alerts',
      label: 'Crisis Alerts',
      description: 'Real-time tariff monitoring',
      badge: '3' // Show alert count
    }
  ]

  return (
    <>
      {/* Crisis Alert Banner (Professional Style) */}
      {crisisBannerVisible && (
        <div className="crisis-alert">
          <div className="crisis-alert-header">
            <span>⚠️</span>
            <span>
              <strong>Tariff Alert:</strong> New import duties may impact your supply chain.{' '}
              <Link href="/trump-tariff-alerts" className="nav-link">
                View Impact Assessment
              </Link>
            </span>
            <button 
              className="btn-secondary"
              onClick={() => setCrisisBannerVisible(false)}
              aria-label="Close alert"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main App Layout */}
      <div className="app-layout">
        {/* Professional Header Navigation */}
        <header className="app-header">
          <div className="header-container">
            <div className="header-content">
              {/* Professional Logo */}
              <Link href="/" className="header-logo">
                  <div className="gradient-accent">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2L3 7v11h4v-6h6v6h4V7l-7-5z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="logo-text">
                      Triangle Intelligence
                    </span>
                    <div className="logo-subtitle">
                      USMCA Compliance Platform
                    </div>
                  </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="header-nav">
                {navigationItems.map((item) => (
                  <Link 
                    key={item.path} 
                    href={item.path}
                    className={`nav-link ${router.pathname === item.path ? 'nav-link-active' : ''}`}
                  >
                    <span>{item.label}</span>
                    {item.badge && <span className="status-warning">{item.badge}</span>}
                  </Link>
                ))}
              </nav>

              {/* Header Actions */}
              <div className="header-actions">
                <Link 
                  href="/usmca-workflow" 
                  className="btn-primary"
                >
                  Start Analysis
                </Link>
              </div>
              
              {/* Mobile Menu Toggle */}
              <button
                className="mobile-menu-button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="mobile-menu">
                <div>
                  {navigationItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`mobile-nav-link ${
                        router.pathname === item.path
                          ? 'mobile-nav-link-active'
                          : ''
                      }`}
                    >
                      <div className="header-content">
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="status-error">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-muted">
                        {item.description}
                      </div>
                    </Link>
                  ))}
                  <div>
                    <Link
                      href="/usmca-workflow"
                      className="btn-primary"
                    >
                      Start Analysis
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </>
  )
}