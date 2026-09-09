# GitHub Pages Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the current V3 editor on GitHub Pages as a temporary public deployment while Vercel is rate-limited.

**Architecture:** Keep the normal Vercel/root build unchanged and make the Vite public base configurable through `VITE_BASE`. A dedicated GitHub Pages workflow builds V3 with `/flash-programi/` as the base path, uploads `v3/dist`, and deploys it with GitHub's official Pages actions.

**Tech Stack:** Vite 8, React, GitHub Actions, GitHub Pages

**Spec:** User-requested temporary GitHub Pages deployment on 2026-09-09.

## Global Constraints

- Do not change normal Vercel root-path behavior.
- GitHub Pages must work from `/flash-programi/`.
- Build, typecheck, and tests must remain green.
- Deployment must use the current `main` V3 application.

---

### Task 1: Make the Vite base path deployment-aware

**Files:**
- Modify: `v3/vite.config.ts`

**Interfaces:**
- Consumes: optional `VITE_BASE` environment variable.
- Produces: Vite `base` config, defaulting to `/`.

- [ ] **Step 1: Configure the base path**

```ts
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

- [ ] **Step 2: Verify normal build behavior**

Run from `v3`: `npm install && npm test && npm run typecheck && npm run build`

Expected: all tests, typecheck, and build pass.

- [ ] **Step 3: Verify Pages build behavior**

Run from `v3`: `VITE_BASE=/flash-programi/ npm run build`

Expected: generated asset URLs use `/flash-programi/`.

### Task 2: Add GitHub Pages deployment workflow

**Files:**
- Create: `.github/workflows/github-pages.yml`

**Interfaces:**
- Consumes: `main`, `v3/**`, `VITE_BASE=/flash-programi/`.
- Produces: GitHub Pages deployment artifact and public `github-pages` environment URL.

- [ ] **Step 1: Add the workflow**

```yaml
name: Deploy V3 to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'v3/**'
      - '.github/workflows/github-pages.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: v3
    steps:
      - name: Checkout
        uses: actions/checkout@v7
      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: '24.15.0'
          package-manager-cache: false
      - name: Install dependencies
        run: npm install
      - name: Test
        run: npm test
      - name: Typecheck
        run: npm run typecheck
      - name: Build for GitHub Pages
        run: npm run build
        env:
          VITE_BASE: /flash-programi/
      - name: Configure Pages
        uses: actions/configure-pages@v5
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: v3/dist
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Open and merge a PR after CI is green**

Expected: PR validation passes and merge triggers the Pages workflow on `main`.

- [ ] **Step 3: Verify deployment**

Expected: the Pages workflow completes successfully and the public site responds at the reported `page_url`.