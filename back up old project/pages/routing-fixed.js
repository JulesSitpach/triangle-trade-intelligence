/**
 * TRIANGLE ROUTING - FOUNDATION DESIGN STANDARD
 * Uses exact same visual structure as Foundation dashboard
 * Only content differs, all styling identical
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import TriangleSideNav from '../components/TriangleSideNav'
import LanguageSwitcher from '../components/LanguageSwitcher'
import DatabaseIntelligenceBridge from '../lib/database-intelligence-bridge'

export default function TriangleRoutingFixed() {
  const [foundationData, setFoundationData] = useState(null)
  const [productData, setProductData] = useState(null)
  const [routingOptions, setRoutingOptions] = useState([])
  const [selectedRoute, setSelectedRoute] = useState('')
  const [calculationComplete, setCalculationComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [realTimeStats, setRealTimeStats] = useState({
    validatedRoutes: '738',
    avgSavings: '$247K',
    successRate: '94.2%',
    activeAnalyses: '24'
  })
  const [intelligenceScore, setIntelligenceScore] = useState(7.8)

  useEffect(() => {
    // Load previous stage data
    if (typeof window !== 'undefined') {
      const stage1 = localStorage.getItem('triangle-foundation')
      const stage2 = localStorage.getItem('triangle-product')
      
      if (stage1) setFoundationData(JSON.parse(stage1))
      if (stage2) setProductData(JSON.parse(stage2))
    }
  }, [])

  const runRouteAnalysis = async () => {
    setIsLoading(true)
    
    // Simulate route analysis
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const routes = [
      {
        id: 'cn-mx-us',
        route: 'China → Mexico → USA',
        savings: 1847000,
        tariffReduction: '87%',
        timeToMarket: '14-18 days',
        usmcaRate: '0%',
        confidence: 94
      },
      {
        id: 'cn-ca-us',
        route: 'China → Canada → USA',
        savings: 1523000,
        tariffReduction: '78%',
        timeToMarket: '16-21 days',
        usmcaRate: '0%',
        confidence: 89
      },
      {
        id: 'in-mx-us',
        route: 'India → Mexico → USA',
        savings: 982000,
        tariffReduction: '65%',
        timeToMarket: '18-24 days',
        usmcaRate: '0%',
        confidence: 82
      }
    ]
    
    setRoutingOptions(routes)
    setIsLoading(false)
    setCalculationComplete(true)
    setIntelligenceScore(9.2)
  }

  const selectRoute = (routeId) => {
    setSelectedRoute(routeId)
    const routeData = {
      selectedRoute: routeId,
      routingOptions,
      calculationComplete: true
    }
    localStorage.setItem('triangle-routing', JSON.stringify(routeData))
  }

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount/1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount/1000).toFixed(0)}K`
    return `$${amount.toLocaleString()}`
  }

  return (
    <>
      <Head>
        <title>Triangle Routing Intelligence | Triangle Intelligence PRO v2.1</title>
        <meta name="description" content="USMCA triangle routing optimization with 597K+ trade flows" />
      </Head>

      {/* Main Layout - EXACT Foundation Structure */}
      <div className="triangle-layout" style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#0a0f1c'
      }}>
        
        {/* Left Sidebar - Foundation Standard */}
        <TriangleSideNav currentPage="routing" />

        {/* Main Content Area - Foundation Standard */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url("/image/datos-financieros.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}>
          
          {/* Top Nav Bar - EXACT Foundation Copy */}
          <nav style={{
            background: 'rgba(0, 0, 0, 0.9)',
            borderBottom: '1px solid #38bdf8',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '700',
                color: '#38bdf8',
                letterSpacing: '0.1em'
              }}>TRIANGLE INTELLIGENCE PRO v2.1</span>
              <div className="bloomberg-status bloomberg-status-success small">
                <span className="bloomberg-status-dot"></span>
                USER: ADMIN@TRIANGLEINTEL.COM
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div className="bloomberg-status bloomberg-status-info small">
                <span className="bloomberg-status-dot"></span>
                ACTIVE SESSION
              </div>
              <div className="bloomberg-status bloomberg-status-warning small">
                🔔 3 ALERTS
              </div>
              <LanguageSwitcher />
              <button className="bloomberg-btn bloomberg-btn-ghost" style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem'
              }}>LOGOUT</button>
            </div>
          </nav>

          {/* Top Metrics Bar - EXACT Foundation Copy */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            borderBottom: '1px solid #243045',
            padding: '1rem 1.5rem'
          }}>
            <div className="bloomberg-grid bloomberg-grid-4">
              <div className="metric-card">
                <div style={{fontSize: '0.625rem', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem'}}>
                  VALIDATED ROUTES
                </div>
                <div style={{fontSize: '1.75rem', fontWeight: '700', color: '#ffffff'}}>
                  {realTimeStats.validatedRoutes}
                </div>
                <div style={{fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase'}}>
                  OPTIMIZATION PATHWAYS
                </div>
              </div>
              
              <div className="metric-card">
                <div style={{fontSize: '0.625rem', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem'}}>
                  AVG SAVINGS
                </div>
                <div style={{fontSize: '1.75rem', fontWeight: '700', color: '#ffffff'}}>
                  {realTimeStats.avgSavings}
                </div>
                <div style={{fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase'}}>
                  PER ROUTE ANNUALLY
                </div>
              </div>
              
              <div className="metric-card">
                <div style={{fontSize: '0.625rem', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem'}}>
                  SUCCESS RATE
                </div>
                <div style={{fontSize: '1.75rem', fontWeight: '700', color: '#ffffff'}}>
                  {realTimeStats.successRate}
                </div>
                <div style={{fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase'}}>
                  IMPLEMENTATION SUCCESS
                </div>
              </div>
              
              <div className="metric-card">
                <div style={{fontSize: '0.625rem', color: '#eab308', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem'}}>
                  ACTIVE ANALYSES
                </div>
                <div style={{fontSize: '1.75rem', fontWeight: '700', color: '#ffffff'}}>
                  {realTimeStats.activeAnalyses}
                </div>
                <div style={{fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase'}}>
                  LIVE OPTIMIZATIONS
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Foundation Workspace Layout */}
          <div style={{padding: '2rem'}}>
            <div className="foundation-workspace" style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '2rem',
              maxWidth: '1400px',
              margin: '0 auto'
            }}>
              
              {/* Left Column - Analysis Section */}
              <div className="foundation-form-section">
                <h1 className="bloomberg-hero-title" style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#ffffff',
                  marginBottom: '0.5rem'
                }}>
                  Triangle Routing Intelligence
                </h1>
                <p className="bloomberg-hero-subtitle" style={{
                  fontSize: '1rem',
                  color: '#94a3b8',
                  marginBottom: '2rem'
                }}>
                  USMCA triangle routing optimization • 597K+ trade flows • Real-time savings analysis
                </p>

                {/* Business Context Card */}
                {foundationData && (
                  <div className="bloomberg-card" style={{
                    background: 'linear-gradient(145deg, rgba(26, 35, 50, 0.95), rgba(16, 23, 42, 0.95))',
                    border: '1px solid #38bdf8',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div className="bloomberg-card-header" style={{
                      borderBottom: '1px solid #243045',
                      paddingBottom: '1rem',
                      marginBottom: '1.5rem'
                    }}>
                      <h3 style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#ffffff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        🏢 {foundationData.companyName} Business Context
                      </h3>
                      <div className="bloomberg-status bloomberg-status-success">94% CONFIDENCE</div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '1rem'
                    }}>
                      <div style={{
                        padding: '1rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '0.5rem',
                        border: '1px solid #243045'
                      }}>
                        <div style={{fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem'}}>
                          BUSINESS TYPE
                        </div>
                        <div style={{fontSize: '0.875rem', color: '#ffffff', fontWeight: '600'}}>
                          {foundationData.businessType}
                        </div>
                      </div>
                      
                      <div style={{
                        padding: '1rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '0.5rem',
                        border: '1px solid #243045'
                      }}>
                        <div style={{fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem'}}>
                          IMPORT VOLUME
                        </div>
                        <div style={{fontSize: '0.875rem', color: '#ffffff', fontWeight: '600'}}>
                          {foundationData.importVolume}
                        </div>
                      </div>
                      
                      <div style={{
                        padding: '1rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '0.5rem',
                        border: '1px solid #243045'
                      }}>
                        <div style={{fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem'}}>
                          PRIMARY SUPPLIER
                        </div>
                        <div style={{fontSize: '0.875rem', color: '#ffffff', fontWeight: '600'}}>
                          {foundationData.primarySupplierCountry}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Route Analysis Card */}
                <div className="bloomberg-card" style={{
                  background: 'linear-gradient(145deg, rgba(26, 35, 50, 0.95), rgba(16, 23, 42, 0.95))',
                  border: '1px solid #38bdf8',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div className="bloomberg-card-header" style={{
                    borderBottom: '1px solid #243045',
                    paddingBottom: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#ffffff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      🛣️ Triangle Route Analysis
                    </h3>
                  </div>

                  {!calculationComplete ? (
                    <div style={{textAlign: 'center', padding: '2rem'}}>
                      <button
                        onClick={runRouteAnalysis}
                        disabled={isLoading}
                        className="bloomberg-btn bloomberg-btn-primary"
                        style={{
                          background: isLoading ? '#334155' : 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
                          cursor: isLoading ? 'wait' : 'pointer',
                          padding: '1rem 2rem',
                          fontSize: '1rem'
                        }}
                      >
                        {isLoading ? '🔄 Analyzing 597K Trade Flows...' : '🚀 Run Triangle Route Analysis'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        color: '#ffffff',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                      }}>
                        Optimal Triangle Routes Identified
                      </h4>
                      
                      {routingOptions.map((route, index) => (
                        <div
                          key={route.id}
                          onClick={() => selectRoute(route.id)}
                          style={{
                            padding: '1.5rem',
                            background: selectedRoute === route.id ? 
                              'linear-gradient(145deg, rgba(14, 165, 233, 0.2), rgba(14, 165, 233, 0.1))' : 
                              'rgba(0, 0, 0, 0.3)',
                            border: selectedRoute === route.id ? '2px solid #0ea5e9' : '1px solid #243045',
                            borderRadius: '0.5rem',
                            marginBottom: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem'
                          }}>
                            <div style={{
                              fontSize: '1rem',
                              fontWeight: '600',
                              color: '#ffffff'
                            }}>
                              {route.route}
                            </div>
                            <div style={{
                              background: index === 0 ? '#22c55e' : index === 1 ? '#eab308' : '#64748b',
                              color: 'white',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              {index === 0 ? 'RECOMMENDED' : index === 1 ? 'ALTERNATIVE' : 'OPTION'}
                            </div>
                          </div>
                          
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '1rem',
                            fontSize: '0.875rem'
                          }}>
                            <div>
                              <div style={{color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase'}}>
                                Annual Savings
                              </div>
                              <div style={{color: '#22c55e', fontWeight: '600', fontSize: '1rem'}}>
                                {formatCurrency(route.savings)}
                              </div>
                            </div>
                            
                            <div>
                              <div style={{color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase'}}>
                                Tariff Reduction
                              </div>
                              <div style={{color: '#0ea5e9', fontWeight: '600'}}>
                                {route.tariffReduction}
                              </div>
                            </div>
                            
                            <div>
                              <div style={{color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase'}}>
                                Transit Time
                              </div>
                              <div style={{color: '#ffffff', fontWeight: '600'}}>
                                {route.timeToMarket}
                              </div>
                            </div>
                            
                            <div>
                              <div style={{color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase'}}>
                                USMCA Rate
                              </div>
                              <div style={{color: '#22c55e', fontWeight: '600'}}>
                                {route.usmcaRate}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                  marginTop: '2rem'
                }}>
                  <Link href="/product" className="bloomberg-btn bloomberg-btn-secondary">
                    ← Back to Products
                  </Link>
                  {selectedRoute && (
                    <Link href="/partnership" className="bloomberg-btn bloomberg-btn-primary">
                      Continue to Partnership →
                    </Link>
                  )}
                </div>
              </div>

              {/* Right Column - Intelligence Panel */}
              <div className="foundation-intelligence-panel" style={{
                background: 'linear-gradient(145deg, rgba(26, 35, 50, 0.95), rgba(16, 23, 42, 0.95))',
                border: '1px solid #38bdf8',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                height: 'fit-content',
                position: 'sticky',
                top: '1rem'
              }}>
                {/* Spacing to align with form */}
                <div style={{height: '120px'}}></div>
                
                <div className="widget-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #243045'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    🧠 Live Route Intelligence
                  </div>
                  <div className="bloomberg-status bloomberg-status-info small">
                    REAL-TIME
                  </div>
                </div>
                
                {/* Intelligence Score */}
                <div style={{textAlign: 'center', marginBottom: '2rem'}}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    color: '#0ea5e9',
                    lineHeight: '1'
                  }}>
                    {intelligenceScore.toFixed(1)}/10.0
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginTop: '0.5rem'
                  }}>
                    Route Intelligence Score
                  </div>
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(14, 165, 233, 0.1)',
                    border: '1px solid rgba(14, 165, 233, 0.3)',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#0ea5e9'
                  }}>
                    {Math.floor(intelligenceScore * 10)}% Optimized
                  </div>
                </div>

                {/* Market Intelligence */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '0.5rem',
                    border: '1px solid #243045'
                  }}>
                    <div style={{fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem'}}>
                      TARIFF VOLATILITY
                    </div>
                    <div style={{fontSize: '0.875rem', color: '#ef4444', fontWeight: '600'}}>
                      HIGH (CN: 30%, IN: 50%)
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '0.5rem',
                    border: '1px solid #243045'
                  }}>
                    <div style={{fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem'}}>
                      USMCA STATUS
                    </div>
                    <div style={{fontSize: '0.875rem', color: '#22c55e', fontWeight: '600'}}>
                      STABLE (0% LOCKED)
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '0.5rem',
                    border: '1px solid #243045'
                  }}>
                    <div style={{fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem'}}>
                      IMPLEMENTATION TIME
                    </div>
                    <div style={{fontSize: '0.875rem', color: '#0ea5e9', fontWeight: '600'}}>
                      8-12 WEEKS TYPICAL
                    </div>
                  </div>
                  
                  {selectedRoute && (
                    <div style={{
                      padding: '1rem',
                      background: 'linear-gradient(145deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
                      borderRadius: '0.5rem',
                      border: '1px solid #22c55e',
                      marginTop: '1rem'
                    }}>
                      <div style={{fontSize: '0.625rem', color: '#22c55e', textTransform: 'uppercase', marginBottom: '0.5rem'}}>
                        ROUTE SELECTED
                      </div>
                      <div style={{fontSize: '0.875rem', color: '#ffffff', fontWeight: '600'}}>
                        {routingOptions.find(r => r.id === selectedRoute)?.route}
                      </div>
                      <div style={{fontSize: '0.75rem', color: '#22c55e', marginTop: '0.25rem'}}>
                        Ready for Partnership Phase
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .metric-card {
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid #38bdf8;
          border-radius: 0.5rem;
          padding: 1rem;
          text-align: center;
          position: relative;
        }
        
        .metric-card::after {
          content: '';
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  )
}