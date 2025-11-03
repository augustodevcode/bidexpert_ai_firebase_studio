import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database initialization...');

    // Create default tenant
    const defaultTenant = await prisma.tenant.upsert({
      where: { id: 1 },
      update: {
        name: 'Default Tenant',
        subdomain: 'default',
      },
      create: {
        id: 1,
        name: 'Default Tenant',
        subdomain: 'default',
      },
    });

    console.log('Default tenant created/updated:', defaultTenant);

    // Create platform settings for the tenant
    const platformSettings = await prisma.platformSettings.upsert({
      where: { tenantId: 1 },
      update: {
        isSetupComplete: true,
      },
      create: {
        tenantId: 1,
        isSetupComplete: true,
      },
    });

    console.log('Platform settings created/updated:', platformSettings);

    // Create default admin user if not exists
    const hashedPassword = await hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        fullName: 'Admin User',
        accountType: 'PHYSICAL',
        habilitationStatus: 'HABILITADO',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('Admin user created/updated:', adminUser);

    // Assign admin role to the user
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        nameNormalized: 'ADMIN',
        description: 'Administrator with full access',
        permissions: JSON.stringify(['*']),
      },
    });

    console.log('Admin role created/updated:', adminRole);

    // Assign admin role to the admin user
    await prisma.usersOnRoles.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
        assignedAt: new Date(),
        assignedBy: 'system',
      },
    });

    // Assign user to tenant
    await prisma.usersOnTenants.upsert({
      where: { userId_tenantId: { userId: adminUser.id, tenantId: defaultTenant.id } },
      update: {},
      create: {
        userId: adminUser.id,
        tenantId: defaultTenant.id,
        assignedAt: new Date(),
        assignedBy: 'system',
      },
    });

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
