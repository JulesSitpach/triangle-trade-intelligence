/**
 * Learn HS Selection API
 * Learns from user HS code selections to improve future suggestions
 */

import { getServerSupabaseClient } from '../../../lib/supabase-client.js'

const supabase = getServerSupabaseClient()

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { productDescription, selectedHsCode, confidence, businessType } = req.body

  if (!productDescription || !selectedHsCode) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  try {
    // Store the user selection to improve future suggestions
    const { data, error } = await supabase
      .from('hs_learning_selections')
      .insert({
        product_description: productDescription,
        selected_hs_code: selectedHsCode,
        confidence_score: confidence || 0,
        business_type: businessType || 'General',
        created_at: new Date().toISOString(),
        data_source: 'user_selection'
      })

    if (error) {
      console.warn('Failed to log HS selection for learning:', error)
      // Don't fail the request if learning storage fails
    }

    return res.status(200).json({
      success: true,
      message: 'HS code selection logged for future learning'
    })

  } catch (error) {
    console.error('Learn HS selection error:', error)
    return res.status(200).json({
      success: true,
      message: 'Request processed (learning storage failed gracefully)'
    })
  }
}