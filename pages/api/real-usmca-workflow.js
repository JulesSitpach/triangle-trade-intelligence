/**
 * REAL USMCA Certificate Generation Workflow
 *
 * Production workflow for actual certificate processing:
 * 1. Send intake form to client
 * 2. Process real client data
 * 3. Generate draft certificate
 * 4. Allow review/editing
 * 5. Generate final certificate
 * 6. Email to client
 */

import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Gmail transporter for real email delivery
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export default async function handler(req, res) {
  const { method } = req;
  const { action } = req.body;

  try {
    switch (action) {
      case 'send_intake_form':
        return await sendIntakeForm(req, res);

      case 'process_client_data':
        return await processClientData(req, res);

      case 'generate_draft':
        return await generateDraftCertificate(req, res);

      case 'review_and_edit':
        return await reviewAndEdit(req, res);

      case 'generate_final':
        return await generateFinalCertificate(req, res);

      case 'email_to_client':
        return await emailToClient(req, res);

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('USMCA Workflow Error:', error);
    return res.status(500).json({
      error: 'Workflow failed',
      details: error.message
    });
  }
}

/**
 * Step 1: Send intake form to client
 */
async function sendIntakeForm(req, res) {
  const { clientEmail, clientName, projectId } = req.body;

  if (!clientEmail) {
    return res.status(400).json({ error: 'Client email required' });
  }

  // Create intake record in database
  const { data: intake, error } = await supabase
    .from('usmca_intakes')
    .insert({
      client_email: clientEmail,
      client_name: clientName,
      project_id: projectId || generateProjectId(),
      status: 'form_sent',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to create intake record' });
  }

  // Send real intake form email
  const intakeFormUrl = `${process.env.NEXT_PUBLIC_APP_URL}/intake/${intake.project_id}`;

  const emailContent = `
    <h2>USMCA Certificate - Data Collection Form</h2>

    <p>Dear ${clientName || 'Client'},</p>

    <p>Please complete the USMCA certificate information form using the link below:</p>

    <p><a href="${intakeFormUrl}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Complete USMCA Form</a></p>

    <p>This form collects the required information for your USMCA certificate:</p>
    <ul>
      <li>Company information and registration details</li>
      <li>Product description and HS classification</li>
      <li>Manufacturing location and process details</li>
      <li>Component origins and suppliers</li>
      <li>Trade volume and market information</li>
    </ul>

    <p>Once completed, we'll review your information and generate your certificate.</p>

    <p>Best regards,<br>Triangle Intelligence Team</p>
  `;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: clientEmail,
    subject: 'USMCA Certificate - Complete Your Information Form',
    html: emailContent
  });

  return res.status(200).json({
    success: true,
    message: 'Intake form sent successfully',
    projectId: intake.project_id,
    formUrl: intakeFormUrl
  });
}

/**
 * Step 2: Process real client data when form is submitted
 */
async function processClientData(req, res) {
  const { projectId, clientData } = req.body;

  // Save real client data to database
  const { error } = await supabase
    .from('usmca_intakes')
    .update({
      client_data: clientData,
      status: 'data_received',
      updated_at: new Date().toISOString()
    })
    .eq('project_id', projectId);

  if (error) {
    return res.status(500).json({ error: 'Failed to save client data' });
  }

  return res.status(200).json({
    success: true,
    message: 'Client data processed successfully',
    nextStep: 'generate_draft'
  });
}

/**
 * Step 3: Generate draft certificate with real data
 */
