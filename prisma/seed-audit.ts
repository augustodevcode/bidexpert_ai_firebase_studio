import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Audit Configuration...');

  const auditTargets = ['User', 'Tenant', 'Auction', 'Bid', 'Asset'];

  for (const entity of auditTargets) {
    await prisma.auditConfig.upsert({
      where: { entity },
      update: { enabled: true },
      create: { 
        entity, 
        enabled: true,
        fields: null // All fields
      }
    });
    console.log(` - Audit Configured for: ${entity}`);
  }

  console.log('Audit Seeding Complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
