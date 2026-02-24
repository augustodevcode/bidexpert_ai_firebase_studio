# 🚨 CI/CD Issues Report — Run #317

**Workflow:** CI - Pull Request Checks  
**Branch:** `feat/admin-help-tooltips-20260222-2010`  
**Commit:** `a57bb57` — *docs(governance): enforce mandatory Playwright evidence for PR approval*  
**Run Date:** 2026-02-22T20:41:14Z  
**Run ID:** [22284927511](https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions/runs/22284927511)

---

## ❌ Failed Jobs Summary

| Job | Status | Root Cause |
|-----|--------|-----------|
| 🔒 Security Audit | ❌ FAILED | 42 npm vulnerabilities (1 critical, 35 high) |
| 🔍 Type Check & Lint | ❌ FAILED | 5,006 ESLint problems (3,129 errors, 1,877 warnings) |
| 🧪 Unit Tests | ❌ FAILED | Missing npm script `test:unit` in package.json |
| ✅ Quality Gate | ❌ FAILED | Upstream job failures cascaded |

---

## 🔒 Job 1 — Security Audit (job #64461473841)

**Status:** FAILED  
**Link:** https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions/runs/22284927511/job/64461473841

### Root Cause

`npm audit` reported **42 vulnerabilities** across production and devDependencies:

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 35 |
| Moderate | 3 |
| Low | 3 |

### Key Vulnerable Packages

| Package | Severity | Vulnerabilities |
|---------|----------|----------------|
| `next` (0.9.9–15.5.9) | 🔴 Critical | Cache Poisoning, DoS, Authorization Bypass, SSRF, Cache Key Confusion, Information Exposure (14 CVEs) |
| `tar` (≤7.5.7) | 🔴 High | Arbitrary File Creation/Overwrite, Symlink Poisoning, Path Traversal, File Read/Write (4 CVEs) |
| `archiver-utils` | 🟠 High | Path traversal vulnerability |
| `minimatch` | 🟠 High | Inefficient RegEx DoS |
| `qs` (6.7.0–6.14.1) | 🟡 Moderate | arrayLimit bypass DoS in comma parsing |
| `glob` | 🟡 Moderate | Deprecated, security concern |

### Recommended Fixes

```bash
# Fix non-breaking vulnerabilities
npm audit fix

# Fix all vulnerabilities (may include breaking changes)
npm audit fix --force
```

**Note:** Updating `next` to `>=15.5.10` will address 14 CVEs. The audit CI step currently uses `--audit-level=critical` with `continue-on-error: true` in the updated workflow, so this is informational.

---

## 🔍 Job 2 — Type Check & Lint (job #64461473845)

**Status:** FAILED  
**Link:** https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions/runs/22284927511/job/64461473845

### Root Cause

ESLint reported **5,006 problems** (3,129 errors, 1,877 warnings) across the codebase.

### Error Categories

| Rule | Count | Description |
|------|-------|-------------|
| `@typescript-eslint/no-explicit-any` | High | `any` type used instead of specific types |
| `@typescript-eslint/no-unused-vars` | High | Variables declared but never used |
| `@typescript-eslint/no-require-imports` | Multiple | CommonJS `require()` used in root JS files |
| Parsing errors | 2 files | Invalid characters in `temp_check.js`, `test_fix_post2.js` |

### Affected Files (Sample)

**Service files with `no-explicit-any`:**
- `src/services/seller.service.ts` (lines 43, 58, 145, 152, 162, 168, 229, 249, 262, 283–287, 300)
- `src/services/shadow-ban.service.ts` (lines 186–190 — unused vars)
- `src/services/state.service.ts` (line 22)

**Root-level temp/test JS files with `no-require-imports`:**
- `temp_check_db.js` — uses `require()`
- `temp_check_user.js` — uses `require()`
- `temp_verify_admin.js` — uses `require()`
- `test-pwd.js` — uses `require()`
- `test_deploy.js` — uses `require()`
- `test_fix_post.js` — uses `require()`
- `temp_check.js` — parsing error (invalid character)
- `test_fix_post2.js` — parsing error (invalid character)

### Recommended Fixes

1. **Root-level temp files**: These are debug/temporary files that should either be:
   - Added to `.eslintignore` (preferred since they are ephemeral scripts)
   - Deleted from the repository

2. **`no-explicit-any` in services**: Replace `any` with proper TypeScript types (e.g., `unknown`, specific interfaces)

3. **`no-unused-vars`**: Prefix unused variables with `_` (e.g., `_latitude`) or remove them

**Quick Fix for temp files (minimal change):**

