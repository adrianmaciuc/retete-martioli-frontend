# Playwright E2E Testing Setup Guide

Complete step-by-step guide to setup and run Playwright E2E tests for the Retete Martioli App

---

## 📋 Overview

This guide walks you through:

- Installing Playwright testing framework
- Configuring tests to use fallback (sample) data
- Setting up test directory structure

---

## ✅ Prerequisites

Before starting, ensure:

- [ ] Node.js 18.x or higher installed
- [ ] npm or yarn installed
- [ ] Project repository cloned
- [ ] `npm install` completed in project root

---

## Part 1: Install Playwright

### Step 1.1: Install Dependencies

Open terminal in project root and run:

```bash
npm init playwright@latest
```

This installs:

- Playwright test runner
- Browser binaries

---

### Step 1.2: Install Browsers

Run:

```bash
npx playwright install
```

This downloads browsers for:

- Chromium
- Firefox
- WebKit (Safari)

**Note**: First time takes 2-3 minutes, downloads ~200MB

---

### Step 1.3: Create Test Directory Structure

Create the following folder structure:

```
project-root/
├── playwright/
│   ├── tests/
│   │   ├── homePage.spec.ts
│   │   ├── smoke.spec.ts
│   │   ├── search.spec.ts
│   │   └── navigation.spec.ts
│   └── playwright.config.ts
```

---

## Part 2: Configure Playwright

### Step 2.1: Update playwright.config.ts

Update file: `playwright/playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: "http://localhost:8080",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "retain-on-first-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    /* Test against mobile viewports. */

    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "cd .. && npm run dev",
    url: "http://localhost",
    reuseExistingServer: !process.env.CI,
    wait: { stdout: /ready in.*ms/i },
    timeout: 30 * 1000,
  },
});
```

---

### Step 2.2: Update .gitignore

Add Playwright artifacts to `.gitignore`:

```
# Playwright
test-results/
playwright-report/
playwright/.auth/
```

---

## Part 3: Best Practices

### ✅ DO

- Use `data-testid` attributes in components for reliable selectors
- Wait for navigation with `page.waitForURL()`
- Use meaningful test names
- Group related tests with `test.describe()`
- Use `test.beforeEach()` for common setup
- Keep tests independent (no test depends on another)
- Test user behavior, not implementation
