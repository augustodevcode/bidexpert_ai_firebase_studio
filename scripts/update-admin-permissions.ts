
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.findFirst({
    where: { name: 'ADMIN' }
  });

  if (!adminRole) {
    console.error('ADMIN role not found');
    return;
  }

  console.log(`Role: ${adminRole.name}`);
  console.log('Current Permissions:', adminRole.permissions);

  let permissions: string[] = [];
  if (Array.isArray(adminRole.permissions)) {
    permissions = adminRole.permissions as string[];
  }

  if (!permissions.includes('manage_all')) {
    console.log('Adding "manage_all" permission...');
    permissions.push('manage_all');
    
    await prisma.role.update({
      where: { id: adminRole.id },
      data: { permissions: permissions }
    });
    console.log('Permissions updated.');
  } else {
    console.log('"manage_all" permission already exists.');
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
