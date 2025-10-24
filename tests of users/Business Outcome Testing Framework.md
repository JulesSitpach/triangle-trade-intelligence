After fixing the schema standardization, here's how to test business logic correctly:

## **Business Outcome Testing Framework**

### **1. User Journey Scenarios**
Create tests that mirror actual user decisions:

```javascript
describe('Real User Scenarios', () => {
  test('Chinese steel manufacturer gets correct Section 301 calculation', () => {
    const userInput = {
      company: 'Steel Co',
      components: [{ 
        description: 'Steel housing', 
        origin_country: 'CN', 
        value_percentage: 100 
      }],
      destination_country: 'US',
      trade_volume: 1000000
    };
    
    const result = runCompleteWorkflow(userInput);
    
    // Test business outcomes, not technical details
    expect(result.tariff_analysis.section_301).toBeGreaterThan(20); // Should apply ~25%
    expect(result.savings.potential_exposure).toBeGreaterThan(200000); // Should show real risk
    expect(result.alerts[0].description).toContain('Section 301'); // Should mention policy
    expect(result.alerts[0].financial_impact).toMatch(/\$[\d,]+/); // Should show dollar amounts
  });

  test('USMCA-qualified textile shows proper savings calculation', () => {
    const userInput = {
      components: [
        { description: 'Cotton fabric', origin_country: 'US', value_percentage: 45 },
        { description: 'Polyester thread', origin_country: 'MX', value_percentage: 35 },
        { description: 'Foam backing', origin_country: 'CA', value_percentage: 20 }
      ],
      trade_volume: 850000
    };
    
    const result = runCompleteWorkflow(userInput);
    
    // Validate business logic correctness
    expect(result.usmca_qualified).toBe(true);
    expect(result.savings.annual_amount).toBeBetween(50000, 60000);
    expect(result.alerts.every(alert => !alert.description.includes('Unknown volume'))).toBe(true);
  });
});
```

### **2. Business Rule Validation**
Test the logic that drives user outcomes:

```javascript
describe('Business Rule Enforcement', () => {
  test('classification agent prioritizes highest confidence options', () => {
    const classification = classifyComponent('Steel housing from China');
    
    // Test decision logic
    expect(classification.primary_option.confidence).toBeGreaterThan(classification.alternatives[0].confidence);
    expect(classification.primary_option.is_recommended).toBe(true);
  });

  test('alert consolidation eliminates duplicate information', () => {
    const alerts = generateAlerts(userId);
    
    // Test content quality
    const allContent = alerts.map(a => a.summary).join(' ');
    const duplicatePatterns = ['115% USMCA qualification', 'Canadian foam supplier'];
    
    duplicatePatterns.forEach(pattern => {
      const matches = (allContent.match(new RegExp(pattern, 'g')) || []).length;
      expect(matches).toBeLessThanOrEqual(1); // Should appear only once
    });
  });

  test('trade volume data flows from workflow to alerts', () => {
    const workflow = createWorkflow({ trade_volume: 850000 });
    completeWorkflow(workflow);
    const alerts = getDashboardAlerts(workflow.user_id);
    
    // Test data continuity
    expect(alerts.every(alert => alert.trade_volume === 850000)).toBe(true);
    expect(alerts.every(alert => !alert.description.includes('provide annual volume'))).toBe(true);
  });
});
```

### **3. Financial Accuracy Testing**
Validate the calculations that affect user decisions:

```javascript
describe('Financial Calculation Accuracy', () => {
  test('tariff calculations match manual verification', () => {
    const component = { origin_country: 'CN', value_percentage: 100, hs_code: '7326.90.85' };
    const tradeVolume = 1000000;
    
    const result = calculateTariffImpact(component, tradeVolume, 'US');
    
    // Manual calculation for verification
    const expectedMFN = tradeVolume * 0.029; // 2.9% base rate
    const expectedSection301 = tradeVolume * 0.25; // 25% Section 301
    const expectedTotal = expectedMFN + expectedSection301;
    
    expect(result.total_tariff_cost).toBeCloseTo(expectedTotal, -2); // Within $100
  });

  test('USMCA savings calculations are consistent across components', () => {
    const analysis = runUSMCAAnalysis(testWorkflow);
    
    // Component-level savings should sum to total savings
    const componentSavings = analysis.components.reduce((sum, comp) => sum + comp.annual_savings, 0);
    const totalSavings = analysis.savings.annual_amount;
    
    expect(Math.abs(componentSavings - totalSavings)).toBeLessThan(100); // Within $100
  });
});
```

