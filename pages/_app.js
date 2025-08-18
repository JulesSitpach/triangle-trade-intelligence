import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import '../styles/bloomberg-professional-clean.css'
import '../lib/i18n' // Initialize proper i18n system
import GlobalHSCodeChat from '../components/GlobalHSCodeChat'

export default function App({ Component, pageProps }) {
  const router = useRouter()
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
        <title>Triangle Intelligence</title>
        <meta name="description" content="Tariff optimization and triangle routing intelligence" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      {/* Loading overlay - hidden when React hydrates */}
      {showLoading && (
        <div className="loading-overlay">
          Triangle Intelligence Loading...
        </div>
      )}
      
      <Component {...pageProps} />
      {/* Only show chat bot on stage and dashboard pages */}
      {(router.pathname.startsWith('/stage') || 
        router.pathname.startsWith('/dashboard') ||
        router.pathname.startsWith('/foundation')) && 
        <GlobalHSCodeChat />
      }
    </>
  )
}