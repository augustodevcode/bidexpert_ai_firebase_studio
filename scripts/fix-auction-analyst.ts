/**
 * CORREÇÃO DO AUCTION ANALYST
 * Associa o usuário auction analyst ao role correto
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAuctionAnalyst() {
  console.log('🔧 Corrigindo perfil do Auction Analyst...\n');

  try {
    // 1. Buscar o usuário analista
    const analystUser = await prisma.user.findFirst({
      where: { email: 'analista@lordland.com' }
    });

    if (!analystUser) {
      console.log('❌ Usuário analista não encontrado!');
      return;
    }

    // 2. Buscar o role AUCTION_ANALYST
    const auctionAnalystRole = await prisma.role.findFirst({
      where: { nameNormalized: 'AUCTION_ANALYST' }
    });

    if (!auctionAnalystRole) {
      console.log('❌ Role AUCTION_ANALYST não encontrada!');
      return;
    }

    // 3. Buscar o tenant padrão (usar findFirst sem where específico)
    const defaultTenant = await prisma.tenant.findFirst();

    if (!defaultTenant) {
      console.log('❌ Tenant padrão não encontrado!');
      return;
    }

    // 4. Verificar se já existe associação com role
    const existingRoleAssociation = await prisma.usersOnRoles.findFirst({
      where: {
        userId: analystUser.id,
        roleId: auctionAnalystRole.id
      }
    });

    if (!existingRoleAssociation) {
      // Criar associação com role
      await prisma.usersOnRoles.create({
        data: {
          userId: analystUser.id,
          roleId: auctionAnalystRole.id,
          assignedBy: 'system',
        },
      });
      console.log('✅ Associação com role AUCTION_ANALYST criada!');
    } else {
      console.log('⚠️ Associação com role já existe');
    }

    // 5. Verificar se já existe associação com tenant
    const existingTenantAssociation = await prisma.usersOnTenants.findFirst({
      where: {
        userId: analystUser.id,
        tenantId: defaultTenant.id
      }
    });

    if (!existingTenantAssociation) {
      // Criar associação com tenant
      await prisma.usersOnTenants.create({
        data: {
          userId: analystUser.id,
          tenantId: defaultTenant.id,
          assignedBy: 'system',
        },
      });
      console.log('✅ Associação com tenant criada!');
    } else {
      console.log('⚠️ Associação com tenant já existe');
    }

    // 6. Verificar resultado final
    const updatedUser = await prisma.user.findFirst({
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

    console.log('\n📊 RESULTADO FINAL:');
    console.log(`👤 Usuário: ${updatedUser?.fullName}`);
    console.log(`🎯 Roles: ${updatedUser?.roles.length}`);
    updatedUser?.roles.forEach(r => console.log(`   - ${r.role.name}`));
    console.log(`🏢 Tenants: ${updatedUser?.tenants.length}`);
    updatedUser?.tenants.forEach(t => console.log(`   - ${t.tenant.name}`));

    console.log('\n🎉 CORREÇÃO CONCLUÍDA! O auction analyst agora tem acesso aos menus de admin.');

  } catch (error) {
    console.error('❌ Erro na correção:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAuctionAnalyst();