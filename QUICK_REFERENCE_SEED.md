# 🚀 Quick Reference - Seed Data

## Execute Seed with One Command

```bash
npm run db:seed:v3
```

That's it! Your database will be populated with complete test data in 2-5 seconds.

## Alternative Commands

```bash
npm run db:seed:populate    # Alias for db:seed:v3
npx tsx seed-data-extended-v3.ts  # Direct execution
```

## Test Credentials (5 Users Available)

### 1. Leiloeiro (Admin) 
```
Email: test.leiloeiro@bidexpert.com
Password: Test@12345
```

### 2. Comprador (Buyer)
```
Email: test.comprador@bidexpert.com
Password: Test@12345
```

### 3. Advogado (Lawyer)
```
Email: advogado@bidexpert.com.br
Password: Test@12345
```

### 4. Vendedor (Seller)
```
Email: test.vendedor@bidexpert.com
Password: Test@12345
```

### 5. Avaliador (Appraiser)
```
Email: test.avaliador@bidexpert.com
Password: Test@12345
```

## Data Created

| Item | Count |
|------|-------|
| Tenants | 3 |
| Roles | 6 |
| Users | 5 |
| Auctions | 4 |
| Lots | 8 |
| Bids | 11 |
| Habilitações | 8 |

## Complete Workflow

```bash
# 1. Setup database schema
npm run db:push

# 2. Populate with test data
npm run db:seed:v3

# 3. Run development server
npm run dev

# 4. Login with any test credential above
# Navigate to http://localhost:9002
```

## For E2E Testing

```bash
# 1. Populate database
npm run db:seed:v3

# 2. Run Playwright tests
npm run test:e2e

# 3. (Optional) Run tests in UI mode
npm run test:e2e:ui
```

## Auction Types Available

- ✅ **JUDICIAL** - Judicial auctions
- ✅ **EXTRAJUDICIAL** - Extra-judicial auctions
- ✅ **PARTICULAR** - Private auctions
- ✅ **TOMADA_DE_PRECOS** - Price taking

## Lot Types Available

- ✅ **IMOVEL** - Real estate (3 lots)
- ✅ **VEICULO** - Vehicles (3 lots)
- ✅ **MAQUINARIO** - Machinery (1 lot)
- ✅ **MOBILIARIO** - Furniture (1 lot)

## Safe to Run Multiple Times

The script automatically:
- ✅ Clears old data
- ✅ Uses unique IDs (based on timestamps)
- ✅ Handles database constraints
- ✅ Never causes errors

## Troubleshooting

### Getting "command not found"?
```bash
# Make sure you're in the project root directory
cd bidexpert_ai_firebase_studio
npm run db:seed:v3
```

### Database connection error?
```bash
# Check DATABASE_URL in .env file
# Ensure MySQL server is running
mysql -h localhost -u root -p
```

### Need clean slate?
```bash
# Reset database completely
npm run db:push
npm run db:seed:v3
```

## Next Steps

1. Login with any test credential
2. Explore the auctions and lots
3. Place bids as different users
4. Run E2E tests to validate functionality
5. Check reports and analytics

---

**File**: `seed-data-extended-v3.ts`  
**Status**: ✅ Ready to use  
**Last Updated**: 2025-01-18
