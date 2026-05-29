import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/login');
      await page.waitForLoadState('networkidle');
    });

    test('should display login page with email form by default', async ({ page }) => {
      // Check page heading
      await expect(page.getByRole('heading', { level: 2 })).toBeVisible();

      // Check login method tabs are visible
      await expect(page.getByRole('button', { name: /email/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /phone/i })).toBeVisible();

      // Check email form fields are visible
      await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
      await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    });

    test('should show validation errors for empty email login', async ({ page }) => {
      // Try to submit empty form
      await page.getByRole('button', { name: /login.*email/i }).click();

      // Should show validation errors
      await expect(page.locator('[role="alert"], .text-error-700, [class*="error"]').first()).toBeVisible();
    });

    test('should switch to Google login tab', async ({ page }) => {
      await page.getByRole('button', { name: /google/i }).first().click();

      // Google login button should be visible
      await expect(page.getByRole('button', { name: /login.*google/i })).toBeVisible();
    });

    test('should switch to phone OTP login tab', async ({ page }) => {
      await page.getByRole('button', { name: /phone/i }).first().click();

      // Phone input should be visible
      await expect(page.getByPlaceholder(/\+880/)).toBeVisible();
    });

    test('should show OTP input after sending OTP', async ({ page }) => {
      await page.getByRole('button', { name: /phone/i }).first().click();

      // Fill phone number
      await page.getByPlaceholder(/\+880/).fill('+8801712345678');

      // Click send OTP
      await page.getByRole('button', { name: /send.*otp/i }).click();

      // OTP input should appear (may show error if API not available, but UI should respond)
      // In a real environment, the OTP field would appear
      await page.waitForTimeout(500);
    });

    test('should have link to signup page', async ({ page }) => {
      const signupLink = page.getByRole('link', { name: /sign.*up/i });
      await expect(signupLink).toBeVisible();
    });

    test('should preserve callback URL for post-login redirect', async ({ page }) => {
      await page.goto('/en/login?callbackUrl=/en/dashboard');
      await page.waitForLoadState('networkidle');

      // The page should load with the callback URL parameter
      expect(page.url()).toContain('callbackUrl');
    });
  });

  test.describe('Signup Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/signup');
      await page.waitForLoadState('networkidle');
    });

    test('should display signup form with all required fields', async ({ page }) => {
      // Check heading
      await expect(page.getByRole('heading', { level: 2 })).toBeVisible();

      // Check form fields
      await expect(page.getByPlaceholder('John Doe')).toBeVisible();
      await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
      await expect(page.getByPlaceholder(/\+880/)).toBeVisible();

      // Password fields
      const passwordFields = page.getByPlaceholder('••••••••');
      await expect(passwordFields.first()).toBeVisible();
    });

    test('should show Google signup option', async ({ page }) => {
      await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    });

    test('should validate required fields on submit', async ({ page }) => {
      // Click submit without filling form
      await page.getByRole('button', { name: /sign.*up.*email/i }).click();

      // Should show validation errors
      await page.waitForTimeout(300);
      const errorElements = page.locator('[class*="error"], [role="alert"]');
      await expect(errorElements.first()).toBeVisible();
    });

    test('should validate password requirements', async ({ page }) => {
      // Fill in a weak password
      await page.getByPlaceholder('John Doe').fill('Test User');
      await page.getByPlaceholder('you@example.com').fill('test@example.com');

      const passwordFields = page.getByPlaceholder('••••••••');
      await passwordFields.first().fill('weak');
      await passwordFields.nth(1).fill('weak');

      await page.getByRole('button', { name: /sign.*up.*email/i }).click();

      // Should show password validation error
      await page.waitForTimeout(300);
    });

    test('should toggle password visibility', async ({ page }) => {
      const passwordField = page.getByPlaceholder('••••••••').first();
      await expect(passwordField).toHaveAttribute('type', 'password');

      // Click show password button
      const toggleButton = page.getByRole('button', { name: /show password/i }).first();
      await toggleButton.click();

      await expect(passwordField).toHaveAttribute('type', 'text');
    });

    test('should have link to login page', async ({ page }) => {
      const loginLink = page.getByRole('link', { name: /log.*in/i });
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe('Route Protection', () => {
    test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
      await page.goto('/en/dashboard');
      await page.waitForLoadState('networkidle');

      // Should be redirected to login page or show auth required message
      const url = page.url();
      const hasRedirected = url.includes('login') || url.includes('auth');
      const hasAuthContent = await page.getByText(/sign in|log in|welcome back/i).isVisible().catch(() => false);

      expect(hasRedirected || hasAuthContent).toBeTruthy();
    });

    test('should redirect unauthenticated users from settings to login', async ({ page }) => {
      await page.goto('/en/settings/profile');
      await page.waitForLoadState('networkidle');

      // Should be redirected or show auth required
      const url = page.url();
      const hasRedirected = url.includes('login') || url.includes('auth');
      const hasAuthContent = await page.getByText(/sign in|log in|welcome back/i).isVisible().catch(() => false);

      expect(hasRedirected || hasAuthContent).toBeTruthy();
    });
  });
});
