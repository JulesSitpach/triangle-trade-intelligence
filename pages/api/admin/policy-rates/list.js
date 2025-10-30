import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all policy rates
    const { data: rates, error } = await supabase
      .from('policy_tariffs_cache')
      .select('*')
      .order('is_stale', { ascending: false })
      .order('expires_at', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch policy rates' });
    }

    // Calculate stats
    const stats = {
      total: rates.length,
      stale: rates.filter(r => r.is_stale).length,
      fresh: rates.filter(r => !r.is_stale).length
    };

    return res.status(200).json({ rates, stats });
  } catch (error) {
    console.error('List policy rates error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
