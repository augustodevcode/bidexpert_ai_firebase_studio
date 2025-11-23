import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 VERIFICANDO ASSOCIAÇÕES USUÁRIO-TENANT\n');
  
  // Buscar usuários criados e suas associações com tenants
  const users = await prisma.user.findMany({
    where: {
      email: {
        contains: '1763696926849'
      }
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      tenants: {
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true,
              _count: {
                select: {
                  auctions: true,
                  lots: true
                }
              }
            }
          }
        }
      },
      roles: {
        include: {
          role: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  console.log('👥 USUÁRIOS E SEUS TENANTS:\n');
  users.forEach((user, index) => {
    const roles = user.roles.map(r => r.role.name).join(', ');
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   Nome: ${user.fullName}`);
    console.log(`   Roles: ${roles}`);
    console.log(`   Tenants associados: ${user.tenants.length}`);
    
    user.tenants.forEach((ut, i) => {
      console.log(`   ${i + 1}. Tenant ID: ${ut.tenant.id} - ${ut.tenant.name}`);
      console.log(`      Subdomain: ${ut.tenant.subdomain}`);
      console.log(`      Leilões: ${ut.tenant._count.auctions} | Lotes: ${ut.tenant._count.lots}`);
    });
    console.log('');
  });

  // Verificar se há usuários sem tenant
  const usersWithoutTenant = await prisma.user.findMany({
    where: {
      email: {
        contains: '1763696926849'
      },
      tenants: {
        none: {}
      }
    },
    select: {
      id: true,
      email: true,
      fullName: true
    }
  });

  if (usersWithoutTenant.length > 0) {
    console.log('\n⚠️  USUÁRIOS SEM TENANT ASSOCIADO:\n');
    usersWithoutTenant.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
    });
    console.log('');
  } else {
    console.log('\n✅ Todos os usuários têm pelo menos um tenant associado\n');
  }

  // Verificar tenant padrão
  const defaultTenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { subdomain: 'default' },
        { id: 1 }
      ]
    },
    include: {
      _count: {
        select: {
          users: true,
          auctions: true,
          lots: true
        }
      }
    }
  });

  if (defaultTenant) {
    console.log('\n📋 TENANT PADRÃO DO SISTEMA:\n');
    console.log(`ID: ${defaultTenant.id}`);
    console.log(`Nome: ${defaultTenant.name}`);
    console.log(`Subdomain: ${defaultTenant.subdomain}`);
    console.log(`Usuários: ${defaultTenant._count.users}`);
    console.log(`Leilões: ${defaultTenant._count.auctions}`);
    console.log(`Lotes: ${defaultTenant._count.lots}`);
    console.log('');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
