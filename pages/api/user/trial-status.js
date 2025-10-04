import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { checkTrialStatus } from '../../../lib/auth/trialMiddleware';

/**
 * Get Trial Status API
 * GET /api/user/trial-status
 *
 * Returns current trial or subscription status for logged-in user
 * Used by dashboard to show trial banner and access controls
 */
export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.id;

    try {
      const accessStatus = await checkTrialStatus(userId);

      return res.status(200).json({
        success: true,
        ...accessStatus
      });
    } catch (error) {
      console.error('Failed to fetch trial status:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch trial status'
      });
    }
  }
});
