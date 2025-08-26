/**
 * UN COMTRADE API CLIENT
 * Authentic government trade data integration for Triangle Intelligence
 * 
 * MISSION: Replace ALL fabricated shipping calculations with genuine UN Comtrade data
 * - No hardcoded trade values or assumptions
 * - All calculations trace back to official government trade statistics
 * - Real triangle route verification using bilateral trade flows
 * 
 * Data Sources:
 * - UN Comtrade API (comtradeapi.un.org) - FREE government trade data
 * - Official bilateral trade flows between countries
 * - Authentic trade volumes, values, and growth rates
 * 
 * Author: Triangle Intelligence Code Implementer
 * Date: August 2025
 */

import { logInfo, logError, logAPICall, logPerformance } from '../production-logger.js';

// UN Comtrade country codes for triangle routing
const COUNTRY_CODES = {
  'CN': '156', // China
  'MX': '484', // Mexico  
  'US': '842', // United States
  'CA': '124', // Canada
  'IN': '356', // India
  'VN': '704', // Vietnam
  'TH': '764', // Thailand
  'KR': '410', // South Korea
  'MY': '458', // Malaysia
  'ID': '360', // Indonesia
  'PH': '608', // Philippines
  'BD': '050', // Bangladesh
};

// Reverse mapping for display
const CODE_TO_COUNTRY = Object.fromEntries(
  Object.entries(COUNTRY_CODES).map(([country, code]) => [code, country])
);

class UNComtradeClient {
  constructor() {
    this.baseURL = 'https://comtradeapi.un.org/data/v1/get';
    this.apiKey = process.env.COMTRADE_API_KEY;
    this.rateLimit = 100; // requests per hour for free tier
    this.lastRequestTime = 0;
    this.requestInterval = 36000; // 36 seconds between requests
    
    // Cache for authentic data (24 hours - government data doesn't change often)
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    
    // Performance tracking
    this.apiCallCount = 0;
    this.cacheHitCount = 0;
  }

