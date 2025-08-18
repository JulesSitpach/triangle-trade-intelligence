/**
 * PLATFORM INTELLIGENCE & BUSINESS OPTIMIZATION DASHBOARD - Internal Team Tool
 * FOR: Your strategic business insights and platform optimization
 * PURPOSE: Monitor platform performance, customer behavior, growth opportunities
 * FOCUS: Platform optimization, customer insights, strategic planning
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function PlatformIntelligenceDashboard() {
  const [platformData, setPlatformData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load platform intelligence data
    loadPlatformIntelligenceData()
  }, [])

  const loadPlatformIntelligenceData = async () => {
    // Simulate real platform data - in production, this would come from analytics/database
    const mockData = {
      // Platform Performance Overview
      platform: {
        totalUsers: 1247,
        activeUsers: 423,
        completionRate: 67.3,
        avgSessionTime: '12.5 min',
        bounceRate: 23.1,
        conversionToPartnership: 31.2
      },

      // Customer Journey Analytics
      journey: {
        stages: [
          { name: 'Foundation', completion: 89.4, avgTime: '4.2 min', dropoff: 10.6 },
          { name: 'Product', completion: 78.1, avgTime: '6.8 min', dropoff: 21.9 },
          { name: 'Routing', completion: 71.3, avgTime: '8.1 min', dropoff: 28.7 },
          { name: 'Partnership', completion: 45.2, avgTime: '11.3 min', dropoff: 54.8 },
          { name: 'Implementation', completion: 67.3, avgTime: '3.9 min', dropoff: 32.7 }
        ],
        insights: [
          {
            stage: 'Product',
            issue: 'HS Code complexity causing 21.9% dropoff',
            impact: 'high',
            recommendation: 'Add smart product suggestions and simplify interface'
          },
          {
            stage: 'Partnership',
            issue: 'Highest dropoff at 54.8% during partner selection',
            impact: 'critical',
            recommendation: 'Implement partner pre-qualification and instant matching'
          }
        ]
      },

      // Feature Usage & Effectiveness
      features: [
        {
          feature: 'Triangle Route Calculator',
          usage: 87.3,
          effectiveness: 4.6,
          leadGeneration: 78.2,
          userFeedback: 'Highly valuable - shows immediate savings potential'
        },
        {
          feature: 'HS Code Intelligence',
          usage: 71.8,
          effectiveness: 4.2,
          leadGeneration: 45.7,
          userFeedback: 'Helpful but sometimes too complex for non-experts'
        },
        {
          feature: 'Marcus AI Consultant',
          usage: 63.4,
          effectiveness: 4.8,
          leadGeneration: 89.1,
          userFeedback: 'Exceptional insights, builds trust and confidence'
        },
        {
          feature: 'Savings Calculator',
          usage: 94.2,
          effectiveness: 4.9,
          leadGeneration: 92.3,
          userFeedback: 'Critical decision factor - most compelling feature'
        }
      ],

      // Market Intelligence & Opportunities
      market: {
        targetSegments: [
          {
            segment: 'Electronics Importers',
            size: 2400,
            penetration: 8.2,
            avgDealSize: 125000,
            growthRate: 23.5,
            opportunity: 'high'
          },
          {
            segment: 'Manufacturing Companies',
            size: 1800,
            penetration: 12.1,
            avgDealSize: 185000,
            growthRate: 18.7,
            opportunity: 'high'
          },
          {
            segment: 'Automotive Parts',
            size: 950,
            penetration: 15.3,
            avgDealSize: 95000,
            growthRate: 31.2,
            opportunity: 'critical'
          }
        ],
        trends: [
          {
            trend: 'US-China Tariff Volatility',
            impact: 'increasing',
            urgency: 'high',
            businessImpact: '+47% in platform interest over 60 days'
          },
          {
            trend: 'USMCA Adoption Awareness',
            impact: 'growing',
            urgency: 'medium',
            businessImpact: '+23% in qualified leads from Canada/Mexico'
          }
        ]
      },

      // Technical Performance
      technical: {
        systemHealth: 99.7,
        apiCalls: {
          total: 12847,
          cached: 89.3,
          costs: 847,
          efficiency: 'excellent'
        },
        pageLoad: {
          avg: 1.8,
          mobile: 2.1,
          desktop: 1.6
        },
        errors: {
          total: 23,
          critical: 1,
          resolved: 91.3
        }
      },

      // Business Growth Metrics
      growth: {
        monthlyGrowth: 34.7,
        revenueGrowth: 42.1,
        leadQuality: 78.4,
        customerRetention: 89.2,
        referralRate: 23.8,
        expansionRevenue: 156000
      },

      // Strategic Recommendations
      recommendations: [
        {
          priority: 'critical',
          category: 'Partnership Flow',
          issue: '54.8% dropoff in partnership stage',
          solution: 'Implement instant partner matching with pre-qualification',
          expectedImpact: '+25% conversion rate',
          effort: 'medium',
          timeline: '2-3 weeks'
        },
        {
          priority: 'high',
          category: 'Product Intelligence',
          issue: 'HS Code complexity barrier',
          solution: 'AI-powered product suggestions with simplified interface',
          expectedImpact: '+15% completion rate',
          effort: 'high',
          timeline: '4-6 weeks'
        },
        {
          priority: 'high',
          category: 'Marcus AI',
          issue: 'High effectiveness but lower usage',
          solution: 'Proactive Marcus interventions at dropoff points',
          expectedImpact: '+20% engagement',
          effort: 'low',
          timeline: '1-2 weeks'
        }
      ]
    }

    setPlatformData(mockData)
    setLoading(false)
  }

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount/1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount/1000).toFixed(0)}K`
    return `$${Math.round(amount).toLocaleString()}`
  }

  const formatPercentage = (value) => `${value.toFixed(1)}%`

  const getPriorityColor = (priority) => {
    switch(priority.toLowerCase()) {
      case 'critical': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'info'
    }
  }

  const getHealthColor = (value) => {
    if (value >= 90) return 'success'
    if (value >= 70) return 'warning'
    return 'error'
  }

  if (loading || !platformData) {
    return (
      <div className="bloomberg-card">
        <div className="bloomberg-text-center bloomberg-p-xl">
          <div className="loading-spinner"></div>
          <h3>Loading Platform Intelligence...</h3>
          <p>Analyzing customer behavior and platform performance</p>
        </div>
      </div>
    )
  }

  return (
    <div className="platform-intelligence-dashboard">
      {/* Platform Performance Overview */}
      <div className="bloomberg-card bloomberg-mb-lg">
        <div className="bloomberg-card-header">
          <h2 className="bloomberg-card-title">📊 Platform Intelligence & Business Optimization</h2>
          <div className="bloomberg-status bloomberg-status-success">
            <div className="bloomberg-status-dot"></div>
            REAL-TIME INSIGHTS
          </div>
        </div>

        {/* Key Platform Metrics */}
        <div className="bloomberg-grid bloomberg-grid-4 bloomberg-mb-lg">
          <div className="bloomberg-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-success">{platformData.platform.totalUsers.toLocaleString()}</div>
              <div className="bloomberg-metric-label">Total Platform Users</div>
            </div>
            <div className="metric-change positive">+{platformData.growth.monthlyGrowth}% this month</div>
          </div>

          <div className="bloomberg-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-warning">{formatPercentage(platformData.platform.completionRate)}</div>
              <div className="bloomberg-metric-label">Journey Completion Rate</div>
            </div>
            <div className="metric-change neutral">Target: 75%</div>
          </div>

          <div className="bloomberg-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-success">{formatPercentage(platformData.platform.conversionToPartnership)}</div>
              <div className="bloomberg-metric-label">Partnership Conversion</div>
            </div>
            <div className="metric-change positive">Above industry avg</div>
          </div>

          <div className="bloomberg-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-info">{platformData.platform.avgSessionTime}</div>
              <div className="bloomberg-metric-label">Avg Session Time</div>
            </div>
            <div className="metric-change positive">High engagement</div>
          </div>
        </div>
      </div>

      {/* Customer Journey Analytics */}
      <div className="bloomberg-card bloomberg-mb-lg">
        <div className="bloomberg-card-header">
          <h3 className="bloomberg-card-title">🎯 Customer Journey Optimization</h3>
          <div className="bloomberg-status bloomberg-status-warning">OPTIMIZATION NEEDED</div>
        </div>

        <div className="journey-analysis">
          <div className="journey-stages">
            {platformData.journey.stages.map((stage, index) => (
              <div key={index} className="stage-item">
                <div className="stage-header">
                  <div className="stage-name">{stage.name}</div>
                  <div className="stage-completion">
                    <span className={`completion-rate ${getHealthColor(stage.completion)}`}>
                      {formatPercentage(stage.completion)}
                    </span>
                  </div>
                </div>
                
                <div className="stage-progress">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${getHealthColor(stage.completion)}`}
                      style={{width: `${stage.completion}%`}}
                    ></div>
                  </div>
                </div>

                <div className="stage-metrics">
                  <span className="metric-item">⏱️ {stage.avgTime}</span>
                  <span className="metric-item">📉 {formatPercentage(stage.dropoff)} dropoff</span>
                </div>
              </div>
            ))}
          </div>

          <div className="journey-insights bloomberg-mt-lg">
            <h4 className="insights-title">🔍 Critical Journey Insights</h4>
            {platformData.journey.insights.map((insight, index) => (
              <div key={index} className={`insight-item border-${getPriorityColor(insight.impact)}`}>
                <div className="insight-header">
                  <span className="insight-stage">{insight.stage} Stage</span>
                  <span className={`insight-priority ${getPriorityColor(insight.impact)}`}>
                    {insight.impact.toUpperCase()}
                  </span>
                </div>
                <div className="insight-issue">{insight.issue}</div>
                <div className="insight-recommendation">💡 {insight.recommendation}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Performance & Lead Generation */}
      <div className="bloomberg-grid bloomberg-grid-2 bloomberg-mb-lg">
        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">⚡ Feature Performance Analysis</h3>
            <div className="bloomberg-status bloomberg-status-info">DETAILED</div>
          </div>

          <div className="features-analysis">
            {platformData.features.map((feature, index) => (
              <div key={index} className="feature-item">
                <div className="feature-header">
                  <div className="feature-name">{feature.feature}</div>
                  <div className="feature-rating">⭐{feature.effectiveness}</div>
                </div>

                <div className="feature-metrics">
                  <div className="metric-row">
                    <span className="metric-label">Usage Rate:</span>
                    <span className="metric-value">{formatPercentage(feature.usage)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Lead Generation:</span>
                    <span className="metric-value text-success">{formatPercentage(feature.leadGeneration)}</span>
                  </div>
                </div>

                <div className="feature-feedback">
                  <em>"{feature.userFeedback}"</em>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">🎯 Market Opportunity Analysis</h3>
            <div className="bloomberg-status bloomberg-status-success">GROWING</div>
          </div>

          <div className="market-segments">
            {platformData.market.targetSegments.map((segment, index) => (
              <div key={index} className="segment-item">
                <div className="segment-header">
                  <div className="segment-name">{segment.segment}</div>
                  <div className={`segment-opportunity ${segment.opportunity}`}>
                    {segment.opportunity.toUpperCase()}
                  </div>
                </div>

                <div className="segment-metrics">
                  <div className="metric-grid">
                    <div className="metric-item">
                      <span className="metric-number">{segment.size.toLocaleString()}</span>
                      <span className="metric-label">Market Size</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-number">{formatPercentage(segment.penetration)}</span>
                      <span className="metric-label">Penetration</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-number">{formatCurrency(segment.avgDealSize)}</span>
                      <span className="metric-label">Avg Deal</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-number text-success">+{formatPercentage(segment.growthRate)}</span>
                      <span className="metric-label">Growth Rate</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technical Performance & Business Growth */}
      <div className="bloomberg-grid bloomberg-grid-2 bloomberg-mb-lg">
        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">⚙️ Technical Performance</h3>
            <div className="bloomberg-status bloomberg-status-success">OPTIMAL</div>
          </div>

          <div className="technical-metrics">
            <div className="tech-metric">
              <div className="tech-label">System Health</div>
              <div className="tech-value text-success">{formatPercentage(platformData.technical.systemHealth)}</div>
            </div>

            <div className="tech-metric">
              <div className="tech-label">API Efficiency</div>
              <div className="tech-value text-success">{formatPercentage(platformData.technical.apiCalls.cached)} cached</div>
              <div className="tech-detail">Costs: {formatCurrency(platformData.technical.apiCalls.costs)}/month</div>
            </div>

            <div className="tech-metric">
              <div className="tech-label">Page Load Speed</div>
              <div className="tech-value text-success">{platformData.technical.pageLoad.avg}s avg</div>
              <div className="tech-detail">Mobile: {platformData.technical.pageLoad.mobile}s | Desktop: {platformData.technical.pageLoad.desktop}s</div>
            </div>

            <div className="tech-metric">
              <div className="tech-label">Error Resolution</div>
              <div className="tech-value text-success">{formatPercentage(platformData.technical.errors.resolved)}</div>
              <div className="tech-detail">{platformData.technical.errors.critical} critical errors</div>
            </div>
          </div>
        </div>

        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">📈 Business Growth Intelligence</h3>
            <div className="bloomberg-status bloomberg-status-success">ACCELERATING</div>
          </div>

          <div className="growth-metrics">
            <div className="growth-metric">
              <div className="growth-value text-success">+{formatPercentage(platformData.growth.monthlyGrowth)}</div>
              <div className="growth-label">Monthly User Growth</div>
            </div>

            <div className="growth-metric">
              <div className="growth-value text-success">+{formatPercentage(platformData.growth.revenueGrowth)}</div>
              <div className="growth-label">Revenue Growth</div>
            </div>

            <div className="growth-metric">
              <div className="growth-value text-info">{formatPercentage(platformData.growth.leadQuality)}</div>
              <div className="growth-label">Lead Quality Score</div>
            </div>

            <div className="growth-metric">
              <div className="growth-value text-success">{formatPercentage(platformData.growth.customerRetention)}</div>
              <div className="growth-label">Customer Retention</div>
            </div>

            <div className="growth-highlight">
              <div className="highlight-value">{formatCurrency(platformData.growth.expansionRevenue)}</div>
              <div className="highlight-label">Expansion Revenue This Quarter</div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Recommendations */}
      <div className="bloomberg-card">
        <div className="bloomberg-card-header">
          <h3 className="bloomberg-card-title">🚀 Strategic Optimization Recommendations</h3>
          <div className="bloomberg-status bloomberg-status-warning">ACTION REQUIRED</div>
        </div>

        <div className="recommendations-list">
          {platformData.recommendations.map((rec, index) => (
            <div key={index} className={`recommendation-item priority-${rec.priority}`}>
              <div className="recommendation-header">
                <div className="rec-category">{rec.category}</div>
                <div className={`rec-priority ${getPriorityColor(rec.priority)}`}>
                  {rec.priority.toUpperCase()}
                </div>
              </div>

              <div className="rec-content">
                <div className="rec-issue">
                  <strong>Issue:</strong> {rec.issue}
                </div>
                <div className="rec-solution">
                  <strong>Solution:</strong> {rec.solution}
                </div>
                <div className="rec-impact">
                  <strong>Expected Impact:</strong> <span className="text-success">{rec.expectedImpact}</span>
                </div>
              </div>

              <div className="rec-implementation">
                <span className="rec-effort">Effort: {rec.effort}</span>
                <span className="rec-timeline">Timeline: {rec.timeline}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bloomberg-hero-actions bloomberg-mt-lg">
          <Link href="/foundation" className="bloomberg-btn bloomberg-btn-primary">
            Test Platform Changes →
          </Link>
          <button className="bloomberg-btn bloomberg-btn-secondary">
            Export Intelligence Report
          </button>
          <Link href="/analytics" className="bloomberg-btn bloomberg-btn-ghost">
            Deep Dive Analytics
          </Link>
        </div>
      </div>
    </div>
  )
}