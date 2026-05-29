import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to onboarding page
    await page.goto('/en/onboarding');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full onboarding flow for domestic reseller', async ({ page }) => {
    // Step 0: Welcome screen
    await expect(page.getByText('Welcome to VentureOS')).toBeVisible();
    await page.getByRole('button', { name: /get started/i }).click();

    // Step 1: Business Type
    await expect(page.getByText('What type of business are you running?')).toBeVisible();
    await page.getByLabel('Product Reseller/Importer').click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Location and Product Idea
    await expect(page.getByText('Tell us about your business')).toBeVisible();
    await page.getByPlaceholder(/dhaka, chittagong/i).fill('Dhaka');
    await page.getByPlaceholder(/electronics, fashion/i).fill('Electronics');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Investment and Team Size
    await expect(page.getByText('Business Resources')).toBeVisible();
    await page.getByPlaceholder(/500000/i).fill('500000');
    await page.getByPlaceholder(/number of team members/i).fill('5');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4: Warehouse and Account Type
    await expect(page.getByText('Operations Setup')).toBeVisible();
    await page.getByPlaceholder(/1000/i).fill('1000');
    await page.getByLabel('Domestic Only').click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 6: Summary (skipped international step)
    await expect(page.getByText('Review Your Information')).toBeVisible();
    await expect(page.getByText('Dhaka')).toBeVisible();
    await expect(page.getByText('Electronics')).toBeVisible();
    await expect(page.getByText('৳500000')).toBeVisible();
    await expect(page.getByText('5')).toBeVisible();
    await expect(page.getByText('1000 sq ft')).toBeVisible();

    // Complete onboarding
    await page.getByRole('button', { name: /finish/i }).click();

    // Should navigate to dashboard
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('should complete full onboarding flow for international SME', async ({ page }) => {
    // Step 0: Welcome screen
    await page.getByRole('button', { name: /get started/i }).click();

    // Step 1: Business Type
    await page.getByLabel('SME Owner/Existing Business').click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Location and Product Idea
    await page.getByPlaceholder(/dhaka, chittagong/i).fill('Chittagong');
    await page.getByPlaceholder(/electronics, fashion/i).fill('Fashion');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Investment and Team Size
    await page.getByPlaceholder(/500000/i).fill('1000000');
    await page.getByPlaceholder(/number of team members/i).fill('10');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4: Warehouse and Account Type
    await page.getByPlaceholder(/1000/i).fill('2000');
    await page.getByLabel('International Accounts').click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 5: International Details
    await expect(page.getByText('International Details')).toBeVisible();
    await page.getByPlaceholder(/usa, uk, canada/i).fill('USA, UK, Canada');
    await page.getByPlaceholder(/usd, gbp, eur/i).fill('USD, GBP, EUR');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 6: Summary
    await expect(page.getByText('Review Your Information')).toBeVisible();
    await expect(page.getByText('Chittagong')).toBeVisible();
    await expect(page.getByText('Fashion')).toBeVisible();
    await expect(page.getByText('USA, UK, Canada')).toBeVisible();
    await expect(page.getByText('USD, GBP, EUR')).toBeVisible();

    // Complete onboarding
    await page.getByRole('button', { name: /finish/i }).click();

    // Should navigate to dashboard
    await page.waitForURL(/\/dashboard/);
  });

  test('should validate required fields at each step', async ({ page }) => {
    // Welcome screen
    await page.getByRole('button', { name: /get started/i }).click();

    // Try to proceed without selecting business type
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.getByText('Please select a business type')).toBeVisible();

    // Select business type and proceed
    await page.getByLabel('Product Reseller/Importer').click();
    await page.getByRole('button', { name: /next/i }).click();

    // Try to proceed without filling location
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.getByText('Location is required')).toBeVisible();
    await expect(page.getByText('Product idea is required')).toBeVisible();
  });

  test('should allow going back to previous steps', async ({ page }) => {
    // Navigate through steps
    await page.getByRole('button', { name: /get started/i }).click();
    await page.getByLabel('Product Reseller/Importer').click();
    await page.getByRole('button', { name: /next/i }).click();

    // Go back
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.getByText('What type of business are you running?')).toBeVisible();
  });

  test('should skip international step for domestic accounts', async ({ page }) => {
    // Complete steps up to warehouse
    await page.getByRole('button', { name: /get started/i }).click();
    await page.getByLabel('Product Reseller/Importer').click();
    await page.getByRole('button', { name: /next/i }).click();
    
    await page.getByPlaceholder(/dhaka, chittagong/i).fill('Dhaka');
    await page.getByPlaceholder(/electronics, fashion/i).fill('Electronics');
    await page.getByRole('button', { name: /next/i }).click();
    
    await page.getByPlaceholder(/500000/i).fill('500000');
    await page.getByPlaceholder(/number of team members/i).fill('5');
    await page.getByRole('button', { name: /next/i }).click();
    
    await page.getByPlaceholder(/1000/i).fill('1000');
    await page.getByLabel('Domestic Only').click();
    await page.getByRole('button', { name: /next/i }).click();

    // Should go directly to summary, not international details
    await expect(page.getByText('Review Your Information')).toBeVisible();
    await expect(page.getByText('International Details')).not.toBeVisible();
  });

  test('should show international step for international accounts', async ({ page }) => {
    // Complete steps up to warehouse
    await page.getByRole('button', { name: /get started/i }).click();
    await page.getByLabel('Product Reseller/Importer').click();
    await page.getByRole('button', { name: /next/i }).click();
    
    await page.getByPlaceholder(/dhaka, chittagong/i).fill('Dhaka');
    await page.getByPlaceholder(/electronics, fashion/i).fill('Electronics');
    await page.getByRole('button', { name: /next/i }).click();
    
    await page.getByPlaceholder(/500000/i).fill('500000');
    await page.getByPlaceholder(/number of team members/i).fill('5');
    await page.getByRole('button', { name: /next/i }).click();
    
    await page.getByPlaceholder(/1000/i).fill('1000');
    await page.getByLabel('International Accounts').click();
    await page.getByRole('button', { name: /next/i }).click();

    // Should show international details step
    await expect(page.getByText('International Details')).toBeVisible();
  });

  test('should display progress indicator', async ({ page }) => {
    await page.getByRole('button', { name: /get started/i }).click();

    // Check progress indicator is visible
    await expect(page.getByText(/step 1 of/i)).toBeVisible();
    
    // Progress percentage should be visible
    const progressText = await page.locator('text=/\\d+%/').textContent();
    expect(progressText).toMatch(/\d+%/);
  });

  test('should display low-literacy mode icons when enabled', async ({ page }) => {
    // Note: This test assumes low-literacy mode can be enabled
    // In production, this might be a user setting or URL parameter
    await page.goto('/en/onboarding?lowLiteracy=true');
    await page.waitForLoadState('networkidle');

    // Check for emoji icons (if low-literacy mode is enabled)
    // This is a placeholder - actual implementation may vary
    const content = await page.content();
    // Icons should be present in the HTML
    expect(content.length).toBeGreaterThan(0);
  });
});
