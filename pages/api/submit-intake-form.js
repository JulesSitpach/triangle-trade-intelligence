import nodemailer from 'nodemailer';
import { apiHandler, sendSuccess } from '../../lib/api/apiHandler.js';
import { ApiError, validateRequiredFields } from '../../lib/api/errorHandler.js';

export default apiHandler({
  POST: async (req, res) => {
    const { requestId, formData, formType } = req.body;

    // Validate required fields
    validateRequiredFields(req.body, ['requestId', 'formData', 'formType']);

    console.log('📝 Intake form submitted:', { requestId, formType });
    console.log('📊 Form data:', formData);

    // Update service request status
    const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/service-requests`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: requestId,
        status: 'Stage 1: Form Completed',
        intake_form_data: formData,
        intake_form_completed: true
      })
    });

    if (!updateResponse.ok) {
      throw new ApiError('Failed to update service request', 500);
    }

    const updateResult = await updateResponse.json();
    console.log('✅ Request updated in database:', updateResult);

    // Build form data HTML table
    const formDataHTML = Object.entries(formData)
      .filter(([key]) => !key.endsWith('_file'))
      .map(([key, value]) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: 600;">${key.replace(/_/g, ' ').toUpperCase()}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${value || 'N/A'}</td>
        </tr>
      `).join('');

    // Build email HTML
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #134169; border-bottom: 3px solid #2563eb; padding-bottom: 10px;">
          📋 ${formType} - Completed
        </h2>

        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Request ID:</strong> ${requestId}</p>
          <p><strong>Form Type:</strong> ${formType}</p>
          <p><strong>Status:</strong> Stage 1 - Form Completed</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <h3 style="color: #134169; margin-top: 30px;">Form Details:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background: #2563eb; color: white;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Field</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Value</th>
            </tr>
          </thead>
          <tbody>
            ${formDataHTML}
          </tbody>
        </table>

        <div style="margin-top: 30px; padding: 15px; background: #ecfdf5; border-left: 4px solid #16a34a; border-radius: 4px;">
          <p style="margin: 0; color: #166534;">
            ✅ This form has been saved to the database and is ready for Jorge to begin Stage 2: Supplier Research
          </p>
        </div>
      </div>
    `;

    // Prepare email draft data
    const draftData = {
      request_id: requestId,
      form_type: formType,
      email_subject: `📋 ${formType} Completed - Request ${requestId}`,
      email_body: emailHTML,
      status: 'draft',
      created_at: new Date().toISOString()
    };

    // Save draft via API
    const draftResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/email-drafts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftData)
    });

    if (!draftResponse.ok) {
      console.warn('⚠️ Failed to save email draft, continuing anyway');
    }

    console.log('📧 Email draft created - Jorge can locate contact and send:', draftData);

    return sendSuccess(res, {
      requestId,
      status: 'Stage 1: Form Completed',
      receivedFields: Object.keys(formData).length,
      notification: 'Email draft created - Jorge will locate contact and send',
      emailDraft: true,
      draftData
    }, `${formType} submitted successfully`);
  }
});
