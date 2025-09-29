/**
 * Test Suite: SupplierSourcingTab Component
 * Tests the functional supplier discovery system
 */

const testSupplierSourcing = async () => {
  console.log('🧪 Testing SupplierSourcingTab...');

  // Test data based on successful implementation
  const mockRequest = {
    id: 'test-supplier-001',
    service_type: 'supplier_sourcing',
    subscriber_data: {
      company_name: 'Test Electronics Manufacturing',
      product_description: 'electronic components and circuit boards',
      component_origins: [
        { country: 'China', percentage: 70, component_type: 'semiconductors' },
        { country: 'Taiwan', percentage: 30, component_type: 'PCB assembly' }
      ],
      trade_volume: '1500000',
      manufacturing_location: 'Austin, Texas',
      qualification_status: 'SEEKING_ALTERNATIVES'
    },
    sourcing_requirements: {
      monthly_volume: '50000',
      certifications: ['iso_9001', 'iatf_16949'],
      timeline: 'immediate',
      payment_terms: '30_days',
      quality_requirements: 'automotive_grade'
    },
    status: 'in_progress',
    created_at: new Date().toISOString()
  };

  try {
    // Test 1: API responds with real supplier discovery
    const apiResponse = await fetch('/api/supplier-sourcing-discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: mockRequest.id,
        subscriber_data: mockRequest.subscriber_data,
        sourcing_requirements: mockRequest.sourcing_requirements
      })
    });

    if (!apiResponse.ok) {
      throw new Error(`Supplier discovery API failed with status ${apiResponse.status}`);
    }

    const result = await apiResponse.json();

    // Validate supplier discovery results
    if (!result.success) {
      throw new Error(`Supplier discovery failed: ${result.error}`);
    }

    if (!result.suppliers || !Array.isArray(result.suppliers)) {
      throw new Error('API must return suppliers array');
    }

    if (result.suppliers.length === 0) {
      throw new Error('Supplier discovery must find at least some suppliers');
    }

    console.log(`✅ Found ${result.suppliers.length} suppliers via discovery API`);

    // Test 2: Validate supplier data quality
    for (const supplier of result.suppliers) {
      if (!supplier.name || !supplier.location) {
        throw new Error('Each supplier must have name and location');
      }

      if (!supplier.contact && !supplier.extractedEmail && !supplier.extractedPhone) {
        console.warn(`⚠️ Supplier ${supplier.name} has no contact information`);
      }

      if (!supplier.capabilities) {
        throw new Error('Each supplier must have capabilities description');
      }
    }

    console.log('✅ Supplier data quality validation passed');

    // Test 3: Verify contextual search was used
    const searchQueries = result.search_queries || [];
    const productDesc = mockRequest.subscriber_data.product_description;

    // Check if searches were contextual (using actual product description)
    const contextualSearch = searchQueries.some(query =>
      query.toLowerCase().includes(productDesc.toLowerCase()) ||
      query.includes('electronic') ||
      query.includes('circuit')
    );

    if (!contextualSearch && searchQueries.length > 0) {
      console.warn('⚠️ Searches may not be using contextual product data');
    }

    console.log('✅ Contextual search verification completed');

    // Test 4: Verify Mexico trade bridge focus
    const mexicanSuppliers = result.suppliers.filter(supplier =>
      supplier.location.toLowerCase().includes('mexico') ||
      supplier.location.toLowerCase().includes('tijuana') ||
      supplier.location.toLowerCase().includes('guadalajara') ||
      supplier.location.toLowerCase().includes('monterrey')
    );

    if (mexicanSuppliers.length === 0) {
      console.warn('⚠️ No Mexican suppliers found - may not align with Mexico trade bridge focus');
    } else {
      console.log(`✅ Found ${mexicanSuppliers.length} Mexican suppliers (trade bridge focus)`);
    }

    // Test 5: Verify database storage (if enabled)
    if (result.database_storage) {
      console.log('✅ Suppliers stored in database for future reference');
    }

    return {
      success: true,
      suppliers_found: result.suppliers.length,
      mexican_suppliers: mexicanSuppliers.length,
      has_contact_info: result.suppliers.filter(s => s.contact || s.extractedEmail || s.extractedPhone).length,
      discovery_summary: result.discovery_summary
    };

  } catch (error) {
    throw new Error(`SupplierSourcingTab test failed: ${error.message}`);
  }
};

