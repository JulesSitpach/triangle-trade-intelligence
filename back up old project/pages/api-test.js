import { useState } from 'react'
import Head from 'next/head'

export default function APITestPage() {
  const [hsCodeResult, setHsCodeResult] = useState(null)
  const [routingResult, setRoutingResult] = useState(null)
  const [statusResult, setStatusResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testHSCodeAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/intelligence/hs-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription: 'Ball bearings for industrial machinery',
          businessType: 'Manufacturing'
        })
      })
      const data = await response.json()
      setHsCodeResult(data)
    } catch (error) {
      setHsCodeResult({ error: error.message })
    }
    setLoading(false)
  }

  const testRoutingAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/intelligence/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: [
            { description: 'Ball bearings', hsCode: '848210' }
          ],
          businessProfile: {
            businessType: 'Manufacturing',
            importVolume: '$5M - $25M',
            zipCode: '90001'
          }
        })
      })
      const data = await response.json()
      setRoutingResult(data)
    } catch (error) {
      setRoutingResult({ error: error.message })
    }
    setLoading(false)
  }

  const testStatusAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/status')
      const data = await response.json()
      setStatusResult(data)
    } catch (error) {
      setStatusResult({ error: error.message })
    }
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>API Test Dashboard - Triangle Intelligence</title>
      </Head>
      
      <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
        <h1>🧪 API Test Dashboard</h1>
        <p>Test the Triangle Intelligence APIs and see if they&apos;re making real external calls</p>
        
        <div style={{ marginTop: '2rem' }}>
          <h2>1. System Status</h2>
          <button 
            onClick={testStatusAPI}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            Check API Configuration
          </button>
          
          {statusResult && (
            <pre style={{ 
              background: '#f0f0f0', 
              padding: '1rem', 
              marginTop: '1rem',
              borderRadius: '0.25rem',
              overflow: 'auto'
            }}>
              {JSON.stringify(statusResult, null, 2)}
            </pre>
          )}
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h2>2. HS Code API Test</h2>
          <button 
            onClick={testHSCodeAPI}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            Test HS Code Lookup (Comtrade API)
          </button>
          
          {hsCodeResult && (
            <pre style={{ 
              background: '#f0f0f0', 
              padding: '1rem', 
              marginTop: '1rem',
              borderRadius: '0.25rem',
              overflow: 'auto'
            }}>
              {JSON.stringify(hsCodeResult, null, 2)}
            </pre>
          )}
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h2>3. Routing API Test</h2>
          <button 
            onClick={testRoutingAPI}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            Test Triangle Routing (Shippo API)
          </button>
          
          {routingResult && (
            <pre style={{ 
              background: '#f0f0f0', 
              padding: '1rem', 
              marginTop: '1rem',
              borderRadius: '0.25rem',
              overflow: 'auto'
            }}>
              {JSON.stringify(routingResult, null, 2)}
            </pre>
          )}
        </div>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: '#fef3c7',
          borderRadius: '0.25rem'
        }}>
          <h3>📋 What to Look For:</h3>
          <ul>
            <li><strong>source: &quot;comtrade&quot;</strong> = Real UN Comtrade API was called</li>
            <li><strong>source: &quot;shippo&quot;</strong> = Real Shippo API was called</li>
            <li><strong>source: &quot;cache&quot;</strong> = Using fallback data (no API call)</li>
            <li><strong>apiCall: true</strong> = External API was contacted</li>
            <li><strong>apiCall: false</strong> = Using local/cached data</li>
          </ul>
          <p><strong>Note:</strong> Check your terminal running `npm run dev` for server-side logs!</p>
        </div>
      </div>
    </>
  )
}