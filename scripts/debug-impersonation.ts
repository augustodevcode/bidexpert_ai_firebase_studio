
import { adminImpersonationService } from '@/services/admin-impersonation.service';
import { prisma } from '@/lib/prisma';

async function main() {
  const email = 'advogado@bidexpert.com.br';
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log(`Checking for user: ${user.id} (${user.fullName})`);

  const isAdmin = await adminImpersonationService.isAdmin(user.id.toString());
  console.log(`Is Admin? ${isAdmin}`);

  try {
    const lawyers = await adminImpersonationService.getImpersonatableLawyers(user.id.toString());
    console.log(`Lawyers found: ${lawyers.length}`);
    lawyers.forEach(l => console.log(`- ${l.fullName} (${l.email})`));
  } catch (error) {
    console.error('Error fetching lawyers:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
