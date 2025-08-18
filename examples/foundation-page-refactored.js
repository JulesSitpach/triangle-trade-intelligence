/**
 * FOUNDATION PAGE - REFACTORED WITH UNIFIED STATE MANAGEMENT
 * Example showing how to migrate existing pages to use the new state system
 * This replaces direct localStorage usage with the unified state context
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

// New state management imports
import { useFoundationState } from '../lib/state/pageStateHooks'
import { useIntelligenceOrchestrator } from '../lib/state/intelligenceIntegration'
import { useJourney, useTriangleState } from '../lib/state/TriangleStateContext'

// Existing components (preserved)
import LanguageSwitcher from '../components/LanguageSwitcher'
import TriangleSideNav from '../components/TriangleSideNav'
import StateMonitor from '../components/StateMonitor'

// Existing utilities (preserved)
import { logInfo, logError, logPerformance } from '../lib/utils/production-logger'

export default function FoundationBusinessIntakeRefactored() {
  const router = useRouter()
  
  // New unified state management
  const {
    data: foundationData,
    setData,
    updateData,
    isCompleted,
    validate,
    completionPercentage,
    submit
  } = useFoundationState()
  
  const { currentPage, progress } = useJourney()
  const { state, actions } = useTriangleState()
  const intelligenceOrchestrator = useIntelligenceOrchestrator()
  
  // Local UI state (unchanged)
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
  const [realTimeStats, setRealTimeStats] = useState(null)
  const [showStateMonitor, setShowStateMonitor] = useState(false)
  
  // Dropdown options state (preserved existing pattern)
  const [businessTypeOptions, setBusinessTypeOptions] = useState([])
  const [countryOptions, setCountryOptions] = useState([])
  const [importVolumeOptions, setImportVolumeOptions] = useState([])
  const [optimizationPriorityOptions, setOptimizationPriorityOptions] = useState([])
  const [dropdownsLoading, setDropdownsLoading] = useState(true)
  
  // Initialize from unified state if available
  useEffect(() => {
    if (foundationData) {
      setFormData(prevData => ({
        ...prevData,
        ...foundationData
      }))
      
      if (foundationData.derivedIntelligence) {
        setDerivedData(foundationData.derivedIntelligence)
        setShowDerived(true)
      }
    }
  }, [foundationData])
  
  // Load enterprise data (preserved existing functionality)
  useEffect(() => {
    loadEnterpriseData()
    
    // Update real-time stats
    const interval = setInterval(() => {
      updateRealTimeStats()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])
  
  const loadEnterpriseData = async () => {
    try {
      // Existing dropdown loading logic (preserved)
      const dropdownResponse = await fetch('/api/dropdown-options')
      if (dropdownResponse.ok) {
        const options = await dropdownResponse.json()
        setBusinessTypeOptions(options.businessTypes || [])
        setCountryOptions(options.countries || [])
        setImportVolumeOptions(options.importVolumes || [])
        setOptimizationPriorityOptions(options.optimizationPriorities || [])
      }
      
      updateRealTimeStats()
      
    } catch (error) {
      console.error('❌ Enterprise data loading error:', error)
      // Use new state management for error handling
      actions.addError('Failed to load dropdown options')
    } finally {
      setDropdownsLoading(false)
    }
  }
  
  const updateRealTimeStats = async () => {
    try {
      // Use existing real-time stats logic but update unified state
      const response = await fetch('/api/intelligence/real-time-stats')
      if (response.ok) {
        const stats = await response.json()
        const realTimeData = {
          activeAnalyses: stats.activeAnalyses || 12,
          avgSavings: stats.avgSavings || 247000,
          successRate: stats.successRate || 94.2,
          newRoutes: stats.newRoutes || 3,
          timestamp: new Date().toISOString()
        }
        
        setRealTimeStats(realTimeData)
        // Update unified state
        actions.updateRealTimeStats(realTimeData)
      }
    } catch (error) {
      console.error('Error fetching real-time stats:', error)
    }
  }
  
  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)
    
    // Auto-save to unified state (debounced)
    updateData(newFormData)
    
    // Auto-derive intelligence when core data is available
    if (newFormData.businessType && newFormData.zipCode && newFormData.primarySupplierCountry && value) {
      setTimeout(() => deriveIntelligence(newFormData), 500)
    }
  }
  
  const deriveIntelligence = async (data) => {
    try {
      actions.setLoading(true)
      
      // Use new intelligence orchestrator instead of direct API calls
      const intelligence = await intelligenceOrchestrator.processFoundationIntelligence(data)
      
      setDerivedData(intelligence)
      setShowDerived(true)
      
      // Intelligence is automatically stored in unified state by orchestrator
      logInfo('Foundation intelligence derived successfully', { 
        confidence: intelligence.confidence,
        sessionId: state.journey.sessionId 
      })
      
    } catch (error) {
      console.error('❌ Intelligence derivation error:', error)
      actions.addError('Failed to derive intelligence')
    } finally {
      actions.setLoading(false)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const finalFormData = {
        ...formData,
        businessType: formData.businessType === 'Other' ? customBusinessType : formData.businessType
      }
      
      // Use new unified state submission
      const result = await submit(finalFormData)
      
      if (result.success) {
        logInfo('Foundation submission successful', { 
          completionPercentage,
          sessionId: state.journey.sessionId 
        })
        
        // Navigate to next page
        setTimeout(() => {
          router.push('/product')
        }, 1500)
      } else {
        actions.addError(result.error || 'Submission failed')
      }
      
    } catch (error) {
      console.error('❌ Foundation submit error:', error)
      actions.addError('Submission failed')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <>
      <Head>
        <title>Foundation Intelligence - Triangle Intelligence Platform</title>
        <meta name="description" content="Complete your business profile for trade optimization" />
      </Head>

      {/* State Monitor for development */}
      {process.env.NODE_ENV === 'development' && (
        <StateMonitor 
          isVisible={showStateMonitor} 
          onToggle={() => setShowStateMonitor(!showStateMonitor)} 
        />
      )}

      {/* Navigation (preserved existing styling) */}
      <nav className="bloomberg-nav">
        <div className="bloomberg-container-padded">
          <div className="bloomberg-flex bloomberg-justify-between bloomberg-align-center">
            <Link href="/" className="bloomberg-nav-brand">
              <span className="text-success">◢</span>
              Triangle Intelligence
              <span className="text-primary">PRO v2.1</span>
            </Link>
            <div className="bloomberg-flex bloomberg-gap-md">
              {/* Journey Progress Indicator (new) */}
              <div className="bloomberg-status bloomberg-status-info">
                <div className="bloomberg-status-dot"></div>
                Progress: {progress}% ({currentPage})
              </div>
              
              {/* Session Info (enhanced with unified state) */}
              <div className="bloomberg-status bloomberg-status-success">
                <div className="bloomberg-status-dot"></div>
                Session: {state.journey.sessionId?.slice(-8)}
              </div>
              
              <LanguageSwitcher />
              
              <Link href="/dashboard" className="bloomberg-btn bloomberg-btn-secondary">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="triangle-layout">
        <TriangleSideNav />
        <main className="main-content bloomberg-bg-cover bloomberg-min-h-screen">
          <div className="page-content">

            {/* Executive Metrics Bar (preserved with unified state enhancements) */}
            <div className="bloomberg-container-padded">
              <div className="metrics-grid">
                <div className="metric-card primary">
                  <div className="metric-header">
                    <div className="metric-period">Live Data</div>
                    <div className="bloomberg-status bloomberg-status-success small">
                      {state.ui.isLoading ? 'Processing' : 'Streaming'}
                    </div>
                  </div>
                  <div className="metric-value text-primary">597,072</div>
                  <div className="bloomberg-metric-label">Trade Flow Records</div>
                  <div className="metric-change positive">+12.5% This Month</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <div className="metric-period">Intelligence Level</div>
                    <div className="bloomberg-status bloomberg-status-success small">Active</div>
                  </div>
                  <div className="metric-value text-success">{completionPercentage}%</div>
                  <div className="bloomberg-metric-label">Data Completeness</div>
                  <div className="metric-change positive">
                    {Object.keys(state.intelligence.analysisResults).length} Analysis Results
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <div className="metric-period">Optimization</div>
                    <div className="bloomberg-status bloomberg-status-success small">Optimal</div>
                  </div>
                  <div className="metric-value text-success">
                    {realTimeStats?.successRate?.toFixed(1) || '94.2'}%
                  </div>
                  <div className="bloomberg-metric-label">Success Rate</div>
                  <div className="metric-change positive">Above Target</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <div className="metric-period">Real-time</div>
                    <div className="bloomberg-status bloomberg-status-info small">Analyzing</div>
                  </div>
                  <div className="metric-value text-primary">
                    {realTimeStats?.activeAnalyses || '12'}
                  </div>
                  <div className="bloomberg-metric-label">Live Intelligence</div>
                  <div className="metric-change neutral">Processing</div>
                </div>
              </div>
            </div>

            {/* Form Content (preserved existing layout with state enhancements) */}
            <div className="bloomberg-container-padded">
              <div className="foundation-workspace">
                
                <div className="foundation-form-section">
                  <h1 className="bloomberg-hero-title">Business Intelligence Foundation</h1>
                  <p className="bloomberg-hero-subtitle bloomberg-mb-lg">
                    Complete your profile to unlock $100K-$300K+ savings optimization
                  </p>

                  {/* Error Display (new unified error handling) */}
                  {state.ui.errors.length > 0 && (
                    <div className="bloomberg-alert bloomberg-alert-error bloomberg-mb-md">
                      {state.ui.errors.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                      <button 
                        onClick={actions.clearErrors}
                        className="bloomberg-btn bloomberg-btn-ghost text-danger bloomberg-mt-sm"
                      >
                        Clear Errors
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="bloomberg-form">
                    {/* Company Intelligence Section */}
                    <div className="bloomberg-card">
                      <div className="bloomberg-card-header">
                        <span className="section-icon">🏢</span>
                        <div className="section-content">
                          <h3 className="bloomberg-card-title">Business Intelligence Profile</h3>
                          <p className="section-subtitle">Enterprise business classification and market analysis</p>
                        </div>
                      </div>

                      <div className="bloomberg-grid bloomberg-grid-2">
                        <div className="bloomberg-form-group">
                          <label className="bloomberg-label required">Company Name</label>
                          <input
                            className="bloomberg-input"
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => handleInputChange('companyName', e.target.value)}
                            placeholder="Your company or organization name"
                            required
                          />
                        </div>

                        <div className="bloomberg-form-group">
                          <label className="bloomberg-label required">Industry Classification</label>
                          <select
                            className="bloomberg-input bloomberg-select"
                            value={formData.businessType}
                            onChange={(e) => {
                              handleInputChange('businessType', e.target.value)
                              if (e.target.value !== 'Other') {
                                setCustomBusinessType('')
                              }
                            }}
                            disabled={dropdownsLoading}
                            required
                          >
                            <option value="">
                              {dropdownsLoading ? 'Loading industry database...' : 'Select your primary industry'}
                            </option>
                            {businessTypeOptions.map(option => (
                              <option key={option.value} value={option.value} title={option.description}>
                                {option.description || option.label}
                              </option>
                            ))}
                            <option value="Other">Other (specify below)</option>
                          </select>
                          
                          {formData.businessType === 'Other' && (
                            <input
                              className="bloomberg-input"
                              type="text"
                              value={customBusinessType}
                              onChange={(e) => setCustomBusinessType(e.target.value)}
                              placeholder="Specify your industry classification"
                              required
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Supply Chain Configuration */}
                    <div className="bloomberg-card">
                      <div className="bloomberg-card-header">
                        <span className="section-icon">🌐</span>
                        <div className="section-content">
                          <h3 className="bloomberg-card-title">Supply Chain Configuration</h3>
                          <p className="section-subtitle">Geographic sourcing and trade flow optimization</p>
                        </div>
                      </div>

                      <div className="bloomberg-grid bloomberg-grid-2">
                        <div className="bloomberg-form-group">
                          <label className="bloomberg-label required">Business Location</label>
                          <input
                            className="bloomberg-input"
                            type="text"
                            value={formData.zipCode}
                            onChange={(e) => handleInputChange('zipCode', e.target.value)}
                            placeholder="ZIP/Postal Code (e.g., 90210, M6H 1A1)"
                            required
                          />
                          <div className="text-muted bloomberg-text-xs bloomberg-mt-xs">
                            Used for port proximity and regional trade analysis
                          </div>
                        </div>

                        <div className="bloomberg-form-group">
                          <label className="bloomberg-label required">Primary Supplier Country</label>
                          <select
                            className="bloomberg-input bloomberg-select"
                            value={formData.primarySupplierCountry}
                            onChange={(e) => handleInputChange('primarySupplierCountry', e.target.value)}
                            disabled={dropdownsLoading}
                            required
                          >
                            <option value="">
                              {dropdownsLoading ? 'Loading country intelligence...' : 'Select primary supplier country'}
                            </option>
                            {countryOptions.map(option => (
                              <option key={option.value} value={option.value} title={option.description}>
                                {option.description || option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="bloomberg-form-group">
                          <label className="bloomberg-label required">Annual Import Volume</label>
                          <select
                            className="bloomberg-input bloomberg-select"
                            value={formData.importVolume}
                            onChange={(e) => handleInputChange('importVolume', e.target.value)}
                            required
                          >
                            <option value="">Select annual import volume</option>
                            {importVolumeOptions.map(option => (
                              <option key={option.value} value={option.value} title={option.description}>
                                {option.description || option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="bloomberg-form-group">
                          <label className="bloomberg-label required">Optimization Priority</label>
                          <select
                            className="bloomberg-input bloomberg-select"
                            value={formData.timelinePriority}
                            onChange={(e) => handleInputChange('timelinePriority', e.target.value)}
                            required
                          >
                            <option value="">Select optimization focus</option>
                            {optimizationPriorityOptions.map(option => (
                              <option key={option.value} value={option.value} title={option.description}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="bloomberg-hero-actions">
                      <Link href="/dashboard" className="bloomberg-btn bloomberg-btn-secondary">
                        Back to Command Center
                      </Link>
                      <button
                        type="submit"
                        className="bloomberg-btn bloomberg-btn-primary"
                        disabled={loading || dropdownsLoading || state.ui.isLoading}
                      >
                        {loading || state.ui.isLoading ? 'Processing Intelligence...' : 'Continue to Product Analysis →'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Intelligence Panel (enhanced with unified state) */}
                <div className="foundation-intelligence-panel">
                  <div className="bloomberg-h-120"></div>
                  
                  <div className="widget-header">
                    <div className="widget-title">
                      <div className="widget-icon">🧠</div>
                      Live Intelligence Analysis
                    </div>
                    <div className="bloomberg-status bloomberg-status-info small">
                      {state.ui.isLoading ? 'Processing' : 'Real-time'}
                    </div>
                  </div>
                  
                  {/* Intelligence Level Display */}
                  <div className="bloomberg-text-center bloomberg-mb-lg">
                    <div className="metric-value text-primary">
                      {(1.0 + (completionPercentage / 100) * 1.0).toFixed(1)}/10.0
                    </div>
                    <div className="bloomberg-metric-label">Intelligence Confidence</div>
                    <div className="intelligence-score">
                      {completionPercentage}% Complete
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-bar bloomberg-mb-lg">
                    <div 
                      className="progress-fill" 
                      data-progress={Math.floor(completionPercentage / 20) * 20}
                    ></div>
                  </div>

                  {/* Intelligence Results (enhanced with unified state data) */}
                  {showDerived && derivedData && (
                    <div className="market-insights">
                      <div className="insight-item">
                        <div className="insight-indicator success"></div>
                        <div className="insight-content">
                          <div className="insight-title">Projected Savings</div>
                          <div className="metric-value text-success bloomberg-text-xl">
                            ${derivedData.savings?.annual ? Math.round(derivedData.savings.annual / 1000) : 0}K
                          </div>
                        </div>
                      </div>
                      
                      <div className="insight-item">
                        <div className="insight-indicator info"></div>
                        <div className="insight-content">
                          <div className="insight-title">Geographic Intelligence</div>
                          <div className="insight-value">
                            {derivedData.geographic?.city}, {derivedData.geographic?.region}
                          </div>
                        </div>
                      </div>
                      
                      <div className="insight-item">
                        <div className="insight-indicator warning"></div>
                        <div className="insight-content">
                          <div className="insight-title">Route Optimization</div>
                          <div className="insight-value">{derivedData.confidence || 85}% Confidence</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* System Status Widget (enhanced with unified state) */}
                  <div className="nav-status">
                    <div className="status-header">System Status</div>
                    <div className="status-items">
                      <div className="bloomberg-status bloomberg-status-success small">
                        Database: {dropdownsLoading ? 'Loading' : 'Connected'}
                      </div>
                      <div className="bloomberg-status bloomberg-status-success small">
                        Analysis: {showDerived ? 'Active' : 'Ready'}
                      </div>
                      <div className="bloomberg-status bloomberg-status-info small">
                        Intelligence: {Object.keys(state.intelligence.analysisResults).length} Results
                      </div>
                      <div className="bloomberg-status bloomberg-status-success small">
                        Session: {state.journey.sessionId?.slice(-8)}
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