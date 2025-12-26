
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'analista@lordland.com';
    const password = 'password123';
    const hashedPassword = await hash(password, 10);
    const roleName = 'AUCTION_ANALYST';

    console.log(`Checking/Creating user ${email}...`);

    // 1. Ensure Role Exists
    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
        role = await prisma.role.create({
            data: {
                name: roleName,
                nameNormalized: roleName.toLowerCase(),
                description: 'Auction Analyst Role',
                permissions: JSON.stringify(['manage_all']), // Simplify permissions for test
            }
        });
        console.log(`Created role ${roleName}`);
    }

    // 2. Ensure Tenant Exists
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) throw new Error('No tenant found');

    // 3. Upsert User
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
        user = await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        console.log('User updated.');
    } else {
        user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName: 'Analista Lordland',
                accountType: 'PHYSICAL',
                habilitationStatus: 'HABILITADO',
                avatarUrl: 'https://i.pravatar.cc/150?u=analista',
            }
        });
        console.log('User created.');
    }

    // 4. Ensure Links (Role & Tenant) manually to be safe
    // Role
    const userRole = await prisma.usersOnRoles.findFirst({
        where: { userId: user.id, roleId: role.id }
    });
    if (!userRole) {
        await prisma.usersOnRoles.create({
            data: { userId: user.id, roleId: role.id, assignedBy: 'system' }
        });
    }

    // Tenant
    const userTenant = await prisma.usersOnTenants.findFirst({
        where: { userId: user.id, tenantId: tenant.id }
    });
    if (!userTenant) {
        await prisma.usersOnTenants.create({
            data: { userId: user.id, tenantId: tenant.id, assignedBy: 'system' }
        });
    }

    console.log(`User ${email} ready with password: ${password}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
