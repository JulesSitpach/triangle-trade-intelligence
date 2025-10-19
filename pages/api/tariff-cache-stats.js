/**
 * Tariff Cache Performance Statistics API
 * Provides real-time cache performance metrics for admin monitoring
 *
 * Metrics:
 * - Cache hit rate by destination country
 * - Total cached entries (active vs expired)
 * - Average cache age
 * - Cost savings estimate (vs full AI lookups)
 */

import { createClient } from '@supabase/supabase-js';
import { protectedApiHandler, sendSuccess } from '../../lib/api/apiHandler.js';
import { ApiError } from '../../lib/api/errorHandler.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  GET: async (req, res) => {
    const { destination_country } = req.query;

    try {
      // Build query for overall stats or specific destination
      let query = supabase
        .from('tariff_cache')
        .select('*');

      if (destination_country) {
        query = query.eq('destination_country', destination_country);
      }

      const { data: allCache, error } = await query;

      if (error) {
        throw new ApiError('Failed to fetch cache stats', 500, { details: error.message });
      }

      // Calculate statistics
      const now = new Date();
      const activeCache = allCache.filter(entry => new Date(entry.expires_at) > now);
      const expiredCache = allCache.filter(entry => new Date(entry.expires_at) <= now);

      // Group by destination country
      const statsByCountry = {};
      ['MX', 'CA', 'US'].forEach(country => {
        const countryCache = allCache.filter(entry => entry.destination_country === country);
        const countryActive = activeCache.filter(entry => entry.destination_country === country);

        if (countryCache.length > 0) {
          // Calculate average cache age for active entries
          const avgCacheAgeDays = countryActive.length > 0
            ? countryActive.reduce((sum, entry) => {
                const ageMs = now - new Date(entry.cached_at).getTime();
                return sum + (ageMs / (24 * 60 * 60 * 1000));
              }, 0) / countryActive.length
            : 0;

          // Calculate cache hit rate estimate (active entries / total queries would be needed for real rate)
          // For now, use active vs total as proxy
          const cacheHitRateEstimate = countryCache.length > 0
            ? (countryActive.length / countryCache.length) * 100
            : 0;

          // Estimate cost savings
          // Assumptions:
          // - Mexico: Database (free) vs AI ($0.02) = 100% savings
          // - Canada: Cached AI ($0) vs fresh AI ($0.02) = 100% savings when cached
          // - USA: Cached AI ($0) vs fresh AI ($0.05) = 100% savings when cached
          const costPerLookup = country === 'US' ? 0.05 : 0.02;
          const estimatedSavings = countryActive.length * costPerLookup;

          statsByCountry[country] = {
            total_entries: countryCache.length,
            active_entries: countryActive.length,
            expired_entries: countryCache.length - countryActive.length,
            cache_hit_rate_estimate: Math.round(cacheHitRateEstimate * 10) / 10,
            avg_cache_age_days: Math.round(avgCacheAgeDays * 10) / 10,
            cache_strategy: country === 'MX' ? 'database' : country === 'CA' ? 'ai_90day' : 'ai_24hr',
            cache_ttl_hours: country === 'MX' ? null : country === 'CA' ? 2160 : 24,
            cost_savings_estimate_usd: Math.round(estimatedSavings * 100) / 100,
            most_recent_cache: countryCache.length > 0 ? countryCache.reduce((latest, entry) =>
              new Date(entry.cached_at) > new Date(latest.cached_at) ? entry : latest
            ).cached_at : null,
            oldest_cache: countryCache.length > 0 ? countryCache.reduce((oldest, entry) =>
              new Date(entry.cached_at) < new Date(oldest.cached_at) ? entry : oldest
            ).cached_at : null
          };
        }
      });

      // Overall statistics
      const totalCostSavings = Object.values(statsByCountry).reduce(
        (sum, stats) => sum + stats.cost_savings_estimate_usd,
        0
      );

      const overallStats = {
        timestamp: now.toISOString(),
        overall: {
          total_cached_entries: allCache.length,
          active_cache_entries: activeCache.length,
          expired_cache_entries: expiredCache.length,
          cache_hit_rate_estimate: allCache.length > 0
            ? Math.round((activeCache.length / allCache.length) * 100 * 10) / 10
            : 0,
          total_cost_savings_estimate_usd: Math.round(totalCostSavings * 100) / 100
        },
        by_destination: statsByCountry,
        cache_health: {
          status: activeCache.length > 0 ? 'healthy' : 'empty',
          recommendation: activeCache.length === 0
            ? 'No active cache entries. System will use AI for all lookups (higher cost).'
            : expiredCache.length > 10
            ? `${expiredCache.length} expired entries can be cleaned up.`
            : 'Cache operating normally.'
        }
      };

      return sendSuccess(res, overallStats, 'Cache statistics retrieved successfully');

    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to calculate cache statistics', 500, { details: error.message });
    }
  }
});
