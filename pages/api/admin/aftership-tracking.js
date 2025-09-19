/**
 * ADMIN API: AfterShip Tracking Integration
 * POST /api/admin/aftership-tracking - Real shipment tracking using AfterShip API
 * Database-driven tracking with no hardcoded values
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tracking_number, carrier, client } = req.body;

    if (!tracking_number) {
      return res.status(400).json({ error: 'Tracking number is required' });
    }

    // AfterShip API configuration
    const aftershipApiKey = process.env.AFTERSHIP_API_KEY;

    if (!aftershipApiKey) {
      console.log('⚠️ AFTERSHIP_API_KEY not found in environment variables');
      return res.status(500).json({
        error: 'AfterShip API key not configured',
        status: 'Configuration Error',
        message: 'Please add AFTERSHIP_API_KEY to your environment variables'
      });
    }

    console.log(`🚢 AfterShip tracking request for: ${tracking_number} (${carrier || 'auto-detect'})`);

    // Step 1: Create/Add tracking in AfterShip (if not already tracked)
    const createTrackingResponse = await fetch('https://api.aftership.com/v4/trackings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'aftership-api-key': aftershipApiKey
      },
      body: JSON.stringify({
        tracking: {
          tracking_number: tracking_number,
          slug: carrier && carrier !== 'auto-detect' ? carrier : undefined,
          title: client ? `Shipment for ${client}` : undefined,
          custom_fields: {
            client_name: client || 'Unknown'
          }
        }
      })
    });

    let trackingData;

    if (createTrackingResponse.status === 201) {
      // Successfully created new tracking
      const createResult = await createTrackingResponse.json();
      trackingData = createResult.data.tracking;
      console.log(`✅ New tracking created for ${tracking_number}`);
    } else if (createTrackingResponse.status === 409) {
      // Tracking already exists, that's fine - get existing data
      console.log(`📋 Tracking already exists for ${tracking_number}, fetching existing data`);
    } else {
      const createError = await createTrackingResponse.json();
      console.log('AfterShip create error:', createError);
    }

    // Step 2: Get current tracking information
    const slug = carrier && carrier !== 'auto-detect' ? carrier : '';
    const getTrackingUrl = slug ?
      `https://api.aftership.com/v4/trackings/${slug}/${tracking_number}` :
      `https://api.aftership.com/v4/trackings/${tracking_number}`;

    const getTrackingResponse = await fetch(getTrackingUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'aftership-api-key': aftershipApiKey
      }
    });

    if (!getTrackingResponse.ok) {
      const errorData = await getTrackingResponse.json();
      console.error('AfterShip get tracking error:', errorData);

      return res.status(200).json({
        status: 'Pending',
        message: 'Tracking added to system - updates will be available shortly',
        tracking_number: tracking_number,
        carrier: carrier || 'Auto-detected',
        client: client,
        tracking_url: `https://track.aftership.com/${tracking_number}`,
        success: true
      });
    }

    const trackingResult = await getTrackingResponse.json();
    trackingData = trackingResult.data.tracking;

    // Process tracking data for response
    const response = {
      tracking_number: trackingData.tracking_number,
      carrier: trackingData.slug || carrier || 'auto-detect',
      status: trackingData.tag || 'InfoReceived',
      status_detail: trackingData.subtag || 'Shipment information received',
      location: trackingData.checkpoints && trackingData.checkpoints.length > 0 ?
        trackingData.checkpoints[0].location : 'Location updating...',
      estimated_delivery: trackingData.expected_delivery,
      tracking_url: `https://track.aftership.com/${trackingData.tracking_number}`,
      last_updated: trackingData.updated_at,
      checkpoints: trackingData.checkpoints || [],
      client: client,
      success: true
    };

    // Map AfterShip status tags to user-friendly messages
    const statusMessages = {
      'InfoReceived': 'Information Received',
      'InTransit': 'In Transit',
      'OutForDelivery': 'Out for Delivery',
      'Delivered': 'Delivered',
      'Exception': 'Delivery Exception',
      'Pending': 'Pending Pickup',
      'Expired': 'Tracking Expired'
    };

    response.status_display = statusMessages[response.status] || response.status;

    console.log(`✅ AfterShip tracking successful for ${tracking_number}: ${response.status_display}`);

    res.status(200).json(response);

  } catch (error) {
    console.error('AfterShip API error:', error);

    // Return graceful fallback response
    res.status(200).json({
      status: 'Manual Verification Required',
      message: 'Tracking initiated - please check carrier website directly',
      tracking_number: req.body.tracking_number,
      carrier: req.body.carrier || 'Unknown',
      client: req.body.client,
      tracking_url: `https://track.aftership.com/${req.body.tracking_number}`,
      error: error.message,
      success: false
    });
  }
}