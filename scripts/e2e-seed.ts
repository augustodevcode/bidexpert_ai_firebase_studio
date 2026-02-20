import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedTestBots() {
    console.log('🔄 Iniciando Seed E2E Automático...');
    const passwordHash = await bcrypt.hash('Bot@123', 10);
    const adminHash = await bcrypt.hash('Admin@123', 10);

    try {
        // 1. Criar Role de Admin (se não existir)
        let adminRole = await prisma.role.findFirst({ where: { name: 'admin' } });
        if (!adminRole) {
            adminRole = await prisma.role.create({
                data: {
                    name: 'admin',
                    description: 'Administrator',
                    permissions: ['manage_all']
                }
            });
        }

        // 2. Criar Role de Bidder
        let bidderRole = await prisma.role.findFirst({ where: { name: 'bidder' } });
        if (!bidderRole) {
            bidderRole = await prisma.role.create({
                data: {
                    name: 'bidder',
                    description: 'Arrematante',
                    permissions: ['view_auctions', 'place_bids', 'view_lots']
                }
            });
        }

        // 3. Criar Admin Test
        const adminEmail = 'admin@bidexpert.com.br';
        let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

        if (!adminUser) {
            adminUser = await prisma.user.create({
                data: {
                    name: 'Admin BidExpert',
                    email: adminEmail,
                    password: adminHash,
                    cpfCnpj: '00000000001',
                    isActive: true,
                    emailVerified: new Date(),
                    UserOnRole: {
                        create: { roleId: adminRole.id }
                    }
                }
            });
            console.log('✅ Admin user created.');
        } else {
            console.log('✅ Admin user already exists.');
        }

        // 4. Criar 10 Arrematantes Bots
        for (let i = 1; i <= 10; i++) {
            const botEmail = `bot${i}@bidexpert.com.br`;
            const botCpf = `1111111111${i % 10}`;

            let botUser = await prisma.user.findUnique({ where: { email: botEmail } });

            if (!botUser) {
                await prisma.user.create({
                    data: {
                        name: `Arrematante Bot ${i}`,
                        email: botEmail,
                        password: passwordHash,
                        cpfCnpj: botCpf,
                        isActive: true,
                        emailVerified: new Date(),
                        UserOnRole: {
                            create: { roleId: bidderRole.id }
                        }
                    }
                });
                console.log(`✅ Bot ${i} created.`);
            } else {
                // Update password just to be sure it's Bot@123
                await prisma.user.update({
                    where: { email: botEmail },
                    data: { password: passwordHash }
                });
                console.log(`✅ Bot ${i} already exists, password reset.`);
            }
        }

    } catch (error) {
        console.error('Erro no seed E2E:', error);
    } finally {
        await prisma.$disconnect();
        console.log('🏁 Seed E2E finalizado.');
    }
}

seedTestBots();
