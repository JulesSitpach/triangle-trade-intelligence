/**
 * Marcus Intelligence Dashboard API
 * Real-time question pattern analysis and business intelligence
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📊 Generating Marcus Intelligence Dashboard...')
    
    const dashboard = await generateIntelligenceDashboard()
    
    return res.status(200).json({
      success: true,
      dashboard: dashboard,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Marcus dashboard error:', error)
    return res.status(500).json({ 
      error: 'Failed to generate intelligence dashboard',
      success: false
    })
  }
}

async function generateIntelligenceDashboard() {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Get question patterns data
  const { data: allPatterns } = await supabase
    .from('marcus_question_patterns')
    .select('*')
    .gte('created_at', monthAgo.toISOString())
    .order('created_at', { ascending: false })

  if (!allPatterns || allPatterns.length === 0) {
    return generateMockDashboard()
  }

  const weeklyPatterns = allPatterns.filter(p => new Date(p.created_at) >= weekAgo)

  // Analyze question types
  const questionTypeAnalysis = analyzeQuestionTypes(allPatterns, weeklyPatterns)
  
  // Analyze keywords and trends
  const keywordAnalysis = analyzeKeywords(allPatterns, weeklyPatterns)
  
  // Analyze user behavior patterns
  const behaviorAnalysis = analyzeBehaviorPatterns(allPatterns)
  
  // Generate business insights
  const businessInsights = generateBusinessInsights(allPatterns, weeklyPatterns)
  
  // Market trend detection
  const marketTrends = detectMarketTrends(allPatterns, weeklyPatterns)

  return {
    summary: {
      totalQuestions: allPatterns.length,
      weeklyQuestions: weeklyPatterns.length,
      activeSessions: [...new Set(weeklyPatterns.map(p => p.session_id))].length,
      avgQuestionsPerSession: weeklyPatterns.length / Math.max([...new Set(weeklyPatterns.map(p => p.session_id))].length, 1)
    },
    questionTypes: questionTypeAnalysis,
    keywords: keywordAnalysis,
    behavior: behaviorAnalysis,
    insights: businessInsights,
    trends: marketTrends
  }
}

function analyzeQuestionTypes(allPatterns, weeklyPatterns) {
  const weeklyTypes = weeklyPatterns.reduce((acc, pattern) => {
    acc[pattern.question_type] = (acc[pattern.question_type] || 0) + 1
    return acc
  }, {})

  const monthlyTypes = allPatterns.reduce((acc, pattern) => {
    acc[pattern.question_type] = (acc[pattern.question_type] || 0) + 1
    return acc
  }, {})

  return {
    weekly: Object.entries(weeklyTypes)
      .sort(([,a], [,b]) => b - a)
      .map(([type, count]) => ({ type, count, percentage: Math.round(count / weeklyPatterns.length * 100) })),
    monthly: Object.entries(monthlyTypes)
      .sort(([,a], [,b]) => b - a)
      .map(([type, count]) => ({ type, count, percentage: Math.round(count / allPatterns.length * 100) })),
    trending: identifyTrendingQuestionTypes(allPatterns, weeklyPatterns)
  }
}

function analyzeKeywords(allPatterns, weeklyPatterns) {
  const weeklyKeywords = weeklyPatterns.reduce((acc, pattern) => {
    if (pattern.keywords) {
      pattern.keywords.forEach(keyword => {
        acc[keyword] = (acc[keyword] || 0) + 1
      })
    }
    return acc
  }, {})

  const monthlyKeywords = allPatterns.reduce((acc, pattern) => {
    if (pattern.keywords) {
      pattern.keywords.forEach(keyword => {
        acc[keyword] = (acc[keyword] || 0) + 1
      })
    }
    return acc
  }, {})

  return {
    weekly: Object.entries(weeklyKeywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count })),
    monthly: Object.entries(monthlyKeywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([keyword, count]) => ({ keyword, count })),
    emerging: identifyEmergingKeywords(allPatterns, weeklyPatterns)
  }
}

function analyzeBehaviorPatterns(allPatterns) {
  const sessionAnalysis = allPatterns.reduce((acc, pattern) => {
    if (!acc[pattern.session_id]) {
      acc[pattern.session_id] = {
        questions: 0,
        types: new Set(),
        keywords: new Set(),
        firstQuestion: pattern.created_at,
        lastQuestion: pattern.created_at
      }
    }
    
    acc[pattern.session_id].questions++
    acc[pattern.session_id].types.add(pattern.question_type)
    if (pattern.keywords) {
      pattern.keywords.forEach(k => acc[pattern.session_id].keywords.add(k))
    }
    
    if (new Date(pattern.created_at) < new Date(acc[pattern.session_id].firstQuestion)) {
      acc[pattern.session_id].firstQuestion = pattern.created_at
    }
    if (new Date(pattern.created_at) > new Date(acc[pattern.session_id].lastQuestion)) {
      acc[pattern.session_id].lastQuestion = pattern.created_at
    }
    
    return acc
  }, {})

  const sessions = Object.values(sessionAnalysis)
  
  return {
    avgQuestionsPerSession: sessions.reduce((sum, s) => sum + s.questions, 0) / sessions.length,
    avgTypesPerSession: sessions.reduce((sum, s) => sum + s.types.size, 0) / sessions.length,
    sessionLengths: sessions.map(s => {
      const duration = new Date(s.lastQuestion) - new Date(s.firstQuestion)
      return Math.round(duration / 60000) // minutes
    }),
    commonPathways: identifyCommonQuestionPathways(allPatterns)
  }
}

function generateBusinessInsights(allPatterns, weeklyPatterns) {
  const insights = []

  // Top products/industries of interest
  const productKeywords = ['electronics', 'automotive', 'textiles', 'machinery', 'medical', 'food']
  const productInterest = productKeywords.map(product => {
    const count = weeklyPatterns.filter(p => 
      p.keywords && p.keywords.includes(product)
    ).length
    return { product, interest: count }
  }).filter(p => p.interest > 0).sort((a, b) => b.interest - a.interest)

  if (productInterest.length > 0) {
    insights.push({
      type: 'product_interest',
      title: 'Top Product Categories This Week',
      data: productInterest,
      impact: 'high'
    })
  }

  // Geographic trends
  const countries = ['china', 'mexico', 'canada', 'vietnam', 'india', 'taiwan']
  const countryMentions = countries.map(country => {
    const count = weeklyPatterns.filter(p => 
      p.keywords && p.keywords.includes(country)
    ).length
    return { country, mentions: count }
  }).filter(c => c.mentions > 0).sort((a, b) => b.mentions - a.mentions)

  if (countryMentions.length > 0) {
    insights.push({
      type: 'geographic_trends',
      title: 'Countries in Focus',
      data: countryMentions,
      impact: 'medium'
    })
  }

  // Cost vs compliance focus
  const costQuestions = weeklyPatterns.filter(p => 
    p.question_type === 'cost_optimization' || 
    (p.keywords && p.keywords.some(k => ['cost', 'savings', 'money'].includes(k)))
  ).length

  const complianceQuestions = weeklyPatterns.filter(p => 
    p.question_type === 'compliance_question' ||
    (p.keywords && p.keywords.some(k => ['compliance', 'legal', 'regulation'].includes(k)))
  ).length

  insights.push({
    type: 'business_focus',
    title: 'Cost vs Compliance Focus',
    data: { costFocus: costQuestions, complianceFocus: complianceQuestions },
    impact: 'strategic'
  })

  return insights
}

function detectMarketTrends(allPatterns, weeklyPatterns) {
  const trends = []

  // Trend: China alternatives
  const chinaAlternatives = weeklyPatterns.filter(p => 
    p.keywords && (
      p.keywords.includes('china') && 
      (p.keywords.includes('mexico') || p.keywords.includes('vietnam') || p.keywords.includes('alternative'))
    )
  ).length

  if (chinaAlternatives > 0) {
    trends.push({
      trend: 'china_diversification',
      strength: chinaAlternatives,
      description: 'Businesses actively seeking China alternatives',
      opportunity: 'Triangle routing and Mexico partnerships'
    })
  }

  // Trend: Supply chain resilience
  const resilienceKeywords = ['supplier', 'sourcing', 'diversification', 'alternative']
  const resilienceQuestions = weeklyPatterns.filter(p => 
    p.keywords && p.keywords.some(k => resilienceKeywords.includes(k))
  ).length

  if (resilienceQuestions > 0) {
    trends.push({
      trend: 'supply_chain_resilience',
      strength: resilienceQuestions,
      description: 'Focus on supply chain diversification',
      opportunity: 'Multi-country sourcing strategies'
    })
  }

  return trends
}

function identifyTrendingQuestionTypes(allPatterns, weeklyPatterns) {
  // Compare weekly vs monthly proportions to identify trending types
  const weeklyTotal = weeklyPatterns.length
  const monthlyTotal = allPatterns.length

  if (weeklyTotal === 0 || monthlyTotal === 0) return []

  const weeklyTypes = weeklyPatterns.reduce((acc, p) => {
    acc[p.question_type] = (acc[p.question_type] || 0) + 1
    return acc
  }, {})

  const monthlyTypes = allPatterns.reduce((acc, p) => {
    acc[p.question_type] = (acc[p.question_type] || 0) + 1
    return acc
  }, {})

  return Object.keys(weeklyTypes).map(type => {
    const weeklyPct = (weeklyTypes[type] / weeklyTotal) * 100
    const monthlyPct = (monthlyTypes[type] / monthlyTotal) * 100
    const trend = weeklyPct - monthlyPct
    
    return { type, weeklyPct, monthlyPct, trend }
  }).filter(t => t.trend > 5) // Only show significant upward trends
    .sort((a, b) => b.trend - a.trend)
}

function identifyEmergingKeywords(allPatterns, weeklyPatterns) {
  // Find keywords that appeared more frequently this week vs overall
  const weeklyKeywordFreq = {}
  const monthlyKeywordFreq = {}

  weeklyPatterns.forEach(p => {
    if (p.keywords) {
      p.keywords.forEach(k => {
        weeklyKeywordFreq[k] = (weeklyKeywordFreq[k] || 0) + 1
      })
    }
  })

  allPatterns.forEach(p => {
    if (p.keywords) {
      p.keywords.forEach(k => {
        monthlyKeywordFreq[k] = (monthlyKeywordFreq[k] || 0) + 1
      })
    }
  })

  return Object.keys(weeklyKeywordFreq).map(keyword => {
    const weeklyFreq = weeklyKeywordFreq[keyword] / weeklyPatterns.length
    const monthlyFreq = monthlyKeywordFreq[keyword] / allPatterns.length
    const emergence = weeklyFreq - monthlyFreq
    
    return { keyword, emergence, weeklyCount: weeklyKeywordFreq[keyword] }
  }).filter(k => k.emergence > 0.05 && k.weeklyCount >= 2)
    .sort((a, b) => b.emergence - a.emergence)
    .slice(0, 5)
}

function identifyCommonQuestionPathways(allPatterns) {
  // Group by session and analyze question sequences
  const sessions = allPatterns.reduce((acc, pattern) => {
    if (!acc[pattern.session_id]) acc[pattern.session_id] = []
    acc[pattern.session_id].push(pattern)
    return acc
  }, {})

  const pathways = {}
  
  Object.values(sessions).forEach(sessionPatterns => {
    if (sessionPatterns.length > 1) {
      sessionPatterns.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      
      for (let i = 0; i < sessionPatterns.length - 1; i++) {
        const pathway = `${sessionPatterns[i].question_type} → ${sessionPatterns[i + 1].question_type}`
        pathways[pathway] = (pathways[pathway] || 0) + 1
      }
    }
  })

  return Object.entries(pathways)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([pathway, count]) => ({ pathway, count }))
}

function generateMockDashboard() {
  // Return mock data for demonstration when no real data exists
  return {
    summary: {
      totalQuestions: 47,
      weeklyQuestions: 12,
      activeSessions: 8,
      avgQuestionsPerSession: 1.5
    },
    questionTypes: {
      weekly: [
        { type: 'hs_code_lookup', count: 5, percentage: 42 },
        { type: 'tariff_inquiry', count: 3, percentage: 25 },
        { type: 'routing_strategy', count: 2, percentage: 17 },
        { type: 'cost_optimization', count: 2, percentage: 17 }
      ],
      trending: [
        { type: 'routing_strategy', trend: 8.5 },
        { type: 'cost_optimization', trend: 6.2 }
      ]
    },
    keywords: {
      weekly: [
        { keyword: 'electronics', count: 4 },
        { keyword: 'china', count: 3 },
        { keyword: 'mexico', count: 3 },
        { keyword: 'automotive', count: 2 }
      ],
      emerging: [
        { keyword: 'mexico', emergence: 0.12, weeklyCount: 3 },
        { keyword: 'automotive', emergence: 0.08, weeklyCount: 2 }
      ]
    },
    insights: [
      {
        type: 'product_interest',
        title: 'Top Product Categories This Week',
        data: [
          { product: 'electronics', interest: 4 },
          { product: 'automotive', interest: 2 }
        ],
        impact: 'high'
      }
    ],
    trends: [
      {
        trend: 'china_diversification',
        strength: 3,
        description: 'Businesses actively seeking China alternatives',
        opportunity: 'Triangle routing and Mexico partnerships'
      }
    ]
  }
}