/**
 * DIAGNÓSTICO DO AUCTION ANALYST
 * Verifica se o perfil do auction analyst foi criado corretamente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseAuctionAnalyst() {
  console.log('🔍 Diagnosticando perfil do Auction Analyst...\n');

  try {
    // 1. Verificar se o usuário existe
    const analystUser = await prisma.user.findFirst({
      where: { email: 'analista@lordland.com' },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        tenants: {
          include: {
            tenant: true
          }
        }
      }
    });

    if (!analystUser) {
      console.log('❌ Usuário analista não encontrado!');
      return;
    }

    console.log('👤 USUÁRIO ENCONTRADO:');
    console.log(`   Nome: ${analystUser.fullName}`);
    console.log(`   Email: ${analystUser.email}`);
    console.log(`   Status: ${analystUser.habilitationStatus}`);
    console.log('');

    // 2. Verificar roles associados
    console.log('🎯 ROLES ASSOCIADOS:');
    if (analystUser.roles.length === 0) {
      console.log('   ❌ Nenhuma role associada!');
    } else {
      analystUser.roles.forEach((userRole, index) => {
        console.log(`   ${index + 1}. ${userRole.role.name} (${userRole.role.nameNormalized})`);
        console.log(`      Permissões: ${JSON.stringify(userRole.role.permissions, null, 2)}`);
      });
    }
    console.log('');

    // 3. Verificar tenants associados
    console.log('🏢 TENANTS ASSOCIADOS:');
    if (analystUser.tenants.length === 0) {
      console.log('   ❌ Nenhum tenant associado!');
    } else {
      analystUser.tenants.forEach((userTenant, index) => {
        console.log(`   ${index + 1}. ${userTenant.tenant.name} (ID: ${userTenant.tenant.id})`);
      });
    }
    console.log('');

    // 4. Verificar se o role AUCTION_ANALYST existe
    const auctionAnalystRole = await prisma.role.findFirst({
      where: { nameNormalized: 'AUCTION_ANALYST' }
    });

    if (!auctionAnalystRole) {
      console.log('❌ Role AUCTION_ANALYST não encontrada no banco!');
    } else {
      console.log('✅ ROLE AUCTION_ANALYST ENCONTRADA:');
      console.log(`   Nome: ${auctionAnalystRole.name}`);
      console.log(`   Nome Normalizado: ${auctionAnalystRole.nameNormalized}`);
      console.log(`   Descrição: ${auctionAnalystRole.description}`);
      console.log(`   Permissões: ${JSON.stringify(auctionAnalystRole.permissions, null, 2)}`);
    }

    console.log('\n✅ Diagnóstico concluído!');

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseAuctionAnalyst();