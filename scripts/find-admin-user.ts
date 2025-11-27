import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n👤 BUSCANDO USUÁRIOS ADMINISTRADORES...\n');
  
  // Buscar usuários com role ADMIN no Tenant 1
  const adminUsers = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          role: {
            name: 'ADMIN'
          }
        }
      },
      tenants: {
        some: {
          tenantId: 1
        }
      }
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      createdAt: true,
      roles: {
        include: {
          role: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (adminUsers.length === 0) {
    console.log('⚠️  Nenhum usuário com role ADMIN encontrado no Tenant 1\n');
  } else {
    console.log(`✅ ${adminUsers.length} usuário(s) ADMIN encontrado(s):\n`);
    
    adminUsers.forEach((user, index) => {
      const roles = user.roles.map(r => r.role.name).join(', ');
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Nome: ${user.fullName}`);
      console.log(`   Roles: ${roles}`);
      console.log(`   Senha: Test@12345 (padrão do seed)`);
      console.log(`   Criado: ${user.createdAt}`);
      console.log('');
    });
  }

  // Buscar também usuários LEILOEIRO que podem ter privilégios administrativos
  const leiloeiroUsers = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          role: {
            name: 'LEILOEIRO'
          }
        }
      },
      tenants: {
        some: {
          tenantId: 1
        }
      }
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      roles: {
        include: {
          role: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });

  if (leiloeiroUsers.length > 0) {
    console.log('\n📋 LEILOEIROS (podem ter acesso administrativo):\n');
    leiloeiroUsers.forEach((user, index) => {
      const roles = user.roles.map(r => r.role.name).join(', ');
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Nome: ${user.fullName}`);
      console.log(`   Roles: ${roles}`);
      console.log(`   Senha: Test@12345`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
