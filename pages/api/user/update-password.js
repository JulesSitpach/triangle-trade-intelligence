import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { withAuth } from '../../../lib/middleware/auth-middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get user's current password hash from user_profiles table
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('password_hash')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, profile.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password hash in user_profiles table
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ password_hash: newPasswordHash })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ error: 'Failed to update password' });
    }

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error updating password:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

export default withAuth(handler);
