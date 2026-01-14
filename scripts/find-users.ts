import { prisma } from '../src/lib/prisma';

async function main() {
  const users = await prisma.user.findMany({
    take: 5,
    select: { email: true, password: true, roles: { include: { role: true } } }
  });
  
  const serialized = JSON.stringify(users, (key, value) =>
    typeof value === 'bigint'
        ? value.toString()
        : value // return everything else unchanged
    , 2);

  console.log(serialized);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
