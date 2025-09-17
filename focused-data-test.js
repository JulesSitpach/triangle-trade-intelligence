const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function focusedDataAutoPopulationTest() {
    console.log('🎯 FOCUSED TEST: Data Auto-Population Verification');
    console.log('Target Issues: HS Classification, Savings Analysis, Manufacturing Location, Certificate Auto-Population');
    console.log('=' * 80);
    
    const screenshotsDir = path.join(__dirname, 'test-screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
    }

    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500 
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    try {
        // Step 1: Navigate to workflow
        console.log('\n📱 Step 1: Loading USMCA Workflow...');
        await page.goto('http://localhost:3001/usmca-workflow');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'focused_01_workflow_loaded.png'), 
            fullPage: true 
        });
        console.log('✅ Workflow loaded - screenshot captured');
        
        // Step 2: Fill Company Information (minimal required fields)
        console.log('\n📋 Step 2: Filling Company Information...');
        
        // Fill company name
        const companyName = page.locator('input[placeholder*="Enter your legal entity name"]');
        if (await companyName.count() > 0) {
            await companyName.fill('Electronics Test Manufacturing Corp');
            console.log('   ✓ Company name filled');
        }
        
        // Fill address
        const address = page.locator('input[placeholder*="Street address"]');
        if (await address.count() > 0) {
            await address.fill('789 Tech Boulevard, Toronto, ON M5V 2X9');
            console.log('   ✓ Address filled');
        }
        
        // Fill contact person
        const contact = page.locator('input[placeholder*="Primary contact"]');
        if (await contact.count() > 0) {
            await contact.fill('John Smith');
            console.log('   ✓ Contact filled');
        }
        
        // Fill email
        const email = page.locator('input[placeholder*="compliance@"]');
        if (await email.count() > 0) {
            await email.fill('compliance@electronicscorp.com');
            console.log('   ✓ Email filled');
        }
        
        // Try to select business type (but don't fail if it doesn't work)
        try {
            const businessSelect = page.locator('select').first();
            if (await businessSelect.count() > 0) {
                // Get all options and select Electronics if available
                const options = await businessSelect.locator('option').allTextContents();
                console.log('   Available business types:', options.slice(0, 5).join(', '));
                
                // Try to find and select Electronics or similar
                for (const option of options) {
                    if (option.toLowerCase().includes('electronic') || option.toLowerCase().includes('technology')) {
                        await businessSelect.selectOption({ label: option });
                        console.log(`   ✓ Selected business type: ${option}`);
                        break;
                    }
                }
            }
        } catch (e) {
            console.log('   ⚠️  Business type selection skipped (dropdown loading)');
        }
        
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'focused_02_company_filled.png'), 
            fullPage: true 
        });
        console.log('✅ Company information filled - screenshot captured');
        
        // Step 3: Navigate to Product Details (try multiple approaches)
        console.log('\n📦 Step 3: Navigating to Product Details...');
        
        // Try clicking Continue button
        const continueButton = page.locator('button:has-text("Continue to Product Details")').or(
            page.locator('button:has-text("Continue")')
        ).or(
            page.locator('button[type="submit"]')
        );
        
        if (await continueButton.count() > 0) {
            await continueButton.first().click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
            console.log('   ✓ Clicked continue button');
        } else {
            // Try direct navigation as backup
            await page.goto('http://localhost:3001/usmca-workflow?step=2');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
            console.log('   ✓ Direct navigation to step 2');
        }
        
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'focused_03_product_step.png'), 
            fullPage: true 
        });
        
        // Step 4: Fill Product Information
        console.log('\n🔧 Step 4: Filling Product Information...');
        
        // Fill product details
        const productName = page.locator('input[name="product_name"]').or(
            page.locator('input[placeholder*="product name"]')
        );
        if (await productName.count() > 0) {
            await productName.fill('Wireless Gaming Headphones with RGB');
            console.log('   ✓ Product name filled');
        }
        
        const productDesc = page.locator('textarea[name="product_description"]').or(
            page.locator('textarea[placeholder*="description"]')
        );
        if (await productDesc.count() > 0) {
            await productDesc.fill('Professional wireless gaming headphones featuring active noise cancellation, 50mm drivers, RGB LED lighting, and 40-hour battery life with Bluetooth 5.2 connectivity.');
            console.log('   ✓ Product description filled');
        }
        
        // Add components (focus on getting manufacturing locations)
        console.log('   📍 Adding components with manufacturing locations...');
        
        // Look for Add Component button
        const addComponentBtn = page.locator('button').filter({ hasText: /add component/i });
        
        if (await addComponentBtn.count() > 0) {
            // Add first component
            await addComponentBtn.first().click();
            await page.waitForTimeout(1000);
            
            // Fill first component details
            const componentName1 = page.locator('input').filter({ hasText: /component name/i }).or(
                page.locator('input[placeholder*="Component name"]')
            ).first();
            
            if (await componentName1.count() > 0) {
                await componentName1.fill('Bluetooth Audio Processing Circuit');
                console.log('     ✓ Component 1 name filled');
            }
            
            const componentDesc1 = page.locator('textarea').filter({ hasText: /component description/i }).or(
                page.locator('textarea[placeholder*="Component description"]')
            ).first();
            
            if (await componentDesc1.count() > 0) {
                await componentDesc1.fill('Main PCB with Bluetooth 5.2 chip, audio processing unit, and power management');
                console.log('     ✓ Component 1 description filled');
            }
            
            // Try to set manufacturing location
            const manufacturingSelects = page.locator('select');
            const manufacturingSelectCount = await manufacturingSelects.count();
            
            if (manufacturingSelectCount > 0) {
                try {
                    // Look for a select that might be manufacturing location
                    for (let i = 0; i < manufacturingSelectCount; i++) {
                        const select = manufacturingSelects.nth(i);
                        const options = await select.locator('option').allTextContents();
                        
                        // Check if this looks like a country/location dropdown
                        if (options.some(opt => opt.includes('China') || opt.includes('Taiwan') || opt.includes('Manufacturing'))) {
                            await select.selectOption({ label: 'China' });
                            console.log('     ✓ Manufacturing location set to China');
                            break;
                        }
                    }
                } catch (e) {
                    console.log('     ⚠️  Manufacturing location selection skipped');
                }
            }
            
            // Add component value
            const valueInput = page.locator('input[placeholder*="value"]').or(
                page.locator('input[type="number"]')
            ).first();
            
            if (await valueInput.count() > 0) {
                await valueInput.fill('45.50');
                console.log('     ✓ Component 1 value filled');
            }
            
            // Add second component
            if (await addComponentBtn.count() > 0) {
                await addComponentBtn.first().click();
                await page.waitForTimeout(1000);
                
                const componentName2 = page.locator('input[placeholder*="Component name"]').nth(1);
                if (await componentName2.count() > 0) {
                    await componentName2.fill('Premium Speaker Drivers');
                    console.log('     ✓ Component 2 name filled');
                }
                
                const componentDesc2 = page.locator('textarea[placeholder*="Component description"]').nth(1);
                if (await componentDesc2.count() > 0) {
                    await componentDesc2.fill('50mm neodymium drivers with frequency response 10Hz-40kHz');
                    console.log('     ✓ Component 2 description filled');
                }
                
                // Try to set second manufacturing location
                try {
                    const select2 = manufacturingSelects.nth(-1); // Last select element
                    const options2 = await select2.locator('option').allTextContents();
                    
                    if (options2.some(opt => opt.includes('Taiwan'))) {
                        await select2.selectOption({ label: 'Taiwan' });
                        console.log('     ✓ Manufacturing location set to Taiwan');
                    }
                } catch (e) {
                    console.log('     ⚠️  Second manufacturing location selection skipped');
                }
                
                const valueInput2 = page.locator('input[placeholder*="value"]').nth(1);
                if (await valueInput2.count() > 0) {
                    await valueInput2.fill('32.75');
                    console.log('     ✓ Component 2 value filled');
                }
            }
        }
        
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'focused_04_components_filled.png'), 
            fullPage: true 
        });
        console.log('✅ Product details and components filled - screenshot captured');
        
        // Step 5: Generate Analysis
        console.log('\n📊 Step 5: Generating USMCA Analysis...');
        
        const generateBtn = page.locator('button').filter({ hasText: /generate|analyze|continue/i });
        
        if (await generateBtn.count() > 0) {
            await generateBtn.first().click();
            console.log('   ✓ Analysis generation triggered');
            
            // Wait for analysis to complete
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(8000); // Give extra time for AI processing
            
            console.log('   ✓ Waiting for analysis completion...');
        } else {
            console.log('   ⚠️  Generate button not found, trying direct navigation');
            await page.goto('http://localhost:3001/usmca-workflow?step=3');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(5000);
        }
        
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'focused_05_results_page.png'), 
            fullPage: true 
        });
        console.log('✅ Results page loaded - screenshot captured');
        
        // Step 6: VERIFICATION ANALYSIS
        console.log('\n🔍 VERIFICATION ANALYSIS - Data Auto-Population Fixes');
        console.log('=' * 60);
        
        const pageContent = await page.textContent('body');
        const pageHTML = await page.innerHTML('body');
        
        // VERIFICATION 1: HS Classification Fix
        console.log('\n1️⃣  HS CLASSIFICATION VERIFICATION:');
        
        const hasNotClassified = pageContent.includes('Not classified');
        const hasClassificationSection = pageContent.includes('HS Classification') || pageContent.includes('Classification');
        const hsCodeMatches = pageContent.match(/\b\d{4,10}\b/g) || [];
        const validHSCodes = hsCodeMatches.filter(code => code.length >= 6 && code.length <= 10);
        
        console.log(`   📍 "Not classified" text present: ${hasNotClassified ? '❌ FOUND' : '✅ NOT FOUND'}`);
        console.log(`   📍 Classification section present: ${hasClassificationSection ? '✅ YES' : '❌ NO'}`);
        console.log(`   📍 Valid HS codes found: ${validHSCodes.length > 0 ? '✅ YES' : '❌ NO'}`);
        console.log(`   📍 HS codes detected: ${validHSCodes.slice(0, 3).join(', ')}`);
        
        const hsClassificationScore = (!hasNotClassified ? 1 : 0) + (hasClassificationSection ? 1 : 0) + (validHSCodes.length > 0 ? 1 : 0);
        console.log(`   🎯 HS Classification Fix Score: ${hsClassificationScore}/3 ${hsClassificationScore >= 2 ? '✅' : '❌'}`);
        
        // VERIFICATION 2: Savings Analysis Fix
        console.log('\n2️⃣  SAVINGS ANALYSIS VERIFICATION:');
        
        const hasSavingsSection = pageContent.includes('Savings Analysis') || pageContent.includes('💰') || pageContent.includes('Savings');
        const hasMFNRate = pageContent.includes('MFN Rate') || pageContent.includes('MFN:') || pageContent.includes('Most Favored Nation');
        const hasUSMCARate = pageContent.includes('USMCA Rate') || pageContent.includes('USMCA:') || pageContent.toLowerCase().includes('usmca rate');
        const hasAnnualSavings = pageContent.includes('Annual Savings') || pageContent.includes('yearly savings');
        const dollarMatches = pageContent.match(/\$[\d,]+/g) || [];
        const percentageMatches = pageContent.match(/\d+\.?\d*%/g) || [];
        
        console.log(`   💰 Savings section present: ${hasSavingsSection ? '✅ YES' : '❌ NO'}`);
        console.log(`   💰 MFN Rate displayed: ${hasMFNRate ? '✅ YES' : '❌ NO'}`);
        console.log(`   💰 USMCA Rate displayed: ${hasUSMCARate ? '✅ YES' : '❌ NO'}`);
        console.log(`   💰 Annual savings displayed: ${hasAnnualSavings ? '✅ YES' : '❌ NO'}`);
        console.log(`   💰 Dollar amounts found: ${dollarMatches.slice(0, 3).join(', ')}`);
        console.log(`   💰 Percentage rates found: ${percentageMatches.slice(0, 3).join(', ')}`);
        
        const savingsScore = (hasSavingsSection ? 1 : 0) + (hasMFNRate || hasUSMCARate ? 1 : 0) + (dollarMatches.length > 0 ? 1 : 0);
        console.log(`   🎯 Savings Analysis Fix Score: ${savingsScore}/3 ${savingsScore >= 2 ? '✅' : '❌'}`);
        
        // VERIFICATION 3: Manufacturing Location Fix
        console.log('\n3️⃣  MANUFACTURING LOCATION VERIFICATION:');
        
        const hasManufacturingLabel = pageContent.includes('Manufacturing:') || pageContent.includes('Manufacturing Location');
        const hasChinaLocation = pageContent.includes('China');
        const hasTaiwanLocation = pageContent.includes('Taiwan');
        const hasOriginData = pageContent.includes('Origin:') || pageContent.includes('Country of Origin');
        const manufacturingMentions = (pageContent.match(/Manufacturing/gi) || []).length;
        const locationMentions = (pageContent.match(/China|Taiwan|Korea|Japan|Mexico/gi) || []).length;
        
        console.log(`   🏭 Manufacturing labels: ${hasManufacturingLabel ? '✅ YES' : '❌ NO'} (${manufacturingMentions} mentions)`);
        console.log(`   🏭 China location: ${hasChinaLocation ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
        console.log(`   🏭 Taiwan location: ${hasTaiwanLocation ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
        console.log(`   🏭 Origin data present: ${hasOriginData ? '✅ YES' : '❌ NO'}`);
        console.log(`   🏭 Total location mentions: ${locationMentions}`);
        
        const manufacturingScore = (hasManufacturingLabel ? 1 : 0) + (hasChinaLocation || hasTaiwanLocation ? 1 : 0) + (locationMentions > 0 ? 1 : 0);
        console.log(`   🎯 Manufacturing Location Fix Score: ${manufacturingScore}/3 ${manufacturingScore >= 2 ? '✅' : '❌'}`);
        
        // Capture focused screenshots of each section
        await page.screenshot({ path: path.join(screenshotsDir, 'focused_06_hs_classification_focus.png') });
        
        // Step 7: Certificate Auto-Population Test
        console.log('\n4️⃣  CERTIFICATE AUTO-POPULATION VERIFICATION:');
        
        // Look for certificate buttons or links
        const certificateButtons = page.locator('button, a').filter({ hasText: /certificate|authorization|continue|complete/i });
        const certificateButtonCount = await certificateButtons.count();
        
        console.log(`   📄 Certificate-related buttons found: ${certificateButtonCount}`);
        
        if (certificateButtonCount > 0) {
            // Try to navigate to certificate page
            try {
                await certificateButtons.first().click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(3000);
                
                const certPageContent = await page.textContent('body');
                
                // Check for auto-populated data
                const hasCompanyName = certPageContent.includes('Electronics Test Manufacturing Corp');
                const hasAddress = certPageContent.includes('Toronto') || certPageContent.includes('Tech Boulevard');
                const hasContact = certPageContent.includes('John Smith');
                const hasEmail = certPageContent.includes('compliance@electronicscorp.com');
                const hasProductName = certPageContent.includes('Wireless Gaming Headphones');
                const hasCertHSCodes = validHSCodes.some(code => certPageContent.includes(code));
                
                console.log(`   📄 Company name auto-populated: ${hasCompanyName ? '✅ YES' : '❌ NO'}`);
                console.log(`   📄 Address auto-populated: ${hasAddress ? '✅ YES' : '❌ NO'}`);
                console.log(`   📄 Contact auto-populated: ${hasContact ? '✅ YES' : '❌ NO'}`);
                console.log(`   📄 Email auto-populated: ${hasEmail ? '✅ YES' : '❌ NO'}`);
                console.log(`   📄 Product name auto-populated: ${hasProductName ? '✅ YES' : '❌ NO'}`);
                console.log(`   📄 HS codes in certificate: ${hasCertHSCodes ? '✅ YES' : '❌ NO'}`);
                
                await page.screenshot({ 
                    path: path.join(screenshotsDir, 'focused_07_certificate_autopop.png'), 
                    fullPage: true 
                });
                
                const certScore = (hasCompanyName ? 1 : 0) + (hasAddress ? 1 : 0) + (hasProductName ? 1 : 0) + (hasCertHSCodes ? 1 : 0);
                console.log(`   🎯 Certificate Auto-Population Score: ${certScore}/4 ${certScore >= 3 ? '✅' : '❌'}`);
                
            } catch (e) {
                console.log(`   ❌ Certificate navigation failed: ${e.message}`);
            }
        } else {
            console.log('   ❌ No certificate buttons found');
        }
        
        // FINAL ASSESSMENT
        console.log('\n🏁 FINAL ASSESSMENT - Data Auto-Population Fixes');
        console.log('=' * 60);
        
        const totalScore = hsClassificationScore + savingsScore + manufacturingScore;
        const maxScore = 9;
        const successRate = Math.round((totalScore / maxScore) * 100);
        
        console.log(`📊 Overall Fix Success Rate: ${successRate}% (${totalScore}/${maxScore})`);
        console.log('');
        console.log('🎯 SPECIFIC FIX STATUS:');
        console.log(`   1. HS Classification Fix: ${hsClassificationScore >= 2 ? '✅ WORKING' : '❌ NEEDS WORK'}`);
        console.log(`   2. Savings Analysis Fix: ${savingsScore >= 2 ? '✅ WORKING' : '❌ NEEDS WORK'}`);
        console.log(`   3. Manufacturing Location Fix: ${manufacturingScore >= 2 ? '✅ WORKING' : '❌ NEEDS WORK'}`);
        console.log(`   4. Certificate Auto-Population: Tested separately above`);
        console.log('');
        console.log('📸 EVIDENCE SCREENSHOTS CAPTURED:');
        console.log('   • focused_01_workflow_loaded.png');
        console.log('   • focused_02_company_filled.png');
        console.log('   • focused_03_product_step.png');
        console.log('   • focused_04_components_filled.png');
        console.log('   • focused_05_results_page.png');
        console.log('   • focused_06_hs_classification_focus.png');
        console.log('   • focused_07_certificate_autopop.png');
        console.log('');
        
        if (successRate >= 70) {
            console.log('🎉 OVERALL ASSESSMENT: Data auto-population fixes are working well!');
        } else if (successRate >= 50) {
            console.log('⚠️  OVERALL ASSESSMENT: Some fixes working, others need attention');
        } else {
            console.log('❌ OVERALL ASSESSMENT: Multiple fixes need immediate attention');
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'focused_error.png'), 
            fullPage: true 
        });
    } finally {
        await browser.close();
        console.log('\n✅ Focused data auto-population test completed!');
    }
}

// Run the test
focusedDataAutoPopulationTest().catch(console.error);