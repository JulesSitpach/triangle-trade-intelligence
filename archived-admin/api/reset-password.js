/**
 * Admin Password Reset Endpoint
 * POST /api/admin/reset-password
 */

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, newPassword, adminKey } = req.body;

  // Simple security check
  if (adminKey !== 'triangle-reset-2025') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password required' });
  }

  try {
    console.log('🔐 Resetting password for:', email);

    // Get user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('❌ List error:', listError);
      return res.status(500).json({ error: 'Failed to list users' });
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (error) {
      console.error('❌ Update error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Password reset successful for:', email);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful',
      email: email
    });

  } catch (err) {
    console.error('💥 Reset error:', err);
    return res.status(500).json({ error: err.message });
  }
}
