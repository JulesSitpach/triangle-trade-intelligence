import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError } from '../../../lib/api/errorHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * My Services API
 * GET /api/services/my-services
 *
 * Returns all service requests for the logged-in user with status and completion info
 * Used by /my-services page to display user's service request history
 */
export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.id;

    try {
      // Fetch all service requests for this user
      const { data: services, error } = await supabase
        .from('service_requests')
        .select(`
          id,
          service_type,
          status,
          price,
          client_company,
          subscriber_data,
          created_at,
          paid_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user services:', error);
        throw new ApiError('Failed to fetch services', 500);
      }

      // For completed services, fetch completion data
      const completedServiceIds = (services || [])
        .filter(s => s.status === 'completed')
        .map(s => s.id);

      let completions = [];
      if (completedServiceIds.length > 0) {
        const { data: completionData, error: completionError } = await supabase
          .from('service_completions')
          .select('*')
          .in('service_request_id', completedServiceIds);

        if (!completionError) {
          completions = completionData || [];
        }
      }

      // Merge completions with services
      const servicesWithCompletions = (services || []).map(service => {
        const completion = completions.find(c => c.service_request_id === service.id);
        return {
          ...service,
          completion: completion || null
        };
      });

      return res.status(200).json({
        success: true,
        services: servicesWithCompletions,
        total: servicesWithCompletions.length
      });

    } catch (error) {
      console.error('My services API error:', error);
      throw new ApiError(error.message || 'Failed to fetch services', 500);
    }
  }
});
