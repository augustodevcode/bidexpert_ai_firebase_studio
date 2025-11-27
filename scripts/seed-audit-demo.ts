// seed-audit-demo.ts
// Script para criar logs de exemplo para a demo
// Executar: npx tsx seed-audit-demo.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Criando logs de auditoria de exemplo...\n');

  // Buscar primeiro usuário e leilão para usar como exemplo
  const user = await prisma.user.findFirst();
  const auction = await prisma.auction.findFirst();

  if (!user || !auction) {
    console.error('❌ Precisa ter pelo menos 1 usuário e 1 leilão no banco');
    return;
  }

  console.log(`✅ Usuário: ${user.email}`);
  console.log(`✅ Leilão: ${auction.title}\n`);

  // Log 1: Criação do leilão
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      tenantId: auction.tenantId,
      entityType: 'Auction',
      entityId: auction.id,
      action: 'CREATE',
      changes: {
        after: {
          title: auction.title,
          description: auction.description,
          status: auction.status,
        },
      },
      metadata: {
        userEmail: user.email,
        reason: 'Criação inicial do leilão',
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
    },
  });
  console.log('✅ Log 1: Criação do leilão');

  // Log 2: Primeira edição
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      tenantId: auction.tenantId,
      entityType: 'Auction',
      entityId: auction.id,
      action: 'UPDATE',
      changes: {
        before: {
          title: auction.title,
          description: 'Descrição antiga que foi alterada',
        },
        after: {
          title: auction.title,
          description: auction.description,
        },
      },
      metadata: {
        userEmail: user.email,
        reason: 'Atualização de descrição conforme orientação do tribunal',
      },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 dias atrás
    },
  });
  console.log('✅ Log 2: Atualização de descrição');

  // Log 3: Mudança de status
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      tenantId: auction.tenantId,
      entityType: 'Auction',
      entityId: auction.id,
      action: 'UPDATE',
      changes: {
        before: {
          status: 'RASCUNHO',
        },
        after: {
          status: 'EM_PREPARACAO',
        },
      },
      metadata: {
        userEmail: user.email,
        reason: 'Leilão pronto para preparação',
      },
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
    },
  });
  console.log('✅ Log 3: Mudança de status');

  // Log 4: Publicação
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      tenantId: auction.tenantId,
      entityType: 'Auction',
      entityId: auction.id,
      action: 'PUBLISH',
      changes: {
        before: {
          status: 'EM_PREPARACAO',
          isPublished: false,
        },
        after: {
          status: 'EM_BREVE',
          isPublished: true,
        },
      },
      metadata: {
        userEmail: user.email,
        reason: 'Publicação aprovada pelo tribunal',
        approvedBy: 'Dr. João da Silva - Juiz Titular',
      },
      ipAddress: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
    },
  });
  console.log('✅ Log 4: Publicação');

  // Log 5: Edição recente (título)
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      tenantId: auction.tenantId,
      entityType: 'Auction',
      entityId: auction.id,
      action: 'UPDATE',
      changes: {
        before: {
          title: 'Leilão de Imóveis - Antigo Título',
        },
        after: {
          title: auction.title,
        },
      },
      metadata: {
        userEmail: user.email,
        reason: 'Adequação do título conforme SEO',
      },
      ipAddress: '192.168.1.104',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
    },
  });
  console.log('✅ Log 5: Edição de título');

  console.log('\n✅ SUCESSO! 5 logs de auditoria criados.');
  console.log(`\n🌐 Ver histórico em: http://localhost:3000/admin/auctions/${auction.id}/history`);
  console.log(`📊 API: http://localhost:3000/api/audit?entityType=Auction&entityId=${auction.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
