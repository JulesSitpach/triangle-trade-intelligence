/**
 * IMPLEMENTATION DASHBOARD - Project Tracking & Timeline
 * Enterprise-grade project management for Triangle Intelligence implementation
 * Bloomberg Terminal style with milestone tracking and risk monitoring
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ImplementationDashboard({ data }) {
  const [implementationPlan, setImplementationPlan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (data) {
      generateImplementationPlan(data)
    }
  }, [data])

  const generateImplementationPlan = (analysisData) => {
    const { foundation, product, routing } = analysisData
    
    // Calculate complexity based on business profile
    const complexity = calculateComplexity(foundation)
    const timeline = calculateTimeline(complexity, foundation.importVolume)
    
    // Generate milestones
    const milestones = generateMilestones(foundation, product, routing, timeline)
    
    // Risk assessment
    const risks = assessImplementationRisks(foundation, product)
    
    // Resource requirements
    const resources = calculateResourceRequirements(foundation, complexity)
    
    const plan = {
      // Project Overview
      projectId: `TI-${Date.now().toString().slice(-6)}`,
      complexity: complexity,
      totalTimeline: timeline.total,
      phases: timeline.phases,
      
      // Current Status
      currentPhase: 'Planning',
      overallProgress: 15, // 15% - analysis complete
      nextMilestone: milestones[0],
      
      // Milestones & Timeline
      milestones: milestones,
      criticalPath: identifyCriticalPath(milestones),
      
      // Risk Management
      risks: risks,
      riskLevel: calculateOverallRisk(risks),
      
      // Resources & Budget
      resources: resources,
      estimatedCost: resources.totalCost,
      
      // Success Metrics
      successCriteria: generateSuccessCriteria(foundation, routing),
      expectedROI: calculateExpectedROI(foundation),
      
      // Stakeholders
      stakeholders: identifyStakeholders(foundation),
      
      // Dependencies
      dependencies: identifyDependencies(foundation, product)
    }
    
    setImplementationPlan(plan)
    setLoading(false)
  }

  const calculateComplexity = (foundation) => {
    let score = 0
    
    // Business complexity factors
    if (foundation.businessType === 'Manufacturing') score += 3
    if (foundation.businessType === 'Electronics') score += 4
    if (foundation.businessType === 'Automotive') score += 5
    
    // Volume complexity
    const volume = getVolumeValue(foundation.importVolume)
    if (volume > 25000000) score += 4
    else if (volume > 5000000) score += 3
    else if (volume > 1000000) score += 2
    else score += 1
    
    // Geographic complexity
    if (foundation.primarySupplierCountry === 'CN') score += 3
    if (foundation.secondarySuppliers?.length > 2) score += 2
    
    if (score <= 5) return 'Simple'
    if (score <= 10) return 'Moderate'
    if (score <= 15) return 'Complex'
    return 'Enterprise'
  }

  const calculateTimeline = (complexity, volume) => {
    const baseWeeks = {
      'Simple': 8,
      'Moderate': 12,
      'Complex': 18,
      'Enterprise': 24
    }
    
    const total = baseWeeks[complexity]
    
    return {
      total: `${total} weeks`,
      phases: {
        planning: Math.ceil(total * 0.2),
        partnership: Math.ceil(total * 0.3),
        implementation: Math.ceil(total * 0.4),
        optimization: Math.ceil(total * 0.1)
      }
    }
  }

  const generateMilestones = (foundation, product, routing, timeline) => {
    const today = new Date()
    const milestones = []
    
    // Phase 1: Planning & Analysis
    milestones.push({
      id: 'M1',
      phase: 'Planning',
      title: 'Trade Analysis Complete',
      description: 'Complete business profile and product classification',
      status: 'completed',
      dueDate: addWeeks(today, 1),
      completedDate: today,
      owner: 'Triangle Intelligence',
      priority: 'high',
      dependencies: []
    })
    
    milestones.push({
      id: 'M2',
      phase: 'Planning',
      title: 'Route Optimization Validated',
      description: 'USMCA triangle routes identified and validated',
      status: 'in_progress',
      dueDate: addWeeks(today, 2),
      owner: 'Triangle Intelligence',
      priority: 'high',
      dependencies: ['M1']
    })
    
    // Phase 2: Partnership Setup
    milestones.push({
      id: 'M3',
      phase: 'Partnership',
      title: 'Mexico Partner Identified',
      description: 'Secure qualified Mexico distributor/partner',
      status: 'pending',
      dueDate: addWeeks(today, 4),
      owner: 'Business Development',
      priority: 'critical',
      dependencies: ['M2']
    })
    
    milestones.push({
      id: 'M4',
      phase: 'Partnership',
      title: 'Canada Partner Identified',
      description: 'Secure qualified Canada distributor/partner',
      status: 'pending',
      dueDate: addWeeks(today, 5),
      owner: 'Business Development',
      priority: 'critical',
      dependencies: ['M2']
    })
    
    milestones.push({
      id: 'M5',
      phase: 'Partnership',
      title: 'Legal Framework Complete',
      description: 'Partnership agreements and compliance documentation',
      status: 'pending',
      dueDate: addWeeks(today, 7),
      owner: 'Legal Team',
      priority: 'high',
      dependencies: ['M3', 'M4']
    })
    
    // Phase 3: Implementation
    milestones.push({
      id: 'M6',
      phase: 'Implementation',
      title: 'First Triangle Shipment',
      description: 'Execute first USMCA triangle route',
      status: 'pending',
      dueDate: addWeeks(today, 10),
      owner: 'Operations',
      priority: 'critical',
      dependencies: ['M5']
    })
    
    milestones.push({
      id: 'M7',
      phase: 'Implementation',
      title: 'Process Automation',
      description: 'Automated routing and documentation systems',
      status: 'pending',
      dueDate: addWeeks(today, 14),
      owner: 'Technology',
      priority: 'medium',
      dependencies: ['M6']
    })
    
    // Phase 4: Optimization
    milestones.push({
      id: 'M8',
      phase: 'Optimization',
      title: 'Full-Scale Operation',
      description: 'Scale to target volume with optimized processes',
      status: 'pending',
      dueDate: addWeeks(today, timeline.phases.planning + timeline.phases.partnership + timeline.phases.implementation),
      owner: 'Operations',
      priority: 'high',
      dependencies: ['M7']
    })
    
    return milestones
  }

  const assessImplementationRisks = (foundation, product) => {
    const risks = []
    
    // Partnership Risk
    risks.push({
      category: 'Partnership',
      risk: 'Partner Qualification Delays',
      impact: 'High',
      probability: 'Medium',
      mitigation: 'Pre-qualified partner network, backup options',
      status: 'monitored'
    })
    
    // Regulatory Risk
    risks.push({
      category: 'Regulatory',
      risk: 'USMCA Compliance Requirements',
      impact: 'High',
      probability: 'Low',
      mitigation: 'Expert legal review, compliance templates',
      status: 'controlled'
    })
    
    // Market Risk
    if (foundation.primarySupplierCountry === 'CN') {
      risks.push({
        category: 'Market',
        risk: 'China Trade Policy Changes',
        impact: 'Medium',
        probability: 'High',
        mitigation: 'Diversified supplier base, rapid response protocols',
        status: 'active'
      })
    }
    
    // Operational Risk
    risks.push({
      category: 'Operational',
      risk: 'Supply Chain Disruption',
      impact: 'Medium',
      probability: 'Medium',
      mitigation: 'Multiple routes, inventory buffers',
      status: 'monitored'
    })
    
    return risks
  }

  const calculateResourceRequirements = (foundation, complexity) => {
    const baseHours = {
      'Simple': 120,
      'Moderate': 240,
      'Complex': 480,
      'Enterprise': 720
    }
    
    const hours = baseHours[complexity]
    const hourlyRate = 150 // Blended rate
    
    return {
      totalHours: hours,
      totalCost: hours * hourlyRate,
      breakdown: {
        projectManagement: Math.ceil(hours * 0.25),
        businessDevelopment: Math.ceil(hours * 0.35),
        legal: Math.ceil(hours * 0.20),
        operations: Math.ceil(hours * 0.20)
      }
    }
  }

  const addWeeks = (date, weeks) => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + (weeks * 7))
    return newDate
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

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'success'
      case 'in_progress': return 'warning'
      case 'pending': return 'info'
      case 'blocked': return 'error'
      default: return 'info'
    }
  }

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'info'
    }
  }

  if (loading || !implementationPlan) {
    return (
      <div className="bloomberg-card">
        <div className="bloomberg-text-center bloomberg-p-xl">
          <div className="loading-spinner"></div>
          <h3>Generating Implementation Plan...</h3>
          <p>Analyzing complexity and creating project roadmap</p>
        </div>
      </div>
    )
  }

  return (
    <div className="implementation-dashboard">
      {/* Project Overview Header */}
      <div className="bloomberg-card bloomberg-mb-lg">
        <div className="bloomberg-card-header">
          <h2 className="bloomberg-card-title">🎯 Implementation Dashboard</h2>
          <div className="bloomberg-status bloomberg-status-info">
            <div className="bloomberg-status-dot"></div>
            PROJECT {implementationPlan.projectId}
          </div>
        </div>

        {/* Key Project Metrics */}
        <div className="bloomberg-grid bloomberg-grid-4 bloomberg-mb-lg">
          <div className="bloomberg-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-info">{implementationPlan.totalTimeline}</div>
              <div className="bloomberg-metric-label">Total Timeline</div>
            </div>
            <div className="bloomberg-card-subtitle">{implementationPlan.complexity} Implementation</div>
          </div>

          <div className="bloomberg-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-warning">{implementationPlan.overallProgress}%</div>
              <div className="bloomberg-metric-label">Overall Progress</div>
            </div>
            <div className="bloomberg-card-subtitle">Analysis Phase Complete</div>
          </div>

          <div className="bloomberg-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-primary">{formatCurrency(implementationPlan.estimatedCost)}</div>
              <div className="bloomberg-metric-label">Implementation Cost</div>
            </div>
            <div className="bloomberg-card-subtitle">{implementationPlan.resources.totalHours} hours</div>
          </div>

          <div className="bloomberg-card">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value text-success">{implementationPlan.riskLevel}</div>
              <div className="bloomberg-metric-label">Risk Level</div>
            </div>
            <div className="bloomberg-card-subtitle">{implementationPlan.risks.length} risks monitored</div>
          </div>
        </div>

        {/* Current Phase Status */}
        <div className="bloomberg-card border-info">
          <div className="bloomberg-flex">
            <div>
              <h4 className="bloomberg-card-title">Current Phase: {implementationPlan.currentPhase}</h4>
              <p className="bloomberg-card-subtitle">
                Next Milestone: {implementationPlan.nextMilestone?.title} 
                (Due: {formatDate(implementationPlan.nextMilestone?.dueDate)})
              </p>
            </div>
            <Link href="/partnership" className="bloomberg-btn bloomberg-btn-primary">
              Advance Project →
            </Link>
          </div>
        </div>
      </div>

      {/* Project Timeline & Milestones */}
      <div className="bloomberg-grid bloomberg-grid-2 bloomberg-mb-lg">
        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">📅 Project Timeline</h3>
            <div className="bloomberg-status bloomberg-status-info">ACTIVE</div>
          </div>

          <div className="timeline-container">
            {implementationPlan.milestones.map((milestone, index) => (
              <div key={milestone.id} className="timeline-item">
                <div className="timeline-connector">
                  <div className={`timeline-dot ${getStatusColor(milestone.status)}`}></div>
                  {index < implementationPlan.milestones.length - 1 && (
                    <div className="timeline-line"></div>
                  )}
                </div>
                
                <div className="timeline-content">
                  <div className="timeline-header">
                    <div className="timeline-title">{milestone.title}</div>
                    <div className={`bloomberg-status bloomberg-status-${getStatusColor(milestone.status)} small`}>
                      {milestone.status.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="timeline-details">
                    <div className="timeline-description">{milestone.description}</div>
                    <div className="timeline-meta">
                      <span className="timeline-owner">Owner: {milestone.owner}</span>
                      <span className="timeline-date">Due: {formatDate(milestone.dueDate)}</span>
                      <span className={`timeline-priority priority-${milestone.priority}`}>
                        {milestone.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">⚠️ Risk Management</h3>
            <div className="bloomberg-status bloomberg-status-warning">MONITOR</div>
          </div>

          <div className="risk-list">
            {implementationPlan.risks.map((risk, index) => (
              <div key={index} className="risk-item">
                <div className="risk-header">
                  <div className="risk-category">{risk.category}</div>
                  <div className={`risk-impact impact-${risk.impact.toLowerCase()}`}>
                    {risk.impact.toUpperCase()}
                  </div>
                </div>
                
                <div className="risk-title">{risk.risk}</div>
                <div className="risk-mitigation">{risk.mitigation}</div>
                
                <div className="risk-footer">
                  <div className="risk-probability">Probability: {risk.probability}</div>
                  <div className={`risk-status status-${risk.status}`}>{risk.status.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resource Allocation & Phase Breakdown */}
      <div className="bloomberg-grid bloomberg-grid-2 bloomberg-mb-lg">
        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">👥 Resource Allocation</h3>
            <div className="bloomberg-status bloomberg-status-success">PLANNED</div>
          </div>

          <div className="bloomberg-grid bloomberg-grid-2 bloomberg-mb-lg">
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value">{implementationPlan.resources.totalHours}</div>
              <div className="bloomberg-metric-label">Total Hours</div>
            </div>
            <div className="bloomberg-metric">
              <div className="bloomberg-metric-value">{formatCurrency(implementationPlan.resources.totalCost)}</div>
              <div className="bloomberg-metric-label">Total Investment</div>
            </div>
          </div>

          <div className="resource-breakdown">
            {Object.entries(implementationPlan.resources.breakdown).map(([role, hours]) => (
              <div key={role} className="resource-item">
                <div className="resource-role">{role.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                <div className="resource-allocation">
                  <div className="allocation-bar">
                    <div 
                      className="allocation-fill" 
                      style={{width: `${(hours / implementationPlan.resources.totalHours) * 100}%`}}
                    ></div>
                  </div>
                  <div className="allocation-hours">{hours}h</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bloomberg-card">
          <div className="bloomberg-card-header">
            <h3 className="bloomberg-card-title">📊 Phase Breakdown</h3>
            <div className="bloomberg-status bloomberg-status-info">SCHEDULED</div>
          </div>

          <div className="phase-breakdown">
            {Object.entries(implementationPlan.phases).map(([phase, weeks]) => (
              <div key={phase} className="phase-item">
                <div className="phase-header">
                  <div className="phase-name">{phase.charAt(0).toUpperCase() + phase.slice(1)}</div>
                  <div className="phase-duration">{weeks} weeks</div>
                </div>
                <div className="phase-progress">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${phase === 'planning' ? 'active' : ''}`}
                      style={{width: phase === 'planning' ? '80%' : '0%'}}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Success Criteria & Next Actions */}
      <div className="bloomberg-card">
        <div className="bloomberg-card-header">
          <h3 className="bloomberg-card-title">🎯 Success Criteria & Next Actions</h3>
          <div className="bloomberg-status bloomberg-status-success">DEFINED</div>
        </div>

        <div className="bloomberg-grid bloomberg-grid-2">
          <div>
            <h4 className="bloomberg-card-title bloomberg-mb-md">Success Metrics</h4>
            <ul className="success-criteria">
              <li>✅ USMCA triangle routes operational within timeline</li>
              <li>✅ 0% tariff rate achieved and maintained</li>
              <li>✅ Target savings of {formatCurrency(getVolumeValue(data?.foundation?.importVolume) * 0.30)} realized</li>
              <li>✅ ROI breakeven within {Math.ceil(45000 / ((getVolumeValue(data?.foundation?.importVolume) * 0.38) / 12))} months</li>
              <li>✅ Compliance maintained across all jurisdictions</li>
              <li>✅ Scalable processes established for growth</li>
            </ul>
          </div>

          <div>
            <h4 className="bloomberg-card-title bloomberg-mb-md">Immediate Actions</h4>
            <div className="action-items">
              <div className="action-item priority-high">
                <div className="action-indicator"></div>
                <div className="action-content">
                  <div className="action-title">Initiate Partner Qualification</div>
                  <div className="action-owner">Business Development Team</div>
                </div>
                <div className="action-deadline">This Week</div>
              </div>

              <div className="action-item priority-medium">
                <div className="action-indicator"></div>
                <div className="action-content">
                  <div className="action-title">Legal Framework Review</div>
                  <div className="action-owner">Legal & Compliance</div>
                </div>
                <div className="action-deadline">Next Week</div>
              </div>

              <div className="action-item">
                <div className="action-indicator"></div>
                <div className="action-content">
                  <div className="action-title">Operations Planning</div>
                  <div className="action-owner">Operations Team</div>
                </div>
                <div className="action-deadline">Week 3</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bloomberg-hero-actions bloomberg-mt-lg">
          <Link href="/partnership" className="bloomberg-btn bloomberg-btn-primary">
            Start Partnership Phase →
          </Link>
          <Link href="/alerts" className="bloomberg-btn bloomberg-btn-secondary">
            Setup Monitoring
          </Link>
          <button className="bloomberg-btn bloomberg-btn-ghost">
            Export Project Plan
          </button>
        </div>
      </div>
    </div>
  )
}