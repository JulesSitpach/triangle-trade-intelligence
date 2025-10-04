/**
 * Admin API: Get Active HS Codes
 * GET /api/admin/active-hs-codes
 *
 * Returns list of HS codes from user workflows for monitoring
 */

import { getActiveHSCodes } from '../../../lib/services/email-monitoring-service';
import { withAdmin } from '../../../lib/middleware/auth-middleware';

export default withAdmin(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const hsCodes = await getActiveHSCodes();

    return res.status(200).json({
      success: true,
      hsCodes: hsCodes,
      total: hsCodes.length,
      totalUsers: hsCodes.reduce((sum, item) => sum + item.user_count, 0)
    });

  } catch (error) {
    console.error('Get HS codes error:', error);
    return res.status(500).json({
      error: 'Failed to get HS codes',
      details: error.message
    });
  }
});
