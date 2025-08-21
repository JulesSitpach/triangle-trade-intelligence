import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function TestNavigation() {
  const [testResults, setTestResults] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (step, status, message) => {
    setTestResults(prev => [...prev, { step, status, message, time: new Date().toLocaleTimeString() }])
  }

  const clearStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('triangle-foundation')
      localStorage.removeItem('triangle-product') 
      localStorage.removeItem('triangle-routing')
      localStorage.removeItem('triangle-partnership')
      localStorage.removeItem('triangle-hindsight')
      addResult('Clear', 'success', 'All localStorage data cleared')
    }
  }

  const testFoundationData = () => {
    if (typeof window !== 'undefined') {
      const testData = {
        companyName: "Test Electronics Corp",
        businessType: "Electronics",
        zipCode: "90210",
        primarySupplierCountry: "CN",
        importVolume: "$1M - $5M",
        timelinePriority: "Cost",
        derivedContext: {
          geographic: { region: "West Coast", city: "Los Angeles" },
          patterns: { seasonal: "Q4_HEAVY" }
        },
        timestamp: Date.now()
      }
      
      localStorage.setItem('triangle-foundation', JSON.stringify(testData))
      addResult('Foundation', 'success', 'Foundation data stored - Product stage should unlock')
      return true
    }
    return false
  }

  const testProductData = () => {
    if (typeof window !== 'undefined') {
      const testData = {
        products: [
          { description: "Smartphone accessories", hsCode: "8517.62", confidence: 90 },
          { description: "USB cables", hsCode: "8544.42", confidence: 85 }
        ],
        hsCodes: ["8517.62", "8544.42"],
        totalProducts: 2,
        averageConfidence: 87.5,
        timestamp: Date.now()
      }
      
      localStorage.setItem('triangle-product', JSON.stringify(testData))
      addResult('Product', 'success', 'Product data stored - Routing stage should unlock')
      return true
    }
    return false
  }

  const testRoutingData = () => {
    if (typeof window !== 'undefined') {
      const testData = {
        selectedRoute: 'usmca_mexico',
        calculations: {
          annualSavings: 185000,
          savingsPercentage: 22,
          breakEvenMonths: 4
        },
        triangleAnalysisComplete: true,
        timestamp: Date.now()
      }
      
      localStorage.setItem('triangle-routing', JSON.stringify(testData))
      addResult('Routing', 'success', 'Routing data stored - Partnership stage should unlock')
      return true
    }
    return false
  }

  const checkNavigationState = () => {
    if (typeof window !== 'undefined') {
      const foundation = localStorage.getItem('triangle-foundation')
      const product = localStorage.getItem('triangle-product')
      const routing = localStorage.getItem('triangle-routing')
      
      const states = {
        foundation: !!foundation,
        product: !!product,
        routing: !!routing
      }
      
      let message = `Navigation State - Foundation: ${states.foundation ? '✅' : '❌'}, Product: ${states.product ? '✅' : '❌'}, Routing: ${states.routing ? '✅' : '❌'}`
      addResult('Navigation', states.foundation && states.product && states.routing ? 'success' : 'warning', message)
      
      return states
    }
    return { foundation: false, product: false, routing: false }
  }

  const testAPIEndpoints = async () => {
    const endpoints = [
      '/api/dropdown-options',
      '/api/intelligence/hs-codes',
      '/api/intelligence/market-overview',
      '/api/intelligence/real-time-stats'
    ]
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: endpoint.includes('hs-codes') ? 'POST' : 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: endpoint.includes('hs-codes') ? JSON.stringify({
            productDescription: "test product",
            businessType: "Electronics"
          }) : undefined
        })
        
        if (response.ok) {
          addResult('API', 'success', `${endpoint} - Working`)
        } else {
          addResult('API', 'error', `${endpoint} - HTTP ${response.status}`)
        }
      } catch (error) {
        addResult('API', 'error', `${endpoint} - ${error.message}`)
      }
    }
  }

  const runFullTest = async () => {
    setIsRunning(true)
    setTestResults([])
    setCurrentStep(0)
    
    // Step 1: Clear all data
    setCurrentStep(1)
    clearStorage()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Step 2: Test Foundation
    setCurrentStep(2)
    testFoundationData()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Step 3: Test Product
    setCurrentStep(3)
    testProductData()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Step 4: Test Routing
    setCurrentStep(4)
    testRoutingData()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Step 5: Check navigation state
    setCurrentStep(5)
    checkNavigationState()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Step 6: Test API endpoints
    setCurrentStep(6)
    await testAPIEndpoints()
    
    setCurrentStep(7)
    addResult('Complete', 'success', 'Full navigation test completed!')
    setIsRunning(false)
  }

  return (
    <>
      <Head>
        <title>Navigation Flow Test - Triangle Intelligence</title>
      </Head>
      
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>Triangle Intelligence - Navigation Flow Test</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={runFullTest} 
            disabled={isRunning}
            style={{ 
              padding: '12px 24px', 
              fontSize: '16px', 
              backgroundColor: '#0ea5e9', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              opacity: isRunning ? 0.6 : 1
            }}
          >
            {isRunning ? `Running Step ${currentStep}/7...` : 'Run Full Navigation Test'}
          </button>
          
          <button 
            onClick={() => setTestResults([])}
            style={{ 
              padding: '12px 24px', 
              fontSize: '16px', 
              backgroundColor: '#64748b', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              marginLeft: '10px'
            }}
          >
            Clear Results
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Test Results */}
          <div>
            <h2>Test Results</h2>
            <div style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '16px', 
              backgroundColor: '#f8fafc',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {testResults.length === 0 ? (
                <p style={{ color: '#64748b' }}>No test results yet. Click "Run Full Navigation Test" to begin.</p>
              ) : (
                testResults.map((result, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      padding: '8px 12px', 
                      marginBottom: '8px', 
                      borderRadius: '4px',
                      backgroundColor: result.status === 'success' ? '#d1fae5' : 
                                     result.status === 'error' ? '#fee2e2' : '#fef3c7',
                      borderLeft: `4px solid ${result.status === 'success' ? '#22c55e' : 
                                                result.status === 'error' ? '#ef4444' : '#f59e0b'}`
                    }}
                  >
                    <div style={{ fontSize: '14px', color: '#374151' }}>
                      <strong>{result.step}</strong> ({result.time}): {result.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h2>Test Navigation</h2>
            <div style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '16px', 
              backgroundColor: '#f8fafc'
            }}>
              <p style={{ marginBottom: '16px', color: '#64748b' }}>
                After running the test, these links should show unlocked navigation:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link 
                  href="/foundation" 
                  target="_blank"
                  style={{ 
                    padding: '12px 16px', 
                    backgroundColor: '#0ea5e9', 
                    color: 'white', 
                    textDecoration: 'none',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}
                >
                  1. Foundation Page
                </Link>
                
                <Link 
                  href="/product" 
                  target="_blank"
                  style={{ 
                    padding: '12px 16px', 
                    backgroundColor: '#0ea5e9', 
                    color: 'white', 
                    textDecoration: 'none',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}
                >
                  2. Product Page
                </Link>
                
                <Link 
                  href="/routing" 
                  target="_blank"
                  style={{ 
                    padding: '12px 16px', 
                    backgroundColor: '#0ea5e9', 
                    color: 'white', 
                    textDecoration: 'none',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}
                >
                  3. Routing Page
                </Link>
              </div>
              
              <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#e0f2fe', borderRadius: '6px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#0369a1' }}>Expected Behavior:</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#0f172a' }}>
                  <li>Foundation page should load with working dropdowns</li>
                  <li>After test data is stored, Product page should be accessible</li>
                  <li>Navigation sidebar should show unlocked stages</li>
                  <li>HS code classification should work in Product page</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
          <h3>Manual Test Instructions:</h3>
          <ol>
            <li>Click "Run Full Navigation Test" above</li>
            <li>Wait for all tests to complete</li>
            <li>Open Foundation page in new tab</li>
            <li>Verify form dropdowns load (may take a few seconds)</li>
            <li>Check navigation sidebar shows unlocked stages</li>
            <li>Fill out foundation form and submit</li>
            <li>Verify redirect to Product page</li>
            <li>Test HS code classification in Product page</li>
            <li>Complete product form and proceed to Routing</li>
          </ol>
        </div>
      </div>
    </>
  )
}