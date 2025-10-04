/**
 * Admin API: Send Weekly Digest
 * POST /api/admin/send-weekly-digest
 *
 * YOU manually curate the content, this API sends it to all subscribers
 *
 * Usage:
 * 1. Go to /admin/email-digest page
 * 2. Fill in this week's policy changes (30 min/week)
 * 3. Preview email
 * 4. Click "Send to All Subscribers"
 */

import { sendWeeklyDigest } from '../../../lib/services/email-monitoring-service';
import { withAdmin } from '../../../lib/middleware/auth-middleware';

export default withAdmin(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subject, sections } = req.body;

    // Validate content
    if (!subject || !sections || !Array.isArray(sections)) {
      return res.status(400).json({
        error: 'Invalid digest content. Need subject and sections array.'
      });
    }

    // Validate sections format
    for (const section of sections) {
      if (!section.title || !section.content) {
        return res.status(400).json({
          error: 'Each section needs title and content'
        });
      }
    }

    console.log(`📧 Admin sending weekly digest: "${subject}"`);
    console.log(`   ${sections.length} sections, curated by ${req.user.email}`);

    // Send digest
    const result = await sendWeeklyDigest({
      subject,
      sections
    });

    return res.status(200).json({
      success: true,
      message: `Weekly digest sent to ${result.sent} subscribers`,
      sent: result.sent,
      failed: result.failed,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Send digest error:', error);
    return res.status(500).json({
      error: 'Failed to send digest',
      details: error.message
    });
  }
});
