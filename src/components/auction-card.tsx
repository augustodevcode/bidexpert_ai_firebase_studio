// src/components/auction-card.tsx

// This component now re-exports the shared component from the UI package.
export * from '@bidexpert/ui';

// This approach allows us to centralize UI components while maintaining
// existing import paths within the `apps/web` application. Any new
// modifications should be made in the `packages/ui` version of this component.
