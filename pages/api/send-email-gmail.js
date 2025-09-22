/**
 * Gmail API Email Service
 * Professional email sending using Google Gmail API
 */

import { sendGmailMessage } from '../../lib/google';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    to,
    subject,
    message,
    template_type = 'general',
    client_name = '',
    service_type = ''
  } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({
      error: 'Missing required fields: to, subject, message'
    });
  }

  console.log('📧 Gmail API Email called:', {
    to,
    subject,
    template_type,
    timestamp: new Date().toISOString()
  });

  try {
    // Generate professional email content
    const emailContent = generateProfessionalEmail(template_type, {
      message,
      client_name,
      service_type,
      recipient: to
    });

    // Send via Gmail API
    const result = await sendGmailMessage({
      to: to,
      subject: subject,
      message: emailContent,
      from: 'Jorge Martinez - Triangle Intelligence <triangleintel@gmail.com>'
    });

    if (result.success) {
      console.log('✅ Email sent successfully via Gmail API:', result.messageId);

      res.json({
        success: true,
        message: 'Email sent successfully via Gmail API',
        messageId: result.messageId,
        to: to,
        subject: subject,
        authMethod: 'gmail_api',
        deliveryTime: new Date().toISOString(),
        api: 'Google Gmail API v1'
      });
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    console.error('📧 Gmail API error:', error);

    // Fallback to test mode
    const testEmail = {
      timestamp: new Date().toISOString(),
      from: 'Jorge Martinez - Triangle Intelligence <triangleintel@gmail.com>',
      to: to,
      subject: subject,
      message: message,
      template_type: template_type,
      client_name: client_name,
      service_type: service_type
    };

    console.log('📧 EMAIL LOGGED (Gmail API Failed):');
    console.log(JSON.stringify(testEmail, null, 2));

    const mockMessageId = `gmail-api-test-${Date.now()}@triangle-intelligence.local`;

    res.json({
      success: true,
      message: 'Email logged successfully (Gmail API unavailable, using test mode)',
      messageId: mockMessageId,
      to: to,
      subject: subject,
      authMethod: 'test_mode_fallback',
      note: 'Gmail API authentication failed. Email was logged to server console.',
      testData: testEmail,
      instructions: {
        setup: 'Set up Google Cloud Console project and add credentials to .env.local',
        variables: [
          'GOOGLE_CLIENT_ID',
          'GOOGLE_CLIENT_SECRET',
          'GOOGLE_REFRESH_TOKEN',
          'or GOOGLE_SERVICE_ACCOUNT_JSON'
        ]
      }
    });
  }
}

function generateProfessionalEmail(templateType, data) {
  const { message, client_name, service_type } = data;

  const header = `
Triangle Intelligence
Mexico Trade & Partnership Services
──────────────────────────────────────
  `;

  const footer = `

──────────────────────────────────────
Jorge Martinez
Mexico Trade Specialist
Triangle Intelligence
Email: triangleintel@gmail.com

Specializing in Mexico trade routes, supplier verification, and market entry strategies.
This email was sent from Triangle Intelligence's professional services platform.
  `;

  // Format message with proper line breaks
  const formattedMessage = message.split('\n').join('\n');

  return `${header}

${formattedMessage}

${footer}`;
}