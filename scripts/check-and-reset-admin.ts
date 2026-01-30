
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for admin@bidexpert.ai...');
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'admin@bidexpert.ai' }
    });

    if (user) {
      console.log('Found user: admin@bidexpert.ai');
      const newPassword = 'senha@123';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      console.log(`Password reset to: ${newPassword}`);
    } else {
      console.log('User admin@bidexpert.ai not found.');
      
      const admins = await prisma.user.findMany({
        where: {
            roles: {
                some: {
                    role: {
                        name: 'ADMIN'
                    }
                }
            }
        },
        take: 5
      });
      
      if (admins.length > 0) {
          console.log('Found other admins:');
          admins.forEach(a => console.log(`- ${a.email}`));
      } else {
          console.log('No admin users found.');
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
