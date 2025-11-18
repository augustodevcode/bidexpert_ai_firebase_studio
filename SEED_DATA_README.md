# Seed Data - Populating Database with Test Data

## Overview

The `seed-data-fixed.ts` script populates your BidExpert database with comprehensive test data, including tenants, users, auctions, lots, and bids.

## Running the Seed

### Method 1: Using npm script (Recommended)

```bash
npm run db:seed:populate
```

### Method 2: Direct execution

```bash
npx tsx seed-data-fixed.ts
```

## What Gets Created

### Tenants (3 total)
- Premium Tenant
- Standard Tenant
- Test Tenant

### Users (3 total)

#### 1. Leiloeiro (Auctioneer) - Admin User
- **Email**: test.leiloeiro@bidexpert.com
- **Password**: Test@12345
- **Roles**: LEILOEIRO, COMPRADOR, ADMIN

#### 2. Comprador (Buyer)
- **Email**: test.comprador@bidexpert.com
- **Password**: Test@12345
- **Roles**: COMPRADOR

#### 3. Advogado (Lawyer)
- **Email**: advogado@bidexpert.com.br
- **Password**: Test@12345
- **Roles**: ADVOGADO, COMPRADOR

### Auctions (2 total)

1. **Leilão Premium - Imóveis Comerciais** (Real Estate Auction)
   - Status: ABERTO (OPEN)
   - Type: JUDICIAL
   - Scheduled for 7 days from now

2. **Leilão Standard - Veículos** (Vehicle Auction)
   - Status: ABERTO (OPEN)
   - Type: EXTRAJUDICIAL
   - Scheduled for 3 days from now

### Lots (4 total)

**Auction 1 - Real Estate:**
- L001: Sala Comercial 100m² - Centro (Commercial Space)
  - Initial Price: R$ 120,000.00
  - Current Price: R$ 150,000.00

- L002: Apartamento 2Q - Zona Residencial (Apartment)
  - Initial Price: R$ 200,000.00
  - Current Price: R$ 250,000.00

**Auction 2 - Vehicles:**
- L001: Honda Civic 2020
  - Initial Price: R$ 60,000.00
  - Current Price: R$ 75,000.00

- L002: Toyota Corolla 2019
  - Initial Price: R$ 52,000.00
  - Current Price: R$ 65,000.00

### Bids (6 total)

Realistic bids are placed by buyers and lawyers on the available lots.

## Features

✅ Automatically clears existing data before populating (respects foreign key constraints)
✅ Creates all necessary relationships (Users ↔ Tenants, Users ↔ Roles, Users ↔ Auctions)
✅ Supports running multiple times without errors (uses unique IDs)
✅ All users are HABILITADO (Approved/Enabled) by default
✅ All auctions and lots are in ABERTO_PARA_LANCES (Open for Bidding) status

## Database Preparation

Before running seed, ensure your database is set up:

```bash
npm run db:push
```

Then run the seed:

```bash
npm run db:seed:populate
```

## Using Test Data for E2E Tests

The created test users can be used in Playwright tests:

```typescript
// Example login in test
await page.goto('https://your-app/login');
await page.fill('[name="email"]', 'test.comprador@bidexpert.com');
await page.fill('[name="password"]', 'Test@12345');
await page.click('button[type="submit"]');
```

## Notes

- All timestamps use the current server time plus calculated offsets
- Unique IDs are generated using timestamps to prevent collisions on multiple runs
- Passwords are hashed using bcrypt (never stored in plain text)
- Foreign key constraints are properly managed during data cleanup
- The script respects all Prisma schema constraints and validations

## Troubleshooting

### Foreign Key Constraint Error
If you see "Foreign key constraint violated", the script will attempt to disable and re-enable foreign key checks automatically.

### Unique Constraint Error
If you get a unique constraint error on slugs or IDs, the script uses timestamps to ensure uniqueness. Running again should succeed.

### Connection Error
Ensure your DATABASE_URL is set correctly in `.env` and your database server is running.

## Extending the Seed

To add more test data, edit `seed-data-fixed.ts` and add more records to the appropriate `prisma.MODEL.create()` calls.

Example:
```typescript
prisma.auction.create({
  data: {
    publicId: `auction-${timestamp}-3`,
    slug: `auction-custom-${timestamp}-3`,
    title: 'Custom Auction',
    // ... other fields
  },
}),
```

Then run `npm run db:seed:populate` again.