### **4. User Experience Quality Tests**
Test what users actually see and experience:

```javascript
describe('User Experience Quality', () => {
  test('alerts provide actionable next steps', () => {
    const alerts = getUserAlerts(userId);
    
    alerts.forEach(alert => {
      // Test content usefulness
      expect(alert.recommended_actions.length).toBeGreaterThan(0);
      expect(alert.timeline).toMatch(/\d+ (days|weeks|months)/);
      expect(alert.financial_impact).not.toContain('Unknown');
      
      // Test content clarity
      expect(alert.summary.length).toBeLessThan(500); // Concise
      expect(alert.summary).not.toMatch(/\b(undefined|null|NaN)\b/); // No technical errors
    });
  });

  test('dashboard shows consistent data across all sections', () => {
    const dashboard = getDashboardData(userId);
    
    // Cross-section data consistency
    const workflowVolume = dashboard.workflows[0].trade_volume;
    const alertVolume = dashboard.alerts[0].trade_volume;
    const profileVolume = dashboard.user_profile.trade_volume;
    
    expect(workflowVolume).toBe(alertVolume);
    expect(alertVolume).toBe(profileVolume);
  });
});
```

### **5. Multi-User Data Isolation Testing**
Ensure users never see each other's data (critical compliance):

```javascript
describe('Data Isolation & User Privacy', () => {
  test('User A cannot see User B tariff calculations', () => {
    const userA = createTestUser('alice@company.com');
    const userB = createTestUser('bob@company.com');

    // User A submits a workflow with sensitive data
    const workflowA = submitWorkflow(userA.id, {
      components: [{ description: 'Proprietary part', value_percentage: 100 }],
      trade_volume: 5000000 // High-value trade secret
    });

    // User B tries to access User A's workflow
    const result = getWorkflow(userB.id, workflowA.id);

    // User B should get 403 Forbidden, not User A's data
    expect(result.statusCode).toBe(403);
    expect(result.error).toContain('Not authorized');
  });

  test('Dashboard alerts only show own products', () => {
    const userA = createTestUser('alice@company.com');
    const userB = createTestUser('bob@company.com');

    // Both submit different products
    submitWorkflow(userA.id, { components: [{ description: 'Steel components' }] });
    submitWorkflow(userB.id, { components: [{ description: 'Textile components' }] });

    const alertsA = getUserAlerts(userA.id);
    const alertsB = getUserAlerts(userB.id);

    // Verify isolation
    expect(alertsA.every(a => a.product_description === 'Steel components')).toBe(true);
    expect(alertsB.every(a => a.product_description === 'Textile components')).toBe(true);
    expect(alertsA.length > 0).toBe(true);
    expect(alertsB.length > 0).toBe(true);
  });

  test('Subscription tier restrictions are enforced', () => {
    const freeUser = createTestUser('free@company.com', { tier: 'free' });
    const proUser = createTestUser('pro@company.com', { tier: 'professional' });

    // Free user: 1 analysis per month
    submitWorkflow(freeUser.id, testWorkflow);
    const secondAttempt = submitWorkflow(freeUser.id, testWorkflow);
    expect(secondAttempt.statusCode).toBe(429); // Rate limited

    // Pro user: unlimited analyses
    expect(() => {
      submitWorkflow(proUser.id, testWorkflow);
      submitWorkflow(proUser.id, testWorkflow);
      submitWorkflow(proUser.id, testWorkflow);
    }).not.toThrow();
  });
});
```

