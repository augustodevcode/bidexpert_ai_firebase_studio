# Competitive Audit - 2026-04-01

## Scope

Comparative audit of BidExpert against public information architecture and public lot/event field coverage visible on:

- VIP Leiloes
- ABA Leiloes
- Mercado Bomvalor
- Superbid Exchange

This audit does not clone protected competitor assets, photos, PDFs, or descriptions into BidExpert. The benchmark uses public-facing metadata, field coverage, interaction patterns, and trust/document signals to identify parity gaps and fix BidExpert at the product level.

## Evidence Sources

- Public browser snapshots captured from `mercado.bomvalor.com.br`
- Public browser snapshots captured from `superbid.net`
- Prior content extraction from `vipleiloes.com.br`
- Prior content extraction from `abaleiloes.com.br`
- Real headed validation against local BidExpert runtime on `http://demo.localhost:9007`

## Competitor Signals

### VIP Leiloes

Observed strengths:

- Dense event cards with category, lot count, location/state coverage, modality, and auctioneer identity.
- High listing density with visible current value, initial value, lot number, mileage/year-style metadata, and bid counters.
- Strong trust/authority presence in homepage sections and category segmentation.

### ABA Leiloes

Observed strengths:

- Explicit judicial framing with 1st/2nd praça windows.
- Strong comarca, judicial authority, and event-timeline metadata.
- High visibility for lot counts, legal modality, and contact/trust blocks.

### Mercado Bomvalor

Observed strengths from home and event page:

- Event card identity: event ID, consignor/brand, event title, event type, closing timestamp, status, lot count.
- Event page trust/document signals: `Condições e Habilite-se`, edital PDF, additional documents, blockchain/cartório verification link.
- Dense facet filtering on event page: lot status, lot number, product category, state, city, price range, segment.
- Commercial trust strip: sell, buy, FAQ, WhatsApp contact, identity/account layer.

### Superbid Exchange

Observed strengths from home and event page:

- Public taxonomy exposed early: `Leilão`, `Tomada de Preço`, `Mercado Balcão / Compre já`, plus `Corporativo`, `Judicial`, `Administrativo` segmentation.
- Event page identity: event title, praça window, closing timestamp, share/contact actions, habilitation CTA, virtual auditorium CTA.
- List result density: lot number, location, year, current bid, bid count, card image, precise closing time.

Observed competitor quality issues:

- Superbid homepage and event pages emitted CSP and React runtime errors in browser.
- Superbid homepage also emitted repeated layout warnings.

## BidExpert Issues Found Live

The following issues were reproduced in real browser validation on BidExpert before the patch:

- Public header rendered duplicate `/lots` entries, generating duplicate-key React warnings.
- Dashboard overview leaked Prisma `Decimal` payloads into client components, generating serialization warnings.
- Recommendation cards used `next/image` with `fill` but without `sizes`.
- Playwright autofix/local configs scanned `tests/unit`, contaminating E2E discovery with Vitest files.

## Fixes Implemented

### Public Navigation

- Added nav normalization helper to deduplicate menu items before rendering.
- Enforced a single primary `/lots` entry in the central navigation path.

### Dashboard Serialization

- Sanitized dashboard server-action payloads before they cross the server/client boundary.
- Preserved nested auction data while eliminating `Decimal`, `BigInt`, and non-plain-object leakage.

### Recommendation Card Rendering

- Added `sizes` to dashboard recommendation images.
- Switched price formatting to centralized currency formatting.
- Hardened location label fallback.

### Public Lots Marketplace Upgrade

- Added a top-level marketplace overview to `/lots` with explicit modality taxonomy for `Judicial`, `Extrajudicial`, `Venda Direta`, and `Tomada de Preços`.
- Added a public trust rail for open opportunities, process traceability, active consignors, and advanced discovery.
- Added stable `data-ai-id` exposure for critical card metadata such as lot location.

### Playwright Validation Path

- Scoped `playwright.autofix.config.ts` and `playwright.config.local.ts` to `tests/e2e`.
- Verified that the direct CLI path `node .\\node_modules\\@playwright\\test\\cli.js` is the reliable runner in this worktree.

## Validation Results

### Static and Unit Validation

- `npm run typecheck` passed.
- `npx vitest run --config vitest.unit.config.ts tests/unit/serialization-helper.spec.ts tests/unit/nav-item-utils.spec.ts` passed.
- Total focused unit assertions passed: `14`.

### Headed Browser Validation

Successful command:

```powershell
node .\node_modules\@playwright\test\cli.js test tests/e2e/dashboard-overview-competitiveness.spec.ts --config=playwright.public-headed.config.ts --project=chromium --headed
```

Result:

- `1 passed`.
- Confirmed only one desktop `/lots` navigation entry.
- Confirmed dashboard overview loads without the previously reproduced duplicate-key warning.
- Confirmed dashboard overview no longer emits the previous `Decimal`/plain-object serialization warnings.

Additional successful command:

```powershell
node .\node_modules\@playwright\test\cli.js test tests/e2e/lots-marketplace-overview.spec.ts --config=playwright.public-headed.config.ts --project=chromium --headed
```

Additional result:

- `1 passed`.
- Confirmed `/lots` now exposes a public marketplace overview before the main grid.
- Confirmed modality chips for `Judicial`, `Extrajudicial`, `Venda Direta`, and `Tomada de Preços` are visible.
- Confirmed trust rail signals and stable location metadata are present in the live page.

## Competitive Position After This Iteration

BidExpert is now materially stronger in these areas than it was before this audit:

- Cleaner public header structure with no duplicated primary navigation target.
- Cleaner dashboard runtime with eliminated Prisma serialization noise.
- Better dashboard image rendering contract.
- Automated regression guardrail covering the public header and bidder dashboard overview.
- A more competitive `/lots` landing experience with explicit modality taxonomy and public trust/discovery signals above the fold.

## Remaining Gaps To Exceed Competitors

The next highest-value parity/superiority gaps are:

1. Public home and lots/search surfaces should expose modality taxonomy more explicitly, similar to the `Leilão`, `Tomada de Preço`, `Judicial`, `Administrativo` visibility seen on Superbid.
2. Judicial and praça metadata should be more visible on cards and detail surfaces where applicable, matching the clarity seen on ABA Leiloes.
3. Event-level trust/document actions should be more prominent on public event and lot surfaces, especially edital/document CTAs and consignor/auctioneer identity blocks.
4. Faceted filtering on the public lots/search experience should expose richer state/city/status/segment combinations with less friction.
5. Contact/trust rails on public pages can be made more explicit without copying competitor branding.

## Files Changed In This Iteration

- `src/components/layout/nav-item-utils.ts`
- `src/components/layout/header.tsx`
- `src/app/dashboard/overview/actions.ts`
- `src/app/dashboard/overview/page.tsx`
- `context/REGRAS_NEGOCIO_CONSOLIDADO.md`
- `tests/unit/nav-item-utils.spec.ts`
- `tests/unit/serialization-helper.spec.ts`
- `tests/e2e/dashboard-overview-competitiveness.spec.ts`
- `src/app/lots/lots-marketplace-overview.utils.ts`
- `src/app/lots/lots-marketplace-overview.tsx`
- `tests/unit/lots-marketplace-overview.utils.spec.ts`
- `tests/e2e/lots-marketplace-overview.spec.ts`
- `playwright.autofix.config.ts`
- `playwright.config.local.ts`
