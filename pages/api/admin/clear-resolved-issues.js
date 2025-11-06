/**
 * ADMIN API: Clear Resolved Issues
 * Deletes all resolved issues from dev_issues table to keep dashboard clean
 *
 * Security: Protected endpoint - requires admin authentication
 */

import { createClient } from '@supabase/supabase-js';
import { protectedApiHandler } from '../../../lib/api/apiHandler';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.id;

    try {
      console.log('🧹 [ADMIN] Clear resolved issues request from user:', userId);

      // Check if user is admin (Premium tier or specific admin user)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier, email')
        .eq('user_id', userId)
        .single();

      const isAdmin = profile?.subscription_tier === 'Premium' || profile?.subscription_tier === 'Enterprise';

      if (!isAdmin) {
        console.log('❌ [ADMIN] Access denied - user is not admin:', userId);
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Only admin users can clear resolved issues'
        });
      }

      // Count resolved issues before deletion
      const { count: resolvedCount, error: countError } = await supabase
        .from('dev_issues')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', true);

      if (countError) {
        throw countError;
      }

      console.log(`🧹 [ADMIN] Found ${resolvedCount} resolved issues to delete`);

      // Delete all resolved issues
      const { error: deleteError } = await supabase
        .from('dev_issues')
        .delete()
        .eq('resolved', true);

      if (deleteError) {
        throw deleteError;
      }

      console.log(`✅ [ADMIN] Successfully deleted ${resolvedCount} resolved issues`);

      return res.status(200).json({
        success: true,
        message: `Successfully cleared ${resolvedCount} resolved issues`,
        deleted_count: resolvedCount,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [ADMIN] Error clearing resolved issues:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to clear resolved issues',
        message: error.message
      });
    }
  }
});
