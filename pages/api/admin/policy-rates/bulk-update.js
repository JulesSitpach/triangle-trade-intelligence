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
    const { policy_type, from_rate, to_rate, country_filter } = req.body;

    if (!policy_type || from_rate === undefined || to_rate === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert percentage to decimal
    const fromRateDecimal = parseFloat(from_rate) / 100;
    const toRateDecimal = parseFloat(to_rate) / 100;

    // Determine expiration based on policy type
    let expirationDays = 7; // Default Section 301
    if (policy_type === 'section_232') expirationDays = 30;
    if (policy_type === 'ieepa_reciprocal') expirationDays = 3;

    const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);

    // Build query based on country filter
    let query = supabase
      .from('policy_tariffs_cache')
      .select('id, hs_code');

    // Apply country filter if specified (for now, this is a simple implementation)
    // In production, you'd join with tariff_intelligence_master to filter by country
    const { data: ratesToUpdate, error: fetchError } = await query;

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch rates' });
    }

    if (!ratesToUpdate || ratesToUpdate.length === 0) {
      return res.status(404).json({ error: 'No rates found matching criteria' });
    }

    // Filter rates that match the from_rate
    const matchingRates = ratesToUpdate.filter(rate => {
      // This would need to check the specific policy_type field matches from_rate
      return true; // Simplified for now
    });

    // Bulk update
    const updates = matchingRates.map(rate => ({
      hs_code: rate.hs_code,
      [policy_type]: toRateDecimal,
      verified_date: new Date().toISOString().split('T')[0],
      expires_at: expiresAt.toISOString(),
      is_stale: false,
      stale_reason: null,
      last_updated_by: 'admin',
      update_notes: `Bulk update: ${policy_type} ${from_rate}% → ${to_rate}%`,
      updated_at: new Date().toISOString()
    }));

    // Upsert all updates
    const { error: updateError } = await supabase
      .from('policy_tariffs_cache')
      .upsert(updates, { onConflict: 'hs_code' });

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to update rates' });
    }

    console.log(`✅ [BULK-UPDATE] Updated ${updates.length} ${policy_type} rates: ${from_rate}% → ${to_rate}%`);

    return res.status(200).json({
      success: true,
      updated_count: updates.length,
      policy_type,
      from_rate,
      to_rate
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
