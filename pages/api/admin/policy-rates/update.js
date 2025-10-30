import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { hs_code, section_301, section_232, ieepa_reciprocal, expiration_days } = req.body;

    if (!hs_code) {
      return res.status(400).json({ error: 'HS code is required' });
    }

    // Normalize HS code to 8 digits
    const normalizedHsCode = hs_code.replace(/\D/g, '').substring(0, 8).padEnd(8, '0');

    // Calculate expiration
    const expirationDaysInt = parseInt(expiration_days) || 7;
    const expiresAt = new Date(Date.now() + expirationDaysInt * 24 * 60 * 60 * 1000);

    // Build update object with only provided rates
    const updateData = {
      hs_code: normalizedHsCode,
      verified_date: new Date().toISOString().split('T')[0],
      expires_at: expiresAt.toISOString(),
      is_stale: false,
      stale_reason: null,
      last_updated_by: 'admin',
      update_notes: `Manual update via admin dashboard`,
      updated_at: new Date().toISOString(),
      data_source: 'admin_manual'
    };

    // Only include rates that were provided (not empty strings)
    if (section_301 !== undefined && section_301 !== '') {
      updateData.section_301 = parseFloat(section_301);
    }
    if (section_232 !== undefined && section_232 !== '') {
      updateData.section_232 = parseFloat(section_232);
    }
    if (ieepa_reciprocal !== undefined && ieepa_reciprocal !== '') {
      updateData.ieepa_reciprocal = parseFloat(ieepa_reciprocal);
    }

    // Upsert the rate
    const { data, error } = await supabase
      .from('policy_tariffs_cache')
      .upsert(updateData, { onConflict: 'hs_code' })
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return res.status(500).json({ error: 'Failed to update rate' });
    }

    console.log(`✅ [POLICY-UPDATE] Updated HS ${normalizedHsCode}:`, {
      section_301: updateData.section_301,
      section_232: updateData.section_232,
      ieepa_reciprocal: updateData.ieepa_reciprocal,
      expires: expiresAt.toISOString()
    });

    return res.status(200).json({
      success: true,
      rate: data
    });
  } catch (error) {
    console.error('Single update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
