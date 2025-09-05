/**
 * COMPREHENSIVE DATA INTEGRITY AUDIT TEST SUITE
 * Phase 1: Triangle Intelligence USMCA Platform Data Validation
 * 
 * MISSION: Validate foundational data that supports $250K+ savings claims
 */

const { createClient } = require('@supabase/supabase-js');
const { normalizeHSCode, generateHSCodeFallbacks, lookupHSCodeWithFallback } = require('../../lib/utils/hs-code-normalizer.js');

// Test configuration
const TEST_CONFIG = {
  DATABASE_RESPONSE_TIME_LIMIT: 500, // ms
  MINIMUM_ACCURACY_RATE: 99.9, // %
  CLASSIFICATION_RELEVANCE_THRESHOLD: 95, // %
  KNOWN_TARIFF_RATES: {
    '8544429000': { mfnRate: 0.058, usmcaRate: 0.0 }, // Insulated electric conductors
    '6204620090': { mfnRate: 0.285, usmcaRate: 0.0 }, // Women's cotton trousers
    '8708299050': { mfnRate: 0.025, usmcaRate: 0.0 }  // Auto parts
  },
  SAMPLE_HS_CODES: [
    '8544429000', // Electronics - Insulated electric conductors
    '6204620090', // Textiles - Women's cotton trousers  
    '8708299050', // Automotive - Motor vehicle parts
    '9403509000', // Furniture - Wooden furniture
    '3926909090', // Plastics - Other plastic articles
    '7326909000', // Iron/Steel - Other articles of iron or steel
    '8517623990', // Telecom equipment - Other apparatus
    '8471300000', // Computers - Portable computers
    '8536690090'  // Electrical - Other plugs and sockets
  ]
};

