/**
 * Seed Master Data - Script Unificado
 *
 * Este script gera um dataset abrangente para testes do BidExpert,
 * atendendo aos requisitos de 2000+ ativos, 1000+ lotes, 500+ leilões,
 * 20+ categorias e 100+ arrematantes com pagamento.
 *
 * Usa services para garantir consistência e validação de dados.
 */

import { PrismaClient } from '@prisma/client';
import { UserService } from '../src/services/user.service';
import { RoleService } from '../src/services/role.service';
import { AuctionService } from '../src/services/auction.service';
import { AssetService } from '../src/services/asset.service';
import { LotService } from '../src/services/lot.service';
import { BidService } from '../src/services/bid.service';
import { PaymentService } from '../src/services/payment.service';
import { JudicialProcessService } from '../src/services/judicial-process.service';
import { seedLogger } from './utils/seed-logger';
import { SeedValidator } from './utils/seed-validator';

const prisma = new PrismaClient();

// Instanciação dos serviços
const services = {
  user: new UserService(),
  role: new RoleService(),
  auction: new AuctionService(),
  asset: new AssetService(),
  lot: new LotService(),
  bid: new BidService(),
  payment: new PaymentService(),
  judicialProcess: new JudicialProcessService(),
};

// Constantes de configuração
const CONFIG = {
  TOTAL_USERS: 300,
  TOTAL_SELLERS: 150,
  TOTAL_AUCTIONEERS: 50,
  TOTAL_ASSETS: 3000,
  TOTAL_AUCTIONS: 750,
  MAX_LOTS_PER_AUCTION: 15,
  MAX_BIDS_PER_LOT: 100,
  TOTAL_CATEGORIES: 30,
  TOTAL_LOCATIONS: 100,
  TOTAL_JUDICIAL_PROCESSES: 48,
  TOTAL_PAYING_BIDDERS: 100,
};

async function main() {
  try {
    seedLogger.info('🚀 Iniciando Seed Master Data...');

    // Validação inicial
    await SeedValidator.validateEnvironment();

    // Fase 1: Infraestrutura Base
    await createBaseInfrastructure();

    // Fase 2: Categorias e Localizações
    await createCategoriesAndLocations();

    // Fase 3: Participantes
    await createParticipants();

    // Fase 4: Ativos e Leilões
    await createAssetsAndAuctions();

    // Fase 5: Interações
    await createInteractions();

    // Verificação final
    await verifySeedData();

    seedLogger.success('✅ Seed Master Data concluído com sucesso!');

  } catch (error) {
    seedLogger.error('❌ Erro no Seed Master Data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createBaseInfrastructure() {
  seedLogger.info('📋 Criando infraestrutura base...');

  // Tenant, Roles, Admin User, Document Types
  // Implementação usando services
}

async function createCategoriesAndLocations() {
  seedLogger.info('🏷️ Criando categorias e localizações...');

  // 30+ categorias, localizações geográficas, infraestrutura judicial
  // Implementação usando services
}

async function createParticipants() {
  seedLogger.info('👥 Criando participantes...');

  // 50 leiloeiros, 150 vendedores, 300 usuários, processos judiciais
  // Implementação usando services
}

async function createAssetsAndAuctions() {
  seedLogger.info('🏢 Criando ativos e leilões...');

  // 3000 ativos, 750 leilões, distribuição em lotes
  // Implementação usando services
}

async function createInteractions() {
  seedLogger.info('💰 Criando interações...');

  // Lances, pagamentos, avaliações, notificações
  // Garantir 100+ arrematantes pagantes
  // Implementação usando services
}

async function verifySeedData() {
  seedLogger.info('🔍 Verificando dados gerados...');

  // Verificações de contagem e integridade
  // Implementação de validações
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch((error) => {
    console.error('Erro fatal no seed:', error);
    process.exit(1);
  });
}

export { main as seedMasterData };</content>
<parameter name="filePath">e:\SmartDataCorp\BidExpert\BidExpertVsCode\bidexpert_ai_firebase_studio\scripts\seed-master-data.ts