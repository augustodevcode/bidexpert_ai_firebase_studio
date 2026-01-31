import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@bidexpert.com.br';
    console.log(`Fixing access for ${adminEmail}...`);
    
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    
    if (admin) {
        // Link to all active tenants (especially Tenant 3 which is the Demo one)
        const tenants = await prisma.tenant.findMany();
        
        for (const t of tenants) {
            console.log(`Linking to tenant ${t.id} (${t.name}) - Status: ${t.status}`);
            await prisma.usersOnTenants.upsert({
                where: { userId_tenantId: { userId: admin.id, tenantId: t.id } },
                update: {},
                create: { userId: admin.id, tenantId: t.id, assignedBy: 'fix-script' }
            });
        }
        console.log('Done.');
    } else {
        console.log('Admin user not found.');
    }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });