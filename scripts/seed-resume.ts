import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Configuração do Faker
faker.seed(123); // Para resultados consistentes

// Nomes das etapas de seed
const SEED_STEPS = [
  'Configurações da Plataforma',
  'Tipos de Documentos',
  'Estados e Cidades',
  'Usuários e Permissões',
  'Comitentes',
  'Bancos e Contas Bancárias',
  'Ativos (Bens)',
  'Leilões e Lotes',
  'Lances',
  'Contratos',
  'Notificações',
  'Auditoria',
];

// Interface para o status de seeding
interface SeedStatus {
  id: number;
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date | null;
  completedAt: Date | null;
  error: string | null;
}

// Tabela para rastrear o status do seeding
const SEED_STATUS_TABLE = '_seed_status';

async function setupSeedTracking() {
  try {
    // Verifica se a tabela de status existe, se não, cria
    await prisma.$executeRaw(Prisma.sql`
      CREATE TABLE IF NOT EXISTS ${Prisma.raw(SEED_STATUS_TABLE)} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        step TEXT NOT NULL,
        status VARCHAR(20) NOT NULL,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        error TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Inicializa os status se não existirem
    for (const step of SEED_STEPS) {
      const exists = await prisma.$queryRaw(
        Prisma.sql`SELECT 1 FROM ${Prisma.raw(SEED_STATUS_TABLE)} WHERE step = ${step} LIMIT 1`
      ) as any[];

      if (exists.length === 0) {
        await prisma.$executeRaw(
          Prisma.sql`INSERT INTO ${Prisma.raw(SEED_STATUS_TABLE)} 
                    (step, status, started_at, completed_at, error)
                    VALUES (${step}, 'pending', NULL, NULL, NULL)`
        );
      }
    }
  } catch (error) {
    console.error('Erro ao configurar o rastreamento de status:', error);
  }
}

async function updateSeedStatus(step: string, status: 'pending' | 'in_progress' | 'completed' | 'failed', error: string | null = null) {
  const now = new Date();
  
  if (status === 'in_progress') {
    await prisma.$executeRaw(
      Prisma.sql`UPDATE ${Prisma.raw(SEED_STATUS_TABLE)}
                SET status = ${status}, 
                    started_at = ${now}, 
                    completed_at = NULL, 
                    error = NULL
                WHERE step = ${step}`
    );
  } else if (status === 'completed' || status === 'failed') {
    await prisma.$executeRaw(
      Prisma.sql`UPDATE ${Prisma.raw(SEED_STATUS_TABLE)}
                SET status = ${status}, 
                    completed_at = ${now}, 
                    error = ${error}
                WHERE step = ${step}`
    );
  }
}

async function getSeedStatus(step: string): Promise<SeedStatus | null> {
  const result = await prisma.$queryRaw(
    Prisma.sql`SELECT * FROM ${Prisma.raw(SEED_STATUS_TABLE)} WHERE step = ${step} LIMIT 1`
  ) as any[];
  
  return result.length > 0 ? result[0] : null;
}

async function isStepCompleted(step: string): Promise<boolean> {
  const status = await getSeedStatus(step);
  return status?.status === 'completed';
}

async function runSeedStep(step: string, stepFn: () => Promise<void>) {
  console.log(`\n🔍 Verificando etapa: ${step}`);
  
  // Verifica se a etapa já foi concluída
  if (await isStepCompleted(step)) {
    console.log(`✅ Etapa já concluída: ${step}`);
    return;
  }

  console.log(`🚀 Iniciando etapa: ${step}`);
  await updateSeedStatus(step, 'in_progress');

  try {
    await stepFn();
    await updateSeedStatus(step, 'completed');
    console.log(`✅ Etapa concluída com sucesso: ${step}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Erro na etapa: ${step}`, error);
    await updateSeedStatus(step, 'failed', errorMessage);
    throw error;
  }
}

// Implementação das funções de seed para cada etapa
async function seedPlatformSettings() {
  // Implementação existente do seedPlatformSettings
  // ...
}

async function seedDocumentTypes() {
  // Implementação existente do seedDocumentTypes
  // ...
}

// ... outras funções de seed ...

async function seedAuctionsAndLots() {
  // Implementação existente do seedAuctionsAndLots
  // ...
}

// ... outras funções de seed ...

async function main() {
  console.log('🚀 Iniciando processo de seeding com resiliência...');
  
  try {
    // Configura o rastreamento de status
    await setupSeedTracking();
    
    // Executa cada etapa de seed com verificação de status
    await runSeedStep('Configurações da Plataforma', seedPlatformSettings);
    await runSeedStep('Tipos de Documentos', seedDocumentTypes);
    await runSeedStep('Estados e Cidades', async () => {
      // Implementação para estados e cidades
    });
    await runSeedStep('Usuários e Permissões', async () => {
      // Implementação para usuários e permissões
    });
    await runSeedStep('Comitentes', async () => {
      // Implementação para comitentes
    });
    await runSeedStep('Bancos e Contas Bancárias', async () => {
      // Implementação para bancos e contas
    });
    await runSeedStep('Ativos (Bens)', async () => {
      // Implementação para ativos
    });
    await runSeedStep('Leilões e Lotes', seedAuctionsAndLots);
    
    // Outras etapas podem ser adicionadas aqui
    
    console.log('\n✨ Todas as etapas de seed foram concluídas com sucesso!');
  } catch (error) {
    console.error('\n❌ Ocorreu um erro durante o processo de seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
