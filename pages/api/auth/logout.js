/**
 * Logout Endpoint
 * Clears the httpOnly session cookie
 */

import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Clear the session cookie (set expires to past date)
    res.setHeader('Set-Cookie', serialize('triangle_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: -1, // Negative value to delete
      expires: new Date(0), // Set to epoch (1970)
      path: '/'
    }));

    console.log('✅ User logged out successfully');

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('💥 Logout error:', error);
    return res.status(500).json({ success: false, error: 'Logout failed' });
  }
}
