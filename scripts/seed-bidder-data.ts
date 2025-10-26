// scripts/seed-bidder-data.ts
/**
 * @fileoverview Script para popular dados de teste do bidder dashboard
 * Cria dados fictícios para testar todas as funcionalidades do painel do arrematante
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding bidder dashboard data...');

  // Buscar usuários existentes
  const users = await prisma.user.findMany({
    take: 10
  });

  if (users.length === 0) {
    console.log('❌ No users found. Please create users first.');
    return;
  }

  // Criar perfis de bidder para alguns usuários
  for (const user of users.slice(0, 5)) {
    console.log(`Creating bidder profile for user ${user.email}...`);

    try {
      // Criar perfil do bidder
      const bidderProfile = await prisma.bidderProfile.create({
        data: {
          userId: BigInt(user.id),
          fullName: user.fullName || `Usuário ${user.id}`,
          cpf: `123.456.789-${String(user.id).padStart(2, '0')}`,
          phone: `(11) 99999-99${String(user.id).padStart(2, '0')}`,
          dateOfBirth: new Date(1990, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          address: `Rua das Flores, ${Math.floor(Math.random() * 1000)}`,
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          documentStatus: Math.random() > 0.3 ? 'APPROVED' : 'PENDING',
          emailNotifications: true,
          smsNotifications: Math.random() > 0.5,
          isActive: true
        }
      });

      console.log(`✅ Created bidder profile: ${bidderProfile.id}`);

      // Criar lotes arrematados
      const wonLotsCount = Math.floor(Math.random() * 8) + 1;
      for (let i = 0; i < wonLotsCount; i++) {
        const wonLot = await prisma.wonLot.create({
          data: {
            bidderId: bidderProfile.id,
            lotId: BigInt(Math.floor(Math.random() * 1000) + 1),
            auctionId: BigInt(Math.floor(Math.random() * 100) + 1),
            title: `Lote ${String(Math.floor(Math.random() * 1000)).padStart(3, '0')} - ${['Veículo', 'Imóvel', 'Máquina', 'Equipamento'][Math.floor(Math.random() * 4)]}`,
            finalBid: new Decimal((Math.random() * 50000) + 1000),
            wonAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
            status: Math.random() > 0.8 ? 'CANCELLED' : 'WON',
            paymentStatus: ['PENDENTE', 'PAGO', 'ATRASADO'][Math.floor(Math.random() * 3)] as any,
            totalAmount: new Decimal(0), // Will be calculated
            paidAmount: new Decimal(0),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            deliveryStatus: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'][Math.floor(Math.random() * 4)] as any,
            trackingCode: Math.random() > 0.5 ? `BR${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}` : null,
            invoiceUrl: Math.random() > 0.3 ? `https://storage.example.com/invoices/${bidderProfile.id}-${i}.pdf` : null,
            receiptUrl: Math.random() > 0.3 ? `https://storage.example.com/receipts/${bidderProfile.id}-${i}.pdf` : null
          }
        });

        // Atualizar totalAmount baseado no finalBid + taxas
        const totalAmount = wonLot.finalBid.mul(1.05); // 5% de taxas
        await prisma.wonLot.update({
          where: { id: wonLot.id },
          data: { totalAmount }
        });

        console.log(`  ✅ Created won lot: ${wonLot.title}`);
      }

      // Criar métodos de pagamento
      const paymentMethodsCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < paymentMethodsCount; i++) {
        const paymentMethod = await prisma.paymentMethod.create({
          data: {
            bidderId: bidderProfile.id,
            type: ['CREDIT_CARD', 'PIX', 'BOLETO'][Math.floor(Math.random() * 3)] as any,
            isDefault: i === 0, // Primeiro é padrão
            cardLast4: Math.random() > 0.5 ? String(Math.floor(Math.random() * 10000)).padStart(4, '0') : null,
            cardBrand: Math.random() > 0.5 ? ['VISA', 'MASTERCARD', 'ELO'][Math.floor(Math.random() * 3)] : null,
            cardToken: Math.random() > 0.5 ? `token_${String(Math.floor(Math.random() * 1000000000))}` : null,
            pixKey: Math.random() > 0.5 ? `${String(Math.floor(Math.random() * 100000000000))}` : null,
            pixKeyType: Math.random() > 0.5 ? ['CPF', 'EMAIL', 'PHONE', 'RANDOM'][Math.floor(Math.random() * 4)] : null,
            isActive: true,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 ano
          }
        });

        console.log(`  ✅ Created payment method: ${paymentMethod.type}`);
      }

      // Criar histórico de participações
      const participationsCount = Math.floor(Math.random() * 15) + 5;
      for (let i = 0; i < participationsCount; i++) {
        const participation = await prisma.participationHistory.create({
          data: {
            bidderId: bidderProfile.id,
            lotId: BigInt(Math.floor(Math.random() * 1000) + 1),
            auctionId: BigInt(Math.floor(Math.random() * 100) + 1),
            title: `Lote ${String(Math.floor(Math.random() * 1000)).padStart(3, '0')} - Item ${i + 1}`,
            auctionName: `Leilão ${String(Math.floor(Math.random() * 50) + 1)}`,
            maxBid: new Decimal((Math.random() * 30000) + 500),
            finalBid: new Decimal((Math.random() * 40000) + 1000),
            result: ['WON', 'LOST', 'WITHDRAWN'][Math.floor(Math.random() * 3)] as any,
            participatedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Últimos 90 dias
            bidCount: Math.floor(Math.random() * 20) + 1
          }
        });

        console.log(`  ✅ Created participation: ${participation.title} (${participation.result})`);
      }

      // Criar notificações
      const notificationsCount = Math.floor(Math.random() * 10) + 3;
      for (let i = 0; i < notificationsCount; i++) {
        const notification = await prisma.bidderNotification.create({
          data: {
            bidderId: bidderProfile.id,
            type: ['AUCTION_WON', 'PAYMENT_DUE', 'DOCUMENT_APPROVED', 'DELIVERY_UPDATE'][Math.floor(Math.random() * 4)] as any,
            title: ['Arremate Ganho!', 'Pagamento Pendente', 'Documento Aprovado', 'Entrega a Caminho'][Math.floor(Math.random() * 4)],
            message: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. ${i + 1}`,
            data: { someData: `value_${i}` },
            isRead: Math.random() > 0.5,
            readAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          }
        });

        console.log(`  ✅ Created notification: ${notification.title}`);
      }

      console.log(`✅ Completed bidder profile for ${user.email}`);
      console.log('');

    } catch (error) {
      console.error(`❌ Error creating bidder profile for user ${user.email}:`, error);
    }
  }

  // Criar algumas notificações globais de sistema
  const systemNotifications = [
    {
      type: 'SYSTEM_UPDATE',
      title: 'Manutenção Programada',
      message: 'Sistema estará em manutenção das 02:00 às 04:00 do dia 15/11/2025.'
    },
    {
      type: 'AUCTION_ENDING',
      title: 'Leilão Encerrando em Breve',
      message: 'O Leilão #1234 encerrará em 2 horas. Não perca a oportunidade!'
    },
    {
      type: 'DOCUMENT_APPROVED',
      title: 'Documentação Aprovada',
      message: 'Seus documentos foram analisados e aprovados com sucesso.'
    }
  ];

  for (const user of users.slice(0, 3)) {
    const bidderProfile = await prisma.bidderProfile.findUnique({
      where: { userId: BigInt(user.id) }
    });

    if (bidderProfile) {
      for (const notif of systemNotifications) {
        await prisma.bidderNotification.create({
          data: {
            bidderId: bidderProfile.id,
            ...notif,
            isRead: Math.random() > 0.7
          }
        });
      }
    }
  }

  console.log('🎉 Bidder dashboard seeding completed!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - Created ${users.slice(0, 5).length} bidder profiles`);
  console.log(`   - Generated won lots, payment methods, participation history, and notifications`);
  console.log(`   - All data is randomized for realistic testing`);
  console.log('');
  console.log('🚀 You can now:');
  console.log('   1. Access the bidder dashboard at /dashboard');
  console.log('   2. Test the admin impersonation at /admin/bidder-impersonation');
  console.log('   3. Run the bidder dashboard tests');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding bidder data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
