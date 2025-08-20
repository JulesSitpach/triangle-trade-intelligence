/**
 * SERVER-SIDE COMTRADE API HANDLER
 * Keeps API keys secure on server, never exposed to client
 */

import { logInfo, logError, logAPICall } from '../../../lib/production-logger'

export default async function handler(req, res) {
  if (!['POST', 'GET'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed. Use POST or GET.' })
  }

  const startTime = Date.now()
  
  try {
    // Support both JSON body (POST) and URL parameters (GET)
    let country, hsCode, partnerCode, reporterCode
    
    if (req.method === 'POST') {
      ({ country, hsCode, partnerCode, reporterCode } = req.body)
    } else {
      // Parse URL parameters for GET requests
      const { query } = req
      country = query.country || query.countryCode
      hsCode = query.hsCode || query.hs_code || query.cmdCode
      partnerCode = query.partnerCode || query.partner_code || country
      reporterCode = query.reporterCode || query.reporter_code || '842' // Default to USA
    }
    
    if (!country || !hsCode) {
      return res.status(400).json({ 
        error: 'Missing required parameters: country and hsCode',
        received: { country, hsCode, method: req.method },
        usage: {
          post: 'POST /api/volatile-data/comtrade with JSON body: {"country": "CN", "hsCode": "8471"}',
          get: 'GET /api/volatile-data/comtrade?country=CN&hsCode=8471'
        }
      })
    }
    
    logInfo('Comtrade API request', { country, hsCode, method: req.method })
    
    // Use parsed parameters with proper URL encoding
    const safePartnerCode = encodeURIComponent(partnerCode || country)
    const safeHsCode = encodeURIComponent(hsCode)
    const safeReporterCode = encodeURIComponent(reporterCode || '842')
    
    const comtradeUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS?period=2023&reporterCode=${safeReporterCode}&partnerCode=${safePartnerCode}&cmdCode=${safeHsCode}&maxRecords=5`
    
    const response = await fetch(comtradeUrl, {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.COMTRADE_API_KEY
      }
    })
    
    const duration = Date.now() - startTime
    
    if (!response.ok) {
      logError('Comtrade API request failed', { 
        status: response.status, 
        statusText: response.statusText,
        country,
        hsCode,
        duration
      })
      logAPICall('POST', 'comtrade', duration, 'error')
      return res.status(response.status).json({ 
        error: `Comtrade API failed: ${response.status}`,
        details: response.statusText 
      })
    }
    
    const data = await response.json()
    logInfo('Comtrade API response received', { 
      recordCount: data.data?.length || 0,
      country,
      hsCode,
      duration
    })
    logAPICall('POST', 'comtrade', duration, 'success')
    
    return res.status(200).json({
      endpoint: 'comtrade',
      records: data.data || [],
      recordCount: data.data?.length || 0,
      success: true,
      cached: false,
      duration
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    logError('Comtrade API handler error', { error: error.message, duration })
    logAPICall('POST', 'comtrade', duration, 'error')
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}