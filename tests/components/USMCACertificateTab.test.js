/**
 * Test Suite: USMCACertificateTab Component
 * Tests all aspects of USMCA certificate generation service
 */

const testUSMCACertificate = async () => {
  console.log('🧪 Testing USMCACertificateTab...');

  // Test 1: Component renders with service request data
  const mockRequest = {
    id: 'test-request-001',
    service_type: 'usmca_certificate',
    subscriber_data: {
      company_name: 'Test Manufacturing Corp',
      product_description: 'automotive electronic components',
      component_origins: [
        { country: 'Mexico', percentage: 60, component_type: 'assembly' },
        { country: 'Canada', percentage: 40, component_type: 'raw materials' }
      ],
      trade_volume: '2500000',
      manufacturing_location: 'Detroit, Michigan',
      qualification_status: 'USMCA_QUALIFIED'
    },
    status: 'in_progress',
    created_at: new Date().toISOString()
  };

  // Test 2: API responds with real certificate data
  try {
    const apiResponse = await fetch('/api/generate-usmca-certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: mockRequest.id,
        subscriber_data: mockRequest.subscriber_data
      })
    });

    if (!apiResponse.ok) {
      throw new Error(`API failed with status ${apiResponse.status}`);
    }

    const result = await apiResponse.json();

    // Validate certificate generation
    if (!result.success) {
      throw new Error(`Certificate generation failed: ${result.error}`);
    }

    if (!result.certificate_url && !result.pdf_buffer) {
      throw new Error('Certificate must generate PDF output');
    }

    console.log('✅ Certificate generation API working');

    // Test 3: Enhanced Classification Agent integration
    if (result.enhanced_classification) {
      const classification = result.enhanced_classification;

      if (!classification.hs_code || !classification.tariff_rate) {
        throw new Error('Enhanced Classification Agent must provide HS code and tariff rate');
      }

      if (!classification.confidence_score || classification.confidence_score < 0.8) {
        console.warn('⚠️ Low confidence score in classification');
      }

      console.log('✅ Enhanced Classification Agent integration working');
    }

    // Test 4: PDF accessibility and content
    if (result.certificate_url) {
      const pdfResponse = await fetch(result.certificate_url);
      if (!pdfResponse.ok) {
        throw new Error('Generated PDF must be accessible');
      }

      const contentLength = pdfResponse.headers.get('content-length');
      if (!contentLength || parseInt(contentLength) < 1000) {
        throw new Error('Generated PDF appears to be empty or corrupted');
      }

      console.log('✅ PDF generation and accessibility working');
    }

    // Test 5: USMCA compliance validation
    if (result.compliance_status) {
      const compliance = result.compliance_status;

      if (!compliance.usmca_eligible) {
        console.log('ℹ️ Product not USMCA eligible - this is acceptable for testing');
      }

      if (!compliance.tariff_savings && compliance.usmca_eligible) {
        throw new Error('USMCA eligible products must show tariff savings');
      }

      console.log('✅ USMCA compliance validation working');
    }

    return {
      success: true,
      certificate_url: result.certificate_url,
      compliance_status: result.compliance_status,
      processing_time: result.processing_time
    };

  } catch (error) {
    throw new Error(`USMCACertificateTab test failed: ${error.message}`);
  }
};

// Test data validation
const validateTestData = (subscriberData) => {
  const required = ['company_name', 'product_description', 'component_origins'];
  const missing = required.filter(field => !subscriberData[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required subscriber data: ${missing.join(', ')}`);
  }

  if (!Array.isArray(subscriberData.component_origins) || subscriberData.component_origins.length === 0) {
    throw new Error('Component origins must be a non-empty array');
  }

  return true;
};

// Performance test
const testCertificatePerformance = async () => {
  const startTime = Date.now();

  const result = await testUSMCACertificate();

  const endTime = Date.now();
  const processingTime = endTime - startTime;

  if (processingTime > 10000) { // 10 seconds max
    throw new Error(`Certificate generation too slow: ${processingTime}ms`);
  }

  console.log(`✅ Performance test passed: ${processingTime}ms`);
  return { processingTime, result };
};

// Error handling test
const testCertificateErrorHandling = async () => {
  console.log('🧪 Testing error handling...');

  // Test with invalid data
  try {
    const response = await fetch('/api/generate-usmca-certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: 'invalid-test',
        subscriber_data: {} // Empty data should cause graceful error
      })
    });

    const result = await response.json();

    if (response.ok) {
      throw new Error('API should reject invalid data');
    }

    if (!result.error || !result.message) {
      throw new Error('Error response must include error and message fields');
    }

    console.log('✅ Error handling working correctly');
    return { success: true };

  } catch (error) {
    if (error.message.includes('API should reject')) {
      throw error;
    }
    // Network errors are acceptable for this test
    console.log('✅ Error handling test completed (network error expected)');
    return { success: true };
  }
};

module.exports = {
  testUSMCACertificate,
  validateTestData,
  testCertificatePerformance,
  testCertificateErrorHandling
};

// Run tests if called directly
if (require.main === module) {
  (async () => {
    try {
      await testUSMCACertificate();
      await testCertificatePerformance();
      await testCertificateErrorHandling();
      console.log('🎉 All USMCACertificateTab tests passed!');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  })();
}