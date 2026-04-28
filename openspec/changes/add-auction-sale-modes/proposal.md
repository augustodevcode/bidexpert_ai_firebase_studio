# Add Auction Sale Modes

## Why

The ABA auction registration flow exposes sale-mode controls that are absent or only implicit in BidExpert. Operators need to configure sublots, per-lot enrollment, preference rights, proposal acceptance, direct sale, and proposal deadline from the auction registration screen without relying on external notes or ad hoc lot rules.

## What Changes

- Add persisted Auction fields for sale-mode controls.
- Surface the same sale-mode contract in the classic auction form and the V2 auction form.
- Validate proposal deadline when proposals are enabled.
- Seed representative demo auctions with enabled sale-mode combinations.
- Cover the behavior with BDD, unit tests, and focused UI/E2E validation.

## Impact

- Affects Prisma Auction model in MySQL and PostgreSQL schemas.
- Affects admin auction creation and editing flows.
- Requires local schema sync before runtime tests and deployment schema sync before demo validation.