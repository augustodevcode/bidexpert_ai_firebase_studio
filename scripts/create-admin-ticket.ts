
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- TESTE DE CRIAÇÃO DE TICKET PELO ADMIN ---');

  // 1. Buscar o usuário admin
  const adminEmail = 'test.leiloeiro@bidexpert.com';
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { 
      tenants: {
        include: { tenant: true }
      }
    }
  });

  if (!adminUser) {
    console.error('❌ Usuário admin não encontrado.');
    return;
  }

  console.log(`👤 Admin encontrado: ${adminUser.email} (ID: ${adminUser.id})`);
  const tenantId = adminUser.tenants[0]?.tenantId;
  console.log(`   Tenant Principal: ${tenantId}`);

  // 2. Criar um ticket como se fosse o admin
  const ticketTitle = 'Teste Admin Ticket ' + Date.now();
  const ticket = await prisma.iTSM_Ticket.create({
    data: {
      publicId: `TICKET-ADMIN-${Date.now()}`,
      userId: adminUser.id,
      title: ticketTitle,
      description: 'Este é um ticket criado diretamente pelo admin para testar visibilidade.',
      category: 'TECNICO',
      priority: 'ALTA',
      status: 'ABERTO',
      userSnapshot: {
        email: adminUser.email,
        fullName: adminUser.fullName,
        tenantId: tenantId?.toString()
      }
    }
  });

  console.log(`✅ Ticket criado com sucesso! ID: ${ticket.id} | PublicID: ${ticket.publicId}`);

  // 3. Simular a query que o painel admin faz
  // O painel admin provavelmente filtra por tenant implicitamente ou explicitamente?
  // Vamos ver se conseguimos buscar esse ticket usando o prisma client padrão (que não tem filtro de tenant automático, a menos que seja via extensão que não vimos)
  
  const foundTicket = await prisma.iTSM_Ticket.findUnique({
    where: { id: ticket.id }
  });

  if (foundTicket) {
    console.log('✅ Ticket encontrado via busca direta.');
  } else {
    console.log('❌ Ticket NÃO encontrado via busca direta.');
  }

  // 4. Verificar associação de Tenant
  // O modelo ITSM_Ticket NÃO tem campo tenantId direto no schema que vimos anteriormente.
  // Ele se relaciona com User.
  // Se o painel admin filtra tickets "do tenant", ele deve fazer um join com User -> Tenants.
  
  console.log('\n--- VERIFICAÇÃO DE RELACIONAMENTO ---');
  const ticketWithUser = await prisma.iTSM_Ticket.findUnique({
    where: { id: ticket.id },
    include: {
      user: {
        include: {
          tenants: true
        }
      }
    }
  });

  if (ticketWithUser) {
    console.log(`Ticket User ID: ${ticketWithUser.userId}`);
    console.log(`Ticket User Tenants: ${ticketWithUser.user.tenants.map(t => t.tenantId).join(', ')}`);
    
    const adminTenantId = adminUser.tenants[0].tenantId;
    const isMatch = ticketWithUser.user.tenants.some(t => t.tenantId === adminTenantId);
    
    if (isMatch) {
      console.log('✅ O criador do ticket pertence ao mesmo tenant do admin.');
    } else {
      console.log('❌ O criador do ticket NÃO pertence ao tenant do admin.');
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
