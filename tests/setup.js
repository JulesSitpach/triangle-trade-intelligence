/**
 * Jest Test Setup
 *
 * Runs before each test file
 * Sets up environment variables, global mocks, and test utilities
 */

// Load environment variables
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock environment variables if not set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_jwt_secret_key';
}

if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = 'https://test.supabase.co';
}

if (!process.env.SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = 'test_anon_key';
}

if (!process.env.STRIPE_SECRET_KEY) {
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_secret';
}

// Global test timeout (increase if tests are slow)
jest.setTimeout(10000); // 10 seconds

// Suppress console logs in tests (optional - comment out if you need logs)
global.console = {
  ...console,
  log: jest.fn(), // Suppress logs
  debug: jest.fn(), // Suppress debug
  info: jest.fn(), // Suppress info
  warn: console.warn, // Keep warnings
  error: console.error, // Keep errors
};

// Mock external services (optional)
// jest.mock('stripe');
// jest.mock('@supabase/supabase-js');
