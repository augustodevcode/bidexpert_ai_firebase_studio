import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'test-admin-ticket@bidexpert.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Find Admin Role
  const adminRole = await prisma.role.findFirst({
    where: { name: { contains: 'ADMIN' } }
  });

  if (!adminRole) {
    throw new Error('Admin role not found');
  }

  // Find Tenant
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
        password: hashedPassword,
    },
    create: {
      email,
      password: hashedPassword,
      fullName: 'Test Admin Ticket',
      dateOfBirth: new Date(),
      roles: {
        create: {
            roleId: adminRole.id,
            assignedBy: 'TEST',
        }
      },
      tenants: {
          create: {
              tenantId: tenant.id,
              assignedBy: 'TEST'
          }
      },
      accountType: 'PHYSICAL',
      habilitationStatus: 'HABILITADO'
    }
  });

  console.log(`User ${email} created/updated.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
