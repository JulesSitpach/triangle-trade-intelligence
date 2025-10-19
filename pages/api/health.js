/**
 * Health Check API Endpoint
 * Comprehensive system health monitoring
 *
 * Monitors:
 * - API server status
 * - Database connection
 * - AI APIs (OpenRouter, Anthropic)
 * - Email service (Resend)
 * - Payment gateway (Stripe)
 * - Critical environment variables
 *
 * Response: 200 OK (healthy) or 503 Service Unavailable (unhealthy)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'triangle-intelligence-platform',
    version: '1.0.0',
    checks: {}
  };

  let isHealthy = true;

  // 1. Check API server
  health.checks.api = {
    status: 'healthy',
    message: 'API server running'
  };

  // 2. Check database connection
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (error) throw error;

    health.checks.database = {
      status: 'healthy',
      message: 'Database connected'
    };
  } catch (error) {
    isHealthy = false;
    health.checks.database = {
      status: 'unhealthy',
      message: `Database error: ${error.message}`
    };
  }

  // 3. Check OpenRouter API
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    health.checks.openrouter = {
      status: 'healthy',
      message: 'OpenRouter API configured'
    };
  } catch (error) {
    // OpenRouter failure is degraded (not critical - Anthropic fallback available)
    health.checks.openrouter = {
      status: 'degraded',
      message: `OpenRouter issue: ${error.message} (Anthropic fallback available)`
    };
  }

  // 4. Check Anthropic API
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    health.checks.anthropic = {
      status: 'healthy',
      message: 'Anthropic API configured'
    };
  } catch (error) {
    // Anthropic missing is critical if OpenRouter also failed
    if (health.checks.openrouter?.status === 'degraded') {
      isHealthy = false;
    }

    health.checks.anthropic = {
      status: 'unhealthy',
      message: `Anthropic issue: ${error.message}`
    };
  }

  // 5. Check Resend API
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    health.checks.resend = {
      status: 'healthy',
      message: 'Resend API configured'
    };
  } catch (error) {
    // Email failure is degraded (not critical - queued for retry)
    health.checks.resend = {
      status: 'degraded',
      message: `Resend issue: ${error.message}`
    };
  }

  // 6. Check Stripe API
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    health.checks.stripe = {
      status: 'healthy',
      message: 'Stripe API configured'
    };
  } catch (error) {
    isHealthy = false;
    health.checks.stripe = {
      status: 'unhealthy',
      message: `Stripe issue: ${error.message}`
    };
  }

  // 7. Check JWT secret
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    health.checks.auth = {
      status: 'healthy',
      message: 'Authentication configured'
    };
  } catch (error) {
    isHealthy = false;
    health.checks.auth = {
      status: 'unhealthy',
      message: `Auth issue: ${error.message}`
    };
  }

  // Overall status
  health.status = isHealthy ? 'healthy' : 'unhealthy';

  // Return appropriate status code
  const statusCode = isHealthy ? 200 : 503;

  return res.status(statusCode).json(health);
}