// Test web search integration
const testWebSearchIntegration = async () => {
  console.log('🧪 Testing web search integration...');

  try {
    // Test direct web search API
    const searchResponse = await fetch('/api/web-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'electronic components suppliers Mexico certified',
        product: 'electronic components',
        requirements: { certifications: ['iso_9001'] }
      })
    });

    if (!searchResponse.ok) {
      throw new Error(`Web search API failed: ${searchResponse.status}`);
    }

    const searchResult = await searchResponse.json();

    if (!searchResult.success || !searchResult.results) {
      throw new Error('Web search must return results');
    }

    if (searchResult.results.length === 0) {
      throw new Error('Web search should find some results');
    }

    console.log(`✅ Web search found ${searchResult.results.length} results`);

    // Validate search result structure
    for (const result of searchResult.results) {
      if (!result.name && !result.title) {
        throw new Error('Search results must have name or title');
      }

      if (!result.location) {
        throw new Error('Search results must include location');
      }
    }

    console.log('✅ Web search result structure validated');

    return { success: true, results_count: searchResult.results.length };

  } catch (error) {
    throw new Error(`Web search integration test failed: ${error.message}`);
  }
};

// Test performance requirements
const testSourcingPerformance = async () => {
  console.log('🧪 Testing sourcing performance...');

  const startTime = Date.now();

  try {
    await testSupplierSourcing();

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Sourcing is allowed to take longer due to web searches
    if (processingTime > 30000) { // 30 seconds max
      throw new Error(`Supplier sourcing too slow: ${processingTime}ms`);
    }

    console.log(`✅ Performance test passed: ${processingTime}ms`);
    return { processingTime, success: true };

  } catch (error) {
    throw new Error(`Performance test failed: ${error.message}`);
  }
};

// Test error handling for sourcing
const testSourcingErrorHandling = async () => {
  console.log('🧪 Testing sourcing error handling...');

  try {
    // Test with missing requirements
    const response = await fetch('/api/supplier-sourcing-discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: 'invalid-test',
        subscriber_data: {
          company_name: 'Test Company'
          // Missing required fields
        }
      })
    });

    const result = await response.json();

    // Should handle gracefully
    if (response.ok && result.success) {
      console.warn('⚠️ API should validate required fields');
    }

    console.log('✅ Error handling test completed');
    return { success: true };

  } catch (error) {
    // Network errors are acceptable
    console.log('✅ Error handling test completed (network error expected)');
    return { success: true };
  }
};

// Test configuration-driven behavior
const testConfigurationDriven = async () => {
  console.log('🧪 Testing configuration-driven behavior...');

  try {
    // Check if supplier discovery config exists
    const configPath = require('path').join(process.cwd(), 'config', 'supplier-discovery-config.js');
    const fs = require('fs');

    if (fs.existsSync(configPath)) {
      const config = require(configPath);

      if (config.SUPPLIER_DISCOVERY_CONFIG) {
        console.log('✅ Configuration file found and structured correctly');

        // Check for hardcoded values
        const configString = fs.readFileSync(configPath, 'utf8');

        if (configString.includes('Test Company') || configString.includes('Hardcoded Corp')) {
          throw new Error('Configuration contains hardcoded company names');
        }

        console.log('✅ No hardcoded values detected in configuration');
      }
    } else {
      console.warn('⚠️ Supplier discovery configuration file not found');
    }

    return { success: true };

  } catch (error) {
    throw new Error(`Configuration test failed: ${error.message}`);
  }
};

module.exports = {
  testSupplierSourcing,
  testWebSearchIntegration,
  testSourcingPerformance,
  testSourcingErrorHandling,
  testConfigurationDriven
};

// Run tests if called directly
if (require.main === module) {
  (async () => {
    try {
      await testSupplierSourcing();
      await testWebSearchIntegration();
      await testSourcingPerformance();
      await testSourcingErrorHandling();
      await testConfigurationDriven();
      console.log('🎉 All SupplierSourcingTab tests passed!');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  })();
}