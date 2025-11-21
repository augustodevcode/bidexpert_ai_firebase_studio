
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'test.leiloeiro@bidexpert.com';
  const password = 'Test@12345';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  console.log(`Updated password for user: ${user.email}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
