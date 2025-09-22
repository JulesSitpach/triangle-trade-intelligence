/**
 * Email Integration API with Test Mode
 * Sends emails from Jorge's dashboard with professional templates
 * Default: Test mode (console logging), Optional: Real email providers
 */

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

  console.log('📧 Email API called:', {
    to,
    subject,
    template_type,
    timestamp: new Date().toISOString()
  });

  try {
    // Generate professional email content
    const emailContent = generateEmailContent(template_type, {
      message: message || '',
      client_name: client_name || '',
      service_type: service_type || '',
      recipient: to
    });

    // Check if we have Gmail credentials for real email sending
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_PASSWORD;

    if (gmailUser && gmailPassword) {
      // Real email sending with Gmail
      let nodemailer;
      try {
        nodemailer = require('nodemailer');
      } catch (requireError) {
        console.error('📧 Nodemailer not available:', requireError.message);
        throw new Error('Email service not configured - nodemailer missing');
      }

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: gmailUser,
          pass: gmailPassword
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const mailOptions = {
        from: `Jorge Martinez - Triangle Intelligence <${gmailUser}>`,
        to: to,
        subject: subject,
        html: emailContent,
        text: message
      };

      console.log('📧 Sending real email via Gmail...');
      const info = await transporter.sendMail(mailOptions);

      console.log('✅ Email sent successfully:', info.messageId);

      res.json({
        success: true,
        message: 'Email sent successfully via Gmail',
        messageId: info.messageId,
        to: to,
        subject: subject,
        authMethod: 'gmail',
        deliveryTime: new Date().toISOString()
      });

    } else {
      // Test Mode - No real credentials
      const testEmail = {
        timestamp: new Date().toISOString(),
        from: 'Jorge Martinez - Triangle Intelligence <triangleintel@gmail.com>',
        to: to,
        subject: subject,
        message: message,
        template_type: template_type,
        client_name: client_name,
        service_type: service_type,
        html_preview: emailContent.substring(0, 300) + '...'
      };

      console.log('📧 EMAIL WOULD BE SENT (Test Mode):');
      console.log(JSON.stringify(testEmail, null, 2));

      const mockMessageId = `test-${Date.now()}@triangle-intelligence.local`;

      res.json({
        success: true,
        message: 'Email processed successfully (Test Mode)',
        messageId: mockMessageId,
        to: to,
        subject: subject,
        authMethod: 'test_mode',
        note: 'Email was logged to server console. Gmail credentials not found.',
        testData: testEmail,
        instructions: {
          gmail: 'Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local for real email delivery'
        }
      });
    }

  } catch (error) {
    console.error('📧 Email API error:', error);

    // Handle Gmail auth errors gracefully
    if (error.code === 'EAUTH') {
      console.log('📧 Gmail authentication failed - switching to test mode');

      // Fall back to test mode
      const testEmail = {
        timestamp: new Date().toISOString(),
        from: 'Jorge Martinez - Triangle Intelligence <triangleintel@gmail.com>',
        to: to,
        subject: subject,
        message: message,
        template_type: template_type,
        client_name: client_name,
        service_type: service_type,
        html_preview: emailContent.substring(0, 300) + '...'
      };

      console.log('📧 EMAIL LOGGED (Gmail Auth Failed):');
      console.log(JSON.stringify(testEmail, null, 2));

      const mockMessageId = `test-${Date.now()}@triangle-intelligence.local`;

      return res.json({
        success: true,
        message: 'Email logged successfully (Gmail auth failed, using test mode)',
        messageId: mockMessageId,
        to: to,
        subject: subject,
        authMethod: 'test_mode_fallback',
        note: 'Gmail authentication failed. Email was logged to server console.',
        testData: testEmail,
        instructions: {
          gmail: 'Gmail requires App Password. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local for real email delivery'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: 'Email API error',
      details: error.message,
      suggestion: 'Check server console for details'
    });
  }
}

function generateEmailContent(templateType, data) {
  const { message, client_name, service_type, recipient } = data;

  const header = `
    <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-family: Arial, sans-serif;">Triangle Intelligence</h1>
      <p style="color: #e0e7ff; margin: 5px 0 0 0;">Mexico Trade & Partnership Services</p>
    </div>
  `;

  const footer = `
    <div style="background: #f8fafc; padding: 20px; border-top: 1px solid #e2e8f0; font-family: Arial, sans-serif;">
      <p style="margin: 0; font-size: 14px; color: #64748b;">
        <strong>Jorge Martinez</strong><br>
        Mexico Trade Specialist<br>
        Triangle Intelligence<br>
        Email: triangleintel@gmail.com<br>
        Specializing in Mexico trade routes, supplier verification, and market entry
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #94a3b8;">
        This email was sent from Triangle Intelligence's professional services platform.
      </p>
    </div>
  `;

  const messageBody = `
    <div style="padding: 30px; font-family: Arial, sans-serif; line-height: 1.6; color: #374151;">
      ${(message || '').split('\n').map(paragraph =>
        paragraph.trim() ? `<p style="margin: 0 0 15px 0;">${paragraph.trim()}</p>` : ''
      ).join('')}
    </div>
  `;

  // Template-specific content
  switch (templateType) {
    case 'supplier_report':
      return `
        ${header}
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #1e40af; margin: 0 0 20px 0;">Supplier Verification Report</h2>
          ${client_name ? `<p style="margin: 0 0 15px 0;"><strong>Client:</strong> ${client_name}</p>` : ''}
          ${messageBody}
          <div style="background: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #1e40af;">Professional Verification Complete</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">This supplier assessment includes document verification, financial analysis, and risk evaluation for Mexico trade partnerships.</p>
          </div>
        </div>
        ${footer}
      `;

    case 'consultation_summary':
      return `
        ${header}
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #1e40af; margin: 0 0 20px 0;">Market Entry Consultation Summary</h2>
          ${client_name ? `<p style="margin: 0 0 15px 0;"><strong>Client:</strong> ${client_name}</p>` : ''}
          ${messageBody}
          <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #15803d;">Mexico Market Entry Strategy</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">This consultation provides actionable insights for entering the Mexico market through strategic partnerships and compliance optimization.</p>
          </div>
        </div>
        ${footer}
      `;

    case 'intelligence_briefing':
      return `
        ${header}
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #1e40af; margin: 0 0 20px 0;">Trade Intelligence Briefing</h2>
          ${messageBody}
          <div style="background: #fefce8; padding: 15px; border-left: 4px solid #eab308; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #a16207;">Strategic Intelligence Alert</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">This briefing contains market intelligence and opportunities relevant to your Mexico trade operations.</p>
          </div>
        </div>
        ${footer}
      `;

    case 'service_update':
      return `
        ${header}
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #1e40af; margin: 0 0 20px 0;">Service Update</h2>
          ${client_name ? `<p style="margin: 0 0 15px 0;"><strong>Client:</strong> ${client_name}</p>` : ''}
          ${service_type ? `<p style="margin: 0 0 15px 0;"><strong>Service:</strong> ${service_type}</p>` : ''}
          ${messageBody}
        </div>
        ${footer}
      `;

    default: // general
      return `
        ${header}
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #1e40af; margin: 0 0 20px 0;">Message from Jorge Martinez</h2>
          ${messageBody}
        </div>
        ${footer}
      `;
  }
}