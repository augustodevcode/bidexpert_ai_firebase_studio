import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const tables = await p.$queryRawUnsafe("SHOW TABLES");
console.log(JSON.stringify(tables, null, 2));
await p.$disconnect();
