import Head from 'next/head'
import '../styles/globals.css'
import '../styles/dashboard-user.css'
import '../styles/salesforce-tables.css'
import '../styles/agent-components.css'
import '../styles/admin-workflows.css'
import { AlertProvider } from '../lib/contexts/AlertContext'
import { SimpleAuthProvider } from '../lib/contexts/SimpleAuthContext'
import ErrorBoundary from '../components/ErrorBoundary'
// import '../lib/i18n' // Initialize proper i18n system
// import GlobalHSCodeChat from '../components/GlobalHSCodeChat'
// import BilingualSalesChatBot from '../components/BilingualSalesChatBot'
// import { TriangleStateProvider } from '../lib/state/TriangleStateContext'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Triangle Trade Intelligence - Simplified</title>
        <meta name="description" content="Simplified tariff optimization and triangle routing intelligence for reliable operation" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <ErrorBoundary>
        <SimpleAuthProvider>
          <AlertProvider>
            <Component {...pageProps} />
          </AlertProvider>
        </SimpleAuthProvider>
      </ErrorBoundary>
    </>
  )
}