### **6. Error Handling & Recovery Testing**
Test graceful failure (users get clear errors, not blank screens):

```javascript
describe('Error Handling & User Communication', () => {
  test('AI unavailable returns cached data with warning, not error', () => {
    // Simulate OpenRouter API failure
    mockOpenRouterAPI.setStatus('unavailable');

    const result = analyzeComponents(testWorkflow, 'US');

    // Should succeed with cache
    expect(result.success).toBe(true);
    expect(result.data_source).toContain('cached');
    expect(result.warning).toContain('Using cached tariff data from');
    expect(result.warning).toContain('January 2025'); // Shows staleness
  });

  test('Missing required fields produce clear error messages', () => {
    const incompleteData = {
      company_name: 'TestCo',
      // Missing: destination_country
      components: [{ description: 'Part', value_percentage: 100 }]
    };

    const result = submitWorkflow(userId, incompleteData);

    // User gets actionable error
    expect(result.statusCode).toBe(400);
    expect(result.error).toContain('destination_country is required');
    expect(result.hint).toContain('Must be US, CA, or MX'); // Tells user valid values
  });

  test('Database timeout shows user-friendly message', () => {
    // Simulate database connection timeout
    mockDatabase.setDelay(15000); // 15 seconds

    const startTime = Date.now();
    const result = analyzeComponents(testWorkflow);
    const elapsedTime = Date.now() - startTime;

    // Should timeout gracefully
    expect(elapsedTime).toBeLessThan(6000); // API timeout < 6 seconds
    expect(result.statusCode).toBe(503);
    expect(result.message).toContain('temporarily unavailable');
    expect(result.retry_after).toBe(60); // Tells user when to retry
  });

  test('Invalid tariff data is logged but workflow continues', () => {
    const logSpy = jest.spyOn(DevIssueLogger, 'log');

    // Simulate AI returning inconsistent data
    mockAI.setResponse({
      mfn_rate: 5,
      section_301: -10, // Invalid: negative tariff!
      usmca_rate: 20
    });

    const result = analyzeComponents(testWorkflow);

    // Workflow succeeds with flagged data
    expect(result.success).toBe(true);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'data_quality_issue',
        description: expect.stringContaining('negative')
      })
    );
    expect(result.components[0].data_quality_flag).toBe('review_recommended');
  });
});
```

### **7. Cache Behavior & Timing Testing**
Test that cache works correctly and expires appropriately:

```javascript
describe('Cache Expiration & Freshness', () => {
  test('Mexico destination uses database cache (no AI cost)', () => {
    const aiSpy = jest.spyOn(OpenRouterAPI, 'call');

    analyzeComponents(testWorkflow, 'MX');

    // Should NOT call AI for Mexico
    expect(aiSpy).not.toHaveBeenCalled();
    expect(analysisResult.data_source).toBe('database_cache');
    expect(analysisResult.cost).toBe(0); // Free!
  });

  test('US destination refreshes cache every 24 hours', () => {
    // First analysis at 9 AM
    let result1 = analyzeComponents(testWorkflow, 'US');
    expect(result1.data_source).toBe('ai_fresh_24hr');

    // Second analysis 12 hours later
    mockTime.advance(12 * 60 * 60 * 1000);
    let result2 = analyzeComponents(testWorkflow, 'US');
    expect(result2.data_source).toBe('ai_cached_24hr'); // Should use cache

    // Third analysis 24+ hours later
    mockTime.advance(13 * 60 * 60 * 1000);
    let result3 = analyzeComponents(testWorkflow, 'US');
    expect(result3.data_source).toBe('ai_fresh_24hr'); // Should refresh
  });

  test('Canada destination uses 90-day cache', () => {
    const result1 = analyzeComponents(testWorkflow, 'CA');
    expect(result1.data_source).toBe('ai_fresh_90day');

    // After 60 days, should still be cached
    mockTime.advance(60 * 24 * 60 * 60 * 1000);
    const result2 = analyzeComponents(testWorkflow, 'CA');
    expect(result2.data_source).toBe('ai_cached_90day');

    // After 95 days, should refresh
    mockTime.advance(35 * 24 * 60 * 60 * 1000);
    const result3 = analyzeComponents(testWorkflow, 'CA');
    expect(result3.data_source).toBe('ai_fresh_90day');
  });
});
```

