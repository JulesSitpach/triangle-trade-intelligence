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
  const [user, setUser] = useState(null)
  const router = useRouter()
  
  // Get alert count from context
  const { alertCount, loading } = useAlertContext()

  // Load user data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('triangle_user_session') || localStorage.getItem('current_user');
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setUser(userData);
      } catch (e) {
        console.log('Invalid stored user data');
      }
    }
  }, []);

  // Close mobile menu and dropdown on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setUserDropdownOpen(false)
    setAdminDropdownOpen(false)
  }, [router.pathname]) // Only track pathname changes

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
      path: '/dashboard',
      label: 'My Dashboard',
      description: 'Overview and quick access',
      public: true
    },
    {
      path: '/dashboard',
      label: 'Dashboard',
      description: 'Main dashboard view',
      public: true
    },
    {
      path: '/usmca-workflow',
      label: 'Workflows',
      description: 'Complete compliance analysis',
      public: true
    },
    {
      path: '/trade-risk-alternatives',
      label: 'Alerts',
      description: 'Real-time tariff monitoring',
      badge: !loading && alertCount > 0 ? alertCount.toString() : null,
      public: true
    },
    {
      path: '/certificates',
      label: 'Certificates',
      description: 'Generated certificates',
      public: true
    }
  ]

  // Professional Mexico Trade Bridge admin dashboard items
  const adminItems = [
    {
      path: '/admin/client-portfolio',
      label: '🇲🇽 Jorge\'s Partnership Operations',
      description: 'Mexico partnerships • User management • Crisis alerts • SMB matching'
    },
    {
      path: '/admin/broker-dashboard',
      label: '🚢 Cristina\'s Broker Operations',
      description: 'Licensed customs broker #4601913 • Logistics • Crisis management'
    },
    {
      path: '/admin/collaboration-workspace',
      label: '🤝 Jorge-Cristina Collaboration',
      description: 'Cross-team coordination • Joint client management'
    },
    {
      path: '/admin/analytics',
      label: '📈 Business Analytics',
      description: 'Partnership ROI • Team performance • Revenue attribution'
    },
    {
      path: '/admin/system-config',
      label: '⚙️ System Management',
      description: 'Platform configuration • Health monitoring • Performance metrics'
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
        {/* Professional Dashboard Navigation */}
        <header className="dashboard-nav">
          <div className="dashboard-nav-container">
            <Link href="/" className="nav-logo-link">
              <div className="nav-logo-icon">T</div>
              <div>
                <div className="nav-logo-text">Triangle Intelligence</div>
                <div className="nav-logo-subtitle">My Dashboard</div>
              </div>
            </Link>

            {/* Main Navigation */}
            <div className="nav-menu">
              <Link href="/dashboard" className="nav-menu-link">Dashboard</Link>
              <Link href="/usmca-workflow" className="nav-menu-link">Workflows</Link>
              <Link href="/trade-risk-alternatives" className="nav-menu-link">Alerts</Link>
              <Link href="/certificates" className="nav-menu-link">Certificates</Link>
            </div>

            {/* Right Side Actions */}
            <div className="nav-menu">
              {/* User Menu */}
              <div className="admin-dropdown">
                <button
                  className="user-menu-button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  👤 {user?.user_metadata?.company_name || user?.email?.split('@')[0] || 'User'}
                </button>
                {userDropdownOpen && (
                  <div className="admin-dropdown-menu">
                    <Link href="/profile" className="admin-dropdown-item">
                      View Profile
                    </Link>
                    <Link href="/account-settings" className="admin-dropdown-item">
                      Account Settings
                    </Link>
                    <Link href="/pricing" className="admin-dropdown-item">
                      Subscription/Billing
                    </Link>
                    <Link href="mailto:support@triangleintelligence.com" className="admin-dropdown-item">
                      Help
                    </Link>
                    <button onClick={() => {
                      localStorage.removeItem('current_user');
                      localStorage.removeItem('triangle_user_session');
                      window.location.href = '/';
                    }} className="admin-dropdown-item">
                      Sign Out
                    </button>
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