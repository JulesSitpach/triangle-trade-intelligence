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
    console.log('[SUPPLIERS API] Fetching suppliers from database...')

    // Get suppliers from the database
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('verification_status', { ascending: false }) // Verified first
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[SUPPLIERS API] Database error:', error)
      return res.status(500).json({
        error: 'Failed to fetch suppliers',
        details: error.message
      })
    }

    console.log(`[SUPPLIERS API] Found ${suppliers?.length || 0} suppliers`)

    return res.status(200).json({
      success: true,
      suppliers: suppliers || [],
      total: suppliers?.length || 0,
      message: suppliers?.length > 0 ? 'Suppliers loaded successfully' : 'No suppliers found'
    })

  } catch (error) {
    console.error('[SUPPLIERS API] Unexpected error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    })
  }
}