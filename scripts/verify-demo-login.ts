
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verifying Tenant and User configuration for demo environment...');

  // 1. Check if tenant with subdomain 'demo' exists
  const demoTenant = await prisma.tenant.findFirst({
    where: { subdomain: 'demo' }
  });

  if (!demoTenant) {
    console.log('❌ Tenant with subdomain "demo" NOT FOUND.');
  } else {
    console.log(`✅ Tenant found: ID=${demoTenant.id}, Name="${demoTenant.name}", Subdomain="${demoTenant.subdomain}"`);
    
    // 2. Check if user admin@bidexpert.ai exists
    const user = await prisma.user.findUnique({
        where: { email: 'admin@bidexpert.ai' },
        include: {
            tenants: {
                include: {
                    tenant: true
                }
            }
        }
    });

    if (!user) {
         console.log('❌ User admin@bidexpert.ai NOT FOUND.');
    } else {
        console.log(`✅ User found: ID=${user.id}, Email="${user.email}"`);
        
        // 3. Check if user is linked to the demo tenant
        const isLinked = user.tenants.some(ut => ut.tenantId === demoTenant.id);
        
        if (isLinked) {
            console.log(`✅ User IS linked to the demo tenant (ID ${demoTenant.id}).`);
        } else {
            console.log(`❌ User is NOT linked to the demo tenant (ID ${demoTenant.id}).`);
            console.log('Linking user to demo tenant now...');
            
            await prisma.usersOnTenants.create({
                data: {
                    userId: user.id,
                    tenantId: demoTenant.id,
                    assignedBy: 'verification-script'
                }
            });
            console.log('✅ User successfully linked to demo tenant.');
        }
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
