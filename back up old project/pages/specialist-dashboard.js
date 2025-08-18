/**
 * 🇲🇽 SPECIALIST DASHBOARD
 * Where your husband sees qualified leads and manages his Mexico network
 * The missing piece - SPECIALIST COMMAND CENTER!
 */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import LegalFooter from '../components/LegalFooter'
import { Star, StarHalf, Shield, AlertTriangle, Eye, ThumbsUp, Users, TrendingUp, Clock } from 'lucide-react'

export default function SpecialistDashboard() {
  const [qualifiedLeads, setQualifiedLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('leads')
  const [notifications, setNotifications] = useState(0)

  useEffect(() => {
    loadQualifiedLeads()
    // Simulate real-time notifications
    const interval = setInterval(() => {
      setNotifications(prev => prev + Math.floor(Math.random() * 2))
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadQualifiedLeads = async () => {
    try {
      // 🚀 LIVE API - Connect to real qualified leads from calculator users!
      const response = await fetch('/api/specialist-leads')
      const data = await response.json()
      
      if (data.success && data.leads) {
        setQualifiedLeads(data.leads)
        setNotifications(data.leads.filter(lead => lead.status === 'NEW').length)
        console.log(`✅ Loaded ${data.leads.length} qualified leads from ${data.source}`)
      } else {
        console.warn('No qualified leads found, using fallback')
        setQualifiedLeads([])
        setNotifications(0)
      }
      
    } catch (error) {
      console.error('Failed to load qualified leads:', error)
      // Keep empty state on error - better UX than demo data
      setQualifiedLeads([])
      setNotifications(0)
    } finally {
      setLoading(false)
    }
  }

  const claimLead = async (leadId) => {
    try {
      // 🚀 LIVE API - Claim lead through specialist-leads API
      const response = await fetch('/api/specialist-leads?action=claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadId,
          specialistId: 'mexican_specialist_husband'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Update UI to show claimed status
        setQualifiedLeads(leads => 
          leads.map(lead => 
            lead.id === leadId 
              ? { ...lead, status: 'CLAIMED', claimedBy: 'You', claimedAt: new Date() }
              : lead
          )
        )
        
        // Show success message with next steps
        const nextSteps = result.nextSteps?.join('\n') || 'Contact Mexican specialists to begin implementation'
        
        alert(`🎉 Lead Claimed Successfully!

You now have access to this qualified lead and can begin reaching out to your Mexican specialist network.

Next Steps:
${nextSteps}`)
        
      } else {
        alert(`❌ Failed to claim lead: ${result.error}`)
      }
      
    } catch (error) {
      console.error('Failed to claim lead:', error)
      alert('❌ Network error. Please check your connection and try again.')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getTimeAgo = (date) => {
    const dateObj = date instanceof Date ? date : new Date(date)
    const hours = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60))
    if (hours < 1) return 'Less than 1 hour ago'
    if (hours === 1) return '1 hour ago'
    if (hours < 24) return `${hours} hours ago`
    const days = Math.floor(hours / 24)
    return days === 1 ? '1 day ago' : `${days} days ago`
  }

  // ENHANCED LEAD QUALITY SCORING WITH REVIEW SYSTEM
  const renderStarRating = (rating, totalReviews = 0) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />
        ))}
        {hasHalfStar && <StarHalf size={14} fill="#fbbf24" color="#fbbf24" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i} size={14} color="#d1d5db" />
        ))}
        {totalReviews > 0 && (
          <span style={{ marginLeft: '6px', fontSize: '12px', color: '#6b7280' }}>
            ({totalReviews})
          </span>
        )}
      </div>
    )
  }

  const calculateLeadQualityScore = (lead) => {
    let baseScore = lead.leadScore || 85
    
    // Enhanced scoring factors based on review history
    const reviewBonus = (lead.partnerReviewHistory?.averageRating || 0) * 5 // Up to 25 points
    const experienceBonus = Math.min((lead.partnerReviewHistory?.totalPartnerships || 0) * 2, 15) // Up to 15 points
    const reliabilityBonus = (lead.partnerReviewHistory?.successRate || 0) * 0.1 // Up to 10 points
    
    return Math.min(Math.round(baseScore + reviewBonus + experienceBonus + reliabilityBonus), 100)
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>🇲🇽 Specialist Dashboard - Loading...</title>
        </Head>
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner">🔄</div>
            <h2>Loading Specialist Dashboard...</h2>
            <p>Fetching qualified leads from Canada-Mexico network</p>
          </div>
        </div>
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #dc2626 0%, #ffffff 50%, #16a34a 100%);
          }
          .loading-content {
            text-align: center;
            background: white;
            padding: 3rem;
            border-radius: 1rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          }
          .loading-spinner {
            font-size: 3rem;
            animation: spin 2s linear infinite;
            margin-bottom: 1rem;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>🇲🇽 Specialist Dashboard - {notifications} New Leads</title>
        <style jsx global>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: #f8fafc;
            color: #1a202c;
          }
          .dashboard-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #dc2626 0%, #ffffff 25%, #16a34a 75%, #dc2626 100%);
            background-size: 400% 400%;
            animation: gradient 20s ease infinite;
          }
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .dashboard-header {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-bottom: 3px solid #dc2626;
            padding: 1rem 2rem;
            margin-bottom: 2rem;
          }
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1400px;
            margin: 0 auto;
          }
          .header-left h1 {
            font-size: 2rem;
            font-weight: 800;
            color: #dc2626;
            margin-bottom: 0.5rem;
          }
          .header-left p {
            color: #6b7280;
            font-weight: 500;
          }
          .header-stats {
            display: flex;
            gap: 2rem;
            align-items: center;
          }
          .stat-item {
            text-align: center;
            padding: 0.5rem 1rem;
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .stat-number {
            font-size: 1.5rem;
            font-weight: 800;
            color: #dc2626;
          }
          .stat-label {
            font-size: 0.8rem;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .notification-badge {
            background: #ef4444;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: bold;
            animation: pulse 2s infinite;
          }
          .dashboard-main {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 2rem;
          }
          .dashboard-tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
          }
          .tab-button {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            background: white;
            color: #6b7280;
          }
          .tab-button.active {
            background: linear-gradient(135deg, #dc2626, #16a34a);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
          }
          .leads-grid {
            display: grid;
            gap: 1.5rem;
            margin-bottom: 2rem;
          }
          .lead-card {
            background: white;
            border-radius: 1rem;
            padding: 2rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border: 2px solid transparent;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
          }
          .lead-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.15);
          }
          .lead-card.platinum {
            border-color: #fbbf24;
            background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
          }
          .lead-card.gold {
            border-color: #f59e0b;
            background: linear-gradient(135deg, #fef3c7 0%, #ffffff 100%);
          }
          .lead-card.silver {
            border-color: #9ca3af;
            background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
          }
          .lead-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
          }
          .lead-title {
            font-size: 1.5rem;
            font-weight: 800;
            color: #1a202c;
            margin-bottom: 0.5rem;
          }
          .lead-subtitle {
            color: #6b7280;
            font-weight: 500;
          }
          .lead-badges {
            display: flex;
            gap: 0.5rem;
            flex-direction: column;
            align-items: flex-end;
          }
          .tier-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
          }
          .tier-badge.platinum {
            background: #fbbf24;
            color: white;
          }
          .tier-badge.gold {
            background: #f59e0b;
            color: white;
          }
          .tier-badge.silver {
            background: #9ca3af;
            color: white;
          }
          .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.8rem;
            font-weight: 600;
          }
          .status-badge.new {
            background: #ef4444;
            color: white;
            animation: pulse 2s infinite;
          }
          .status-badge.claimed {
            background: #16a34a;
            color: white;
          }
          .lead-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .metric-item {
            text-align: center;
            padding: 1rem;
            background: rgba(255,255,255,0.7);
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
          }
          .metric-value {
            font-size: 1.25rem;
            font-weight: 800;
            color: #dc2626;
            margin-bottom: 0.25rem;
          }
          .metric-label {
            font-size: 0.8rem;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .lead-requirements {
            margin-bottom: 1.5rem;
          }
          .requirements-title {
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.5rem;
          }
          .requirements-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .requirement-tag {
            background: #dbeafe;
            color: #1e40af;
            padding: 0.25rem 0.75rem;
            border-radius: 0.25rem;
            font-size: 0.8rem;
            font-weight: 500;
          }
          .lead-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
          }
          .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            font-size: 0.9rem;
          }
          .btn-primary {
            background: linear-gradient(135deg, #dc2626, #16a34a);
            color: white;
          }
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
          }
          .btn-secondary {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
          }
          .btn-secondary:hover {
            background: #e5e7eb;
          }
          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          .time-ago {
            position: absolute;
            top: 1rem;
            right: 1rem;
            font-size: 0.8rem;
            color: #9ca3af;
            background: rgba(255,255,255,0.8);
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
          }
          .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            background: white;
            border-radius: 1rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .empty-state-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          .empty-state-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #374151;
            margin-bottom: 0.5rem;
          }
          .empty-state-description {
            color: #6b7280;
            max-width: 400px;
            margin: 0 auto;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}</style>
      </Head>

      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1>🇲🇽 Specialist Dashboard</h1>
              <p>Canada-Mexico USMCA Network • Qualified Lead Management</p>
            </div>
            <div className="header-stats">
              <div className="stat-item">
                <div className="stat-number">{qualifiedLeads.filter(l => l.status === 'NEW').length}</div>
                <div className="stat-label">New Leads</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">
                  {formatCurrency(qualifiedLeads.reduce((sum, lead) => sum + lead.specialistFeePool, 0))}
                </div>
                <div className="stat-label">Total Fee Pool</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{qualifiedLeads.filter(l => l.status === 'CLAIMED').length}</div>
                <div className="stat-label">Claimed</div>
              </div>
              {notifications > 0 && (
                <div className="notification-badge">{notifications}</div>
              )}
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="dashboard-tabs">
            <button 
              className={`tab-button ${activeTab === 'leads' ? 'active' : ''}`}
              onClick={() => setActiveTab('leads')}
            >
              🔥 Qualified Leads ({qualifiedLeads.length})
            </button>
            <button 
              className={`tab-button ${activeTab === 'network' ? 'active' : ''}`}
              onClick={() => setActiveTab('network')}
            >
              🌐 Mexico Network
            </button>
            <button 
              className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              📊 Performance
            </button>
          </div>

          {activeTab === 'leads' && (
            <div className="leads-grid">
              {qualifiedLeads.length > 0 ? (
                qualifiedLeads.map(lead => (
                  <div key={lead.id} className={`lead-card ${lead.tier.toLowerCase()}`}>
                    <div className="time-ago">{getTimeAgo(lead.submittedAt)}</div>
                    
                    <div className="lead-header">
                      <div>
                        <div className="lead-title">{lead.companyName}</div>
                        <div className="lead-subtitle">
                          {lead.businessType} • {lead.importVolume} from {lead.supplierCountry}
                        </div>
                      </div>
                      <div className="lead-badges">
                        <div className={`tier-badge ${lead.tier.toLowerCase()}`}>{lead.tier}</div>
                        <div className={`status-badge ${lead.status.toLowerCase()}`}>
                          {lead.status === 'NEW' ? '🔥 NEW' : '✅ CLAIMED'}
                        </div>
                      </div>
                    </div>

                    <div className="lead-metrics">
                      <div className="metric-item">
                        <div className="metric-value">{formatCurrency(lead.totalSavings)}</div>
                        <div className="metric-label">Total Savings</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value">{formatCurrency(lead.specialistFeePool)}</div>
                        <div className="metric-label">Fee Pool</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value">{calculateLeadQualityScore(lead)}/100</div>
                        <div className="metric-label">Quality Score</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value">{lead.timeline}</div>
                        <div className="metric-label">Timeline</div>
                      </div>
                    </div>

                    {/* ENHANCED PARTNER REVIEW SECTION */}
                    {lead.partnerReviewHistory && (
                      <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #16a34a',
                        borderRadius: '8px',
                        padding: '12px',
                        margin: '12px 0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <Shield size={16} style={{ color: '#16a34a', marginRight: '6px' }} />
                          <span style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '14px' }}>
                            Cliente con historial verificado
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            {renderStarRating(lead.partnerReviewHistory.averageRating, lead.partnerReviewHistory.totalReviews)}
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                              {lead.partnerReviewHistory.totalPartnerships} partnerships anteriores
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#16a34a' }}>
                              {lead.partnerReviewHistory.successRate}%
                            </div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>Tasa de éxito</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* RECOMMENDED MEXICAN PARTNERS */}
                    {lead.recommendedPartners && lead.recommendedPartners.length > 0 && (
                      <div style={{
                        background: '#fefce8',
                        border: '1px solid #eab308',
                        borderRadius: '8px',
                        padding: '12px',
                        margin: '12px 0'
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#a16207', marginBottom: '8px' }}>
                          🇲🇽 Partners recomendados basados en reseñas:
                        </div>
                        {lead.recommendedPartners.slice(0, 2).map((partner, idx) => (
                          <div key={idx} style={{ marginBottom: '6px', fontSize: '12px' }}>
                            <span style={{ fontWeight: 'bold' }}>{partner.name}</span>
                            <span style={{ marginLeft: '8px' }}>
                              {renderStarRating(partner.rating, partner.reviews)}
                            </span>
                            <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                              {partner.specialization}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="lead-requirements">
                      <div className="requirements-title">Mexican Specialist Requirements:</div>
                      <div className="requirements-list">
                        {lead.requirements.map((req, index) => (
                          <span key={index} className="requirement-tag">{req}</span>
                        ))}
                      </div>
                    </div>

                    <div className="lead-actions">
                      {lead.status === 'NEW' ? (
                        <>
                          <button 
                            className="btn btn-secondary"
                            onClick={() => alert(`📋 Lead Details:\n\nRoute: ${lead.route}\nUrgency: ${lead.urgency}\nSupplier: ${lead.supplierCountry}\n\nNext: Claim lead to access contact information`)}
                          >
                            📋 View Details
                          </button>
                          <button 
                            className="btn btn-primary"
                            onClick={() => claimLead(lead.id)}
                          >
                            🇲🇽 Claim Lead
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-secondary">
                            📞 Contact Info
                          </button>
                          <button className="btn btn-primary">
                            📊 Manage Lead
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">No Qualified Leads Yet</div>
                  <div className="empty-state-description">
                    When companies use the Canada-Mexico USMCA calculator and qualify for specialist support, 
                    their leads will appear here for you to claim and manage.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'network' && (
            <div className="empty-state">
              <div className="empty-state-icon">🌐</div>
              <div className="empty-state-title">Mexico Specialist Network</div>
              <div className="empty-state-description">
                Manage your Mexican specialist network, track performance, and coordinate implementations.
                Network management features coming soon.
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-title">Performance Analytics</div>
              <div className="empty-state-description">
                Track conversion rates, revenue generated, and specialist network performance.
                Analytics dashboard coming soon.
              </div>
            </div>
          )}
        </main>
      </div>

      <LegalFooter showBeta={true} />
    </>
  )
}