// src/lib/ui-helpers.ts

// This file now re-exports the shared helpers from the UI package.
// Re-exporting from @bidexpert/ui to maintain a single source of truth.
export * from '@bidexpert/ui/lib/ui-helpers';


// This approach allows us to centralize UI helpers while maintaining
// existing import paths within the `apps/web` application. Any new
// modifications should be made in the `packages/ui` version.