async function generateDraftCertificate(req, res) {
  const { projectId } = req.body;

  // Get real client data
  const { data: intake, error } = await supabase
    .from('usmca_intakes')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (error || !intake) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const clientData = intake.client_data;

  // Generate draft certificate using REAL data
  const draftCertificate = {
    // Exporter Information (from client data)
    exporter_name: clientData.company_name,
    exporter_address: clientData.company_address,
    exporter_tax_id: clientData.tax_id,

    // Product Information (from client data)
    product_description: clientData.product_description,
    hs_code: clientData.hs_code,

    // Manufacturing Information (from client data)
    manufacturing_location: clientData.manufacturing_location,
    component_origins: clientData.component_origins,

    // USMCA Qualification (calculated from real data)
    usmca_qualified: calculateUSMCAQualification(clientData),
    qualifying_percentage: calculateQualifyingPercentage(clientData),

    // Certificate Details
    certificate_number: generateCertificateNumber(),
    issue_date: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  // Save draft to database
  await supabase
    .from('usmca_intakes')
    .update({
      draft_certificate: draftCertificate,
      status: 'draft_generated',
      updated_at: new Date().toISOString()
    })
    .eq('project_id', projectId);

  return res.status(200).json({
    success: true,
    draft: draftCertificate,
    message: 'Draft certificate generated with real client data'
  });
}

/**
 * Step 4: Allow review and editing of draft
 */
async function reviewAndEdit(req, res) {
  const { projectId, edits } = req.body;

  // Get current draft
  const { data: intake } = await supabase
    .from('usmca_intakes')
    .select('draft_certificate')
    .eq('project_id', projectId)
    .single();

  // Apply edits to draft
  const updatedDraft = {
    ...intake.draft_certificate,
    ...edits,
    last_reviewed: new Date().toISOString(),
    reviewed_by: 'admin'
  };

  // Save updated draft
  await supabase
    .from('usmca_intakes')
    .update({
      draft_certificate: updatedDraft,
      status: 'reviewed',
      updated_at: new Date().toISOString()
    })
    .eq('project_id', projectId);

  return res.status(200).json({
    success: true,
    updatedDraft: updatedDraft,
    message: 'Draft updated successfully'
  });
}

/**
 * Step 5: Generate final certificate
 */
async function generateFinalCertificate(req, res) {
  const { projectId } = req.body;

  // Get reviewed draft
  const { data: intake } = await supabase
    .from('usmca_intakes')
    .select('*')
    .eq('project_id', projectId)
    .single();

  const finalCertificate = {
    ...intake.draft_certificate,
    status: 'final',
    generated_at: new Date().toISOString(),
    certificate_url: `${process.env.NEXT_PUBLIC_APP_URL}/certificate/${projectId}`
  };

  // Save final certificate
  await supabase
    .from('usmca_intakes')
    .update({
      final_certificate: finalCertificate,
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('project_id', projectId);

  return res.status(200).json({
    success: true,
    certificate: finalCertificate,
    message: 'Final certificate generated'
  });
}

/**
 * Step 6: Email final certificate to client
 */
async function emailToClient(req, res) {
  const { projectId } = req.body;

  // Get project data
  const { data: intake } = await supabase
    .from('usmca_intakes')
    .select('*')
    .eq('project_id', projectId)
    .single();

  const certificateUrl = `${process.env.NEXT_PUBLIC_APP_URL}/certificate/${projectId}`;

  const emailContent = `
    <h2>Your USMCA Certificate is Ready</h2>

    <p>Dear ${intake.client_name},</p>

    <p>Your USMCA certificate has been completed and is ready for download:</p>

    <p><a href="${certificateUrl}" style="background: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Certificate</a></p>

    <h3>Certificate Details:</h3>
    <ul>
      <li><strong>Certificate Number:</strong> ${intake.final_certificate.certificate_number}</li>
      <li><strong>Product:</strong> ${intake.final_certificate.product_description}</li>
      <li><strong>HS Code:</strong> ${intake.final_certificate.hs_code}</li>
      <li><strong>USMCA Qualified:</strong> ${intake.final_certificate.usmca_qualified ? 'Yes' : 'No'}</li>
    </ul>

    <p>This certificate is valid and ready for use in your trade documentation.</p>

    <p>Best regards,<br>Triangle Intelligence Team</p>
  `;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: intake.client_email,
    subject: 'Your USMCA Certificate is Ready',
    html: emailContent
  });

  return res.status(200).json({
    success: true,
    message: 'Certificate emailed to client successfully'
  });
}

// Helper functions
function generateProjectId() {
  return 'USMCA-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function generateCertificateNumber() {
  return 'CERT-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-8);
}

function calculateUSMCAQualification(clientData) {
  // Real USMCA qualification logic based on actual data
  const { component_origins, manufacturing_location } = clientData;

  if (!component_origins || !manufacturing_location) return false;

  // Check if manufactured in USMCA country
  const usmcaCountries = ['US', 'CA', 'MX'];
  const isManufacturedInUSMCA = usmcaCountries.some(country =>
    manufacturing_location.toUpperCase().includes(country)
  );

  if (!isManufacturedInUSMCA) return false;

  // Calculate component origin percentage
  const totalComponents = component_origins.length;
  if (totalComponents === 0) return false;

  const usmcaComponents = component_origins.filter(origin =>
    usmcaCountries.some(country => origin.country.toUpperCase().includes(country))
  ).length;

  const percentage = (usmcaComponents / totalComponents) * 100;

  // Most products need 62.5% USMCA content
  return percentage >= 62.5;
}

function calculateQualifyingPercentage(clientData) {
  const { component_origins } = clientData;

  if (!component_origins || component_origins.length === 0) return 0;

  const usmcaCountries = ['US', 'CA', 'MX'];
  const totalValue = component_origins.reduce((sum, comp) => sum + (comp.value || 0), 0);

  if (totalValue === 0) return 0;

  const usmcaValue = component_origins
    .filter(origin => usmcaCountries.some(country =>
      origin.country.toUpperCase().includes(country)
    ))
    .reduce((sum, comp) => sum + (comp.value || 0), 0);

  return Math.round((usmcaValue / totalValue) * 100 * 100) / 100;
}