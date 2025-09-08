
import Fastify from 'fastify';
import dotenv from 'dotenv';
import appRoutes from './routes';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

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
  contentSecurityPolicy: {
    directives: {
      defaultSrc: [`'self'`],
      styleSrc: [`'self'`, `'unsafe-inline'`],
      imgSrc: [`'self'`, 'data:'],
      scriptSrc: [`'self'`, `https://maps.googleapis.com`],
    },
  },
});
server.register(cors, {
  origin: process.env.WEB_APP_URL || 'http://localhost:9002', // URL do seu frontend Next.js
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});


// Registra as rotas da aplicação
server.register(appRoutes);

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Microservice is running at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