### **8. Certificate Generation Validation**
Test that certificates are generated correctly with user data:

```javascript
describe('Certificate Generation & User Data', () => {
  test('Certificate uses authenticated user company data, not form data', () => {
    const authUser = {
      id: 'user123',
      company_name: 'My Real Company Inc',
      country: 'US'
    };

    const formData = {
      company_name: 'Fake Company', // User tries to spoof
      company_country: 'CN'
    };

    const cert = generateCertificate(authUser, formData);

    // Should use auth data, not form data
    expect(cert.certifier_company).toBe('My Real Company Inc');
    expect(cert.certifier_country).toBe('US');
    expect(cert.certifier_company).not.toBe('Fake Company');
  });

  test('Certificate only generates for USMCA-qualified products', () => {
    // Non-qualified product (> 50% non-USMCA content)
    const unqualified = {
      components: [
        { origin_country: 'CN', value_percentage: 60 },
        { origin_country: 'US', value_percentage: 40 }
      ]
    };

    const result = generateCertificate(authUser, unqualified);

    expect(result.statusCode).toBe(400);
    expect(result.error).toContain('not USMCA qualified');
    expect(result.hint).toContain('regional content requirement');
  });

  test('Certificate PDF contains all required USMCA Form D fields', () => {
    const cert = generateCertificate(authUser, qualifiedWorkflow);
    const pdfText = extractTextFromPDF(cert.pdf);

    // USMCA Form D required fields
    const requiredFields = [
      'Certifier',
      'Exporter',
      'Producer',
      'Importer',
      'Description of goods',
      'HS Code',
      'Preference Criterion'
    ];

    requiredFields.forEach(field => {
      expect(pdfText).toContain(field);
      expect(pdfText).not.toContain('undefined');
      expect(pdfText).not.toContain('[Not Provided]'); // No placeholders
    });
  });
});
```

### **9. User Responsibility & Liability Testing**
Test that users understand they own data accuracy:

```javascript
describe('User Responsibility Messaging', () => {
  test('User must explicitly acknowledge data accuracy before certificate', () => {
    const workflow = analyzeComponents(testWorkflow);

    // Try to generate certificate without acknowledgment
    let result = generateCertificate(authUser, workflow, {
      acknowledged: false
    });
    expect(result.statusCode).toBe(400);
    expect(result.error).toContain('You must verify');

    // With acknowledgment, succeeds
    result = generateCertificate(authUser, workflow, {
      acknowledged: true,
      user_statement: 'I certify this data is accurate'
    });
    expect(result.success).toBe(true);
  });

  test('Dashboard shows liability disclaimer prominently', () => {
    const dashboard = getDashboardHTML(userId);
    const htmlText = dashboard.innerHTML;

    // Disclaimer must be visible and clear
    expect(htmlText).toContain('You are responsible');
    expect(htmlText).toContain('accuracy');
    expect(htmlText).toContain('customs');

    // Should NOT be buried in small print
    const disclaimerElement = dashboard.querySelector('[role=alert]');
    expect(disclaimerElement).toBeTruthy();
    expect(disclaimerElement.className).toContain('prominent');
  });

  test('Invoice shows USMCA analysis was performed', () => {
    const invoice = getInvoice(userId);

    expect(invoice.line_items).toContainEqual(
      expect.objectContaining({
        description: 'USMCA Certificate Analysis',
        quantity: 1
      })
    );
    expect(invoice.notes).toContain('Self-service analysis');
    expect(invoice.notes).not.toContain('consulting');
  });
});
```

### **10. Tariff Policy Change Impact Testing**
Test that policy updates don't corrupt user data:

