
import { lawyerDashboardService } from '@/services/lawyer-dashboard.service';
import { prisma } from '@/lib/prisma';

async function main() {
  const email = 'advogado@bidexpert.com.br';
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log(`User: ${user.fullName} (${user.id})`);
  
  const start = Date.now();
  try {
    console.log('Calling getOverview...');
    const overview = await lawyerDashboardService.getOverview(user.id.toString());
    const duration = Date.now() - start;
    console.log(`getOverview completed in ${duration}ms`);
    console.log('Metrics:', overview.metrics);
  } catch (error) {
    console.error('Error in getOverview:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
