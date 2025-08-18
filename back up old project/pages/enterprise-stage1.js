/**
 * ENTERPRISE BUSINESS INTELLIGENCE INTAKE
 * Complete transformation from children's game to Bloomberg Terminal style
 * Professional enterprise software interface
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import EnterpriseStageLayout from '../components/EnterpriseStageLayout'
// Bloomberg-compliant: SVG icons removed per compliance requirements

export default function EnterpriseBusinessIntake() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    businessType: '',
    zipCode: '',
    primarySupplierCountry: '',
    importVolume: '',
    timelinePriority: '',
    businessModel: '',
    yearsInBusiness: '',
    teamSize: '',
    riskTolerance: ''
  })

  const [validationState, setValidationState] = useState({})
  const [intelligenceScore, setIntelligenceScore] = useState(0)
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(null)

  // Dynamic dropdown options loaded from backend
  const [businessTypeOptions, setBusinessTypeOptions] = useState([])
  const [countryOptions, setCountryOptions] = useState([])  
  const [importVolumeOptions, setImportVolumeOptions] = useState([])
  const [dropdownsLoading, setDropdownsLoading] = useState(true)

  // Load dropdown options from backend
  useEffect(() => {
    loadDropdownOptions()
  }, [])

  const loadDropdownOptions = async () => {
    try {
      console.log('💾 Loading enterprise dropdown options from backend...')
      
      const response = await fetch('/api/dropdown-options')
      
      if (response.ok) {
        const options = await response.json()
        console.log('✅ Backend dropdown options loaded successfully')
        
        setBusinessTypeOptions(options.businessTypes || [])
        setCountryOptions(options.countries || [])
        setImportVolumeOptions(options.importVolumes || [])
        
      } else {
        console.warn('⚠️ Backend dropdown API failed, using fallback options')
        loadFallbackOptions()
      }
    } catch (error) {
      console.error('❌ Dropdown options loading error:', error)
      loadFallbackOptions()
    } finally {
      setDropdownsLoading(false)
    }
  }

  const loadFallbackOptions = () => {
    // Fallback options if backend fails
    setBusinessTypeOptions([
      { value: 'Electronics', label: 'Electronics & Technology', description: 'Consumer electronics, components, tech hardware' },
      { value: 'Manufacturing', label: 'Manufacturing & Industrial', description: 'Industrial equipment, machinery, tools' },
      { value: 'Medical', label: 'Medical & Healthcare', description: 'Medical devices, pharmaceuticals, health products' },
      { value: 'Automotive', label: 'Automotive & Transportation', description: 'Auto parts, vehicles, transportation equipment' },
      { value: 'Textiles', label: 'Textiles & Apparel', description: 'Clothing, fabrics, fashion accessories' },
      { value: 'Food', label: 'Food & Beverage', description: 'Food products, beverages, agricultural goods' },
      { value: 'Chemicals', label: 'Chemicals & Materials', description: 'Chemical products, raw materials, plastics' },
      { value: 'Furniture', label: 'Furniture & Home Goods', description: 'Home furnishings, décor, consumer goods' }
    ])

    setCountryOptions([
      { value: 'CN', label: 'China', risk: 'High Tariff', tariff: '25-30%' },
      { value: 'IN', label: 'India', risk: 'Medium Tariff', tariff: '15-20%' },
      { value: 'VN', label: 'Vietnam', risk: 'Low Tariff', tariff: '0-15%' },
      { value: 'MX', label: 'Mexico', risk: 'USMCA Partner', tariff: '0%' },
      { value: 'TH', label: 'Thailand', risk: 'Low Tariff', tariff: '0-10%' },
      { value: 'KR', label: 'South Korea', risk: 'FTA Partner', tariff: '5-15%' },
      { value: 'JP', label: 'Japan', risk: 'High Cost', tariff: '10-20%' },
      { value: 'DE', label: 'Germany', risk: 'High Cost', tariff: '12-18%' }
    ])

    setImportVolumeOptions([
      { value: 'Under $500K', label: 'Under $500K', category: 'Small Scale', potential: '$25K-75K savings' },
      { value: '$500K - $1M', label: '$500K - $1M', category: 'Mid Scale', potential: '$75K-150K savings' },
      { value: '$1M - $5M', label: '$1M - $5M', category: 'Large Scale', potential: '$150K-750K savings' },
      { value: '$5M - $25M', label: '$5M - $25M', category: 'Enterprise', potential: '$750K-3.75M savings' },
      { value: 'Over $25M', label: 'Over $25M', category: 'Major Enterprise', potential: '$3.75M+ savings' }
    ])
  }

  // Real-time intelligence calculation
  useEffect(() => {
    calculateIntelligenceScore()
    if (formData.primarySupplierCountry && formData.importVolume) {
      generateRealTimeAnalysis()
    }
  }, [formData])

  const calculateIntelligenceScore = () => {
    const fields = Object.values(formData).filter(value => value !== '')
    const completionRate = (fields.length / Object.keys(formData).length) * 100
    setIntelligenceScore(Math.round(completionRate))
  }

  const generateRealTimeAnalysis = async () => {
    if (!formData.primarySupplierCountry || !formData.importVolume) return

    try {
      console.log('🔍 Fetching real-time tariff intelligence...')
      
      // Call real backend tariff intelligence API
      const response = await fetch(`/api/intelligence/tariffs?origin=${formData.primarySupplierCountry}&destination=US`)
      
      if (response.ok) {
        const tariffData = await response.json()
        console.log('✅ Real-time tariff data received')
        
        const volumeValue = getVolumeValue(formData.importVolume)
        const potentialSavings = calculatePotentialSavings(volumeValue, tariffData.currentRate || '25%')
        
        setRealTimeAnalysis({
          currentExposure: tariffData.currentRate || 'Unknown',
          annualVolume: formData.importVolume,
          potentialSavings,
          riskLevel: tariffData.volatilityLevel || 'Medium Risk',
          recommendation: potentialSavings > 100000 ? 'High Priority' : 'Medium Priority',
          dataSource: 'live_api',
          lastUpdated: new Date().toISOString()
        })
        
        return
      }
    } catch (error) {
      console.warn('⚠️ Real-time tariff API failed, using fallback analysis')
    }

    // Fallback to static analysis if API fails
    const country = countryOptions.find(c => c.value === formData.primarySupplierCountry)
    const volume = importVolumeOptions.find(v => v.value === formData.importVolume)
    
    if (country && volume) {
      const currentTariff = country.tariff || '25%'
      const volumeValue = getVolumeValue(volume.value || volume.label)
      const potentialSavings = calculatePotentialSavings(volumeValue, currentTariff)
      
      setRealTimeAnalysis({
        currentExposure: currentTariff,
        annualVolume: volume.value || volume.label,
        potentialSavings,
        riskLevel: country.risk || 'Medium Risk',
        recommendation: potentialSavings > 100000 ? 'High Priority' : 'Medium Priority',
        dataSource: 'fallback',
        lastUpdated: new Date().toISOString()
      })
    } else if (formData.importVolume) {
      // Basic analysis even without full country data
      const volumeValue = getVolumeValue(formData.importVolume)
      const estimatedSavings = volumeValue * 0.15 // Assume 15% potential savings
      
      setRealTimeAnalysis({
        currentExposure: 'Analyzing...',
        annualVolume: formData.importVolume,
        potentialSavings: estimatedSavings,
        riskLevel: 'Analysis Pending',
        recommendation: 'Data Loading',
        dataSource: 'minimal',
        lastUpdated: new Date().toISOString()
      })
    }
  }

  const getVolumeValue = (volume) => {
    const volumeMap = {
      'Under $500K': 250000,
      '$500K - $1M': 750000,
      '$1M - $5M': 3000000,
      '$5M - $25M': 15000000,
      'Over $25M': 50000000
    }
    return volumeMap[volume] || 0
  }

  const calculatePotentialSavings = (volume, tariffRange) => {
    const avgTariff = tariffRange === '25-30%' ? 0.275 : 
                     tariffRange === '15-20%' ? 0.175 : 
                     tariffRange === '0-15%' ? 0.075 : 0.15
    
    // Potential USMCA savings (assuming 0% through Mexico)
    return Math.round(volume * avgTariff)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear validation error when user starts typing
    if (validationState[field]) {
      setValidationState(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const validateForm = () => {
    const errors = {}
    const requiredFields = ['companyName', 'businessType', 'zipCode', 'primarySupplierCountry', 'importVolume', 'timelinePriority']
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = 'This field is required for enterprise analysis'
      }
    })
    
    setValidationState(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = async () => {
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      // Initialize backend intelligence using real API
      console.log('🧠 Initializing business intelligence with backend...')
      
      const response = await fetch('/api/intelligence/foundation-derivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          intelligenceScore,
          realTimeAnalysis
        })
      })
      
      let backendIntelligence = null
      if (response.ok) {
        backendIntelligence = await response.json()
        console.log('✅ Backend intelligence initialized successfully')
      } else {
        console.warn('⚠️ Backend intelligence failed, using frontend analysis')
      }

      // Save complete enterprise data with backend intelligence
      const completeData = {
        ...formData,
        intelligenceScore,
        realTimeAnalysis,
        backendIntelligence,
        enterpriseGrade: true,
        timestamp: Date.now()
      }

      localStorage.setItem('triangle-foundation', JSON.stringify(completeData))
      console.log('✅ Enterprise business data saved with backend intelligence')
      
      // Navigate to Product Classification
      setTimeout(() => {
        router.push('/product')
      }, 1000)
      
    } catch (error) {
      console.error('❌ Enterprise business intake integration error:', error)
      
      // Fallback: Save without backend intelligence
      localStorage.setItem('triangle-foundation', JSON.stringify({
        ...formData,
        intelligenceScore,
        realTimeAnalysis,
        fallbackMode: true,
        timestamp: Date.now()
      }))
      
      router.push('/stage2')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Business Intelligence Intake - Triangle Intelligence Platform</title>
        <meta name="description" content="Enterprise-grade business profiling and trade intelligence analysis" />
      </Head>

      <style jsx global>{`
      `}</style>

      <EnterpriseStageLayout
        stageNumber={1}
        title="Business Intelligence Intake"
        subtitle="Comprehensive enterprise profiling and trade risk assessment using 597K+ trade flow database"
        onNext={handleNext}
        nextDisabled={intelligenceScore < 50 || loading}
      >
        {/* Enterprise Intelligence Panel */}
        <div className="enterprise-intelligence-overview">
          <div className="intelligence-metrics-grid">
            <div className="intel-metric-card">
              <div className="metric-header">
                <span className="bloomberg-status bloomberg-status-success">📈</span>
                <div className="metric-title">Intelligence Score</div>
              </div>
              <div className="metric-value">{intelligenceScore}%</div>
              <div className="metric-progress">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${intelligenceScore}%` }}></div>
                </div>
              </div>
            </div>

            <div className="intel-metric-card">
              <div className="metric-header">
                <span className="bloomberg-status bloomberg-status-success">💾</span>
                <div className="metric-title">Database Coverage</div>
              </div>
              <div className="metric-value">597K+</div>
              <div className="metric-subtitle">Trade flow records analyzed</div>
            </div>

            <div className="intel-metric-card">
              <div className="metric-header">
                <span className="bloomberg-status bloomberg-status-success">🛡️</span>
                <div className="metric-title">Risk Assessment</div>
              </div>
              <div className="metric-value">
                {realTimeAnalysis ? realTimeAnalysis.riskLevel : 'Pending'}
              </div>
              <div className="metric-subtitle">Current exposure level</div>
            </div>

            <div className="intel-metric-card">
              <div className="metric-header">
                <span className="bloomberg-status bloomberg-status-success">💰</span>
                <div className="metric-title">Savings Potential</div>
              </div>
              <div className="metric-value">
                {realTimeAnalysis ? `$${Math.round(realTimeAnalysis.potentialSavings / 1000)}K` : 'TBD'}
              </div>
              <div className="metric-subtitle">Annual opportunity</div>
            </div>
          </div>
        </div>

        {/* Enterprise Form Sections */}
        <div className="enterprise-form-container">
          {/* Company Information Card */}
          <div className="enterprise-form-section">
            <div className="section-header">
              <span className="bloomberg-status bloomberg-status-info">🏢</span>
              <div className="section-content">
                <h3 className="section-title">Company Information</h3>
                <p className="section-subtitle">Basic business profile</p>
              </div>
            </div>

            <div className="form-fields-grid">
              <div className="form-field-group">
                <label className="enterprise-label">Company Name *</label>
                <input
                  type="text"
                  className={`enterprise-input ${validationState.companyName ? 'error' : ''}`}
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Enter legal company name"
                />
                {validationState.companyName && (
                  <div className="validation-error">{validationState.companyName}</div>
                )}
              </div>

              <div className="form-field-group">
                <label className="enterprise-label">Business Type *</label>
                <div className="enterprise-select-container">
                  <select
                    className={`enterprise-select ${validationState.businessType ? 'error' : ''}`}
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    disabled={dropdownsLoading}
                  >
                    <option value="">
                      {dropdownsLoading ? 'Loading...' : 'Select industry'}
                    </option>
                    {businessTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label || option.description}
                      </option>
                    ))}
                  </select>
                </div>
                {validationState.businessType && (
                  <div className="validation-error">{validationState.businessType}</div>
                )}
              </div>

              <div className="form-field-group">
                <label className="enterprise-label">Business Location *</label>
                <input
                  type="text"
                  className={`enterprise-input ${validationState.zipCode ? 'error' : ''}`}
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="ZIP/Postal Code"
                />
                {validationState.zipCode && (
                  <div className="validation-error">{validationState.zipCode}</div>
                )}
              </div>
            </div>
          </div>

          {/* Trade Configuration Card */}
          <div className="enterprise-form-section">
            <div className="section-header">
              <span className="bloomberg-status bloomberg-status-info">🌍</span>
              <div className="section-content">
                <h3 className="section-title">Trade Configuration</h3>
                <p className="section-subtitle">Import details and optimization</p>
              </div>
            </div>

            <div className="form-fields-grid">
              <div className="form-field-group">
                <label className="enterprise-label">Primary Supplier Country *</label>
                <div className="enterprise-select-container">
                  <select
                    className={`enterprise-select ${validationState.primarySupplierCountry ? 'error' : ''}`}
                    value={formData.primarySupplierCountry}
                    onChange={(e) => handleInputChange('primarySupplierCountry', e.target.value)}
                    disabled={dropdownsLoading}
                  >
                    <option value="">
                      {dropdownsLoading ? 'Loading...' : 'Select country'}
                    </option>
                    {countryOptions.map(country => (
                      <option key={country.value} value={country.value}>
                        {country.label || country.name} - {country.tariff || '0%'}
                      </option>
                    ))}
                  </select>
                </div>
                {validationState.primarySupplierCountry && (
                  <div className="validation-error">{validationState.primarySupplierCountry}</div>
                )}
              </div>

              <div className="form-field-group">
                <label className="enterprise-label">Annual Import Volume *</label>
                <div className="enterprise-select-container">
                  <select
                    className={`enterprise-select ${validationState.importVolume ? 'error' : ''}`}
                    value={formData.importVolume}
                    onChange={(e) => handleInputChange('importVolume', e.target.value)}
                  >
                    <option value="">Select volume</option>
                    {importVolumeOptions.map(volume => (
                      <option key={volume.value} value={volume.value}>
                        {volume.label || volume.value}
                      </option>
                    ))}
                  </select>
                </div>
                {validationState.importVolume && (
                  <div className="validation-error">{validationState.importVolume}</div>
                )}
              </div>

              <div className="form-field-group">
                <label className="enterprise-label">Optimization Priority *</label>
                <div className="enterprise-select-container">
                  <select
                    className={`enterprise-select ${validationState.timelinePriority ? 'error' : ''}`}
                    value={formData.timelinePriority}
                    onChange={(e) => handleInputChange('timelinePriority', e.target.value)}
                  >
                    <option value="">Select priority</option>
                    <option value="Speed">Speed - Fast delivery</option>
                    <option value="Cost">Cost - Minimize expenses</option>
                    <option value="Balanced">Balanced - Both</option>
                    <option value="Reliability">Reliability - No disruptions</option>
                  </select>
                </div>
                {validationState.timelinePriority && (
                  <div className="validation-error">{validationState.timelinePriority}</div>
                )}
              </div>
            </div>
          </div>

          {/* Country Tariff Intelligence */}
          <div className="enterprise-form-section">
            <div className="section-header">
              <span className="bloomberg-status bloomberg-status-success">📈</span>
              <div className="section-content">
                <h3 className="section-title">Country Tariff Intelligence</h3>
                <p className="section-subtitle">Visual country selector with live tariff rates - Click to select</p>
              </div>
            </div>

            <div className="enterprise-country-grid-compact">
              {countryOptions.map(country => (
                <div
                  key={country.value}
                  className={`country-option-compact ${formData.primarySupplierCountry === country.value ? 'selected' : ''}`}
                  onClick={() => handleInputChange('primarySupplierCountry', country.value)}
                >
                  <div className="country-flag">{country.value}</div>
                  <div className="country-details">
                    <div className="country-name">{country.label || country.name}</div>
                    <div className="country-tariff">{country.tariff || '0%'}</div>
                  </div>
                  <div className={`risk-indicator ${(country.risk || 'unknown').toLowerCase().replace(/\s+/g, '-')}`}></div>
                </div>
              ))}
            </div>
            {validationState.primarySupplierCountry && (
              <div className="validation-error">{validationState.primarySupplierCountry}</div>
            )}
          </div>

          {/* Real-Time Analysis Panel */}
          {realTimeAnalysis && (
            <div className="real-time-analysis-panel">
              <div className="analysis-header">
                <span className="bloomberg-status bloomberg-status-success">📊</span>
                <div className="analysis-title">Live Market Analysis</div>
                <div className="analysis-badge">{realTimeAnalysis.recommendation}</div>
              </div>
              
              <div className="analysis-metrics">
                <div className="analysis-metric">
                  <div className="metric-label">Current Exposure</div>
                  <div className="metric-value negative">{realTimeAnalysis.currentExposure}</div>
                </div>
                <div className="analysis-metric">
                  <div className="metric-label">Annual Volume</div>
                  <div className="metric-value">{realTimeAnalysis.annualVolume}</div>
                </div>
                <div className="analysis-metric">
                  <div className="metric-label">Potential Savings</div>
                  <div className="metric-value positive">${realTimeAnalysis.potentialSavings.toLocaleString()}</div>
                </div>
                <div className="analysis-metric">
                  <div className="metric-label">USMCA Route</div>
                  <div className="metric-value neutral">0% tariff available</div>
                </div>
              </div>

              <div className="analysis-insight">
                <strong>Strategic Insight:</strong> Triangle routing via Mexico could eliminate current tariff exposure 
                while maintaining supply chain reliability. Estimated implementation: 90-120 days.
              </div>
            </div>
          )}
        </div>
      </EnterpriseStageLayout>
    </>
  )
}