import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const [, , emailArg, passwordArg] = process.argv;
  if (!emailArg) {
    console.error('Usage: tsx scripts/reset-user-password.ts <email> [password]');
    process.exit(1);
  }

  const password = passwordArg ?? 'Test@12345';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({
    where: { email: emailArg },
    data: { password: hashedPassword },
  });

  console.log(`Updated password for user: ${user.email}`);
}

main()
  .catch((error) => {
    console.error('Failed to reset password:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
