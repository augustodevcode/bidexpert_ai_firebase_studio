# 🔒 AI Project Rules & Directives

**Document Version:** 1.0  
**Last Updated:** November 11, 2025  
**Audience:** AI Assistants (Gemini, ChatGPT, etc.)  
**Status:** MANDATORY PROJECT DIRECTIVE

---

## Purpose

This document consolidates critical rules and directives for all AI assistants working on the BidExpert project. These rules must be followed to ensure code quality, consistency, and project success.

**⚠️ These are NOT suggestions - they are MANDATORY rules.**

---

## RULE 1: Multi-Tenant Security Architecture

**Status:** ✅ IMPLEMENTED & VALIDATED

### Requirements
- All data queries MUST filter by `tenantId`
- User ownership MUST be validated before access
- Cross-tenant access attempts MUST be rejected with 403 Forbidden
- All services must implement tenant validation

### Files Enforcing This Rule
- `src/services/lot.service.ts` - Lot queries filtered by tenantId
- `src/services/installment-payment.service.ts` - Payment ownership validated
- `src/services/bidder.service.ts` - Bidder data isolated by tenant
- `src/app/api/bidder/payment-methods/[id]/route.ts` - API routes validate ownership

### Validation Status
- ✅ 25/25 unit tests passing
- ✅ 6/6 API security tests passing
- ✅ Audit completed: AUDITORIA_MULTITENANT_EXECUTADA.md

---

## RULE 2: CRITICAL - Lazy Compilation vs Pre-Build in Next.js

**Status:** 🔴 ENFORCED AFTER SESSION 5  
**Severity:** CRITICAL  
**Project Impact:** Blocks all E2E testing in dev mode

### The Problem

**Development Mode (`npm run dev`)**:
- Uses Just-In-Time (lazy) compilation
- Each page compiles on-demand when first accessed
- Compilation time: 20-30 seconds per page
- Test timeout: 2.4 seconds
- **Result**: Tests timeout before pages compile → Connection refused errors

**Observable Behavior**:
```
Test starts: page.goto(/)
↓
Next.js needs to compile page
↓
Compilation takes 20-30 seconds
↓
Test timeout fires at 2.4 seconds ⚠️
↓
Connection refused error ❌
```

### The Solution

**Always use pre-compilation for testing and production**:

```bash
# CORRECT FOR E2E TESTS:
npm run build    # Pre-compile all pages
npm start        # Run production mode (no lazy compilation)

# OR use automated script:
node .vscode/run-e2e-tests.js

# DO NOT USE FOR TESTING:
npm run dev      # ❌ CAUSES LAZY COMPILATION & TIMEOUTS
```

### Performance Comparison

| Metric | Dev Mode (Lazy) | Production Mode (Pre-Build) |
|--------|-----------------|---------------------------|
| Per-page compilation time | 20-30 seconds | <100 milliseconds |
| Test execution timeout | 2.4 seconds | 30 seconds |
| E2E test pass rate | 40% (6/15 tests) | 100% (15/15 tests) |
| System reliability | Inconsistent | Consistent |
| Total test execution time | N/A (fails) | 2-3 minutes |
| Reproducibility | Poor | Perfect |

### When to Use Each Mode

| Use Case | Command | Reason |
|----------|---------|--------|
| **Local development** | `npm run dev` | Hot-reload, fast iteration |
| **E2E testing** | `npm run build && npm start` | Pre-compiled, no timeouts |
| **CI/CD pipeline** | `node .vscode/run-e2e-tests.js` | Fully automated, reliable |
| **Staging/Production** | `npm run build && npm start` | Pre-compiled, optimized |

### Build Process Details

#### Phase 1: Pre-Build (`npm run build`)
```bash
npm run build
```
- ✅ Compiles all pages ahead-of-time
- ✅ Generates optimized bundle in `.next/` directory
- ✅ One-time operation (~60 seconds)
- ✅ Result: Ready for deployment

#### Phase 2: Start Server (`npm start`)
```bash
npm start
```
- ✅ Starts Next.js production server
- ✅ Serves pre-compiled pages from `.next/`
- ✅ Zero compilation delay per request
- ✅ Port: 3000 (configurable)

#### Phase 3: Health Check
```bash
# Verify server is ready
curl http://localhost:3000

# Should return 200 OK
```

### Automation Scripts

Three scripts automate this process:

1. **`.vscode/prebuild-for-tests.js`** (146 lines)
   - Cleans previous build
   - Runs `npm run build`
   - Reports completion

2. **`.vscode/start-server-for-tests.js`** (77 lines)
   - Verifies build exists
   - Starts production server
   - Performs health checks

3. **`.vscode/run-e2e-tests.js`** (270 lines) ⭐ **RECOMMENDED**
   - Orchestrates entire flow
   - Manages process lifecycle
   - Runs Playwright tests
   - Cleans up automatically

### Usage Examples

#### Option 1: Automated (RECOMMENDED)
```bash
node .vscode/run-e2e-tests.js
```
- Builds → Starts server → Runs tests → Cleans up
- Best for CI/CD pipelines
- Most reliable

#### Option 2: Manual Step-by-Step
```bash
npm run build
npm start
# In another terminal:
npx playwright test tests/e2e/qa-comprehensive-validation.spec.ts --headed
```

#### Option 3: For Development
```bash
# Development with hot-reload
npm run dev

# Testing (same project instance):
npm run build && npm start  # In a new terminal
# Then run tests
```

### Reference Documentation

- **Full Analysis**: `PROBLEMA-E-SOLUCAO-FINAL.md`
- **Implementation Guide**: `SOLUCAO-LAZY-COMPILATION.md`
- **Test Results**: `PLAYWRIGHT-EXECUTION-REPORT.md`
- **Scripts Location**: `.vscode/` directory

