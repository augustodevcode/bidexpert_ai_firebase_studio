const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const replacer = (key, value) => 
  typeof value === 'bigint' ? value.toString() + 'n' : value;

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log('Tenants:', JSON.stringify(tenants, replacer, 2));

  console.log('Checking for admin@bidexpert.com.br...');
  const user = await prisma.user.findUnique({
    where: { email: 'admin@bidexpert.com' },
    include: { UsersOnTenants: true }
  });
  
  if (user) {
      console.log('User found:');
      console.log(JSON.stringify(user, replacer, 2));
  } else {
      console.log('User NOT found.');
      const allUsers = await prisma.user.findMany({ take: 5 });
      console.log('First 5 users:', JSON.stringify(allUsers, replacer, 2));
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
