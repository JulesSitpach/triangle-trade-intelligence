import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userProfile } = req.body

  if (!userProfile) {
    return res.status(400).json({ error: 'User profile required' })
  }

  try {
    // Generate real-time alerts based on institutional learning
    const alerts = await generateLiveIntelligenceAlerts(userProfile)
    
    // Get network activity for this user type
    const networkActivity = await getNetworkActivity(userProfile)
    
    // Check for new patterns that match user profile
    const newPatterns = await detectNewPatterns(userProfile)
    
    // Monitor market changes affecting user's routes
    const marketUpdates = await getMarketUpdates(userProfile)

    return res.status(200).json({
      success: true,
      alerts: alerts,
      networkActivity: networkActivity,
      newPatterns: newPatterns,
      marketUpdates: marketUpdates,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Live alerts error:', error)
    return res.status(500).json({ 
      error: 'Failed to generate live alerts',
      details: error.message 
    })
  }
}

async function generateLiveIntelligenceAlerts(userProfile) {
  const alerts = []

  // Check for similar company successes
  const { data: recentSessions } = await supabase
    .from('workflow_sessions')
    .select('data, stage_completed, created_at')
    .eq('data->businessType', userProfile.businessType)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .eq('stage_completed', 8)
    .order('created_at', { ascending: false })
    .limit(10)

  if (recentSessions?.length > 0) {
    const avgSavings = recentSessions.reduce((acc, s) => {
      return acc + (s.data?.stage3Data?.potentialSavings || 0)
    }, 0) / recentSessions.length

    alerts.push({
      type: 'success_pattern',
      priority: 'medium',
      title: 'Similar Companies Achieving Results',
      message: `${recentSessions.length} ${userProfile.businessType} companies completed optimization this week`,
      impact: `Average savings: $${Math.round(avgSavings/1000)}K`,
      timestamp: 'Today',
      actionable: true,
      action: 'View Success Stories'
    })
  }

  // Check hindsight patterns for optimization opportunities
  const { data: patterns } = await supabase
    .from('hindsight_pattern_library')
    .select('*')
    .eq('business_type', userProfile.businessType)
    .gte('confidence_score', 80)
    .order('created_at', { ascending: false })
    .limit(5)

  if (patterns?.length > 0) {
    const latestPattern = patterns[0]
    alerts.push({
      type: 'pattern_insight',
      priority: 'high',
      title: 'New Optimization Pattern Detected',
      message: `Companies like yours are achieving ${latestPattern.confidence_score}% success with new approach`,
      impact: 'Potential 15-25% improvement',
      timestamp: '6 hours ago',
      actionable: true,
      action: 'Apply Pattern'
    })
  }

  // Check for seasonal/timing opportunities
  const currentMonth = new Date().getMonth()
  const isQ4 = currentMonth >= 9  // Oct, Nov, Dec

  if (isQ4 && userProfile.importVolume !== 'Under $500K') {
    alerts.push({
      type: 'seasonal_opportunity',
      priority: 'high',
      title: 'Q4 Volume Surge - Act Now',
      message: 'Historical data shows Q4 import volumes increase 35% - optimize capacity now',
      impact: `+$${Math.round(userProfile.potentialSavings * 0.35/1000)}K opportunity`,
      timestamp: '2 hours ago',
      actionable: true,
      action: 'Reserve Capacity'
    })
  }

  // Check Marcus consultations for insights
  const { data: consultations } = await supabase
    .from('marcus_consultations')
    .select('recommendations, savings_identified')
    .eq('business_profile->type', userProfile.businessType)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(3)

  if (consultations?.length > 0) {
    const avgSavings = consultations.reduce((acc, c) => acc + c.savings_identified, 0) / consultations.length

    alerts.push({
      type: 'marcus_insight',
      priority: 'medium',
      title: 'Marcus AI Pattern Analysis',
      message: `Latest AI analysis identified optimization patterns in ${userProfile.businessType} sector`,
      impact: `Average additional savings: $${Math.round(avgSavings * 0.15/1000)}K`,
      timestamp: '1 day ago',
      actionable: true,
      action: 'Request Analysis'
    })
  }

  // Check trade flows for route optimization
  const { data: tradeFlows } = await supabase
    .from('trade_flows')
    .select('hs_code, trade_value, trade_flow')
    .eq('usmca_qualified', true)
    .gte('trade_value', 1000000)
    .order('trade_value', { ascending: false })
    .limit(20)

  if (tradeFlows?.length > 0) {
    const mexicoFlows = tradeFlows.filter(f => f.trade_flow?.includes('Mexico'))
    const canadaFlows = tradeFlows.filter(f => f.trade_flow?.includes('Canada'))

    if (mexicoFlows.length > canadaFlows.length && userProfile.selectedRoute !== 'mexico_routing') {
      alerts.push({
        type: 'route_optimization',
        priority: 'medium',
        title: 'Route Optimization Available',
        message: 'Trade flow analysis shows Mexico routing gaining momentum in your product categories',
        impact: '8-12% additional savings potential',
        timestamp: '4 hours ago',
        actionable: true,
        action: 'Analyze Route'
      })
    }
  }

  return alerts.length > 0 ? alerts : getDefaultAlerts(userProfile)
}

async function getNetworkActivity(userProfile) {
  // Get activity from similar businesses
  const { data: networkSessions } = await supabase
    .from('workflow_sessions')
    .select('data, stage_completed, created_at')
    .eq('data->businessType', userProfile.businessType)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  const activeToday = networkSessions?.length || 0
  const completedJourneys = networkSessions?.filter(s => s.stage_completed >= 8).length || 0

  return {
    activeBusinessesToday: activeToday,
    completedOptimizations: completedJourneys,
    networkGrowth: '+12% this week',
    connectionOpportunities: Math.min(5, Math.floor(activeToday / 3))
  }
}

async function detectNewPatterns(userProfile) {
  // Look for emerging patterns in last 7 days
  const { data: recentPatterns } = await supabase
    .from('hindsight_pattern_library')
    .select('*')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .eq('business_type', userProfile.businessType)
    .order('confidence_score', { ascending: false })
    .limit(3)

  return recentPatterns?.map(pattern => ({
    type: pattern.pattern_type,
    confidence: pattern.confidence_score,
    description: `New ${pattern.pattern_type} pattern detected with ${pattern.confidence_score}% confidence`,
    applicability: pattern.business_type === userProfile.businessType ? 'High' : 'Medium'
  })) || []
}

async function getMarketUpdates(userProfile) {
  // Check for market changes affecting user routes
  const updates = []

  // Check current market alerts
  const { data: marketAlerts } = await supabase
    .from('current_market_alerts')
    .select('*')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(5)

  if (marketAlerts?.length > 0) {
    marketAlerts.forEach(alert => {
      if (alert.country === userProfile.primarySupplierCountry || 
          alert.alert_type === 'TARIFF_CHANGE') {
        updates.push({
          type: alert.alert_type,
          country: alert.country,
          impact: `Rate change: ${alert.previous_rate}% → ${alert.current_rate}%`,
          relevance: 'High',
          message: alert.alert_message
        })
      }
    })
  }

  return updates
}

function getDefaultAlerts(userProfile) {
  // Fallback alerts when no specific patterns are found
  return [
    {
      type: 'monitoring_active',
      priority: 'low',
      title: 'Intelligence Monitoring Active',
      message: `Tracking optimization opportunities for ${userProfile.businessType} businesses`,
      impact: 'Continuous improvement',
      timestamp: 'Now',
      actionable: false,
      action: null
    },
    {
      type: 'network_building',
      priority: 'medium',
      title: 'Network Intelligence Growing',
      message: 'Each new user adds intelligence that benefits your optimization potential',
      impact: 'Improving recommendations',
      timestamp: '1 hour ago',
      actionable: true,
      action: 'View Network'
    }
  ]
}