import { useState, useEffect } from 'react'
import Link from 'next/link'
import LanguageSwitcher from './LanguageSwitcher'

/**
 * Universal Layout Wrapper for Bloomberg Terminal Consistency
 * 
 * This component provides consistent layout structure across ALL pages:
 * - Marketing pages (index, pricing, about, etc.)
 * - Core journey pages (foundation, product, routing, etc.)
 * - Dashboard and operational pages
 * 
 * Features:
 * - Unified crisis banner
 * - Consistent navigation structure
 * - Professional status bar
 * - Responsive design
 * - Seamless visual flow between marketing → foundation
 */

export default function UniversalLayoutWrapper({ 
  children, 
  pageType = 'marketing', // 'marketing', 'journey', 'dashboard'
  showCrisisBanner = true,
  showStatusBar = true,
  showNavigation = true,
  currentPage = '',
  className = ''
}) {
  const [isClient, setIsClient] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('en')

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Navigation items based on page type
  const getNavigationItems = () => {
    if (pageType === 'journey' || pageType === 'dashboard') {
      return [
        { href: '/foundation', label: 'PLATFORM', active: currentPage === 'foundation' },
        { href: '/dashboard-hub', label: 'DASHBOARD', active: currentPage === 'dashboard-hub' },
        { href: '/about', label: 'INSIGHTS', active: currentPage === 'about' },
        { href: '/contact', label: 'SUPPORT', active: currentPage === 'contact' }
      ]
    } else {
      return [
        { href: '/foundation', label: 'PLATFORM', active: currentPage === 'platform' },
        { href: '/dashboard-hub', label: 'SOLUTIONS', active: currentPage === 'solutions' },
        { href: '/about', label: 'INSIGHTS', active: currentPage === 'insights' },
        { href: '/pricing', label: 'SUPPORT', active: currentPage === 'pricing' }
      ]
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <div className={`bloomberg-page-container ${className}`}>
      {/* Crisis Alert Banner - Consistent across all pages */}
      {showCrisisBanner && (
        <div className="bloomberg-universal-crisis-banner">
          <div className="bloomberg-universal-crisis-content">
            <span className="bloomberg-universal-crisis-message">
              TRADE WAR ALERT: USMCA Treaty Under Review - Emergency Business Protection Active
            </span>
            <span className="bloomberg-universal-crisis-status">
              597K+ Trade Flows Monitored
            </span>
          </div>
        </div>
      )}

      {/* Terminal Status Bar - Professional System Status */}
      {showStatusBar && (
        <div className="bloomberg-universal-status-bar">
          <div className="bloomberg-universal-status-content">
            <div className="bloomberg-status bloomberg-status-success">
              <div className="bloomberg-status-dot"></div>
              TRIANGLE INTELLIGENCE PROFESSIONAL TERMINAL
              <span className="bloomberg-text-muted">
                SESSION: {currentPage.toUpperCase() || 'ACTIVE'} | STATUS: MONITORING | {isClient ? new Date().toLocaleString() : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Universal Navigation - Consistent Structure */}
      {showNavigation && (
        <nav className="bloomberg-universal-nav">
          <div className="bloomberg-nav-container">
            <Link href="/" className="bloomberg-nav-brand">
              <span className="bloomberg-brand-accent">◢</span>
              TRIANGLE INTELLIGENCE
              <span className="bloomberg-brand-version">PRO v2.1</span>
            </Link>
            
            <div className="bloomberg-nav-links">
              {navigationItems.map((item, index) => (
                <Link 
                  key={index}
                  href={item.href} 
                  className={`bloomberg-nav-link ${item.active ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Language Switcher */}
              <div style={{ marginLeft: 'var(--space-md)' }}>
                <LanguageSwitcher onLanguageChange={setCurrentLanguage} />
              </div>
              
              {/* Primary CTA Button */}
              <Link 
                href="/foundation" 
                className="bloomberg-universal-btn bloomberg-universal-btn-primary"
              >
                ACCESS TERMINAL
              </Link>
            </div>
          </div>
        </nav>
      )}

      {/* Marketing to Foundation Bridge - Smooth Transition */}
      {pageType === 'marketing' && currentPage !== 'index' && (
        <div className="bloomberg-marketing-to-foundation-bridge">
          <div className="bloomberg-marketing-to-foundation-bridge-content">
            <div className="bloomberg-transition-message">
              🎯 Professional Trade Intelligence Terminal
            </div>
            <div className="bloomberg-transition-subtitle">
              Bloomberg Terminal-style interface for tariff optimization and triangle routing
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="bloomberg-main-content">
        {children}
      </main>
    </div>
  )
}

/**
 * Usage Examples:
 * 
 * // Marketing pages (index.js, pricing.js, about.js)
 * <UniversalLayoutWrapper pageType="marketing" currentPage="pricing">
 *   <YourPageContent />
 * </UniversalLayoutWrapper>
 * 
 * // Journey pages (foundation.js, product.js, routing.js)
 * <UniversalLayoutWrapper pageType="journey" currentPage="foundation">
 *   <YourPageContent />
 * </UniversalLayoutWrapper>
 * 
 * // Dashboard pages
 * <UniversalLayoutWrapper pageType="dashboard" currentPage="dashboard-hub">
 *   <YourPageContent />
 * </UniversalLayoutWrapper>
 */