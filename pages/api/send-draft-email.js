import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html, contactName } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    await transporter.sendMail({
      from: `"Jorge Martinez - Triangle Intelligence" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html
    });

    console.log(`✅ Draft email sent to ${contactName} (${to})`);

    res.status(200).json({
      success: true,
      message: `Email sent to ${contactName}`,
      sentTo: to,
      sentAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error sending draft email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      message: error.message
    });
  }
}