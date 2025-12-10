
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@bidexpert.com.br';
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Creating/Updating admin user: ${email}`);

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
        console.log('User exists, updating password...');
        user = await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
    } else {
        console.log('Creating new user...');
        user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName: 'Administrador',
                cpf: '00000000000',
                accountType: 'PHYSICAL',
                habilitationStatus: 'HABILITADO',
            },
        });
    }

    // Assign ADMIN role
    // Try to find role by name or normalized name
    const adminRole = await prisma.role.findFirst({
        where: {
            OR: [
                { name: 'ADMIN' },
                { nameNormalized: 'ADMIN' },
                { nameNormalized: 'ADMINISTRATOR' }
            ]
        }
    });

    if (adminRole) {
        const userRole = await prisma.usersOnRoles.findUnique({
            where: { userId_roleId: { userId: user.id, roleId: adminRole.id } }
        });

        if (!userRole) {
            await prisma.usersOnRoles.create({
                data: {
                    userId: user.id,
                    roleId: adminRole.id,
                    assignedBy: 'system'
                }
            });
            console.log(`Role ${adminRole.name} assigned.`);
        }
    } else {
        console.log('WARNING: ADMIN role not found. Creating it...');
        const newRole = await prisma.role.create({
            data: {
                name: 'ADMIN',
                nameNormalized: 'ADMIN',
                description: 'Administrator',
                permissions: ['manage_all']
            }
        });
        await prisma.usersOnRoles.create({
            data: {
                userId: user.id,
                roleId: newRole.id,
                assignedBy: 'system'
            }
        });
        console.log('ADMIN role created and assigned.');
    }

    // Assign Tenant 1
    const tenant = await prisma.tenant.findFirst({ where: { id: 1 } });
    if (tenant) {
        const userTenant = await prisma.usersOnTenants.findUnique({
            where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } }
        });

        if (!userTenant) {
            await prisma.usersOnTenants.create({
                data: {
                    userId: user.id,
                    tenantId: tenant.id
                }
            });
            console.log('Tenant 1 assigned.');
        }
    }

    console.log(`✅ SUCCESS: User ${email} is ready with password: ${password}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
