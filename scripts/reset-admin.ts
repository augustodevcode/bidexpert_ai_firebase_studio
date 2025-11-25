
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminUser = await prisma.user.findFirst({
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
      tenants: {
        include: {
          tenant: true
        }
      }
    }
  });

  if (adminUser) {
    console.log(`Found Admin: ${adminUser.email}`);
    console.log(`Tenant: ${adminUser.tenants[0]?.tenant.name}`);
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword }
    });
    console.log('Password reset to: password123');
  } else {
    console.log('No admin user found.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
