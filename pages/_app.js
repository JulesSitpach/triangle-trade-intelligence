import { useEffect, useState } from 'react'
import Head from 'next/head'
import '../styles/globals.css'
import '../styles/dashboard.css'
import { AlertProvider } from '../lib/contexts/AlertContext'
import { AuthProvider } from '../lib/contexts/ProductionAuthContext'
// import '../lib/i18n' // Initialize proper i18n system
// import GlobalHSCodeChat from '../components/GlobalHSCodeChat'
// import BilingualSalesChatBot from '../components/BilingualSalesChatBot'
// import { TriangleStateProvider } from '../lib/state/TriangleStateContext'
// import ErrorBoundary from '../components/ErrorBoundary'

export default function App({ Component, pageProps }) {
  const [showLoading, setShowLoading] = useState(true)
  
  useEffect(() => {
    // Hide loading overlay when React hydrates
    const timer = setTimeout(() => {
      setShowLoading(false)
      // Ensure dark background is visible
      document.documentElement.style.visibility = 'visible'
      document.body.style.visibility = 'visible'
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <Head>
        <title>Triangle Intelligence - Simplified</title>
        <meta name="description" content="Simplified tariff optimization and triangle routing intelligence for reliable operation" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      {/* Loading overlay - hidden when React hydrates */}
      {showLoading && (
        <div className="loading-overlay">
          Triangle Intelligence Loading... (Simplified Mode)
        </div>
      )}
      
      <AuthProvider>
        <AlertProvider>
          <Component {...pageProps} />
        </AlertProvider>
      </AuthProvider>
    </>
  )
}