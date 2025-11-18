# BidExpert E2E Testing Guide

Complete guide for running Playwright e2e tests for BidExpert realtime features, audit/logs, blockchain toggle, and responsive design.

## 📋 Prerequisites

Before running tests, ensure you have:

- Node.js 18+ installed
- MySQL database running with `DATABASE_URL` configured in `.env`
- All dependencies installed: `npm install`
- Prisma migrations applied: `npx prisma db push`

## 🚀 Quick Start (5 minutes)

### Step 1: Seed Test Data

```bash
# Generate test users and auction data
npm run db:seed:test
```

This creates:
- **Admin user**: `admin@bidexpert.com` / `Admin@12345`
- **Test bidders**: `test-bidder@bidexpert.com` / `Test@12345` and `bidder2@test.com` / `Test@12345`
- **1 Active auction** with 2 lots and sample bids
- **Test categories**: Imóveis, Veículos, Máquinas

### Step 2: Start Development Server

```bash
# In one terminal window
npm run dev:9005
```

Wait for output:
```
▲ Next.js 14.2.3
  - Local:        http://localhost:9005
  - Environments: .env.local

Ready in 1234ms
```

### Step 3: Run Tests

```bash
# In another terminal window
npm run test:e2e:realtime
```

Or run specific test file:
```bash
npx playwright test tests/e2e/complete-features.spec.ts --config=playwright.config.local.ts
```

## 📊 Test Suite Overview

### Complete Features Suite (`tests/e2e/complete-features.spec.ts`)

#### 1️⃣ Realtime Bids (WebSocket) - 4 tests
- ✅ Receive new bids via WebSocket in realtime
- ✅ Display bid history updates
- ✅ Show realtime bid counter
- ✅ Handle connection loss and reconnection

**Features tested**: #4 (Audit/Logs/Versioning), #21 (WebSocket Bids), #11 (Soft Close)

**Expected behavior**:
- WebSocket connects automatically to `http://localhost:9005`
- New bids appear within 500ms
- Connection status indicator shows "Connected"
- Disconnection detected within 5 seconds

#### 2️⃣ Soft Close & Auto-close - 3 tests
- ✅ Show soft close warning before auction ends
- ✅ Extend auction on last-second bid
- ✅ Admin can configure soft close settings

**Features tested**: #11 (Soft Close), #21 (WebSocket)

**Expected behavior**:
- Warning appears 5 minutes before close
- Last bid adds 5 minutes to end time
- Admin toggle persists after save
- Settings save shows toast notification

#### 3️⃣ Audit Logs & Versioning - 3 tests
- ✅ Log all bid actions with timestamp
- ✅ Show entity version history
- ✅ Track who made what changes

**Features tested**: #4 (Audit/Logs), #28 (Versionamento)

**Expected behavior**:
- Bid appears in audit log within 5 seconds
- Version history shows all changes
- User info displayed with each action
- Timestamps in ISO 8601 format

#### 4️⃣ Blockchain Toggle - 3 tests
- ✅ Admin toggle blockchain on/off in settings
- ✅ Blockchain status shown in auction details
- ✅ Bids submitted to blockchain when enabled

**Features tested**: #5 (Blockchain), #27 (Configurável)

**Expected behavior**:
- Toggle state persists after reload
- Settings save shows toast
- Blockchain confirmation shown if enabled
- Hash/record ID displayed on success

#### 5️⃣ Responsive Design & PWA - 5 tests
- ✅ Mobile responsive (320px viewport)
- ✅ Tablet responsive (768px viewport)
- ✅ Desktop responsive (1920px viewport)
- ✅ PWA installable badge
- ✅ Manifest.json configured

**Features tested**: #31 (PWA/Responsivo), #32 (Mobile)

**Expected behavior**:
- Hamburger menu on mobile
- Navigation visible on tablet+
- Grid columns adjust based on viewport
- Install button visible on PWA
- Manifest.json returns 200 with valid data

#### 6️⃣ Performance & Accessibility - 3 tests
- ✅ Load pages in < 3 seconds
- ✅ ARIA labels on buttons
- ✅ Keyboard navigation support

**Expected behavior**:
- Initial load < 3000ms
- All buttons have labels
- Tab key navigates focus

## 🧪 Running Specific Tests

### Run single test group
```bash
npx playwright test complete-features.spec.ts -g "Realtime Bids" --config=playwright.config.local.ts
```

### Run with UI (visual mode)
```bash
npm run test:e2e:ui
```

Then select the test file and tests to run interactively.

### Debug a single test
```bash
npx playwright test complete-features.spec.ts -g "Should receive new bids" --debug --config=playwright.config.local.ts
```

### Run with verbose output
```bash
npx playwright test complete-features.spec.ts --config=playwright.config.local.ts -v
```

## 🔧 Configuration

### Playwright Config (`playwright.config.local.ts`)

Key settings:
- **baseURL**: `http://localhost:9005`
- **timeout**: 30 seconds per test
- **retries**: 1 on CI, 0 locally
- **webServer**: Starts `npm run dev:9005` automatically

### Test Environment Variables

Create `.env.test` or use existing `.env`:
```
DATABASE_URL=mysql://user:password@localhost:3306/bidexpert
NEXTAUTH_URL=http://localhost:9005
NEXTAUTH_SECRET=test-secret-key-123
WEBSOCKET_ENABLED=true
```

