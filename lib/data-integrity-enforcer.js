/**
 * Data Integrity Enforcer - Blocks Fake Data
 * Prevents any template/generated data from proceeding
 */

class DataIntegrityViolation extends Error {
  constructor(message, violationType, data) {
    super(message);
    this.name = 'DataIntegrityViolation';
    this.violationType = violationType;
    this.data = data;
  }
}

const FAKE_DATA_PATTERNS = {
  // Template email patterns
  templateEmails: [
    /info@\w+tijuana\.com\.mx/,
    /info@\w+guadalajara\.com\.mx/,
    /info@\w+monterrey\.com\.mx/,
    /info@manufacturing\w+\.com\.mx/,
    /contact@\w+mexico\.com/
  ],

  // Template company name patterns
  templateCompanyNames: [
    /\w+\s+Manufacturing\s+Solutions/,
    /Mexico\s+\w+\s+Suppliers/,
    /\w+\s+Industrial\s+Group/
  ],

  // Template location patterns
  templateLocations: [
    /^\w+,\s+Mexico$/,
    /^Mexico\s+City,\s+Mexico$/
  ],

  // Calculated/generated values
  generatedValues: [
    'NaN',
    'undefined',
    'null',
    'Not specified',
    'Contact via web search'
  ]
};

const auditDataSource = (data, context = 'unknown') => {
  const violations = [];

  // Check for missing required fields
  if (!data.name || data.name === 'undefined' || data.name === null) {
    violations.push({
      type: 'MISSING_COMPANY_NAME',
      field: 'name',
      value: data.name,
      message: 'Company name is missing or undefined'
    });
  }

  // Check for template email patterns
  if (data.email || data.contact || data.extractedEmail) {
    const email = data.email || data.contact || data.extractedEmail;
    if (typeof email === 'string') {
      for (const pattern of FAKE_DATA_PATTERNS.templateEmails) {
        if (pattern.test(email)) {
          violations.push({
            type: 'TEMPLATE_EMAIL',
            field: 'email',
            value: email,
            message: `Template email pattern detected: ${email}`
          });
        }
      }
    }
  }

  // Check for broken calculations
  if (data.confidence === 'NaN%' || data.confidence === 'NaN' || isNaN(parseFloat(data.confidence))) {
    violations.push({
      type: 'BROKEN_CALCULATION',
      field: 'confidence',
      value: data.confidence,
      message: 'Confidence calculation is broken (NaN)'
    });
  }

  // Check for missing capabilities
  if (!data.capabilities || data.capabilities === 'No capabilities listed') {
    violations.push({
      type: 'MISSING_CAPABILITIES',
      field: 'capabilities',
      value: data.capabilities,
      message: 'Capabilities are missing or template text'
    });
  }

  // Check for generated values in critical fields
  for (const field of ['name', 'contact', 'location', 'capabilities']) {
    const value = data[field];
    if (typeof value === 'string' && FAKE_DATA_PATTERNS.generatedValues.includes(value)) {
      violations.push({
        type: 'GENERATED_VALUE',
        field: field,
        value: value,
        message: `Field contains generated/placeholder value: ${value}`
      });
    }
  }

  return violations;
};

const blockFakeData = (suppliers, context = 'supplier_discovery') => {
  console.log(`🔒 [DATA INTEGRITY] Auditing ${suppliers.length} suppliers for fake data...`);

  const allViolations = [];

  suppliers.forEach((supplier, index) => {
    const violations = auditDataSource(supplier, `${context}[${index}]`);
    if (violations.length > 0) {
      allViolations.push({
        supplier_index: index,
        supplier_data: supplier,
        violations: violations
      });
    }
  });

  if (allViolations.length > 0) {
    console.error('❌ [DATA INTEGRITY] FAKE DATA DETECTED - BLOCKING OPERATION');
    allViolations.forEach(issue => {
      console.error(`Supplier ${issue.supplier_index}:`, issue.violations.map(v => v.message));
    });

    throw new DataIntegrityViolation(
      `BLOCKED: Fake data detected in ${allViolations.length} suppliers. Cannot proceed with template/generated data for paid service.`,
      'FAKE_SUPPLIER_DATA',
      allViolations
    );
  }

  console.log('✅ [DATA INTEGRITY] All suppliers passed integrity check');
  return true;
};

const containsTemplateData = (results) => {
  try {
    auditDataSource(results);
    return false;
  } catch (error) {
    return true;
  }
};

const enforceRealWebSearch = (webSearchResults, query) => {
  console.log(`🔍 [WEB SEARCH INTEGRITY] Verifying real web search for: "${query}"`);

  if (!webSearchResults || webSearchResults.length === 0) {
    throw new DataIntegrityViolation(
      "BLOCKED: No web search results detected. Real web search required for paid service.",
      'NO_WEB_SEARCH_RESULTS',
      { query, results_count: 0 }
    );
  }

  // Check if results contain template patterns
  const hasTemplateData = webSearchResults.some(result => {
    const violations = auditDataSource(result, 'web_search_result');
    return violations.length > 0;
  });

  if (hasTemplateData) {
    throw new DataIntegrityViolation(
      "BLOCKED: Web search results contain template data. Real company discovery required.",
      'TEMPLATE_WEB_SEARCH_DATA',
      { query, results: webSearchResults }
    );
  }

  console.log('✅ [WEB SEARCH INTEGRITY] Web search results verified as real');
  return true;
};

// Block development until web search works
const blockDevelopmentUntilWebSearchWorks = async (apiEndpoint) => {
  console.log('🚫 [DEVELOPMENT BLOCK] Testing web search functionality...');

  try {
    const testResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'electronics manufacturers Mexico real companies',
        integrity_check: true
      })
    });

    if (!testResponse.ok) {
      throw new DataIntegrityViolation(
        "BLOCKED: Web search API not responding. Cannot proceed with development.",
        'WEB_SEARCH_API_FAILURE',
        { status: testResponse.status }
      );
    }

    const result = await testResponse.json();

    if (!result.results || result.results.length === 0) {
      throw new DataIntegrityViolation(
        "BLOCKED: Web search returns no results. Cannot proceed with fake data.",
        'NO_REAL_SEARCH_RESULTS',
        result
      );
    }

    // Check for template data in results
    enforceRealWebSearch(result.results, 'development_test');

    console.log('✅ [DEVELOPMENT BLOCK] Web search verification passed - development can proceed');
    return true;

  } catch (error) {
    console.error('❌ [DEVELOPMENT BLOCK] Web search verification failed');
    throw new DataIntegrityViolation(
      `BLOCKED: Development cannot proceed. Web search must work first. Error: ${error.message}`,
      'DEVELOPMENT_BLOCKED',
      { original_error: error.message }
    );
  }
};

module.exports = {
  auditDataSource,
  blockFakeData,
  containsTemplateData,
  enforceRealWebSearch,
  blockDevelopmentUntilWebSearchWorks,
  DataIntegrityViolation,
  FAKE_DATA_PATTERNS
};