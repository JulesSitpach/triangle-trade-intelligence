import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields } from '../../../lib/api/errorHandler';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Change user password
 * POST /api/user/change-password
 *
 * Body:
 * - current_password: string
 * - new_password: string
 */
export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.userId;
    const { current_password, new_password } = req.body;

    validateRequiredFields(req.body, ['current_password', 'new_password']);

    // Validate new password strength
    if (new_password.length < 8) {
      throw new ApiError('New password must be at least 8 characters long', 400, {
        field: 'new_password'
      });
    }

    try {
      // Get user's current password hash
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new ApiError('User not found', 404);
      }

      // Verify current password
      const currentHash = crypto
        .createHash('sha256')
        .update(current_password)
        .digest('hex');

      if (currentHash !== user.password_hash) {
        throw new ApiError('Current password is incorrect', 401, {
          field: 'current_password'
        });
      }

      // Hash new password
      const newHash = crypto
        .createHash('sha256')
        .update(new_password)
        .digest('hex');

      // Update password
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          password_hash: newHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw new ApiError('Failed to update password', 500, {
          error: updateError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to change password', 500, {
        error: error.message
      });
    }
  }
});
