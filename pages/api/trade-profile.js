/**
 * TRADE PROFILE API
 * Manages non-personal trade classification data for persistent alerts
 * Privacy-focused: No business names, volumes, or sensitive information
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function verifySession(cookieValue) {
  try {
    if (!cookieValue) return null;

    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const { data, sig } = JSON.parse(decoded);

    const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    const expectedSig = crypto.createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');

    if (sig !== expectedSig) return null;

    // Check expiration (7 days)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > sevenDaysMs) return null;

    return data;
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  const { method } = req;

  // Verify cookie-based authentication
  const cookies = parse(req.headers.cookie || '');
  const sessionCookie = cookies.triangle_session;

  if (!sessionCookie) {
    console.log('❌ No session cookie found');
    return res.status(401).json({ error: 'Authentication required - no session' });
  }

  const session = verifySession(sessionCookie);

  if (!session) {
    console.log('❌ Invalid session cookie');
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  console.log('✅ Session verified for user:', session.email);

  try {
    switch (method) {
      case 'GET':
        return await getTradeProfile(session.userId, res);

      case 'POST':
        return await saveTradeProfile(session.userId, req.body, res);

      case 'DELETE':
        return await deleteTradeProfile(session.userId, res);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Trade profile API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getTradeProfile(userId, res) {
  try {
    const { data, error } = await supabase
      .from('trade_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    return res.status(200).json({
      data: data || null,
      message: data ? 'Trade profile found' : 'No trade profile found'
    });
  } catch (error) {
    console.error('Error fetching trade profile:', error);
    return res.status(500).json({ error: 'Failed to fetch trade profile' });
  }
}

async function saveTradeProfile(userId, profileData, res) {
  try {
    const {
      hs_codes = [],
      business_types = [],
      origin_countries = [],
      destination_countries = [],
      usmca_qualification_status,
      qualified_products = 0,
      total_products = 0,
      preferred_routes = [],
      explored_alternatives = []
    } = profileData;

    // Validate input data
    if (!Array.isArray(hs_codes) || hs_codes.length === 0) {
      return res.status(400).json({ error: 'At least one HS code is required' });
    }

    // Use upsert to create or update trade profile
    const { data, error } = await supabase
      .from('trade_profiles')
      .upsert({
        user_id: userId,
        hs_codes: hs_codes.filter(Boolean), // Remove empty values
        business_types: business_types.filter(Boolean),
        origin_countries: origin_countries.filter(Boolean),
        destination_countries: destination_countries.filter(Boolean),
        usmca_qualification_status,
        qualified_products: parseInt(qualified_products) || 0,
        total_products: parseInt(total_products) || 0,
        preferred_routes: preferred_routes.filter(Boolean),
        explored_alternatives: explored_alternatives.filter(Boolean),
        last_classification_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      data,
      message: 'Trade profile saved successfully'
    });
  } catch (error) {
    console.error('Error saving trade profile:', error);
    return res.status(500).json({ error: 'Failed to save trade profile' });
  }
}

async function deleteTradeProfile(userId, res) {
  try {
    const { error } = await supabase
      .from('trade_profiles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      message: 'Trade profile deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting trade profile:', error);
    return res.status(500).json({ error: 'Failed to delete trade profile' });
  }
}