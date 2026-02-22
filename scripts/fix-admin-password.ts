import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin@123', 10);
  const existing = await prisma.user.findUnique({ where: { email: 'admin@bidexpert.com.br' } });

  if (existing) {
    await prisma.user.update({
      where: { email: 'admin@bidexpert.com.br' },
      data: {
        password: hash,
        fullName: existing.fullName ?? 'Admin BidExpert',
        updatedAt: new Date(),
      },
    });
    console.log('updated-admin-password');
    return;
  }

  await prisma.user.create({
    data: {
      email: 'admin@bidexpert.com.br',
      password: hash,
      fullName: 'Admin BidExpert',
      updatedAt: new Date(),
    },
  });
  console.log('created-admin-user');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
