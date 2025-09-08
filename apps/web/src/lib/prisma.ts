// apps/web/src/lib/prisma.ts

// This file now re-exports the prisma instance from the central core package
// to maintain backward compatibility with any existing direct imports in the web app,
// although these should eventually be refactored to use services.

export { prisma } from '@bidexpert/core/lib/prisma';
