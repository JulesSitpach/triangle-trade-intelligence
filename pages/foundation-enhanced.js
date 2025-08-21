import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useSafeTranslation } from '../hooks/useSafeTranslation'
import { useMemoryOptimization } from '../hooks/useMemoryOptimization.js'
import { setTriangleData, getTriangleData, hasValidTriangleData } from '../lib/utils/localStorage-validator'
import { logInfo, logPerformance } from '../lib/production-logger'
import EnterpriseStageLayout from '../components/EnterpriseStageLayout'
import BeastMasterController from '../lib/intelligence/beast-master-controller'
import UnifiedGoldmineIntelligence from '../lib/intelligence/goldmine-intelligence'

export default function FoundationBusinessIntakeEnhanced() {
  const { t } = useSafeTranslation('common')
  const { setOptimizedInterval, registerCleanup } = useMemoryOptimization('Foundation')
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    companyName: '',
    businessType: '',
    zipCode: '',
    primarySupplierCountry: '',
    importVolume: '',
    timelinePriority: '',
    secondarySupplierCountries: [],
    seasonalPatterns: '',
    currentShippingPorts: [],
    specialRequirements: []
  })
  
  const [customBusinessType, setCustomBusinessType] = useState('')
  const [derivedData, setDerivedData] = useState(null)
  const [showDerived, setShowDerived] = useState(false)
  const [loading, setLoading] = useState(false)
  const [realTimeIntelligence, setRealTimeIntelligence] = useState(null)
  
  // Database-driven options
  const [businessTypeOptions, setBusinessTypeOptions] = useState([
    'Electronics Manufacturing',
    'Automotive Parts',
    'Textiles & Apparel',
    'Machinery & Equipment',
    'Consumer Goods',
    'Industrial Components',
    'Food & Beverages',
    'Chemicals',
    'Pharmaceuticals',
    'Other'
  ])
  
  const [countryOptions, setCountryOptions] = useState([
    'China (CN)',
    'India (IN)',
    'Vietnam (VN)',
    'Thailand (TH)',
    'Malaysia (MY)',
    'Taiwan (TW)',
    'South Korea (KR)',
    'Mexico (MX)',
    'Brazil (BR)',
    'Turkey (TR)'
  ])
  
  const [importVolumeOptions, setImportVolumeOptions] = useState([
    'Under $500K',
    '$500K - $1M',
    '$1M - $5M',
    '$5M - $25M',
    'Over $25M'
  ])
  
  const [optimizationPriorityOptions, setOptimizationPriorityOptions] = useState([
    'COST',
    'SPEED',
    'BALANCED',
    'RELIABILITY'
  ])

  useEffect(() => {
    // Load existing data if available
    loadExistingData()
    
    // Memory-optimized cleanup
    registerCleanup(() => {
      console.log('Foundation enhanced component cleanup completed')
    })
  }, [])

  const loadExistingData = () => {
    try {
      const existingData = getTriangleData('foundation')
      if (existingData) {
        setFormData({
          companyName: existingData.companyName || '',
          businessType: existingData.businessType || '',
          zipCode: existingData.zipCode || '',
          primarySupplierCountry: existingData.primarySupplierCountry || '',
          importVolume: existingData.importVolume || '',
          timelinePriority: existingData.timelinePriority || '',
          secondarySupplierCountries: existingData.secondarySupplierCountries || [],
          seasonalPatterns: existingData.seasonalPatterns || '',
          currentShippingPorts: existingData.currentShippingPorts || [],
          specialRequirements: existingData.specialRequirements || []
        })
        
        if (existingData.derivedData) {
          setDerivedData(existingData.derivedData)
          setShowDerived(true)
        }
        
        console.log('🔄 Foundation: Loaded existing data', { 
          company: existingData.companyName,
          businessType: existingData.businessType 
        })
      }
    } catch (error) {
      console.error('Error loading existing foundation data:', error)
    }
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generateIntelligenceDerivation = async () => {
    if (!formData.companyName || !formData.businessType || !formData.primarySupplierCountry) {
      return
    }

    setLoading(true)
    const startTime = Date.now()
    
    try {
      logInfo('Foundation: Generating intelligence derivation', {
        company: formData.companyName,
        businessType: formData.businessType,
        supplier: formData.primarySupplierCountry
      })

      // Activate Beast Master Intelligence
      const beastResults = await BeastMasterController.activateAllBeasts(
        formData,
        'foundation',
        { source: 'foundation_page', generateIntelligence: true }
      )

      // Get Goldmine Intelligence
      const goldmineResults = await UnifiedGoldmineIntelligence.getFoundationIntelligence(formData)

      // Generate derived intelligence data
      const derivedIntelligence = {
        geographicIntelligence: {
          primaryRegion: extractRegion(formData.primarySupplierCountry),
          riskProfile: calculateRiskProfile(formData.primarySupplierCountry),
          tradeRoutes: suggestTradeRoutes(formData.primarySupplierCountry),
          seasonalFactors: analyzeSeasonalFactors(formData.businessType)
        },
        businessIntelligence: {
          industryCategory: categorizeIndustry(formData.businessType),
          volumeCategory: categorizeVolume(formData.importVolume),
          priorityProfile: analyzePriority(formData.timelinePriority),
          optimizationOpportunities: identifyOpportunities(formData)
        },
        marketIntelligence: {
          tariffExposure: calculateTariffExposure(formData.primarySupplierCountry),
          volatilityRisk: assessVolatilityRisk(formData.primarySupplierCountry),
          usmcaAdvantage: calculateUSMCAAdvantage(formData),
          projectedSavings: estimateProjectedSavings(formData)
        },
        beastMasterResults: beastResults.status === 'SUCCESS_EMERGENCY_OPTIMIZED' ? beastResults : null,
        goldmineResults: goldmineResults && !goldmineResults.error ? goldmineResults : null,
        confidence: beastResults.unified?.summary?.confidence || 85,
        timestamp: new Date().toISOString()
      }

      setDerivedData(derivedIntelligence)
      setRealTimeIntelligence(derivedIntelligence)
      setShowDerived(true)

      logPerformance('foundation_intelligence_generation', Date.now() - startTime, {
        beastMasterActive: !!derivedIntelligence.beastMasterResults,
        goldmineActive: !!derivedIntelligence.goldmineResults,
        confidence: derivedIntelligence.confidence
      })

    } catch (error) {
      console.error('Error generating intelligence:', error)
      // Provide fallback derived data
      const fallbackDerived = generateFallbackDerivedData(formData)
      setDerivedData(fallbackDerived)
      setShowDerived(true)
    } finally {
      setLoading(false)
    }
  }

  const generateFallbackDerivedData = (formData) => ({
    geographicIntelligence: {
      primaryRegion: extractRegion(formData.primarySupplierCountry),
      riskProfile: calculateRiskProfile(formData.primarySupplierCountry),
      tradeRoutes: suggestTradeRoutes(formData.primarySupplierCountry),
      seasonalFactors: analyzeSeasonalFactors(formData.businessType)
    },
    businessIntelligence: {
      industryCategory: categorizeIndustry(formData.businessType),
      volumeCategory: categorizeVolume(formData.importVolume),
      priorityProfile: analyzePriority(formData.timelinePriority),
      optimizationOpportunities: identifyOpportunities(formData)
    },
    marketIntelligence: {
      tariffExposure: calculateTariffExposure(formData.primarySupplierCountry),
      volatilityRisk: assessVolatilityRisk(formData.primarySupplierCountry),
      usmcaAdvantage: calculateUSMCAAdvantage(formData),
      projectedSavings: estimateProjectedSavings(formData)
    },
    beastMasterResults: null,
    goldmineResults: null,
    confidence: 75,
    fallbackMode: true,
    timestamp: new Date().toISOString()
  })

  const handleNext = async () => {
    if (!validateForm()) return

    setLoading(true)
    const startTime = Date.now()
    
    try {
      // Generate intelligence if not already generated
      if (!derivedData) {
        await generateIntelligenceDerivation()
      }

      // Prepare complete foundation data
      const foundationData = {
        ...formData,
        derivedData: derivedData,
        intelligenceGenerated: true,
        completedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        stage: 'foundation',
        status: 'completed'
      }

      // Save to localStorage
      setTriangleData('foundation', foundationData)

      logInfo('Foundation stage completed', {
        company: formData.companyName,
        businessType: formData.businessType,
        intelligenceGenerated: !!derivedData,
        processingTime: foundationData.processingTime
      })

      // Navigate to product stage
      router.push('/product')

    } catch (error) {
      console.error('Error completing foundation stage:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const requiredFields = ['companyName', 'businessType', 'primarySupplierCountry', 'importVolume', 'timelinePriority']
    const missingFields = requiredFields.filter(field => !formData[field])
    
    if (missingFields.length > 0) {
      console.warn('Foundation validation failed:', { missingFields })
      return false
    }
    
    return true
  }

  // Helper functions for intelligence generation
  const extractRegion = (country) => {
    const regionMap = {
      'China (CN)': 'East Asia',
      'India (IN)': 'South Asia',
      'Vietnam (VN)': 'Southeast Asia',
      'Thailand (TH)': 'Southeast Asia',
      'Malaysia (MY)': 'Southeast Asia',
      'Taiwan (TW)': 'East Asia',
      'South Korea (KR)': 'East Asia',
      'Mexico (MX)': 'North America',
      'Brazil (BR)': 'South America',
      'Turkey (TR)': 'Europe/Asia'
    }
    return regionMap[country] || 'Other'
  }

  const calculateRiskProfile = (country) => {
    const riskMap = {
      'China (CN)': { level: 'HIGH', factors: ['Trade tensions', 'Tariff volatility', 'Geopolitical risk'] },
      'India (IN)': { level: 'MEDIUM-HIGH', factors: ['Regulatory changes', 'Infrastructure challenges'] },
      'Vietnam (VN)': { level: 'MEDIUM', factors: ['Growing economy', 'Infrastructure development'] },
      'Thailand (TH)': { level: 'MEDIUM', factors: ['Political stability', 'Established infrastructure'] },
      'Mexico (MX)': { level: 'LOW', factors: ['USMCA benefits', 'Geographic proximity'] }
    }
    return riskMap[country] || { level: 'MEDIUM', factors: ['Standard trade risks'] }
  }

  const calculateTariffExposure = (country) => {
    const tariffMap = {
      'China (CN)': { current: '25-30%', usmcaAlternative: '0%', savings: '25-30%' },
      'India (IN)': { current: '15-25%', usmcaAlternative: '0%', savings: '15-25%' },
      'Vietnam (VN)': { current: '8-15%', usmcaAlternative: '0%', savings: '8-15%' },
      'Thailand (TH)': { current: '5-12%', usmcaAlternative: '0%', savings: '5-12%' },
      'Mexico (MX)': { current: '0%', usmcaAlternative: '0%', savings: '0%' }
    }
    return tariffMap[country] || { current: '10%', usmcaAlternative: '0%', savings: '10%' }
  }

  const estimateProjectedSavings = (formData) => {
    const volumeMap = {
      'Under $500K': 45000,
      '$500K - $1M': 125000,
      '$1M - $5M': 245000,
      '$5M - $25M': 850000,
      'Over $25M': 1800000
    }
    
    const baselineSavings = volumeMap[formData.importVolume] || 150000
    const countryMultiplier = formData.primarySupplierCountry === 'China (CN)' ? 1.3 : 1.0
    const urgencyMultiplier = formData.timelinePriority === 'COST' ? 1.2 : 1.0
    
    return Math.round(baselineSavings * countryMultiplier * urgencyMultiplier)
  }

  const categorizeIndustry = (businessType) => businessType
  const categorizeVolume = (importVolume) => importVolume
  const analyzePriority = (priority) => priority
  const identifyOpportunities = (formData) => ['Triangle routing', 'USMCA optimization', 'Supply chain diversification']
  const suggestTradeRoutes = (country) => ['Direct route', 'Mexico triangle', 'Canada triangle']
  const analyzeSeasonalFactors = (businessType) => 'Q4 peak season considerations'
  const assessVolatilityRisk = (country) => country.includes('China') ? 'HIGH' : 'MEDIUM'
  const calculateUSMCAAdvantage = (formData) => 'Significant tariff elimination opportunity'

  return (
    <>
      <Head>
        <title>Foundation Intelligence - Triangle Intelligence Platform</title>
        <meta name="description" content="Business foundation analysis with Beast Master intelligence and real-time market intelligence" />
      </Head>

      <EnterpriseStageLayout
        currentPage="foundation"
        title="Business Foundation Intelligence"
        subtitle="Company profile analysis with geographic intelligence derivation and Beast Master AI integration"
        onNext={handleNext}
        nextDisabled={!validateForm() || loading}
        nextText={loading ? "Generating Intelligence..." : "Continue to Product Intelligence →"}
        showProgress={true}
        showLiveData={true}
        enableRealTimeIntelligence={true}
      >
        {/* Foundation Intelligence Form */}
        <div className="bloomberg-section">
          <div className="bloomberg-grid bloomberg-grid-2">
            {/* Company Information */}
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">🏢 Company Information</h3>
                <div className="bloomberg-status bloomberg-status-info">Required</div>
              </div>
              
              <div className="bloomberg-form-group">
                <label className="bloomberg-form-label">Company Name *</label>
                <input
                  type="text"
                  className="bloomberg-form-input"
                  placeholder="Enter your company name"
                  value={formData.companyName}
                  onChange={(e) => handleFormChange('companyName', e.target.value)}
                />
              </div>

              <div className="bloomberg-form-group">
                <label className="bloomberg-form-label">Business Type *</label>
                <select
                  className="bloomberg-form-select"
                  value={formData.businessType}
                  onChange={(e) => handleFormChange('businessType', e.target.value)}
                >
                  <option value="">Select business type</option>
                  {businessTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="bloomberg-form-group">
                <label className="bloomberg-form-label">ZIP Code</label>
                <input
                  type="text"
                  className="bloomberg-form-input"
                  placeholder="Enter ZIP code for regional analysis"
                  value={formData.zipCode}
                  onChange={(e) => handleFormChange('zipCode', e.target.value)}
                />
              </div>
            </div>

            {/* Supply Chain Intelligence */}
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">🌍 Supply Chain Intelligence</h3>
                <div className="bloomberg-status bloomberg-status-warning">High Impact</div>
              </div>
              
              <div className="bloomberg-form-group">
                <label className="bloomberg-form-label">Primary Supplier Country *</label>
                <select
                  className="bloomberg-form-select"
                  value={formData.primarySupplierCountry}
                  onChange={(e) => handleFormChange('primarySupplierCountry', e.target.value)}
                >
                  <option value="">Select primary supplier country</option>
                  {countryOptions.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div className="bloomberg-form-group">
                <label className="bloomberg-form-label">Annual Import Volume *</label>
                <select
                  className="bloomberg-form-select"
                  value={formData.importVolume}
                  onChange={(e) => handleFormChange('importVolume', e.target.value)}
                >
                  <option value="">Select import volume range</option>
                  {importVolumeOptions.map(volume => (
                    <option key={volume} value={volume}>{volume}</option>
                  ))}
                </select>
              </div>

              <div className="bloomberg-form-group">
                <label className="bloomberg-form-label">Optimization Priority *</label>
                <select
                  className="bloomberg-form-select"
                  value={formData.timelinePriority}
                  onChange={(e) => handleFormChange('timelinePriority', e.target.value)}
                >
                  <option value="">Select optimization priority</option>
                  {optimizationPriorityOptions.map(priority => (
                    <option key={priority} value={priority}>
                      {priority} - {priority === 'COST' ? 'Maximum savings focus' :
                       priority === 'SPEED' ? 'Fast implementation' :
                       priority === 'BALANCED' ? 'Balanced approach' : 'Maximum reliability'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Generation */}
        <div className="bloomberg-section">
          <div className="bloomberg-card">
            <div className="bloomberg-card-header">
              <h3 className="bloomberg-card-title">🧠 Intelligence Generation</h3>
              <button
                onClick={generateIntelligenceDerivation}
                disabled={!formData.companyName || !formData.businessType || !formData.primarySupplierCountry || loading}
                className="bloomberg-btn bloomberg-btn-primary"
              >
                {loading ? 'Generating...' : 'Generate Intelligence Analysis'}
              </button>
            </div>
            
            {showDerived && derivedData && (
              <div className="intelligence-results">
                <div className="bloomberg-grid bloomberg-grid-3">
                  {/* Geographic Intelligence */}
                  <div className="bloomberg-card">
                    <div className="bloomberg-card-header">
                      <h4 className="bloomberg-card-title">Geographic Intelligence</h4>
                      <div className="bloomberg-status bloomberg-status-success">
                        {derivedData.confidence}% Confidence
                      </div>
                    </div>
                    <div className="intelligence-metrics">
                      <div className="bloomberg-metric">
                        <div className="bloomberg-metric-value">{derivedData.geographicIntelligence.primaryRegion}</div>
                        <div className="bloomberg-metric-label">Primary Region</div>
                      </div>
                      <div className="bloomberg-metric">
                        <div className="bloomberg-metric-value text-error">{derivedData.geographicIntelligence.riskProfile.level}</div>
                        <div className="bloomberg-metric-label">Risk Level</div>
                      </div>
                    </div>
                  </div>

                  {/* Market Intelligence */}
                  <div className="bloomberg-card">
                    <div className="bloomberg-card-header">
                      <h4 className="bloomberg-card-title">Market Intelligence</h4>
                      <div className="bloomberg-status bloomberg-status-error">High Exposure</div>
                    </div>
                    <div className="intelligence-metrics">
                      <div className="bloomberg-metric">
                        <div className="bloomberg-metric-value text-error">{derivedData.marketIntelligence.tariffExposure.current}</div>
                        <div className="bloomberg-metric-label">Current Tariff</div>
                      </div>
                      <div className="bloomberg-metric">
                        <div className="bloomberg-metric-value text-success">
                          ${derivedData.marketIntelligence.projectedSavings?.toLocaleString() || '245,000'}
                        </div>
                        <div className="bloomberg-metric-label">Projected Savings</div>
                      </div>
                    </div>
                  </div>

                  {/* Beast Master Status */}
                  <div className="bloomberg-card">
                    <div className="bloomberg-card-header">
                      <h4 className="bloomberg-card-title">Beast Master Status</h4>
                      <div className="bloomberg-status bloomberg-status-success">
                        {derivedData.beastMasterResults ? 'ACTIVE' : 'FALLBACK'}
                      </div>
                    </div>
                    <div className="intelligence-metrics">
                      <div className="bloomberg-metric">
                        <div className="bloomberg-metric-value">
                          {derivedData.beastMasterResults?.unified?.insights?.compound?.length || 0}
                        </div>
                        <div className="bloomberg-metric-label">Compound Insights</div>
                      </div>
                      <div className="bloomberg-metric">
                        <div className="bloomberg-metric-value text-success">
                          {derivedData.goldmineResults ? 'ENABLED' : 'STANDARD'}
                        </div>
                        <div className="bloomberg-metric-label">Goldmine Intelligence</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Intelligence Display */}
        {realTimeIntelligence && realTimeIntelligence.beastMasterResults && (
          <div className="bloomberg-section">
            <div className="bloomberg-card">
              <div className="bloomberg-card-header">
                <h3 className="bloomberg-card-title">🦾 Real-Time Beast Master Intelligence</h3>
                <div className="bloomberg-status bloomberg-status-success">LIVE</div>
              </div>
              <div className="beast-intelligence-display">
                <div className="bloomberg-grid bloomberg-grid-2">
                  <div className="compound-insights-panel">
                    <h4>Compound Insights</h4>
                    {realTimeIntelligence.beastMasterResults.unified?.insights?.compound?.map((insight, index) => (
                      <div key={index} className="insight-card">
                        <div className="insight-header">
                          <span className="insight-type">{insight.type}</span>
                          <span className="insight-confidence">{insight.confidence}%</span>
                        </div>
                        <p className="insight-description">{insight.insight}</p>
                      </div>
                    )) || <p>No compound insights generated yet.</p>}
                  </div>
                  <div className="performance-metrics-panel">
                    <h4>Performance Metrics</h4>
                    <div className="metrics-grid">
                      <div className="metric-item">
                        <span className="metric-label">Processing Time</span>
                        <span className="metric-value">
                          {realTimeIntelligence.beastMasterResults.performance?.processingTime || 0}ms
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Intelligence Quality</span>
                        <span className="metric-value">
                          {realTimeIntelligence.beastMasterResults.performance?.intelligenceQuality || 85}%
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Beast Systems</span>
                        <span className="metric-value">
                          {realTimeIntelligence.beastMasterResults.performance?.totalBeasts || 6}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </EnterpriseStageLayout>
    </>
  )
}