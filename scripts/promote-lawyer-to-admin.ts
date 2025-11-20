
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'advogado@bidexpert.com.br';
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: { include: { role: true } } }
  });

  if (!user) {
    console.error(`User ${email} not found`);
    return;
  }

  console.log(`User found: ${user.fullName} (${user.id})`);
  console.log('Current roles:', user.roles.map(r => r.role.name));

  const allRoles = await prisma.role.findMany();
  console.log('Available roles:', allRoles.map(r => r.name));

  const adminRole = allRoles.find(r => r.name.toUpperCase().includes('ADMIN'));

  if (!adminRole) {
    console.error('No ADMIN role found');
    return;
  }
  
  console.log(`Found Admin Role: ${adminRole.name} (${adminRole.id})`);

  // Check if user already has this role
  const userHasRole = user.roles.some(ur => ur.roleId === adminRole.id);
  if (userHasRole) {
      console.log('User already has this role.');
      return;
  }

  await prisma.usersOnRoles.create({
    data: {
        userId: user.id,
        roleId: adminRole.id,
        assignedBy: 'SYSTEM_SCRIPT'
    }
  });

  console.log(`User ${email} promoted to ${adminRole.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
