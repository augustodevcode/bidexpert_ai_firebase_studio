import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenants = await prisma.tenant.findMany();
    console.log('--- TENANTS ---');
    console.log(JSON.stringify(tenants, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

    const users = await prisma.user.findMany({
        include: {
            roles: { include: { role: true } },
            tenants: { include: { tenant: true } }
        }
    });
    console.log('--- USERS ---');
    console.log(JSON.stringify(users, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

    const roles = await prisma.role.findMany();
    console.log('--- ROLES ---');
    console.log(JSON.stringify(roles, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
