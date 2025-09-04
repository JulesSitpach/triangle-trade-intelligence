/**
 * User Contributed HS Codes API
 * Captures HS codes that users already know to build intelligence
 * Simple approach for collecting user knowledge
 */

import { getSupabaseServiceClient } from '../../lib/database/supabase-client.js';
import { logInfo, logError, logPerformance } from '../../lib/utils/production-logger.js';

const supabase = getSupabaseServiceClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed - use POST' 
    });
  }

  const startTime = Date.now();
  const { hs_code, product_description, business_type, user_confidence, company_name } = req.body;

  // Validate required fields
  if (!hs_code || !product_description) {
    return res.status(400).json({
      success: false,
      error: 'HS code and product description are required'
    });
  }

  // Basic HS code validation
  if (!/^\d{4,10}$/.test(hs_code.replace(/[.\s-]/g, ''))) {
    return res.status(400).json({
      success: false,
      error: 'HS code must be 4-10 digits (periods, spaces, and dashes are allowed)'
    });
  }

  try {
    logInfo('User contributed HS code', {
      hsCode: hs_code,
      businessType: business_type,
      descriptionLength: product_description.length,
      confidence: user_confidence
    });

    // Clean HS code (remove formatting)
    const cleanHsCode = hs_code.replace(/[.\s-]/g, '');

    // Insert into user_contributed_hs_codes table (matching your exact table structure)
    const insertPayload = {
      id: crypto.randomUUID(), // Generate UUID for primary key
      hs_code: cleanHsCode,
      product_description: product_description.trim(),
      business_type: business_type || 'general',
      company_name: company_name || null,
      user_confidence: user_confidence || 5,
      created_at: new Date().toISOString(),
      validated: false
    };

    logInfo('Attempting to insert user HS code', { payload: insertPayload });

    const { error: insertError } = await supabase
      .from('user_contributed_hs_codes')
      .insert([insertPayload]);

    if (insertError) {
      logError('Database insert failed', insertError.message, { 
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint 
      });
      throw new Error(`Database insert error: ${insertError.message} (Code: ${insertError.code})`);
    }

    // Check if this HS code already exists in our reference data
    const { data: existingHS, error: hsError } = await supabase
      .from('comtrade_reference')
      .select('hs_code, product_description')
      .eq('hs_code', cleanHsCode)
      .limit(1);

    if (hsError) {
      logError('Error checking existing HS code', hsError.message);
    }

    const processingTime = Date.now() - startTime;

    logPerformance('User HS code saved successfully', processingTime, {
      hsCode: cleanHsCode,
      existsInReference: existingHS && existingHS.length > 0,
      businessType: business_type
    });

    // Return success with additional context
    return res.status(200).json({
      success: true,
      message: 'HS code saved successfully',
      hs_code: cleanHsCode,
      exists_in_system: existingHS && existingHS.length > 0,
      system_description: existingHS && existingHS.length > 0 ? existingHS[0].product_description : null,
      processing_time_ms: processingTime,
      next_step: 'Your contribution will help improve AI suggestions for similar products'
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logError('Failed to save user HS code', error?.message || 'Unknown error', {
      processingTimeMs: processingTime,
      hsCode: hs_code,
      businessType: business_type
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to save HS code',
      processing_time_ms: processingTime
    });
  }
}