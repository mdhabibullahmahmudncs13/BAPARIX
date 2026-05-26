# Testing Guide for VentureOS UI

This document provides an overview of the testing infrastructure and guidelines for writing tests in the VentureOS UI project.

## Testing Stack

### Unit & Integration Tests
- **Jest**: JavaScript testing framework
- **React Testing Library**: Testing utilities for React components
- **@testing-library/jest-dom**: Custom Jest matchers for DOM assertions
- **@testing-library/user-event**: User interaction simulation

### End-to-End Tests
- **Playwright**: Browser automation and E2E testing
- Configured for Chromium (desktop and mobile viewports)

## Running Tests

### Unit and Integration Tests

```bash
# Run tests in watch mode (development)
npm test

# Run tests once with coverage
npm run test:coverage

# Run tests in CI mode (no watch, with coverage)
npm run test:ci
```

### End-to-End Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI mode (interactive)
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug
```

## Test File Organization

### Unit Tests
- Place test files next to the code they test
- Use `.test.ts` or `.test.tsx` extension
- Example: `Button.tsx` → `Button.test.tsx`

```
components/
  ui/
    Button.tsx
    Button.test.tsx
lib/
  utils/
    formatCurrency.ts
    formatCurrency.test.ts
```

### E2E Tests
- Place E2E tests in the `e2e/` directory
- Use `.spec.ts` extension
- Example: `e2e/authentication.spec.ts`

```
e2e/
  authentication.spec.ts
  onboarding.spec.ts
  product-search.spec.ts
```

## Writing Tests

### Unit Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button Component', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should allow user to login', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[name="email"]', 'user@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
  })
})
```

## Testing Guidelines

### General Principles
1. **Test behavior, not implementation**: Focus on what the component does, not how it does it
2. **Write descriptive test names**: Use clear, specific descriptions of what is being tested
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests isolated**: Each test should be independent and not rely on others
5. **Test accessibility**: Include tests for keyboard navigation, ARIA attributes, and screen reader support

### Component Testing
1. Test rendering with different props
2. Test user interactions (clicks, typing, etc.)
3. Test conditional rendering
4. Test error states and edge cases
5. Test accessibility features

### Utility Function Testing
1. Test with valid inputs
2. Test with edge cases (empty, null, undefined)
3. Test with invalid inputs
4. Test error handling

### E2E Testing
1. Test critical user journeys
2. Test across different viewports (mobile and desktop)
3. Test authentication flows
4. Test data persistence
5. Test error scenarios

## Coverage Requirements

Current coverage thresholds:
- **Statements**: 50%
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%

Coverage is collected from:
- `components/**/*.{js,jsx,ts,tsx}`
- `lib/**/*.{js,jsx,ts,tsx}`

Excluded from coverage:
- Test files (`*.test.*`, `*.spec.*`)
- Type definitions (`*.d.ts`)
- Configuration files
- Build artifacts (`.next/`, `node_modules/`)

## Continuous Integration

Tests run automatically in CI with the following command:
```bash
npm run test:ci
```

This command:
- Runs all unit and integration tests
- Generates coverage reports
- Fails if coverage thresholds are not met
- Does not watch for changes (runs once)

## Best Practices

### Do's ✅
- Write tests for all new components and utilities
- Test user-facing behavior
- Use semantic queries (`getByRole`, `getByLabelText`)
- Test accessibility features
- Keep tests simple and focused
- Mock external dependencies (APIs, third-party libraries)

### Don'ts ❌
- Don't test implementation details
- Don't use `getByTestId` unless necessary
- Don't write tests that depend on other tests
- Don't skip error cases
- Don't test third-party library code

## Debugging Tests

### Jest Tests
```bash
# Run specific test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"

# Run with verbose output
npm test -- --verbose
```

### Playwright Tests
```bash
# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific test file
npm run test:e2e -- authentication.spec.ts

# Debug mode with inspector
npm run test:e2e:debug
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
