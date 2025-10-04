import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError } from '../../../lib/api/errorHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get or update user preferences
 * GET /api/user/preferences - Get user preferences
 * PUT /api/user/preferences - Update user preferences
 */
export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.id;

    try {
      let { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // If preferences don't exist, create defaults
      if (error && error.code === 'PGRST116') {
        const { data: newPreferences, error: createError } = await supabase
          .from('user_preferences')
          .insert([{ user_id: userId }])
          .select()
          .single();

        if (createError) {
          throw new ApiError('Failed to create preferences', 500, {
            error: createError.message
          });
        }

        preferences = newPreferences;
      } else if (error) {
        throw new ApiError('Failed to fetch preferences', 500, {
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        preferences
      });
    } catch (error) {
      console.error('Error fetching preferences:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to fetch preferences', 500, {
        error: error.message
      });
    }
  },

  PUT: async (req, res) => {
    const userId = req.user.id;
    const {
      email_marketing,
      email_product_updates,
      email_security_alerts,
      email_billing_notifications,
      email_service_updates,
      email_weekly_digest,
      sms_enabled,
      sms_security_alerts,
      language,
      timezone,
      date_format,
      profile_visibility,
      data_sharing_analytics
    } = req.body;

    try {
      // Build update object with only provided fields
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (email_marketing !== undefined) updateData.email_marketing = email_marketing;
      if (email_product_updates !== undefined) updateData.email_product_updates = email_product_updates;
      if (email_security_alerts !== undefined) updateData.email_security_alerts = email_security_alerts;
      if (email_billing_notifications !== undefined) updateData.email_billing_notifications = email_billing_notifications;
      if (email_service_updates !== undefined) updateData.email_service_updates = email_service_updates;
      if (email_weekly_digest !== undefined) updateData.email_weekly_digest = email_weekly_digest;
      if (sms_enabled !== undefined) updateData.sms_enabled = sms_enabled;
      if (sms_security_alerts !== undefined) updateData.sms_security_alerts = sms_security_alerts;
      if (language !== undefined) updateData.language = language;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (date_format !== undefined) updateData.date_format = date_format;
      if (profile_visibility !== undefined) updateData.profile_visibility = profile_visibility;
      if (data_sharing_analytics !== undefined) updateData.data_sharing_analytics = data_sharing_analytics;

      // Check if preferences exist
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .single();

      let updatedPreferences;

      if (existing) {
        // Update existing preferences
        const { data, error } = await supabase
          .from('user_preferences')
          .update(updateData)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          throw new ApiError('Failed to update preferences', 500, {
            error: error.message
          });
        }

        updatedPreferences = data;
      } else {
        // Create new preferences
        const { data, error } = await supabase
          .from('user_preferences')
          .insert([{ user_id: userId, ...updateData }])
          .select()
          .single();

        if (error) {
          throw new ApiError('Failed to create preferences', 500, {
            error: error.message
          });
        }

        updatedPreferences = data;
      }

      return res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: updatedPreferences
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to update preferences', 500, {
        error: error.message
      });
    }
  }
});
