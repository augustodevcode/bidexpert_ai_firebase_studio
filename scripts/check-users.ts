
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 5,
    select: {
      id: true,
      email: true,
      tenants: {
        select: {
          tenantId: true,
          tenant: {
            select: { name: true }
          }
        }
      }
    }
  });
  console.log('All Users:', JSON.stringify(users, (key, value) =>
    typeof value === 'bigint'
      ? value.toString()
      : value
  , 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
