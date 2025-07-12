// scripts/init-db.ts
// This file is now primarily for documentation. The main initialization is handled by `npx prisma migrate dev`,
// and seeding is handled by `npx prisma db seed`.

console.log('DB Initialization & Seeding');
console.log('---------------------------');
console.log('This project now uses Prisma for database management.');
console.log('');
console.log('1. To initialize and apply migrations (creates tables, etc.):');
console.log('   npm run db:init');
console.log('   (This runs `npx prisma migrate dev`)');
console.log('');
console.log('2. To seed the database with sample data:');
console.log('   npm run db:seed');
console.log('   (This runs `npx prisma db seed`, which executes `prisma/seed.ts`)');
console.log('');
console.log('The `dev` script in package.json now runs `db:init` automatically.');

// The old script logic is removed to avoid confusion.
// All seeding logic is now centralized in `prisma/seed.ts`.
