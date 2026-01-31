const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: 'mysql://bidexpert:bidexpert123@localhost:3306/bidexpert_demo' } }
  });
  
  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, password: true, tenantId: true },
    take: 15
  });
  
  console.log('Usuarios na base bidexpert_demo:');
  for (const u of users) {
    const testPwd = await bcrypt.compare('demo@123', u.password);
    const testPwd2 = await bcrypt.compare('Test@12345', u.password);
    console.log(u.email, '| demo@123:', testPwd, '| Test@12345:', testPwd2);
  }
  
  await prisma.\();
}
main();
