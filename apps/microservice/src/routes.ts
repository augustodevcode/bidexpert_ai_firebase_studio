// apps/microservice/src/routes.ts
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { PlatformSettingsService } from '@bidexpert/services'; // Importar o serviço

async function appRoutes(server: FastifyInstance, options: FastifyPluginOptions) {

  const settingsService = new PlatformSettingsService();

  // Rota de Health Check
  server.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Rota de negócio para regras de comissão
  server.get('/api/v1/commission-rules', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const settings = await settingsService.getSettings();
        const commissionRate = (settings?.paymentGatewaySettings?.platformCommissionPercentage || 5) / 100;
        
        // No futuro, poderíamos ter regras mais complexas aqui (ex: por categoria, por valor)
        const rules = [
            { for: 'all', rate: commissionRate }
        ];

        return { 
            default_commission_rate: commissionRate,
            rules: rules
        };
    } catch(error: any) {
        request.log.error("Failed to retrieve commission rules:", error);
        reply.status(500).send({ error: "Internal Server Error", message: "Could not retrieve commission rules."})
    }
  });
}

export default appRoutes;
