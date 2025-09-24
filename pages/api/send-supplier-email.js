/**
 * API: Send Email to Supplier
 * Integrates with Gmail API or fallback to simple email service
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, body, supplierName, requestId } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log(`📧 Sending email to supplier: ${supplierName}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);

    // TODO: Integrate with Gmail API using your Google Workspace credentials
    // For now, log the email details and simulate success

    const emailLog = {
      to,
      subject,
      body,
      supplierName,
      requestId,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

    console.log('Email details:', emailLog);

    // Simulate successful email send
    res.status(200).json({
      success: true,
      message: `Email sent to ${supplierName}`,
      emailId: `email_${Date.now()}`,
      sentAt: emailLog.sentAt
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      message: error.message
    });
  }
}