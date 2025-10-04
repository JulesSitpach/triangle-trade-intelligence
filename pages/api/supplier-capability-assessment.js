// API endpoint for supplier capability assessment submissions
// Saves assessment responses and notifies Jorge's team

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
    const assessmentData = req.body;

    // Generate a unique assessment ID
    const assessmentId = `ASMT_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Prepare data for storage
    const supplierAssessment = {
      assessment_id: assessmentId,
      client_company: assessmentData.client_company,
      supplier_name: assessmentData.supplier_name,
      assessment_token: assessmentData.assessment_token,

      // Company Information
      company_name: assessmentData.company_name,
      contact_person: assessmentData.contact_person,
      contact_email: assessmentData.contact_email,
      contact_phone: assessmentData.contact_phone,
      company_website: assessmentData.company_website,
      years_in_business: assessmentData.years_in_business,

      // Production Capabilities
      production_capacity: assessmentData.production_capacity,
      manufacturing_processes: assessmentData.manufacturing_processes,
      quality_certifications: assessmentData.quality_certifications,
      production_lead_times: assessmentData.production_lead_times,
      minimum_order_quantity: assessmentData.minimum_order_quantity,

      // Infrastructure (additional fields for future expansion)
      facility_size: assessmentData.facility_size,
      equipment_overview: assessmentData.equipment_overview,
      workforce_size: assessmentData.workforce_size,
      location_advantages: assessmentData.location_advantages,

      // Quality & Compliance
      quality_management_system: assessmentData.quality_management_system,
      export_experience: assessmentData.export_experience,
      usmca_compliance: assessmentData.usmca_compliance,
      sustainability_practices: assessmentData.sustainability_practices,

      // Partnership Details
      pricing_structure: assessmentData.pricing_structure,
      payment_terms: assessmentData.payment_terms,
      partnership_interest_level: assessmentData.partnership_interest_level,
      additional_capabilities: assessmentData.additional_capabilities,
      references: assessmentData.references,

      // Metadata
      submitted_at: assessmentData.submitted_at,
      status: 'submitted',
      assigned_to: 'Jorge',
      priority: assessmentData.partnership_interest_level === 'very-high' ? 'high' : 'medium'
    };

    // Try to save to supplier_assessments table
    let saved = false;
    try {
      const { data, error } = await supabase
        .from('supplier_assessments')
        .insert([supplierAssessment])
        .select();

      if (error) {
        console.log('Database insert failed, using fallback storage:', error);
      } else {
        console.log('✅ Assessment saved to database:', data);
        saved = true;
      }
    } catch (dbError) {
      console.log('Database unavailable, using fallback storage:', dbError);
    }

    // Fallback: Save to file system if database fails
    if (!saved) {
      const fs = require('fs').promises;
      const path = require('path');

      const assessmentsDir = path.join(process.cwd(), 'data', 'supplier-assessments');

      try {
        await fs.mkdir(assessmentsDir, { recursive: true });
        await fs.writeFile(
          path.join(assessmentsDir, `${assessmentId}.json`),
          JSON.stringify(supplierAssessment, null, 2)
        );
        console.log('✅ Assessment saved to file system as fallback');
      } catch (fileError) {
        console.error('❌ Failed to save assessment:', fileError);
        return res.status(500).json({
          success: false,
          error: 'Failed to save assessment'
        });
      }
    }

    // Create notification for Jorge's service queue
    try {
      const serviceRequest = {
        id: `SRV_${Date.now()}`,
        company_name: assessmentData.company_name,
        service_type: 'Supplier Verification',
        status: 'Stage 1: Form Completed',
        priority: supplierAssessment.priority,
        assigned_to: 'Jorge',
        client_email: assessmentData.contact_email,
        timeline: '3-5 business days',
        intake_form_data: supplierAssessment,
        intake_form_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: `Supplier capability assessment completed for ${assessmentData.client_company} partnership opportunity. Interest level: ${assessmentData.partnership_interest_level}`
      };

      // Try to add to service requests
      try {
        const { error: serviceError } = await supabase
          .from('service_requests')
          .insert([serviceRequest]);

        if (serviceError) {
          console.log('Service request notification failed:', serviceError);
        } else {
          console.log('✅ Service request created for Jorge\'s queue');
        }
      } catch (serviceDbError) {
        console.log('Service notification unavailable:', serviceDbError);
      }
    } catch (notificationError) {
      console.log('Notification creation failed:', notificationError);
      // Don't fail the whole request for notification issues
    }

    // Send email notification to Triangle Trade Intelligence team (optional enhancement)
    try {
      const emailData = {
        to: 'jorge@triangleintel.com',
        subject: `🔔 New Supplier Assessment: ${assessmentData.company_name}`,
        body: `
New supplier capability assessment submitted:

Company: ${assessmentData.company_name}
Contact: ${assessmentData.contact_person} (${assessmentData.contact_email})
Interest Level: ${assessmentData.partnership_interest_level}
Client Opportunity: ${assessmentData.client_company}

Production Capacity: ${assessmentData.production_capacity}
Export Experience: ${assessmentData.export_experience}
USMCA Compliance: ${assessmentData.usmca_compliance}

Assessment ID: ${assessmentId}
Priority: ${supplierAssessment.priority}

Please review in Jorge's Service Queue dashboard.
        `
      };

      // This would integrate with your email service
      console.log('📧 Email notification prepared for Jorge\'s team');
    } catch (emailError) {
      console.log('Email notification failed:', emailError);
      // Don't fail the request for email issues
    }

    return res.status(200).json({
      success: true,
      message: 'Supplier capability assessment submitted successfully',
      assessment_id: assessmentId,
      status: 'submitted',
      next_steps: [
        'Assessment forwarded to Triangle Trade Intelligence specialists',
        'Review and qualification within 2-3 business days',
        'Follow-up contact to discuss partnership opportunities',
        'Potential client introduction if qualifications align'
      ]
    });

  } catch (error) {
    console.error('Assessment submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process supplier assessment',
      details: error.message
    });
  }
}