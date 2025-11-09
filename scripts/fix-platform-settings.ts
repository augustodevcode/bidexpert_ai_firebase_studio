import { prisma } from '@/lib/prisma';
import { PlatformSettingsService } from '../src/services/platform-settings.service';
import { MentalTriggerSettingsService } from '../src/services/mental-trigger-settings.service';
import { Tenant } from '@prisma/client';

const services = {
    platformSettings: new PlatformSettingsService(),
    mentalTriggerSettings: new MentalTriggerSettingsService()
};

async function main() {
    console.log("Iniciando correção das configurações de platform e mental triggers...");

    // Get all tenants
    const tenants = await prisma.tenant.findMany();

    for (const tenant of tenants) {
        console.log(`\nProcessando tenant ${tenant.id}...`);
        
        try {
            // First ensure we have platform settings
            const settings = await services.platformSettings.getSettings(tenant.id);
            console.log(`Configurações de plataforma encontradas/criadas para o tenant ${tenant.id}`);
            
            // Primeiro excluir qualquer configuração existente
            await prisma.mentalTriggerSettings.deleteMany({
                where: { platformSettingsId: BigInt(settings.id) }
            });

            // Agora criar uma nova configuração
            await prisma.mentalTriggerSettings.create({
                data: {
                    platformSettingsId: BigInt(settings.id),
                    showDiscountBadge: true,
                    showPopularityBadge: true,
                    popularityViewThreshold: 500,
                    showHotBidBadge: true,
                    hotBidThreshold: 10,
                    showExclusiveBadge: true
                }
            });
            console.log("Mental trigger settings configuradas com sucesso");
        } catch (error) {
            console.error(`Erro ao processar tenant ${tenant.id}:`, error);
        }
    }
    
    console.log("\nFinalizado!");
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });