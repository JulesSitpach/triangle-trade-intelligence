import React from 'react'

/**
 * ErrorBoundary Component for Triangle Intelligence Platform
 * 
 * Catches JavaScript errors anywhere in child component tree,
 * logs errors, and displays a professional fallback UI.
 * 
 * Features:
 * - Graceful error recovery with retry functionality
 * - System status check integration
 * - Development mode error details
 * - Professional Bloomberg Terminal-style error UI
 * - No inline styles - uses CSS classes from errors.css
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Store error details in state for display
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // In production, you might want to log to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo)
      // This could be Sentry, LogRocket, or custom error logging
    }
  }

  handleRetry = () => {
    // Clear error state to retry rendering
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  handleGoToFoundation = () => {
    // Navigate to foundation page (safe starting point)
    window.location.href = '/foundation'
  }

  handleCheckStatus = () => {
    // Navigate to system status page
    window.location.href = '/api/status'
  }

  render() {
    if (this.state.hasError) {
      // Render professional error fallback UI
      return (
        <div className="error-boundary-container">
          <h2 className="error-boundary-header">
            <span className="error-boundary-icon">⚠️</span>
            Something went wrong
          </h2>
          
          <p className="error-boundary-message">
            The application encountered an error. This is part of the simplified Triangle Intelligence system.
          </p>
          
          <div className="error-actions">
            <button 
              onClick={this.handleRetry}
              className="error-button error-button--retry"
              aria-label="Retry the operation"
            >
              Try Again
            </button>
            
            <button 
              onClick={this.handleGoToFoundation}
              className="error-button error-button--home"
              aria-label="Go to Foundation page"
            >
              Go to Foundation
            </button>
            
            <button 
              onClick={this.handleCheckStatus}
              className="error-button error-button--status"
              aria-label="Check system status"
            >
              Check System Status
            </button>
          </div>
          
          <div className="error-info-box">
            <div className="error-info-title">Simplified Mode Active:</div>
            <ul className="error-info-list">
              <li className="error-info-item">
                Database queries disabled for reliability
              </li>
              <li className="error-info-item">
                Using static calculations and dropdowns
              </li>
              <li className="error-info-item">
                All estimates marked as "NOT VERIFIED DATA"
              </li>
              <li className="error-info-item">
                Check /api/status for system health
              </li>
            </ul>
          </div>
          
          {/* Show error details only in development mode */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="error-details">
              <summary className="error-details-summary">
                Development Error Details (click to expand)
              </summary>
              <pre className="error-details-content">
                {this.state.error && this.state.error.toString()}
                {'\n\n'}
                Stack Trace:
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    // No error - render children normally
    return this.props.children
  }
}

export default ErrorBoundary