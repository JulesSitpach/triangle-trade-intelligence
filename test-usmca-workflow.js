const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testUSMCAWorkflow() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 800 // Slow down for better visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    errors: [],
    screenshots: [],
    consoleErrors: []
  };

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push({
        type: 'error',
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  try {
    console.log('🚀 Starting USMCA Workflow Test...');

    // Step 1: Navigate to USMCA workflow
    console.log('📍 Step 1: Navigate to /usmca-workflow');
    try {
      await page.goto('http://localhost:3000/usmca-workflow', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      // Wait for the page to fully load and render
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(screenshotsDir, '01-initial-load.png'),
        fullPage: true
      });

      results.steps.push({
        step: 1,
        description: 'Navigate to USMCA workflow',
        status: 'success',
        url: page.url()
      });

      console.log('✅ Successfully loaded USMCA workflow page');
    } catch (error) {
      results.errors.push({
        step: 1,
        error: `Failed to load page: ${error.message}`
      });
      console.log('❌ Failed to load USMCA workflow page:', error.message);
    }

    // Step 2: Fill Company Information Form
    console.log('📍 Step 2: Fill Company Information Form');
    try {
      // Wait for form inputs to be visible and dropdowns to load
      await page.waitForSelector('input[type="text"]', { timeout: 10000 });
      await page.waitForTimeout(2000); // Wait for dropdown options to load

      // Fill company name (based on actual component structure)
      console.log('Filling company name...');
      const companyNameField = page.locator('input').filter({ hasText: '' }).first();
      // Find the input that comes after the "Company Name" label
      const companyInput = await page.locator('input').nth(0);
      await companyInput.fill('Test Manufacturing Inc');
      console.log('✅ Filled company name');

      // Wait and take screenshot to see current state
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotsDir, '02a-company-name-filled.png'),
        fullPage: true
      });

      // Fill business type - look for the select dropdown
      console.log('Selecting business type...');
      await page.waitForSelector('select', { timeout: 5000 });
      const businessTypeSelect = page.locator('select').first();
      await businessTypeSelect.selectOption('Electronics & Technology');
      console.log('✅ Selected business type: Electronics & Technology');

      // Fill company address
      console.log('Filling company address...');
      const addressInput = await page.locator('input').nth(1);
      await addressInput.fill('123 Test St, Dallas, TX 75001');
      console.log('✅ Filled address');

      // Fill tax ID
      console.log('Filling tax ID...');
      const taxIdInput = await page.locator('input').nth(2);
      await taxIdInput.fill('12-3456789');
      console.log('✅ Filled tax ID');

      // Fill contact person
      console.log('Filling contact person...');
      const contactPersonInput = await page.locator('input').nth(3);
      await contactPersonInput.fill('John Smith');
      console.log('✅ Filled contact person');

      // Fill contact phone
      console.log('Filling contact phone...');
      const phoneInput = await page.locator('input[type="tel"]').first();
      await phoneInput.fill('214-555-0123');
      console.log('✅ Filled phone');

      // Fill contact email
      console.log('Filling contact email...');
      const emailInput = await page.locator('input[type="email"]').first();
      await emailInput.fill('john@test.com');
      console.log('✅ Filled email');

      // Fill trade volume (the text input at the bottom)
      console.log('Filling trade volume...');
      const tradeVolumeInput = page.locator('input[placeholder*="4,800,000"]').first();
      await tradeVolumeInput.fill('2000000');
      console.log('✅ Filled trade volume');

      await page.screenshot({
        path: path.join(screenshotsDir, '02-company-form-filled.png'),
        fullPage: true
      });

      results.steps.push({
        step: 2,
        description: 'Fill Company Information Form',
        status: 'success'
      });

    } catch (error) {
      results.errors.push({
        step: 2,
        error: `Failed to fill company form: ${error.message}`
      });
      console.log('❌ Failed to fill company form:', error.message);

      // Take screenshot of error state
      await page.screenshot({
        path: path.join(screenshotsDir, '02-error-state.png'),
        fullPage: true
      });
    }

    // Step 3: Click Continue to Component Details
    console.log('📍 Step 3: Click Continue to Component Details');
    try {
      // Wait for the button to be enabled - it should be enabled once all required fields are filled
      await page.waitForTimeout(1000);

      // Look for the specific button text "Continue to Product Details"
      const continueButton = page.locator('button:has-text("Continue to Product Details")');

      // Check if button is enabled
      const isEnabled = await continueButton.isEnabled();
      console.log(`Button enabled status: ${isEnabled}`);

      if (isEnabled) {
        await continueButton.click();
        await page.waitForTimeout(3000); // Wait for navigation/form change
        console.log('✅ Clicked continue button');
      } else {
        console.log('⚠️ Continue button is disabled - checking required fields');

        // Debug: Check what fields might be missing
        const inputs = await page.locator('input').all();
        for (let i = 0; i < inputs.length; i++) {
          const value = await inputs[i].inputValue();
          const placeholder = await inputs[i].getAttribute('placeholder');
          console.log(`Input ${i}: value="${value}", placeholder="${placeholder}"`);
        }
      }

      await page.screenshot({
        path: path.join(screenshotsDir, '03-after-continue-click.png'),
        fullPage: true
      });

      results.steps.push({
        step: 3,
        description: 'Click Continue to Component Details',
        status: isEnabled ? 'success' : 'warning',
        url: page.url(),
        note: isEnabled ? 'Button clicked successfully' : 'Button was disabled'
      });

    } catch (error) {
      results.errors.push({
        step: 3,
        error: `Failed to click continue: ${error.message}`
      });
      console.log('❌ Failed to click continue:', error.message);
    }

    // Step 4: Fill Component Origins (if we moved to step 2)
    console.log('📍 Step 4: Check if Component Origins Form is visible');
    try {
      // Wait for potential form change
      await page.waitForTimeout(2000);

      // Check if we're on step 2 (component origins)
      const hasProductDescriptionField = await page.locator('textarea, input').filter({ hasText: 'product' }).isVisible().catch(() => false);

      if (hasProductDescriptionField) {
        console.log('✅ Component Origins form is visible');

        // Fill product description
        const productDescField = page.locator('textarea').first();
        await productDescField.fill('Electronic control units for automotive');
        console.log('✅ Filled product description');

        // Look for manufacturing location dropdown
        const manufacturingSelect = page.locator('select').filter({ hasText: 'Mexico' }).first();
        if (await manufacturingSelect.isVisible().catch(() => false)) {
          await manufacturingSelect.selectOption('Mexico');
          console.log('✅ Selected manufacturing location: Mexico');
        }

        // Look for component origin fields
        const componentInputs = page.locator('input[type="text"]');
        const componentCount = await componentInputs.count();
        console.log(`Found ${componentCount} component input fields`);

        // Try to fill first component
        if (componentCount > 0) {
          await componentInputs.nth(0).fill('Circuit boards');
          console.log('✅ Filled component 1 name');
        }

        await page.screenshot({
          path: path.join(screenshotsDir, '04-component-form-filled.png'),
          fullPage: true
        });

        results.steps.push({
          step: 4,
          description: 'Fill Component Origins Form',
          status: 'success'
        });
      } else {
        console.log('⚠️ Component Origins form not visible - still on Step 1');

        results.steps.push({
          step: 4,
          description: 'Check Component Origins Form',
          status: 'warning',
          note: 'Form not visible - workflow did not advance to Step 2'
        });
      }

    } catch (error) {
      results.errors.push({
        step: 4,
        error: `Failed to fill component form: ${error.message}`
      });
      console.log('❌ Failed to fill component form:', error.message);
    }

    // Step 5: Look for "USMCA Analysis" or workflow progression button
    console.log('📍 Step 5: Look for workflow progression options');
    try {
      await page.waitForTimeout(1000);
      const currentUrl = page.url();

      // Look for any buttons that might advance the workflow
      const allButtons = await page.locator('button').all();
      console.log(`Found ${allButtons.length} buttons on page`);

      for (let i = 0; i < allButtons.length; i++) {
        const buttonText = await allButtons[i].textContent();
        const isEnabled = await allButtons[i].isEnabled();
        console.log(`Button ${i}: "${buttonText}" (enabled: ${isEnabled})`);
      }

      // Look for USMCA Analysis button specifically
      const usmcaButton = page.locator('button:has-text("USMCA"), button:has-text("Analysis")');
      const usmcaButtonExists = await usmcaButton.count() > 0;

      if (usmcaButtonExists) {
        const isEnabled = await usmcaButton.isEnabled();
        if (isEnabled) {
          await usmcaButton.click();
          console.log('✅ Clicked USMCA Analysis button');
          await page.waitForTimeout(3000);
        } else {
          console.log('⚠️ USMCA Analysis button found but disabled');
        }
      } else {
        console.log('⚠️ USMCA Analysis button not found');
      }

      await page.screenshot({
        path: path.join(screenshotsDir, '05-workflow-progression.png'),
        fullPage: true
      });

      results.steps.push({
        step: 5,
        description: 'Look for workflow progression options',
        status: 'success',
        url: currentUrl,
        note: `Found ${allButtons.length} buttons, USMCA button exists: ${usmcaButtonExists}`
      });

    } catch (error) {
      results.errors.push({
        step: 5,
        error: `Failed to progress workflow: ${error.message}`
      });
      console.log('❌ Failed to progress workflow:', error.message);
    }

    // Step 6: Check current URL and workflow state
    console.log('📍 Step 6: Check current URL and workflow state');
    try {
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);

      // Check what step indicator shows
      const stepIndicators = await page.locator('.step, [class*="step"], .progress').count();
      console.log(`Found ${stepIndicators} step indicators`);

      // Check for specific workflow indicators
      const workflowHeaders = await page.locator('h1, h2, h3').allTextContents();
      console.log('Page headers:', workflowHeaders);

      if (currentUrl.includes('/usmca-certificate-completion')) {
        console.log('✅ Successfully navigated to certificate completion page');
        results.steps.push({
          step: 6,
          description: 'Check workflow navigation',
          status: 'success',
          url: currentUrl,
          note: 'Successfully reached certificate completion page'
        });
      } else if (currentUrl.includes('/usmca-workflow')) {
        console.log('⚠️ Still on workflow page - check what step we are on');
        results.steps.push({
          step: 6,
          description: 'Check workflow navigation',
          status: 'warning',
          url: currentUrl,
          note: 'Still on workflow page - may be on different step'
        });
      } else {
        console.log('ℹ️ On different page:', currentUrl);
        results.steps.push({
          step: 6,
          description: 'Check workflow navigation',
          status: 'info',
          url: currentUrl,
          note: 'On different page than expected'
        });
      }

      await page.screenshot({
        path: path.join(screenshotsDir, '06-final-page-state.png'),
        fullPage: true
      });

    } catch (error) {
      results.errors.push({
        step: 6,
        error: `Failed to check workflow state: ${error.message}`
      });
      console.log('❌ Failed to check workflow state:', error.message);
    }

    // Step 7: Analyze final page content
    console.log('📍 Step 7: Analyze final page content');
    try {
      // Check for form elements
      const forms = await page.locator('form').count();
      const inputs = await page.locator('input, select, textarea').count();
      const buttons = await page.locator('button').count();

      console.log(`📊 Final count: ${forms} forms, ${inputs} input fields, ${buttons} buttons`);

      // Check for any error messages
      const errorMessages = await page.locator('.error, .alert-danger, [class*="error"]').count();
      const successMessages = await page.locator('.success, .alert-success, [class*="success"]').count();

      console.log(`📊 Messages: ${errorMessages} errors, ${successMessages} success messages`);

      // Check if we have certificate generation capability
      const certificateButtons = await page.locator('button:has-text("Certificate"), button:has-text("Generate"), button:has-text("Download")').count();
      console.log(`📊 Certificate-related buttons: ${certificateButtons}`);

      await page.screenshot({
        path: path.join(screenshotsDir, '07-final-analysis.png'),
        fullPage: true
      });

      results.steps.push({
        step: 7,
        description: 'Analyze final page content',
        status: 'success',
        details: {
          forms: forms,
          inputs: inputs,
          buttons: buttons,
          errors: errorMessages,
          success: successMessages,
          certificateButtons: certificateButtons
        }
      });

    } catch (error) {
      results.errors.push({
        step: 7,
        error: `Failed to analyze final content: ${error.message}`
      });
      console.log('❌ Failed to analyze final content:', error.message);
    }

    // Final screenshot and console log check
    console.log('📍 Final: Check for console errors');
    try {
      const consoleLogs = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleLogs.push({
            type: 'error',
            text: msg.text(),
            location: msg.location()
          });
        }
      });

      await page.waitForTimeout(2000); // Wait to catch any delayed console errors

      if (consoleLogs.length > 0) {
        console.log(`⚠️ Found ${consoleLogs.length} console errors:`);
        consoleLogs.forEach((log, index) => {
          console.log(`  ${index + 1}. ${log.text}`);
        });
        results.consoleErrors = consoleLogs;
      } else {
        console.log('✅ No console errors detected');
      }

      await page.screenshot({
        path: path.join(screenshotsDir, '08-final-state.png'),
        fullPage: true
      });

    } catch (error) {
      console.log('❌ Failed to check console errors:', error.message);
    }

  } catch (globalError) {
    results.errors.push({
      step: 'global',
      error: `Global test error: ${globalError.message}`
    });
    console.log('❌ Global test error:', globalError.message);
  } finally {
    await browser.close();
  }

  // Generate test report
  const reportPath = path.join(__dirname, 'usmca-workflow-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log('📋 Test Results Summary:');
  console.log(`✅ Successful steps: ${results.steps.filter(s => s.status === 'success').length}`);
  console.log(`⚠️ Warning steps: ${results.steps.filter(s => s.status === 'warning').length}`);
  console.log(`❌ Errors encountered: ${results.errors.length}`);
  console.log(`📸 Screenshots saved to: ${screenshotsDir}`);
  console.log(`📄 Full report saved to: ${reportPath}`);

  return results;
}

// Run the test
testUSMCAWorkflow().catch(console.error);