const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:M%21nh%40S3nha2025@localhost:3306/bidexpert_demo'
    }
  }
});

const bcrypt = require('bcryptjs');

async function main() {
  const hash = await bcrypt.hash('senha@123', 10);
  await prisma.user.update({
    where: { email: 'admin@bidexpert.com.br' },
    data: { password: hash }
  });
  console.log('Password updated to senha@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());