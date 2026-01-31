
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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

  if (user) {
      console.log(`User: ${user.email} (ID: ${user.id})`);
      user.tenants.forEach(t => {
          console.log(`- Linked to Tenant: ${t.tenant.name} (ID: ${t.tenantId}, Subdomain: ${t.tenant.subdomain})`);
      });
  } else {
      console.log('User not found');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
