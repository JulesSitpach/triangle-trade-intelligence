/**
 * Public Contact Form API
 * Auto-creates sales prospects from website contact submissions
 * Sends email notification to triangleintel@gmail.com
 * No authentication required (public endpoint)
 */

import { createClient } from '@supabase/supabase-js';
import { sendContactFormNotification } from '../../lib/email/resend-client';

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
      name,
      email,
      company,
      phone,
      message,
      industry,
      country = 'US',
      lead_source = 'website'
    } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Name and email are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid email format'
      });
    }

    // Check if prospect already exists
    const { data: existing } = await supabase
      .from('sales_prospects')
      .select('id, stage, last_contact_date')
      .eq('email', email)
      .single();

    if (existing) {
      // Update existing prospect with new contact
      const { data: updated, error: updateError } = await supabase
        .from('sales_prospects')
        .update({
          last_contact_date: new Date().toISOString().split('T')[0],
          notes: existing.notes
            ? `${existing.notes}\n\n[${new Date().toISOString()}] New contact form submission: ${message || 'No message'}`
            : `[${new Date().toISOString()}] Contact form: ${message || 'No message'}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating prospect:', updateError);
      }

      // Send notification email for updated prospect
      try {
        const emailResult = await sendContactFormNotification({
          name,
          email,
          company,
          phone,
          message: `[RETURNING CONTACT] ${message || 'No message'}`,
          industry,
          lead_source
        });

        if (emailResult.success) {
          console.log('✅ Contact form notification sent for updated prospect');
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }

      return res.status(200).json({
        success: true,
        message: 'Thank you for contacting us! We will be in touch soon.',
        prospect_id: existing.id,
        status: 'existing_prospect_updated'
      });
    }

    // Create new prospect
    const { data: prospect, error: createError } = await supabase
      .from('sales_prospects')
      .insert([{
        name,
        email,
        company,
        phone,
        stage: 'initial_contact',
        country,
        industry,
        lead_source,
        notes: message ? `[${new Date().toISOString()}] Initial contact: ${message}` : null,
        last_contact_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating prospect:', createError);
      return res.status(500).json({
        error: 'Failed to save contact information',
        message: createError.message
      });
    }

    // Send notification email to triangleintel@gmail.com
    try {
      const emailResult = await sendContactFormNotification({
        name,
        email,
        company,
        phone,
        message,
        industry,
        lead_source
      });

      if (!emailResult.success) {
        console.error('Failed to send notification email:', emailResult.error);
        // Don't fail the request if email fails - prospect is still created
      } else {
        console.log('✅ Contact form notification sent to triangleintel@gmail.com');
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Continue - prospect creation is more important than email
    }

    return res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will be in touch soon.',
      prospect_id: prospect.id,
      status: 'new_prospect_created'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'We apologize for the inconvenience. Please try again later or email us directly.'
    });
  }
}
