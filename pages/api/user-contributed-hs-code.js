/**
 * User-Contributed HS Code Capture Endpoint
 * Logs when users manually enter HS codes for future ML training
 * Helps improve classification accuracy over time
 */

import { createClient } from '@supabase/supabase-js';
import { logDevIssue, DevIssue } from '../../lib/utils/logDevIssue.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      hs_code,
      product_description,
      business_type,
      company_name,
      user_confidence
    } = req.body;

    // Validate required fields
    if (!hs_code || !product_description) {
      return res.status(400).json({
        success: false,
        error: 'HS code and product description are required'
      });
    }

    // Log the user-contributed HS code for future analysis
    // This helps improve classification accuracy over time
    console.log('📊 User-Contributed HS Code Captured:', {
      hs_code,
      product_description,
      business_type,
      company_name,
      user_confidence,
      timestamp: new Date().toISOString()
    });

    // Optionally store in database for analytics/ML training
    // This is non-blocking - we don't wait for it
    if (supabase) {
      supabase
        .from('user_contributed_hs_codes')
        .insert({
          hs_code,
          product_description,
          business_type,
          company_name,
          user_confidence,
          created_at: new Date().toISOString()
        })
        .catch(err => {
          // Silently fail - this is optional analytics
          console.log('Could not store HS code in database (optional feature):', err);
        });
    }

    return res.status(200).json({
      success: true,
      message: 'HS code captured successfully'
    });

  } catch (error) {
    console.error('User-contributed HS code capture error:', error);

    await DevIssue.apiError('user_contributed_hs_code', '/api/user-contributed-hs-code', error, {
      productDescription: req.body?.product_description
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to capture HS code'
    });
  }
}
