import { PrismaClient } from '@prisma/client';

// Evita múltiplas instâncias do PrismaClient em desenvolvimento
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