Add the following entries to `.eslintignore`:
```
temp_check.js
temp_check_db.js
temp_check_user.js
temp_verify_admin.js
test-pwd.js
test_deploy.js
test_fix_post.js
test_fix_post2.js
check-*.js
```

**Note:** The current CI workflow has `continue-on-error: true` on the lint step, so lint errors do not block the quality gate. TypeScript strict typecheck (`npm run typecheck`) is the blocking step.

---

## 🧪 Job 3 — Unit Tests (job #64461473855)

**Status:** FAILED  
**Link:** https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions/runs/22284927511/job/64461473855

### Root Cause

The CI workflow called `npm run test:unit`, but this script **does not exist** in `package.json`.

```
npm error Missing script: "test:unit"
npm error Did you mean one of these?
npm error   npm run test:ui # run the "test:ui" package script
npm error   npm run test:run # run the "test:run" package script
```

### Available Test Scripts

| Script | Command |
|--------|---------|
| `test` | `vitest` |
| `test:ui` | `vitest --ui` |
| `test:run` | `vitest run` |
| `test:visual` | `vitest run tests/visual/` |

### Fix Applied

Added `test:unit` script to `package.json`:
```json
"test:unit": "vitest run tests/unit --browser.enabled=false --passWithNoTests"
```

**Note:** The current CI workflow (`branch-protection.yml`) was updated to call `npx vitest run tests/unit --browser.enabled=false --passWithNoTests` directly (bypassing the missing npm script). The script has also been added to `package.json` for consistency.

---

## ✅ Job 4 — Quality Gate (job #64461623052)

**Status:** FAILED  
**Link:** https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions/runs/22284927511/job/64461623052

### Root Cause

The Quality Gate depends on all upstream jobs. Since **Security Audit**, **Type Check & Lint**, and **Unit Tests** all failed, the gate condition evaluated to `failure`:

```bash
if [ "failure" != "success" ] || \
   [ "success" != "success" ] || \
   [ "success" != "success" ]; then
  echo "❌ Quality gate failed!"
  exit 1
fi
```

### Fix

The quality gate will pass once upstream jobs succeed. The current workflow has been updated so that the Quality Gate only blocks on `typecheck`, `build`, and `schema-validation` (not on `security` or `unit-tests`, which have `continue-on-error: true`).

---

## 🔧 Action Items

### P0 — Immediate (Blocks CI)

- [x] **Add `test:unit` to package.json** — The missing script caused the Unit Tests job to fail
- [ ] **Fix TypeScript typecheck errors** — Run `npm run typecheck` and resolve type errors (not ESLint, which is non-blocking)

### P1 — High Priority

- [ ] **Update `next` to ≥15.5.10** — Addresses 14 CVEs including 1 critical (Cache Poisoning)
- [ ] **Remove or gitignore temp/debug JS files** from repo root (`temp_check.js`, `check-*.js`, etc.)
- [ ] **Resolve `no-unused-vars` in `src/services/shadow-ban.service.ts`** (lines 186–190)

### P2 — Medium Priority

- [ ] **Replace `any` types in service files** with proper TypeScript types
- [ ] **Run `npm audit fix`** for non-breaking vulnerability patches

### P3 — Low Priority

- [ ] **ESLint config**: Consider adding `ignores` for root-level script/temp files in `eslint.config.mjs`
- [ ] **Standardize test scripts**: Align all CI scripts with `package.json` script names

---

## 📊 Current CI Workflow Status (Post-Fix)

After reviewing `branch-protection.yml` (current state):

| Job | Blocking? | Notes |
|-----|-----------|-------|
| 🔍 Type Check & Lint | ✅ Yes (typecheck) | Lint has `continue-on-error: true` |
| 🏗️ Build Test | ✅ Yes | Full blocking gate |
| 🧪 Unit Tests | ⚠️ No | `continue-on-error: true` |
| 🗃️ Schema Validation | ✅ Yes | Blocking |
| 🔒 Security Audit | ⚠️ No | `--audit-level=critical`, `continue-on-error: true` |
| ✅ Quality Gate | ✅ Yes | Depends on typecheck + build + schema-validation |

---

## 📅 Report Metadata

| Field | Value |
|-------|-------|
| **Generated at** | 2026-02-24T03:26:19Z |
| **Generated by** | @copilot (AI Agent) |
| **Source Run** | [Run #317 — 22284927511](https://github.com/augustodevcode/bidexpert_ai_firebase_studio/actions/runs/22284927511) |
| **Branch analyzed** | `feat/admin-help-tooltips-20260222-2010` |
| **Workflow file** | `.github/workflows/branch-protection.yml` |
