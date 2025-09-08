// apps/microservice/src/index.ts
import Fastify from 'fastify';
import dotenv from 'dotenv';
import appRoutes from './routes';
import checkoutRoutes from './routes/checkout.routes'; // Importar as novas rotas
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config({ path: '../../.env' });


const server = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Plugins de Segurança Essenciais
server.register(helmet, {
  contentSecurityPolicy: false, // Simplificado para o exemplo
});
server.register(cors, {
  origin: process.env.WEB_APP_URL || 'http://localhost:9002', // URL do seu frontend Next.js
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});


// Registra as rotas da aplicação
server.register(appRoutes);
server.register(checkoutRoutes, { prefix: '/api/v1/checkout'}); // Registrar rotas de checkout

const start = async () => {
  try {
    const port = process.env.MS_COMMISSION_PORT ? parseInt(process.env.MS_COMMISSION_PORT, 10) : 3001;
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Microservice is running at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
