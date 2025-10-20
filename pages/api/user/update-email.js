import { createClient } from '@supabase/supabase-js';
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
    const { newEmail } = req.body;
    const userId = req.user.id;

    if (!newEmail || !newEmail.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Check if email is already in use
    const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();

    if (checkError) {
      console.error('Error checking existing users:', checkError);
      return res.status(500).json({ error: 'Failed to verify email availability' });
    }

    const emailExists = existingUser.users.some(u => u.email === newEmail && u.id !== userId);

    if (emailExists) {
      return res.status(400).json({ error: 'This email is already in use' });
    }

    // Update email using Supabase Admin API
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { email: newEmail }
    );

    if (error) {
      console.error('Email update error:', error);
      return res.status(400).json({ error: error.message || 'Failed to update email' });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification email sent! Please check your inbox to confirm the change.'
    });

  } catch (error) {
    console.error('Unexpected error updating email:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

export default withAuth(handler);
