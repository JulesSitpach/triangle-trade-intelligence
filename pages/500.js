import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Custom500() {
  const router = useRouter()

  return (
    <div className="container-app">
      <Head>
        <title>500 - Server Error | Triangle Intelligence</title>
      </Head>

      <div className="error-page">
        <div className="error-container">
          <h1 className="error-title">500 - Server Error</h1>
          <p className="error-description">
            Something went wrong on our end. Please try again later.
          </p>
          <div className="error-actions">
            <button
              className="btn-primary"
              onClick={() => router.push('/')}
            >
              Go Home
            </button>
            <button
              className="btn-secondary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .error-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--gray-50);
        }
        .error-container {
          text-align: center;
          max-width: 500px;
          padding: 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: var(--shadow-lg);
        }
        .error-title {
          font-size: 2rem;
          margin-bottom: 1rem;
          color: var(--navy-700);
        }
        .error-description {
          margin-bottom: 2rem;
          color: var(--gray-600);
          font-size: 1.125rem;
        }
        .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
      `}</style>
    </div>
  )
}