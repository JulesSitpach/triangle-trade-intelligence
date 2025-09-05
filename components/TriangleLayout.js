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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const router = useRouter()

  // Close mobile menu and dropdown on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setUserDropdownOpen(false)
  }, [router.pathname])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownOpen && !event.target.closest('.dashboard-nav-dropdown')) {
        setUserDropdownOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [userDropdownOpen])

  const navigationItems = [
    {
      path: '/usmca-workflow',
      label: 'Workflow',
      description: 'Complete compliance analysis'
    },
    {
      path: '/trump-tariff-alerts',
      label: 'Reports',
      description: 'Real-time tariff monitoring',
      badge: '3' // Show alert count
    },
    {
      path: '/admin/supplier-management',
      label: 'Settings',
      description: 'Manage suppliers and preferences'
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