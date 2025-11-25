
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          role: {
            name: 'ADMIN'
          }
        }
      }
    },
    include: {
      roles: {
        include: {
          role: true
        }
      },
      tenants: {
        include: {
          tenant: true
        }
      }
    }
  });

  console.log('Users found:', users.length);
  users.forEach(u => {
    console.log(`Email: ${u.email}, Password (hash): ${u.password.substring(0, 10)}...`);
    console.log(`Roles: ${u.roles.map(r => r.role.name).join(', ')}`);
    console.log(`Tenants: ${u.tenants.map(t => t.tenant.name).join(', ')}`);
    console.log('---');
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
