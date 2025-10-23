#!/usr/bin/env node

// Simple wrapper to run E2E tests with correct environment variables
process.env.TEST_EMAIL = 'macproductions010@gmail.com';
process.env.TEST_PASSWORD = 'Test2025!';

require('./tests/agent-e2e-authenticated.js');
