const { test, expect } = require('@playwright/test');

test.describe('USMCA Certificates Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the broker dashboard (bypasses auth)
    await page.goto('http://localhost:3001/admin/broker-dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should load broker dashboard successfully', async ({ page }) => {
    // Check that the dashboard loaded
    await expect(page.locator('h1')).toContainText("Cristina's Compliance Services");
    
    // Check that tabs are visible
    await expect(page.locator('.dashboard-tabs')).toBeVisible();
  });

  test('should navigate to USMCA Certificates tab', async ({ page }) => {
    // Click on USMCA Certificates tab
    await page.click('text=USMCA Certificates');
    
    // Wait for tab content to load
    await page.waitForTimeout(1000);
    
    // Check that certificate requests table is visible
    await expect(page.locator('.admin-table')).toBeVisible();
    
    // Check for certificate request entries
    const requestCount = await page.locator('.summary-stat .stat-number').first().textContent();
    console.log(`Found ${requestCount} certificate requests`);
  });

  test('should open certificate workflow modal', async ({ page }) => {
    // Navigate to USMCA Certificates tab
    await page.click('text=USMCA Certificates');
    await page.waitForTimeout(1000);
    
    // Click on "Generate Certificate" button for first request
    await page.click('button:has-text("📜 Generate Certificate")');
    
    // Check that workflow modal opened
    await expect(page.locator('.workflow-modal-overlay')).toBeVisible();
    await expect(page.locator('.workflow-modal-title')).toContainText('USMCA Certificate Generation Workflow');
  });

  test('should complete Stage 1: Send Form to Client', async ({ page }) => {
    // Navigate to USMCA Certificates tab and open workflow
    await page.click('text=USMCA Certificates');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("📜 Generate Certificate")');
    
    // Verify we're in Stage 1
    await expect(page.locator('.workflow-stage-title')).toContainText('Stage 1');
    
    // Check client contact information is displayed
    await expect(page.locator('.client-contact-review')).toBeVisible();
    
    // Check email draft preview is shown
    await expect(page.locator('.email-draft-preview')).toBeVisible();
    await expect(page.locator('.email-header')).toContainText('cristina@triangleintelligence.com');
    
    // Click "Send Form to Client" button
    await page.click('button:has-text("📧 Send Form to Client")');
    
    // Wait for form to be marked as sent
    await page.waitForTimeout(500);
    
    // Check that status updated to "Form Sent to Client"
    await expect(page.locator('.stat-label')).toContainText('Form Sent to Client');
  });

  test('should simulate client response and move to Stage 2', async ({ page }) => {
    // Complete Stage 1 first
    await page.click('text=USMCA Certificates');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("📜 Generate Certificate")');
    await page.click('button:has-text("📧 Send Form to Client")');
    await page.waitForTimeout(500);
    
    // Click simulate client response
    await page.click('button:has-text("📄 Simulate Client Response")');
    
    // Verify client documentation received
    await expect(page.locator('.workflow-status-success-text')).toContainText('USMCA Certificate requirements received from client');
    
    // Check that certificate data summary is displayed
    await expect(page.locator('.workflow-client-context')).toBeVisible();
    await expect(page.locator('.workflow-client-context-item')).toContainText('Electronic circuit boards');
    
    // Move to Stage 2
    await page.click('button:has-text("Next Stage →")');
    
    // Verify we're in Stage 2
    await expect(page.locator('.workflow-stage-title')).toContainText('Stage 2');
  });

  test('should complete AI analysis in Stage 2', async ({ page }) => {
    // Get to Stage 2 with client data
    await page.click('text=USMCA Certificates');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("📜 Generate Certificate")');
    await page.click('button:has-text("📧 Send Form to Client")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("📄 Simulate Client Response")');
    await page.click('button:has-text("Next Stage →")');
    
    // Run AI analysis
    await page.click('button:has-text("🤖 Run AI Analysis")');
    
    // Wait for analysis to complete
    await page.waitForTimeout(1000);
    
    // Check AI analysis results are displayed
    await expect(page.locator('.ai-results-card')).toBeVisible();
    await expect(page.locator('.ai-result-value')).toContainText('Qualifies');
    
    // Check USMCA content percentages are calculated
    await expect(page.locator('text=70%')).toBeVisible(); // Total USMCA content
  });

  test('should complete expert validation in Stage 2', async ({ page }) => {
    // Get to Stage 2 with AI analysis
    await page.click('text=USMCA Certificates');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("📜 Generate Certificate")');
    await page.click('button:has-text("📧 Send Form to Client")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("📄 Simulate Client Response")');
    await page.click('button:has-text("Next Stage →")');
    await page.click('button:has-text("🤖 Run AI Analysis")');
    await page.waitForTimeout(1000);
    
    // Cristina approves the AI analysis
    await page.click('button:has-text("✅ Approve AI Analysis")');
    
    // Check expert decision is recorded
    await expect(page.locator('.expert-review-card')).toBeVisible();
    await expect(page.locator('text=approve')).toBeVisible();
  });

  test('should generate certificate in Stage 3', async ({ page }) => {
    // Complete Stages 1 and 2
    await page.click('text=USMCA Certificates');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("📜 Generate Certificate")');
    await page.click('button:has-text("📧 Send Form to Client")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("📄 Simulate Client Response")');
    await page.click('button:has-text("Next Stage →")');
    await page.click('button:has-text("🤖 Run AI Analysis")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("✅ Approve AI Analysis")');
    
    // Move to Stage 3
    await page.click('button:has-text("Next Stage →")');
    
    // Verify we're in Stage 3
    await expect(page.locator('.workflow-stage-title')).toContainText('Stage 3');
    
    // Generate certificate
    await page.click('button:has-text("📜 Generate USMCA Certificate")');
    
    // Wait for certificate generation
    await page.waitForTimeout(2000);
    
    // Check certificate was generated successfully
    await expect(page.locator('.workflow-status-success-text')).toContainText('Official USMCA Certificate of Origin Generated');
    
    // Check download and email options are available
    await expect(page.locator('button:has-text("📥 Download PDF")')).toBeVisible();
    await expect(page.locator('button:has-text("📧 Email to Client")')).toBeVisible();
  });

  test('should complete entire workflow end-to-end', async ({ page }) => {
    // Complete full workflow
    await page.click('text=USMCA Certificates');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("📜 Generate Certificate")');
    
    // Stage 1
    await page.click('button:has-text("📧 Send Form to Client")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("📄 Simulate Client Response")');
    await page.click('button:has-text("Next Stage →")');
    
    // Stage 2
    await page.click('button:has-text("🤖 Run AI Analysis")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("✅ Approve AI Analysis")');
    await page.click('button:has-text("Next Stage →")');
    
    // Stage 3
    await page.click('button:has-text("📜 Generate USMCA Certificate")');
    await page.waitForTimeout(2000);
    
    // Complete workflow
    await page.click('button:has-text("Complete Workflow")');
    
    // Verify modal closed and we're back to certificates list
    await expect(page.locator('.workflow-modal-overlay')).not.toBeVisible();
    await expect(page.locator('.admin-table')).toBeVisible();
  });
});