### Enforcement Rules

**For Development Team:**
- ✅ Use `npm run build && npm start` before running E2E tests
- ✅ DO NOT use `npm run dev` for test execution
- ✅ Update local test scripts to use pre-build

**For CI/CD Pipeline:**
- ✅ All test workflows MUST call `node .vscode/run-e2e-tests.js`
- ✅ Never run E2E tests with `npm run dev`
- ✅ Verify test output shows all pages pre-compiled

**For Code Review:**
- ✅ Verify no test configuration runs `npm run dev` for E2E
- ✅ Check GitHub Actions uses pre-build for tests
- ✅ Reject PRs with test scripts using dev mode

**For Documentation:**
- ✅ Update all testing guides with this directive
- ✅ Include this rule in onboarding documentation
- ✅ Reference when debugging test failures

### Common Issues & Solutions

**Issue**: Tests still timeout with pre-build
**Solution**: 
1. Verify `npm run build` completed successfully
2. Check `.next/` directory exists and has files
3. Verify `npm start` returned status code 0

**Issue**: Server won't start after build
**Solution**:
1. Clean: `rm -rf .next node_modules`
2. Reinstall: `npm install`
3. Rebuild: `npm run build`
4. Start: `npm start`

**Issue**: Different results locally vs CI/CD
**Solution**:
1. Use same pre-build approach locally
2. Check Node.js version matches
3. Verify environment variables are set

---

## RULE 3: File Header Comments

**Status:** ✅ IMPLEMENTED

### Requirement
Every source file (`.ts`, `.tsx`) MUST start with a docblock explaining its purpose:

```typescript
/**
 * LotService
 * 
 * Handles lot-related business logic including:
 * - Fetching lot details with tenant isolation
 * - Validating tenant access to lots
 * - Managing lot lifecycle (creation, updates, deletion)
 * 
 * Security: All queries filter by tenantId
 */
```

---

## RULE 4: Non-Regression & Human Authorization

**Status:** ✅ ENFORCED

### Requirement
Any deletion or significant refactoring MUST be explicitly authorized:

1. Declare the intention clearly
2. Provide justification
3. Request explicit user confirmation
4. Only proceed after approval

This prevents accidental loss of functionality.

---

## RULE 5: Design System Usage

**Status:** ✅ ENFORCED

### Requirement
- ALL styles MUST use semantic tokens (no hardcoded colors)
- Define tokens in `index.css` and `tailwind.config.ts`
- Use design system variants in components
- Never use inline styles like `text-white`, `bg-white`
- Create custom variants for special UI cases

---

## RULE 6: Testing Strategy

**Status:** ✅ IMPLEMENTED

### Requirement
- Unit tests: Jest configuration
- E2E tests: Playwright
- All public APIs must have test coverage
- Security tests required for multi-tenant features
- Pre-build required before E2E execution (See RULE 2)

---

## RULE 7: Prisma Schema Integrity

**Status:** ✅ ENFORCED

### Requirement
- Single schema file: `prisma/schema.prisma`
- Database adapter pattern required
- All data access through `getDatabaseAdapter()`
- Direct Prisma client access prohibited in app logic
- Antes de usar novos campos em queries Prisma (ex.: `tenant.domain`), confirmar que o campo existe no schema e regenerar o client.
- Quando houver suporte a schemas legados/parciais, adicionar fallback nas queries para evitar erros de campo desconhecido em runtime.

---

## RULE 8: Environment Variables

**Status:** ✅ ENFORCED

### Requirement
- `.env` file is critical and must NEVER be deleted
- Existing content can only be extended, never removed
- Must document all required environment variables
- Include validation on app startup

---

## RULE 9: Cloud Validation (GCP Migration)

**Status:** ✅ ENFORCED

### Requirement
- **Ambiente:** Testes finais devem ser validados na URL pública do Cloud Run (GCP).
- **Banco de Dados:** AlloyDB (PostgreSQL) e Redis Remote.
- **Processo de Deploy:**
    - Alterações de banco exigem `RUN_MIGRATION=true` no Cloud Build.
    - Scripts de start (`scripts/start-cloud.sh`) executam `prisma db push` e seed quando solicitado.
- **Verificação:**
    - Login funcional com usuários seed.
    - Lances em tempo real validam integração com Redis.

---

## Summary Table

| Rule | Status | Severity | File(s) |
|------|--------|----------|---------|
| Multi-tenant security | ✅ | 🔴 CRITICAL | `AUDITORIA_MULTITENANT_EXECUTADA.md` |
| Lazy compilation vs pre-build | ✅ | 🔴 CRITICAL | `PROBLEMA-E-SOLUCAO-FINAL.md` |
| File header comments | ✅ | 🟡 MEDIUM | All `.ts/.tsx` files |
| Non-regression rules | ✅ | 🟡 MEDIUM | Project workflow |
| Design system usage | ✅ | 🟡 MEDIUM | All components |
| Testing strategy | ✅ | 🟡 MEDIUM | Test files |
| Prisma integrity | ✅ | 🔴 CRITICAL | `prisma/schema.prisma` |
| Environment variables | ✅ | 🔴 CRITICAL | `.env` |
| Cloud Validation | ✅ | 🔴 CRITICAL | `docs/GCP_MIGRATION.md` |

---

## Questions or Updates?

When these rules need updates or clarification:
1. Document the change here
2. Update referenced files
3. Notify team members
4. Update documentation

**Last Reviewed:** November 11, 2025  
**Next Review:** To be determined  
**Maintainer:** QA & Security Team

---

**Remember: These rules protect code quality, security, and project success. Follow them always.** 🎯
