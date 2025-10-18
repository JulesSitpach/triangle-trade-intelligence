import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields, validateEmail } from '../../../lib/api/errorHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get or update user profile
 * GET /api/user/profile - Get current user profile
 * PUT /api/user/profile - Update user profile
 */
export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.id;

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !profile) {
        throw new ApiError('Profile not found', 404);
      }

      // Return profile without sensitive data
      const { password_hash, ...safeProfile } = profile;

      return res.status(200).json({
        success: true,
        profile: safeProfile
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new ApiError('Failed to fetch profile', 500, {
        error: error.message
      });
    }
  },

  PUT: async (req, res) => {
    const userId = req.user.id;
    const {
      full_name,
      email,
      company_name,
      phone,
      address,
      city,
      state,
      zip_code,
      country
    } = req.body;

    try {
      // Validate email if provided
      if (email) {
        validateEmail(email);

        // Check if email is already taken by another user
        const { data: existingUser } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('email', email)
          .neq('id', userId)
          .single();

        if (existingUser) {
          throw new ApiError('Email already in use', 400, {
            field: 'email'
          });
        }
      }

      // Build update object with only provided fields
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (full_name !== undefined) updateData.full_name = full_name;
      if (email !== undefined) updateData.email = email;
      if (company_name !== undefined) updateData.company_name = company_name;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      if (state !== undefined) updateData.state = state;
      if (zip_code !== undefined) updateData.zip_code = zip_code;
      if (country !== undefined) updateData.country = country;

      // Update profile
      const { data: updatedProfile, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new ApiError('Failed to update profile', 500, {
          error: error.message
        });
      }

      // Return updated profile without sensitive data
      const { password_hash, ...safeProfile } = updatedProfile;

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile: safeProfile
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to update profile', 500, {
        error: error.message
      });
    }
  }
});
