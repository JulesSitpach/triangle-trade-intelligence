/**
 * Get Current User from Cookie Session
 * Returns authenticated user data if valid session exists
 */

import { parse } from 'cookie';
import crypto from 'crypto';

function verifySession(cookieValue) {
  try {
    if (!cookieValue) return null;

    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const { data, sig } = JSON.parse(decoded);

    const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    const expectedSig = crypto.createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');

    if (sig !== expectedSig) return null;

    // Check expiration (7 days)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > sevenDaysMs) return null;

    return data;
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const cookies = parse(req.headers.cookie || '');
    const sessionCookie = cookies.triangle_session;

    if (!sessionCookie) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'No session found'
      });
    }

    const session = verifySession(sessionCookie);

    if (!session) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Invalid session'
      });
    }

    return res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        isAdmin: session.isAdmin,
        company_name: session.companyName
      }
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({
      success: false,
      authenticated: false,
      error: 'Server error'
    });
  }
}