## 📊 Test Results

After running tests:

### HTML Report
```bash
npx playwright show-report
```

Opens interactive HTML report at:
```
playwright-report/index.html
```

### Console Output
Shows:
- ✅ Passed tests
- ❌ Failed tests with error messages
- ⏱️ Test duration
- 📊 Total passed/failed count

### Video Recordings
- Saved in `test-results/`
- Only for failed tests by default
- Enable for all tests in config: `record: 'on'`

## 🐛 Troubleshooting

### "Connect ECONNREFUSED 127.0.0.1:9005"
**Problem**: Server not running
**Solution**: 
```bash
# Terminal 1
npm run dev:9005
# Wait for "Ready in XXms"

# Terminal 2
npm run test:e2e:realtime
```

### "Cannot read properties of undefined (reading 'lotCategory')"
**Problem**: Prisma client not initialized
**Solution**:
```bash
# Regenerate Prisma client
npx prisma generate

# Check schema
npx prisma db push

# Re-seed data
npm run db:seed:test
```

### WebSocket tests fail with "Socket disconnected"
**Problem**: Socket.io not configured
**Solution**:
```bash
# Check WebSocket is enabled in .env
grep WEBSOCKET_ENABLED .env

# Check server logs for Socket.io initialization
npm run dev:9005  # Look for "Socket.io initialized"
```

### "Bid appeared in ... but count didn't increase"
**Problem**: WebSocket event listener not working
**Solution**:
- Check browser console for errors
- Verify Socket.io client library loaded
- Check backend emits `new-bid` event

### "Mobile viewport test failed - hamburger not visible"
**Problem**: Responsive design not implemented
**Solution**:
```bash
# Check tailwind responsive classes
grep "md:" src/components/**/*.tsx

# Check viewport meta tag
grep viewport public/index.html
```

### "Audit log entry not found"
**Problem**: Audit logging not enabled
**Solution**:
```bash
# Check audit middleware is applied
grep "withAudit\|AuditLog" src/app/**/*.ts

# Verify database has audit_logs table
npx prisma db push
```

### "Blockchain toggle test failed"
**Problem**: Blockchain feature not in schema
**Solution**:
```bash
# Check schema has blockchainEnabled field
grep -n "blockchainEnabled\|blockchain" prisma/schema.prisma

# Update if missing and run migration
npx prisma migrate dev --name add_blockchain_field
npm run db:seed:test
```

## 📚 Test Data Details

### Default Test Users

| Email | Password | Role |
|-------|----------|------|
| admin@bidexpert.com | Admin@12345 | Admin |
| test-bidder@bidexpert.com | Test@12345 | Bidder |
| bidder2@test.com | Test@12345 | Bidder |

### Default Test Auction

| Field | Value |
|-------|-------|
| ID | 1 |
| Name | Test Auction 1 |
| Status | ACTIVE |
| Duration | 2 hours from now |
| Lots | 2 (Apartment, Car) |
| Bids | 4 (2 per lot) |
| WebSocket | Enabled |
| Soft Close | Enabled (5 min) |
| Blockchain | Disabled |

### Default Lots

**Lot 1** - Apartamento
- ID: 1
- Category: Imóveis
- Starting bid: R$ 250.000
- Current bid: R$ 260.000 (bidder2)
- Minimum increment: R$ 5.000

**Lot 2** - Carro
- ID: 2
- Category: Veículos
- Starting bid: R$ 50.000
- Current bid: R$ 55.000 (bidder2)
- Minimum increment: R$ 1.000

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: bidexpert
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npx prisma db push
      - run: npm run db:seed:test
      - run: npm run build
      - run: npx playwright install
      - run: npm run test:e2e:realtime
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📝 Notes

- Tests are **isolated**: Each test sets up its own data
- Tests are **idempotent**: Can run multiple times without side effects
- Server **auto-starts** via `playwright.config.local.ts`
- Database **cleared** before each test suite (not between tests)

## 🤝 Contributing

When adding new tests:

1. Use existing test data (don't create new lots mid-test)
2. Add `[data-testid]` attributes to components
3. Use explicit waits, avoid `setTimeout`
4. Document expected behavior in test comments
5. Add to appropriate test group

Example:
```typescript
test('Should do something specific', async ({ page }) => {
  // Setup
  await loginUser(page, testUser.email, testUser.password);
  
  // Act
  await page.goto(`${BASE_URL}/path`);
  await page.click('[data-testid="some-button"]');
  
  // Assert
  await expect(page.locator('[data-testid="result"]')).toBeVisible();
});
```

## ✅ Checklist Before Deployment

- [ ] All E2E tests pass locally
- [ ] Run `npm run test:e2e:realtime` at least once
- [ ] HTML report reviewed for any warnings
- [ ] Accessibility tests pass
- [ ] Performance tests pass (< 3s load time)
- [ ] Mobile responsive tests pass
- [ ] WebSocket tests show "Connected"
- [ ] Audit logs being recorded
- [ ] Blockchain toggle functional
- [ ] Database seedhas no errors

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review test output in `playwright-report/`
3. Run with `--debug` flag to step through
4. Check server logs: `npm run dev:9005`
5. Review Playwright docs: https://playwright.dev

---

**Last Updated**: 2025-01-14
**Test Suite Version**: 1.0
**Next Review**: After gap implementation #5-#36 completion