```javascript
describe('Tariff Policy Updates & Data Integrity', () => {
  test('Section 301 rate change applies only to new analyses', () => {
    // Original analysis with 25% Section 301
    const oldAnalysis = analyzeComponents({
      components: [{ origin_country: 'CN', hs_code: '8542.31' }],
      destination_country: 'US'
    }, { section_301_rate: 0.25 });

    expect(oldAnalysis.components[0].section_301).toBe(25);

    // Update: Section 301 increases to 35%
    mockAI.updatePolicy({ section_301_rate: 0.35 });

    // OLD analysis unchanged
    const oldUnchanged = getAnalysis(oldAnalysis.id);
    expect(oldUnchanged.components[0].section_301).toBe(25);

    // NEW analysis gets new rate
    const newAnalysis = analyzeComponents(testWorkflow);
    expect(newAnalysis.components[0].section_301).toBe(35);
  });

  test('Tariff cache invalidation on policy change', () => {
    // First analysis caches at 25% Section 301
    analyzeComponents(testWorkflow, 'US');

    // Policy changes
    mockAI.updatePolicy({ section_301_rate: 0.35 });
    triggerCacheInvalidation();

    // New analysis picks up new rate
    const result = analyzeComponents(testWorkflow, 'US');
    expect(result.components[0].section_301).toBe(35);
    expect(result.data_source).toBe('ai_fresh_24hr'); // Cache was cleared
  });

  test('User is notified of rate changes affecting their products', () => {
    const userId = setupUserWithChineseComponents();

    // Section 301 increases by 10%
    mockAI.updatePolicy({ section_301_rate: 0.35 });

    // User gets alert
    const alerts = getUserAlerts(userId);
    expect(alerts).toContainEqual(
      expect.objectContaining({
        title: 'Section 301 Tariff Update',
        description: expect.stringContaining('increased'),
        financial_impact: expect.stringContaining('$'),
        action: 'Review your Chinese-origin products'
      })
    );
  });
});
```

## **The Key Difference**

Your old tests asked: "Did the function return data?"
These tests ask: "Did the user get the right business outcome?"

This approach catches the logic bugs that technical tests miss - like wrong prioritization, missing data flow, and backwards business rules.

