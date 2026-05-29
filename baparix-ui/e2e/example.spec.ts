import { test, expect } from '@playwright/test'

test.describe('VentureOS UI - Basic Navigation', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check that the page loaded successfully
    expect(page.url()).toContain('localhost:3000')
  })

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/')
    
    // Check for title
    await expect(page).toHaveTitle(/VentureOS/i)
  })
})
