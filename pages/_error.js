import { useEffect } from 'react'

function Error({ statusCode, hasGetInitialPropsRun, err }) {
  useEffect(() => {
    if (err) {
      // Log error to monitoring service
      console.error('Application error:', err)
    }
  }, [err])

  return (
    <div className="error-page">
      <div className="error-container">
        <h1 className="error-title">
          {statusCode
            ? `A ${statusCode} error occurred on server`
            : 'An error occurred on client'}
        </h1>
        <div className="error-description">
          {statusCode === 404
            ? 'This page could not be found.'
            : 'Sorry, something went wrong.'}
        </div>
        <button
          className="error-button"
          onClick={() => window.location.href = '/'}
        >
          Return Home
        </button>
      </div>
      <style jsx>{`
        .error-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #0a0e13;
          color: #e0e6ed;
        }
        .error-container {
          text-align: center;
          max-width: 400px;
          padding: 2rem;
        }
        .error-title {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #ff6b6b;
        }
        .error-description {
          margin-bottom: 2rem;
          color: #a0a6ad;
        }
        .error-button {
          background: #1a5490;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }
        .error-button:hover {
          background: #2a6ab0;
        }
      `}</style>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error