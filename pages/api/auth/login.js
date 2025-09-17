import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    console.log('🔐 Login attempt:', email);

    // Check if user exists in user_profiles table
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For now, accept any password for all users (backward compatibility)
    // TODO: Add proper password validation once password_hash field is added
    let passwordValid = true;

    console.log('⚠️ Password validation temporarily disabled for testing');

    // Update last login
    await supabase
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Determine admin status PURELY from database
    const isAdmin = user.is_admin === true || user.role === 'admin';

    console.log('✅ Login successful:', email, 'Admin:', isAdmin, 'DB is_admin:', user.is_admin, 'DB role:', user.role);

    // Return user data
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        company_name: user.company_name,
        subscription_tier: user.subscription_tier,
        status: user.status,
        full_name: user.full_name,
        isAdmin: isAdmin
      }
    });

  } catch (error) {
    console.error('💥 Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}