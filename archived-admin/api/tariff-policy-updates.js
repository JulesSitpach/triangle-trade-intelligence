/**
 * /api/admin/tariff-policy-updates
 * GET: Fetch existing policy updates
 * POST: Create new policy update from RSS item or manual entry
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

async function handleGet(req, res) {
  try {
    console.log('📋 Fetching tariff policy updates...');

    const { status, is_active } = req.query;

    let query = supabase
      .from('tariff_policy_updates')
      .select('*')
      .order('priority', { ascending: true }) // Priority 1 first
      .order('effective_date', { ascending: false }); // Most recent first

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Filter by active status if provided
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data: policies, error } = await query;

    if (error) {
      throw error;
    }

    console.log(`✅ Found ${policies.length} policy updates`);

    return res.status(200).json({
      success: true,
      policies: policies || [],
      count: policies?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching policy updates:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch policy updates',
      error: error.message
    });
  }
}

async function handlePost(req, res) {
  try {
    console.log('📝 Creating new tariff policy update...');

    const {
      title,
      description,
      effective_date,
      policy_type,
      affected_countries,
      affected_hs_codes,
      tariff_adjustment,
      adjustment_percentage,
      prompt_text,
      priority,
      status,
      source_rss_item_id,
      source_url,
      source_feed_name,
      admin_notes
    } = req.body;

    // Validation
    if (!title || !description || !policy_type || !tariff_adjustment || !prompt_text) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, policy_type, tariff_adjustment, prompt_text'
      });
    }

    // Check for duplicates (same title + effective_date)
    if (effective_date) {
      const { data: existing } = await supabase
        .from('tariff_policy_updates')
        .select('id, title')
        .eq('title', title)
        .eq('effective_date', effective_date)
        .single();

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Policy update with same title and effective date already exists',
          existing_id: existing.id
        });
      }
    }

    // Insert new policy update
    const { data: newPolicy, error } = await supabase
      .from('tariff_policy_updates')
      .insert({
        title,
        description,
        effective_date: effective_date || null,
        policy_type,
        affected_countries: affected_countries || [],
        affected_hs_codes: affected_hs_codes || [],
        tariff_adjustment,
        adjustment_percentage: adjustment_percentage ? parseFloat(adjustment_percentage) : null,
        prompt_text,
        is_active: false, // New policies start inactive
        priority: priority || 5,
        status: status || 'pending', // Default to pending admin approval
        source_rss_item_id: source_rss_item_id || null,
        source_url: source_url || null,
        source_feed_name: source_feed_name || null,
        admin_notes: admin_notes || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`✅ Created policy update: ${newPolicy.id} - ${newPolicy.title}`);

    return res.status(201).json({
      success: true,
      message: 'Policy update created successfully',
      policy: newPolicy
    });
  } catch (error) {
    console.error('❌ Error creating policy update:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create policy update',
      error: error.message
    });
  }
}
