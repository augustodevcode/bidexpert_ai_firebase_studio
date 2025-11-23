import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = 'admin@bidexpert.com.br';
  const newPassword = 'Admin@123';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  console.log(`Password for ${user.email} has been reset to ${newPassword}`);
}

resetPassword()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
