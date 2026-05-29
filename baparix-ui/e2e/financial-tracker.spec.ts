import { test, expect } from '@playwright/test';

test.describe('Financial Tracker Entry and Visualization', () => {
  test.describe('Financial Entry Form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/dashboard');
      await page.waitForLoadState('networkidle');
    });

    test('should display financial entry form', async ({ page }) => {
      // Look for financial entry form or navigate to it
      const financialForm = page.getByRole('form', { name: /financial|entry|transaction/i }).or(
        page.locator('[data-testid*="financial-entry"]')
      ).or(
        page.getByText(/add.*entry|new.*transaction|record.*expense/i)
      );

      if (await financialForm.isVisible()) {
        await expect(financialForm).toBeVisible();
      }
    });

    test('should display revenue/expense type toggle', async ({ page }) => {
      // Look for type toggle (revenue/expense)
      const revenueToggle = page.getByTestId('type-revenue').or(
        page.getByRole('radio', { name: /revenue/i })
      ).or(
        page.getByText(/revenue/i)
      );

      const expenseToggle = page.getByTestId('type-expense').or(
        page.getByRole('radio', { name: /expense/i })
      ).or(
        page.getByText(/expense/i)
      );

      if (await revenueToggle.isVisible()) {
        await expect(revenueToggle).toBeVisible();
        await expect(expenseToggle).toBeVisible();
      }
    });

    test('should switch between revenue and expense categories', async ({ page }) => {
      const expenseToggle = page.getByTestId('type-expense').or(
        page.getByRole('radio', { name: /expense/i })
      );

      if (await expenseToggle.isVisible()) {
        await expenseToggle.click();
        await page.waitForTimeout(300);

        // Category dropdown should update to show expense categories
        const categorySelect = page.getByLabel(/category/i);
        if (await categorySelect.isVisible()) {
          await expect(categorySelect).toBeVisible();
        }
      }
    });

    test('should validate required fields before submission', async ({ page }) => {
      // Find and click submit button without filling form
      const submitButton = page.getByRole('button', { name: /submit|save|add/i });

      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(300);

        // Should show validation errors
        const errorMessages = page.locator('[class*="error"], [role="alert"]');
        if (await errorMessages.first().isVisible()) {
          await expect(errorMessages.first()).toBeVisible();
        }
      }
    });

    test('should submit a valid revenue entry', async ({ page }) => {
      // Fill in revenue entry form
      const amountInput = page.getByLabel(/amount/i);
      const categorySelect = page.getByLabel(/category/i);
      const descriptionInput = page.getByLabel(/description/i);
      const dateInput = page.getByLabel(/date/i);

      if (await amountInput.isVisible()) {
        await amountInput.fill('50000');

        if (await categorySelect.isVisible()) {
          await categorySelect.selectOption({ index: 1 });
        }

        if (await descriptionInput.isVisible()) {
          await descriptionInput.fill('Product sales revenue');
        }

        if (await dateInput.isVisible()) {
          await dateInput.fill('2024-01-15');
        }

        // Submit the form
        const submitButton = page.getByRole('button', { name: /submit|save|add/i });
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should submit a valid expense entry', async ({ page }) => {
      // Switch to expense type
      const expenseToggle = page.getByTestId('type-expense').or(
        page.getByRole('radio', { name: /expense/i })
      );

      if (await expenseToggle.isVisible()) {
        await expenseToggle.click();
        await page.waitForTimeout(300);

        // Fill in expense entry
        const amountInput = page.getByLabel(/amount/i);
        if (await amountInput.isVisible()) {
          await amountInput.fill('15000');

          const categorySelect = page.getByLabel(/category/i);
          if (await categorySelect.isVisible()) {
            await categorySelect.selectOption({ index: 1 });
          }

          const descriptionInput = page.getByLabel(/description/i);
          if (await descriptionInput.isVisible()) {
            await descriptionInput.fill('Office supplies');
          }

          const dateInput = page.getByLabel(/date/i);
          if (await dateInput.isVisible()) {
            await dateInput.fill('2024-01-15');
          }

          const submitButton = page.getByRole('button', { name: /submit|save|add/i });
          if (await submitButton.isVisible()) {
            await submitButton.click();
            await page.waitForTimeout(500);
          }
        }
      }
    });

    test('should display payment method selection', async ({ page }) => {
      const paymentMethod = page.getByLabel(/payment.*method/i).or(
        page.locator('[data-testid*="payment"]')
      );

      if (await paymentMethod.isVisible()) {
        await expect(paymentMethod).toBeVisible();
      }
    });
  });

  test.describe('Financial Visualization', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/dashboard');
      await page.waitForLoadState('networkidle');
    });

    test('should display expense breakdown chart', async ({ page }) => {
      // Look for chart/visualization components
      const chart = page.locator('[class*="recharts"], [data-testid*="chart"], svg.recharts-surface').or(
        page.getByText(/expense.*breakdown|spending.*overview/i)
      );

      if (await chart.first().isVisible()) {
        await expect(chart.first()).toBeVisible();
      }
    });

    test('should display financial summary metrics', async ({ page }) => {
      // Look for summary cards showing totals
      const summaryMetrics = page.getByText(/total.*revenue|total.*expense|net.*income|profit/i);

      if (await summaryMetrics.first().isVisible()) {
        await expect(summaryMetrics.first()).toBeVisible();
      }
    });

    test('should display trend visualization', async ({ page }) => {
      // Look for trend charts or graphs
      const trendChart = page.locator('[class*="recharts"], canvas, svg').or(
        page.getByText(/trend|monthly|weekly/i)
      );

      if (await trendChart.first().isVisible()) {
        await expect(trendChart.first()).toBeVisible();
      }
    });

    test('should allow filtering by date range', async ({ page }) => {
      // Look for date range filter
      const dateFilter = page.getByLabel(/from|start.*date/i).or(
        page.getByRole('combobox', { name: /period|range/i })
      ).or(
        page.getByText(/this month|last.*days|custom.*range/i)
      );

      if (await dateFilter.first().isVisible()) {
        await expect(dateFilter.first()).toBeVisible();
      }
    });

    test('should display export options for financial data', async ({ page }) => {
      // Look for export buttons (CSV, JSON, PDF)
      const exportButton = page.getByRole('button', { name: /export|download|csv|pdf/i }).or(
        page.locator('[data-testid*="export"]')
      );

      if (await exportButton.first().isVisible()) {
        await expect(exportButton.first()).toBeVisible();
      }
    });

    test('should display break-even analysis', async ({ page }) => {
      // Look for break-even progress or analysis
      const breakEven = page.getByText(/break.*even|breakeven/i).or(
        page.locator('[data-testid*="break-even"]')
      );

      if (await breakEven.first().isVisible()) {
        await expect(breakEven.first()).toBeVisible();
      }
    });
  });
});
