
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Buscar o último ticket criado
  const lastTicket = await prisma.ticket.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { tenant: true }
  });

  // 2. Buscar o usuário admin que usamos
  const adminUser = await prisma.user.findUnique({
    where: { email: 'test.leiloeiro@bidexpert.com' },
    include: { 
      tenants: {
        include: { tenant: true }
      }
    }
  });

  console.log('--- ANÁLISE DE TENANT ---');
  
  if (lastTicket) {
    console.log(`🎫 Último Ticket (ID: ${lastTicket.id}):`);
    console.log(`   Título: ${lastTicket.title}`);
    console.log(`   Tenant ID: ${lastTicket.tenantId}`);
    console.log(`   Tenant Nome: ${lastTicket.tenant?.name || 'N/A'}`);
  } else {
    console.log('❌ Nenhum ticket encontrado.');
  }

  console.log('\n👤 Usuário Admin (test.leiloeiro@bidexpert.com):');
  if (adminUser) {
    adminUser.tenants.forEach(ut => {
      console.log(`   Tenant ID: ${ut.tenantId}`);
      console.log(`   Tenant Nome: ${ut.tenant.name}`);
      console.log(`   Roles: ${ut.roles?.join(', ') || 'N/A'}`); // Ajuste conforme seu schema real se roles estiverem aqui
    });
  } else {
    console.log('❌ Usuário admin não encontrado.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
