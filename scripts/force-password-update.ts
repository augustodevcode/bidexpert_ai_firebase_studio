
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Force Updating Password with bcryptjs ---');
  
  const email = 'admin@bidexpert.ai';
  const password = 'senha@123';
  
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
      console.log('User not found');
      return;
  }
  
  const newHash = await bcryptjs.hash(password, 10);
  
  await prisma.user.update({
      where: { id: user.id },
      data: { password: newHash }
  });
  
  console.log(`Password for ${email} updated successfully with bcryptjs hash.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
