const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:M%21nh%40S3nha2025@localhost:3306/bidexpert_demo'
    }
  }
});

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'augustoaraujo.augusto@gmail.com' }
  });
  console.log(user);
}

main().finally(() => prisma.$disconnect());
