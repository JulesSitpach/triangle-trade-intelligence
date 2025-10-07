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
                  <Link href="/dashboard" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link href="/usmca-workflow" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
                    Workflows
                  </Link>
                  <Link href="/trade-risk-alternatives" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
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
                      className="nav-cta-button"
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    >
                      👤 {user?.user_metadata?.company_name || user?.email?.split('@')[0] || 'User'}
                    </button>
                    {userDropdownOpen && (
                      <div className="admin-dropdown-menu">
                        <Link href="/account/settings" className="admin-dropdown-item">
                          Account Settings
                        </Link>
                        <Link href="/account/subscription" className="admin-dropdown-item">
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
                  <Link href="/login" className="nav-cta-button" onClick={() => setMobileMenuOpen(false)}>
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