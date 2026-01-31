
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@bidexpert.com.br' },
      include: {
        UsersOnTenants: true
      }
    });

    console.log('User:', JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    , 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