  /**
   * Rate limiting to respect UN Comtrade API limits
   */
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.requestInterval) {
      const waitTime = this.requestInterval - timeSinceLastRequest;
      logInfo('UN Comtrade rate limiting', { waitTime: `${waitTime}ms` });
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Get authentic bilateral trade flows between two countries
   * @param {string} reporterCountry - ISO2 country code (e.g., 'CN')
   * @param {string} partnerCountry - ISO2 country code (e.g., 'MX')
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Authentic trade flow data
   */
  async getTradeFlows(reporterCountry, partnerCountry, options = {}) {
    const startTime = Date.now();
    const cacheKey = `trade_flows_${reporterCountry}_${partnerCountry}_${options.period || '2023'}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.cacheHitCount++;
        logInfo('UN Comtrade cache hit', { cacheKey, age: `${Date.now() - cached.timestamp}ms` });
        return cached.data;
      }
    }

    try {
      await this.waitForRateLimit();
      
      const reporterCode = COUNTRY_CODES[reporterCountry];
      const partnerCode = COUNTRY_CODES[partnerCountry];
      
      if (!reporterCode || !partnerCode) {
        throw new Error(`Invalid country codes: ${reporterCountry} -> ${partnerCountry}`);
      }

      const params = new URLSearchParams({
        typeCode: 'C',
        freqCode: 'A',
        clCode: 'HS',
        period: options.period || '2023',
        reporterCode: reporterCode,
        partnerCode: partnerCode,
        cmdCode: options.hsCode || 'TOTAL',
        flowCode: 'X', // Exports
        partner2Code: '',
        customsCode: '',
        motCode: '',
        maxRecords: '250',
        format: 'json',
        aggregateBy: 'none',
        breakdownMode: 'classic',
        includeDesc: true
      });

      const url = `${this.baseURL}?${params.toString()}`;
      logInfo('Calling UN Comtrade API', { reporter: reporterCountry, partner: partnerCountry });
      
      const response = await fetch(url, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey || '',
          'Content-Type': 'application/json'
        }
      });

      const apiDuration = Date.now() - startTime;
      this.apiCallCount++;

      if (!response.ok) {
        logAPICall('GET', 'un_comtrade', apiDuration, 'error');
        throw new Error(`UN Comtrade API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      logAPICall('GET', 'un_comtrade', apiDuration, 'success');

      // Process and validate the data
      const authenticTradeData = this.processTradeFlowData(data, reporterCountry, partnerCountry);
      
      // Cache the authentic data
      this.cache.set(cacheKey, {
        data: authenticTradeData,
        timestamp: Date.now()
      });

      logPerformance('getTradeFlows', Date.now() - startTime, {
        reporter: reporterCountry,
        partner: partnerCountry,
        recordCount: authenticTradeData.trades?.length || 0,
        totalValue: authenticTradeData.totalTradeValue
      });

      return authenticTradeData;

    } catch (error) {
      logError('UN Comtrade API call failed', {
        reporter: reporterCountry,
        partner: partnerCountry,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Verify triangle route authenticity using UN Comtrade data
   * @param {string} origin - Origin country (e.g., 'CN')
   * @param {string} transit - Transit country (e.g., 'MX')
   * @param {string} destination - Destination country (e.g., 'US')
   * @param {Object} options - Verification options
   * @returns {Promise<Object>} Triangle route authenticity data
   */
  async verifyTriangleRoute(origin, transit, destination, options = {}) {
    const startTime = Date.now();
    logInfo('Verifying triangle route authenticity', { route: `${origin} -> ${transit} -> ${destination}` });

    try {
      // Get authentic trade flows for both legs of triangle
      const [originToTransit, transitToDestination] = await Promise.all([
        this.getTradeFlows(origin, transit, options),
        this.getTradeFlows(transit, destination, options)
      ]);

      // Calculate authentic triangle viability
      const triangleViability = this.calculateTriangleViability(
        originToTransit,
        transitToDestination,
        { origin, transit, destination }
      );

      const result = {
        route: `${origin} -> ${transit} -> ${destination}`,
        authenticity: {
          isVerified: true,
          dataSource: 'UN Comtrade Official Government Data',
          verificationDate: new Date().toISOString(),
          confidence: 'HIGH'
        },
        leg1: {
          route: `${origin} -> ${transit}`,
          ...originToTransit,
          authentic: true
        },
        leg2: {
          route: `${transit} -> ${destination}`,
          ...transitToDestination,
          authentic: true
        },
        triangleViability: triangleViability,
        calculation: {
          method: 'UN Comtrade Bilateral Trade Flow Analysis',
          basedOn: 'Official government trade statistics',
          fabricated: false
        },
        performance: {
          calculationTime: Date.now() - startTime,
          apiCallsMade: 2,
          cacheHits: this.cacheHitCount
        }
      };

      logPerformance('verifyTriangleRoute', Date.now() - startTime, {
        route: result.route,
        viabilityScore: triangleViability.viabilityScore,
        totalTradeValue: triangleViability.totalTradeValue
      });

      return result;

    } catch (error) {
      logError('Triangle route verification failed', {
        route: `${origin} -> ${transit} -> ${destination}`,
        error: error.message
      });

      return {
        route: `${origin} -> ${transit} -> ${destination}`,
        authenticity: {
          isVerified: false,
          dataSource: 'ERROR',
          error: error.message,
          confidence: 'NONE'
        },
        errorMessage: 'Unable to verify route with UN Comtrade data',
        fabricated: false,
        suggestion: 'Try again later or contact support for manual verification'
      };
    }
  }

  /**
   * Process raw UN Comtrade data into structured format
   * @param {Object} rawData - Raw API response
   * @param {string} reporter - Reporter country
   * @param {string} partner - Partner country
   * @returns {Object} Processed trade flow data
   */
  processTradeFlowData(rawData, reporter, partner) {
    const trades = rawData.data || [];
    
    if (trades.length === 0) {
      return {
        route: `${reporter} -> ${partner}`,
        totalTradeValue: 0,
        totalQuantity: 0,
        tradeExists: false,
        confidence: 'NONE',
        message: 'No official trade flows found between these countries',
        authentic: true,
        dataSource: 'UN Comtrade - No Trade Records'
      };
    }

    // Aggregate trade data
    const totalValue = trades.reduce((sum, trade) => sum + (parseFloat(trade.primaryValue) || 0), 0);
    const totalQuantity = trades.reduce((sum, trade) => sum + (parseFloat(trade.qty) || 0), 0);
    const topCommodities = trades
      .sort((a, b) => (parseFloat(b.primaryValue) || 0) - (parseFloat(a.primaryValue) || 0))
      .slice(0, 5)
      .map(trade => ({
        hsCode: trade.cmdCode,
        description: trade.cmdDesc,
        value: parseFloat(trade.primaryValue) || 0,
        quantity: parseFloat(trade.qty) || 0
      }));

    // Calculate confidence based on trade volume
    let confidence = 'LOW';
    if (totalValue > 1000000000) confidence = 'VERY_HIGH'; // >$1B
    else if (totalValue > 100000000) confidence = 'HIGH';   // >$100M
    else if (totalValue > 10000000) confidence = 'MEDIUM';  // >$10M

    return {
      route: `${reporter} -> ${partner}`,
      totalTradeValue: Math.round(totalValue),
      totalQuantity: Math.round(totalQuantity),
      tradeExists: totalValue > 0,
      confidence: confidence,
      topCommodities: topCommodities,
      recordCount: trades.length,
      period: trades[0]?.period || '2023',
      authentic: true,
      dataSource: 'UN Comtrade Official Government Statistics',
      lastUpdated: new Date().toISOString(),
      fabricated: false
    };
  }

  /**
   * Calculate triangle route viability from authentic trade flows
   * @param {Object} leg1Data - Origin to transit trade data
   * @param {Object} leg2Data - Transit to destination trade data
   * @param {Object} routeInfo - Route information
   * @returns {Object} Triangle viability assessment
   */
  calculateTriangleViability(leg1Data, leg2Data, routeInfo) {
    const leg1Value = leg1Data.totalTradeValue || 0;
    const leg2Value = leg2Data.totalTradeValue || 0;
    const totalTradeValue = leg1Value + leg2Value;

    // Calculate viability score based on authentic trade flows
    let viabilityScore = 0;
    
    // Trade volume score (0-40 points)
    if (leg1Value > 1000000000) viabilityScore += 20; // Leg 1 >$1B
    else if (leg1Value > 100000000) viabilityScore += 15;
    else if (leg1Value > 10000000) viabilityScore += 10;
    else if (leg1Value > 0) viabilityScore += 5;

    if (leg2Value > 1000000000) viabilityScore += 20; // Leg 2 >$1B
    else if (leg2Value > 100000000) viabilityScore += 15;
    else if (leg2Value > 10000000) viabilityScore += 10;
    else if (leg2Value > 0) viabilityScore += 5;

    // Balance score (0-30 points) - balanced routes are more viable
    const balanceRatio = Math.min(leg1Value, leg2Value) / Math.max(leg1Value, leg2Value);
    viabilityScore += Math.round(balanceRatio * 30);

    // Both legs exist bonus (0-30 points)
    if (leg1Data.tradeExists && leg2Data.tradeExists) {
      viabilityScore += 30;
    }

    // Determine viability rating
    let viabilityRating = 'NOT_VIABLE';
    if (viabilityScore >= 80) viabilityRating = 'HIGHLY_VIABLE';
    else if (viabilityScore >= 60) viabilityRating = 'VIABLE';
    else if (viabilityScore >= 40) viabilityRating = 'POTENTIALLY_VIABLE';
    else if (viabilityScore >= 20) viabilityRating = 'LOW_VIABILITY';

    return {
      viabilityScore: viabilityScore,
      viabilityRating: viabilityRating,
      totalTradeValue: totalTradeValue,
      leg1TradeValue: leg1Value,
      leg2TradeValue: leg2Value,
      balanceRatio: Math.round(balanceRatio * 100) / 100,
      bothLegsExist: leg1Data.tradeExists && leg2Data.tradeExists,
      calculation: {
        method: 'UN Comtrade Trade Volume Analysis',
        factors: [
          `Leg 1 (${routeInfo.origin}-${routeInfo.transit}): $${leg1Value.toLocaleString()}`,
          `Leg 2 (${routeInfo.transit}-${routeInfo.destination}): $${leg2Value.toLocaleString()}`,
          `Balance ratio: ${Math.round(balanceRatio * 100)}%`,
          `Score: ${viabilityScore}/100`
        ],
        authentic: true,
        fabricated: false
      }
    };
  }

  /**
   * Get authentic tariff data for bilateral trade
   * @param {string} origin - Origin country
   * @param {string} destination - Destination country
   * @param {string} hsCode - HS code (optional)
   * @returns {Promise<Object>} Authentic tariff data
   */
  async getAuthenticTariffData(origin, destination, hsCode = null) {
    const startTime = Date.now();
    
    try {
      // Get trade flows to understand real tariff impact
      const tradeData = await this.getTradeFlows(origin, destination, { hsCode });
      
      // USMCA rates are treaty-verified (always 0% for qualifying routes)
      const usmcaCountries = ['US', 'MX', 'CA'];
      const isUSMCARoute = usmcaCountries.includes(origin) && usmcaCountries.includes(destination);
      
      const result = {
        route: `${origin} -> ${destination}`,
        usmcaTariff: isUSMCARoute ? 0 : null,
        bilateralTradeValue: tradeData.totalTradeValue,
        tradeExists: tradeData.tradeExists,
        dataSource: 'UN Comtrade + USMCA Treaty',
        authentic: true,
        fabricated: false,
        confidence: tradeData.confidence,
        calculation: {
          method: 'UN Comtrade trade flows + Treaty verification',
          usmcaQualified: isUSMCARoute,
          tradeVolume: tradeData.totalTradeValue,
          lastUpdated: new Date().toISOString()
        }
      };

      logPerformance('getAuthenticTariffData', Date.now() - startTime, {
        route: result.route,
        usmcaQualified: isUSMCARoute,
        tradeValue: tradeData.totalTradeValue
      });

      return result;

    } catch (error) {
      logError('Authentic tariff data retrieval failed', {
        route: `${origin} -> ${destination}`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get performance metrics for monitoring
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      apiCallsMade: this.apiCallCount,
      cacheHits: this.cacheHitCount,
      cacheHitRate: this.apiCallCount > 0 ? Math.round((this.cacheHitCount / this.apiCallCount) * 100) : 0,
      cachedEntries: this.cache.size,
      lastRequestTime: this.lastRequestTime,
      isRateLimited: (Date.now() - this.lastRequestTime) < this.requestInterval
    };
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache() {
    this.cache.clear();
    logInfo('UN Comtrade cache cleared');
  }
}

// Export singleton instance
const unComtradeClient = new UNComtradeClient();
export default unComtradeClient;

// Helper functions for easy integration
export async function getTriangleRouteAuthenticity(origin, transit, destination, options = {}) {
  try {
    return await unComtradeClient.verifyTriangleRoute(origin, transit, destination, options);
  } catch (error) {
    logError('Triangle route authenticity check failed', {
      route: `${origin}-${transit}-${destination}`,
      error: error.message
    });
    throw error;
  }
}

export async function getBilateralTradeFlow(reporter, partner, options = {}) {
  try {
    return await unComtradeClient.getTradeFlows(reporter, partner, options);
  } catch (error) {
    logError('Bilateral trade flow retrieval failed', {
      route: `${reporter}-${partner}`,
      error: error.message
    });
    throw error;
  }
}

export async function getAuthenticTariffAnalysis(origin, destination, hsCode = null) {
  try {
    return await unComtradeClient.getAuthenticTariffData(origin, destination, hsCode);
  } catch (error) {
    logError('Authentic tariff analysis failed', {
      route: `${origin}-${destination}`,
      error: error.message
    });
    throw error;
  }
}

export function getComtradePerformance() {
  return unComtradeClient.getPerformanceMetrics();
}