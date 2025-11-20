
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'agent_v3@example.com';
  const password = await bcrypt.hash('Password123!', 10);
  
  try {
    // 1. Find Role
    const role = await prisma.role.findFirst({
        where: { name: 'COMPRADOR' }
    });

    if (!role) {
        throw new Error('Role COMPRADOR not found');
    }

    // 2. Find Tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        throw new Error('No tenant found');
    }

    // 3. Create User
    const user = await prisma.user.create({
      data: {
        email,
        password,
        fullName: 'Agent V3',
        cpf: '52998224725',
        accountType: 'PHYSICAL',
        habilitationStatus: 'PENDING_DOCUMENTS',
      },
    });
    console.log('User created:', user.id);

    // 4. Assign Role
    await prisma.usersOnRoles.create({
        data: {
            userId: user.id,
            roleId: role.id,
            assignedBy: 'system'
        }
    });
    console.log('Role assigned');

    // 5. Assign Tenant
    await prisma.usersOnTenants.create({
        data: {
            userId: user.id,
            tenantId: tenant.id
        }
    });
    console.log('Tenant assigned');

  } catch (e) {
    console.error('Error creating user:', e);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
