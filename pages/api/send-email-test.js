/**
 * Simplified Email Test API - No hanging allowed
 */

export default async function handler(req, res) {
  console.log('📧 Email test API called:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({
      error: 'Missing required fields: to, subject, message'
    });
  }

  try {
    // Immediate successful response - no hanging
    console.log('📧 Email would be sent:', { to, subject, message: message.substring(0, 50) + '...' });

    return res.status(200).json({
      success: true,
      message: 'Email processed successfully (Test Mode)',
      to,
      subject,
      timestamp: new Date().toISOString(),
      note: 'This is a test endpoint that never hangs'
    });

  } catch (error) {
    console.error('📧 Test API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Test API error',
      details: error.message
    });
  }
}