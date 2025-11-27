import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      roles: true,
    }
  });
  
  console.log('Users found:', users);
}

listUsers()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
