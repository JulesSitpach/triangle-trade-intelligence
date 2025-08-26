import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import LanguageSwitcher from './LanguageSwitcher'

export default function TriangleSideNav() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState('')
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [progressState, setProgressState] = useState({
    foundation: false,
    product: false,
    routing: false,
    partnership: false,
    hindsight: false,
    alerts: false
  })

  useEffect(() => {
    // Determine current page from path
    const path = router.pathname
    if (path === '/dashboard') setCurrentPage('dashboard')
    else if (path === '/usmca-workflow') setCurrentPage('usmca-workflow')
    else if (path === '/foundation') setCurrentPage('foundation')
    else if (path === '/product') setCurrentPage('product')
    else if (path === '/routing') setCurrentPage('routing')
    else if (path === '/partnership') setCurrentPage('partnership')
    else if (path === '/hindsight') setCurrentPage('hindsight')
    else if (path === '/alerts') setCurrentPage('alerts')

    // Check completion status from localStorage
    checkProgressState()
  }, [router.pathname])

  const checkProgressState = () => {
    if (typeof window === 'undefined') return

    try {
      const foundationData = localStorage.getItem('triangle-foundation')
      const productData = localStorage.getItem('triangle-product')
      const routingData = localStorage.getItem('triangle-routing')
      const partnershipData = localStorage.getItem('triangle-partnership')
      const hindsightData = localStorage.getItem('triangle-hindsight')

      setProgressState({
        foundation: !!foundationData,
        product: !!productData,
        routing: !!routingData,
        partnership: !!partnershipData,
        hindsight: !!hindsightData,
        alerts: !!hindsightData // Alerts unlocked when hindsight complete
      })
    } catch (error) {
      console.warn('Error checking progress state:', error)
    }
  }

  const isPageUnlocked = (pageKey) => {
    switch (pageKey) {
      case 'dashboard':
      case 'foundation':
      case 'usmca-workflow':
        return true // Always unlocked
      case 'product':
        return progressState.foundation
      case 'routing':
        return progressState.product
      case 'partnership':
        return progressState.routing
      case 'hindsight':
        return progressState.partnership
      case 'alerts':
        return progressState.hindsight
      default:
        return false
    }
  }

  const handleNavClick = (e, item) => {
    if (!isPageUnlocked(item.key)) {
      e.preventDefault()
      
      // Show friendly guidance message
      const nextSteps = {
        'product': 'Complete Business Foundation first',
        'routing': 'Complete Product Classification first',
        'partnership': 'Complete Triangle Routing first',
        'hindsight': 'Complete Partnership Strategy first',
        'alerts': 'Complete Hindsight Analysis first'
      }
      
      console.log(`🔒 ${item.label} locked: ${nextSteps[item.key]}`)
      
      // Optional: Show toast notification
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('triangle-nav-locked', {
          detail: { page: item.label, message: nextSteps[item.key] }
        })
        window.dispatchEvent(event)
      }
    }
  }

  const getPageIcon = (pageKey) => {
    if (isPageUnlocked(pageKey)) {
      return progressState[pageKey] ? '✅' : '📝'
    } else {
      return '🔒'
    }
  }

  const navigationItems = [
    { key: 'dashboard', label: 'Command Center', path: '/dashboard', description: 'System Overview' },
    { key: 'usmca-workflow', label: 'USMCA Workflow', path: '/usmca-workflow', description: 'Complete Compliance Solution', priority: true },
    { key: 'foundation', label: 'Business Foundation', path: '/foundation', description: 'Company Intelligence' },
    { key: 'product', label: 'Product Classification', path: '/product', description: 'HS Code Mapping' },
    { key: 'routing', label: 'Triangle Routing', path: '/routing', description: 'Optimization Engine' },
    { key: 'partnership', label: 'Partnership Strategy', path: '/partnership', description: 'Strategic Alliance' },
    { key: 'hindsight', label: 'Hindsight Analysis', path: '/hindsight', description: 'Pattern Intelligence' },
    { key: 'alerts', label: 'Market Alerts', path: '/alerts', description: 'Live Monitoring' }
  ]

  return (
    <nav className="bloomberg-side-nav">
      {/* Brand Section */}
      <div className="nav-brand">
        <div className="brand-icon"></div>
        <div className="brand-text">
          <div className="brand-title">Triangle Intelligence</div>
          <div className="brand-subtitle">Professional Platform</div>
        </div>
      </div>

      {/* Language Switcher */}
      <div className="nav-language">
        <LanguageSwitcher onLanguageChange={setCurrentLanguage} />
      </div>

      {/* Navigation Items */}
      <div className="nav-items">
        {navigationItems.map(item => {
          const isUnlocked = isPageUnlocked(item.key)
          const isCompleted = progressState[item.key]
          const isPriority = item.priority
          
          return (
            <Link 
              key={item.key} 
              href={isUnlocked ? item.path : '#'} 
              className={`nav-item ${currentPage === item.key ? 'active' : ''} ${!isUnlocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''} ${isPriority ? 'priority-workflow' : ''}`}
              onClick={(e) => handleNavClick(e, item)}
            >
              <div className="nav-icon">
                {isPriority ? '🚀' : getPageIcon(item.key)}
              </div>
              <div className="nav-content">
                <div className="nav-label">
                  {item.label}
                  {isPriority && <span className="priority-indicator"> NEW</span>}
                  {!isUnlocked && <span className="lock-indicator"> 🔒</span>}
                  {isCompleted && <span className="complete-indicator"> ✅</span>}
                </div>
                <div className="nav-description">
                  {!isUnlocked ? 'Locked - Complete previous steps' : item.description}
                </div>
              </div>
              {currentPage === item.key && <div className="nav-indicator"></div>}
            </Link>
          )
        })}
      </div>

      {/* Status Section */}
      <div className="nav-status">
        <div className="status-header">System Status</div>
        <div className="status-items">
          <div className="bloomberg-status bloomberg-status-success small">
            Database Connected
          </div>
          <div className="bloomberg-status bloomberg-status-success small">
            APIs Operational
          </div>
          <div className="bloomberg-status bloomberg-status-info small">
            Intelligence: Active
          </div>
        </div>
      </div>
    </nav>
  )
}