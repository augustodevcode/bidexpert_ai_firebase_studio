
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        take: 10,
        include: {
            roles: {
                include: {
                    role: true
                }
            }
        }
    });

    console.log('--- USERS LIST ---');
    users.forEach(u => {
        const roles = u.roles.map(r => r.role.name).join(', ');
        console.log(`Email: ${u.email} | Roles: ${roles}`);
    });
    console.log('------------------');
    await prisma.$disconnect();
}
main();
