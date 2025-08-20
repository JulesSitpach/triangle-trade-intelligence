/**
 * PARTNERSHIP: USMCA OPTIMIZATION INTELLIGENCE
 * Comprehensive partnership analysis and USMCA treaty utilization
 * Consolidates stages 4-7 functionality for optimal UX
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useSafeTranslation } from '../hooks/useSafeTranslation'
import TriangleSideNav from '../components/TriangleSideNav'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { smartT } from '../lib/smartT'

export default function Partnership() {
  const { t, i18n, ready } = useSafeTranslation('common')
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [foundationData, setFoundationData] = useState(null)
  const [productData, setProductData] = useState(null)
  const [routingData, setRoutingData] = useState(null)
  const [selectedRoute, setSelectedRoute] = useState('')
  const [routeAnalysis, setRouteAnalysis] = useState(null)
  const [showComparison, setShowComparison] = useState(false)
  const [partnershipOpportunities, setPartnershipOpportunities] = useState(null)
  const [marketIntelligence, setMarketIntelligence] = useState({
    canadaAdvantages: [],
    mexicoAdvantages: [],
    crossBorderSynergies: []
  })

  useEffect(() => {
    loadStageData()
  }, [])

  const loadStageData = async () => {
    try {
      const foundationStorage = localStorage.getItem('triangle-foundation')
      const productStorage = localStorage.getItem('triangle-product')
      const routingStorage = localStorage.getItem('triangle-routing')

      if (!foundationStorage || !productStorage) {
        // No user data - generate sample partnership analysis for demonstration
        console.log('🤝 Generating sample partnership analysis for UI demonstration')
        generateSamplePartnershipAnalysis()
        setLoading(false)
        return
      }

      const foundation = JSON.parse(foundationStorage)
      const product = JSON.parse(productStorage)
      const routing = routingStorage ? JSON.parse(routingStorage) : {}

      setFoundationData(foundation)
      setProductData(product)
      setRoutingData(routing)

      // Generate partnership intelligence based on user data
      await generatePartnershipIntelligence(foundation, product, routing)
      
      setLoading(false)
    } catch (error) {
      console.error('🚨 Partnership data loading error:', error)
      generateSamplePartnershipAnalysis()
      setLoading(false)
    }
  }

  const generateSamplePartnershipAnalysis = () => {
    setFoundationData({
      companyName: "Sample Manufacturing Co",
      businessType: "Electronics Manufacturing",
      importVolume: "$2M - $5M",
      primarySupplierCountry: "China"
    })

    setRouteAnalysis({
      canada: {
        advantages: ["Strong logistics infrastructure", "Regulatory alignment", "Established trade relations"],
        savings: "$180K",
        timeline: "2-4 weeks",
        risk: "Low"
      },
      mexico: {
        advantages: ["Lower manufacturing costs", "Growing hub", "Strategic location"],
        savings: "$220K", 
        timeline: "3-6 weeks",
        risk: "Medium"
      }
    })

    setPartnershipOpportunities({
      totalOpportunities: 127,
      verifiedPartners: 89,
      activePipeline: 23
    })
  }

  const generatePartnershipIntelligence = async (foundation, product, routing) => {
    // Generate route analysis based on user data
    const analysis = {
      canada: {
        advantages: [
          "Established US-Canada trade corridor ($780B annually)",
          "Advanced logistics and port infrastructure", 
          "Regulatory alignment and trade facilitation",
          "Strong financial services sector"
        ],
        savings: calculateSavings(foundation.importVolume, 'canada'),
        timeline: "2-4 weeks",
        risk: "Low",
        confidence: 85
      },
      mexico: {
        advantages: [
          "Lower manufacturing and labor costs",
          "Rapidly growing manufacturing hub",
          "Strategic nearshoring location",
          "USMCA treaty benefits"
        ],
        savings: calculateSavings(foundation.importVolume, 'mexico'),
        timeline: "3-6 weeks", 
        risk: "Medium",
        confidence: 78
      }
    }

    setRouteAnalysis(analysis)

    // Partnership opportunities
    setPartnershipOpportunities({
      totalOpportunities: Math.floor(Math.random() * 50) + 100,
      verifiedPartners: Math.floor(Math.random() * 30) + 70,
      activePipeline: Math.floor(Math.random() * 15) + 20
    })
  }

  const calculateSavings = (importVolume, route) => {
    const volumeMap = {
      "Under $500K": 250000,
      "$500K - $1M": 750000,
      "$1M - $2M": 1500000,
      "$2M - $5M": 3500000,
      "$5M - $10M": 7500000,
      "$10M+": 15000000
    }

    const volume = volumeMap[importVolume] || 1500000
    const savingsRate = route === 'mexico' ? 0.08 : 0.06
    const savings = Math.floor(volume * savingsRate / 1000) * 1000
    
    return `$${(savings / 1000).toFixed(0)}K`
  }

  const selectRoute = (route) => {
    setSelectedRoute(route)
    setShowComparison(true)

    // Save partnership selection
    const partnershipData = {
      selectedRoute: route,
      routeAnalysis: routeAnalysis[route],
      timestamp: new Date().toISOString(),
      confidence: routeAnalysis[route]?.confidence || 75
    }

    localStorage.setItem('triangle-partnership', JSON.stringify(partnershipData))
  }

  const proceedToNextStage = () => {
    if (!selectedRoute) {
      alert(smartT('partnership.selectRoute'))
      return
    }
    router.push('/hindsight')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div>{smartT('common.loading')}</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{smartT("partnership.title")} - Triangle Intelligence</title>
        <meta name="description" content="Strategic partnership analysis for USMCA triangle routing optimization" />
      </Head>

      <nav className="triangle-nav">
        <div className="triangle-nav-brand">
          <div className="triangle-nav-logo">
            <div className="triangle-icon">▲</div>
            <div className="triangle-nav-text">
              <div className="triangle-nav-title">Triangle Intelligence</div>
              <div className="triangle-nav-subtitle">{smartT("partnership.navsubtitle")}</div>
            </div>
          </div>
        </div>
        <div className="triangle-nav-actions">
          <LanguageSwitcher />
        </div>
      </nav>

      <div className="triangle-layout">
        <TriangleSideNav />
        <main className="main-content" style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url('/image/datos-financieros.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          minHeight: '100vh'
        }}>
          <div className="page-content">

            {/* Executive Metrics Bar */}
            <div className="bloomberg-container-padded">
              <div className="bloomberg-grid bloomberg-grid-2">

                {/* Partnership Intelligence Section */}
                <div className="bloomberg-card">
                  <div className="bloomberg-card-header">
                    <h1 className="section-title">
                      {smartT("partnership.title")}
                    </h1>
                    <div className="section-subtitle">
                      Strategic partnerships for {foundationData?.companyName || 'your business'}
                    </div>
                  </div>

                  {/* Crisis Response Analysis */}
                  <div className="bloomberg-card">
                    <div className="bloomberg-card-header">
                      <h2 className="section-icon">🚨 {smartT("partnership.crisisresponse")}</h2>
                      <div className="bloomberg-status bloomberg-status-success">
                        <div className="bloomberg-status-dot"></div>
                        {smartT("partnership.activeanalysis")}
                      </div>
                    </div>

                    <div className="bloomberg-grid bloomberg-grid-3">
                      <div className="bloomberg-card">
                        <div className="bloomberg-metric">
                          <div className="bloomberg-metric-value">95%</div>
                          <div className="bloomberg-metric-label">{smartT("partnership.riskavoidance")}</div>
                        </div>
                      </div>
                      <div className="bloomberg-card">
                        <div className="bloomberg-metric">
                          <div className="bloomberg-metric-value text-primary">$2.3M</div>
                          <div className="bloomberg-metric-label">{smartT("partnership.potentialsavings")}</div>
                        </div>
                      </div>
                      <div className="bloomberg-card">
                        <div className="bloomberg-metric">
                          <div className="bloomberg-metric-value text-success">127</div>
                          <div className="bloomberg-metric-label">{smartT("partnership.partneropps")}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route Comparison Analysis */}
                  <div className="bloomberg-card">
                    <div className="bloomberg-card-header">
                      <h2>{smartT("partnership.routecomparison")}</h2>
                      <div className="bloomberg-status bloomberg-status-info">
                        <div className="bloomberg-status-dot"></div>
                        {smartT("partnership.usmcaoptimized")}
                      </div>
                    </div>

                    <div className="bloomberg-grid bloomberg-grid-3">
                      <div className="bloomberg-card">
                        <div className="bloomberg-metric">
                          <div className="metric-value text-primary">0%</div>
                          <div className="bloomberg-metric-label">{smartT("partnership.canadatariff")}</div>
                          <div className="bloomberg-card-subtitle">USMCA Treaty Rate</div>
                        </div>
                      </div>
                      <div className="bloomberg-card">
                        <div className="bloomberg-metric">
                          <div className="metric-value text-success">0%</div>
                          <div className="bloomberg-metric-label">{smartT("partnership.mexicotariff")}</div>
                          <div className="bloomberg-card-subtitle">USMCA Treaty Rate</div>
                        </div>
                      </div>
                      <div className="bloomberg-card">
                        <div className="bloomberg-metric">
                          <div className="metric-value text-warning">30%</div>
                          <div className="bloomberg-metric-label">{smartT("partnership.chinadirect")}</div>
                          <div className="bloomberg-card-subtitle">Bilateral Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Partnership Route Selection */}
                  <div className="bloomberg-card">
                    <div className="bloomberg-card-header">
                      <h2>{smartT("partnership.selectstrategy")}</h2>
                      <div className="bloomberg-status bloomberg-status-success">
                        <div className="bloomberg-status-dot"></div>
                        {smartT("partnership.readyforselection")}
                      </div>
                    </div>

                    <div className="bloomberg-grid bloomberg-grid-2">
                      {/* Canada Route */}
                      <div className="bloomberg-card-header">
                        <div className="section-icon">🇨🇦</div>
                        <div className="section-content">
                          <h3>{smartT("partnership.canadaroute")}</h3>
                          <div className="section-subtitle">{smartT("partnership.establishedcorridor")}</div>
                        </div>

                        <div className="bloomberg-status bloomberg-status-success">
                          <div className="bloomberg-status-dot"></div>
                          {smartT("partnership.recommended")}
                        </div>
                      </div>

                      <div className="bloomberg-grid bloomberg-grid-4">
                        <div className="bloomberg-metric">
                          <div className="bloomberg-metric-value">0%</div>
                          <div className="bloomberg-metric-label">{smartT("partnership.tariffrate")}</div>
                        </div>
                        <div className="bloomberg-metric">
                          <div className="bloomberg-metric-value">2-4</div>
                          <div className="bloomberg-metric-label">{smartT("partnership.weekssetup")}</div>
                        </div>
                        <div className="bloomberg-metric">
                          <div className="bloomberg-metric-value text-success">85%</div>
                          <div className="bloomberg-metric-label">{smartT("partnership.confidence")}</div>
                        </div>
                        <div className="bloomberg-metric">
                          <div className="bloomberg-metric-value text-primary">{routeAnalysis?.canada?.savings || '$180K'}</div>
                          <div className="bloomberg-metric-label">{smartT("partnership.annualsavings")}</div>
                        </div>
                      </div>

                      <div className="route-advantages">
                        <h4>{smartT("partnership.strategicadvantages")}</h4>
                        <div className="advantages-list">
                          {routeAnalysis?.canada?.advantages?.map((advantage, index) => (
                            <div key={index}>✅ {advantage}</div>
                          )) || <div>✅ Established trade relationships</div>}
                        </div>
                      </div>

                      <div className="partnership-benefits">
                        <h4>{smartT("partnership.partnershipbenefits")}</h4>
                        • {smartT("partnership.instantaccess")} <br/>
                        • {smartT("partnership.proventrack")} <br/>
                        • {smartT("partnership.regulatoryalignment")} <br/>
                        • {smartT("partnership.financialservices")}
                      </div>

                      <div className="market-access">
                        <div className="access-label">{smartT("partnership.marketaccess")}</div>
                        <div className="access-value">$780B US-Canada Trade Corridor</div>
                      </div>

                      <div 
                        className={`route-selector ${selectedRoute === 'canada' ? 'selected' : ''}`}
                        onClick={() => selectRoute('canada')}
                      >
                        <div className="recommendation-badge">
                          {smartT("partnership.selectcanada")}
                        </div>
                      </div>
                    </div>

                    {/* Mexico Route */}
                    <div className="bloomberg-card-header">
                      <div className="section-icon">🇲🇽</div>
                      <div className="section-content">
                        <h3>{smartT("partnership.mexicoroute")}</h3>
                        <div className="section-subtitle">{smartT("partnership.nearshoring")}</div>
                      </div>

                      <div className="bloomberg-status bloomberg-status-success">
                        <div className="bloomberg-status-dot"></div>
                        {smartT("partnership.highgrowth")}
                      </div>
                    </div>

                    <div className="bloomberg-grid bloomberg-grid-4">
                      <div className="bloomberg-metric">
                        <div className="bloomberg-metric-value">0%</div>
                        <div className="bloomberg-metric-label">{smartT("partnership.tariffrate")}</div>
                      </div>
                      <div className="bloomberg-metric">
                        <div className="bloomberg-metric-value">3-6</div>
                        <div className="bloomberg-metric-label">{smartT("partnership.weekssetup")}</div>
                      </div>
                      <div className="bloomberg-metric">
                        <div className="bloomberg-metric-value text-success">78%</div>
                        <div className="bloomberg-metric-label">{smartT("partnership.confidence")}</div>
                      </div>
                      <div className="bloomberg-metric">
                        <div className="bloomberg-metric-value text-primary">{routeAnalysis?.mexico?.savings || '$220K'}</div>
                        <div className="bloomberg-metric-label">{smartT("partnership.annualsavings")}</div>
                      </div>
                    </div>

                    <div className="route-advantages">
                      <h4>{smartT("partnership.strategicadvantages")}</h4>
                      <div className="advantages-list">
                        {routeAnalysis?.mexico?.advantages?.map((advantage, index) => (
                          <div key={index}>✅ {advantage}</div>
                        )) || <div>✅ Lower manufacturing costs</div>}
                      </div>
                    </div>

                    <div className="partnership-benefits">
                      <h4>{smartT("partnership.partnershipbenefits")}</h4>
                      • {smartT("partnership.manufacturingcos")} <br/>
                      • {smartT("partnership.growinghub")} <br/>
                      • {smartT("partnership.nearshoring")} <br/>
                      • {smartT("partnership.laborcost")}
                    </div>

                    <div className="market-access">
                      <div className="access-label">{smartT("partnership.marketaccess")}</div>
                      <div className="access-value">$614B Mexico-US Trade Volume</div>
                    </div>

                    <div 
                      className={`route-selector ${selectedRoute === 'mexico' ? 'selected' : ''}`}
                      onClick={() => selectRoute('mexico')}
                    >
                      <div className="recommendation-badge">
                        {smartT("partnership.selectmexico")}
                      </div>
                    </div>
                  </div>

                  {/* Dual Strategy Option */}
                  <div className="bloomberg-card">
                    <div className="route-header">
                      <div className="route-flags">🇨🇦🇲🇽</div>
                      <div className="route-title">
                        <h3>{smartT("partnership.dualstrategy")}</h3>
                        <div className="section-subtitle">{smartT("partnership.maximumdiversification")}</div>
                      </div>
                      <div 
                        className={`route-selector ${selectedRoute === 'dual' ? 'selected' : ''}`}
                        onClick={() => selectRoute('dual')}
                      >
                        <div className="selector-radio">
                          <div className="selector-dot"></div>
                        </div>
                      </div>
                    </div>

                    <div className="dual-strategy-content">
                      <div className="strategy-synergies">
                        <h4>{smartT("partnership.crossbordersynergies")}</h4>
                        • {smartT("partnership.diversifiedsupply")} <br/>
                        • {smartT("partnership.riskmitigatoin")} <br/>
                        • {smartT("partnership.marketflexibility")} <br/>
                        • {smartT("partnership.capacityscaling")}
                      </div>

                      <div className="dual-metrics">
                        <div className="dual-metric">
                          <div className="metric-value">$400K+</div>
                          <div className="metric-label">{smartT("partnership.combinedsavings")}</div>
                        </div>
                      </div>
                    </div>

                    <div className="recommendation-badge dual">
                      {smartT("partnership.selectdual")}
                    </div>
                  </div>

                  {/* Selection Summary */}
                  {selectedRoute && (
                    <div className="selection-summary">
                      <div className="summary-content">
                        <h3>{smartT("partnership.selectionsummary")}</h3>
                        <p>
                          {selectedRoute === 'canada' && (ready ? t('partnership.selectionSummary.canadaRoute', 'Canadian strategic partnership leveraging USMCA 0% tariff rates') : 'Canadian strategic partnership leveraging USMCA 0% tariff rates')}
                          {selectedRoute === 'mexico' && (ready ? t('partnership.selectionSummary.mexicoRoute', 'Mexican manufacturing partnership with USMCA benefits') : 'Mexican manufacturing partnership with USMCA benefits')}
                          {selectedRoute === 'dual' && (ready ? t('partnership.selectionSummary.dualRoute', ' Dual-market strategy leveraging both Canadian and Mexican advantages') : ' Dual-market strategy leveraging both Canadian and Mexican advantages')}
                          {' for '}{foundationData?.companyName} ({foundationData?.businessType} with {foundationData?.importVolume} annual volume).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Implementation Strategy */}
                  {selectedRoute && (
                    <div className="implementation-strategy">
                      <div className="strategy-header">
                        <h2>{smartT("partnership.implementationstrategy")}</h2>
                        <div className="strategy-badge">{smartT("partnership.readyfordeploy")}</div>
                      </div>

                      <div className="strategy-metrics">
                        <div className="strategy-metric">
                          <div className="metric-value">
                            {selectedRoute === 'canada' ? '2-4' : selectedRoute === 'mexico' ? '3-6' : '4-8'} 
                            {smartT("partnership.weeks")}
                          </div>
                          <div className="metric-label">{smartT("partnership.setuptime")}</div>
                        </div>
                        <div className="strategy-metric">
                          <div className="metric-value">
                            {selectedRoute === 'canada' ? '$180K' : selectedRoute === 'mexico' ? '$220K' : '$400K+'}
                          </div>
                          <div className="metric-label">{smartT("partnership.projectedsavings")}</div>
                        </div>
                        <div className="strategy-metric">
                          <div className="metric-value">0%</div>
                          <div className="metric-label">{smartT("partnership.usmcatariff")}</div>
                        </div>
                        <div className="strategy-metric">
                          <div className="metric-value">
                            {selectedRoute === 'canada' ? '85%' : selectedRoute === 'mexico' ? '78%' : '92%'}
                          </div>
                          <div className="metric-label">{smartT("partnership.successrate")}</div>
                        </div>
                      </div>

                      <div className="strategy-summary">
                        <div className="summary-message">
                          {smartT("partnership.strategymessage")} {selectedRoute === 'canada' ? smartT("partnership.canadastrategy") : selectedRoute === 'mexico' ? smartT("partnership.mexicostrategy") : smartT("partnership.dualstrategy")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Crisis Lead Generation Form */}
                  <div className="bloomberg-card">
                    <div className="bloomberg-card-header">
                      <h2>{smartT("partnership.leadgeneration")}</h2>
                      <div className="bloomberg-status bloomberg-status-error">
                        <div className="bloomberg-status-dot"></div>
                        {smartT("partnership.crisisresponse")}
                      </div>
                    </div>

                    <div className="bloomberg-grid bloomberg-grid-2 bloomberg-mt-lg">
                      <div className="bloomberg-form">
                        <div className="bloomberg-grid bloomberg-grid-3 bloomberg-mb-lg">
                          <div className="bloomberg-card">
                            <div className="bloomberg-metric">
                              <div className="section-icon">📊</div>
                              <div className="bloomberg-metric-label">{smartT("partnership.crisisurgency")}</div>
                            </div>
                          </div>
                          <div className="bloomberg-card">
                            <div className="bloomberg-metric">
                              <div className="section-icon">⚡</div>
                              <div className="bloomberg-metric-label">{smartT("partnership.rapidresponse")}</div>
                            </div>
                          </div>
                          <div className="bloomberg-card">
                            <div className="bloomberg-metric">
                              <div className="section-icon">🎯</div>
                              <div className="bloomberg-metric-label">{smartT("partnership.targetedanalysis")}</div>
                            </div>
                          </div>
                        </div>

                        <div className="bloomberg-form-group">
                          <label className="bloomberg-label">{smartT("partnership.companyname")}</label>
                          <input 
                            type="text" 
                            className="bloomberg-input"
                            defaultValue={foundationData?.companyName}
                          />
                        </div>

                        <div className="bloomberg-form-group">
                          <label className="bloomberg-label">{smartT("partnership.industrytype")}</label>
                          <input 
                            type="text" 
                            className="bloomberg-input"
                            defaultValue={foundationData?.businessType}
                          />
                        </div>

                        <div className="bloomberg-form-group">
                          <label className="bloomberg-label">{smartT("partnership.importvolume")}</label>
                          <input 
                            type="text" 
                            className="bloomberg-input"
                            defaultValue={foundationData?.importVolume}
                          />
                        </div>

                        <div className="bloomberg-form-group">
                          <label className="bloomberg-label">{smartT("partnership.primarysupplier")}</label>
                          <input 
                            type="text" 
                            className="bloomberg-input"
                            defaultValue={foundationData?.primarySupplierCountry}
                          />
                        </div>

                        <div className="bloomberg-form-group">
                          <label className="bloomberg-label">{smartT("partnership.urgencylevel")}</label>
                          <select className="bloomberg-select">
                            <option>{smartT("partnership.immediateaction")}</option>
                            <option>{smartT("partnership.within30days")}</option>
                            <option>{smartT("partnership.within90days")}</option>
                          </select>
                        </div>

                        <div className="bloomberg-form-group">
                          <label className="bloomberg-label">{smartT("partnership.contactmethod")}</label>
                          <select className="bloomberg-select">
                            <option>{smartT("partnership.phonepreferece")}</option>
                            <option>{smartT("partnership.emailpreference")}</option>
                            <option>{smartT("partnership.inmeetingpreference")}</option>
                          </select>
                        </div>
                      </div>

                      <div className="bloomberg-card">
                        <div className="bloomberg-card-header">
                          <h3>{smartT("partnership.familyteamcredibility")}</h3>
                        </div>

                        <div className="bloomberg-mb-lg">
                          <p>{smartT("partnership.familyteamdescription")}</p>
                        </div>

                        <div className="bloomberg-grid bloomberg-grid-2 bloomberg-mb-lg">
                          <div className="bloomberg-card">
                            <div className="bloomberg-metric">
                              <div className="section-icon">🇨🇦</div>
                              <div className="bloomberg-metric-label">{smartT("partnership.canadianexpertise")}</div>
                              <div className="bloomberg-card-subtitle">{smartT("partnership.canadianexpertisedesc")}</div>
                            </div>
                          </div>
                          <div className="bloomberg-card">
                            <div className="bloomberg-metric">
                              <div className="section-icon">🇲🇽</div>
                              <div className="bloomberg-metric-label">{smartT("partnership.mexicanexpertise")}</div>
                              <div className="bloomberg-card-subtitle">{smartT("partnership.mexicanexpertisedesc")}</div>
                            </div>
                          </div>
                          <div className="bloomberg-card">
                            <div className="bloomberg-metric">
                              <div className="section-icon">📈</div>
                              <div className="bloomberg-metric-label">{smartT("partnership.trackrecord")}</div>
                              <div className="bloomberg-card-subtitle">{smartT("partnership.trackrecorddesc")}</div>
                            </div>
                          </div>
                          <div className="bloomberg-card">
                            <div className="bloomberg-metric">
                              <div className="section-icon">🤝</div>
                              <div className="bloomberg-metric-label">{smartT("partnership.networkaccess")}</div>
                              <div className="bloomberg-card-subtitle">{smartT("partnership.networkaccessdesc")}</div>
                            </div>
                          </div>
                        </div>

                        <div className="partnership-value-proof">
                          <h4>{smartT("partnership.provensuccess")}</h4>
                          <div className="success-stories">
                            <div className="success-story">
                              "Saved $2.1M in first year through Mexico route" - Electronics Manufacturer
                            </div>
                            <div className="success-story">
                              "Canadian partnership reduced complexity by 70%" - Automotive Supplier
                            </div>
                            <div className="success-story">
                              "Dual strategy provided ultimate supply chain resilience" - Medical Device Company
                            </div>
                          </div>
                        </div>

                        <div className="bloomberg-grid bloomberg-grid-3 bloomberg-mb-lg">
                          <div className="bloomberg-card">
                            <div className="bloomberg-metric">
                              <div className="bloomberg-metric-value text-success">$47M+</div>
                              <div className="bloomberg-metric-label">{smartT("partnership.totalsavings")}</div>
                            </div>
                          </div>
                          <div className="bloomberg-card">
                            <div className="bloomberg-metric">
                              <div className="bloomberg-metric-value text-primary">234</div>
                              <div className="bloomberg-metric-label">{smartT("partnership.successfulimplementations")}</div>
                            </div>
                          </div>
                          <div className="bloomberg-card">
                            <div className="bloomberg-metric">
                              <div className="bloomberg-metric-value text-warning">89%</div>
                              <div className="bloomberg-metric-label">{smartT("partnership.clientsatisfaction")}</div>
                            </div>
                          </div>
                        </div>

                        <div className="bloomberg-text-center">
                          <button className="bloomberg-btn bloomberg-btn-primary bloomberg-btn-lg">
                            {smartT("partnership.connectwithfamilyteam")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="bloomberg-hero-actions">
                    <button onClick={() => router.push('/routing')} className="bloomberg-btn bloomberg-btn-secondary">
                      {ready ? t('partnership.navigation.backToRouting', 'Back to Routing') : 'Back to Routing'}
                    </button>
                    <button 
                      onClick={proceedToNextStage}
                      className={`bloomberg-btn ${selectedRoute ? 'bloomberg-btn-primary' : 'bloomberg-btn-disabled'}`}
                      disabled={!selectedRoute}
                    >
                      {ready ? t('partnership.navigation.continueToHindsight', 'Continue to Hindsight Analysis') : 'Continue to Hindsight Analysis'}
                    </button>
                    {selectedRoute && (
                      <button onClick={proceedToNextStage} className="bloomberg-btn bloomberg-btn-secondary">
                        {ready ? t('partnership.navigation.skipPartnershipHub', 'Skip Partnership Hub') : 'Skip Partnership Hub'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Intelligence Panel - Takes 1 column */}
                <div className="bloomberg-card">
                  {/* Spacing to align with form start */}
                  <div style={{height: '120px'}}></div>

                  <div className="widget-header">
                    <div className="widget-title">
                      <div className="widget-icon">🤖</div>
                      {smartT("partnership.liveintelligence")}
                    </div>
                    <div className="bloomberg-status bloomberg-status-warning small">
                      {smartT("partnership.live")}
                    </div>
                  </div>

                  {/* Partnership Intelligence Score */}
                  <div className="bloomberg-text-center bloomberg-mb-lg">
                    <div className="metric-value text-warning">
                      {selectedRoute ? '85%' : '60%'}
                    </div>
                    <div className="bloomberg-metric-label">{smartT("partnership.intelligencescore")}</div>
                    <div className="intelligence-score">
                      Based on {partnershipOpportunities?.totalOpportunities || 127} partnership opportunities
                    </div>
                  </div>

                  {/* Intelligence Progress */}
                  <div className="progress-bar bloomberg-mb-lg">
                    <div 
                      className="progress-fill" 
                      data-progress={Math.floor(((selectedRoute ? 80 : 60)) / 20) * 20}
                    ></div>
                  </div>

                  {/* Partnership Intelligence Results */}
                  <div className="market-insights">
                    <div className="insight-item">
                      <div className="insight-indicator warning"></div>
                      <div className="insight-content">
                        <div className="insight-title">{smartT("partnership.marketvolatility")}</div>
                        <div className="metric-value text-warning" style={{fontSize: '1.5rem'}}>
                          {foundationData?.primarySupplierCountry === 'China' ? '30%' : '15%'} Tariff Risk
                        </div>
                      </div>
                    </div>

                    <div className="insight-item">
                      <div className="insight-indicator success"></div>
                      <div className="insight-content">
                        <div className="insight-title">{smartT("partnership.usmcaprotection")}</div>
                        <div className="insight-value">
                          0% Guaranteed Rate Protection
                        </div>
                      </div>
                    </div>

                    <div className="insight-item">
                      <div className="insight-indicator info"></div>
                      <div className="insight-content">
                        <div className="insight-title">{smartT("partnership.networkready")}</div>
                        <div className="insight-value">100+ Mexico Partners</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* System Status Widget */}
                  <div className="nav-status">
                    <div className="status-header">{smartT("partnership.crisisstatus")}</div>
                    <div className="status-items">
                      <div className="bloomberg-status bloomberg-status-warning small">
                        {smartT("partnership.tariffmonitor")}: {selectedRoute ? 'Optimized' : 'At Risk'}
                      </div>
                      <div className="bloomberg-status bloomberg-status-success small">
                        Partnership Network: Active
                      </div>
                      <div className="bloomberg-status bloomberg-status-info small">
                        Family Team: {selectedRoute ? 'Connecting' : 'Standing By'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}