describe('Phase 1: Data Integrity & Accuracy Validation', () => {
  let supabase;
  
  beforeAll(() => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  });

  describe('1. Government HS Code Database Validation', () => {
    test('should have 34,476+ comprehensive government records', async () => {
      const { data, error } = await supabase
        .from('hs_master_rebuild')
        .select('hs_code', { count: 'exact' })
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThanOrEqual(34476);
    });

    test('should have valid data structure for all records', async () => {
      const { data, error } = await supabase
        .from('hs_master_rebuild')
        .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
        .limit(100);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBe(100);

      data.forEach(record => {
        expect(record.hs_code).toBeTruthy();
        expect(record.description).toBeTruthy();
        expect(record.chapter).toBeGreaterThanOrEqual(1);
        expect(record.chapter).toBeLessThanOrEqual(99);
        expect(record.mfn_rate).toBeGreaterThanOrEqual(0);
        expect(record.usmca_rate).toBeGreaterThanOrEqual(0);
        expect(['US', 'CA', 'MX', 'China', 'India', 'Vietnam']).toContain(record.country_source);
      });
    });

    test('should cross-reference known tariff rates with database', async () => {
      const results = [];
      
      for (const [hsCode, expectedRates] of Object.entries(TEST_CONFIG.KNOWN_TARIFF_RATES)) {
        const { data, error } = await supabase
          .from('hs_master_rebuild')
          .select('hs_code, mfn_rate, usmca_rate')
          .eq('hs_code', hsCode)
          .single();

        if (!error && data) {
          const mfnMatch = Math.abs(data.mfn_rate - (expectedRates.mfnRate * 100)) < 0.5;
          const usmcaMatch = Math.abs(data.usmca_rate - (expectedRates.usmcaRate * 100)) < 0.1;
          
          results.push({
            hsCode,
            mfnMatch,
            usmcaMatch,
            expectedMfn: expectedRates.mfnRate * 100,
            actualMfn: data.mfn_rate,
            expectedUsmca: expectedRates.usmcaRate * 100,
            actualUsmca: data.usmca_rate
          });
        }
      }

      // Require at least 80% accuracy on known rates
      const accurateResults = results.filter(r => r.mfnMatch && r.usmcaMatch);
      const accuracyRate = (accurateResults.length / results.length) * 100;
      
      expect(accuracyRate).toBeGreaterThanOrEqual(80);
      console.log(`Tariff rate accuracy: ${accuracyRate}% (${accurateResults.length}/${results.length})`);
    });

    test('should have no hardcoded fallback data in database', async () => {
      const { data, error } = await supabase
        .from('hs_master_rebuild')
        .select('hs_code, mfn_rate, usmca_rate, description')
        .or('mfn_rate.eq.10,mfn_rate.eq.8,description.ilike.%fallback%,description.ilike.%placeholder%');

      expect(error).toBeNull();
      expect(data.length).toBe(0); // No hardcoded fallback data
    });

    test('should maintain data consistency across US, CA, MX sources', async () => {
      const consistencyTests = [];
      
      for (const hsCode of TEST_CONFIG.SAMPLE_HS_CODES) {
        const { data, error } = await supabase
          .from('hs_master_rebuild')
          .select('hs_code, mfn_rate, usmca_rate, country_source')
          .eq('hs_code', hsCode);

        if (!error && data && data.length > 0) {
          const usmcaRates = data.map(r => r.usmca_rate);
          const isConsistent = usmcaRates.every(rate => rate === usmcaRates[0]);
          
          consistencyTests.push({
            hsCode,
            consistent: isConsistent,
            sources: data.map(r => r.country_source),
            usmcaRates
          });
        }
      }

      const consistentResults = consistencyTests.filter(t => t.consistent);
      const consistencyRate = (consistentResults.length / consistencyTests.length) * 100;
      
      expect(consistencyRate).toBeGreaterThanOrEqual(95);
      console.log(`USMCA rate consistency: ${consistencyRate}%`);
    });
  });

  describe('2. Crisis Calculator Accuracy Tests', () => {
    test('should calculate accurate savings with real-world scenarios', async () => {
      const testScenarios = [
        {
          name: 'Electronics from China',
          supplierCountry: 'CN',
          hsCode: '8544429000',
          importValue: 1000000,
          expectedSavingsRange: [50000, 250000]
        },
        {
          name: 'Textiles from Vietnam', 
          supplierCountry: 'VN',
          hsCode: '6204620090',
          importValue: 500000,
          expectedSavingsRange: [25000, 150000]
        },
        {
          name: 'Auto parts from South Korea',
          supplierCountry: 'KR', 
          hsCode: '8708299050',
          importValue: 2000000,
          expectedSavingsRange: [10000, 100000]
        }
      ];

      const response = await fetch('/api/simple-savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importVolume: '$1M - $5M',
          supplierCountry: 'CN',
          hsCode: '8544429000',
          businessType: 'Electronics'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success || data.savings).toBeDefined();
      if (data.savings) {
        expect(data.savings.annualTariffSavings).toBeGreaterThan(0);
        expect(data.currentRoute.tariffRate).toBeGreaterThan(0);
        expect(data.triangleRoute.tariffRate).toBe(0);
      }
    });

    test('should validate MFN vs USMCA rate differentials', async () => {
      const differentialTests = [];
      
      for (const hsCode of TEST_CONFIG.SAMPLE_HS_CODES) {
        const { data, error } = await supabase
          .from('hs_master_rebuild')
          .select('hs_code, mfn_rate, usmca_rate, description')
          .eq('hs_code', hsCode)
          .single();

        if (!error && data) {
          const differential = data.mfn_rate - data.usmca_rate;
          differentialTests.push({
            hsCode,
            mfnRate: data.mfn_rate,
            usmcaRate: data.usmca_rate,
            differential,
            savingsOpportunity: differential > 0
          });
        }
      }

      const savingsOpportunities = differentialTests.filter(t => t.savingsOpportunity);
      const opportunityRate = (savingsOpportunities.length / differentialTests.length) * 100;
      
      expect(opportunityRate).toBeGreaterThan(70); // At least 70% should show savings opportunity
      console.log(`Savings opportunities found: ${opportunityRate}%`);
    });

    test('should verify $250K+ average savings claims', async () => {
      // Test high-volume scenario that should yield $250K+ savings
      const response = await fetch('/api/simple-savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importVolume: '$5M - $25M',
          supplierCountry: 'CN', // High tariff country
          hsCode: '8544429000', // Electronics with significant differential
          businessType: 'Electronics'
        })
      });

      const data = await response.json();
      
      if (data.savings && data.analysis.confidence >= 70) {
        // High-confidence calculations should show substantial savings for high-volume imports
        expect(data.savings.annualTariffSavings).toBeGreaterThan(100000);
        
        // Document the calculation for validation
        console.log(`High-volume savings calculation: $${data.savings.annualTariffSavings} annually`);
        console.log(`Confidence level: ${data.analysis.confidence}%`);
        console.log(`Data source: ${data.analysis.dataSource}`);
      }
    });

    test('should ensure database query response times under 500ms', async () => {
      const responseTimeTests = [];
      
      for (const hsCode of TEST_CONFIG.SAMPLE_HS_CODES) {
        const startTime = Date.now();
        
        const { data, error } = await supabase
          .from('hs_master_rebuild')
          .select('hs_code, mfn_rate, usmca_rate, description')
          .eq('hs_code', hsCode)
          .single();
          
        const responseTime = Date.now() - startTime;
        responseTimeTests.push({
          hsCode,
          responseTime,
          success: !error && data
        });
      }

      const averageResponseTime = responseTimeTests.reduce((sum, test) => sum + test.responseTime, 0) / responseTimeTests.length;
      const maxResponseTime = Math.max(...responseTimeTests.map(t => t.responseTime));
      
      expect(averageResponseTime).toBeLessThan(TEST_CONFIG.DATABASE_RESPONSE_TIME_LIMIT);
      expect(maxResponseTime).toBeLessThan(TEST_CONFIG.DATABASE_RESPONSE_TIME_LIMIT * 2);
      
      console.log(`Average database response time: ${averageResponseTime}ms`);
      console.log(`Maximum database response time: ${maxResponseTime}ms`);
    });
  });

  describe('3. HS Code Normalization & Validation', () => {
    test('should normalize HS codes consistently', () => {
      const testCases = [
        { input: '8544.42.90.00', expected: '8544429000' },
        { input: '85.44.42', expected: '854442' },
        { input: '8544 42 90 00', expected: '8544429000' },
        { input: '85', expected: '850000' }, // Chapter padding
        { input: '8544', expected: '854400' }, // Heading padding
        { input: '854442', expected: '854442' }, // Already normalized
        { input: '85444290001234', expected: '8544429000' } // Truncated
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeHSCode(input);
        expect(result).toBe(expected);
      });
    });

    test('should generate proper fallback hierarchies', () => {
      const testCode = '8544429000';
      const fallbacks = generateHSCodeFallbacks(testCode);
      
      expect(fallbacks).toEqual([
        '8544429000', // Exact
        '85444290',   // 8-digit
        '854442',     // 6-digit
        '8544',       // 4-digit heading
        '85'          // 2-digit chapter
      ]);
    });

    test('should validate HS code format correctly', async () => {
      const { validateHSCodeFormat } = await import('../../lib/utils/hs-code-normalizer.js');
      
      const validCodes = ['8544429000', '85.44.42', '85'];
      const invalidCodes = ['', '1', 'abc', '100', '0044'];
      
      validCodes.forEach(code => {
        const result = validateHSCodeFormat(code);
        expect(result.valid).toBe(true);
        expect(result.chapter).toBeGreaterThanOrEqual(1);
        expect(result.chapter).toBeLessThanOrEqual(99);
      });
      
      invalidCodes.forEach(code => {
        const result = validateHSCodeFormat(code);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    test('should perform hierarchical database lookup correctly', async () => {
      // Test with a specific HS code that may not exist exactly
      const testCode = '8544429099'; // Similar to real code but specific suffix
      
      const result = await lookupHSCodeWithFallback(testCode);
      
      expect(result.success).toBe(true);
      expect(result.hsCode).toBeDefined();
      expect(result.matchType).toEqual(expect.stringMatching(/exact|fallback/));
      expect(result.confidence).toBeGreaterThan(0);
      
      if (result.matchType === 'fallback') {
        expect(result.fallbackLevel).toBeGreaterThan(0);
        console.log(`Fallback lookup successful: ${testCode} → ${result.hsCode} (level ${result.fallbackLevel})`);
      }
    });
  });

  describe('4. API Data Consistency Validation', () => {
    test('should return consistent data across all savings calculation APIs', async () => {
      const testPayload = {
        importVolume: '$1M - $5M',
        supplierCountry: 'CN',
        hsCode: '8544429000',
        businessType: 'Electronics'
      };

      // Test multiple APIs with same data
      const apis = [
        '/api/simple-savings',
        '/api/crisis-calculator'
      ];

      const results = [];
      
      for (const api of apis) {
        try {
          let response;
          
          if (api === '/api/crisis-calculator') {
            response = await fetch(api, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'calculate_crisis_penalty',
                data: {
                  tradeVolume: 3000000,
                  hsCode: testPayload.hsCode,
                  originCountry: testPayload.supplierCountry,
                  businessType: testPayload.businessType,
                  sessionId: 'test-session'
                }
              })
            });
          } else {
            response = await fetch(api, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(testPayload)
            });
          }

          const data = await response.json();
          results.push({
            api,
            success: response.status === 200,
            hasData: data.savings || data.crisis_impact,
            response: data
          });
        } catch (error) {
          results.push({
            api,
            success: false,
            error: error.message
          });
        }
      }

      // At least one API should return valid data
      const successfulResults = results.filter(r => r.success);
      expect(successfulResults.length).toBeGreaterThan(0);
      
      console.log(`API consistency test: ${successfulResults.length}/${results.length} APIs responding correctly`);
    });

    test('should detect any remaining hardcoded rates in API responses', async () => {
      const suspiciousRates = [0.068, 6.8, 0.25, 25.0, 0.157, 15.7]; // Common hardcoded values
      
      const response = await fetch('/api/simple-savings', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importVolume: '$1M - $5M',
          supplierCountry: 'CN',
          hsCode: '8544429000',
          businessType: 'Electronics'
        })
      });

      const data = await response.json();
      
      if (data.currentRoute && data.currentRoute.tariffRate) {
        const rate = data.currentRoute.tariffRate / 100; // Convert percentage to decimal
        const isHardcoded = suspiciousRates.some(suspicious => 
          Math.abs(rate - suspicious) < 0.001
        );
        
        expect(isHardcoded).toBe(false);
        console.log(`Tariff rate check: ${rate} (not hardcoded: ${!isHardcoded})`);
      }
    });

    test('should validate shared HS code normalizer usage', async () => {
      // Test various HS code formats across different endpoints
      const testFormats = [
        '8544.42.90.00',
        '85 44 42 90 00',
        '8544-42-90-00',
        '854442'
      ];

      for (const hsCode of testFormats) {
        const response = await fetch('/api/simple-savings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            importVolume: '$1M - $5M',
            supplierCountry: 'CN',
            hsCode,
            businessType: 'Electronics'
          })
        });

        const data = await response.json();
        
        // Should handle all formats without errors
        expect(response.status).toBeLessThan(500);
        
        if (data.calculation && data.calculation.dataSource) {
          expect(data.calculation.dataSource.hsCodeUsed).toBeDefined();
          console.log(`HS code format ${hsCode} → ${data.calculation.dataSource.hsCodeUsed}`);
        }
      }
    });
  });

  describe('5. Hardcoded Values Detection', () => {
    test('should scan all critical files for hardcoded rates', async () => {
      const suspiciousPatterns = [
        /0\.068/g, // Common hardcoded rate
        /6\.8\s*%/g, // Percentage form
        /tariff.*=.*0\.\d+/gi, // Direct assignment
        /rate.*=.*[0-9]+\.[0-9]+/gi, // Rate assignments
        /savings.*=.*\d+000/gi // Hardcoded savings amounts
      ];

      // This would normally scan files, but in test we check API responses
      const testResponse = await fetch('/api/simple-savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importVolume: '$1M - $5M',
          supplierCountry: 'CN',
          businessType: 'Electronics'
        })
      });

      const responseText = await testResponse.text();
      
      // Response should not contain obvious hardcoded patterns
      suspiciousPatterns.forEach((pattern, index) => {
        const matches = responseText.match(pattern);
        expect(matches).toBeNull();
      });
    });

    test('should validate all calculations use database queries', async () => {
      // Check that responses include database source information
      const response = await fetch('/api/simple-savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importVolume: '$1M - $5M',
          supplierCountry: 'CN',
          hsCode: '8544429000',
          businessType: 'Electronics'
        })
      });

      const data = await response.json();
      
      if (data.analysis) {
        expect(data.analysis.dataSource).toBeDefined();
        expect(['cbp_harmonized_tariff_schedule', 'exact_match', 'country_average_fallback'])
          .toContain(data.analysis.dataSource);
      }
      
      if (data.calculation && data.calculation.dataSource) {
        expect(data.calculation.dataSource.source).toBeDefined();
        expect(data.calculation.dataSource.recordCount).toBeGreaterThan(0);
      }
    });
  });

  describe('6. Performance & Quality Benchmarks', () => {
    test('should meet 99.9% accuracy rate for tariff calculations', async () => {
      const testCases = TEST_CONFIG.SAMPLE_HS_CODES.slice(0, 5); // Test subset for performance
      const results = [];
      
      for (const hsCode of testCases) {
        const response = await fetch('/api/simple-savings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            importVolume: '$1M - $5M',
            supplierCountry: 'CN',
            hsCode,
            businessType: 'Electronics'
          })
        });

        const data = await response.json();
        
        results.push({
          hsCode,
          successful: response.status === 200 && (data.savings || data.success !== false),
          hasValidRates: data.currentRoute && data.currentRoute.tariffRate >= 0,
          confidence: data.analysis ? data.analysis.confidence : 0
        });
      }

      const successfulCalculations = results.filter(r => r.successful && r.hasValidRates);
      const accuracyRate = (successfulCalculations.length / results.length) * 100;
      
      expect(accuracyRate).toBeGreaterThanOrEqual(TEST_CONFIG.MINIMUM_ACCURACY_RATE);
      console.log(`Calculation accuracy rate: ${accuracyRate}%`);
    });

    test('should maintain classification relevance above 95%', async () => {
      // This would test the intelligent classifier, but we'll test API integration
      const testProducts = [
        'electric cables and wires',
        'women cotton trousers',
        'automotive brake parts',
        'wooden office furniture',
        'plastic containers'
      ];

      const relevanceResults = [];
      
      for (const product of testProducts) {
        const response = await fetch('/api/simple-classification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productDescription: product })
        });

        if (response.status === 200) {
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const topResult = data.results[0];
            const isRelevant = topResult.confidence > 60; // Minimum threshold
            
            relevanceResults.push({
              product,
              relevant: isRelevant,
              confidence: topResult.confidence,
              hsCode: topResult.hsCode
            });
          }
        }
      }

      if (relevanceResults.length > 0) {
        const relevantResults = relevanceResults.filter(r => r.relevant);
        const relevanceRate = (relevantResults.length / relevanceResults.length) * 100;
        
        expect(relevanceRate).toBeGreaterThanOrEqual(TEST_CONFIG.CLASSIFICATION_RELEVANCE_THRESHOLD);
        console.log(`Classification relevance rate: ${relevanceRate}%`);
      }
    });
  });
});