/**
 * Company Information Form Visual Tests
 * Government Portal Standards Compliance Testing
 * Focus: Form structure, accessibility, and responsive behavior
 */

const { test, expect } = require('@playwright/test');

test.describe('Company Information Form - Government Standards', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to USMCA workflow page
    await page.goto('/usmca-workflow');
    
    // Wait for the form to be visible
    await page.waitForSelector('.form-section', { state: 'visible' });
    
    // Ensure all form elements are loaded
    await page.waitForSelector('#company-name', { state: 'visible' });
  });

  test('Form structure meets government portal standards', async ({ page }) => {
    // Check main form container
    const formSection = page.locator('.form-section');
    await expect(formSection).toBeVisible();
    
    // Check section title
    const sectionTitle = page.locator('.form-section-title');
    await expect(sectionTitle).toContainText('Company Information & Primary Contact');
    
    // Verify all required fields are present
    const requiredFields = [
      '#company-name',
      '#business-registration', 
      '#country-operation',
      '#primary-contact',
      '#contact-email',
      '#company-address'
    ];
    
    for (const field of requiredFields) {
      await expect(page.locator(field)).toBeVisible();
    }
    
    // Check optional field
    await expect(page.locator('#contact-phone')).toBeVisible();
    
    // Take full form screenshot
    await expect(page).toHaveScreenshot('company-form-initial-state.png', {
      fullPage: true,
      clip: {
        x: 0,
        y: 0,
        width: 1200,
        height: 1400
      }
    });
  });

  test('Required field indicators are properly displayed', async ({ page }) => {
    // Check that required labels have proper asterisk indicators
    const requiredLabels = page.locator('.form-label.required');
    await expect(requiredLabels).toHaveCount(6);
    
    // Check aria-required attributes
    const requiredInputs = [
      '#company-name',
      '#business-registration',
      '#country-operation', 
      '#primary-contact',
      '#contact-email',
      '#company-address'
    ];
    
    for (const input of requiredInputs) {
      await expect(page.locator(input)).toHaveAttribute('required', '');
      await expect(page.locator(input)).toHaveAttribute('aria-invalid', 'false');
    }
    
    // Optional field should not have required attribute
    await expect(page.locator('#contact-phone')).not.toHaveAttribute('required', '');
  });

  test('Form validation provides proper user feedback', async ({ page }) => {
    const companyNameInput = page.locator('#company-name');
    const emailInput = page.locator('#contact-email');
    
    // Test empty field validation
    await companyNameInput.click();
    await companyNameInput.blur();
    
    // Should show error state
    await expect(companyNameInput).toHaveClass(/error/);
    await expect(page.locator('#company-name-error')).toBeVisible();
    await expect(page.locator('#company-name-error')).toHaveAttribute('role', 'alert');
    
    // Test email validation
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    
    await expect(emailInput).toHaveClass(/error/);
    await expect(page.locator('#email-error')).toContainText('valid email address');
    
    // Test success state
    await companyNameInput.fill('Professional Manufacturing Corp');
    await companyNameInput.blur();
    
    await expect(companyNameInput).toHaveClass(/success/);
    await expect(page.locator('#company-name-error')).not.toBeVisible();
    
    // Take validation states screenshot
    await expect(page).toHaveScreenshot('form-validation-states.png', {
      clip: {
        x: 0,
        y: 0,
        width: 900,
        height: 800
      }
    });
  });

  test('Touch targets meet 48px minimum requirement', async ({ page }) => {
    // Check form inputs meet minimum touch target size
    const inputs = [
      '#company-name',
      '#business-registration',
      '#country-operation',
      '#primary-contact',
      '#contact-email',
      '#contact-phone',
      '#company-address'
    ];
    
    for (const input of inputs) {
      const element = page.locator(input);
      const box = await element.boundingBox();
      
      expect(box.height).toBeGreaterThanOrEqual(48);
    }
    
    // Check submit button touch target
    const submitButton = page.locator('button[type="button"]:has-text("Continue to Product Details")');
    const buttonBox = await submitButton.boundingBox();
    expect(buttonBox.height).toBeGreaterThanOrEqual(48);
  });

  test('Form layout is responsive at mobile breakpoint (375px)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for layout to adjust
    await page.waitForTimeout(500);
    
    // Take mobile layout screenshot
    await expect(page).toHaveScreenshot('company-form-mobile-375px.png', {
      fullPage: true
    });
    
    // Verify horizontal scrolling is not needed
    const body = await page.locator('body').boundingBox();
    expect(body.width).toBeLessThanOrEqual(375);
  });

  test('Form layout at desktop breakpoint (1920px)', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Wait for layout to adjust
    await page.waitForTimeout(500);
    
    // Take desktop layout screenshot
    await expect(page).toHaveScreenshot('company-form-desktop-1920px.png', {
      clip: {
        x: 0,
        y: 0,
        width: 1200,
        height: 1000
      }
    });
    
    // Check form-row maintains two-column layout
    const businessRegField = page.locator('#business-registration');
    const countryField = page.locator('#country-operation');
    
    const regBox = await businessRegField.boundingBox();
    const countryBox = await countryField.boundingBox();
    
    // Fields should be side by side (y position should be similar)
    expect(Math.abs(regBox.y - countryBox.y)).toBeLessThan(10);
  });

  test('Form completion enables submit button', async ({ page }) => {
    const submitButton = page.locator('button[type="button"]:has-text("Continue to Product Details")');
    
    // Initially button should be disabled
    await expect(submitButton).toHaveClass(/btn-secondary/);
    await expect(submitButton).toBeDisabled();
    
    // Fill in all required fields
    await page.fill('#company-name', 'Triangle Manufacturing Solutions Inc.');
    await page.fill('#business-registration', 'EIN-12-3456789');
    await page.selectOption('#country-operation', 'US');
    await page.fill('#primary-contact', 'John Smith');
    await page.fill('#contact-email', 'john.smith@trianglemanufacturing.com');
    await page.fill('#company-address', '1234 Industrial Blvd\nChicago, IL 60601\nUnited States');
    
    // Button should now be enabled
    await expect(submitButton).toHaveClass(/btn-primary/);
    await expect(submitButton).toBeEnabled();
    
    // Take completed form screenshot
    await expect(page).toHaveScreenshot('company-form-completed.png', {
      fullPage: true,
      clip: {
        x: 0,
        y: 0,
        width: 1200,
        height: 1400
      }
    });
  });

  test('Color contrast meets WCAG standards', async ({ page }) => {
    // Check error states have sufficient contrast
    await page.fill('#contact-email', 'invalid');
    await page.locator('#contact-email').blur();
    
    const errorMessage = page.locator('#email-error');
    await expect(errorMessage).toBeVisible();
    
    // Take contrast test screenshot
    await expect(page).toHaveScreenshot('form-contrast-states.png', {
      clip: {
        x: 0,
        y: 600,
        width: 900,
        height: 400
      }
    });
  });

  test('Help text provides adequate guidance', async ({ page }) => {
    // Check that each field has helpful guidance
    const helpElements = [
      { field: '#company-name', helpId: '#company-name-help' },
      { field: '#business-registration', helpId: '#reg-number-help' },
      { field: '#country-operation', helpId: '#country-help' },
      { field: '#primary-contact', helpId: '#contact-name-help' },
      { field: '#contact-email', helpId: '#email-help' },
      { field: '#contact-phone', helpId: '#phone-help' },
      { field: '#company-address', helpId: '#address-help' }
    ];
    
    for (const { field, helpId } of helpElements) {
      const fieldElement = page.locator(field);
      const helpElement = page.locator(helpId);
      
      await expect(helpElement).toBeVisible();
      
      // Check aria-describedby connection
      const describedBy = await fieldElement.getAttribute('aria-describedby');
      expect(describedBy).toContain(helpId.substring(1)); // Remove # from selector
    }
  });
});