**Extended testing also validates:**
- Data isolation (users can't see each other's data)
- Error recovery (failures don't leave users stuck)
- Cache behavior (API costs stay reasonable)
- Certificate integrity (can't be forged)
- User accountability (users understand responsibility)
- Policy changes (don't corrupt old data)

This is production-ready testing that protects both **user success** and **platform integrity**.
**Absolutely - that's the most important test of all.**

You should test whether alerts actually provide value that users would pay for and engage with, not just technical correctness.

## **Alert Value Testing**

```javascript
describe('Alert Business Value', () => {
  test('alerts address genuine user pain points', () => {
    const user = createTestUser({ 
      pain_points: ['compliance deadlines', 'cost optimization', 'audit risk'] 
    });
    const alerts = getUserAlerts(user.id);
    
    // Test relevance
    expect(alerts.some(alert => alert.category === 'compliance_deadline')).toBe(true);
    expect(alerts.some(alert => alert.potential_savings > 0)).toBe(true);
    expect(alerts.some(alert => alert.risk_level === 'HIGH')).toBe(true);
  });

  test('alert content drives user action', () => {
    const alerts = getUserAlerts(userId);
    
    alerts.forEach(alert => {
      // Test actionability
      expect(alert.next_steps).toBeDefined();
      expect(alert.deadline).toMatch(/\d+ (days|weeks)/);
      expect(alert.effort_required).toMatch(/(low|medium|high)/);
      
      // Test clarity over comprehensiveness
      expect(alert.summary.split(' ').length).toBeLessThan(50); // Under 50 words
      expect(alert.key_insight).toBeDefined(); // One clear takeaway
    });
  });

  test('alerts prevent information overload', () => {
    const alerts = getUserAlerts(userId);
    
    // Test cognitive load
    expect(alerts.length).toBeLessThanOrEqual(5); // Max 5 alerts
    expect(alerts.filter(a => a.priority === 'HIGH').length).toBeLessThanOrEqual(2); // Max 2 urgent
    
    // Test for repetition
    const summaries = alerts.map(a => a.summary);
    const uniqueContent = new Set(summaries.map(s => s.substring(0, 100)));
    expect(uniqueContent.size).toBe(summaries.length); // No duplicate content
  });
});
```

## **User Engagement Testing**

```javascript
describe('Alert Engagement Quality', () => {
  test('alerts feel personally relevant', () => {
    const user = createTestUser({ 
      industry: 'automotive', 
      supply_chain: ['China', 'Mexico'],
      trade_volume: 850000 
    });
    const alerts = getUserAlerts(user.id);
    
    // Test personalization
    expect(alerts.every(alert => 
      alert.description.includes(user.industry) || 
      alert.affected_countries.some(country => user.supply_chain.includes(country))
    )).toBe(true);
    
    // Test financial relevance
    expect(alerts.every(alert => 
      alert.financial_impact !== 'Unknown' && 
      alert.financial_impact !== '$0'
    )).toBe(true);
  });

  test('alerts provide insider intelligence value', () => {
    const alerts = getUserAlerts(userId);
    
    alerts.forEach(alert => {
      // Test value proposition
      expect(alert).toHaveProperty('why_this_matters');
      expect(alert).toHaveProperty('insider_insight');
      expect(alert.competitive_advantage).toBeDefined();
      
      // Test timing value
      expect(alert.urgency_reason).toBeDefined();
      expect(alert.cost_of_delay).toMatch(/\$[\d,]+/);
    });
  });
});
```

## **Retention Value Testing**

```javascript
describe('Subscription Retention Value', () => {
  test('alerts justify ongoing subscription cost', () => {
    const monthlyAlerts = getUserAlertsForPeriod(userId, '30_days');
    const subscriptionCost = 99; // $99/month
    
    // Calculate total value delivered
    const totalSavingsOpportunity = monthlyAlerts.reduce((sum, alert) => 
      sum + (alert.potential_savings || 0), 0
    );
    const totalRiskMitigation = monthlyAlerts.reduce((sum, alert) => 
      sum + (alert.risk_exposure || 0), 0
    );
    
    // Test ROI justification
    expect(totalSavingsOpportunity + totalRiskMitigation).toBeGreaterThan(subscriptionCost * 10);
  });

  test('alerts create habit-forming engagement', () => {
    const alerts = getUserAlerts(userId);
    
    // Test engagement design
    expect(alerts.some(alert => alert.action_required === 'this_week')).toBe(true);
    expect(alerts.some(alert => alert.follow_up_in)).toBeDefined();
    expect(alerts.some(alert => alert.progress_tracking)).toBeDefined();
  });
});
```

## **Real User Feedback Simulation**

```javascript
describe('User Satisfaction Simulation', () => {
  test('alerts pass the "forward to colleague" test', () => {
    const alerts = getUserAlerts(userId);
    
    alerts.forEach(alert => {
      // Test shareability (good content gets shared)
      expect(alert.summary).not.toContain('Unknown');
      expect(alert.summary).not.toContain('If you provide');
      expect(alert.recommendation).toStartWith('Recommended action:');
      expect(alert.timeline).toBeDefined();
    });
  });

  test('alerts pass the "check email eagerly" test', () => {
    const alerts = getUserAlerts(userId);
    
    // Test anticipation value
    expect(alerts.some(alert => alert.surprise_factor > 0)).toBe(true); // Something unexpected
    expect(alerts.some(alert => alert.urgency_level === 'HIGH')).toBe(true); // Something time-sensitive
    expect(alerts.some(alert => alert.opportunity_type === 'cost_savings')).toBe(true); // Something profitable
  });
});
```

## **The Ultimate Test**

**Would a real trade compliance manager forward these alerts to their CEO?** If not, the alerts aren't providing enough value to justify the subscription cost.

This tests whether your alerts create genuine business value vs just technical functionality.