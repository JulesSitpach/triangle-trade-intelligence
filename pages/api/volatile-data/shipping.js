/**
 * SERVER-SIDE SHIPPING API HANDLER
 * Keeps Shippo API key secure on server, never exposed to client
 */

import { logInfo, logError, logAPICall } from '../../../lib/production-logger'

export default async function handler(req, res) {
  if (!['POST', 'GET'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed. Use POST or GET.' })
  }

  const startTime = Date.now()
  
  try {
    // Support both JSON body (POST) and URL parameters (GET)
    let origin, destination, parcel
    
    if (req.method === 'POST') {
      ({ origin, destination, parcel } = req.body)
    } else {
      // Parse URL parameters for GET requests
      const { query } = req
      origin = query.origin || query.from
      destination = query.destination || query.to
      
      // Parse parcel data from query string
      if (query.parcel) {
        try {
          parcel = JSON.parse(decodeURIComponent(query.parcel))
        } catch (e) {
          // Use individual parcel parameters if JSON parsing fails
          parcel = {
            length: query.length || '30',
            width: query.width || '30',
            height: query.height || '30',
            distance_unit: query.distance_unit || 'in',
            weight: query.weight || '10',
            mass_unit: query.mass_unit || 'lb'
          }
        }
      }
    }
    
    if (!origin || !destination) {
      return res.status(400).json({ 
        error: 'Missing required parameters: origin and destination',
        received: { origin, destination, method: req.method },
        usage: {
          post: 'POST /api/volatile-data/shipping with JSON body: {"origin": {...}, "destination": {...}}',
          get: 'GET /api/volatile-data/shipping?origin=US&destination=CN&weight=10'
        }
      })
    }
    
    logInfo('Shipping API request', { origin, destination, method: req.method })
    
    const shippoData = {
      address_from: origin,
      address_to: destination,
      parcels: [parcel || {
        length: '30',
        width: '30', 
        height: '30',
        distance_unit: 'in',
        weight: '10',
        mass_unit: 'lb'
      }],
      async: false
    }
    
    const response = await fetch('https://api.goshippo.com/shipments/', {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${process.env.SHIPPO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shippoData)
    })
    
    const duration = Date.now() - startTime
    
    if (!response.ok) {
      logError('Shippo API request failed', {
        status: response.status,
        statusText: response.statusText,
        origin,
        destination,
        duration
      })
      logAPICall('POST', 'shippo', duration, 'error')
      return res.status(response.status).json({ 
        error: `Shippo API failed: ${response.status}`,
        details: response.statusText 
      })
    }
    
    const data = await response.json()
    logInfo('Shippo API response received', {
      rateCount: data.rates?.length || 0,
      origin,
      destination,
      duration
    })
    logAPICall('POST', 'shippo', duration, 'success')
    
    return res.status(200).json({
      endpoint: 'shippo',
      rates: data.rates || [],
      rateCount: data.rates?.length || 0,
      success: true,
      cached: false,
      duration
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    logError('Shipping API handler error', { error: error.message, duration })
    logAPICall('POST', 'shippo', duration, 'error')
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}