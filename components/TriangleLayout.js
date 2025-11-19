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
                    onClick={async (e) => {
                      setMobileMenuOpen(false);

                      // ✅ FIX (Nov 19): Auto-load most recent workflow (same as "View Results")
                      // Check if there's an active workflow in URL first
                      const urlWorkflowId = router.query.workflow_id || router.query.view_results;
                      if (urlWorkflowId) {
                        e.preventDefault();
                        router.push(`/usmca-workflow?workflow_id=${urlWorkflowId}`);
                        return;
                      }

                      // Fetch most recent workflow from database
                      e.preventDefault();
                      try {
                        const response = await fetch('/api/dashboard-data', { credentials: 'include' });
                        if (response.ok) {
                          const data = await response.json();
                          const latestWorkflow = data.workflows?.[0]; // Most recent
                          if (latestWorkflow) {
                            console.log('🔄 Auto-loading most recent workflow:', latestWorkflow.id);
                            router.push(`/usmca-workflow?workflow_id=${latestWorkflow.id}&step=3`);
                            return;
                          }
                        }
                      } catch (error) {
                        console.error('Failed to fetch latest workflow:', error);
                      }

                      // Fallback: new workflow
                      router.push('/usmca-workflow');
                    }}
                  >
                    Workflows
                  </Link>
                  <Link
                    href={(() => {
                      // ✅ FIX (Nov 19): Preserve session when navigating to alerts
                      const urlWorkflowId = router.query.workflow_id || router.query.view_results;
                      if (urlWorkflowId) return `/trade-risk-alternatives?workflow_id=${urlWorkflowId}`;

                      // Check localStorage for active session
                      if (typeof window !== 'undefined') {
                        const sessionId = localStorage.getItem('workflow_session_id');
                        if (sessionId) return `/trade-risk-alternatives?workflow_id=${sessionId}`;
                      }

                      return '/trade-risk-alternatives'; // Default: no session
                    })()}
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

        {/* Footer with Copyright and Legal Links */}
        <footer style={{
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #e9ecef',
          padding: '1.5rem 0',
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#6c757d'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
            <p style={{ marginBottom: '0.5rem' }}>
              © 2025 Triangle Intelligence Platform. All rights reserved.
            </p>
            <p style={{ marginBottom: '0.5rem' }}>
              Proprietary USMCA analysis methodology and tariff intelligence system.
            </p>
            <div style={{ marginTop: '0.75rem' }}>
              <Link href="/terms-of-service" style={{ color: '#007bff', marginRight: '1rem', textDecoration: 'none' }}>
                Terms of Service
              </Link>
              <Link href="/privacy-policy" style={{ color: '#007bff', textDecoration: 'none' }}>
                Privacy Policy
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}