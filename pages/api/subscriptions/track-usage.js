import { getSupabaseClient } from '../../../lib/supabase-client'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, usageType, amount = 1 } = req.body

    if (!userId || !usageType) {
      return res.status(400).json({ error: 'User ID and usage type are required' })
    }

    // Valid usage types
    const validUsageTypes = ['monthly_analyses', 'saved_routes', 'alert_channels', 'marcus_consultations']
    if (!validUsageTypes.includes(usageType)) {
      return res.status(400).json({ error: 'Invalid usage type' })
    }

    const supabase = getSupabaseClient()

    // Use the database function to safely increment usage
    const { data, error } = await supabase.rpc('increment_usage', {
      user_uuid: userId,
      usage_type: usageType.replace('_', ''), // Convert to camelCase for function
      increment_amount: amount
    })

    if (error) {
      console.error('Usage tracking error:', error)
      return res.status(500).json({ error: 'Failed to track usage' })
    }

    if (!data) {
      // Usage limit exceeded
      return res.status(429).json({ 
        error: 'Usage limit exceeded',
        usageType,
        limitExceeded: true
      })
    }

    // Get updated usage status
    const { data: statusData, error: statusError } = await supabase.rpc('check_usage_limit', {
      user_uuid: userId,
      usage_type: usageType.replace('_', ''),
      increment_amount: 0 // Just check, don't increment
    })

    if (statusError) {
      console.error('Status check error:', statusError)
    }

    res.status(200).json({
      success: true,
      usageType,
      amountTracked: amount,
      currentStatus: statusData ? {
        allowed: statusData.allowed,
        currentUsage: statusData.current_usage,
        limit: statusData.limit_amount,
        remaining: statusData.remaining
      } : null
    })

  } catch (error) {
    console.error('Track usage error:', error)
    res.status(500).json({ 
      error: 'Failed to track usage',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}