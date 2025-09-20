import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="error-boundary">
          <div className="error-container">
            <h2 className="error-title">Something went wrong</h2>
            <p className="error-description">
              The application encountered an unexpected error. Please refresh the page to try again.
            </p>
            <button
              className="error-button"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <pre className="error-stack">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>

          <style jsx>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: #f8fafc;
              padding: 1rem;
            }
            .error-container {
              text-align: center;
              max-width: 500px;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              border: 1px solid #e2e8f0;
            }
            .error-title {
              font-size: 1.5rem;
              margin-bottom: 1rem;
              color: #dc2626;
              font-weight: 600;
            }
            .error-description {
              margin-bottom: 2rem;
              color: #64748b;
              line-height: 1.6;
            }
            .error-button {
              background: #1e40af;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              cursor: pointer;
              font-size: 1rem;
              font-weight: 500;
              transition: background 0.2s;
            }
            .error-button:hover {
              background: #1d4ed8;
            }
            .error-details {
              margin-top: 2rem;
              text-align: left;
              background: #f1f5f9;
              padding: 1rem;
              border-radius: 4px;
              border: 1px solid #e2e8f0;
            }
            .error-stack {
              color: #dc2626;
              font-size: 0.875rem;
              white-space: pre-wrap;
              overflow-x: auto;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;