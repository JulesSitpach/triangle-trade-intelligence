/**
 * Test USITC API from Vercel Deployment
 *
 * This endpoint tests if USITC DataWeb API is actually working
 * from production environment with real API token.
 *
 * Access: https://triangle-trade-intelligence.vercel.app/api/test-usitc-live
 */

import usitcDataWebAPI from '../../lib/services/usitc-dataweb-api.js';

export default async function handler(req, res) {
  console.log('🧪 [USITC-TEST] Testing USITC API from production...');

  const usitcAPI = usitcDataWebAPI;

  // Test cases
  const testCases = [
    { hs: '85423200', desc: 'Semiconductors (memories)' },
    { hs: '76109000', desc: 'Aluminum structures' },
    { hs: '85287264', desc: 'LCD displays' }
  ];

  const results = [];

  for (const test of testCases) {
    console.log(`\n🔍 Testing HS ${test.hs} (${test.desc})...`);

    try {
      const result = await usitcAPI.verifyAndGetTariffRates(test.hs);

      if (result) {
        console.log(`✅ SUCCESS: ${result.hts8} - MFN ${result.mfn_rate}%, USMCA ${result.usmca_rate}%`);
        results.push({
          hs_code: test.hs,
          description: test.desc,
          status: 'success',
          verified_code: result.hts8,
          mfn_rate: result.mfn_rate,
          usmca_rate: result.usmca_rate,
          api_description: result.description
        });
      } else {
        console.log(`⚠️ NO DATA: API returned null for ${test.hs}`);
        results.push({
          hs_code: test.hs,
          description: test.desc,
          status: 'no_data',
          error: 'API returned null'
        });
      }
    } catch (error) {
      console.error(`❌ ERROR: ${error.message}`);
      results.push({
        hs_code: test.hs,
        description: test.desc,
        status: 'error',
        error: error.message
      });
    }
  }

  // Summary
  const successCount = results.filter(r => r.status === 'success').length;
  const totalTests = testCases.length;
  const allSuccess = successCount === totalTests;

  console.log(`\n📊 Results: ${successCount}/${totalTests} tests passed`);

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    api_status: allSuccess ? 'WORKING' : 'PARTIAL_OR_DOWN',
    api_key_configured: !!process.env.USITC_API_KEY,
    tests_passed: successCount,
    tests_total: totalTests,
    success_rate: `${Math.round((successCount / totalTests) * 100)}%`,
    results: results,
    recommendation: allSuccess
      ? '✅ USITC API is working! Safe to activate integration.'
      : '⚠️ USITC API has issues. Keep using database + fuzzy matching.'
  });
}
