/**
 * Admin Prospects Management API
 * CRUD operations for sales prospects
 * Restricted to admin users only
 * USES COOKIE-BASED AUTHENTICATION (triangle_session)
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verify session cookie
function verifySession(cookieValue) {
  try {
    if (!cookieValue) return null;

    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const { data, sig } = JSON.parse(decoded);

    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const expectedSig = crypto.createHmac('sha256', secret)
      .update(dataString)
      .digest('hex');

    if (sig !== expectedSig) return null;

    const sessionData = typeof data === 'string' ? JSON.parse(data) : data;

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - sessionData.timestamp > sevenDaysMs) return null;

    return sessionData;
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    // Verify admin access using cookie-based session
    const cookies = parse(req.headers.cookie || '');
    const sessionCookie = cookies.triangle_session;

    if (!sessionCookie) {
      return res.status(401).json({ error: 'Unauthorized - No session found' });
    }

    const session = verifySession(sessionCookie);

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized - Invalid session' });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin, role')
      .eq('user_id', session.userId)
      .single();

    const isAdmin = profile?.is_admin === true || profile?.role === 'admin' || session.isAdmin === true;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return await getProspects(req, res);
      case 'POST':
        return await createProspect(req, res);
      case 'PUT':
        return await updateProspect(req, res);
      case 'DELETE':
        return await deleteProspect(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Prospects API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// GET - Fetch prospects with optional filters
async function getProspects(req, res) {
  const { stage, country, industry, limit = 50 } = req.query;

  let query = supabase
    .from('sales_prospects')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(parseInt(limit));

  if (stage) query = query.eq('stage', stage);
  if (country) query = query.eq('country', country);
  if (industry) query = query.eq('industry', industry);

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({
    success: true,
    data,
    count: data.length
  });
}

// POST - Create new prospect
async function createProspect(req, res) {
  const {
    name,
    email,
    company,
    phone,
    stage = 'initial_contact',
    deal_value,
    expected_close_date,
    country,
    industry,
    lead_source,
    assigned_to,
    notes
  } = req.body;

  // Validation
  if (!name || !email) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Name and email are required'
    });
  }

  // Check if prospect already exists
  const { data: existing } = await supabase
    .from('sales_prospects')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return res.status(409).json({
      error: 'Prospect already exists with this email'
    });
  }

  const { data, error } = await supabase
    .from('sales_prospects')
    .insert([{
      name,
      email,
      company,
      phone,
      stage,
      deal_value: deal_value ? parseFloat(deal_value) : null,
      expected_close_date,
      country,
      industry,
      lead_source,
      assigned_to,
      notes,
      last_contact_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({
    success: true,
    message: 'Prospect created successfully',
    data
  });
}

// PUT - Update prospect (including stage progression)
async function updateProspect(req, res) {
  const { id, ...updates } = req.body;

  if (!id) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Prospect ID is required'
    });
  }

  // If stage is being updated, update last_contact_date
  if (updates.stage) {
    updates.last_contact_date = new Date().toISOString().split('T')[0];
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('sales_prospects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: 'Prospect not found' });
  }

  return res.status(200).json({
    success: true,
    message: 'Prospect updated successfully',
    data
  });
}

// DELETE - Delete prospect
async function deleteProspect(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Prospect ID is required'
    });
  }

  const { error } = await supabase
    .from('sales_prospects')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({
    success: true,
    message: 'Prospect deleted successfully'
  });
}
