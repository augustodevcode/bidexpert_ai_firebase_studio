
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Atualizando informações do Comitente Exemplo V2...');

    try {
        const seller = await prisma.seller.findFirst({
            where: {
                OR: [
                    { name: { contains: 'Comitente Exemplo V2' } },
                    { name: { contains: 'Vendedor Exemplar V2' } },
                    { slug: 'comitente-exemplo-v2' }
                ]
            }
        });

        if (!seller) {
            console.log('❌ Comitente não encontrado. Criando um novo...');

            const tenant = await prisma.tenant.findFirst();
            if (!tenant) throw new Error('Tenant não encontrado');

            const newSeller = await prisma.seller.create({
                data: {
                    name: 'Comitente Exemplo V2',
                    slug: 'comitente-exemplo-v2',
                    email: 'comitente.v2@bidexpert.com',
                    publicId: `SEL-${Date.now()}`,
                    tenantId: tenant.id,
                    description: "O Comitente Exemplo V2 é uma empresa líder no setor de leilões judiciais e extrajudiciais, com mais de 20 anos de experiência no mercado brasileiro. Especializada em ativos imobiliários e veículos de frota, garante transparência e segurança em todas as transações.",
                    website: 'https://comitente-exemplo.com.br'
                }
            });
            console.log('✅ Comitente criado:', newSeller.name);
        } else {
            const updatedSeller = await prisma.seller.update({
                where: { id: seller.id },
                data: {
                    description: "O Comitente Exemplo V2 é uma empresa líder no setor de leilões judiciais e extrajudiciais, com mais de 20 anos de experiência no mercado brasileiro. Especializada em ativos imobiliários e veículos de frota, garante transparência e segurança em todas as transações.",
                    website: 'https://comitente-exemplo.com.br'
                }
            });
            console.log('✅ Comitente atualizado:', updatedSeller.name);
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
