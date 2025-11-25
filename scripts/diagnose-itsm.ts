
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DIAGNÓSTICO DE TICKETS ITSM ---');

  // 1. Buscar todos os tickets
  const tickets = await prisma.iTSM_Ticket.findMany({
    orderBy: { createdAt: 'desc' },
    include: { 
      user: {
        include: {
          tenants: {
            include: { tenant: true }
          }
        }
      }
    }
  });

  console.log(`\n🎫 Total de Tickets encontrados: ${tickets.length}`);

  if (tickets.length === 0) {
    console.log('❌ Nenhum ticket encontrado no banco de dados.');
  } else {
    tickets.forEach(ticket => {
      console.log(`\n[Ticket ID: ${ticket.id} | PublicID: ${ticket.publicId}]`);
      console.log(`   Título: ${ticket.title}`);
      console.log(`   Status: ${ticket.status}`);
      console.log(`   Criado por User ID: ${ticket.userId}`);
      console.log(`   Email do Criador: ${ticket.user?.email || 'N/A'}`);
      
      const userTenants = ticket.user?.tenants.map(t => `${t.tenant.name} (ID: ${t.tenantId})`).join(', ');
      console.log(`   Tenants do Criador: ${userTenants || 'Nenhum'}`);
    });
  }

  // 2. Buscar o usuário admin que usamos no teste
  const adminEmail = 'test.leiloeiro@bidexpert.com';
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { 
      tenants: {
        include: { tenant: true }
      }
    }
  });

  console.log(`\n\n👤 Usuário Admin (${adminEmail}):`);
  if (adminUser) {
    console.log(`   ID: ${adminUser.id}`);
    adminUser.tenants.forEach(ut => {
      console.log(`   Tenant: ${ut.tenant.name} (ID: ${ut.tenantId})`);
    });
  } else {
    console.log('❌ Usuário admin não encontrado.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
