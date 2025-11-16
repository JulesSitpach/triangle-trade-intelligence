import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAlertContext } from '../lib/contexts/AlertContext'
import { useSimpleAuth } from '../lib/contexts/SimpleAuthContext'

export default function TriangleLayout({ children, showCrisisBanner = false }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [crisisBannerVisible, setCrisisBannerVisible] = useState(showCrisisBanner)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const router = useRouter()

  // Get alert count from context
  const { alertCount, loading } = useAlertContext()

  // Get user from new simple auth context
  const { user, logout } = useSimpleAuth()

  // Close mobile menu and dropdown on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setUserDropdownOpen(false)
  }, [router.pathname])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownOpen && !event.target.closest('.admin-dropdown')) {
        setUserDropdownOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [userDropdownOpen])

  return (
    <>
      {/* Crisis Alert Banner */}
      {crisisBannerVisible && (
        <div className="crisis-alert">
          <div className="crisis-alert-header">
            <span>⚠️</span>
            <span>
              <strong>Tariff Alert:</strong> New import duties may impact your supply chain.{' '}
              <Link href="/trade-risk-alternatives" className="nav-link">
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
        {/* Fixed Navigation */}
        <nav className="nav-fixed">
          <div className="nav-container">
            <Link href="/" className="nav-logo-link">
              <div className="nav-logo-icon">T</div>
              <div>
                <div className="nav-logo-text">Triangle Trade Intelligence</div>
                <div className="nav-logo-subtitle">{user ? 'My Dashboard' : 'USMCA Trade Platform'}</div>
              </div>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="nav-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              ☰
            </button>

            {/* Main Navigation */}
            <div className={`nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              {user ? (
                // Signed in navigation
                <>
                  <Link
                    href="/dashboard"
                    className={`nav-menu-link ${router.pathname === '/dashboard' ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/usmca-workflow"
                    className={`nav-menu-link ${router.pathname === '/usmca-workflow' || router.pathname === '/usmca-certificate-completion' ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Workflows
                  </Link>
                  <Link
                    href="/trade-risk-alternatives"
                    className={`nav-menu-link ${router.pathname === '/trade-risk-alternatives' ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Alerts
                    {!loading && alertCount > 0 && (
                      <span className="badge badge-warning">
                        {alertCount}
                      </span>
                    )}
                  </Link>

                  {/* User Menu */}
                  <div className="admin-dropdown">
                    <button
                      className="btn-primary"
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    >
                      👤 {user?.user_metadata?.company_name || user?.email?.split('@')[0] || 'User'}
                      <span className="badge badge-info" style={{marginLeft: '8px'}}>
                        {user?.subscription_tier || 'Trial'}
                      </span>
                      <span style={{marginLeft: '8px'}}>▼</span>
                    </button>
                    {userDropdownOpen && (
                      <div className="admin-dropdown-menu">
                        <Link href="/dashboard" className="admin-dropdown-item">
                          Dashboard
                        </Link>
                        <Link href="/subscription" className="admin-dropdown-item">
                          Subscription/Billing
                        </Link>
                        <button onClick={logout} className="admin-dropdown-item">
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // Signed out navigation
                <>
                  <Link href="/login" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/signup" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </>
  )
}