import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function check() {
  const email = 'advogado@bidexpert.com.br';
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
      console.log(`User found: ${user.email}`);
      const isMatch = await bcrypt.compare('password123', user.password || '');
      console.log(`Password 'password123' match: ${isMatch}`);
  } else {
      console.log('User not found');
  }
}

check()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
