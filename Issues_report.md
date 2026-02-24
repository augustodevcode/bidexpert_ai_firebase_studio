# 📊 Issues Report — CI/CD Failure Analysis

**Workflow:** CI - Pull Request Checks  
**Run:** [#315 — augustodevcode/bidexpert_ai_firebase_studio](https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions/runs/22284500890)  
**Branch:** `feat/admin-help-tooltips-20260222-2010`  
**Commit:** `8031722` — `ci: make P0 lint non-blocking on non-release branches`  
**Triggered by:** @augustodevcode (pull_request event)  
**Date/Time:** 2026-02-22T20:14:35Z  
**Generated at:** 2026-02-24T03:26:15Z  

---

## 🔴 Executive Summary

Run #315 failed with **4 of 6 jobs failing**. The root causes are:

| # | Category | Severity | Status |
|---|----------|----------|--------|
| 1 | ESLint — 5006 code-style violations | 🔴 High | Must fix |
| 2 | Missing `test:unit` npm script | 🟠 Medium | Fixed (see §3) |
| 3 | npm audit — 42 vulnerabilities (1 critical in `next`) | 🔴 High | Must fix |
| 4 | Quality Gate cascading failure | ⚪ Cascading | Resolved when #1 and #3 are fixed |

---

## 📋 Jobs Summary

| Job | Result | Duration | Notes |
|-----|--------|----------|-------|
| 🗃️ Schema Validation | ✅ success | ~1 min | MySQL + PostgreSQL schemas valid |
| 🔍 Type Check & Lint | ❌ failure | ~1.5 min | Lint step failed (5006 problems) |
| 🏗️ Build Test | ✅ success | ~3 min | Production build passed |
| 🧪 Unit Tests | ❌ failure | ~1 s | Missing `test:unit` npm script |
| 🔒 Security Audit | ❌ failure | ~20 s | 42 vulnerabilities (1 critical) |
| ✅ Quality Gate | ❌ failure | ~3 s | Cascading from failed jobs |

---

## 🔍 Job Detail Analysis

### 1. 🔍 Type Check & Lint — FAILED

**Job ID:** [64460381013](https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions/runs/22284500890/job/64460381013)

**Step that failed:** 🧹 Lint (`npm run lint`)

**Error count:** 5006 problems (3129 errors, 1877 warnings)

#### Most impacted files:

| File | Dominant Error Type | Count |
|------|---------------------|-------|
| `src/services/auction.service.ts` | `@typescript-eslint/no-explicit-any` | 30+ |
| `src/services/seller.service.ts` | `@typescript-eslint/no-explicit-any`, `no-unused-vars` | 20+ |
| `src/services/lotting.service.ts` | `@typescript-eslint/no-explicit-any` | 10+ |
| `src/services/shadow-ban.service.ts` | `@typescript-eslint/no-unused-vars` | 5 |
| `src/services/state.service.ts` | Various | Multiple |
| `temp_check.js`, `temp_check_db.js` | Parsing errors, `no-require-imports` | Multiple |
| `test-pwd.js`, `test_deploy.js` | `@typescript-eslint/no-require-imports` | Multiple |
| `test_fix_post.js`, `test_fix_post2.js` | Parsing errors | Multiple |

#### Top ESLint rules violated:

| Rule | Description | Severity |
|------|-------------|----------|
| `@typescript-eslint/no-explicit-any` | Avoid `any` type — specify concrete type | Error |
| `@typescript-eslint/no-unused-vars` | Variables/params assigned but never read | Error |
| `@typescript-eslint/no-require-imports` | `require()` style import forbidden — use `import` | Error |

#### Root Cause

The commit `8031722` changed the CI to set `continue-on-error: true` on the Lint step (to make P0 lint non-blocking on non-release branches), but the quality-gate evaluates `needs.typecheck.result`, which is still reported as `failure` when the lint step fails with that conclusion.

**Recommended fixes:**

1. **Short-term (unblock CI):** Add `--max-warnings=-1` or change lint to `continue-on-error: true` at the **job** level.
2. **Long-term (code quality):** Replace `any` types with proper TypeScript interfaces across service files.
3. **Temporary files:** Add `temp_*.js`, `test_*.js`, `check_*.js` to `.eslintignore` or move them to a `/tmp` directory that ESLint skips.

---

### 2. 🧪 Unit Tests — FAILED

**Job ID:** [64460381014](https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions/runs/22284500890/job/64460381014)

**Error:**

```
npm error Missing script: "test:unit"
npm error Did you mean one of these?
npm error   npm run test:ui
npm error   npm run test:run
```

**Root Cause:** The CI workflow called `npm run test:unit`, but `package.json` only defines `test`, `test:ui`, `test:run`, `test:visual`, etc. The `test:unit` alias was not defined.

**Fix Applied:** Added `"test:unit"` script to `package.json` as an alias for `vitest run tests/unit --browser.enabled=false --passWithNoTests`. See the commit accompanying this report.

> **Note:** The workflow file was subsequently updated to call `npx vitest run tests/unit --browser.enabled=false --passWithNoTests` directly, which avoids the npm script dependency — but the alias was added for consistency and developer convenience.

---

### 3. 🔒 Security Audit — FAILED

**Job ID:** [64460381026](https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions/runs/22284500890/job/64460381026)

**Command:** `npm audit --omit=dev --audit-level=critical`

**Result:** 42 vulnerabilities (3 low, 3 moderate, 35 high, 1 **critical**)

#### Critical Vulnerability

| Package | Severity | CVEs / Advisories |
|---------|----------|-------------------|
| `next` (v0.9.9 – 15.5.9) | **CRITICAL** | [GHSA-gp8f-8m3g-qvj9](https://github.com/advisories/GHSA-gp8f-8m3g-qvj9) — Cache Poisoning<br>[GHSA-g77x-44xx-532m](https://github.com/advisories/GHSA-g77x-44xx-532m) — DoS (Image Optimization)<br>[GHSA-7m27-7ghc-44w9](https://github.com/advisories/GHSA-7m27-7ghc-44w9) — DoS (Server Actions)<br>[GHSA-3h52-269p-cp9r](https://github.com/advisories/GHSA-3h52-269p-cp9r) — Info Exposure (dev server)<br>[GHSA-g5qg-72qw-gw5v](https://github.com/advisories/GHSA-g5qg-72qw-gw5v) — Cache Key Confusion<br>[GHSA-7gfc-8cq8-jh5f](https://github.com/advisories/GHSA-7gfc-8cq8-jh5f) — Authorization Bypass<br>[GHSA-4342-x723-ch2f](https://github.com/advisories/GHSA-4342-x723-ch2f) — SSRF via Middleware<br>[GHSA-f82v-jwr5-mffw](https://github.com/advisories/GHSA-f82v-jwr5-mffw) — Middleware Auth Bypass |

#### High-Severity Vulnerabilities (selected)

| Package | Advisory | Fix |
|---------|----------|-----|
| `tar` (≤ 7.5.7) | Arbitrary file overwrite, symlink poisoning | `npm audit fix --force` (breaking) |
| `qs` (6.7.0 – 6.14.1) | DoS via arrayLimit bypass | `npm audit fix` |
| `axios` (≤ 1.13.4) | DoS via `__proto__` key | `npm audit fix` |
| `@modelcontextprotocol/sdk` | Cross-client data leak | `npm audit fix` |
| `@isaacs/brace-expansion` | Uncontrolled resource consumption | `npm audit fix` |

#### Recommended Actions

```bash
# Step 1: Fix non-breaking vulnerabilities
npm audit fix

# Step 2: Upgrade Next.js (breaking change — requires careful testing)
npm install next@latest   # Or next@14.2.35 as minimum patched version

# Step 3: Review and test after upgrades
npm run build && npm run test:run
```

> ⚠️ The CI step already has `continue-on-error: true`, so security audit failures should not block the quality gate. However, the critical vulnerabilities in `next` should be addressed urgently as they affect production deployments.

---

### 4. ✅ Quality Gate — FAILED

**Job ID:** [64460554137](https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions/runs/22284500890/job/64460554137)

**Root Cause:** Cascading failure from `typecheck` job. The quality gate evaluates `needs.typecheck.result != "success"`, and since the typecheck job was marked as `failure` (due to lint step conclusion), the gate triggered.

**Configuration:** The gate depends on `[typecheck, build, schema-validation]`. Unit tests and security are correctly excluded from the gate.

---

## ✅ Passing Jobs

| Job | Status | Notes |
|-----|--------|-------|
| 🗃️ Schema Validation | ✅ PASSED | Both MySQL (`prisma/schema.prisma`) and PostgreSQL (`prisma/schema.postgresql.prisma`) validated successfully |
| 🏗️ Build Test | ✅ PASSED | Full production build completed successfully (~3 minutes) with dummy env vars |

---

## 🔧 Action Plan (Prioritized)

### P0 — Immediate (Unblock CI)

- [x] **Fix missing `test:unit` script** — Added to `package.json` → `vitest run tests/unit --browser.enabled=false --passWithNoTests`
- [ ] **Suppress lint on temp/check files** — Add `temp_*.js`, `test_*.js`, `check_*.js`, `fix_*.js`, `get-*.mjs` root-level scripts to `.eslintignore`
- [ ] **Ensure lint step uses `continue-on-error: true` correctly** — Verify the quality gate reads the typecheck job result correctly

### P1 — Short-term (Code Quality)

- [ ] **Replace `any` types in service files** — Start with `seller.service.ts`, `auction.service.ts`, `lotting.service.ts`
- [ ] **Fix `no-unused-vars` in service files** — Prefix unused destructured vars with `_` (e.g., `_latitude`, `_longitude`)
- [ ] **Remove CommonJS `require()` from JS helper scripts** — Convert to `import` or add to ESLint ignore

### P2 — Medium-term (Security)

- [ ] **Upgrade Next.js** — Run `npm install next@14.2.35` (minimum patch) and test thoroughly
- [ ] **Run `npm audit fix`** — Fix non-breaking vulnerabilities (qs, axios, @isaacs/brace-expansion)
- [ ] **Evaluate `tar`, `firebase-tools` upgrades** — Currently blocked by breaking changes

### P3 — Long-term (Tech Debt)

- [ ] **Full ESLint remediation** — 5006 violations across service files need systematic `any` → typed replacement
- [ ] **Upgrade Prisma** — Currently on v5.22.0, latest is v7.4.1 (major version upgrade)
- [ ] **Remove deprecated packages** — `lodash.isequal`, `backbone-undo`, `@opentelemetry/exporter-jaeger`, `node-domexception`

---

## 📈 CI Health Trend

| Run | Branch | Result | Date |
|-----|--------|--------|------|
| #315 | `feat/admin-help-tooltips-20260222-2010` | ❌ FAILED | 2026-02-22 |

---

## 📎 References

- [Workflow Run #315](https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions/runs/22284500890)
- [Type Check & Lint Job](https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions/runs/22284500890/job/64460381013)
- [Unit Tests Job](https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions/runs/22284500890/job/64460381014)
- [Security Audit Job](https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions/runs/22284500890/job/64460381026)
- [Quality Gate Job](https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions/runs/22284500890/job/64460554137)
- [Pull Request #190](https://github.com/augustodevcode/bidexpert_ai_firebase_studio/pull/190)
- [Next.js Security Update Blog Post](https://nextjs.org/blog/security-update-2025-12-11)

---

*Generated automatically by @copilot in response to CI monitoring alert.*
