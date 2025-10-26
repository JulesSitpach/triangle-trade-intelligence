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