# Seed Canonicalization & Deprecation Plan

This document outlines the plan to make `scripts/ultimate-master-seed.ts` the single canonical seed for the Demo environment and to deprecate other seed variants.

Summary
- Canonical seed: `scripts/ultimate-master-seed.ts` (invoke with `npm run db:seed:ultimate`).
- Deprecation window: other seed scripts will be marked DEPRECATED and removed after *two releases*.

What changed in this PR
- Documentation updated to point to `npm run db:seed:ultimate` as canonical (SKILL.md, seed-master-data.md, README.md).
- Deprecation headers added to other seed scripts indicating the removal timeline.
- `scripts/seed-verify.ts` created to validate essential counts after running the seed.
- Unit tests added (`tests/unit/seed-verify.spec.ts`).
- CI workflow added: `.github/workflows/seed-verify.yml` — runs seed + verification on PRs/main.

PR Checklist (to be enforced on PRs that touch schema/prisma changes)
- [ ] Ensure `scripts/ultimate-master-seed.ts` is updated to include new models/fields.
- [ ] Add/adjust a unit test in `tests/unit/seed-verify.spec.ts` or expand `scripts/seed-verify.ts` checks to validate new critical data.
- [ ] Run `npm run db:seed:ultimate` locally and `npm run seed:verify` to confirm success.
- [ ] Add a short note in the PR description explaining how the `ultimate` seed was updated.

Deprecation guidance
- Do not create new features that rely exclusively on the deprecated scripts.
- If an older seed is required for quicker iterative loops, keep it in the repo but **mark it clearly** and ensure it does not diverge in schema coverage.

Removal timeline: after two releases the deprecated scripts will be removed (this will be announced in release notes and in a follow-up PR).