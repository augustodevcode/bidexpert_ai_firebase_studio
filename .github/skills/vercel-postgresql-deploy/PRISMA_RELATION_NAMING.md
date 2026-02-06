# Prisma Relation Naming Convention - PostgreSQL vs MySQL

## CRITICAL RULE

The BidExpert project uses **dual Prisma schemas**:
- `prisma/schema.prisma` → MySQL (local dev)
- `prisma/schema.postgresql.prisma` → PostgreSQL (Vercel production)

### Relation Name Convention

| Schema | Relation Names | Example |
|--------|---------------|---------|
| **MySQL** | camelCase | `lot`, `auction`, `user`, `seller` |
| **PostgreSQL** | **PascalCase** | `Lot`, `Auction`, `User`, `Seller` |

### Impact

ALL Prisma operations that reference relations MUST use PascalCase for PostgreSQL:
- `include: { Lot: true }` (NOT `lot: true`)
- `connect: { Tenant: { connect: { id } } }` (NOT `tenant:`)
- `_count: { select: { Lot: true } }` (NOT `lots: true`)
- where filters: `LotCategory: { name: { contains: 'x' } }` (NOT `category:`)
- orderBy: `{ _count: { Bid: 'desc' } }` (NOT `bids`)

### Common Relation Mappings (PostgreSQL)

| Model | Relations (PascalCase) |
|-------|-----------------------|
| **Auction** | `Lot`, `Bid`, `Seller`, `Auctioneer`, `AuctionStage`, `Tenant`, `State`, `City`, `Court`, `JudicialProcess` |
| **Lot** | `Auction`, `Bid`, `AssetsOnLots`, `LotCategory`, `City`, `Seller`, `State`, `Subcategory`, `Tenant`, `User` (winner), `LotDocument`, `LotQuestion`, `LotRisk`, `LotStagePrice`, `Review`, `UserWin`, `InstallmentPayment`, `JudicialProcess`, `Auctioneer` |
| **Bid** | `Auction`, `User` (bidderId→User, NOT Bidder), `Lot`, `Tenant` |
| **User** | `UsersOnRoles`, `UsersOnTenants`, `Bid`, `Lot`, `UserDocument`, `UserWin` |
| **Seller** | `Asset`, `Auction`, `Lot`, `JudicialProcess`, `JudicialBranch`, `Tenant`, `User` |
| **AuditLog** | `User` |
| **PlatformSettings** | `Tenant` |
| **JudicialDistrict** | `Court`, `State` |
| **JudicialBranch** | `JudicialDistrict` |
| **JudicialProcess** | `Asset`, `Auction`, `JudicialParty`, `JudicialBranch`, `Court`, `JudicialDistrict`, `Seller`, `Tenant`, `Lot` |

### Result Mapping Pattern

When accessing query results, use fallback pattern for dual-schema compatibility:

```typescript
// Safe pattern for both schemas
const name = (result.Seller || (result as any).seller)?.name;
const count = (result._count as any).Lot ?? (result._count as any).lots ?? 0;
```

### Validation Checklist

Before deploying to Vercel:
1. Search for camelCase relation names in Prisma queries
2. Verify `include:`, `connect:`, `_count.select:`, `where:` (relation filter), `orderBy:` 
3. Verify result property access matches PascalCase
4. Run: `cp prisma/schema.postgresql.prisma prisma/schema.prisma && npx prisma generate && npm run build`
