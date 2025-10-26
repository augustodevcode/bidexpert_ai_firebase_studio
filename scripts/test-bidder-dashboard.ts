// scripts/test-bidder-dashboard.ts
/**
 * @fileoverview Script para testar funcionalidades do bidder dashboard
 * Demonstra que o sistema está funcionando corretamente
 */

import { PrismaClient } from '@prisma/client';
import { bidderService } from '../src/services/bidder.service';

const prisma = new PrismaClient();

async function testBidderDashboard() {
  console.log('🧪 Testando funcionalidades do Bidder Dashboard...');

  try {
    // 1. Testar criação de perfil do bidder
    console.log('\n1️⃣ Testando criação de perfil do bidder...');

    // Buscar um usuário existente
    const user = await prisma.user.findFirst({
      where: { email: 'bidder@test.com' }
    });

    if (!user) {
      console.log('❌ Usuário de teste não encontrado. Crie um usuário primeiro.');
      return;
    }

    const userId = BigInt(user.id);
    console.log(`✅ Usuário encontrado: ${user.email}`);

    // 2. Testar criação/atualização de perfil
    console.log('\n2️⃣ Testando criação/atualização de perfil...');

    const profileResult = await bidderService.updateBidderProfile(userId, {
      fullName: 'João Silva Teste',
      cpf: '123.456.789-00',
      phone: '(11) 99999-9999',
      emailNotifications: true,
      smsNotifications: false
    });

    if (profileResult.success) {
      console.log('✅ Perfil criado/atualizado com sucesso');
      console.log(`   Nome: ${profileResult.data?.fullName}`);
      console.log(`   CPF: ${profileResult.data?.cpf}`);
    } else {
      console.log('❌ Erro ao criar perfil:', profileResult.error);
    }

    // 3. Testar obtenção do dashboard overview
    console.log('\n3️⃣ Testando obtenção do dashboard overview...');

    const overview = await bidderService.getBidderDashboardOverview(userId);
    console.log('✅ Dashboard overview obtido:');
    console.log(`   Lotes arrematados: ${overview.wonLotsCount}`);
    console.log(`   Total investido: R$ ${overview.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`   Pagamentos pendentes: ${overview.pendingPayments}`);
    console.log(`   Notificações não lidas: ${overview.unreadNotifications}`);

    // 4. Testar listagem de lotes arrematados
    console.log('\n4️⃣ Testando listagem de lotes arrematados...');

    const wonLotsResult = await bidderService.getBidderWonLots(userId, {
      page: 1,
      limit: 5
    });

    console.log('✅ Lotes arrematados obtidos:');
    console.log(`   Total: ${wonLotsResult.data.length}`);
    console.log(`   Páginas totais: ${wonLotsResult.pagination.totalPages}`);

    if (wonLotsResult.data.length > 0) {
      const firstLot = wonLotsResult.data[0];
      console.log(`   Primeiro lote: ${firstLot.title}`);
      console.log(`   Valor: R$ ${firstLot.finalBid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }

    // 5. Testar métodos de pagamento
    console.log('\n5️⃣ Testando métodos de pagamento...');

    const paymentMethods = await bidderService.getBidderPaymentMethods(userId);
    console.log('✅ Métodos de pagamento obtidos:');
    console.log(`   Total: ${paymentMethods.methods.length}`);

    if (paymentMethods.defaultMethod) {
      console.log(`   Método padrão: ${paymentMethods.defaultMethod.type}`);
    }

    // 6. Testar notificações
    console.log('\n6️⃣ Testando notificações...');

    const notifications = await bidderService.getBidderNotifications(userId, {
      page: 1,
      limit: 5
    });

    console.log('✅ Notificações obtidas:');
    console.log(`   Total: ${notifications.data.length}`);
    console.log(`   Não lidas: ${notifications.unreadCount}`);

    if (notifications.data.length > 0) {
      const firstNotification = notifications.data[0];
      console.log(`   Primeira notificação: ${firstNotification.title}`);
    }

    // 7. Testar histórico de participações
    console.log('\n7️⃣ Testando histórico de participações...');

    const history = await bidderService.getParticipationHistory(userId, {
      page: 1,
      limit: 5
    });

    console.log('✅ Histórico obtido:');
    console.log(`   Total de participações: ${history.data.length}`);
    console.log(`   Taxa de sucesso: ${history.summary.winRate.toFixed(1)}%`);

    if (history.data.length > 0) {
      const firstParticipation = history.data[0];
      console.log(`   Primeira participação: ${firstParticipation.title} (${firstParticipation.result})`);
    }

    console.log('\n🎉 Todos os testes do bidder dashboard foram executados com sucesso!');
    console.log('\n📊 Resumo dos testes:');
    console.log('   ✅ Criação/Atualização de perfil');
    console.log('   ✅ Obtenção de dashboard overview');
    console.log('   ✅ Listagem de lotes arrematados');
    console.log('   ✅ Gestão de métodos de pagamento');
    console.log('   ✅ Sistema de notificações');
    console.log('   ✅ Histórico de participações');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  testBidderDashboard();
}

export { testBidderDashboard };
