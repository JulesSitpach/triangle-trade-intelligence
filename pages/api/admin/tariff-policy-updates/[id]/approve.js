/**
 * POST /api/admin/tariff-policy-updates/[id]/approve
 * Approve a policy update and activate it for AI prompt inclusion
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

    console.log(`✅ Approving policy update: ${id}`);

    // Update policy to approved and active
    const { data: updatedPolicy, error } = await supabase
      .from('tariff_policy_updates')
      .update({
        status: 'approved',
        is_active: true,
        reviewed_by: 'Admin', // TODO: Get from session
        reviewed_at: new Date().toISOString(),
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

    console.log(`✅ Policy approved and activated: ${updatedPolicy.title}`);

    return res.status(200).json({
      success: true,
      message: 'Policy update approved and activated',
      policy: updatedPolicy
    });
  } catch (error) {
    console.error('❌ Error approving policy update:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve policy update',
      error: error.message
    });
  }
}
