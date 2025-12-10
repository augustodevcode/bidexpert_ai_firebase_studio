
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin.test.manual@bidexpert.com';
  const password = 'Admin@123';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if user exists
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    console.log('User already exists, updating password...');
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
  } else {
    console.log('Creating new admin user...');
    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: 'Admin Test Manual',
        cpf: '00000000000',
        accountType: 'PHYSICAL',
        habilitationStatus: 'HABILITADO',
      },
    });
  }

  // Assign ADMIN role
  const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
  if (adminRole) {
    const userRole = await prisma.usersOnRoles.findFirst({
        where: { userId: user.id, roleId: adminRole.id }
    });
    if (!userRole) {
        await prisma.usersOnRoles.create({
            data: {
                userId: user.id,
                roleId: adminRole.id,
                assignedBy: 'system'
            }
        });
        console.log('Admin role assigned.');
    } else {
        console.log('Admin role already assigned.');
    }
  } else {
      console.error('ADMIN role not found!');
  }

  // Assign Tenant (assuming tenant 1 exists)
  const tenant = await prisma.tenant.findFirst();
  if (tenant) {
      const userTenant = await prisma.usersOnTenants.findFirst({
          where: { userId: user.id, tenantId: tenant.id }
      });
      if (!userTenant) {
          await prisma.usersOnTenants.create({
              data: {
                  userId: user.id,
                  tenantId: tenant.id
              }
          });
          console.log('Tenant assigned.');
      }
  }

  console.log(`User ${email} ready with password ${password}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
