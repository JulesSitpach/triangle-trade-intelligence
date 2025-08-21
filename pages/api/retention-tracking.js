/**
 * RETENTION TRACKING API
 * Simple endpoint to track user engagement and performance metrics
 */

import { getServerSupabaseClient } from '../../lib/supabase-client.js'

const supabase = getServerSupabaseClient()

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { 
        userId,
        sessionData,
        performanceMetrics,
        engagementData,
        alertInteractions 
      } = req.body

      // Track user session
      const sessionRecord = {
        user_id: userId,
        session_timestamp: new Date().toISOString(),
        pages_completed: sessionData.completedStages,  // tracks completion across 6 pages
        session_duration: sessionData.duration,
        last_page_visited: sessionData.lastStage,  // semantic page names: foundation, product, routing, partnership, hindsight, alerts
        created_at: new Date().toISOString()
      }

      const { error: sessionError } = await supabase
        .from('user_sessions')
        .insert([sessionRecord])

      if (sessionError) {
        console.error('Session tracking error:', sessionError)
      }

      // Track performance metrics if provided
      if (performanceMetrics) {
        const performanceRecord = {
          user_id: userId,
          actual_savings: performanceMetrics.actualSavings,
          projected_savings: performanceMetrics.projectedSavings,
          realization_rate: performanceMetrics.realizationRate,
          performance_trend: performanceMetrics.trend,
          milestone_reached: performanceMetrics.milestone,
          created_at: new Date().toISOString()
        }

        const { error: performanceError } = await supabase
          .from('user_performance')
          .insert([performanceRecord])

        if (performanceError) {
          console.error('Performance tracking error:', performanceError)
        }
      }

      // Track engagement data
      if (engagementData) {
        const engagementRecord = {
          user_id: userId,
          daily_active: engagementData.dailyActive,
          alert_responses: engagementData.alertResponses,
          network_connections: engagementData.networkConnections,
          achievement_unlocked: engagementData.newAchievement,
          engagement_score: engagementData.score,
          created_at: new Date().toISOString()
        }

        const { error: engagementError } = await supabase
          .from('user_engagement')
          .insert([engagementRecord])

        if (engagementError) {
          console.error('Engagement tracking error:', engagementError)
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Retention data tracked successfully'
      })

    } catch (error) {
      console.error('Retention tracking failed:', error)
      return res.status(500).json({
        error: 'Failed to track retention data',
        details: error.message
      })
    }
  } else if (req.method === 'GET') {
    // Get user retention metrics
    try {
      const { userId } = req.query

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' })
      }

      // Get latest session data
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Get performance metrics
      const { data: performance } = await supabase
        .from('user_performance')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      // Get engagement data
      const { data: engagement } = await supabase
        .from('user_engagement')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      return res.status(200).json({
        success: true,
        retentionData: {
          sessions,
          performance,
          engagement,
          totalSessions: sessions?.length || 0,
          avgSavings: performance?.[0]?.actual_savings || 0,
          engagementScore: engagement?.[0]?.engagement_score || 75
        }
      })

    } catch (error) {
      console.error('Failed to get retention data:', error)
      return res.status(500).json({
        error: 'Failed to retrieve retention data',
        details: error.message
      })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}