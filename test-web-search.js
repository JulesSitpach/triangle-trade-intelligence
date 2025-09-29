// Test web search integration
(async () => {
  console.log('🔍 PROOF: Testing web search integration');
  console.log('Query: Smart home IoT sensors manufacturers Mexico');

  try {
    const response = await fetch('http://localhost:3001/api/web-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Smart home IoT sensors manufacturers Mexico',
        product: 'IoT sensors',
        requirements: { certifications: ['CE', 'FCC'] }
      })
    });

    if (!response.ok) {
      console.log('❌ WEB SEARCH API FAILED:', response.status, response.statusText);
      return;
    }

    const result = await response.json();
    console.log('✅ WEB SEARCH API SUCCESS');
    console.log('Results found:', result.results ? result.results.length : 0);

    if (result.results && result.results.length > 0) {
      result.results.slice(0, 3).forEach((supplier, index) => {
        console.log(`[${index + 1}] ${supplier.name} | ${supplier.location} | Contact: ${supplier.extractedEmail || supplier.extractedPhone || 'No contact'}`);
      });
    }

  } catch (error) {
    console.log('❌ WEB SEARCH TEST FAILED:', error.message);
  }
})();