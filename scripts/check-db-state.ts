
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking Database State ---');

  // Check Tenants
  const tenants = await prisma.tenant.findMany();
  console.log(`\nTenants (${tenants.length}):`);
  tenants.forEach(t => console.log(`- ${t.name} (${t.id})`));

  // Check Users and Roles
  const users = await prisma.user.findMany({
    include: {
      roles: true,
    },
  });
  console.log(`\nUsers (${users.length}):`);
  users.forEach(u => {
    const roles = u.roles.map(r => r.name).join(', ');
    console.log(`- ${u.email} (ID: ${u.id}, Roles: ${roles}, Tenant: ${u.tenantId})`);
  });

  // Check Audit Logs count
  const auditLogsCount = await prisma.auditLog.count();
  console.log(`\nTotal Audit Logs: ${auditLogsCount}`);

  // Check Auctions
  const auctions = await prisma.auction.findMany();
  console.log(`\nAuctions (${auctions.length}):`);
  auctions.forEach(a => console.log(`- ${a.title} (ID: ${a.id})`));

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
