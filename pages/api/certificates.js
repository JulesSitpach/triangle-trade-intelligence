/**
 * Certificates API - Returns all USMCA certificates for authenticated user
 */

import { protectedApiHandler } from '../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.id;

    try {
      const { data: certificates, error } = await supabase
        .from('usmca_certificate_completions')
        .select('id, certificate_number, product_description, estimated_annual_savings, created_at, pdf_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching certificates:', error);
        return res.status(500).json({
          error: 'Failed to load certificates',
          details: error.message
        });
      }

      return res.status(200).json({
        certificates: certificates || []
      });

    } catch (error) {
      console.error('Certificates API error:', error);
      return res.status(500).json({
        error: 'Failed to load certificates',
        details: error.message
      });
    }
  }
});
