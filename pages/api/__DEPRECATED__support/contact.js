export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body;

  // Validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    // Log support request to console (for development)
    console.log('='.repeat(80));
    console.log('SUPPORT REQUEST RECEIVED');
    console.log('='.repeat(80));
    console.log('From:', name);
    console.log('Email:', email);
    console.log('Subject:', subject);
    console.log('Message:', message);
    console.log('Timestamp:', new Date().toISOString());
    console.log('='.repeat(80));

    // TODO: In production, send actual email to triangleintel@gmail.com
    // Example with Resend API:
    /*
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Triangle Intelligence <noreply@yourdomain.com>',
        to: 'triangleintel@gmail.com',
        reply_to: email,
        subject: `Support Request: ${subject}`,
        html: `
          <h2>Support Request from ${name}</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Reply to this email will go directly to ${email}
          </p>
        `
      })
    });
    */

    // TODO: Also send confirmation email to user
    /*
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Triangle Intelligence <noreply@yourdomain.com>',
        to: email,
        subject: 'We received your message',
        html: `
          <h2>Thank you for contacting Triangle Intelligence</h2>
          <p>Hi ${name},</p>
          <p>We've received your message about: <strong>${subject}</strong></p>
          <p>Our support team will review your request and respond within 24 hours.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            <strong>Your message:</strong><br>
            ${message.replace(/\n/g, '<br>')}
          </p>
        `
      })
    });
    */

    return res.status(200).json({
      success: true,
      message: 'Support request received'
    });

  } catch (error) {
    console.error('Error processing support request:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
