import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError } from '../../../lib/api/errorHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get user's USMCA certificates
 * GET /api/certificates/list?limit=10&offset=0&status=&search=
 */
export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.userId;
    const {
      limit = 20,
      offset = 0,
      status = '',
      search = ''
    } = req.query;

    try {
      // Build query
      let query = supabase
        .from('service_requests')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('service_type', 'usmca_certificate');

      // Filter by status if provided
      if (status) {
        query = query.eq('status', status);
      }

      // Search by company name or product if provided
      if (search) {
        query = query.or(`client_company.ilike.%${search}%,subscriber_data->>product_description.ilike.%${search}%`);
      }

      // Apply pagination and ordering
      const { data: certificates, error, count } = await query
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (error) {
        throw new ApiError('Failed to fetch certificates', 500, {
          error: error.message
        });
      }

      // Format certificates for response
      const formattedCertificates = certificates.map(cert => ({
        id: cert.id,
        company: cert.client_company,
        product: cert.subscriber_data?.product_description || 'N/A',
        status: cert.status,
        qualification_status: cert.subscriber_data?.qualification_status || 'Unknown',
        annual_tariff_cost: cert.subscriber_data?.annual_tariff_cost || 0,
        potential_savings: cert.subscriber_data?.potential_usmca_savings || 0,
        created_at: cert.created_at,
        updated_at: cert.updated_at,
        certificate_url: cert.completion_data?.certificate_url || null,
        certificate_data: cert.completion_data || null
      }));

      return res.status(200).json({
        success: true,
        certificates: formattedCertificates,
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Error fetching certificates:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to fetch certificates', 500, {
        error: error.message
      });
    }
  }
});
