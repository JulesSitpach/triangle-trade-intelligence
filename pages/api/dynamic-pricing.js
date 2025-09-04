/**
 * DYNAMIC PRICING API ENDPOINT
 * Exposes dynamic pricing service functionality
 * NO HARDCODED PRICES - Database-driven pricing system
 */

import { dynamicPricingService } from '../../lib/services/dynamic-pricing-service.js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed_methods: ['POST']
    });
  }

  const { action, data = {} } = req.body;
  const startTime = Date.now();

  try {
    logInfo('Dynamic pricing API called', { action, data: Object.keys(data) });

    switch (action) {
      case 'get_platform_tiers':
        const { market = 'global', currency = 'USD' } = data;
        
        const tiers = await dynamicPricingService.getPlatformTiers(market, currency);
        return res.status(200).json({
          success: true,
          tiers: tiers,
          market: market,
          currency: currency,
          processing_time_ms: Date.now() - startTime
        });

      case 'get_service_price':
        const { serviceSlug, market: serviceMarket = 'global', currency: serviceCurrency = 'USD' } = data;
        
        if (!serviceSlug) {
          return res.status(400).json({
            success: false,
            error: 'serviceSlug is required'
          });
        }

        const servicePrice = await dynamicPricingService.getServicePrice(serviceSlug, serviceMarket, serviceCurrency);
        return res.status(200).json({
          success: true,
          service: servicePrice,
          processing_time_ms: Date.now() - startTime
        });

      case 'get_emergency_rate':
        const { currency: emergencyCurrency = 'USD' } = data;
        
        const emergencyRate = await dynamicPricingService.getEmergencyRate(emergencyCurrency);
        return res.status(200).json({
          success: true,
          emergency_rate: emergencyRate,
          currency: emergencyCurrency,
          processing_time_ms: Date.now() - startTime
        });

      case 'get_professional_services':
        const { market: profMarket = 'global', currency: profCurrency = 'USD' } = data;
        
        const professionalServices = await dynamicPricingService.getProfessionalServices(profMarket, profCurrency);
        return res.status(200).json({
          success: true,
          professional_services: professionalServices,
          market: profMarket,
          currency: profCurrency,
          processing_time_ms: Date.now() - startTime
        });

      case 'calculate_custom_pricing':
        const { tradeVolume, serviceSlug: customServiceSlug, market: customMarket = 'global' } = data;
        
        if (!tradeVolume || tradeVolume <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Valid tradeVolume is required'
          });
        }

        if (!customServiceSlug) {
          return res.status(400).json({
            success: false,
            error: 'serviceSlug is required'
          });
        }

        const customPricing = await dynamicPricingService.calculateCustomPricing(
          tradeVolume,
          customServiceSlug,
          customMarket
        );

        return res.status(200).json({
          success: !!customPricing,
          custom_pricing: customPricing,
          processing_time_ms: Date.now() - startTime
        });

      case 'convert_currency':
        const { amount, fromCurrency, toCurrency } = data;
        
        if (!amount || amount <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Valid amount is required'
          });
        }

        if (!fromCurrency || !toCurrency) {
          return res.status(400).json({
            success: false,
            error: 'fromCurrency and toCurrency are required'
          });
        }

        const convertedAmount = await dynamicPricingService.convertCurrency(amount, fromCurrency, toCurrency);
        return res.status(200).json({
          success: true,
          original_amount: amount,
          original_currency: fromCurrency,
          converted_amount: convertedAmount,
          target_currency: toCurrency,
          processing_time_ms: Date.now() - startTime
        });

      case 'get_exchange_rate':
        const { fromCurrency: rateFromCurrency, toCurrency: rateToCurrency } = data;
        
        if (!rateFromCurrency || !rateToCurrency) {
          return res.status(400).json({
            success: false,
            error: 'fromCurrency and toCurrency are required'
          });
        }

        const exchangeRate = await dynamicPricingService.getExchangeRate(rateFromCurrency, rateToCurrency);
        return res.status(200).json({
          success: true,
          exchange_rate: exchangeRate,
          from_currency: rateFromCurrency,
          to_currency: rateToCurrency,
          processing_time_ms: Date.now() - startTime
        });

      case 'get_all_pricing':
        // Comprehensive pricing information
        const { market: allMarket = 'global', currency: allCurrency = 'USD' } = data;
        
        const [platformTiers, professionalServicesAll, emergencyRateAll] = await Promise.all([
          dynamicPricingService.getPlatformTiers(allMarket, allCurrency),
          dynamicPricingService.getProfessionalServices(allMarket, allCurrency),
          dynamicPricingService.getEmergencyRate(allCurrency)
        ]);

        return res.status(200).json({
          success: true,
          pricing: {
            platform_tiers: platformTiers,
            professional_services: professionalServicesAll,
            emergency_rate: emergencyRateAll,
            market: allMarket,
            currency: allCurrency
          },
          processing_time_ms: Date.now() - startTime
        });

      case 'health_check':
        const healthCheck = await dynamicPricingService.healthCheck();
        return res.status(200).json({
          success: true,
          health: healthCheck,
          processing_time_ms: Date.now() - startTime
        });

      default:
        return res.status(400).json({
          success: false,
          error: 'Unknown action',
          available_actions: [
            'get_platform_tiers',
            'get_service_price',
            'get_emergency_rate',
            'get_professional_services',
            'calculate_custom_pricing',
            'convert_currency',
            'get_exchange_rate',
            'get_all_pricing',
            'health_check'
          ]
        });
    }

  } catch (error) {
    logError('Dynamic pricing API error', {
      error: error.message,
      action,
      processing_time_ms: Date.now() - startTime
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Pricing service unavailable',
      processing_time_ms: Date.now() - startTime
    });
  }
}