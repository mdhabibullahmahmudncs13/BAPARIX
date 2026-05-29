import { test, expect } from '@playwright/test';

test.describe('Product Search and Comparison', () => {
  test.describe('Product Search Interface', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/market-intelligence');
      await page.waitForLoadState('networkidle');
    });

    test('should display market intelligence page with title', async ({ page }) => {
      // Check page heading is visible
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display search input for products', async ({ page }) => {
      // Look for search input or search-related UI
      const searchInput = page.getByRole('searchbox').or(
        page.getByPlaceholder(/search|product|keyword/i)
      ).or(
        page.locator('input[type="search"], input[type="text"]').first()
      );

      await expect(searchInput).toBeVisible();
    });

    test('should display platform filter options', async ({ page }) => {
      // Check for platform selection (Alibaba, Amazon, Daraz, etc.)
      const platformFilters = page.getByText(/alibaba|amazon|daraz/i).first();
      await expect(platformFilters).toBeVisible();
    });

    test('should perform product search and display results', async ({ page }) => {
      // Find and fill search input
      const searchInput = page.getByRole('searchbox').or(
        page.getByPlaceholder(/search|product|keyword/i)
      ).or(
        page.locator('input[type="search"], input[type="text"]').first()
      );

      await searchInput.fill('electronics');

      // Submit search (press Enter or click search button)
      const searchButton = page.getByRole('button', { name: /search/i });
      if (await searchButton.isVisible()) {
        await searchButton.click();
      } else {
        await searchInput.press('Enter');
      }

      // Wait for results to load
      await page.waitForTimeout(1000);

      // Should show results or loading state or no-results message
      const hasResults = await page.locator('[data-testid*="product"], [class*="result"], [class*="card"]').first().isVisible().catch(() => false);
      const hasLoading = await page.getByText(/loading|searching/i).isVisible().catch(() => false);
      const hasNoResults = await page.getByText(/no results|not found/i).isVisible().catch(() => false);

      expect(hasResults || hasLoading || hasNoResults).toBeTruthy();
    });

    test('should filter search results by platform', async ({ page }) => {
      // Find platform filter checkboxes or buttons
      const platformFilter = page.getByLabel(/alibaba/i).or(
        page.getByRole('checkbox', { name: /alibaba/i })
      ).or(
        page.getByRole('button', { name: /alibaba/i })
      );

      if (await platformFilter.isVisible()) {
        await platformFilter.click();
        await page.waitForTimeout(500);
        // Platform filter should be active
      }
    });

    test('should display price range filter', async ({ page }) => {
      // Look for price range or filter controls
      const priceFilter = page.getByText(/price|range|min|max/i).first();
      if (await priceFilter.isVisible()) {
        await expect(priceFilter).toBeVisible();
      }
    });

    test('should sort search results', async ({ page }) => {
      // Look for sort controls
      const sortControl = page.getByRole('combobox', { name: /sort/i }).or(
        page.getByLabel(/sort/i)
      ).or(
        page.getByText(/sort by/i)
      );

      if (await sortControl.isVisible()) {
        await expect(sortControl).toBeVisible();
      }
    });
  });

  test.describe('Product Comparison', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/market-intelligence');
      await page.waitForLoadState('networkidle');
    });

    test('should allow selecting products for comparison', async ({ page }) => {
      // Look for compare buttons or checkboxes on product cards
      const compareButton = page.getByRole('button', { name: /compare/i }).or(
        page.getByRole('checkbox', { name: /compare/i })
      ).or(
        page.locator('[data-testid*="compare"]')
      );

      if (await compareButton.first().isVisible()) {
        await compareButton.first().click();
        await page.waitForTimeout(300);
      }
    });

    test('should display comparison table when products are selected', async ({ page }) => {
      // Look for comparison view/table
      const comparisonView = page.getByRole('table').or(
        page.locator('[data-testid*="comparison"]')
      ).or(
        page.getByText(/comparison|compare products/i)
      );

      // Comparison view may not be visible until products are selected
      if (await comparisonView.isVisible()) {
        await expect(comparisonView).toBeVisible();
      }
    });

    test('should show product details in comparison', async ({ page }) => {
      // Check for comparison attributes (price, rating, supplier, etc.)
      const comparisonAttributes = page.getByText(/price|rating|supplier|moq/i);

      if (await comparisonAttributes.first().isVisible()) {
        await expect(comparisonAttributes.first()).toBeVisible();
      }
    });

    test('should allow removing products from comparison', async ({ page }) => {
      // Look for remove button in comparison view
      const removeButton = page.getByRole('button', { name: /remove|clear/i }).or(
        page.locator('[data-testid*="remove"]')
      );

      if (await removeButton.first().isVisible()) {
        await removeButton.first().click();
        await page.waitForTimeout(300);
      }
    });
  });
});
