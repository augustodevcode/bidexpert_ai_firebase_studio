// src/lib/database/index.ts
import 'server-only';
import { prisma } from '@/lib/prisma';

// Re-export the prisma client instance for use in server-side code.
// This is the single point of entry for database access.
export { prisma };
