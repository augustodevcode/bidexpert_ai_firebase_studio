
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log('Please provide an email');
    return;
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    console.log('User found:', user.id);
  } else {
    console.log('User not found');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
