const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const admin = await p.user.findFirst({
    where: { email: 'admin@bidexpert.com.br' },
    select: { email: true, id: true, UsersOnTenants: { select: { tenantId: true } } }
  });
  console.log('Admin:', admin ? `email=${admin.email} tenants=${admin.UsersOnTenants.map(t=>Number(t.tenantId)).join(',')}` : 'NOT FOUND');

  const tenants = await p.tenant.findMany({
    select: { id: true, subdomain: true }
  });
  tenants.forEach(t => console.log(`Tenant id=${Number(t.id)} subdomain=${t.subdomain}`));
  
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
