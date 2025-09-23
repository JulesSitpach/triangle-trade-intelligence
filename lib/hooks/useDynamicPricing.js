/**
 * Dynamic Pricing Hook
 * Integrates with the existing dynamic pricing API
 * Provides real-time pricing for AI Report buttons
 */

import { useState, useEffect } from 'react';

export const useDynamicPricing = () => {
  const [pricing, setPricing] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Service slug to display name mapping
  const serviceDisplayNames = {
    'mexico-supplier-sourcing': 'Mexico Supplier Sourcing Report',
    'mexico-manufacturing-feasibility': 'Mexico Manufacturing Feasibility Report',
    'mexico-market-entry': 'Mexico Market Entry Report',
    'usmca-certificate': 'USMCA Certificate Generation',
    'hs-classification': 'HS Code Classification',
    'document-review': 'Document Review & Validation',
    'monthly-support': 'Monthly Compliance Support',
    'crisis-response': 'Crisis Response Service'
  };

  /**
   * Get price for a specific service
   * @param {string} serviceSlug - Service identifier
   * @param {string} market - Market (default: 'global')
   * @param {string} currency - Currency (default: 'USD')
   * @returns {Promise<Object>} Service price information
   */
  const getServicePrice = async (serviceSlug, market = 'global', currency = 'USD') => {
    if (pricing[serviceSlug]) {
      return pricing[serviceSlug];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dynamic-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_service_price',
          data: { serviceSlug, market, currency }
        })
      });

      const result = await response.json();

      if (result.success && result.service) {
        const servicePrice = {
          slug: serviceSlug,
          name: serviceDisplayNames[serviceSlug] || serviceSlug,
          price: result.service.price || result.service.amount || 0,
          currency: result.service.currency || currency,
          market: result.service.market || market,
          formatted: formatPrice(result.service.price || result.service.amount || 0, currency),
          emergency_rate: result.service.emergency_multiplier || 1.5
        };

        setPricing(prev => ({
          ...prev,
          [serviceSlug]: servicePrice
        }));

        return servicePrice;
      } else {
        // Fallback to default pricing if API fails
        const fallbackPrice = getFallbackPrice(serviceSlug);
        setPricing(prev => ({
          ...prev,
          [serviceSlug]: fallbackPrice
        }));
        return fallbackPrice;
      }
    } catch (err) {
      console.error('Dynamic pricing error:', err);
      setError(err.message);

      // Return fallback pricing
      const fallbackPrice = getFallbackPrice(serviceSlug);
      setPricing(prev => ({
        ...prev,
        [serviceSlug]: fallbackPrice
      }));
      return fallbackPrice;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get all pricing information at once
   * @param {Array} serviceSlugs - Array of service slugs to fetch
   * @returns {Promise<Object>} All pricing information
   */
  const getAllPricing = async (serviceSlugs = []) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dynamic-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_all_pricing',
          data: { market: 'global', currency: 'USD' }
        })
      });

      const result = await response.json();

      if (result.success && result.pricing) {
        const formattedPricing = {};

        // Process professional services pricing
        if (result.pricing.professional_services) {
          result.pricing.professional_services.forEach(service => {
            formattedPricing[service.slug] = {
              slug: service.slug,
              name: serviceDisplayNames[service.slug] || service.name || service.slug,
              price: service.price || service.amount || 0,
              currency: service.currency || 'USD',
              market: service.market || 'global',
              formatted: formatPrice(service.price || service.amount || 0, service.currency || 'USD'),
              emergency_rate: service.emergency_multiplier || 1.5
            };
          });
        }

        setPricing(formattedPricing);
        return formattedPricing;
      } else {
        // Return fallback pricing for all services
        const fallbackPricing = {};
        serviceSlugs.forEach(slug => {
          fallbackPricing[slug] = getFallbackPrice(slug);
        });
        setPricing(fallbackPricing);
        return fallbackPricing;
      }
    } catch (err) {
      console.error('Dynamic pricing bulk fetch error:', err);
      setError(err.message);

      // Return fallback pricing
      const fallbackPricing = {};
      serviceSlugs.forEach(slug => {
        fallbackPricing[slug] = getFallbackPrice(slug);
      });
      setPricing(fallbackPricing);
      return fallbackPricing;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate custom pricing based on trade volume
   * @param {number} tradeVolume - Annual trade volume
   * @param {string} serviceSlug - Service identifier
   * @returns {Promise<Object>} Custom pricing
   */
  const getCustomPricing = async (tradeVolume, serviceSlug) => {
    if (!tradeVolume || tradeVolume <= 0) {
      return await getServicePrice(serviceSlug);
    }

    try {
      const response = await fetch('/api/dynamic-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calculate_custom_pricing',
          data: { tradeVolume, serviceSlug, market: 'global' }
        })
      });

      const result = await response.json();

      if (result.success && result.custom_pricing) {
        return {
          slug: serviceSlug,
          name: serviceDisplayNames[serviceSlug] || serviceSlug,
          price: result.custom_pricing.final_price,
          currency: result.custom_pricing.currency || 'USD',
          market: 'global',
          formatted: formatPrice(result.custom_pricing.final_price, result.custom_pricing.currency || 'USD'),
          discount: result.custom_pricing.discount_percentage || 0,
          original_price: result.custom_pricing.base_price,
          volume_tier: result.custom_pricing.volume_tier
        };
      }
    } catch (err) {
      console.error('Custom pricing error:', err);
    }

    // Fallback to standard pricing
    return await getServicePrice(serviceSlug);
  };

  /**
   * Get emergency pricing (rush orders)
   * @param {string} serviceSlug - Service identifier
   * @returns {Promise<Object>} Emergency pricing
   */
  const getEmergencyPricing = async (serviceSlug) => {
    const standardPricing = await getServicePrice(serviceSlug);

    try {
      const response = await fetch('/api/dynamic-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_emergency_rate',
          data: { currency: 'USD' }
        })
      });

      const result = await response.json();

      if (result.success && result.emergency_rate) {
        const emergencyPrice = standardPricing.price * (result.emergency_rate.multiplier || 1.5);

        return {
          ...standardPricing,
          price: emergencyPrice,
          formatted: formatPrice(emergencyPrice, standardPricing.currency),
          is_emergency: true,
          multiplier: result.emergency_rate.multiplier || 1.5,
          standard_price: standardPricing.price
        };
      }
    } catch (err) {
      console.error('Emergency pricing error:', err);
    }

    // Fallback: 1.5x standard pricing
    const emergencyPrice = standardPricing.price * 1.5;
    return {
      ...standardPricing,
      price: emergencyPrice,
      formatted: formatPrice(emergencyPrice, standardPricing.currency),
      is_emergency: true,
      multiplier: 1.5,
      standard_price: standardPricing.price
    };
  };

  return {
    pricing,
    loading,
    error,
    getServicePrice,
    getAllPricing,
    getCustomPricing,
    getEmergencyPricing
  };
};

// Helper function to format prices
function formatPrice(amount, currency = 'USD') {
  if (!amount || amount === 0) return 'TBD';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Fallback pricing when API is unavailable
function getFallbackPrice(serviceSlug) {
  const fallbackPrices = {
    'mexico-supplier-sourcing': 500,
    'mexico-manufacturing-feasibility': 650,
    'mexico-market-entry': 400,
    'usmca-certificate': 200,
    'hs-classification': 150,
    'document-review': 250,
    'monthly-support': 99,
    'crisis-response': 450
  };

  const price = fallbackPrices[serviceSlug] || 299;

  return {
    slug: serviceSlug,
    name: serviceDisplayNames[serviceSlug] || serviceSlug,
    price: price,
    currency: 'USD',
    market: 'global',
    formatted: formatPrice(price, 'USD'),
    emergency_rate: 1.5,
    is_fallback: true
  };
}

export default useDynamicPricing;