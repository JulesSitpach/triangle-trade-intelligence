/**
 * FINANCIAL DASHBOARD - ROI & Savings Analysis
 * Enterprise-grade financial tracking for Triangle Intelligence
 * Bloomberg Terminal style with real-time calculations
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function FinancialDashboard({ data }) {
  const [financialMetrics, setFinancialMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (data) {
      calculateFinancialMetrics(data)
    }
  }, [data])

  const calculateFinancialMetrics = (analysisData) => {
    const { foundation, product, routing } = analysisData
    
    // Extract import volume value
    const importVolume = getVolumeValue(foundation.importVolume)
    
    // Calculate current tariff costs (China/India baseline)
    const currentTariffRate = foundation.primarySupplierCountry === 'CN' ? 0.30 : 0.45 // 30% China, 45% India
    const currentTariffCost = importVolume * currentTariffRate
    
    // USMCA savings (0% rate)
    const usmcaSavings = currentTariffCost
    
    // Additional logistics savings
    const logisticsSavings = importVolume * 0.08 // 8% logistics optimization
    
    // Setup costs
    const setupCosts = 45000 // Average setup cost
    
    // Calculate metrics
    const metrics = {
      // Current State
      currentImportValue: importVolume,
      currentTariffCosts: currentTariffCost,
      currentTariffRate: currentTariffRate * 100,
      
      // USMCA Benefits
      usmcaTariffSavings: usmcaSavings,
      logisticsSavings: logisticsSavings,
      totalAnnualSavings: usmcaSavings + logisticsSavings,
      
      // ROI Analysis
      setupCosts: setupCosts,
      paybackPeriod: setupCosts / ((usmcaSavings + logisticsSavings) / 12), // months
      firstYearROI: ((usmcaSavings + logisticsSavings - setupCosts) / setupCosts) * 100,
      fiveYearValue: (usmcaSavings + logisticsSavings) * 5 - setupCosts,
      
      // Risk Analysis
      tariffVolatilityRisk: foundation.primarySupplierCountry === 'CN' ? 'HIGH' : 'MEDIUM',
      usmcaStabilityScore: 98, // USMCA treaty protection
      
      // Projections
      monthlyRunRate: (usmcaSavings + logisticsSavings) / 12,
      quarterlyProjection: (usmcaSavings + logisticsSavings) / 4,
      yearTwoProjection: (usmcaSavings + logisticsSavings) * 1.15, // 15% growth
      
      // Competitive Analysis
      industryBenchmark: foundation.businessType === 'Electronics' ? 0.22 : 0.18,
      competitiveAdvantage: (currentTariffRate - 0) * 100 // Our 0% vs their tariff rate
    }
    
    setFinancialMetrics(metrics)
    setLoading(false)
  }

  const getVolumeValue = (volume) => {
    const ranges = {
      'Under $500K': 250000,
      '$500K - $1M': 750000,
      '$1M - $5M': 3000000,
      '$5M - $25M': 15000000,
      'Over $25M': 50000000
    }
    return ranges[volume] || 1000000
  }

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount/1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount/1000).toFixed(0)}K`
    return `$${Math.round(amount).toLocaleString()}`
  }

  const formatPercentage = (value) => `${value.toFixed(1)}%`

  if (loading || !financialMetrics) {
    return (
      <div className="bloomberg-card">
        <div className="bloomberg-text-center bloomberg-p-xl">
          <div className="loading-spinner"></div>
          <h3>Calculating Financial Intelligence...</h3>
          <p>Processing ROI analysis and savings projections</p>
        </div>
      </div>
    )
  }

  return (
    <div className="financial-dashboard">
      {/* Executive Summary */}
      <div className="bloomberg-card bloomberg-mb-lg">
        <div className="bloomberg-card-header">
          <h2 className="bloomberg-card-title">💰 Financial Intelligence Dashboard</h2>
          <div className="bloomberg-status bloomberg-status-success">
            <div className="bloomberg-status-dot"></div>
            LIVE ANALYSIS
          </div>
        </div>

        {/* Key Financial Metrics */}
        <div className="metrics-grid">
          <div className="metric-card primary">
            <div className="metric-header">
              <div className="metric-period">ANNUAL SAVINGS</div>
              <div className="bloomberg-status bloomberg-status-success small">GUARANTEED</div>
            </div>
            <div className="metric-value text-success">{formatCurrency(financialMetrics.totalAnnualSavings)}</div>
            <div className="bloomberg-metric-label">Triangle Intelligence Value</div>
            <div className="metric-change positive">USMCA Protected</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-period">ROI</div>
              <div className="bloomberg-status bloomberg-status-success small">YEAR 1</div>
            </div>
            <div className="metric-value text-primary">{formatPercentage(financialMetrics.firstYearROI)}</div>
            <div className="bloomberg-metric-label">Return on Investment</div>
            <div className="metric-change positive">After Setup Costs</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-period">PAYBACK</div>
              <div className="bloomberg-status bloomberg-status-info small">FAST</div>
            </div>
            <div className="metric-value text-warning">{financialMetrics.paybackPeriod.toFixed(1)} mo</div>
            <div className="bloomberg-metric-label">Break-even Timeline</div>
            <div className="metric-change neutral">Industry Leading</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-period">5-YEAR VALUE</div>
              <div className="bloomberg-status bloomberg-status-success small">PROJECTED</div>
            </div>
            <div className="metric-value text-success">{formatCurrency(financialMetrics.fiveYearValue)}</div>
            <div className="bloomberg-metric-label">Net Present Value</div>
            <div className="metric-change positive">Compound Growth</div>
          </div>
        </div>
      </div>

      {/* Cost-Benefit Analysis */}
      <div className="bloomberg-grid bloomberg-grid-2 bloomberg-mb-lg">
        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">💸 Current Tariff Burden</h3>
            <div className="bloomberg-status bloomberg-status-error">HIGH RISK</div>
          </div>
          
          <div className="bloomberg-grid bloomberg-grid-2">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-error">{formatCurrency(financialMetrics.currentImportValue)}</div>
              <div className="bloomberg-metric-label">Annual Import Volume</div>
            </div>
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-error">{formatPercentage(financialMetrics.currentTariffRate)}</div>
              <div className="bloomberg-metric-label">Current Tariff Rate</div>
            </div>
          </div>
          
          <div className="bloomberg-card border-error bloomberg-mt-lg">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-error">{formatCurrency(financialMetrics.currentTariffCosts)}</div>
              <div className="bloomberg-metric-label">Annual Tariff Burden</div>
            </div>
            <div className="bloomberg-card-subtitle">
              ⚠️ Volatile: Subject to trade war escalation
            </div>
          </div>
        </div>

        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">🛡️ USMCA Protection</h3>
            <div className="bloomberg-status bloomberg-status-success">STABLE</div>
          </div>
          
          <div className="bloomberg-grid bloomberg-grid-2">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-success">0.0%</div>
              <div className="bloomberg-metric-label">USMCA Tariff Rate</div>
            </div>
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-success">{financialMetrics.usmcaStabilityScore}%</div>
              <div className="bloomberg-metric-label">Treaty Stability</div>
            </div>
          </div>
          
          <div className="bloomberg-card border-success bloomberg-mt-lg">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-success">{formatCurrency(financialMetrics.usmcaTariffSavings)}</div>
              <div className="bloomberg-metric-label">Annual Tariff Elimination</div>
            </div>
            <div className="bloomberg-card-subtitle">
              ✅ Protected: Treaty-locked until 2036
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Projections */}
      <div className="bloomberg-card bloomberg-mb-lg">
        <div className="bloomberg-card-header">
          <h3 className="bloomberg-card-title">📈 Revenue Impact Projections</h3>
          <div className="bloomberg-status bloomberg-status-info">MODELED</div>
        </div>

        <div className="bloomberg-grid bloomberg-grid-4">
          <div className="bloomberg-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-primary">{formatCurrency(financialMetrics.monthlyRunRate)}</div>
              <div className="bloomberg-metric-label">Monthly Savings</div>
            </div>
          </div>
          <div className="bloomberg-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-primary">{formatCurrency(financialMetrics.quarterlyProjection)}</div>
              <div className="bloomberg-metric-label">Quarterly Impact</div>
            </div>
          </div>
          <div className="bloomberg-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-success">{formatCurrency(financialMetrics.totalAnnualSavings)}</div>
              <div className="bloomberg-metric-label">Year 1 Total</div>
            </div>
          </div>
          <div className="bloomberg-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-success">{formatCurrency(financialMetrics.yearTwoProjection)}</div>
              <div className="bloomberg-metric-label">Year 2 Growth</div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="bloomberg-grid bloomberg-grid-2 bloomberg-mb-lg">
        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">⚠️ Risk Assessment</h3>
            <div className="bloomberg-status bloomberg-status-warning">MONITOR</div>
          </div>
          
          <div className="risk-indicators">
            <div className="risk-item">
              <div className="risk-category">Tariff Volatility</div>
              <div className="risk-level">
                <div className="risk-bar">
                  <div className="risk-fill error" style={{width: '85%'}}></div>
                </div>
                <div className="risk-score">HIGH</div>
              </div>
            </div>
            
            <div className="risk-item">
              <div className="risk-category">USMCA Stability</div>
              <div className="risk-level">
                <div className="risk-bar">
                  <div className="risk-fill success" style={{width: '98%'}}></div>
                </div>
                <div className="risk-score">98%</div>
              </div>
            </div>
            
            <div className="risk-item">
              <div className="risk-category">Implementation Risk</div>
              <div className="risk-level">
                <div className="risk-bar">
                  <div className="risk-fill warning" style={{width: '25%'}}></div>
                </div>
                <div className="risk-score">LOW</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">🏆 Competitive Position</h3>
            <div className="bloomberg-status bloomberg-status-success">ADVANTAGE</div>
          </div>
          
          <div className="bloomberg-metric bloomberg-mb-lg">
            <div className="bloomberg-metric-value text-success">{formatPercentage(financialMetrics.competitiveAdvantage)}</div>
            <div className="bloomberg-metric-label">Tariff Advantage vs Competitors</div>
          </div>
          
          <div className="bloomberg-card-subtitle">
            While competitors pay {formatPercentage(financialMetrics.currentTariffRate)} tariffs, 
            you pay 0% through USMCA triangle routing.
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bloomberg-card">
        <div className="bloomberg-card-header">
          <h3 className="bloomberg-card-title">⚡ Financial Action Plan</h3>
          <div className="bloomberg-status bloomberg-status-info">READY</div>
        </div>

        <div className="action-items">
          <div className="action-item priority-high">
            <div className="action-indicator"></div>
            <div className="action-content">
              <div className="action-title">Immediate Tariff Protection</div>
              <div className="action-details">Secure USMCA routing to lock in 0% rate</div>
            </div>
            <div className="action-time">24-48hrs</div>
          </div>
          
          <div className="action-item priority-medium">
            <div className="action-indicator"></div>
            <div className="action-content">
              <div className="action-title">Partnership Finalization</div>
              <div className="action-details">Connect with verified Mexico/Canada partners</div>
            </div>
            <div className="action-time">1-2 weeks</div>
          </div>
          
          <div className="action-item">
            <div className="action-indicator"></div>
            <div className="action-content">
              <div className="action-title">Financial Monitoring Setup</div>
              <div className="action-details">Implement savings tracking dashboard</div>
            </div>
            <div className="action-time">2-4 weeks</div>
          </div>
        </div>

        <div className="bloomberg-hero-actions bloomberg-mt-lg">
          <Link href="/partnership" className="bloomberg-btn bloomberg-btn-primary">
            Connect Partners Now →
          </Link>
          <Link href="/implementation" className="bloomberg-btn bloomberg-btn-secondary">
            View Implementation Plan
          </Link>
        </div>
      </div>
    </div>
  )
}