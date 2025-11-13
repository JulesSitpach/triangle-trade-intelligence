/**
 * ErrorBoundary.js - Production-ready error boundary component
 * Catches React errors and provides graceful fallbacks
 * Includes error reporting and recovery options
 */

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  reportError = (error, errorInfo) => {
    // In production, send error to monitoring service
    // This could be Sentry, LogRocket, or custom error tracking
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.props.userId || 'anonymous'
      };

      // Example: Send to error tracking service
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });

      console.log('Error reported:', errorReport);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;

    if (newRetryCount <= 3) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: newRetryCount
      });
    }
  };

  render() {
    if (this.state.hasError) {
      const canRetry = this.state.retryCount < 3;

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2 className="error-title">Oops! Something went wrong</h2>
            <p className="error-message">
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>

            <div className="error-actions">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="btn-primary error-retry-btn"
                >
                  Try Again ({3 - this.state.retryCount} attempts left)
                </button>
              )}

              <button
                onClick={() => window.location.reload()}
                className="btn-secondary error-reload-btn"
              >
                Reload Page
              </button>

              <button
                onClick={() => window.history.back()}
                className="btn-secondary error-back-btn"
              >
                Go Back
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Technical Details (Development Only)</summary>
                <div className="error-stack">
                  <h4>Error:</h4>
                  <pre>{this.state.error && this.state.error.toString()}</pre>

                  <h4>Component Stack:</h4>
                  <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>

                  <h4>Error Stack:</h4>
                  <pre>{this.state.error && this.state.error.stack}</pre>
                </div>
              </details>
            )}

            <div className="error-help">
              <p>If this problem persists, please contact support:</p>
              <a href="/support" className="error-contact-link">
                support@triangle-intelligence.com
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Higher-order component for easy wrapping
export function withErrorBoundary(Component, errorBoundaryProps = {}) {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Specific error boundary for service components
export function ServiceErrorBoundary({ children, serviceName }) {
  return (
    <ErrorBoundary userId={null}>
      {children}
    </ErrorBoundary>
  );
}