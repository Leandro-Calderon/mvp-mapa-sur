# CI/CD Configuration for MVP Mapa Sur

## Overview
This document describes the recommended CI/CD setup for the project using GitHub Actions.

## Why .github is in .gitignore
Currently, `.github` is listed in `.gitignore`. This is typically done to prevent workflow files from being committed, but for CI/CD to work, we need these files in version control.

## Recommendation
**Remove `.github` from `.gitignore`** to enable CI/CD workflows.

## Workflows

### 1. Main CI Workflow (`ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    name: Test & Lint
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linter
        run: pnpm lint

      - name: Run tests
        run: pnpm test

      - name: Run tests with coverage
        run: pnpm test:coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
          retention-days: 7
```

### 2. Deploy Workflow (`deploy.yml`)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy to GitHub Pages
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      pages: write
      id-token: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 3. Dependency Update Workflow (`dependency-update.yml`)

```yaml
name: Dependency Update

on:
  schedule:
    # Run weekly on Mondays at 9 AM
    - cron: '0 9 * * 1'
  workflow_dispatch: # Allow manual trigger

jobs:
  update:
    name: Update Dependencies
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Update dependencies
        run: |
          pnpm update --latest
          pnpm install

      - name: Run tests
        run: pnpm test

      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          commit-message: 'chore: update dependencies'
          title: 'chore: weekly dependency update'
          body: |
            Automated dependency update
            
            - Updates all dependencies to their latest versions
            - Tests have been run and passed
          branch: dependency-update
          delete-branch: true
```

### 4. Code Quality Check (`code-quality.yml`)

```yaml
name: Code Quality

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality-check:
    name: Code Quality Checks
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Needed for proper comparison

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Check TypeScript
        run: pnpm exec tsc --noEmit

      - name: Run linter with report
        run: pnpm lint --format json --output-file eslint-report.json || true

      - name: Run tests with coverage
        run: pnpm test:coverage

      - name: Comment PR with results
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            
            // Read lint results
            let lintResults = '';
            try {
              const lintData = JSON.parse(fs.readFileSync('eslint-report.json', 'utf8'));
              const errorCount = lintData.reduce((sum, file) => sum + file.errorCount, 0);
              const warningCount = lintData.reduce((sum, file) => sum + file.warningCount, 0);
              lintResults = `✅ Linting: ${errorCount} errors, ${warningCount} warnings`;
            } catch (e) {
              lintResults = '❌ Failed to read lint results';
            }

            const comment = `## Code Quality Report
            
            ${lintResults}
            
            See the Actions tab for detailed test coverage.
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

## Setup Instructions

### Step 1: Enable CI/CD
1. Remove `.github` from `.gitignore`
2. Create `.github/workflows` directory
3. Add the workflow files above

### Step 2: Configure Repository Settings
1. Go to repository Settings → Actions → General
2. Enable "Read and write permissions" for workflows
3. Enable "Allow GitHub Actions to create and approve pull requests"

### Step 3: Optional - Enable GitHub Pages
1. Go to Settings → Pages
2. Select "GitHub Actions" as the source
3. Save

### Step 4: Optional - Add Codecov
1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. Copy the upload token (optional for public repos)
4. Add as `CODECOV_TOKEN` secret in repository settings if needed

## Benefits

### ✅ Automated Testing
- Every push and PR runs full test suite
- Prevents broken code from being merged
- Ensures code quality standards

### ✅ Automated Deployment
- Main branch automatically deploys to GitHub Pages
- No manual deployment steps needed
- Fast feedback loop

### ✅ Dependency Management
- Weekly automated dependency updates
- Tests run on updated dependencies
- Reduces security vulnerabilities

### ✅ Code Quality Monitoring
- Enforces linting rules
- TypeScript type checking
- Coverage reports on every PR

## Current Status

🔴 **Not Enabled** - `.github` is in `.gitignore`

To enable:
```bash
# Remove .github from .gitignore
# Then create the workflows
mkdir -p .github/workflows
# Add the workflow files
```

## Commands Reference

```bash
# Run tests locally like CI does
pnpm test

# Run linter like CI does
pnpm lint

# Build like CI does
pnpm build

# Run coverage report like CI does
pnpm test:coverage
```
