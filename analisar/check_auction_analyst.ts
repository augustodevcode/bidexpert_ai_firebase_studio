
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for AUCTION_ANALYST role and users...');

  try {
    // 1. Find the role
    const role = await prisma.role.findFirst({
      where: {
        OR: [
          { name: 'AUCTION_ANALYST' },
          { nameNormalized: 'AUCTION_ANALYST' },
          { name: 'Auction Analyst' },
          { name: 'auction_analyst' }
        ]
      }
    });

    if (!role) {
      console.log('❌ Role AUCTION_ANALYST not found in the database.');
      return;
    }

    console.log(`✅ Role found: ID=${role.id}, Name=${role.name}, Normalized=${role.nameNormalized}`);
    console.log(`Permissions: ${JSON.stringify(role.permissions)}`);

    // 2. Find users with this role
    const usersOnRoles = await prisma.usersOnRoles.findMany({
      where: {
        roleId: role.id
      },
      include: {
        user: true
      }
    });

    if (usersOnRoles.length === 0) {
      console.log('⚠️ No users assigned to this role.');
    } else {
      console.log(`✅ Found ${usersOnRoles.length} user(s) with this role:`);
      usersOnRoles.forEach(ur => {
        console.log(` - User ID: ${ur.user.id}, Name: ${ur.user.fullName}, Email: ${ur.user.email}`);
      });
    }

  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
