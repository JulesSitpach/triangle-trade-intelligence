/**
 * USMCA Postal Code Lookup API
 * Direct endpoint for postal code intelligence lookup
 */

// import { USMCAPostalIntelligence } from '../../../lib/intelligence/usmca-postal-intelligence' // Removed - functionality consolidated into database bridge
import { StableDataManager } from '../../../lib/intelligence/database-intelligence-bridge'
import { logInfo, logError, logPerformance } from '../../../lib/utils/production-logger'

export default async function handler(req, res) {
  const startTime = Date.now()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { postalCode } = req.body

    if (!postalCode) {
      return res.status(400).json({ 
        error: 'Postal code is required',
        supportedFormats: ['XXXXX', 'XXXXX-XXXX'] // US ZIP codes
      })
    }

    logInfo('USMCA Postal Lookup Request', { postalCode })

    // Get geographic intelligence using database bridge (consolidated functionality)
    const intelligence = await StableDataManager.getGeographicIntelligence(postalCode)

    const duration = Date.now() - startTime
    logPerformance('USMCA Postal Lookup', duration, { 
      postalCode, 
      success: !intelligence.error,
      confidence: intelligence.confidence || 0
    })

    if (intelligence.error) {
      return res.status(400).json({
        error: intelligence.error,
        postalCode,
        confidence: 0,
        supportedFormats: ['XXXXX', 'XXXXX-XXXX'] // US ZIP codes
      })
    }

    return res.status(200).json({
      ...intelligence,
      processingTime: duration,
      api: 'USMCA_Postal_Intelligence_v1',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logError('USMCA Postal Lookup Error', { error: error.message, duration })

    return res.status(500).json({
      error: 'Internal server error during postal lookup',
      message: 'Please try again or contact support',
      timestamp: new Date().toISOString()
    })
  }
}