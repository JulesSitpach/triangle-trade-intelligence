import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAlertContext } from '../lib/contexts/AlertContext'

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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false)
  const router = useRouter()
  
  // Get alert count from context
  const { alertCount, loading } = useAlertContext()

  // Close mobile menu and dropdown on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setUserDropdownOpen(false)
    setAdminDropdownOpen(false)
  }, [router.pathname])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownOpen && !event.target.closest('.dashboard-nav-dropdown')) {
        setUserDropdownOpen(false)
      }
      if (adminDropdownOpen && !event.target.closest('.admin-dropdown')) {
        setAdminDropdownOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [userDropdownOpen, adminDropdownOpen])

  // Developer access: Add ?dev=true to URL or localStorage flag
  const isDev = router.query.dev === 'true' || 
                (typeof window !== 'undefined' && localStorage.getItem('triangle-dev-mode') === 'true')
  
  // Admin access detection (environment-based)
  const isAdmin = process.env.NODE_ENV === 'development' || isDev

  const navigationItems = [
    {
      path: '/usmca-workflow',
      label: 'Workflow',
      description: 'Complete compliance analysis',
      public: true
    },
    {
      path: '/trump-tariff-alerts',
      label: 'Alerts',
      description: 'Real-time tariff monitoring',
      badge: !loading && alertCount > 0 ? alertCount.toString() : null,
      public: true
    }
  ]

  // Internal admin dashboard items
  const adminItems = [
    {
      path: '/admin/supplier-management',
      label: 'Supplier Management',
      description: 'Manage suppliers and preferences'
    },
    {
      path: '/admin/user-management',
      label: 'User Management', 
      description: 'Manage customer accounts'
    },
    {
      path: '/admin/analytics',
      label: 'Analytics',
      description: 'Platform usage and metrics'
    },
    {
      path: '/admin/system-config',
      label: 'System Config',
      description: 'Configure system settings'
    },
    {
      path: '/sales/dashboard',
      label: 'Sales Dashboard',
      description: 'Sales team tools and metrics'
    },
    {
      path: '/admin/crisis-management',
      label: 'Crisis Management',
      description: 'Monitor and manage tariff crises'
    },
    {
      path: '/system-status',
      label: 'System Status',
      description: 'Real-time platform health monitoring'
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
        {/* Professional Dashboard Navigation */}
        <header className="dashboard-nav">
          <div className="dashboard-nav-container">
            {/* Professional Brand */}
            <Link href="/" className="dashboard-nav-brand">
              <div className="dashboard-nav-logo">
                TI
              </div>
              <div className="dashboard-nav-title">
                Triangle Intelligence
              </div>
            </Link>

            {/* Desktop Navigation Menu */}
            <nav className="dashboard-nav-menu">
              {navigationItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`dashboard-nav-link ${router.pathname === item.path ? 'active' : ''}`}
                >
                  <span>{item.label}</span>
                  {item.badge && <span className="badge badge-warning">{item.badge}</span>}
                </Link>
              ))}
              
              {/* Admin Dropdown - Only visible to admin/dev users */}
              {(isAdmin || isDev) && (
                <div className="admin-dropdown">
                  <button 
                    className={`dashboard-nav-link ${router.pathname.startsWith('/admin') || router.pathname.startsWith('/sales') ? 'active' : ''}`}
                    onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                    aria-label="Admin menu"
                  >
                    <span>Admin</span>
                    <span className="dropdown-arrow">{adminDropdownOpen ? '▲' : '▼'}</span>
                  </button>
                  
                  {adminDropdownOpen && (
                    <div className="admin-dropdown-menu">
                      {adminItems.map((item) => (
                        <Link
                          key={item.path}
                          href={item.path}
                          className={`admin-dropdown-item ${router.pathname === item.path ? 'active' : ''}`}
                          onClick={() => setAdminDropdownOpen(false)}
                        >
                          <div>
                            <div className="admin-item-label">{item.label}</div>
                            <div className="admin-item-description">{item.description}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* Professional User Section */}
            <div className="dashboard-nav-user">
              <Link 
                href="/usmca-workflow" 
                className="btn-primary"
              >
                New Analysis
              </Link>
              
              {/* User Profile Dropdown */}
              <div className="dashboard-nav-dropdown">
                <button 
                  className="dashboard-nav-avatar"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-label="User menu"
                >
                  U
                </button>
                
                {userDropdownOpen && (
                  <div className="dashboard-nav-dropdown-menu">
                    <Link href="/admin/profile" className="dashboard-nav-dropdown-item">
                      Profile Settings
                    </Link>
                    <Link href="/admin/billing" className="dashboard-nav-dropdown-item">
                      Billing & Plans
                    </Link>
                    <Link href="/admin/preferences" className="dashboard-nav-dropdown-item">
                      Preferences
                    </Link>
                    <div className="nav-dropdown-divider"></div>
                    <Link href="/auth/logout" className="dashboard-nav-dropdown-item">
                      Sign Out
                    </Link>
                  </div>
                )}
              </div>
            </div>
              
            {/* Mobile Menu Toggle */}
            <button
              className="nav-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* Mobile Menu - Only renders when open */}
          {mobileMenuOpen && (
            <div className="dashboard-nav-mobile-menu open">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`dashboard-nav-link ${
                    router.pathname === item.path ? 'active' : ''
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                  {item.badge && (
                    <span className="badge badge-warning">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
              
              {/* Admin Menu Items for Mobile - Only visible to admin/dev users */}
              {(isAdmin || isDev) && (
                <>
                  <div className="mobile-section-divider">Admin Tools</div>
                  {adminItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`dashboard-nav-link admin-mobile-item ${
                        router.pathname === item.path ? 'active' : ''
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div>
                        <div className="admin-item-label">{item.label}</div>
                        <div className="admin-item-description">{item.description}</div>
                      </div>
                    </Link>
                  ))}
                </>
              )}
              
              <Link
                href="/usmca-workflow"
                className="btn-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                New Analysis
              </Link>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </>
  )
}