// src/routes.ts
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';

async function appRoutes(server: FastifyInstance, options: FastifyPluginOptions) {

  // Rota de Health Check
  server.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Exemplo de rota de negócio (será expandida depois)
  server.get('/api/v1/commission-rules', async (request: FastifyRequest, reply: FastifyReply) => {
    // Aqui virá a lógica de negócio extraída.
    return { 
        default_commission_rate: 0.05, // 5%
        rules: [
            { category: 'veiculos', rate: 0.06 },
            { category: 'imoveis', rate: 0.04 }
        ]
     };
  });
}

export default appRoutes;
