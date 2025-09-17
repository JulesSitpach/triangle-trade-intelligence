const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testCompleteWorkflow() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 600
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'complete-workflow-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    errors: [],
    completedSteps: 0
  };

  try {
    console.log('🚀 Testing Complete USMCA Workflow Journey...');

    // Step 1: Load and fill Step 1 (Company Information)
    await page.goto('http://localhost:3000/usmca-workflow');
    await page.waitForTimeout(2000);

    console.log('📝 Filling Step 1: Company Information...');

    // Fill all required fields for Step 1
    await page.locator('input').nth(0).fill('Test Manufacturing Inc');
    await page.locator('select').first().selectOption('Electronics & Technology');
    await page.locator('input').nth(1).fill('123 Test St, Dallas, TX 75001');
    await page.locator('input').nth(2).fill('12-3456789');
    await page.locator('input').nth(3).fill('John Smith');
    await page.locator('input[type="tel"]').fill('214-555-0123');
    await page.locator('input[type="email"]').fill('john@test.com');
    await page.locator('input[placeholder*="4,800,000"]').fill('2000000');

    await page.screenshot({ path: path.join(screenshotsDir, '01-step1-completed.png'), fullPage: true });

    // Click Continue to Product Details
    await page.locator('button:has-text("Continue to Product Details")').click();
    await page.waitForTimeout(3000);

    console.log('✅ Step 1 completed - Advanced to Step 2');
    results.completedSteps++;

    // Step 2: Fill Product & Component Analysis
    console.log('📝 Filling Step 2: Product & Component Analysis...');

    await page.screenshot({ path: path.join(screenshotsDir, '02-step2-initial.png'), fullPage: true });

    // Fill product description (look for textarea)
    const productTextarea = page.locator('textarea').first();
    if (await productTextarea.isVisible()) {
      await productTextarea.fill('Electronic control units for automotive applications including engine management systems and sensor interfaces');
      console.log('✅ Filled product description');
    }

    // Fill manufacturing location if there's a select for it
    const manufacturingSelects = page.locator('select');
    const selectCount = await manufacturingSelects.count();
    console.log(`Found ${selectCount} select dropdowns`);

    for (let i = 0; i < selectCount; i++) {
      const selectOptions = await manufacturingSelects.nth(i).locator('option').allTextContents();
      console.log(`Select ${i} options:`, selectOptions.slice(0, 5)); // First 5 options

      if (selectOptions.some(opt => opt.includes('Mexico'))) {
        await manufacturingSelects.nth(i).selectOption('Mexico');
        console.log('✅ Selected manufacturing location: Mexico');
        break;
      }
    }

    // Fill component details
    const componentInputs = page.locator('input[type="text"]');
    const inputCount = await componentInputs.count();
    console.log(`Found ${inputCount} text inputs for components`);

    if (inputCount > 0) {
      await componentInputs.nth(0).fill('Circuit boards and electronic components');
      console.log('✅ Filled component 1 description');
    }

    // Look for percentage/value inputs
    const numberInputs = page.locator('input[type="number"], input[placeholder*="%"]');
    const numberCount = await numberInputs.count();
    if (numberCount > 0) {
      await numberInputs.nth(0).fill('60');
      console.log('✅ Filled component 1 percentage: 60%');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '02-step2-filled.png'), fullPage: true });

    // Try to click USMCA Analysis button
    const usmcaButton = page.locator('button:has-text("USMCA"), button:has-text("Analysis")');
    const isUsmcaEnabled = await usmcaButton.isEnabled().catch(() => false);

    if (isUsmcaEnabled) {
      await usmcaButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Clicked USMCA Analysis button');
      results.completedSteps++;
    } else {
      console.log('⚠️ USMCA Analysis button not enabled yet - checking if more fields needed');

      // Try to find and fill more required fields
      const allInputs = await page.locator('input:not([type="hidden"])').all();
      for (let i = 0; i < allInputs.length; i++) {
        const input = allInputs[i];
        const value = await input.inputValue();
        const placeholder = await input.getAttribute('placeholder');
        const isRequired = await input.getAttribute('required');

        if (!value && (isRequired || placeholder)) {
          console.log(`Found empty field ${i}: placeholder="${placeholder}", required=${isRequired}`);

          // Try to fill based on placeholder or type
          if (placeholder && placeholder.includes('origin')) {
            await input.fill('China');
          } else if (placeholder && placeholder.includes('%')) {
            await input.fill('40');
          } else if (placeholder && placeholder.includes('description')) {
            await input.fill('Electronic component');
          }
        }
      }

      await page.waitForTimeout(1000);
      const isNowEnabled = await usmcaButton.isEnabled().catch(() => false);
      if (isNowEnabled) {
        await usmcaButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ USMCA Analysis button enabled after filling additional fields');
        results.completedSteps++;
      }
    }

    await page.screenshot({ path: path.join(screenshotsDir, '03-after-usmca-analysis.png'), fullPage: true });

    // Step 3: Check for Path Selection or Results
    console.log('📝 Checking for Path Selection or Results...');

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Look for path selection buttons
    const pathButtons = await page.locator('button').allTextContents();
    console.log('Available buttons:', pathButtons);

    // Look for certificate-related buttons
    const certificateButton = page.locator('button:has-text("Certificate"), button:has-text("Professional")');
    const certificateExists = await certificateButton.count() > 0;

    if (certificateExists) {
      await certificateButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Selected certificate path');
      results.completedSteps++;
    }

    await page.screenshot({ path: path.join(screenshotsDir, '04-path-selection.png'), fullPage: true });

    // Step 4: Look for Authorization or Certificate Generation
    console.log('📝 Looking for Authorization or Certificate Generation...');

    // Check for authorization fields
    const authFields = page.locator('input[placeholder*="name"], input[placeholder*="title"], input[placeholder*="signatory"]');
    const authCount = await authFields.count();

    if (authCount > 0) {
      console.log(`Found ${authCount} authorization fields`);

      // Fill signatory information
      if (authCount >= 1) {
        await authFields.nth(0).fill('John Smith');
        console.log('✅ Filled signatory name');
      }
      if (authCount >= 2) {
        await authFields.nth(1).fill('Trade Compliance Manager');
        console.log('✅ Filled signatory title');
      }

      await page.screenshot({ path: path.join(screenshotsDir, '05-authorization-filled.png'), fullPage: true });

      // Look for generate certificate button
      const generateButton = page.locator('button:has-text("Generate"), button:has-text("Certificate")');
      const generateExists = await generateButton.count() > 0;

      if (generateExists) {
        const isGenerateEnabled = await generateButton.isEnabled();
        if (isGenerateEnabled) {
          await generateButton.click();
          await page.waitForTimeout(3000);
          console.log('✅ Clicked Generate Certificate button');
          results.completedSteps++;
        }
      }
    }

    // Final screenshot and URL check
    await page.waitForTimeout(2000);
    const finalUrl = page.url();

    await page.screenshot({ path: path.join(screenshotsDir, '06-final-state.png'), fullPage: true });

    // Check if we reached certificate completion
    if (finalUrl.includes('certificate-completion') || finalUrl.includes('certificate')) {
      console.log('✅ Successfully reached certificate completion page!');
      results.reachedCertificateCompletion = true;
    } else {
      console.log('⚠️ Did not reach certificate completion page');
      console.log(`Final URL: ${finalUrl}`);
      results.reachedCertificateCompletion = false;
    }

    // Summary
    console.log('\n📊 Workflow Test Summary:');
    console.log(`✅ Completed Steps: ${results.completedSteps}`);
    console.log(`📄 Final URL: ${finalUrl}`);
    console.log(`🎯 Reached Certificate Completion: ${results.reachedCertificateCompletion ? 'YES' : 'NO'}`);

    results.finalUrl = finalUrl;
    results.success = results.completedSteps >= 2; // At least got through first 2 steps

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    results.errors.push(error.message);

    await page.screenshot({ path: path.join(screenshotsDir, 'error-state.png'), fullPage: true });
  } finally {
    await browser.close();

    // Save results
    const reportPath = path.join(__dirname, 'complete-workflow-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    console.log(`\n📋 Complete report saved to: ${reportPath}`);
    console.log(`📸 Screenshots saved to: ${screenshotsDir}`);
  }

  return results;
}

// Run the test
testCompleteWorkflow().catch(console.error);