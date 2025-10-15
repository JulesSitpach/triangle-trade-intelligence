/**
 * POST /api/admin/tariff-policy-updates/[id]/deactivate
 * Deactivate a policy update (remove from AI prompt inclusion)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Policy update ID is required'
      });
    }

    console.log(`⏸️  Deactivating policy update: ${id}`);

    // Update policy to inactive
    const { data: updatedPolicy, error } = await supabase
      .from('tariff_policy_updates')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!updatedPolicy) {
      return res.status(404).json({
        success: false,
        message: 'Policy update not found'
      });
    }

    console.log(`⏸️  Policy deactivated: ${updatedPolicy.title}`);

    return res.status(200).json({
      success: true,
      message: 'Policy update deactivated',
      policy: updatedPolicy
    });
  } catch (error) {
    console.error('❌ Error deactivating policy update:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate policy update',
      error: error.message
    });
  }
}
