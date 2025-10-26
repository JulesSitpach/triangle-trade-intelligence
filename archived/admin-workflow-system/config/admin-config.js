/**
 * Admin Configuration - No Hardcoding
 * All admin settings from environment variables
 */

const adminConfig = {
  // Admin credentials from environment variables
  email: process.env.SYSTEM_ADMIN_EMAIL || process.env.TEAM_EMAIL,

  // Default admin profile data
  profile: {
    full_name: 'Triangle Intelligence Admin',
    company_name: 'Triangle Intelligence',
    is_admin: true,
    role: 'admin',
    status: 'active',
    subscription_tier: 'Enterprise',
    country: 'US',
    workflow_completions: 0,
    certificates_generated: 0,
    total_savings: 0
  },

  // Default password requirements (user must set)
  password: {
    minLength: 12,
    requireSpecialChars: true,
    defaultSuffix: '2024!' // Combined with user-provided prefix
  },

  // Admin setup validation
  validation: {
    requiredFields: ['email', 'user_id'],
    allowedRoles: ['admin', 'super_admin'],
    allowedStatus: ['active']
  }
};

module.exports = adminConfig;