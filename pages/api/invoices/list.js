import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError } from '../../../lib/api/errorHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get user's invoices
 * GET /api/invoices/list?limit=10&offset=0
 */
export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    try {
      // Get user's Stripe customer ID
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (userError || !user || !user.stripe_customer_id) {
        return res.status(200).json({
          success: true,
          invoices: [],
          total: 0,
          message: 'No invoices found'
        });
      }

      // Get invoices from database
      const { data: invoices, error, count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .eq('stripe_customer_id', user.stripe_customer_id)
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (error) {
        throw new ApiError('Failed to fetch invoices', 500, {
          error: error.message
        });
      }

      // Format invoices for response
      const formattedInvoices = invoices.map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        amount: invoice.amount / 100, // Convert cents to dollars
        currency: invoice.currency.toUpperCase(),
        status: invoice.status,
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        description: invoice.description,
        paid_at: invoice.paid_at,
        due_date: invoice.due_date,
        created_at: invoice.created_at
      }));

      return res.status(200).json({
        success: true,
        invoices: formattedInvoices,
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw new ApiError('Failed to fetch invoices', 500, {
        error: error.message
      });
    }
  }
});
