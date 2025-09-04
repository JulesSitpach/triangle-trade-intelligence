/**
 * Missing Product Submission API
 * Handles requests for products not in database
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
  const { 
    businessType, 
    productDescription, 
    companyName, 
    contactEmail,
    suspectedHSCode,
    urgencyLevel = 'standard'
  } = req.body;

  // Validate required fields
  if (!businessType || !productDescription) {
    return res.status(400).json({
      success: false,
      error: 'Business type and product description are required'
    });
  }

  try {
    logInfo('Missing product submission received', {
      businessType,
      hasCompanyName: !!companyName,
      hasContactEmail: !!contactEmail,
      urgencyLevel
    });

    // Check if this product request already exists
    const { data: existingRequest, error: checkError } = await supabase
      .from('missing_product_requests')
      .select('id, status, created_at')
      .ilike('product_description', `%${productDescription.trim()}%`)
      .eq('business_type', businessType)
      .limit(1);

    if (checkError) {
      logError('Error checking existing requests', checkError.message);
    }

    let requestId;
    let isNewRequest = true;

    if (existingRequest && existingRequest.length > 0) {
      // Update existing request
      requestId = existingRequest[0].id;
      isNewRequest = false;
      
      const { error: updateError } = await supabase
        .from('missing_product_requests')
        .update({
          request_count: supabase.raw('request_count + 1'),
          last_requested: new Date().toISOString(),
          company_name: companyName || null,
          contact_email: contactEmail || null,
          suspected_hs_code: suspectedHSCode || null,
          urgency_level: urgencyLevel
        })
        .eq('id', requestId);

      if (updateError) {
        throw new Error(`Failed to update existing request: ${updateError.message}`);
      }

    } else {
      // Create new request
      const { data: newRequest, error: insertError } = await supabase
        .from('missing_product_requests')
        .insert({
          business_type: businessType,
          product_description: productDescription.trim(),
          company_name: companyName || null,
          contact_email: contactEmail || null,
          suspected_hs_code: suspectedHSCode || null,
          urgency_level: urgencyLevel,
          status: 'submitted',
          request_count: 1,
          created_at: new Date().toISOString(),
          last_requested: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError) {
        throw new Error(`Failed to create request: ${insertError.message}`);
      }

      requestId = newRequest.id;
    }

    const processingTime = Date.now() - startTime;

    logPerformance('Missing product request processed', processingTime, {
      requestId,
      businessType,
      isNewRequest,
      urgencyLevel
    });

    // Determine timeline based on urgency
    const timeline = urgencyLevel === 'urgent' ? '1-2 business days' : '2-3 business days';

    return res.status(200).json({
      success: true,
      requestId,
      isNewRequest,
      message: isNewRequest 
        ? 'Your product request has been submitted successfully'
        : 'We\'ve noted your interest in this product (already requested by others)',
      timeline,
      nextSteps: [
        'Our research team will verify the HS code from official sources',
        'We\'ll add the product to our database with complete provenance tracking',
        contactEmail 
          ? 'You\'ll receive an email notification when the product is available'
          : 'Check back in ' + timeline + ' to see if your product has been added'
      ],
      processing_time_ms: processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logError('Missing product submission failed', error?.message || 'Unknown error', {
      processingTimeMs: processingTime,
      businessType,
      productDescription,
      stack: error?.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to submit product request',
      technical_error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      processing_time_ms: processingTime
    });
  }
}