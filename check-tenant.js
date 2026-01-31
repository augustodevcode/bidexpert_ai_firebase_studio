
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTenant() {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { subdomain: 'demo' }
    });
    console.log('Tenant with subdomain "demo":', JSON.stringify(tenant, (k,v)=>typeof v === 'bigint'?v.toString():v, 2));
    
    // Check Tenant 1
    const t1 = await prisma.tenant.findUnique({ where: { id: 1 } });
    console.log('Tenant "1":', JSON.stringify(t1, (k,v)=>typeof v === 'bigint'?v.toString():v, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenant();
