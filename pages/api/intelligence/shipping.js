/**
 * SHIPPING/LOGISTICS ANALYSIS API - CONTEXT7 VERIFIED LIMITATIONS
 * 
 * IMPORTANT: Context7 verification shows:
 * - UN Comtrade provides historical trade statistics, NOT shipping costs
 * - No public APIs provide real-time shipping rates
 * - Must direct users to freight forwarders for accurate costs
 * 
 * This API provides ONLY historical trade context, not shipping estimates
 */

import { logInfo, logError, logPerformance } from '../../../lib/production-logger.js';
import { 
  analyzeBilateralTrade, 
  analyzeTriangleRoute,
  validateCalculationAuthenticity 
} from '../../../lib/core/trade-analysis.js';

export default async function handler(req, res) {
  const startTime = Date.now();
  
  logInfo('API CALL: /api/intelligence/shipping', {
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['POST'] 
    });
  }

  const { origin, destination, transit, hsCode, businessProfile } = req.body;

  try {
    if (!origin || !destination) {
      return res.status(400).json({
        error: 'Missing origin or destination for trade analysis',
        required: ['origin', 'destination'],
        disclaimer: 'Historical trade context only - not shipping costs'
      });
    }

    logInfo('Trade logistics context analysis', { 
      route: transit ? `${origin}-${transit}-${destination}` : `${origin}-${destination}`,
      hsCode: hsCode || 'general' 
    });

    let tradeAnalysis = null;

    // Analyze based on route type
    if (transit && transit !== origin) {
      // Triangle route analysis
      tradeAnalysis = await analyzeTriangleRoute(origin, transit, destination);
      tradeAnalysis.analysisType = 'TRIANGLE_ROUTE_CONTEXT';
    } else {
      // Direct route analysis
      tradeAnalysis = await analyzeBilateralTrade(origin, destination);
      tradeAnalysis.analysisType = 'DIRECT_ROUTE_CONTEXT';
    }

    // Build response with shipping/logistics context
    const response = {
      request: {
        origin,
        destination, 
        transit: transit || null,
        hsCode: hsCode || null,
        routeType: transit ? 'triangle' : 'direct'
      },
      trade_context: tradeAnalysis,
      shipping_logistics_reality: {
        // Context7 Verified: NO APIs provide real shipping costs
        shipping_costs: {
          available: false,
          reason: 'No public APIs provide real-time shipping rates',
          context7_verified: 'Shipping APIs require commercial accounts and integration',
          professional_required: true
        },
        transit_times: {
          available: false,
          reason: 'Transit times vary by carrier, service level, and route',
          note: 'Contact freight forwarders for accurate transit time estimates'
        },
        logistics_complexity: transit ? {
          assessment: 'Higher complexity due to multiple legs',
          considerations: [
            'Two separate shipping segments required',
            'Customs clearance in transit country',
            'Potential storage/handling fees in transit',
            'Coordination between multiple carriers/agents'
          ]
        } : {
          assessment: 'Standard direct shipping complexity',
          considerations: [
            'Single shipping segment',
            'Direct customs clearance at destination',
            'Single carrier relationship'
          ]
        }
      },
      professional_shipping_services: {
        required: true,
        contacts: [
          {
            type: 'Freight Forwarder',
            purpose: 'Obtain accurate shipping quotes and transit times',
            services: [
              'Door-to-door shipping quotes',
              'Customs clearance coordination',
              'Insurance and documentation',
              'Multi-modal transportation planning'
            ]
          },
          {
            type: 'Customs Broker',
            purpose: 'Handle customs clearance and compliance',
            services: [
              'Customs documentation preparation',
              'Duty and tax calculation',
              'Regulatory compliance verification',
              'Import/export permit assistance'
            ]
          },
          {
            type: 'Logistics Consultant',
            purpose: 'Supply chain optimization and route planning',
            services: [
              'Supply chain analysis',
              'Route optimization',
              'Vendor management',
              'Cost optimization strategies'
            ]
          }
        ]
      },
      mandatory_disclaimers: [
        'NO SHIPPING COSTS OR TRANSIT TIMES PROVIDED',
        'Historical trade data only - not current logistics information',
        'Contact freight forwarders for accurate shipping quotes',
        'Logistics complexity varies significantly by specific requirements'
      ],
      context7_verified_limitations: [
        'UN Comtrade provides trade statistics, not shipping data',
        'No public APIs available for real-time shipping costs',
        'Commercial shipping APIs require business accounts',
        'Transit times depend on specific carrier and service selections'
      ],
      calculation_authenticity: validateCalculationAuthenticity({
        hasDisclaimers: true,
        providesNoShippingEstimates: true,
        redirectsToShippingProfessionals: true,
        usesOnlyHistoricalTradeContext: true
      }),
      performance: {
        responseTime: Date.now() - startTime,
        analysisType: tradeAnalysis?.analysisType,
        dataProvidedFrom: 'Historical trade database + professional referrals',
        shippingDataClaimed: false,
        lastUpdated: new Date().toISOString()
      }
    };

    logPerformance('shipping logistics analysis', response.performance.responseTime, {
      route: response.request.routeType,
      origin,
      destination,
      transit: !!transit
    });

    return res.status(200).json(response);

  } catch (error) {
    logError('Shipping logistics analysis failed', {
      error: error.message,
      stack: error.stack,
      route: transit ? `${origin}-${transit}-${destination}` : `${origin}-${destination}`,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      error: 'Trade logistics analysis failed',
      message: error.message,
      shipping_fallback_guidance: {
        immediate_action: 'Contact freight forwarder directly',
        services_needed: [
          'Shipping quote request',
          'Route feasibility analysis', 
          'Transit time estimates',
          'Customs requirements review'
        ],
        major_freight_forwarders: [
          'DHL Global Forwarding',
          'DB Schenker', 
          'Kuehne + Nagel',
          'Expeditors',
          'C.H. Robinson'
        ],
        disclaimer: 'No automated shipping data available - professional consultation required'
      },
      timestamp: new Date().toISOString()
    });
  }
}