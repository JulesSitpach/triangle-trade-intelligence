/**
 * Test RSS Polling Engine initialization
 * Debug endpoint to see what's failing
 */

export default async function handler(req, res) {
  try {
    // Test 1: Can we require the module?
    console.log('Test 1: Requiring RSSPollingEngine...');
    const RSSPollingEngine = require('../../lib/services/rss-polling-engine');
    console.log('✅ RSSPollingEngine required successfully');

    // Test 2: Can we instantiate it?
    console.log('Test 2: Instantiating RSSPollingEngine...');
    const rssEngine = new RSSPollingEngine();
    console.log('✅ RSSPollingEngine instantiated successfully');

    // Test 3: Check environment variables
    console.log('Test 3: Checking environment variables...');
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasResendKey = !!process.env.RESEND_API_KEY;

    return res.status(200).json({
      success: true,
      tests: {
        module_require: true,
        instantiation: true,
        env_vars: {
          NEXT_PUBLIC_SUPABASE_URL: hasSupabaseUrl,
          SUPABASE_SERVICE_ROLE_KEY: hasSupabaseKey,
          RESEND_API_KEY: hasResendKey
        }
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
