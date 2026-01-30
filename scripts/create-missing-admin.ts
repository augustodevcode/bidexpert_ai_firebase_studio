
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Ensuring admin@bidexpert.ai exists...');
  try {
    const password = 'senha@123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 1. Ensure Tenant exists (ID 1)
    const tenant = await prisma.tenant.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            name: 'BidExpert Demo Environment',
            subdomain: 'demo',
            domain: 'demo.bidexpert.ai' // Example
        }
    });

    // 2. Ensure Role exists
    const role = await prisma.role.findFirst({
        where: { name: 'ADMIN' }
    });
    
    if (!role) {
        console.error('Role ADMIN not found. Cannot create admin user correctly without role.');
        return;
    }

    // 3. Upsert User
    const user = await prisma.user.upsert({
      where: { email: 'admin@bidexpert.ai' },
      update: {
          password: hashedPassword,
          habilitationStatus: 'HABILITADO'
      },
      create: {
        email: 'admin@bidexpert.ai',
        password: hashedPassword,
        fullName: 'Admin BidExpert AI',
        cpf: '00000000000',
        habilitationStatus: 'HABILITADO',
        accountType: 'PHYSICAL'
      }
    });

    console.log(`User admin@bidexpert.ai upserted with ID: ${user.id}`);

    // 4. Link to Role
    const userRole = await prisma.usersOnRoles.findUnique({
        where: {
            userId_roleId: {
                userId: user.id,
                roleId: role.id
            }
        }
    });

    if (!userRole) {
        await prisma.usersOnRoles.create({
            data: {
                userId: user.id,
                roleId: role.id,
                assignedBy: 'fix-script'
            }
        });
        console.log('Linked to ADMIN role.');
    } else {
        console.log('Already linked to ADMIN role.');
    }

    // 5. Link to Tenant
    const userTenant = await prisma.usersOnTenants.findUnique({
         where: {
             userId_tenantId: {
                 userId: user.id,
                 tenantId: tenant.id
             }
         }
    });

    if (!userTenant) {
        await prisma.usersOnTenants.create({
            data: {
                userId: user.id,
                tenantId: tenant.id,
                assignedBy: 'fix-script',
                assignedAt: new Date()
            }
        });
        console.log('Linked to Tenant 1.');
    } else {
        console.log('Already linked to Tenant 1.');
    }

    console.log(`SUCCESS: User admin@bidexpert.ai is ready. Password: ${password}`);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
