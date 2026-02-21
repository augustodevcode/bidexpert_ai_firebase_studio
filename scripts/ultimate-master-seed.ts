/**
 * ULTIMATE MASTER SEED - Script Unificado e Canônico
 * ==========================================================
 * Este script consolida TODAS as estratégias de seed anteriores:
 * - seed-data-extended-v3.ts (Base da jornada completa)
 * - seed-populate-missing.ts (Dados complementares de veículos, mensagens, etc)
 * - seed-data-v4-improved.ts (Melhorias de estrutura)
 * 
 * OBJETIVO: Gerar um ambiente DE/HML rico, completo e robusto.
 * 
 * Características:
 * - Múltiplos tenants com configurações diferentes
 * - Usuários com vários roles
 * - Auctions de diferentes tipos
 * - Lotes com múltiplas categorias
 * - Lances e histórico de bidding
 * - Habilitações de usuários
 * - Transações seguras com tratamento de erros
 * - Dados globais (Veículos, ITSM, Logs)
 * 
 * COMPATIBILIDADE: MySQL e PostgreSQL
 * - Detecta automaticamente o tipo de banco via DATABASE_URL
 * - Usa helpers de query para compatibilidade cross-database
 */

import { 
  PrismaClient, Prisma, 
  itsm_tickets_status as ITSM_TicketStatus, 
  itsm_tickets_priority as ITSM_Priority, 
  itsm_tickets_category as ITSM_Category, 
  payment_methods_type as PaymentMethodType, 
  audit_logs_action as AuditAction, 
  AuctionStage_status as AuctionStageStatus, 
  bidder_notifications_type as BidderNotificationType, 
  DirectSaleOffer_offerType as DirectSaleOfferType, 
  DocumentTemplate_type as DocumentTemplateType, 
  participation_history_result as ParticipationResult, 
  form_submissions_status as SubmissionStatus, 
  UserDocument_status as UserDocumentStatus, 
  LotRisk_riskType as LotRiskType, 
  LotRisk_riskLevel as LotRiskLevel, 
  visitor_events_type as VisitorEventType, 
  validation_rules_type as ValidationType, 
  validation_rules_severity as ValidationSeverity, 
  TenantInvoice_status as InvoiceStatus 
} from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { seedWonLotsWithServices } from './seed-won-lots-lib';
import { seedMin50ZeroTables } from './seed-min-50-lib';
import { seedHabilitacoes } from './seed-habilitacoes-lib';

// =============================================================================
// DATABASE TYPE DETECTION - Compatibilidade MySQL/PostgreSQL
// =============================================================================
const DATABASE_URL = process.env.DATABASE_URL || '';
const IS_MYSQL = DATABASE_URL.includes('mysql://');
const IS_POSTGRES = DATABASE_URL.includes('postgres://') || DATABASE_URL.includes('postgresql://');
const DB_TYPE = IS_MYSQL ? 'MySQL' : IS_POSTGRES ? 'PostgreSQL' : 'Unknown';

// Log do tipo de banco detectado
console.log('\n' + '='.repeat(60));
console.log('🗄️  DATABASE TYPE DETECTION');
console.log('='.repeat(60));
console.log(`📌 Detected: ${DB_TYPE}`);
console.log(`📍 URL prefix: ${DATABASE_URL.substring(0, 30)}...`);
if (IS_POSTGRES) {
  console.log('ℹ️  PostgreSQL mode: Using insensitive string comparisons');
} else if (IS_MYSQL) {
  console.log('ℹ️  MySQL mode: Default collation handles case-insensitivity');
}
console.log('='.repeat(60) + '\n');

// =============================================================================
// CROSS-DATABASE TABLE CHECK HELPER
// =============================================================================
async function tableExists(prismaClient: PrismaClient, tableName: string): Promise<boolean> {
  try {
    if (IS_MYSQL) {
      const result = await prismaClient.$queryRawUnsafe(`SHOW TABLES LIKE '${tableName}'`);
      return (result as any[]).length > 0;
    } else if (IS_POSTGRES) {
      const result = await prismaClient.$queryRawUnsafe(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = '${tableName}'`
      );
      return (result as any[]).length > 0;
    }
    return false;
  } catch {
    return false;
  }
}

// =============================================================================
// Imports removed to avoid module resolution issues
// import { AuctionHabilitationService } from '../src/services/auction-habilitation.service';
// import { ContactMessageService } from '../src/services/contact-message.service';
// import { VehicleMakeService } from '../src/services/vehicle-make.service';
// import { VehicleModelService } from '../src/services/vehicle-model.service';

// Services instances removed
// const auctionHabilitationService = new AuctionHabilitationService();
// const contactMessageService = new ContactMessageService();
// const vehicleMakeService = new VehicleMakeService();
// const vehicleModelService = new VehicleModelService();

const prisma = new PrismaClient();

// =============================================================================
// DB COMPATIBILITY LAYER - Model Name Aliases
// =============================================================================
// PostgreSQL: model UserOnTenant mapeado para tabela "UsersOnTenants"
// MySQL: model usersOnTenants para tabela "usersOnTenants"
// Ambos acessados via prisma.userOnTenant (o Prisma usa o model name, não table name)
if (!prisma.usersOnTenants && !prisma.userOnTenant) {
  console.error('❌ ERRO: Model userOnTenant não encontrado!');
  console.error(`   Tipo de banco: ${DB_TYPE}`);
  console.error(`   Verifique se o Prisma Client foi gerado corretamente.`);
  process.exit(1);
}

const UsersOnTenantsModel = (prisma as any).userOnTenant || (prisma as any).usersOnTenants;
console.log(`✅ Model de associação User-Tenant: userOnTenant\n`);
// =============================================================================

// Helper slugify
function slugify(text: string) {
    return text.toString().toLowerCase().trim().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '');
}

async function createMediaItemLocal(tenantId: bigint, fileName: string, url: string) {
    return prisma.mediaItem.create({
        data: {
            tenantId: tenantId,
            fileName,
            storagePath: `seed/${fileName}`,
            urlOriginal: url,
            mimeType: 'image/jpeg'
        }
    });
}

async function populateMissingData(tenantId: bigint) {
  console.log('\n[POPULATE] 🔄 Iniciando população de tabelas complementares (Ultimate Merge)...');

  const users = await prisma.user.findMany({ 
      where: { UsersOnTenants: { some: { tenantId: tenantId } } } 
  });
  const arrematante = users.find(u => u.email.startsWith('arrematante')) || users[0];
  const allAuctions = await prisma.auction.findMany({ where: { tenantId: tenantId } });
  const lots = await prisma.lot.findMany({ where: { tenantId: tenantId } });
  const auctioneers = await prisma.auctioneer.findMany({ where: { tenantId: tenantId } });
  const sellers = await prisma.seller.findMany({ where: { tenantId: tenantId } });
  
  // 2. Popular Marcas e Modelos de Veículos (VehicleMake / VehicleModel - GLOBAL)
  console.log('[POPULATE] 🚗 Gerando Marcas e Modelos...');
  const makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Fiat'];
  const modelsMap: Record<string, string[]> = {
      'Toyota': ['Corolla', 'Hilux', 'Yaris', 'RAV4'],
      'Honda': ['Civic', 'HR-V', 'City', 'Fit'],
      'Ford': ['Ranger', 'Mustang', 'Bronco', 'Territory'],
      'Chevrolet': ['Onix', 'Tracker', 'S10', 'Equinox'],
      'BMW': ['X1', '320i', 'X5', 'M3'],
      'Mercedes-Benz': ['C180', 'GLA', 'GLE', 'A200'],
      'Volkswagen': ['Polo', 'T-Cross', 'Nivus', 'Amarok'],
      'Fiat': ['Strada', 'Toro', 'Pulse', 'Fastback']
  };

  for (const makeName of makes) {
      const existingMake = await prisma.vehicleMake.findFirst({ where: { name: makeName } });
      let makeId = existingMake?.id;

      if (!existingMake) {
          try {
            const make = await prisma.vehicleMake.create({ data: { name: makeName, slug: slugify(makeName) } });
            makeId = make.id;
          } catch (e) { /* ignore */ }
      }

      if (makeId) {
          const models = modelsMap[makeName] || [];
          for (const modelName of models) {
              const existingModel = await prisma.vehicleModel.findFirst({ where: { name: modelName, makeId: makeId } });
              if (!existingModel) {
                  try {
                    await prisma.vehicleModel.create({
                        data: {
                            makeId: makeId,
                            name: modelName,
                            slug: slugify(modelName)
                        }
                    });
                  } catch (e) { /* ignore */ }
              }
          }
      }
  }

  // 3. Popular Subcategorias Faltantes
  console.log('[POPULATE] 🏷️ Verificando Subcategorias...');
  const categories = await prisma.lotCategory.findMany({ where: { tenantId: tenantId } });
  for (const cat of categories) {
      const subs = ['Premium', 'Standard', 'Oportunidade', 'Sucata', 'Recuperável', 'Financeira', 'Particular'];
      for (const subName of subs) {
          await prisma.subcategory.upsert({
              where: { 
                 name_parentCategoryId: { 
                     name: subName, 
                     parentCategoryId: cat.id 
                 } 
              },
              update: {},
              create: {
                  name: subName,
                  slug: slugify(subName),
                  parentCategoryId: cat.id,
                  tenantId: tenantId
              }
          });
      }
  }

  // 4. Habilitações em Leilões
  console.log('[POPULATE] 📋 Gerando Habilitações e Riscos...');
  const auctions = allAuctions.slice(0, 20);

  // 4.2 Riscos de Lotes
  for (const lot of lots.slice(0, 25)) {
      const existingRisk = await prisma.lotRisk.findFirst({ where: { lotId: lot.id } });
      if (!existingRisk) {
          await prisma.lotRisk.create({
              data: {
                  lotId: lot.id,
                  tenantId: tenantId,
                  riskType: LotRiskType.PENHORA,
                  riskLevel: LotRiskLevel.MEDIO,
                  riskDescription: 'Risco jurídico moderado associado à penhora do bem.',
                  mitigationStrategy: 'Revisão documental completa e acompanhamento jurídico especializado.',
                  updatedAt: new Date()
              }
          });
      }
  }

  // 4.3 Documentos de Lote
  for (const lot of lots.slice(0, 25)) {
      const hasDocument = await prisma.lotDocument.findFirst({ where: { lotId: lot.id } });
      if (!hasDocument) {
          await prisma.lotDocument.create({
              data: {
                  lotId: lot.id,
                  tenantId: tenantId,
                  fileName: `laudo-${lot.id}.pdf`,
                  title: 'Laudo Técnico do Lote',
                  description: 'Laudo técnico fictício para demonstração.',
                  updatedAt: new Date(),
                  fileUrl: `https://storage.demo/lot/${lot.id}/laudo.pdf`,
                  mimeType: 'application/pdf',
                  fileSize: BigInt(450000)
              }
          });
      }
  }
  
  if (arrematante) {
      // Garantir Perfil de Arrematante
      let bidderProfile = await prisma.bidderProfile.findUnique({ where: { userId: arrematante.id } });
      if (!bidderProfile) {
          try {
            // Generate pseudo-valid CPF to avoid unique constraint 
            const randomCpf = `123.${Math.floor(Math.random() * 999)}.${Math.floor(Math.random() * 999)}-${Math.floor(Math.random() * 99)}`;
            bidderProfile = await prisma.bidderProfile.create({
                data: {
                    userId: arrematante.id,
                    fullName: arrematante.fullName || 'Arrematante Demo',
                    cpf: randomCpf,
                    tenantId: tenantId,
                    updatedAt: new Date()
                }
            });
          } catch (e) { console.log('Erro ao criar perfil:', e); }
      }

      for (const auction of auctions) {
          try {
             // Verificar se já existe
             const exists = await prisma.auctionHabilitation.findUnique({
                 where: { userId_auctionId: { userId: arrematante.id, auctionId: auction.id } }
             });
             
             if (!exists) {
                await prisma.auctionHabilitation.create({
                    data: {
                        userId: arrematante.id,
                        auctionId: auction.id,
                        tenantId: tenantId,
                        // status: 'APPROVED' // Status field might not exist or be handled differently
                    }
                });
             }
          } catch(e) { console.log('Erro ao habilitar:', e); }
      }
      
      // 4.1 Métodos de Pagamento
      if (bidderProfile) {
        try {
            const existingPayments = await prisma.paymentMethod.count({ where: { tenantId: tenantId } });
            if (existingPayments < 10) {
                await prisma.paymentMethod.create({
                    data: {
                        bidderId: bidderProfile.id,
                        type: 'CREDIT_CARD' as PaymentMethodType,
                        cardBrand: 'Visa',
                        cardLast4: '4242',
                        cardToken: `tok_demo_${Date.now()}`,
                        isDefault: true,
                        tenantId: tenantId,
                        isActive: true,
                        updatedAt: new Date()
                    }
                });
            }
        } catch(e) { console.log('Erro PaymentMethod:', e); }

        // 4.2 Notificações
        const existingBidderNotifs = await prisma.bidderNotification.count({ where: { bidderId: bidderProfile.id } });
        if (existingBidderNotifs < 5) {
            await prisma.bidderNotification.create({
                data: {
                    bidderId: bidderProfile.id,
                    tenantId: tenantId,
                    type: BidderNotificationType.AUCTION_ENDING,
                    title: `Leilão próximo do encerramento`,
                    message: 'Seu leilão favorito está prestes a encerrar.',
                    data: {}
                }
            });
        }
      }
  }

  // 5. Mensagens de Contato
  console.log('[POPULATE] 📧 Gerando Mensagens de Contato...');
  const messages = [
      { name: "João Silva", email: "joao@teste.com", subject: "Dúvida sobre lote", message: "Gostaria de saber mais sobre o lote 10." },
      { name: "Maria Oliveira", email: "maria@teste.com", subject: "Parceria", message: "Sou leiloeira gostaria de usar a plataforma." }
  ];

  for (const msg of messages) {
       await prisma.contactMessage.create({
           data: {
               name: msg.name,
               email: msg.email,
               subject: msg.subject,
               message: msg.message,
               isRead: false
           }
       });
  }

  // 6. Popular AssetMedia (Galeria)
  console.log('[POPULATE] 🖼️ Gerando Galeria de Imagens (AssetMedia)...');
  const assets = await prisma.asset.findMany({ 
      where: { tenantId: tenantId },
      include: { AssetMedia: true },
      take: 20
  });

  const sampleImages = [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80'
  ];

  for (const asset of assets) {
      if (asset.AssetMedia.length === 0) {
        for (let i = 0; i < 2; i++) {
            const imgUrl = sampleImages[i % sampleImages.length];
            const media = await createMediaItemLocal(tenantId, `gallery-${asset.id}-${i}.jpg`, imgUrl);
            await prisma.assetMedia.create({
                data: {
                    tenantId: tenantId,
                    assetId: asset.id,
                    mediaItemId: media.id,
                    displayOrder: i,
                    isPrimary: i === 0
                }
            });
        }
      }
  }

  // 6.1 Mídias por Lote, Leilão, Leiloeiro e Comitente
  console.log('[POPULATE] 🖼️ Garantindo mídia mínima...');
  for (const lot of lots.slice(0, 50)) {
      if (!lot.imageMediaId) {
          const media = await createMediaItemLocal(tenantId, `lot-${lot.id}.jpg`, `https://images.unsplash.com/photo-1501183638710-841dd1904471?w=800&q=80`);
          await prisma.lot.update({
              where: { id: lot.id },
              data: {
                  imageMediaId: media.id,
                  imageUrl: media.urlOriginal,
                  mediaItemIds: [media.id.toString()]
              }
          });
      }
  }

  for (const auctioneer of auctioneers) {
      if (!auctioneer.logoMediaId) {
          const media = await createMediaItemLocal(tenantId, `auctioneer-${auctioneer.id}.jpg`, `https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=800&q=80`);
          await prisma.auctioneer.update({
              where: { id: auctioneer.id },
              data: { logoMediaId: media.id, logoUrl: media.urlOriginal }
          });
      }
  }

  // 7. Popular Visitors e Sessões
  console.log('[POPULATE] 🌍 Criando dados de Visitantes (Analytics)...');
  try {
      const existingVisitors = await prisma.visitor.count();
      if (existingVisitors < 10) {
        for (let i = 0; i < 10; i++) {
            const visitor = await prisma.visitor.create({
                data: {
                    visitorId: uuidv4(),
                    firstIpAddress: `200.100.50.${(10 + i)}`,
                    firstUserAgent: "Mozilla/5.0 ... Chrome/120.0",
                    deviceType: "DESKTOP",
                    firstVisitAt: new Date(),
                    lastVisitAt: new Date(),
                    updatedAt: new Date()
                }
            });
            
            await prisma.visitorSession.create({
                data: {
                    visitorId: visitor.id,
                    sessionId: uuidv4(),
                    userAgent: visitor.firstUserAgent,
                    ipAddress: visitor.firstIpAddress,
                    pageViews: 4,
                    eventsCount: 2,
                    duration: 180
                }
            });
        }
      }
  } catch(e) { console.log('Erro visitor:', e); }

  console.log('[POPULATE] ✅ População complementar concluída com sucesso!');
}

// ========================================================================
// FUNÇÕES DE CORREÇÃO DE INCONSISTÊNCIAS DE AUDITORIA
// Migradas de fix-audit-inconsistencies.ts para garantir seed completo
// ========================================================================

/**
 * Corrige Lotes sem Ativos criando um asset para cada
 */
async function fixLotsWithoutAssets(tenantId: bigint) {
  console.log('[AUDIT-FIX] 📦 Corrigindo Lotes sem Ativos...');
  
  const lotsWithoutAssets = await prisma.lot.findMany({
    where: { tenantId, AssetsOnLots: { none: {} } },
    include: { LotCategory: true, Subcategory: true }
  });
  
  console.log(`   Encontrados: ${lotsWithoutAssets.length} lotes sem ativos`);
  
  for (const lot of lotsWithoutAssets) {
    const publicId = `ASSET-${Date.now()}-${faker.string.alphanumeric(6).toUpperCase()}`;
    const uniqueVin = `VIN${Date.now()}${faker.string.alphanumeric(4).toUpperCase()}`;
    
    const asset = await prisma.asset.create({
      data: {
        publicId,
        tenantId,
        title: lot.title || `Ativo do Lote ${lot.number}`,
        description: lot.description || faker.commerce.productDescription(),
        status: 'DISPONIVEL',
        make: faker.company.name(),
        model: faker.vehicle.model(),
        vin: uniqueVin,
        year: faker.date.past({ years: 10 }).getFullYear(),
        evaluationValue: lot.price ? Number(lot.price) : faker.number.float({ min: 10000, max: 500000, fractionDigits: 2 }),
        dataAiHint: `asset lote ${lot.number}`,
        categoryId: lot.categoryId,
        subcategoryId: lot.subcategoryId,
        updatedAt: new Date(),
      }
    });
    
    await prisma.assetsOnLots.create({
      data: {
        assetId: asset.id,
        lotId: lot.id,
        assignedBy: 'system-seed',
        tenantId,
      }
    });
    
    const mediaItem = await prisma.mediaItem.create({
      data: {
        tenantId,
        fileName: `asset-${asset.id}.jpg`,
        storagePath: `/media/assets/${asset.id}/`,
        urlOriginal: faker.image.url({ width: 800, height: 600 }),
        urlThumbnail: faker.image.url({ width: 200, height: 150 }),
        mimeType: 'image/jpeg',
        sizeBytes: faker.number.int({ min: 100000, max: 500000 }),
        title: `Imagem principal - ${asset.title}`,
        dataAiHint: `imagem ${asset.title}`,
      }
    });
    
    await prisma.assetMedia.create({
      data: {
        tenantId,
        assetId: asset.id,
        mediaItemId: mediaItem.id,
        isPrimary: true,
        displayOrder: 0,
      }
    });
  }
  console.log(`   ✅ ${lotsWithoutAssets.length} lotes corrigidos`);
}

/**
 * Corrige Leilões Judiciais sem Processo
 */
async function fixJudicialAuctionsWithoutProcess(tenantId: bigint) {
  console.log('[AUDIT-FIX] ⚖️ Corrigindo Leilões Judiciais sem Processo...');
  
  const judicialAuctions = await prisma.auction.findMany({
    where: { tenantId, auctionType: 'JUDICIAL', judicialProcessId: null }
  });
  
  console.log(`   Encontrados: ${judicialAuctions.length} leilões judiciais sem processo`);
  
  const existingProcesses = await prisma.judicialProcess.findMany({ where: { tenantId }, take: 10 });
  
  for (let i = 0; i < judicialAuctions.length; i++) {
    const auction = judicialAuctions[i];
    let processId: bigint;
    
    if (existingProcesses[i]) {
      processId = existingProcesses[i].id;
    } else {
      const court = await prisma.court.findFirst();
      const district = await prisma.judicialDistrict.findFirst();
      const branch = await prisma.judicialBranch.findFirst();
      
      const process = await prisma.judicialProcess.create({
        data: {
          tenantId,
          publicId: `PROC-${Date.now()}-${faker.string.alphanumeric(4).toUpperCase()}`,
          processNumber: `${faker.string.numeric(7)}-${faker.string.numeric(2)}.${2024}.8.26.${faker.string.numeric(4)}`,
          courtId: court?.id,
          districtId: district?.id,
          branchId: branch?.id,
          actionType: faker.helpers.arrayElement(['COBRANCA', 'PENHORA', 'INVENTARIO', 'OUTROS']) as any,
          actionDescription: faker.lorem.sentence(),
        }
      });
      processId = process.id;
    }
    
    await prisma.auction.update({
      where: { id: auction.id },
      data: { judicialProcessId: processId }
    });
  }
  console.log(`   ✅ ${judicialAuctions.length} leilões judiciais corrigidos`);
}

/**
 * Corrige Leilões sem Responsáveis
 */
async function fixAuctionsWithoutResponsible(tenantId: bigint) {
  console.log('[AUDIT-FIX] 👤 Corrigindo Leilões sem Responsáveis...');
  
  const auctionsWithoutResponsible = await prisma.auction.findMany({
    where: { tenantId, auctioneerId: null }
  });
  
  console.log(`   Encontrados: ${auctionsWithoutResponsible.length} leilões sem responsável`);
  
  let auctioneers = await prisma.auctioneer.findMany({ where: { tenantId } });
  
  if (auctioneers.length < 4) {
    for (let i = auctioneers.length; i < 4; i++) {
      const publicId = `AUC-${Date.now()}-${faker.string.alphanumeric(4).toUpperCase()}`;
      const name = faker.person.fullName();
      const slug = slugify(`${name}-${Date.now()}`);
      const newAuctioneer = await prisma.auctioneer.create({
        data: {
          publicId,
          slug,
          tenantId,
          name,
          description: faker.lorem.paragraph(),
          registrationNumber: `JUCESP-${faker.string.numeric(6)}`,
          email: faker.internet.email(),
          phone: faker.phone.number(),
          supportWhatsApp: faker.phone.number(), // Campo de contato WhatsApp para hierarquia
          address: faker.location.streetAddress(),
          city: faker.location.city(),
          state: 'SP',
          zipCode: faker.location.zipCode(),
          updatedAt: new Date(),
        }
      });
      auctioneers.push(newAuctioneer);
    }
  }
  
  for (let i = 0; i < auctionsWithoutResponsible.length; i++) {
    const auction = auctionsWithoutResponsible[i];
    const auctioneer = auctioneers[i % auctioneers.length];
    
    await prisma.auction.update({
      where: { id: auction.id },
      data: { auctioneerId: auctioneer.id }
    });
  }
  console.log(`   ✅ ${auctionsWithoutResponsible.length} leilões corrigidos`);
}

/**
 * Corrige Ativos sem Imagem
 */
async function fixAssetsWithoutImage(tenantId: bigint) {
  console.log('[AUDIT-FIX] 🖼️ Corrigindo Ativos sem Imagem...');
  
  const assetsWithoutImage = await prisma.asset.findMany({
    where: { tenantId, AssetMedia: { none: {} } }
  });
  
  console.log(`   Encontrados: ${assetsWithoutImage.length} ativos sem imagem`);
  
  for (const asset of assetsWithoutImage) {
    const mediaItem = await prisma.mediaItem.create({
      data: {
        tenantId,
        fileName: `asset-${asset.id}.jpg`,
        storagePath: `/media/assets/${asset.id}/`,
        urlOriginal: faker.image.url({ width: 800, height: 600 }),
        urlThumbnail: faker.image.url({ width: 200, height: 150 }),
        mimeType: 'image/jpeg',
        sizeBytes: faker.number.int({ min: 100000, max: 500000 }),
        title: `Imagem principal - ${asset.title}`,
        dataAiHint: `imagem ${asset.title}`,
      }
    });
    
    await prisma.assetMedia.create({
      data: {
        tenantId,
        assetId: asset.id,
        mediaItemId: mediaItem.id,
        isPrimary: true,
        displayOrder: 0,
      }
    });
  }
  console.log(`   ✅ ${assetsWithoutImage.length} ativos corrigidos`);
}

/**
 * Corrige Habilitações Aprovadas sem Documentos
 */
async function fixHabilitationsWithoutDocs(tenantId: bigint) {
  console.log('[AUDIT-FIX] 📄 Corrigindo Habilitações sem Documentos...');
  
  const usersWithHabilitationNoDocs = await prisma.user.findMany({
    where: {
      AuctionHabilitation: { some: {} },
      UserDocument: { none: {} }
    },
    take: 10
  });
  
  console.log(`   Encontrados: ${usersWithHabilitationNoDocs.length} usuários habilitados sem docs`);
  
  const docTypes = await prisma.documentType.findMany();
  const rgType = docTypes.find(d => d.name.includes('RG')) || docTypes[0];
  const cpfType = docTypes.find(d => d.name.includes('CPF')) || docTypes[1];
  
  for (const user of usersWithHabilitationNoDocs) {
    if (rgType) {
      try {
        await prisma.userDocument.create({
            data: {
            tenantId,
            userId: user.id,
            documentTypeId: rgType.id,
            fileName: `rg-${user.id}.pdf`,
            fileUrl: faker.image.url(),
            status: UserDocumentStatus.APPROVED,
            updatedAt: new Date(),
            }
        });
      } catch (e) {}
    }
    if (cpfType) {
      try {
        await prisma.userDocument.create({
            data: {
            tenantId,
            userId: user.id,
            documentTypeId: cpfType.id,
            fileName: `cpf-${user.id}.pdf`,
            fileUrl: faker.image.url(),
            status: UserDocumentStatus.APPROVED,
            updatedAt: new Date(),
            }
        });
      } catch (e) {}
    }
  }
  console.log(`   ✅ ${usersWithHabilitationNoDocs.length} usuários corrigidos`);
}

/**
 * Cria DocumentTemplates se não existirem
 */
async function createDocumentTemplates(tenantId: bigint) {
  console.log('[AUDIT-FIX] 📝 Criando DocumentTemplates...');
  
  const existingCount = await prisma.documentTemplate.count();
  if (existingCount >= 5) {
    console.log(`   Já existem ${existingCount} templates`);
    return;
  }
  
  const templates = [
    { name: 'Termo de Arrematação', type: 'WINNING_BID_TERM' as any },
    { name: 'Laudo de Avaliação', type: 'EVALUATION_REPORT' as any },
    { name: 'Certidão de Arrematação', type: 'AUCTION_CERTIFICATE' as any },
  ];
  
  for (const tpl of templates) {
    const exists = await prisma.documentTemplate.findFirst({ where: { name: tpl.name } });
    if (!exists) {
      await prisma.documentTemplate.create({
        data: {
          name: tpl.name,
          type: tpl.type,
          content: generateTemplateContent(tpl.name),
          updatedAt: new Date(),
        }
      });
    }
  }
  console.log(`   ✅ Templates verificados/criados`);
}

function generateTemplateContent(templateName: string): string {
  return `<!DOCTYPE html><html><head><title>${templateName}</title></head><body><h1>${templateName}</h1><p>Data: {{data}}</p><p>Leilão: {{leilao.titulo}}</p><p>Lote: {{lote.numero}}</p><p>Arrematante: {{arrematante.nome}}</p><p>Valor: R$ {{valor}}</p><hr><p>Documento gerado automaticamente pelo sistema BidExpert.</p></body></html>`;
}

/**
 * Adiciona mais LotQuestions
 */
async function addMoreLotQuestions(tenantId: bigint) {
  const lots = await prisma.lot.findMany({ where: { tenantId }, take: 10 });
  const users = await prisma.user.findMany({ where: { UsersOnTenants: { some: { tenantId } } }, take: 5 });
  
  if (lots.length === 0 || users.length === 0) return;
  
  const existingCount = await prisma.lotQuestion.count({ where: { tenantId } });
  if (existingCount >= 15) return;
  
  const questions = [
    'Qual o estado de conservação do bem?',
    'É possível agendar uma visita presencial?',
    'O bem possui todas as documentações em dia?',
    'Há débitos pendentes associados?',
    'Qual a forma de pagamento aceita?',
  ];
  
  for (let i = 0; i < 6; i++) {
    const lot = lots[i % lots.length];
    const user = users[i % users.length];
    
    await prisma.lotQuestion.create({
      data: {
        tenantId,
        lotId: lot.id,
        auctionId: lot.auctionId,
        userId: user.id,
        userDisplayName: user.fullName || 'Usuário',
        questionText: questions[i % questions.length],
        answerText: i % 2 === 0 ? faker.lorem.paragraph() : null,
        isPublic: true,
        answeredAt: i % 2 === 0 ? new Date() : null,
      }
    });
  }
  console.log('   ✅ LotQuestions adicionadas');
}

/**
 * Adiciona mais Reviews
 */
async function addMoreReviews(tenantId: bigint) {
  const lots = await prisma.lot.findMany({ where: { tenantId }, take: 5 });
  const users = await prisma.user.findMany({ where: { UsersOnTenants: { some: { tenantId } } }, take: 5 });
  
  if (lots.length === 0 || users.length === 0) return;
  
  const existingCount = await prisma.review.count({ where: { tenantId } });
  if (existingCount >= 15) return;
  
  for (let i = 0; i < 6; i++) {
    const lot = lots[i % lots.length];
    const user = users[i % users.length];
    
    await prisma.review.create({
      data: {
        tenantId,
        lotId: lot.id,
        auctionId: lot.auctionId,
        userId: user.id,
        rating: faker.number.int({ min: 3, max: 5 }),
        comment: faker.lorem.paragraph(),
        userDisplayName: user.fullName || 'Usuário',
      }
    });
  }
  console.log('   ✅ Reviews adicionadas');
}

/**
 * Adiciona mais DirectSaleOffers
 */
async function addMoreDirectSaleOffers(tenantId: bigint) {
  const categories = await prisma.lotCategory.findMany({ where: { tenantId }, take: 5 });
  const sellers = await prisma.seller.findMany({ where: { tenantId }, take: 3 });
  
  if (categories.length === 0 || sellers.length === 0) return;
  
  const existingCount = await prisma.directSaleOffer.count({ where: { tenantId } });
  if (existingCount >= 10) return;
  
  const offerTypes = ['BUY_NOW', 'ACCEPTS_PROPOSALS'] as const;
  const statuses = ['ACTIVE', 'PENDING_APPROVAL', 'SOLD', 'EXPIRED'] as const;
  
  for (let i = 0; i < 6; i++) {
    const category = categories[i % categories.length];
    const seller = sellers[i % sellers.length];
    
    await prisma.directSaleOffer.create({
      data: {
        tenantId,
        publicId: `dso-${Date.now()}-${i}`,
        title: faker.commerce.productName(),
        description: faker.lorem.paragraph(),
        offerType: offerTypes[i % offerTypes.length],
        price: faker.number.float({ min: 10000, max: 100000, fractionDigits: 2 }),
        status: statuses[i % statuses.length],
        locationCity: faker.location.city(),
        locationState: 'SP',
        categoryId: category.id,
        sellerId: seller.id,
        sellerName: seller.name,
        dataAiHint: `venda direta ${i}`,
        updatedAt: new Date(),
      }
    });
  }
  console.log('   ✅ DirectSaleOffers adicionadas');
}

/**
 * Adiciona mais Subscribers
 */
async function addMoreSubscribers(tenantId: bigint) {
  const existingCount = await prisma.subscriber.count({ where: { tenantId } });
  if (existingCount >= 8) return;
  
  for (let i = 0; i < 8; i++) {
    await prisma.subscriber.create({
      data: {
        tenantId,
        email: `subscriber-seed-${Date.now()}-${i}@example.com`,
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        preferences: { categories: ['Imóveis', 'Veículos'] },
        updatedAt: new Date(),
      }
    });
  }
  console.log('   ✅ Subscribers adicionados');
}

/**
 * Adiciona mais Notifications
 */
async function addMoreNotifications(tenantId: bigint) {
  const users = await prisma.user.findMany({ where: { UsersOnTenants: { some: { tenantId } } }, take: 5 });
  const lots = await prisma.lot.findMany({ where: { tenantId }, take: 5 });
  
  if (users.length === 0) return;
  
  const existingCount = await prisma.notification.count({ where: { tenantId } });
  if (existingCount >= 8) return;
  
  const messages = [
    'Seu lance foi superado!',
    'O leilão começou!',
    'O leilão foi encerrado',
    'Sua habilitação foi aprovada',
    'Pagamento pendente - prazo em 48h',
  ];
  
  for (let i = 0; i < 8; i++) {
    const user = users[i % users.length];
    const lot = lots.length > 0 ? lots[i % lots.length] : null;
    
    await prisma.notification.create({
      data: {
        tenantId,
        userId: user.id,
        lotId: lot?.id,
        auctionId: lot?.auctionId,
        message: messages[i % messages.length],
        link: lot ? `/leiloes/${lot.auctionId}/lotes/${lot.id}` : null,
        isRead: faker.datatype.boolean(),
      }
    });
  }
  console.log('   ✅ Notifications adicionadas');
}

/**
 * Adiciona mais AuditLogs
 */
async function addMoreAuditLogs(tenantId: bigint) {
  const users = await prisma.user.findMany({ where: { UsersOnTenants: { some: { tenantId } } }, take: 5 });
  
  if (users.length === 0) return;
  
  const existingCount = await prisma.auditLog.count({ where: { tenantId } });
  if (existingCount >= 10) return;
  
  const actions = [AuditAction.CREATE, AuditAction.UPDATE, AuditAction.DELETE, AuditAction.APPROVE, AuditAction.REJECT];
  const entities = ['Auction', 'Lot', 'Bid', 'User', 'Payment'];
  
  for (let i = 0; i < 10; i++) {
    const user = users[i % users.length];
    
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: actions[i % actions.length],
        entityType: entities[i % entities.length],
        entityId: BigInt(faker.number.int({ min: 1, max: 100 })),
        changes: i % 2 === 0 ? { before: { status: 'OLD' }, after: { status: 'NEW' } } : undefined,
        metadata: { source: 'seed-script' },
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
      }
    });
  }
  console.log('   ✅ AuditLogs adicionados');
}

/**
 * Adiciona mais BidderProfiles
 */
async function addMoreBidderProfiles(tenantId: bigint) {
  const users = await prisma.user.findMany({ 
    where: { UsersOnTenants: { some: { tenantId } }, BidderProfile: null },
    take: 6 
  });
  
  if (users.length === 0) return;
  
  for (const user of users) {
    try {
      await prisma.bidderProfile.create({
        data: {
          tenantId,
          userId: user.id,
          fullName: user.fullName || faker.person.fullName(),
          cpf: faker.string.numeric(11),
          phone: faker.phone.number(),
          dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
          address: faker.location.streetAddress(),
          city: faker.location.city(),
          state: 'SP',
          zipCode: faker.location.zipCode(),
          documentStatus: 'APPROVED',
          emailNotifications: true,
          smsNotifications: false,
          isActive: true,
          updatedAt: new Date(),
        }
      });
    } catch (e) { /* ignore duplicate */ }
  }
  console.log(`   ✅ BidderProfiles verificados`);
}

/**
 * Adiciona mais Courts
 */
async function addMoreCourts() {
  const courts = [
    { name: 'Tribunal de Justiça de São Paulo', slug: 'tjsp', stateUf: 'SP' },
    { name: 'Tribunal de Justiça do Rio de Janeiro', slug: 'tjrj', stateUf: 'RJ' },
    { name: 'Tribunal de Justiça de Minas Gerais', slug: 'tjmg', stateUf: 'MG' },
    { name: 'Tribunal Regional Federal da 3ª Região', slug: 'trf3', stateUf: 'SP' },
    { name: 'Tribunal de Justiça do Paraná', slug: 'tjpr', stateUf: 'PR' },
  ];
  
  for (const court of courts) {
    const existing = await prisma.court.findFirst({ where: { slug: court.slug } });
    if (!existing) {
      await prisma.court.create({ 
        data: { 
          ...court,
          updatedAt: new Date(),
        } 
      });
    }
  }
  console.log('   ✅ Courts verificados');
}

/**
 * Adiciona mais Sellers
 */
async function addMoreSellers(tenantId: bigint) {
  const sellerData = [
    { name: 'Banco do Brasil S.A.', city: 'Brasília', state: 'DF' },
    { name: 'Caixa Econômica Federal', city: 'Brasília', state: 'DF' },
    { name: 'Santander Brasil', city: 'São Paulo', state: 'SP' },
    { name: 'Itaú Unibanco', city: 'São Paulo', state: 'SP' },
  ];
  
  for (let i = 0; i < sellerData.length; i++) {
    const data = sellerData[i];
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    const existing = await prisma.seller.findFirst({ where: { slug } });
    if (!existing) {
      await prisma.seller.create({
        data: {
          tenantId,
          publicId: `seller-seed-${Date.now()}-${i}`,
          name: data.name,
          slug,
          description: `Comitente ${data.name} - leilões de bens.`,
          email: faker.internet.email(),
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          city: data.city,
          state: data.state,
          zipCode: faker.location.zipCode(),
          updatedAt: new Date(),
        }
      });
    }
  }
  console.log('   ✅ Sellers verificados');
}

/**
 * Função principal de correção de inconsistências de auditoria
 */
// ========================================================================
// FUNÇÕES DE SEED PARA ITSM (Sistema de Chamados de Suporte)
// ========================================================================

/**
 * Cria tickets de suporte simulados
 */
async function seedItsmTickets(tenantId: bigint) {
  console.log('[ITSM] 🎫 Criando tickets de suporte...');
  
  const users = await prisma.user.findMany({ where: { UsersOnTenants: { some: { tenantId } } }, take: 10 });
  const supportUsers = users.filter(u => u.email.includes('admin') || u.email.includes('suporte'));
  
  if (users.length === 0) {
    console.log('   ⚠️ Sem usuários para criar tickets');
    return;
  }
  
  const existingCount = await prisma.iTSM_Ticket.count({ where: { tenantId } });
  if (existingCount >= 15) {
    console.log(`   Já existem ${existingCount} tickets`);
    return;
  }
  
  const ticketTemplates = [
    { title: 'Erro ao fazer lance no leilão', category: 'BUG', priority: 'ALTA', status: 'ABERTO', description: 'Quando tento fazer um lance, aparece uma mensagem de erro "Operação não permitida". Já tentei em diferentes navegadores.' },
    { title: 'Dúvida sobre pagamento de arrematação', category: 'DUVIDA', priority: 'MEDIA', status: 'EM_ANDAMENTO', description: 'Gostaria de saber quais são as formas de pagamento aceitas após arrematar um lote.' },
    { title: 'Não consigo me habilitar para leilão judicial', category: 'TECNICO', priority: 'ALTA', status: 'AGUARDANDO_USUARIO', description: 'Estou tentando me habilitar para o leilão #123 mas o sistema não aceita meu CPF.' },
    { title: 'Sugestão de melhoria na busca', category: 'SUGESTAO', priority: 'BAIXA', status: 'RESOLVIDO', description: 'Seria interessante adicionar filtros por cidade e estado na busca de lotes.' },
    { title: 'Sistema lento durante leilão ao vivo', category: 'TECNICO', priority: 'CRITICA', status: 'EM_ANDAMENTO', description: 'Durante o leilão às 14h, o sistema ficou muito lento e perdi vários lances.' },
    { title: 'Problema com certificado digital', category: 'TECNICO', priority: 'ALTA', status: 'ABERTO', description: 'Meu certificado A3 não está sendo reconhecido pelo sistema.' },
    { title: 'Erro 500 ao acessar meus leilões', category: 'BUG', priority: 'CRITICA', status: 'RESOLVIDO', description: 'Ao clicar em "Meus Leilões" aparece uma página de erro.' },
    { title: 'Dúvida sobre comissão do leiloeiro', category: 'DUVIDA', priority: 'BAIXA', status: 'FECHADO', description: 'Qual a porcentagem de comissão cobrada pelo leiloeiro?' },
    { title: 'Imagens dos lotes não carregam', category: 'BUG', priority: 'MEDIA', status: 'EM_ANDAMENTO', description: 'As fotos dos lotes 45, 46 e 47 aparecem como placeholder.' },
    { title: 'Solicitação de cancelamento de lance', category: 'FUNCIONAL', priority: 'ALTA', status: 'AGUARDANDO_USUARIO', description: 'Fiz um lance errado e gostaria de cancelar. Processo CNJ 1234567-89.2024.8.26.0100.' },
    { title: 'Relatório de arrematação com erro', category: 'BUG', priority: 'MEDIA', status: 'ABERTO', description: 'O PDF do termo de arrematação está saindo com dados incorretos.' },
    { title: 'App mobile não sincroniza lances', category: 'TECNICO', priority: 'ALTA', status: 'EM_ANDAMENTO', description: 'Fiz lances pelo app mas não aparecem no site.' },
    { title: 'Documentação para venda direta', category: 'DUVIDA', priority: 'BAIXA', status: 'RESOLVIDO', description: 'Quais documentos preciso para comprar um imóvel por venda direta?' },
    { title: 'Timeout durante upload de documentos', category: 'TECNICO', priority: 'MEDIA', status: 'FECHADO', description: 'Ao enviar RG em PDF, dá timeout após 2 minutos.' },
    { title: 'Proposta de parceria comercial', category: 'OUTRO', priority: 'BAIXA', status: 'ABERTO', description: 'Somos uma empresa de leilões e gostaríamos de usar a plataforma.' },
  ];
  
  const createdTickets: bigint[] = [];
  
  for (let i = 0; i < ticketTemplates.length; i++) {
    const tpl = ticketTemplates[i];
    const user = users[i % users.length];
    const assignedTo = supportUsers.length > 0 ? supportUsers[i % supportUsers.length] : null;
    
    const ticket = await prisma.iTSM_Ticket.create({
      data: {
        tenantId,
        publicId: `TKT-${Date.now()}-${i.toString().padStart(3, '0')}`,
        userId: user.id,
        title: tpl.title,
        description: tpl.description,
        status: tpl.status as any,
        priority: tpl.priority as any,
        category: tpl.category as any,
        assignedToUserId: assignedTo?.id,
        userSnapshot: { name: user.fullName, email: user.email },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        browserInfo: faker.helpers.arrayElement(['Chrome 120', 'Firefox 121', 'Safari 17', 'Edge 120']),
        screenSize: faker.helpers.arrayElement(['1920x1080', '1366x768', '2560x1440', '1440x900']),
        pageUrl: faker.helpers.arrayElement(['/leiloes', '/lotes/123', '/minha-conta', '/habilitacao']),
        resolvedAt: tpl.status === 'RESOLVIDO' || tpl.status === 'FECHADO' ? faker.date.recent({ days: 5 }) : null,
        closedAt: tpl.status === 'FECHADO' ? faker.date.recent({ days: 3 }) : null,
        updatedAt: new Date(),
      }
    });
    createdTickets.push(ticket.id);
  }
  
  console.log(`   ✅ ${ticketTemplates.length} tickets criados`);
  return createdTickets;
}

/**
 * Cria mensagens nos tickets
 */
async function seedItsmMessages(tenantId: bigint) {
  console.log('[ITSM] 💬 Criando mensagens nos tickets...');
  
  const tickets = await prisma.iTSM_Ticket.findMany({ where: { tenantId }, take: 15 });
  const users = await prisma.user.findMany({ where: { UsersOnTenants: { some: { tenantId } } }, take: 5 });
  
  if (tickets.length === 0 || users.length === 0) {
    console.log('   ⚠️ Sem tickets ou usuários');
    return;
  }
  
  const existingCount = await prisma.itsm_messages.count();
  if (existingCount >= 30) {
    console.log(`   Já existem ${existingCount} mensagens`);
    return;
  }
  
  const responses = [
    'Olá! Já estamos analisando seu chamado.',
    'Poderia fornecer mais detalhes sobre o problema?',
    'Conseguimos identificar a causa. Estamos trabalhando na correção.',
    'O problema foi corrigido. Por favor, teste novamente.',
    'Entendemos sua dúvida. A resposta é: [informação relevante]',
    'Agradecemos o feedback! Vamos considerar sua sugestão.',
    'Precisamos de um print da tela com o erro.',
    'Qual navegador e versão você está utilizando?',
    'O problema foi escalado para a equipe técnica.',
    'Verificamos e o sistema está funcionando normalmente agora.',
  ];
  
  const userFollowups = [
    'Obrigado pela resposta rápida!',
    'Ainda não funcionou, o erro persiste.',
    'Testei e agora está funcionando perfeitamente.',
    'Segue o print solicitado em anexo.',
    'Estou usando Chrome versão 120.',
    'Muito obrigado pelo suporte!',
  ];
  
  let msgCount = 0;
  for (const ticket of tickets) {
    const numMessages = faker.number.int({ min: 2, max: 5 });
    
    for (let i = 0; i < numMessages; i++) {
      const isSupport = i % 2 === 1;
      const user = isSupport ? users[0] : await prisma.user.findUnique({ where: { id: ticket.userId } });
      
      if (!user) continue;
      
      await prisma.itsm_messages.create({
        data: {
          ticketId: ticket.id,
          userId: user.id,
          message: isSupport ? responses[i % responses.length] : userFollowups[i % userFollowups.length],
          isInternal: isSupport && faker.datatype.boolean({ probability: 0.2 }),
        }
      });
      msgCount++;
    }
  }
  
  console.log(`   ✅ ${msgCount} mensagens criadas`);
}

/**
 * Cria attachments nos tickets
 */
async function seedItsmAttachments(tenantId: bigint) {
  console.log('[ITSM] 📎 Criando anexos nos tickets...');
  
  const tickets = await prisma.iTSM_Ticket.findMany({ where: { tenantId }, take: 10 });
  const users = await prisma.user.findMany({ where: { UsersOnTenants: { some: { tenantId } } }, take: 5 });
  
  if (tickets.length === 0 || users.length === 0) {
    console.log('   ⚠️ Sem tickets ou usuários');
    return;
  }
  
  const existingCount = await prisma.itsm_attachments.count();
  if (existingCount >= 15) {
    console.log(`   Já existem ${existingCount} anexos`);
    return;
  }
  
  const attachmentTypes = [
    { name: 'screenshot-erro.png', mime: 'image/png', size: 125000 },
    { name: 'log-console.txt', mime: 'text/plain', size: 8500 },
    { name: 'documento-rg.pdf', mime: 'application/pdf', size: 450000 },
    { name: 'video-bug.mp4', mime: 'video/mp4', size: 5200000 },
    { name: 'certificado-a3.cer', mime: 'application/x-x509-ca-cert', size: 2048 },
    { name: 'comprovante-pagamento.pdf', mime: 'application/pdf', size: 380000 },
    { name: 'print-tela.jpg', mime: 'image/jpeg', size: 95000 },
  ];
  
  let attachCount = 0;
  for (const ticket of tickets.slice(0, 8)) {
    const numAttachments = faker.number.int({ min: 1, max: 2 });
    
    for (let i = 0; i < numAttachments; i++) {
      const att = attachmentTypes[faker.number.int({ min: 0, max: attachmentTypes.length - 1 })];
      const user = users[faker.number.int({ min: 0, max: users.length - 1 })];
      
      await prisma.itsm_attachments.create({
        data: {
          ticketId: ticket.id,
          fileName: att.name,
          fileUrl: `https://storage.bidexpert.com/itsm/${ticket.publicId}/${att.name}`,
          fileSize: att.size,
          mimeType: att.mime,
          uploadedBy: user.id,
        }
      });
      attachCount++;
    }
  }
  
  console.log(`   ✅ ${attachCount} anexos criados`);
}

/**
 * Cria logs de chat do assistente virtual
 */
async function seedItsmChatLogs(tenantId: bigint) {
  console.log('[ITSM] 🤖 Criando logs de chat do assistente...');
  
  const users = await prisma.user.findMany({ where: { UsersOnTenants: { some: { tenantId } } }, take: 10 });
  const tickets = await prisma.iTSM_Ticket.findMany({ where: { tenantId }, take: 5 });
  
  if (users.length === 0) {
    console.log('   ⚠️ Sem usuários');
    return;
  }
  
  const existingCount = await prisma.iTSM_ChatLog.count({ where: { tenantId } });
  if (existingCount >= 12) {
    console.log(`   Já existem ${existingCount} chat logs`);
    return;
  }
  
  const chatSessions = [
    {
      messages: [
        { role: 'user', content: 'Como faço para participar de um leilão?' },
        { role: 'assistant', content: 'Para participar, você precisa: 1) Criar uma conta, 2) Enviar documentos para habilitação, 3) Aguardar aprovação.' },
        { role: 'user', content: 'Obrigado!' }
      ],
      wasHelpful: true,
      ticketCreated: false
    },
    {
      messages: [
        { role: 'user', content: 'Estou com erro ao fazer login' },
        { role: 'assistant', content: 'Vou ajudar. Qual mensagem de erro aparece?' },
        { role: 'user', content: 'Diz que minha senha está errada mas tenho certeza que está certa' },
        { role: 'assistant', content: 'Recomendo usar a opção "Esqueci minha senha" para redefinir. Posso abrir um chamado para você?' },
        { role: 'user', content: 'Sim, por favor' }
      ],
      wasHelpful: false,
      ticketCreated: true
    },
    {
      messages: [
        { role: 'user', content: 'Qual o prazo para pagamento após arrematação?' },
        { role: 'assistant', content: 'O prazo padrão é de 24 horas para sinal (30%) e 15 dias para o restante, mas pode variar conforme o edital.' }
      ],
      wasHelpful: true,
      ticketCreated: false
    },
    {
      messages: [
        { role: 'user', content: 'O leilão 456 foi cancelado?' },
        { role: 'assistant', content: 'Deixe-me verificar... O leilão 456 foi suspenso temporariamente por determinação judicial. Sem previsão de retorno.' },
        { role: 'user', content: 'E os lances que já foram dados?' },
        { role: 'assistant', content: 'Todos os lances foram cancelados. Você receberá notificação quando houver nova data.' }
      ],
      wasHelpful: true,
      ticketCreated: false
    },
    {
      messages: [
        { role: 'user', content: 'Não consigo enviar meus documentos' },
        { role: 'assistant', content: 'Qual formato e tamanho do arquivo?' },
        { role: 'user', content: 'PDF com 15MB' },
        { role: 'assistant', content: 'O limite é 10MB. Tente comprimir o arquivo ou dividir em partes.' }
      ],
      wasHelpful: true,
      ticketCreated: false
    },
  ];
  
  for (let i = 0; i < chatSessions.length; i++) {
    const session = chatSessions[i];
    const user = users[i % users.length];
    const ticket = session.ticketCreated && tickets[i % tickets.length] ? tickets[i % tickets.length] : null;
    
    await prisma.iTSM_ChatLog.create({
      data: {
        tenantId,
        userId: user.id,
        ticketId: ticket?.id,
        sessionId: uuidv4(),
        messages: session.messages,
        context: { page: '/ajuda', timestamp: new Date().toISOString() },
        wasHelpful: session.wasHelpful,
        ticketCreated: session.ticketCreated,
        updatedAt: new Date(),
      }
    });
  }
  
  console.log(`   ✅ ${chatSessions.length} chat logs criados`);
}

/**
 * Cria logs de queries (performance/debug)
 */
async function seedItsmQueryLogs(tenantId: bigint) {
  console.log('[ITSM] 📊 Criando logs de queries...');
  
  const users = await prisma.user.findMany({ where: { UsersOnTenants: { some: { tenantId } } }, take: 5 });
  
  const existingCount = await prisma.itsm_query_logs.count();
  if (existingCount >= 20) {
    console.log(`   Já existem ${existingCount} query logs`);
    return;
  }
  
  const queryTemplates = [
    { endpoint: '/api/leiloes', method: 'GET', success: true, duration: 45 },
    { endpoint: '/api/lotes/search', method: 'POST', success: true, duration: 120 },
    { endpoint: '/api/lances', method: 'POST', success: true, duration: 35 },
    { endpoint: '/api/lances', method: 'POST', success: false, duration: 5000, error: 'Timeout ao processar lance' },
    { endpoint: '/api/habilitacao', method: 'POST', success: true, duration: 250 },
    { endpoint: '/api/documentos/upload', method: 'POST', success: false, duration: 30000, error: 'Request Entity Too Large' },
    { endpoint: '/api/relatorios/pdf', method: 'GET', success: true, duration: 1500 },
    { endpoint: '/api/auth/login', method: 'POST', success: true, duration: 180 },
    { endpoint: '/api/auth/login', method: 'POST', success: false, duration: 50, error: 'Invalid credentials' },
    { endpoint: '/api/pagamentos', method: 'POST', success: true, duration: 890 },
    { endpoint: '/api/notificacoes', method: 'GET', success: true, duration: 25 },
    { endpoint: '/api/leiloes/ao-vivo', method: 'GET', success: true, duration: 15 },
    { endpoint: '/api/usuarios/perfil', method: 'PUT', success: true, duration: 95 },
    { endpoint: '/api/favoritos', method: 'POST', success: true, duration: 40 },
    { endpoint: '/api/busca/avancada', method: 'POST', success: true, duration: 350 },
  ];
  
  for (let i = 0; i < queryTemplates.length; i++) {
    const tpl = queryTemplates[i];
    const user = users.length > 0 ? users[i % users.length] : null;
    
    await prisma.itsm_query_logs.create({
      data: {
        query: `SELECT * FROM ... (${tpl.endpoint})`,
        duration: tpl.duration,
        success: tpl.success,
        errorMessage: tpl.error || null,
        userId: user?.id,
        endpoint: tpl.endpoint,
        method: tpl.method,
        ipAddress: faker.internet.ip(),
      }
    });
  }
  
  console.log(`   ✅ ${queryTemplates.length} query logs criados`);
}

/**
 * Cria form submissions
 */
async function seedFormSubmissions(tenantId: bigint) {
  console.log('[ITSM] 📝 Criando form submissions...');
  
  const users = await prisma.user.findMany({ where: { UsersOnTenants: { some: { tenantId } } }, take: 10 });
  
  if (users.length === 0) {
    console.log('   ⚠️ Sem usuários');
    return;
  }
  
  const existingCount = await prisma.formSubmission.count({ where: { tenantId } });
  if (existingCount >= 15) {
    console.log(`   Já existem ${existingCount} form submissions`);
    return;
  }
  
  const formTemplates = [
    { formType: 'CADASTRO_USUARIO', status: 'SUBMITTED', score: 100, data: { nome: 'João Silva', cpf: '123.456.789-00', email: 'joao@email.com' } },
    { formType: 'HABILITACAO_LEILAO', status: 'VALID', score: 95, data: { documentos: ['RG', 'CPF', 'Comprovante'], leilaoId: 1 } },
    { formType: 'HABILITACAO_LEILAO', status: 'INVALID', score: 45, data: { documentos: ['RG'], leilaoId: 2 }, errors: ['CPF obrigatório', 'Comprovante de residência obrigatório'] },
    { formType: 'PROPOSTA_VENDA_DIRETA', status: 'SUBMITTED', score: 100, data: { loteId: 5, valorProposta: 150000, mensagem: 'Interessado no imóvel' } },
    { formType: 'CADASTRO_LEILOEIRO', status: 'VALIDATING', score: 80, data: { nome: 'Maria Leiloeira', jucesp: '123456', creci: '78901' } },
    { formType: 'CONTATO', status: 'SUBMITTED', score: 100, data: { assunto: 'Dúvida', mensagem: 'Gostaria de mais informações' } },
    { formType: 'RECURSO_LANCE', status: 'DRAFT', score: 60, data: { lanceId: 123, motivo: 'Erro no sistema' } },
    { formType: 'CADASTRO_COMITENTE', status: 'VALID', score: 100, data: { razaoSocial: 'Banco XYZ', cnpj: '12.345.678/0001-90' } },
    { formType: 'HABILITACAO_LEILAO', status: 'SUBMITTED', score: 90, data: { documentos: ['RG', 'CPF', 'Certidão'], leilaoId: 3 } },
    { formType: 'ALTERACAO_CADASTRO', status: 'VALID', score: 100, data: { campo: 'telefone', valorAntigo: '11999999999', valorNovo: '11988888888' } },
    { formType: 'SOLICITACAO_VISITA', status: 'SUBMITTED', score: 100, data: { loteId: 10, dataPreferida: '2026-02-15', horario: '14:00' } },
    { formType: 'CADASTRO_USUARIO', status: 'FAILED', score: 30, data: { nome: '', cpf: 'invalido' }, errors: ['Nome obrigatório', 'CPF inválido'] },
  ];
  
  for (let i = 0; i < formTemplates.length; i++) {
    const tpl = formTemplates[i];
    const user = users[i % users.length];
    
    await prisma.formSubmission.create({
      data: {
        tenantId,
        userId: user.id,
        formType: tpl.formType,
        status: tpl.status as any,
        validationScore: tpl.score,
        data: tpl.data,
        validationErrors: tpl.errors || undefined,
        completedAt: tpl.status === 'SUBMITTED' || tpl.status === 'VALID' ? new Date() : null,
      }
    });
  }
  
  console.log(`   ✅ ${formTemplates.length} form submissions criados`);
}

/**
 * Função principal para seed de dados ITSM
 */
async function seedItsmData(tenantId: bigint) {
  console.log('\n[ITSM] 🎫 Iniciando seed de dados de suporte (ITSM)...');
  
  await seedItsmTickets(tenantId);
  await seedItsmMessages(tenantId);
  await seedItsmAttachments(tenantId);
  await seedItsmChatLogs(tenantId);
  await seedItsmQueryLogs(tenantId);
  await seedFormSubmissions(tenantId);
  
  console.log('[ITSM] ✅ Seed de dados ITSM concluído!\n');
}

/**
 * SEED DE TABELAS GLOBAIS CRÍTICAS
 * Popula States, Cities, ValidationRules, ThemeSettings, RealtimeSettings, etc.
 */
async function seedCriticalGlobalTables(tenantId: bigint) {
  console.log('\n[GLOBAL-TABLES] 🌍 Iniciando seed de tabelas globais críticas...');
  
  // 1. STATES (Estados Brasileiros)
  console.log('[GLOBAL-TABLES] 📍 Populando States (Estados)...');
  const brazilianStates = [
    { name: 'Acre', uf: 'AC' },
    { name: 'Alagoas', uf: 'AL' },
    { name: 'Amapá', uf: 'AP' },
    { name: 'Amazonas', uf: 'AM' },
    { name: 'Bahia', uf: 'BA' },
    { name: 'Ceará', uf: 'CE' },
    { name: 'Distrito Federal', uf: 'DF' },
    { name: 'Espírito Santo', uf: 'ES' },
    { name: 'Goiás', uf: 'GO' },
    { name: 'Maranhão', uf: 'MA' },
    { name: 'Mato Grosso', uf: 'MT' },
    { name: 'Mato Grosso do Sul', uf: 'MS' },
    { name: 'Minas Gerais', uf: 'MG' },
    { name: 'Pará', uf: 'PA' },
    { name: 'Paraíba', uf: 'PB' },
    { name: 'Paraná', uf: 'PR' },
    { name: 'Pernambuco', uf: 'PE' },
    { name: 'Piauí', uf: 'PI' },
    { name: 'Rio de Janeiro', uf: 'RJ' },
    { name: 'Rio Grande do Norte', uf: 'RN' },
    { name: 'Rio Grande do Sul', uf: 'RS' },
    { name: 'Rondônia', uf: 'RO' },
    { name: 'Roraima', uf: 'RR' },
    { name: 'Santa Catarina', uf: 'SC' },
    { name: 'São Paulo', uf: 'SP' },
    { name: 'Sergipe', uf: 'SE' },
    { name: 'Tocantins', uf: 'TO' }
  ];

  for (const state of brazilianStates) {
    await prisma.state.upsert({
      where: { uf: state.uf },
      update: {},
      create: {
        name: state.name,
        uf: state.uf,
        slug: slugify(state.name)
      }
    });
  }
  console.log(`   ✅ ${brazilianStates.length} estados criados`);

  // 2. CITIES (Principais cidades)
  console.log('[GLOBAL-TABLES] 🏙️  Populando Cities (Cidades)...');
  const mainCities = [
    { name: 'São Paulo', stateUf: 'SP' },
    { name: 'Rio de Janeiro', stateUf: 'RJ' },
    { name: 'Brasília', stateUf: 'DF' },
    { name: 'Salvador', stateUf: 'BA' },
    { name: 'Fortaleza', stateUf: 'CE' },
    { name: 'Belo Horizonte', stateUf: 'MG' },
    { name: 'Manaus', stateUf: 'AM' },
    { name: 'Curitiba', stateUf: 'PR' },
    { name: 'Recife', stateUf: 'PE' },
    { name: 'Porto Alegre', stateUf: 'RS' },
    { name: 'Goiânia', stateUf: 'GO' },
    { name: 'Belém', stateUf: 'PA' },
    { name: 'Guarulhos', stateUf: 'SP' },
    { name: 'Campinas', stateUf: 'SP' },
    { name: 'São Luís', stateUf: 'MA' }
  ];

  for (const city of mainCities) {
    const state = await prisma.state.findUnique({ where: { uf: city.stateUf } });
    if (state) {
      await prisma.city.upsert({
        where: { 
          name_stateId: { 
            name: city.name, 
            stateId: state.id 
          } 
        },
        update: {},
        create: {
          name: city.name,
          stateId: state.id,
          slug: slugify(city.name)
        }
      });
    }
  }
  console.log(`   ✅ ${mainCities.length} cidades criadas`);

  // 3. VALIDATION RULES
  console.log('[GLOBAL-TABLES] ✅ Populando Validation Rules...');
  const validationRules = [
    { 
      entityType: 'User',
      fieldName: 'cpf',
      ruleType: 'PATTERN',
      config: { pattern: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$' },
      isRequired: true,
      errorMessage: 'CPF inválido. Formato esperado: 000.000.000-00',
      severity: 'ERROR'
    },
    { 
      entityType: 'User',
      fieldName: 'email',
      ruleType: 'PATTERN',
      config: { pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
      isRequired: true,
      errorMessage: 'Email inválido',
      severity: 'ERROR'
    },
    { 
      entityType: 'User',
      fieldName: 'phone',
      ruleType: 'PATTERN',
      config: { pattern: '^\\(\\d{2}\\) \\d{4,5}-\\d{4}$' },
      isRequired: false,
      errorMessage: 'Telefone inválido. Formato: (00) 00000-0000',
      severity: 'WARNING'
    },
    { 
      entityType: 'Auction',
      fieldName: 'title',
      ruleType: 'MIN_LENGTH',
      config: { minLength: 10 },
      isRequired: true,
      errorMessage: 'Título deve ter no mínimo 10 caracteres',
      severity: 'ERROR'
    },
    { 
      entityType: 'Bid',
      fieldName: 'value',
      ruleType: 'MIN_VALUE',
      config: { minValue: 0.01 },
      isRequired: true,
      errorMessage: 'Valor do lance deve ser maior que zero',
      severity: 'ERROR'
    }
  ];

  for (const rule of validationRules) {
    await prisma.validation_rules.upsert({
      where: {
        entityType_fieldName_ruleType: {
          entityType: rule.entityType,
          fieldName: rule.fieldName,
          ruleType: rule.ruleType as any
        }
      },
      update: {},
      create: {
        entityType: rule.entityType,
        fieldName: rule.fieldName,
        ruleType: rule.ruleType as any,
        config: rule.config,
        isRequired: rule.isRequired,
        errorMessage: rule.errorMessage,
        severity: rule.severity as any,
        isActive: true,
        updatedAt: new Date()
      }
    });
  }
  console.log(`   ✅ ${validationRules.length} regras de validação criadas`);

  // 4. VISITOR EVENTS
  console.log('[GLOBAL-TABLES] 👁️  Populando Visitor Events...');
  const visitors = await prisma.visitor.findMany({ take: 10 });
  const eventTypes = ['PAGE_VIEW', 'LOT_VIEW', 'AUCTION_VIEW', 'SEARCH', 'FILTER_APPLIED'];
  
  let eventCounter = 0;
  for (const visitor of visitors) {
    // Criar sessão para o visitante
    const session = await prisma.visitorSession.create({
      data: {
        sessionId: `session-${visitor.id}-${Date.now()}`,
        visitorId: visitor.id,
        startedAt: new Date(),
        lastActivityAt: new Date()
      }
    });
    
    // Criar 5 eventos para cada visitante
    for (let i = 0; i < 5; i++) {
      eventCounter++;
      await prisma.visitorEvent.create({
        data: {
          eventId: `event-${eventCounter}-${Date.now()}-${i}`,
          visitorId: visitor.id,
          sessionId: session.id,
          eventType: eventTypes[i % eventTypes.length] as any,
          pageUrl: `/auctions/${i}`,
          metadata: { 
            action: 'viewed_lot',
            lotId: i 
          },
          timestamp: new Date()
        }
      });
    }
  }
  console.log(`   ✅ ${visitors.length} sessões e ${eventCounter} eventos criados`);

  // 5. THEME SETTINGS & THEME COLORS
  console.log('[GLOBAL-TABLES] 🎨 Populando Theme Settings & Colors...');
  await prisma.themeSettings.upsert({
    where: { name: `theme-${tenantId}` },
    update: {
      ThemeColors: {
        upsert: {
          update: {
            light: {
              primary: '#1E40AF',
              secondary: '#7C3AED',
              accent: '#F59E0B',
              background: '#FFFFFF',
              text: '#1F2937'
            },
            dark: {
              primary: '#3B82F6',
              secondary: '#A78BFA',
              accent: '#FBBF24',
              background: '#111827',
              text: '#F9FAFB'
            }
          },
          create: {
            light: {
              primary: '#1E40AF',
              secondary: '#7C3AED',
              accent: '#F59E0B',
              background: '#FFFFFF',
              text: '#1F2937'
            },
            dark: {
              primary: '#3B82F6',
              secondary: '#A78BFA',
              accent: '#FBBF24',
              background: '#111827',
              text: '#F9FAFB'
            }
          }
        }
      }
    },
    create: {
      name: `theme-${tenantId}`,
      ThemeColors: {
        create: {
          light: {
            primary: '#1E40AF',
            secondary: '#7C3AED',
            accent: '#F59E0B',
            background: '#FFFFFF',
            text: '#1F2937'
          },
          dark: {
            primary: '#3B82F6',
            secondary: '#A78BFA',
            accent: '#FBBF24',
            background: '#111827',
            text: '#F9FAFB'
          }
        }
      }
    }
  });
  console.log(`   ✅ Theme Settings e Colors criados`);

  // 6. SECTION BADGE VISIBILITY (se existe no schema)
  console.log('[GLOBAL-TABLES] 🏷️  Populando Section Badge Visibility...');
  const sectionExistsFlag = await tableExists(prisma, 'SectionBadgeVisibility');
  if (sectionExistsFlag) {
    const sections = ['super-opportunities', 'featured-auctions', 'ending-soon', 'new-arrivals'];
    for (const section of sections) {
      try {
        await (prisma as any).sectionBadgeVisibility.create({
          data: {
            sectionKey: section,
            isVisible: true,
            badgeText: section.replace(/-/g, ' ').toUpperCase(),
            badgeColor: '#EF4444'
          }
        });
      } catch (e: any) {
        console.log(`      ⚠️ Section ${section} pode já existir ou tabela não existe`);
      }
    }
    console.log(`   ✅ Seções de badge configuradas`);
  } else {
    console.log(`   ⚠️ Tabela SectionBadgeVisibility não existe - pulando`);
  }

  // 7. REALTIME SETTINGS (se existe no schema)
  console.log('[GLOBAL-TABLES] ⚡ Populando Realtime Settings...');
  const realtimeExistsFlag = await tableExists(prisma, 'RealtimeSettings');
  if (realtimeExistsFlag) {
    try {
      await (prisma as any).realtimeSettings.create({
        data: {
          enableLiveBidding: true,
          enableNotifications: true,
          updateIntervalMs: 3000
        }
      });
      console.log(`   ✅ Realtime Settings criado`);
    } catch (e) {
      console.log(`   ⚠️ Realtime Settings pode já existir ou tabela não existe`);
    }
  } else {
    console.log(`   ⚠️ Tabela RealtimeSettings não existe - pulando`);
  }

  // 8. ENTITY VIEW METRICS (se existe no schema)
  console.log('[GLOBAL-TABLES] 📊 Populando Entity View Metrics...');
  const metricsExistsFlag = await tableExists(prisma, 'entity_view_metrics');
  if (metricsExistsFlag) {
    const auctions = await prisma.auction.findMany({ take: 10 });
    for (const auction of auctions) {
      try {
        await (prisma as any).entity_view_metrics.create({
          data: {
            entityType: 'Auction',
            entityId: auction.id.toString(),
            viewCount: faker.number.int({ min: 100, max: 5000 }),
            uniqueViewers: faker.number.int({ min: 50, max: 2000 }),
            avgTimeSpent: faker.number.int({ min: 60, max: 600 }),
            lastViewedAt: new Date()
          }
        });
      } catch (e) {
        // Ignora duplicação
      }
    }
    console.log(`   ✅ Métricas de visualização criadas`);
  } else {
    console.log(`   ⚠️ Tabela entity_view_metrics não existe - pulando`);
  }

  // 9. AUDIT CONFIGS (se existe no schema)
  console.log('[GLOBAL-TABLES] 🔍 Populando Audit Configs...');
  const auditConfigsExistsFlag = await tableExists(prisma, 'audit_configs');
  if (auditConfigsExistsFlag) {
    const auditConfigs = [
      { tableName: 'User', isEnabled: true, retentionDays: 365 },
      { tableName: 'Auction', isEnabled: true, retentionDays: 730 },
      { tableName: 'Bid', isEnabled: true, retentionDays: 1095 },
      { tableName: 'Lot', isEnabled: true, retentionDays: 730 },
      { tableName: 'Asset', isEnabled: true, retentionDays: 365 }
    ];

    for (const config of auditConfigs) {
      try {
        await (prisma as any).audit_configs.create({
          data: {
            tableName: config.tableName,
            isEnabled: config.isEnabled,
            retentionDays: config.retentionDays
          }
        });
      } catch (e) {
        // Ignora duplicação
      }
    }
    console.log(`   ✅ ${auditConfigs.length} configurações de auditoria criadas`);
  } else {
    console.log(`   ⚠️ Tabela audit_configs não existe - pulando`);
  }

  // 10. RELAÇÕES N:N (Tabelas de junção) - Todas já implementadas no schema principal
  console.log('[GLOBAL-TABLES] 🔗 Relações N:N já são gerenciadas pelo Prisma automaticamente');
  console.log(`   ✅ Tabelas _JudicialProcessToLot, _AuctionToJudicialDistrict, etc. gerenciadas pelo ORM`);

  console.log('[GLOBAL-TABLES] ✅ Seed de tabelas globais concluído!\n');
}

async function fixAuditInconsistencies(tenantId: bigint) {
  console.log('\n[AUDIT-FIX] 🔧 Iniciando correção de inconsistências de auditoria...');
  
  await fixLotsWithoutAssets(tenantId);
  await fixJudicialAuctionsWithoutProcess(tenantId);
  await fixAuctionsWithoutResponsible(tenantId);
  await fixAssetsWithoutImage(tenantId);
  await fixHabilitationsWithoutDocs(tenantId);
  await createDocumentTemplates(tenantId);
  
  console.log('[AUDIT-FIX] 📈 Incrementando tabelas com poucos dados...');
  await addMoreLotQuestions(tenantId);
  await addMoreReviews(tenantId);
  await addMoreDirectSaleOffers(tenantId);
  await addMoreSubscribers(tenantId);
  await addMoreNotifications(tenantId);
  await addMoreAuditLogs(tenantId);
  await addMoreBidderProfiles(tenantId);
  await addMoreCourts();
  await addMoreSellers(tenantId);
  
  console.log('[AUDIT-FIX] ✅ Correção de inconsistências concluída!\n');
}

async function main() {
  console.log('🌱 Iniciando seed de dados estendidos V3...\n');
  console.log('⚠️  MODO: Adicionar dados sem apagar existentes\n');

  try {
    // 1. LIMPEZA SEGURA - Manter roles e types básicos
    console.log('🧹 Limpeza parcial (mantendo tables base)...');

    // Deletar dependências primeiro (tabelas de relação N:N)
    // await UsersOnTenantsModel.deleteMany({});
    // await prisma.usersOnRoles.deleteMany({});

    // Deletar usuários (exceto seeds essenciais se necessário, aqui limpamos tudo para recriar)
    // await prisma.user.deleteMany({});

    // NÃO deletar Roles e Tenants para preservar estrutura

    console.log('✅ Limpeza concluída');

    // 2. USAR TENANT (Prioridade: DEMO > ID 1)
    console.log('📦 Buscando tenant alvo...');
    const timestamp = Date.now();

    // Tentar encontrar tenant 'demo' primeiro
    let defaultTenant = await prisma.tenant.findFirst({
      where: { subdomain: 'demo' }
    });

    if (defaultTenant) {
        console.log(`✅ Tenant DEMO encontrado (ID ${defaultTenant.id}) - Usando para seed.`);
    } else {
        console.log('ℹ️ Tenant DEMO não encontrado. Buscando tenant padrão...');
        // Tentar encontrar tenant ID 1
        let tenantOne = await prisma.tenant.findUnique({ where: { id: 1 } });
        
        if (tenantOne) {
           console.log('ℹ️ Tenant ID 1 encontrado, atualizando para demo...');
           defaultTenant = await prisma.tenant.update({
             where: { id: 1 },
             data: { subdomain: 'demo', name: 'BidExpert Demo', updatedAt: new Date() }
           });
        } else {
           console.log('ℹ️ Criando novo tenant Demo...');
           // Create new demo tenant
           defaultTenant = await prisma.tenant.create({
            data: {
              // Usually we might want ID 1, but if it's auto-increment, we just let it be. 
              // However, references often assume ID 1. Let's try to force ID 1 if possible or let it slide.
              // If ID is not autoincrement in standard prisma for sqlite/mysql... 
              // Wait, schema usually uses BigInt @id @default(autoincrement()).
              // We can't easily force ID unless we enable identity insert or similar, but Prisma creates allow ID input.
              id: 1, 
              name: 'BidExpert Demo',
              subdomain: 'demo',
              domain: 'localhost',
              updatedAt: new Date()
            },
          });
        }
        console.log(`✅ Tenant Demo configurado (ID ${defaultTenant.id})`);
    }

    // Array com apenas o tenant padrão (para compatibilidade com o resto do código)
    const tenants = [defaultTenant];
    console.log(`✅ Usando tenant ID ${defaultTenant.id}\n`);

    // 3. CRIAR ROLES SE NÃO EXISTIREM
    console.log('🎯 Configurando roles...');
    const roleNames = ['LEILOEIRO', 'COMPRADOR', 'ADMIN', 'ADVOGADO', 'VENDEDOR', 'AVALIADOR'];
    const rolePermissions: Record<string, string[]> = {
      ADMIN: ['manage_all'],
      LEILOEIRO: ['conduct_auctions', 'auctions:manage_assigned', 'lots:manage_assigned'],
      ADVOGADO: ['lawyer_dashboard:view', 'lawyer_cases:view', 'lawyer_documents:manage'],
      COMPRADOR: ['place_bids', 'view_auctions', 'view_lots'],
      VENDEDOR: ['consignor_dashboard:view', 'auctions:manage_own', 'lots:manage_own'],
      AVALIADOR: ['documents:generate_report']
    };
    const roles: any = {};

    for (const roleName of roleNames) {
      let role = await prisma.role.findUnique({
        where: { name: roleName },
      });

      const permissions = rolePermissions[roleName] || [];

      if (!role) {
        role = await prisma.role.create({
          data: {
            name: roleName,
            nameNormalized: roleName.toUpperCase(),
            description: `Role ${roleName}`,
            permissions: permissions,
          },
        });
      } else {
        // Update permissions if role exists
        role = await prisma.role.update({
          where: { id: role.id },
          data: { permissions: permissions },
        });
      }
      roles[roleName] = role;
    }
    console.log(`✅ ${Object.keys(roles).length} roles configurados\n`);

    // 4. CRIAR USUÁRIOS COM MÚLTIPLOS ROLES
    console.log('👥 Criando usuários com múltiplos roles...');
    const senhaHash = await bcrypt.hash('Test@12345', 10);
    const uniqueSuffix = timestamp;

    // --- FIX: Create Fixed Admin User for E2E Tests ---
    console.log('   Creating fixed admin user: admin@bidexpert.com.br');
    const adminHash = await bcrypt.hash('Admin@123', 10);
    try {
        let fixedAdmin = await prisma.user.findUnique({ where: { email: 'admin@bidexpert.com.br' }});
        if (!fixedAdmin) {
            fixedAdmin = await prisma.user.create({
                data: {
                    email: 'admin@bidexpert.com.br',
                    password: adminHash,
                    fullName: 'Fixed Admin For Tests',
                    cpf: '00000000000',
                    accountType: 'PHYSICAL',
                    habilitationStatus: 'HABILITADO',
                    updatedAt: new Date()
                }
            });
            
            await prisma.usersOnRoles.create({
                data: {
                    userId: fixedAdmin.id,
                    roleId: roles['ADMIN'].id,
                    assignedBy: 'system',
                },
            });
            await UsersOnTenantsModel.create({
                data: {
                    userId: fixedAdmin.id,
                    tenantId: tenants[0].id,
                    assignedBy: 'system',
                },
            });
            console.log('   Fixed admin user created and assigned to tenant.');
        } else {
             console.log('   Fixed admin user already exists. Updating password...');
             await prisma.user.update({
                 where: { email: 'admin@bidexpert.com.br' },
                 data: { password: adminHash }
             });
             // Ensure tenant association exists
             const tenantAssociation = await UsersOnTenantsModel.findUnique({
                 where: { userId_tenantId: { userId: fixedAdmin.id, tenantId: tenants[0].id } }
             });
             if (!tenantAssociation) {
                 await UsersOnTenantsModel.create({
                     data: {
                         userId: fixedAdmin.id,
                         tenantId: tenants[0].id,
                         assignedBy: 'system',
                     },
                 });
                 console.log('   Fixed admin user assigned to tenant (was missing).');
             }
        }
    } catch (e) {
        console.log('   Error ensuring fixed admin user (ignoring):', e);
    }
    // --- END FIX ---

    // Usuário 1: Leiloeiro (Admin)
    const leiloeiroUser = await prisma.user.create({
      data: {
        email: `test.leiloeiro.${uniqueSuffix}@bidexpert.com`,
        password: senhaHash,
        fullName: `Leiloeiro Test Premium ${uniqueSuffix}`,
        cpf: `111${uniqueSuffix}`.substring(0, 11),
        accountType: 'PHYSICAL',
        habilitationStatus: 'HABILITADO',
        updatedAt: new Date()
      },
    });

    await Promise.all([
      prisma.usersOnRoles.create({
        data: {
          userId: leiloeiroUser.id,
          roleId: roles['LEILOEIRO'].id,
          assignedBy: 'system',
        },
      }),
      prisma.usersOnRoles.create({
        data: {
          userId: leiloeiroUser.id,
          roleId: roles['COMPRADOR'].id,
          assignedBy: 'system',
        },
      }),
      prisma.usersOnRoles.create({
        data: {
          userId: leiloeiroUser.id,
          roleId: roles['ADMIN'].id,
          assignedBy: 'system',
        },
      }),
    ]);

    // Usuário 2: Comprador
    const compradorUser = await prisma.user.create({
      data: {
        email: `test.comprador.${uniqueSuffix}@bidexpert.com`,
        password: senhaHash,
        fullName: `Comprador Test ${uniqueSuffix}`,
        cpf: `555${uniqueSuffix}`.substring(0, 11),
        accountType: 'PHYSICAL',
        habilitationStatus: 'HABILITADO',
        updatedAt: new Date(),
      },
    });

    await prisma.usersOnRoles.create({
      data: {
        userId: compradorUser.id,
        roleId: roles['COMPRADOR'].id,
        assignedBy: 'system',
      },
    });

    // Usuário 3: Advogado
    const advogadoUser = await prisma.user.create({
      data: {
        email: `advogado.${uniqueSuffix}@bidexpert.com.br`,
        password: senhaHash,
        fullName: `Dr. Advogado Test ${uniqueSuffix}`,
        cpf: `999${uniqueSuffix}`.substring(0, 11),
        accountType: 'PHYSICAL',
        habilitationStatus: 'HABILITADO',
        updatedAt: new Date(),
      },
    });

    await Promise.all([
      prisma.usersOnRoles.create({
        data: {
          userId: advogadoUser.id,
          roleId: roles['ADVOGADO'].id,
          assignedBy: 'system',
        },
      }),
      prisma.usersOnRoles.create({
        data: {
          userId: advogadoUser.id,
          roleId: roles['COMPRADOR'].id,
          assignedBy: 'system',
        },
      }),
    ]);

    // Usuário 4: Vendedor (Comitente) - Perfil Completo e Realista
    const vendedorData = {
        email: `carlos.silva@construtoraabc.com.br`,
        password: senhaHash,
        fullName: `Carlos Eduardo Silva Santos`,
        cpf: `12345678901`,
        rgNumber: `12345678-9`,
        rgIssuer: `SSP/SP`,
        rgIssueDate: new Date('2010-05-15'),
        dateOfBirth: new Date('1985-03-22'),
        cellPhone: `(11) 99999-8888`,
        homePhone: `(11) 3333-4444`,
        gender: 'MASCULINO',
        profession: 'Empresário',
        nationality: 'Brasileiro',
        maritalStatus: 'CASADO',
        propertyRegime: 'COMUNHAO_PARCIAL',
        spouseName: 'Ana Paula Silva Santos',
        spouseCpf: '98765432100',
        zipCode: '01234-567',
        street: 'Rua das Flores',
        number: '123',
        complement: 'Sala 1501',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        avatarUrl: 'https://picsum.photos/seed/consignor-123/200/200',
        dataAiHint: 'consignor_profile',
        habilitationStatus: 'HABILITADO',
        accountType: 'LEGAL',
        // Dados da empresa (Pessoa Jurídica)
        razaoSocial: 'Construtora ABC Ltda',
        cnpj: '12.345.678/0001-90',
        inscricaoEstadual: '123.456.789.012',
        website: 'https://www.construtoraabc.com.br',
        responsibleName: 'Carlos Eduardo Silva Santos',
        responsibleCpf: '12345678901',
        updatedAt: new Date(),
        optInMarketing: true,
    };
    const vendedorUser = await prisma.user.upsert({
      where: { email: vendedorData.email },
      update: {},
      create: vendedorData,
    });

    await Promise.all([
      prisma.usersOnRoles.upsert({
        where: { userId_roleId: { userId: vendedorUser.id, roleId: roles['VENDEDOR'].id } },
        update: {},
        create: {
          userId: vendedorUser.id,
          roleId: roles['VENDEDOR'].id,
          assignedBy: 'system',
        },
      }),
      prisma.usersOnRoles.upsert({
        where: { userId_roleId: { userId: vendedorUser.id, roleId: roles['COMPRADOR'].id } },
        update: {},
        create: {
          userId: vendedorUser.id,
          roleId: roles['COMPRADOR'].id,
          assignedBy: 'system',
        },
      }),
    ]);

    // 4.1 CRIAR DOCUMENTOS DO COMITENTE (VENDEDOR)
    console.log('📄 Criando documentos do comitente...');

    // Buscar tipos de documento existentes ou criar se necessário
    const documentTypes = [
      { name: 'RG', appliesTo: 'PHYSICAL' },
      { name: 'CPF', appliesTo: 'PHYSICAL' },
      { name: 'Comprovante de Endereço', appliesTo: 'BOTH' },
      { name: 'Contrato Social', appliesTo: 'LEGAL' },
      { name: 'CNPJ', appliesTo: 'LEGAL' },
      { name: 'Certidão Negativa de Débitos', appliesTo: 'LEGAL' },
      { name: 'Procuração', appliesTo: 'BOTH' },
    ];

    const createdDocumentTypes: any = {};
    for (const docType of documentTypes) {
      let existingType = await prisma.documentType.findUnique({
        where: { name: docType.name }
      });
      if (!existingType) {
        existingType = await prisma.documentType.create({
          data: docType
        });
      }
      createdDocumentTypes[docType.name] = existingType;
    }

    // Criar documentos para o comitente (Pessoa Física)
    const consignorDocuments = [
      {
        documentTypeId: createdDocumentTypes['RG'].id,
        fileName: 'RG_Carlos_Silva.pdf',
        fileUrl: 'https://example.com/docs/rg-carlos-silva.pdf',
        status: 'APPROVED' as const,
      },
      {
        documentTypeId: createdDocumentTypes['CPF'].id,
        fileName: 'CPF_Carlos_Silva.pdf',
        fileUrl: 'https://example.com/docs/cpf-carlos-silva.pdf',
        status: 'APPROVED' as const,
      },
      {
        documentTypeId: createdDocumentTypes['Comprovante de Endereço'].id,
        fileName: 'Comprovante_Endereco_Carlos_Silva.pdf',
        fileUrl: 'https://example.com/docs/endereco-carlos-silva.pdf',
        status: 'APPROVED' as const,
      },
      // Documentos da empresa (Pessoa Jurídica)
      {
        documentTypeId: createdDocumentTypes['Contrato Social'].id,
        fileName: 'Contrato_Social_Construtora_ABC.pdf',
        fileUrl: 'https://example.com/docs/contrato-social-abc.pdf',
        status: 'APPROVED' as const,
      },
      {
        documentTypeId: createdDocumentTypes['CNPJ'].id,
        fileName: 'CNPJ_Construtora_ABC.pdf',
        fileUrl: 'https://example.com/docs/cnpj-construtora-abc.pdf',
        status: 'APPROVED' as const,
      },
      {
        documentTypeId: createdDocumentTypes['Certidão Negativa de Débitos'].id,
        fileName: 'Certidao_Negativa_Construtora_ABC.pdf',
        fileUrl: 'https://example.com/docs/certidao-negativa-abc.pdf',
        status: 'APPROVED' as const,
      },
      {
        documentTypeId: createdDocumentTypes['Procuração'].id,
        fileName: 'Procuracao_Carlos_Silva.pdf',
        fileUrl: 'https://example.com/docs/procuracao-carlos-silva.pdf',
        status: 'APPROVED' as const,
      },
    ];

    for (const doc of consignorDocuments) {
      await prisma.userDocument.upsert({
        where: { userId_documentTypeId: { userId: vendedorUser.id, documentTypeId: doc.documentTypeId } },
        update: {},
        create: {
          ...doc,
          userId: vendedorUser.id,
          tenantId: tenants[0].id,
          updatedAt: new Date(),
        },
      });
    }

    console.log(`✅ ${consignorDocuments.length} documentos criados para o comitente\n`);

    // --- 4.2 CRIAR DOCUMENTOS DO ADMIN (FIXED ADMIN) ---
    console.log('📄 Criando documentos do admin (Fixed Admin)...');
    
    const fixedAdminForDocs = await prisma.user.findUnique({ where: { email: 'admin@bidexpert.com.br' } });
    
    if (fixedAdminForDocs) {
      const adminDocuments = [
        {
          documentTypeId: createdDocumentTypes['RG'].id,
          fileName: 'RG_Admin.jpg',
          fileUrl: 'https://placehold.co/600x400/png?text=RG+Frente',
          status: 'APPROVED' as const, 
        },
        {
          documentTypeId: createdDocumentTypes['CPF'].id,
          fileName: 'CPF_Admin.jpg',
          fileUrl: 'https://placehold.co/600x400/png?text=CPF+Admin',
          status: 'APPROVED' as const,
        },
        {
          documentTypeId: createdDocumentTypes['Comprovante de Endereço'].id,
          fileName: 'Comprovante_Endereco_Admin.jpg',
          fileUrl: 'https://placehold.co/600x800/png?text=Comprovante+Endereco',
          status: 'APPROVED' as const,
        }
      ];

      for (const doc of adminDocuments) {
        await prisma.userDocument.upsert({
          where: { userId_documentTypeId: { userId: fixedAdminForDocs.id, documentTypeId: doc.documentTypeId } },
          update: {},
          create: {
            ...doc,
            userId: fixedAdminForDocs.id,
            tenantId: tenants[0].id,
            updatedAt: new Date(),
          },
        });
      }
      console.log(`✅ ${adminDocuments.length} documentos criados para o admin\n`);
    }

    // Usuário 5: Avaliador
    const avaliadorUser = await prisma.user.create({
      data: {
        email: `test.avaliador.${uniqueSuffix}@bidexpert.com`,
        password: senhaHash,
        fullName: `Avaliador Test ${uniqueSuffix}`,
        cpf: `777${uniqueSuffix}`.substring(0, 11),
        accountType: 'PHYSICAL',
        updatedAt: new Date(),
        habilitationStatus: 'HABILITADO',
      },
    });

    await prisma.usersOnRoles.upsert({
      where: { userId_roleId: { userId: avaliadorUser.id, roleId: roles['AVALIADOR'].id } },
      update: {},
      create: {
        userId: avaliadorUser.id,
        roleId: roles['AVALIADOR'].id,
        assignedBy: 'system',
      },
    });

    // Usuário 6: Analista de Leilões
    const analistaData = {
        email: `analista@lordland.com`,
        password: await bcrypt.hash('password123', 10), // Senha fixa conforme solicitado
        fullName: `Analista de Leilões Lordland`,
        cpf: `888${uniqueSuffix}`.substring(0, 11),
        accountType: 'PHYSICAL',
        updatedAt: new Date(),
        habilitationStatus: 'HABILITADO',
    };
    const analistaUser = await prisma.user.upsert({
      where: { email: analistaData.email },
      update: {},
      create: analistaData,
    });

    // Garantir que a Role AUCTION_ANALYST existe ou criar
    let auctionAnalystRole = await prisma.role.findFirst({
      where: {
        OR: [
          { name: 'AUCTION_ANALYST' },
          { nameNormalized: 'AUCTION_ANALYST' }
        ]
      }
    });
    if (!auctionAnalystRole) {
      auctionAnalystRole = await prisma.role.create({
        data: {
          name: 'AUCTION_ANALYST',
          nameNormalized: 'AUCTION_ANALYST',
          description: 'Analista de Leilões',
          permissions: [
            'auctions:create', 'auctions:read', 'auctions:update', 'auctions:delete', 'auctions:publish',
            'lots:create', 'lots:read', 'lots:update', 'lots:delete',
            'assets:create', 'assets:read', 'assets:update', 'assets:delete',
            'categories:create', 'categories:read', 'categories:update', 'categories:delete',
            'auctioneers:create', 'auctioneers:read', 'auctioneers:update', 'auctioneers:delete',
            'sellers:create', 'sellers:read', 'sellers:update', 'sellers:delete',
            'judicial_processes:create', 'judicial_processes:read', 'judicial_processes:update', 'judicial_processes:delete',
            'states:read', 'cities:read',
            'media:upload', 'media:read', 'media:update', 'media:delete',
            'view_reports',
          ]
        }
      });
    }

    await prisma.usersOnRoles.upsert({
      where: { userId_roleId: { userId: analistaUser.id, roleId: auctionAnalystRole.id } },
      update: {},
      create: {
        userId: analistaUser.id,
        roleId: auctionAnalystRole.id, // Role ID dinâmico
        assignedBy: 'system',
      },
    });

    // Associar Analista ao Tenant padrão também
    await UsersOnTenantsModel.upsert({
      where: { userId_tenantId: { userId: analistaUser.id, tenantId: tenants[0].id } },
      update: {},
      create: {
        userId: analistaUser.id,
        tenantId: tenants[0].id,
        assignedBy: 'system',
      }
    });


    // Associar usuários aos tenants
    await Promise.all([
      UsersOnTenantsModel.upsert({
        where: { userId_tenantId: { userId: leiloeiroUser.id, tenantId: tenants[0].id } },
        update: {},
        create: {
          userId: leiloeiroUser.id,
          tenantId: tenants[0].id,
        },
      }),
      UsersOnTenantsModel.upsert({
        where: { userId_tenantId: { userId: compradorUser.id, tenantId: tenants[0].id } },
        update: {},
        create: {
          userId: compradorUser.id,
          tenantId: tenants[0].id,
        },
      }),
      UsersOnTenantsModel.upsert({
        where: { userId_tenantId: { userId: advogadoUser.id, tenantId: tenants[0].id } },
        update: {},
        create: {
          userId: advogadoUser.id,
          tenantId: tenants[0].id,
        },
      }),
      UsersOnTenantsModel.upsert({
        where: { userId_tenantId: { userId: vendedorUser.id, tenantId: tenants[0].id } },
        update: {},
        create: {
          userId: vendedorUser.id,
          tenantId: tenants[0].id,
        },
      }),
      UsersOnTenantsModel.upsert({
        where: { userId_tenantId: { userId: avaliadorUser.id, tenantId: tenants[0].id } },
        update: {},
        create: {
          userId: avaliadorUser.id,
          tenantId: tenants[0].id,
        },
      }),
    ]);

    console.log(`✅ 5 usuários criados\n`);

    const usuarios = [leiloeiroUser, compradorUser, advogadoUser, vendedorUser, avaliadorUser];

    type SeedEntityType = 'auction' | 'lot' | 'asset' | 'seller';

    const createSeedMediaItem = async (
      entityType: SeedEntityType,
      identifier: string,
      variant: number,
      overrides: Partial<Prisma.MediaItemCreateInput> = {}
    ) => {
      const safeIdentifier = identifier || `${entityType}-${variant}`;
      const seed = `${safeIdentifier}-${variant}`;
      const encodedSeed = encodeURIComponent(seed);
      const defaultData: Prisma.MediaItemCreateInput = {
        fileName: `${seed}.jpg`,
        storagePath: `media-seed/${entityType}/${safeIdentifier}/${seed}.jpg`,
        urlOriginal: `https://picsum.photos/seed/${encodedSeed}/1600/900`,
        urlThumbnail: `https://picsum.photos/seed/${encodedSeed}/600/338`,
        urlMedium: `https://picsum.photos/seed/${encodedSeed}/1024/768`,
        urlLarge: `https://picsum.photos/seed/${encodedSeed}/1920/1080`,
        mimeType: 'image/jpeg',
        sizeBytes: 120000 + Math.floor(Math.random() * 120000),
        altText: `Foto ${variant} do ${entityType}`,
        caption: `Galeria ${variant} de ${entityType} ${safeIdentifier}`,
        description: `Imagem gerada automaticamente para ${entityType} ${safeIdentifier}.`,
        title: `${safeIdentifier} ${entityType} ${variant}`,
        dataAiHint: entityType,
        // uploadedByUserId: leiloeiroUser.id, // REMOVED: Property does not exist
        Tenant: { connect: { id: tenants[0].id } },
        ...overrides,
      };

      return prisma.mediaItem.create({ data: defaultData });
    };

    // 5. CRIAR ESTRUTURA JUDICIAL PARA O PAINEL DO ADVOGADO
    console.log('⚖️  Criando estrutura judicial para advogado...');

    const judicialTimestamp = Date.now();

    // Criar Court (Tribunal)
    const court = await prisma.court.create({
      data: {
        slug: `tribunal-sp-${judicialTimestamp}`,
        name: 'Tribunal de Justiça de São Paulo',
        stateUf: 'SP',
        website: 'https://www.tjsp.jus.br',
        updatedAt: new Date(),
      },
    });

    // Criar JudicialDistrict (Comarca)
    const district = await prisma.judicialDistrict.create({
      data: {
        slug: `comarca-sao-paulo-${judicialTimestamp}`,
        name: `Comarca de São Paulo ${judicialTimestamp}`,
        courtId: court.id,
        updatedAt: new Date(),
      },
    });

    // Criar JudicialBranch (Vara)
    const judicialBranch = await prisma.judicialBranch.create({
      data: {
        slug: `vara-civel-01-${judicialTimestamp}`,
        name: `Vara Cível da Capital ${judicialTimestamp}`,
        districtId: district.id,
        contactName: 'Dr. João Silva',
        phone: '(11) 3133-1000',
        email: 'vara.civel@tjsp.jus.br',
        updatedAt: new Date(),
      },
    });

    // Criar Seller (Comitente Realista - Construtora ABC)
    let seller = await prisma.seller.findFirst({
         where: { name: 'Construtora ABC Ltda - Comitente' }
    });

    if (!seller) {
        seller = await prisma.seller.create({
        data: {
            publicId: `seller-construtora-abc-${judicialTimestamp}`,
            slug: `construtora-abc-leiloes-${judicialTimestamp}`,
            name: `Construtora ABC Ltda - Comitente`,
            description: 'Construtora ABC Ltda - Empresa especializada em construção civil e incorporação imobiliária. Realizando leilão judicial de imóveis penhorados em processo de execução hipotecária.',
            logoUrl: null,
            website: 'https://www.construtoraabc.com.br',
            email: 'leiloes@construtoraabc.com.br',
            phone: '(11) 3333-4444',
            contactName: 'Carlos Eduardo Silva Santos',
            address: 'Rua das Flores, 123 - Sala 1501',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234-567',
            tenantId: tenants[0].id,
            userId: vendedorUser.id, // Vincular ao usuário vendedor criado
            judicialBranchId: judicialBranch.id,
            isJudicial: true,
            updatedAt: new Date(),
        },
        });
    }

    const sellerLogo = await createSeedMediaItem('seller', seller.slug, 1, {
      dataAiHint: 'logo comitente',
    });

    await prisma.seller.update({
      where: { id: seller.id },
      data: {
        logoUrl: sellerLogo.urlOriginal,
        logoMediaId: sellerLogo.id,
        dataAiHintLogo: 'logo comitente institucional',
      },
    });

    console.log('✅ Estrutura judicial criada\n');

    // 5. CRIAR AUCTIONS (LEILÕES)
    console.log('🔨 Criando auctions...');
    // Reusing timestamp from above

    // CEPs dos centros das capitais brasileiras
    const capitalZipCodes = {
      'São Paulo': '01001-000', // Praça da Sé
      'Rio de Janeiro': '20040-002', // Praça Floriano
      'Belo Horizonte': '30170-130', // Praça da Liberdade
      'Brasília': '70040-000', // Esplanada dos Ministérios
      'Salvador': '40020-010', // Praça da Sé
      'Fortaleza': '60030-000', // Praça do Ferreira
      'Curitiba': '80020-000', // Praça Tiradentes
      'Manaus': '69005-010', // Praça da Saudade
      'Recife': '50010-010', // Praça do Marco Zero
      'Porto Alegre': '90010-150', // Praça da Matriz
      'Belém': '66010-000', // Praça da República
      'Goiânia': '74003-010', // Praça Cívica
      'São Luís': '65010-000', // Praça Pedro II
      'Maceió': '57020-000', // Praça dos Martírios
      'Natal': '59025-000', // Praça 7 de Setembro
      'Campo Grande': '79002-000', // Praça Ary Coelho
      'Teresina': '64000-020', // Praça da Bandeira
      'João Pessoa': '58010-000', // Praça João Pessoa
      'Aracaju': '49010-000', // Praça Fausto Cardoso
      'Cuiabá': '78005-000', // Praça da República
      'Porto Velho': '76801-000', // Praça Marechal Rondon
      'Florianópolis': '88010-000', // Praça XV de Novembro
      'Macapá': '68900-000', // Praça Veiga Cabral
      'Rio Branco': '69900-000', // Praça da Revolução
      'Vitória': '29010-000', // Praça Costa Pereira
      'Boa Vista': '69301-000', // Praça do Centro Cívico
      'Palmas': '77001-000', // Praça dos Girassóis
    };

    const auctions = await Promise.all([
      // Leilão 1: Judicial - Imóveis (com processo judicial)
      prisma.auction.create({
        data: {
          publicId: `auction-${timestamp}-1`,
          slug: `auction-judicial-imovel-${timestamp}-1`,
          title: 'Leilão Judicial - Imóveis Comerciais',
          description: 'Leilão de imóveis comerciais de primeira linha. Leilão de caráter judicial com imóveis de alta qualidade.',
          status: 'ABERTO',
          auctionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          tenantId: tenants[0].id,
          auctionType: 'JUDICIAL',
          auctionMethod: 'STANDARD',
          participation: 'ONLINE',
          sellerId: seller.id,
          address: 'Av. Paulista, 1000 - Bela Vista',
          zipCode: capitalZipCodes['São Paulo'],
          supportPhone: '(11) 3000-1000', // Contato específico do leilão (prioridade 1)
          supportEmail: 'suporte.leilao1@bidexpert.com.br', // Email específico do leilão
          supportWhatsApp: '(11) 99000-1000', // WhatsApp específico do leilão
          updatedAt: new Date(),
        },
      }),
      // Leilão 2: Extrajudicial - Veículos
      prisma.auction.create({
        data: {
          publicId: `auction-${timestamp}-2`,
          slug: `auction-extrajudicial-veiculo-${timestamp}-2`,
          title: 'Leilão Extrajudicial - Veículos',
          description: 'Leilão de veículos apreendidos. Veículos de diversos modelos e marcas.',
          status: 'ABERTO',
          auctionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          tenantId: tenants[0].id,
          auctionType: 'EXTRAJUDICIAL',
          auctionMethod: 'STANDARD',
          participation: 'ONLINE',
          address: 'Av. Atlântica, 500 - Copacabana',
          zipCode: capitalZipCodes['Rio de Janeiro'],
          updatedAt: new Date(),
        },
      }),
      // Leilão 3: Particular - Maquinários
      prisma.auction.create({
        data: {
          publicId: `auction-${timestamp}-3`,
          slug: `auction-particular-maquinario-${timestamp}-3`,
          title: 'Leilão Particular - Maquinários Industriais',
          description: 'Leilão de maquinários e equipamentos industriais. Equipamentos de indústria pesada.',
          status: 'EM_PREPARACAO',
          auctionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          tenantId: tenants[0].id,
          auctionType: 'PARTICULAR',
          auctionMethod: 'STANDARD',
          participation: 'HIBRIDO',
          address: 'Av. Afonso Pena, 1000 - Centro',
          zipCode: capitalZipCodes['Belo Horizonte'],
          updatedAt: new Date(),
        },
      }),
      // Leilão 4: Tomada de Preços - Mobiliários
      prisma.auction.create({
        data: {
          publicId: `auction-${timestamp}-4`,
          slug: `auction-tomada-preco-mobiliario-${timestamp}-4`,
          title: 'Tomada de Preços - Móveis e Equipamentos',
          description: 'Tomada de preços para diversos móveis e equipamentos de escritório.',
          status: 'ABERTO_PARA_LANCES',
          auctionDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          tenantId: tenants[0].id,
          auctionType: 'TOMADA_DE_PRECOS',
          auctionMethod: 'STANDARD',
          participation: 'PRESENCIAL',
          address: 'Esplanada dos Ministérios - Brasília',
          zipCode: capitalZipCodes['Brasília'],
          updatedAt: new Date(),
        },
      }),
    ]);
    console.log(`✅ ${auctions.length} auctions criados\n`);

    console.log('🖼️ Registrando imagens para os leilões...');
    for (const auction of auctions) {
      const auctionIdentifier = auction.slug || auction.publicId || `auction-${auction.id}`;
      const imageCount = 2 + Math.floor(Math.random() * 2);
      let primaryMediaId: bigint | undefined;
      for (let variant = 1; variant <= imageCount; variant++) {
        const mediaItem = await createSeedMediaItem('auction', auctionIdentifier, variant);
        if (!primaryMediaId) {
          primaryMediaId = mediaItem.id;
        }
      }
      if (primaryMediaId) {
        await prisma.auction.update({
          where: { id: auction.id },
          data: {
            imageMediaId: primaryMediaId,
          },
        });
      }
    }
    console.log('✅ Galeria inicial dos leilões populada\n');

    // 5.5 CRIAR AUCTION STAGES (PRAÇAS) PARA OS LEILÕES
    console.log('🏛️  Criando auction stages (praças) para os leilões...');

    const auctionStages = [];

    // Criar 2 praças para o Leilão Judicial 1 (Imóveis)
    const stage1_1 = await prisma.auctionStage.create({
      data: {
        name: '1ª Praça',
        auctionId: auctions[0].id,
        tenantId: tenants[0].id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        status: 'AGUARDANDO_INICIO',
      },
    });
    auctionStages.push(stage1_1);

    const stage1_2 = await prisma.auctionStage.create({
      data: {
        name: '2ª Praça',
        auctionId: auctions[0].id,
        tenantId: tenants[0].id,
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
        status: 'AGENDADO',
      },
    });
    auctionStages.push(stage1_2);

    // Criar 1 praça para o Leilão Extrajudicial 2 (Veículos)
    const stage2_1 = await prisma.auctionStage.create({
      data: {
        name: 'Praça Única',
        auctionId: auctions[1].id,
        tenantId: tenants[0].id,
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        status: 'AGUARDANDO_INICIO',
      },
    });
    auctionStages.push(stage2_1);

    // Criar 1 praça para o Leilão Particular 3 (Maquinários)
    const stage3_1 = await prisma.auctionStage.create({
      data: {
        name: '1ª Praça',
        auctionId: auctions[2].id,
        tenantId: tenants[0].id,
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'AGENDADO',
      },
    });
    auctionStages.push(stage3_1);

    // Criar 1 praça para o Leilão Tomada de Preços 4
    const stage4_1 = await prisma.auctionStage.create({
      data: {
        name: 'Praça Única',
        auctionId: auctions[3].id,
        tenantId: tenants[0].id,
        startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'AGUARDANDO_INICIO',
      },
    });
    auctionStages.push(stage4_1);

    console.log(`✅ ${auctionStages.length} auction stages (praças) criados\n`);

    // 6.1 CRIAR PROCESSOS JUDICIAIS PARA O PAINEL DO ADVOGADO
    console.log('⚖️  Criando processos judiciais...');

    // Processo Judicial 1 - Para Sala Comercial
    const judicialProcess1 = await prisma.judicialProcess.create({
      data: {
        publicId: `process-${judicialTimestamp}-001`,
        processNumber: `0012345-06.2024.8.26.0100-${judicialTimestamp}`,
        isElectronic: true,
        tenantId: tenants[0].id,
        courtId: court.id,
        districtId: district.id,
        branchId: judicialBranch.id,
        sellerId: seller.id,
        JudicialParty: {
          create: [
            {
              name: 'Banco Brasil S.A.',
              documentNumber: '00.000.000/0000-00',
              partyType: 'AUTOR',
              tenantId: tenants[0].id,
            },
            {
              name: 'João da Silva Santos',
              documentNumber: '123.456.789-10',
              partyType: 'REU',
              tenantId: tenants[0].id,
            },
            {
              name: 'Dr. Advogado Test',
              documentNumber: '99988877766',
              partyType: 'ADVOGADO_AUTOR',
              tenantId: tenants[0].id,
            },
          ],
        },
      },
    });

    // Processo Judicial 2 - Para Apartamento
    const judicialProcess2 = await prisma.judicialProcess.create({
      data: {
        publicId: `process-${judicialTimestamp}-002`,
        processNumber: `0054321-12.2024.8.26.0100-${judicialTimestamp}`,
        isElectronic: true,
        tenantId: tenants[0].id,
        courtId: court.id,
        districtId: district.id,
        branchId: judicialBranch.id,
        sellerId: seller.id,
        JudicialParty: {
          create: [
            {
              name: 'Caixa Econômica Federal',
              documentNumber: '70.000.000/0000-00',
              partyType: 'AUTOR',
              tenantId: tenants[0].id,
            },
            {
              name: 'Maria Silva Costa',
              documentNumber: '987.654.321-00',
              partyType: 'REU',
              tenantId: tenants[0].id,
            },
            {
              name: 'Dr. Advogado Test',
              documentNumber: '99988877766',
              partyType: 'ADVOGADO_AUTOR',
              tenantId: tenants[0].id,
            },
          ],
        },
      },
    });

    // Processo Judicial 3 - Para Galpão
    const judicialProcess3 = await prisma.judicialProcess.create({
      data: {
        publicId: `process-${judicialTimestamp}-003`,
        processNumber: `0098765-03.2024.8.26.0100-${judicialTimestamp}`,
        isElectronic: true,
        tenantId: tenants[0].id,
        courtId: court.id,
        districtId: district.id,
        branchId: judicialBranch.id,
        sellerId: seller.id,
        JudicialParty: {
          create: [
            {
              name: 'Banco do Brasil S.A.',
              documentNumber: '00.000.000/0001-91',
              partyType: 'AUTOR',
              tenantId: tenants[0].id,
            },
            {
              name: 'Empresa XYZ Comércio LTDA',
              documentNumber: '00.000.000/0000-99',
              partyType: 'REU',
              tenantId: tenants[0].id,
            },
            {
              name: 'Dr. Advogado Test',
              documentNumber: '99988877766',
              partyType: 'ADVOGADO_AUTOR',
              tenantId: tenants[0].id,
            },
          ],
        },
      },
    });

    console.log('✅ 3 processos judiciais criados\n');

    // 6. CRIAR LOTS (LOTES)
    console.log('📦 Criando lots...');

    // Localizações com endereços das capitais
    const lotLocations = {
      salaComercial: { cityName: 'São Paulo', stateUf: 'SP', address: 'Av. Paulista, 1500 - Sala 201' },
      apartamento: { cityName: 'São Paulo', stateUf: 'SP', address: 'Rua Augusta, 2300 - Apto 501' },
      galpao: { cityName: 'São Paulo', stateUf: 'SP', address: 'Av. Industrial, 1000' },
      civic: { cityName: 'Rio de Janeiro', stateUf: 'RJ', address: 'Av. Atlântica, 3500' },
      corolla: { cityName: 'Rio de Janeiro', stateUf: 'RJ', address: 'Av. Brasil, 5000' },
      uno: { cityName: 'Rio de Janeiro', stateUf: 'RJ', address: 'Rua da Carioca, 100' },
      torno: { cityName: 'Belo Horizonte', stateUf: 'MG', address: 'Av. Amazonas, 1500' },
      cadeiras: { cityName: 'Brasília', stateUf: 'DF', address: 'SCS Quadra 1' },
    };

    const lots = await Promise.all([
      // Lotes do Leilão 1 (Imóveis)
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-1`,
          auctionId: auctions[0].id,
          tenantId: tenants[0].id,
          number: 'L001',
          title: 'Sala Comercial 100m² - Centro',
          description: 'Sala comercial de 100m² localizada no centro da cidade com infraestrutura completa. Imóvel objeto de execução judicial.',
          type: 'IMOVEL',
          price: new Prisma.Decimal('150000.00'),
          initialPrice: new Prisma.Decimal('120000.00'),
          bidIncrementStep: new Prisma.Decimal('1000.00'),
          status: 'ABERTO_PARA_LANCES',
          cityName: lotLocations.salaComercial.cityName,
          stateUf: lotLocations.salaComercial.stateUf,
          mapAddress: lotLocations.salaComercial.address,
          updatedAt: new Date(),
        },
      }),
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-2`,
          auctionId: auctions[0].id,
          tenantId: tenants[0].id,
          number: 'L002',
          title: 'Apartamento 2Q - Zona Residencial',
          description: 'Apartamento com 2 quartos, 1 banheiro, cozinha, garagem para 1 veículo. Imóvel sob execução hipotecária.',
          type: 'IMOVEL',
          price: new Prisma.Decimal('250000.00'),
          initialPrice: new Prisma.Decimal('200000.00'),
          bidIncrementStep: new Prisma.Decimal('2000.00'),
          status: 'ABERTO_PARA_LANCES',
          cityName: lotLocations.apartamento.cityName,
          stateUf: lotLocations.apartamento.stateUf,
          mapAddress: lotLocations.apartamento.address,
          updatedAt: new Date(),
        },
      }),
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-3`,
          auctionId: auctions[0].id,
          tenantId: tenants[0].id,
          number: 'L003',
          title: 'Galpão Industrial 500m² - Zona Industrial',
          description: 'Galpão industrial com 500m², pé direito 6m, porto de carga. Perfeito para indústria. Bem penhorado em processo judicial.',
          type: 'IMOVEL',
          price: new Prisma.Decimal('450000.00'),
          initialPrice: new Prisma.Decimal('380000.00'),
          bidIncrementStep: new Prisma.Decimal('5000.00'),
          status: 'ABERTO_PARA_LANCES',
          cityName: lotLocations.galpao.cityName,
          stateUf: lotLocations.galpao.stateUf,
          mapAddress: lotLocations.galpao.address,
          updatedAt: new Date(),
        },
      }),
      // Lotes do Leilão 2 (Veículos)
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-4`,
          auctionId: auctions[1].id,
          tenantId: tenants[0].id,
          number: 'L001',
          title: 'Honda Civic 2020 Automático',
          description: 'Honda Civic modelo 2020, automático, branco, 45.000 km, em perfeito estado.',
          type: 'VEICULO',
          price: new Prisma.Decimal('75000.00'),
          initialPrice: new Prisma.Decimal('60000.00'),
          bidIncrementStep: new Prisma.Decimal('500.00'),
          status: 'ABERTO_PARA_LANCES',
          cityName: lotLocations.civic.cityName,
          stateUf: lotLocations.civic.stateUf,
          mapAddress: lotLocations.civic.address,
          updatedAt: new Date(),
        },
      }),
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-5`,
          auctionId: auctions[1].id,
          tenantId: tenants[0].id,
          number: 'L002',
          title: 'Toyota Corolla 2019 Automático',
          description: 'Toyota Corolla modelo 2019, automático, prata, 52.000 km, revisado.',
          type: 'VEICULO',
          price: new Prisma.Decimal('65000.00'),
          initialPrice: new Prisma.Decimal('52000.00'),
          bidIncrementStep: new Prisma.Decimal('500.00'),
          status: 'ABERTO_PARA_LANCES',
          cityName: lotLocations.corolla.cityName,
          stateUf: lotLocations.corolla.stateUf,
          mapAddress: lotLocations.corolla.address,
          updatedAt: new Date(),
        },
      }),
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-6`,
          auctionId: auctions[1].id,
          tenantId: tenants[0].id,
          number: 'L003',
          title: 'Fiat Uno 2018 Hatch',
          description: 'Fiat Uno 2018, hatch, 1.0, vermelho, 35.000 km, impecável.',
          type: 'VEICULO',
          price: new Prisma.Decimal('45000.00'),
          initialPrice: new Prisma.Decimal('38000.00'),
          bidIncrementStep: new Prisma.Decimal('300.00'),
          status: 'ABERTO_PARA_LANCES',
          cityName: lotLocations.uno.cityName,
          stateUf: lotLocations.uno.stateUf,
          mapAddress: lotLocations.uno.address,
          updatedAt: new Date(),
        },
      }),
      // Lotes do Leilão 3 (Maquinários)
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-7`,
          auctionId: auctions[2].id,
          tenantId: tenants[0].id,
          number: 'L001',
          title: 'Torno Mecânico CNC - Indústria',
          description: 'Torno mecânico CNC profissional, modelo industrial, totalmente funcional.',
          type: 'MAQUINARIO',
          price: new Prisma.Decimal('850000.00'),
          initialPrice: new Prisma.Decimal('700000.00'),
          bidIncrementStep: new Prisma.Decimal('10000.00'),
          status: 'RASCUNHO',
          cityName: lotLocations.torno.cityName,
          stateUf: lotLocations.torno.stateUf,
          mapAddress: lotLocations.torno.address,
          updatedAt: new Date(),
        },
      }),
      // Lotes do Leilão 4 (Mobiliários)
      prisma.lot.create({
        data: {
          publicId: `lot-${timestamp}-8`,
          auctionId: auctions[3].id,
          tenantId: tenants[0].id,
          number: 'L001',
          title: 'Lote de 50 Cadeiras Gamer',
          description: 'Lote contendo 50 cadeiras gamer de qualidade premium, novas.',
          type: 'MOBILIARIO',
          price: new Prisma.Decimal('25000.00'),
          initialPrice: new Prisma.Decimal('20000.00'),
          bidIncrementStep: new Prisma.Decimal('500.00'),
          status: 'ABERTO_PARA_LANCES',
          cityName: lotLocations.cadeiras.cityName,
          stateUf: lotLocations.cadeiras.stateUf,
          mapAddress: lotLocations.cadeiras.address,
          updatedAt: new Date(),
        },
      }),
    ]);
    console.log(`✅ ${lots.length} lots criados\n`);

    console.log('🖼️ Adicionando galerias de imagens aos lots...');
    for (const lot of lots) {
      const lotIdentifier = lot.slug || lot.publicId || `lot-${lot.id}`;
      const lotImageCount = 2 + Math.floor(Math.random() * 2);
      const galleryUrls: string[] = [];
      const mediaIds: bigint[] = [];
      for (let variant = 1; variant <= lotImageCount; variant++) {
        const mediaItem = await createSeedMediaItem('lot', lotIdentifier, variant, {
          linkedLotIds: [lot.id.toString()] as Prisma.JsonArray,
          dataAiHint: lot.type || 'lot',
        });
        galleryUrls.push(mediaItem.urlOriginal);
        mediaIds.push(mediaItem.id);
      }

      if (mediaIds.length) {
        await prisma.lot.update({
          where: { id: lot.id },
          data: {
            imageUrl: galleryUrls[0],
            galleryImageUrls: galleryUrls,
            mediaItemIds: mediaIds.map(id => id.toString()),
            imageMediaId: mediaIds[0],
          },
        });
      }
    }
    console.log('✅ Galerias dos lots populadas\n');

    // 7. CRIAR BIDS (LANCES)
    console.log('💰 Criando bids...');
    const bids = await Promise.all([
      // Bids no Lote 1 (Sala Comercial)
      prisma.bid.create({
        data: {
          lotId: lots[0].id,
          auctionId: auctions[0].id,
          bidderId: compradorUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('125000.00'),
          bidderDisplay: 'Comprador Test',
        },
      }),
      prisma.bid.create({
        data: {
          lotId: lots[0].id,
          auctionId: auctions[0].id,
          bidderId: advogadoUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('135000.00'),
          bidderDisplay: 'Dr. Advogado Test',
        },
      }),
      prisma.bid.create({
        data: {
          lotId: lots[0].id,
          auctionId: auctions[0].id,
          bidderId: compradorUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('140000.00'),
          bidderDisplay: 'Comprador Test',
        },
      }),
      // Bids no Lote 2 (Apartamento)
      prisma.bid.create({
        data: {
          lotId: lots[1].id,
          auctionId: auctions[0].id,
          bidderId: advogadoUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('210000.00'),
          bidderDisplay: 'Dr. Advogado Test',
        },
      }),
      prisma.bid.create({
        data: {
          lotId: lots[1].id,
          auctionId: auctions[0].id,
          bidderId: compradorUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('220000.00'),
          bidderDisplay: 'Comprador Test',
        },
      }),
      // Bids no Lote 3 (Galpão)
      prisma.bid.create({
        data: {
          lotId: lots[2].id,
          auctionId: auctions[0].id,
          bidderId: vendedorUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('400000.00'),
          bidderDisplay: 'Vendedor Test',
        },
      }),
      // Bids nos Veículos
      prisma.bid.create({
        data: {
          lotId: lots[3].id,
          auctionId: auctions[1].id,
          bidderId: compradorUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('62000.00'),
          bidderDisplay: 'Comprador Test',
        },
      }),
      prisma.bid.create({
        data: {
          lotId: lots[3].id,
          auctionId: auctions[1].id,
          bidderId: advogadoUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('68000.00'),
          bidderDisplay: 'Dr. Advogado Test',
        },
      }),
      prisma.bid.create({
        data: {
          lotId: lots[4].id,
          auctionId: auctions[1].id,
          bidderId: compradorUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('55000.00'),
          bidderDisplay: 'Comprador Test',
        },
      }),
      prisma.bid.create({
        data: {
          lotId: lots[5].id,
          auctionId: auctions[1].id,
          bidderId: vendedorUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('40000.00'),
          bidderDisplay: 'Vendedor Test',
        },
      }),
      // Bids no lote de móveis
      prisma.bid.create({
        data: {
          lotId: lots[7].id,
          auctionId: auctions[3].id,
          bidderId: compradorUser.id,
          tenantId: tenants[0].id,
          amount: new Prisma.Decimal('21000.00'),
          bidderDisplay: 'Comprador Test',
        },
      }),
    ]);
    console.log(`✅ ${bids.length} bids criados\n`);

    // 8. CRIAR HABILITAÇÃO PARA AUCTIONS
    console.log('✅ Habilitando usuários para auctions...');
    const habilitacoes = await Promise.all([
      // Habilitações para Leilão 1
      prisma.auctionHabilitation.create({
        data: {
          userId: compradorUser.id,
          auctionId: auctions[0].id,
          tenantId: tenants[0].id,
        },
      }),
      prisma.auctionHabilitation.create({
        data: {
          userId: advogadoUser.id,
          auctionId: auctions[0].id,
          tenantId: tenants[0].id,
        },
      }),
      prisma.auctionHabilitation.create({
        data: {
          userId: vendedorUser.id,
          auctionId: auctions[0].id,
          tenantId: tenants[0].id,
        },
      }),
      // Habilitações para Leilão 2
      prisma.auctionHabilitation.create({
        data: {
          userId: compradorUser.id,
          auctionId: auctions[1].id,
          tenantId: tenants[0].id,
        },
      }),
      prisma.auctionHabilitation.create({
        data: {
          userId: advogadoUser.id,
          auctionId: auctions[1].id,
          tenantId: tenants[0].id,
        },
      }),
      prisma.auctionHabilitation.create({
        data: {
          userId: vendedorUser.id,
          auctionId: auctions[1].id,
          tenantId: tenants[0].id,
        },
      }),
      // Habilitações para Leilão 3
      prisma.auctionHabilitation.create({
        data: {
          userId: vendedorUser.id,
          auctionId: auctions[2].id,
          tenantId: tenants[0].id,
        },
      }),
      // Habilitações para Leilão 4
      prisma.auctionHabilitation.create({
        data: {
          userId: compradorUser.id,
          auctionId: auctions[3].id,
          tenantId: tenants[0].id,
        },
      }),
    ]);
    console.log(`✅ ${habilitacoes.length} habilitações criadas\n`);

    // 7. CRIAR DADOS ADICIONAIS PARA TENANT 1 - ESTRUTURA EXPANDIDA
    console.log('\n📍 Criando dados expandidos para tenant 1...');

    // Importar services (usando dynamic require para compatibilidade com seed)
    // const { JudicialProcessService } = require('@/services/judicial-process.service');
    // const judicialProcessService = new JudicialProcessService();

    const tenant1Id = tenants[0].id.toString();

    // 7.1 CRIAR MAIS LEILOEIROS
    console.log('👨‍💼 Criando leiloeiros adicionais...');
    const auctioneerEmailPrefixes = [
      'leiloeiro.sp.01',
      'leiloeiro.rj.01',
      'leiloeiro.mg.01',
    ];

    const additionalAuctioneers = [];
    for (const emailPrefix of auctioneerEmailPrefixes) {
      const email = `${emailPrefix}.${uniqueSuffix}@bidexpert.com`;
      const senhaHash = await bcrypt.hash('Test@12345', 10);
      const auctioneer = await prisma.user.create({
        data: {
          email,
          password: senhaHash,
          fullName: emailPrefix.split('.').join(' ').toUpperCase(),
          cpf: `${Math.floor(Math.random() * 100000000000)}`.padStart(11, '0'),
          accountType: 'PHYSICAL',
          habilitationStatus: 'HABILITADO',
          updatedAt: new Date(),
        },
      });

      await prisma.usersOnRoles.create({
        data: {
          userId: auctioneer.id,
          roleId: roles['LEILOEIRO'].id,
          assignedBy: 'system',
        },
      });

      await UsersOnTenantsModel.create({
        data: {
          userId: auctioneer.id,
          tenantId: tenants[0].id,
        },
      });

      // Criar Auctioneer record com slug único
      const auctioneerTimestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const auctioneerRecord = await prisma.auctioneer.create({
        data: {
          publicId: `auctn-${auctioneerTimestamp}-${randomSuffix}`,
          slug: `leiloeiro-${email.split('@')[0].replace(/\./g, '-')}-${randomSuffix}`,
          name: email.split('@')[0].replace(/\./g, ' ').toUpperCase(),
          tenantId: tenants[0].id,
          userId: auctioneer.id,
          updatedAt: new Date(),
        },
      });

      additionalAuctioneers.push(auctioneerRecord);
    }
    console.log('✅ 3 leiloeiros adicionais criados\n');

    // 7.2 CRIAR MAIS COMARCAS E VARAS
    console.log('⚖️  Criando estrutura judicial expandida...');

    const additionalDistricts = await Promise.all([
      prisma.judicialDistrict.create({
        data: {
          slug: `comarca-rj-${judicialTimestamp}`,
          name: `Comarca do Rio de Janeiro ${judicialTimestamp}`,
          courtId: court.id,
          updatedAt: new Date(),
        },
      }),
      prisma.judicialDistrict.create({
        data: {
          slug: `comarca-mg-${judicialTimestamp}`,
          name: `Comarca de Belo Horizonte ${judicialTimestamp}`,
          courtId: court.id,
          updatedAt: new Date(),
        },
      }),
    ]);

    const additionalBranches = await Promise.all([
      prisma.judicialBranch.create({
        data: {
          slug: `vara-civel-rj-${judicialTimestamp}`,
          name: `Vara Cível RJ ${judicialTimestamp}`,
          districtId: additionalDistricts[0].id,
          contactName: 'Dra. Maria Silva',
          phone: '(21) 2131-1000',
          email: 'vara.civel.rj@tribunal.rj.jus.br',
          updatedAt: new Date(),
        },
      }),
      prisma.judicialBranch.create({
        data: {
          slug: `vara-civel-mg-${judicialTimestamp}`,
          name: `Vara Cível MG ${judicialTimestamp}`,
          districtId: additionalDistricts[1].id,
          contactName: 'Dr. Carlos Costa',
          phone: '(31) 3207-1000',
          email: 'vara.civel.mg@tribunal.mg.jus.br',
          updatedAt: new Date(),
        },
      }),
    ]);

    console.log('✅ 2 comarcas e 2 varas adicionais criadas\n');

    // 7.3 CRIAR VENDEDORES JUDICIAIS ADICIONAIS
    console.log('🏛️  Criando vendedores judiciais adicionais...');
    const additionalSellers = await Promise.all([
      prisma.seller.create({
        data: {
          publicId: `seller-rj-${judicialTimestamp}`,
          slug: `leiloeiro-judicial-rj-${judicialTimestamp}`,
          name: `Leiloeiro Judicial RJ ${judicialTimestamp}`,
          description: 'Leiloeiro autorizado pelo Tribunal de Justiça do Rio de Janeiro',
          logoUrl: null,
          tenantId: tenants[0].id,
          judicialBranchId: additionalBranches[0].id,
          updatedAt: new Date(),
        },
      }),
      prisma.seller.create({
        data: {
          publicId: `seller-mg-${judicialTimestamp}`,
          slug: `leiloeiro-judicial-mg-${judicialTimestamp}`,
          name: `Leiloeiro Judicial MG ${judicialTimestamp}`,
          description: 'Leiloeiro autorizado pelo Tribunal de Justiça de Minas Gerais',
          logoUrl: null,
          tenantId: tenants[0].id,
          judicialBranchId: additionalBranches[1].id,
          updatedAt: new Date(),
        },
      }),
    ]);

    for (const sellerItem of additionalSellers) {
      const logo = await createSeedMediaItem('seller', sellerItem.slug, 1, { dataAiHint: 'logo comitente' });
      await prisma.seller.update({
        where: { id: sellerItem.id },
        data: {
          logoUrl: logo.urlOriginal,
          logoMediaId: logo.id,
          dataAiHintLogo: 'logo comitente institucional',
        },
      });
    }

    console.log('✅ 2 vendedores judiciais adicionais criados\n');

    // 7.4 CRIAR MAIS AUCTIONS DIRETAMENTE
    console.log('🔨 Criando auctions adicionais...');

    // Reutilizar CEPs das capitais
    const capitalZipCodesForAdditional = {
      'Rio de Janeiro': '20040-020',
      'Belo Horizonte': '30130-100',
      'São Paulo': '01310-100',
    };

    const additionalAuctionsData = [
      {
        publicId: `auction-rj-${judicialTimestamp}-1`,
        slug: `auction-judicial-rj-${judicialTimestamp}`,
        title: 'Leilão Judicial - Imóveis RJ',
        description: 'Leilão de imóveis comerciais e residenciais - Rio de Janeiro',
        auctionType: 'JUDICIAL' as const,
        sellerId: additionalSellers[0].id,
        auctioneerId: additionalAuctioneers[0].id,
        auctionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'ABERTO' as const,
        address: 'Av. Presidente Vargas, 1000 - Centro',
        zipCode: capitalZipCodesForAdditional['Rio de Janeiro'],
      },
      {
        publicId: `auction-mg-${judicialTimestamp}-1`,
        slug: `auction-judicial-mg-${judicialTimestamp}`,
        title: 'Leilão Judicial - Propriedades MG',
        description: 'Leilão de fazendas e propriedades rurais - Minas Gerais',
        auctionType: 'JUDICIAL' as const,
        sellerId: additionalSellers[1].id,
        auctioneerId: additionalAuctioneers[1].id,
        auctionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'ABERTO' as const,
        address: 'Av. João Pinheiro, 500 - Centro',
        zipCode: capitalZipCodesForAdditional['Belo Horizonte'],
      },
      {
        publicId: `auction-sp-equip-${judicialTimestamp}`,
        slug: `auction-equip-${judicialTimestamp}`,
        title: 'Leilão Extrajudicial - Equipamentos SP',
        description: 'Leilão de máquinas e equipamentos industriais',
        auctionType: 'EXTRAJUDICIAL' as const,
        sellerId: seller.id,
        auctioneerId: additionalAuctioneers[2].id,
        auctionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'ABERTO' as const,
        address: 'Rua Líbero Badaró, 425 - Centro',
        zipCode: capitalZipCodesForAdditional['São Paulo'],
      },
    ];

    const additionalAuctions = await Promise.all(
      additionalAuctionsData.map(data =>
        prisma.auction.create({
          data: {
            ...data,
            tenantId: tenants[0].id,
            auctionMethod: 'STANDARD',
            participation: 'ONLINE',
            updatedAt: new Date(),
          },
        })
      )
    );

    console.log(`✅ ${additionalAuctions.length} auctions adicionais criados\n`);

    // Criar stages para os auctions adicionais
    console.log('🏛️  Criando stages para os auctions adicionais...');
    let additionalStagesCount = 0;

    for (const auction of additionalAuctions) {
      const stage = await prisma.auctionStage.create({
        data: {
          name: auction.auctionType === 'JUDICIAL' ? '1ª Praça' : 'Praça Única',
          auctionId: auction.id,
          tenantId: tenants[0].id,
          startDate: auction.auctionDate || new Date(),
          endDate: auction.endDate || new Date(),
          status: 'AGUARDANDO_INICIO',
        },
      });
      additionalStagesCount++;

      // Se for judicial, criar 2ª praça também
      if (auction.auctionType === 'JUDICIAL') {
        await prisma.auctionStage.create({
          data: {
            name: '2ª Praça',
            auctionId: auction.id,
            tenantId: tenants[0].id,
            startDate: new Date((auction.auctionDate?.getTime() || Date.now()) + 3 * 24 * 60 * 60 * 1000),
            endDate: new Date((auction.endDate?.getTime() || Date.now()) + 3 * 24 * 60 * 60 * 1000),
            status: 'AGENDADO',
          },
        });
        additionalStagesCount++;
      }
    }

    console.log(`✅ ${additionalStagesCount} stages adicionais criados para os auctions\n`);

    // 7.5 CRIAR LOTES COM LOCALIZAÇÃO E LOTEAMENTOS
    console.log('📍 Criando lotes com localização expandida...');

    const additionalLotLocations = [
      { city: 'Rio de Janeiro', state: 'RJ', neighborhood: 'Centro', address: 'Av. Rio Branco, 1500' },
      { city: 'Rio de Janeiro', state: 'RJ', neighborhood: 'Copacabana', address: 'Av. Atlântica, 3000' },
      { city: 'Belo Horizonte', state: 'MG', neighborhood: 'Savassi', address: 'Rua Bahia, 2500' },
    ];

    let lotsCreated = 0;
    for (let i = 0; i < Math.min(additionalAuctions.length, additionalLotLocations.length); i++) {
      const location = additionalLotLocations[i];

      // Encontrar ou criar cidade
      let city = await prisma.city.findFirst({
        where: { name: location.city },
      });

      if (!city) {
        const state = await prisma.state.findFirst({
          where: { uf: location.state },
        });
        if (state) {
          city = await prisma.city.create({
            data: {
              name: location.city,
              stateId: state.id,
              slug: location.city.toLowerCase().replace(/\s+/g, '-'),
            },
          });
        }
      }

      // Criar lotes para cada auction
      const lotsData = [
        {
          number: `L00${lotsCreated + 1}`,
          title: `Imóvel Comercial - ${location.neighborhood}`,
          description: `Propriedade localizada em ${location.neighborhood}, ${location.address}. Lote de primeira categoria.`,
          type: 'IMOVEL',
          price: new Prisma.Decimal((150000 + Math.random() * 200000).toFixed(2)),
          initialPrice: new Prisma.Decimal((100000 + Math.random() * 150000).toFixed(2)),
          cityId: city?.id,
        },
        {
          number: `L00${lotsCreated + 2}`,
          title: `Apartamento - ${location.neighborhood}`,
          description: `Apartamento com 3 quartos em ${location.neighborhood}. Obra concluída.`,
          type: 'IMOVEL',
          price: new Prisma.Decimal((250000 + Math.random() * 150000).toFixed(2)),
          initialPrice: new Prisma.Decimal((200000 + Math.random() * 100000).toFixed(2)),
          cityId: city?.id,
        },
      ];

      for (const lotData of lotsData) {
        try {
          await prisma.lot.create({
            data: {
              publicId: `lot-${Date.now()}-${Math.random()}`,
              auctionId: additionalAuctions[i].id,
              tenantId: tenants[0].id,
              bidIncrementStep: new Prisma.Decimal('1000'),
              status: 'ABERTO_PARA_LANCES',
              ...lotData,
              updatedAt: new Date(),
            },
          });
          lotsCreated++;
        } catch (e) {
          console.log(`⚠️  Erro ao criar lote: ${(e as any).message}`);
        }
      }
    }

    console.log(`✅ ${lotsCreated} lotes com localização criados\n`);

    // 7.6 CRIAR PROCESSOS JUDICIAIS ADICIONAIS
    console.log('⚖️  Criando processos judiciais adicionais...');

    const additionalProcesses = [];
    const branches = [judicialBranch, additionalBranches[0], additionalBranches[1]];
    const sellers_for_process = [seller, additionalSellers[0], additionalSellers[1]];

    for (let i = 0; i < 3; i++) {
        const partiesData = [
            {
                name: i === 0 ? 'Banco Itaú S.A.' : i === 1 ? 'Banco Bradesco S.A.' : 'Banco Santander S.A.',
                documentNumber: i === 0 ? '00.000.000/0000-20' : i === 1 ? '00.000.000/0000-30' : '00.000.000/0000-40',
                partyType: 'AUTOR',
                tenantId: BigInt(tenant1Id)
            },
            {
                name: i === 0 ? 'João Silva' : i === 1 ? 'Maria Santos' : 'Carlos Costa',
                documentNumber: i === 0 ? '111.222.333-44' : i === 1 ? '222.333.444-55' : '333.444.555-66',
                partyType: 'REU',
                tenantId: BigInt(tenant1Id)
            },
            {
                name: 'Dr. Advogado Test',
                documentNumber: '99988877766',
                partyType: 'ADVOGADO_AUTOR',
                tenantId: BigInt(tenant1Id)
            },
        ];

        const proc = await prisma.judicialProcess.create({
            data: {
                publicId: `process-add-${i}-${judicialTimestamp}`,
                processNumber: `000${i + 4}567-0${i + 1}.2024.8.26.0100-${judicialTimestamp}`,
                isElectronic: true,
                tenantId: BigInt(tenant1Id),
                courtId: court.id,
                districtId: branches[i].districtId,
                branchId: branches[i].id,
                sellerId: sellers_for_process[i].id,
                updatedAt: new Date(),
                JudicialParty: {
                    create: partiesData.map(p => ({
                        name: p.name,
                        documentNumber: p.documentNumber,
                        partyType: p.partyType as any,
                        tenantId: p.tenantId
                    }))
                }
            }
        });

        additionalProcesses.push(proc.id);
    }

    console.log(`✅ ${additionalProcesses.length} processos judiciais adicionais criados\n`);

    // 7.7 CRIAR ASSETS (BENS) VINCULADOS AOS PROCESSOS JUDICIAIS
    console.log('🏛️  Criando assets (bens) vinculados aos processos judiciais...');

    // CEPs e endereços das capitais para assets
    const assetLocations = [
      { city: 'São Paulo', state: 'SP', address: 'Rua da Consolação, 1000' },
      { city: 'São Paulo', state: 'SP', address: 'Av. Rebouças, 2500' },
      { city: 'Rio de Janeiro', state: 'RJ', address: 'Av. Rio Branco, 300' },
      { city: 'Rio de Janeiro', state: 'RJ', address: 'Rua da Assembléia, 100' },
      { city: 'Belo Horizonte', state: 'MG', address: 'Av. Afonso Pena, 1500' },
      { city: 'Brasília', state: 'DF', address: 'SCS Quadra 2' },
      { city: 'Salvador', state: 'BA', address: 'Av. Sete de Setembro, 500' },
      { city: 'Curitiba', state: 'PR', address: 'Rua XV de Novembro, 1000' },
      { city: 'Fortaleza', state: 'CE', address: 'Av. Beira Mar, 800' },
      { city: 'Porto Alegre', state: 'RS', address: 'Av. Borges de Medeiros, 500' },
    ];

    // Helper: Gerar dados realistas de assets
    const assetTypes = {
      IMOVEL: [
        { title: 'Sala Comercial', description: 'Sala comercial bem localizada, com infraestrutura completa' },
        { title: 'Apartamento Residencial', description: 'Apartamento de 2 quartos, com garagem e área de lazer' },
        { title: 'Casa Térrea', description: 'Casa térrea com 3 quartos, quintal e churrasqueira' },
        { title: 'Galpão Industrial', description: 'Galpão com pé direito alto, ideal para logística e armazenagem' },
        { title: 'Terreno Urbano', description: 'Terreno plano em área urbana, pronto para construção' },
      ],
      VEICULO: [
        { title: 'Automóvel Sedan', description: 'Veículo sedan em bom estado de conservação' },
        { title: 'Caminhonete Pick-up', description: 'Caminhonete para trabalho e transporte de cargas' },
        { title: 'Motocicleta', description: 'Motocicleta em excelente estado, baixa quilometragem' },
      ],
      MAQUINARIO: [
        { title: 'Torno Mecânico', description: 'Torno mecânico industrial em perfeito funcionamento' },
        { title: 'Empilhadeira', description: 'Empilhadeira elétrica, capacidade 2 toneladas' },
      ],
      MOBILIARIO: [
        { title: 'Conjunto de Mesas e Cadeiras', description: 'Mobiliário de escritório em bom estado' },
        { title: 'Equipamentos de TI', description: 'Computadores, monitores e periféricos' },
      ],
    };

    const statusOptions: ('DISPONIVEL' | 'CADASTRO' | 'LOTEADO')[] = ['DISPONIVEL', 'CADASTRO', 'LOTEADO'];

    // Criar assets para os 3 processos iniciais
    const processesWithAssets = [
      { process: judicialProcess1, count: 2, types: ['IMOVEL', 'IMOVEL'] },
      { process: judicialProcess2, count: 3, types: ['IMOVEL', 'VEICULO', 'MOBILIARIO'] },
      { process: judicialProcess3, count: 2, types: ['IMOVEL', 'MAQUINARIO'] },
    ];

    const createdAssets = [];
    let locationIndex = 0;

    for (const { process, count, types } of processesWithAssets) {
      for (let i = 0; i < count; i++) {
        const type = types[i] as keyof typeof assetTypes;
        const assetTemplates = assetTypes[type];
        const template = assetTemplates[Math.floor(Math.random() * assetTemplates.length)];
        const location = assetLocations[locationIndex % assetLocations.length];
        locationIndex++;

        const asset = await prisma.asset.create({
          data: {
            publicId: `asset-${judicialTimestamp}-${process.id}-${i}`,
            title: template.title,
            description: `${template.description}. Bem penhorado no processo ${process.processNumber}`,
            status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
            judicialProcessId: process.id,
            sellerId: process.sellerId || seller.id,
            evaluationValue: new Prisma.Decimal((50000 + Math.random() * 500000).toFixed(2)),
            tenantId: tenants[0].id,
            dataAiHint: type,
            locationCity: location.city,
            locationState: location.state,
            address: location.address,
            updatedAt: new Date(),
          },
        });

        createdAssets.push(asset);
      }
    }

    // Criar assets para os processos adicionais
    for (const processId of additionalProcesses) {
      const processIdBigInt = typeof processId === 'string' ? BigInt(processId) : processId;
      const process = await prisma.judicialProcess.findUnique({
        where: { id: processIdBigInt },
      });

      if (!process) continue;

      // Cada processo adicional terá 1-3 assets
      const assetCount = 1 + Math.floor(Math.random() * 3);
      const availableTypes = Object.keys(assetTypes) as (keyof typeof assetTypes)[];

      for (let i = 0; i < assetCount; i++) {
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const assetTemplates = assetTypes[type];
        const template = assetTemplates[Math.floor(Math.random() * assetTemplates.length)];
        const location = assetLocations[locationIndex % assetLocations.length];
        locationIndex++;

        const asset = await prisma.asset.create({
          data: {
            publicId: `asset-${judicialTimestamp}-${processIdBigInt}-${i}`,
            title: template.title,
            description: `${template.description}. Bem vinculado ao processo judicial ${process.processNumber}`,
            status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
            judicialProcessId: processIdBigInt,
            sellerId: process.sellerId || seller.id,
            evaluationValue: new Prisma.Decimal((30000 + Math.random() * 400000).toFixed(2)),
            tenantId: tenants[0].id,
            dataAiHint: type,
            locationCity: location.city,
            locationState: location.state,
            address: location.address,
            updatedAt: new Date(),
          },
        });

        createdAssets.push(asset);
      }
    }

    console.log(`✅ ${createdAssets.length} assets (bens) criados e vinculados aos processos judiciais\n`);

    // 7.8 VINCULAR ALGUNS ASSETS AOS LOTES (AssetsOnLots)
    console.log('🔗 Vinculando assets aos lotes existentes...');

    // Pegar alguns assets LOTEADOS para vincular aos lotes do leilão judicial
    const loteadoAssets = createdAssets.filter(a => a.status === 'LOTEADO').slice(0, 3);
    const judicialLots = lots.filter(lot => lot.auctionId === auctions[0].id).slice(0, 3);

    let linkedAssets = 0;
    for (let i = 0; i < Math.min(loteadoAssets.length, judicialLots.length); i++) {
      try {
        await prisma.assetsOnLots.create({
          data: {
            assetId: loteadoAssets[i].id,
            lotId: judicialLots[i].id,
            assignedBy: 'system',
            tenantId: tenants[0].id,
          },
        });
        linkedAssets++;
      } catch (e) {
        console.log(`⚠️  Erro ao vincular asset ao lote: ${(e as any).message}`);
      }
    }

    // Se não há assets LOTEADOS suficientes, vincular DISPONIVEL também
    if (linkedAssets < 3) {
      const disponivelAssets = createdAssets.filter(a => a.status === 'DISPONIVEL').slice(0, 3 - linkedAssets);
      for (let i = 0; i < Math.min(disponivelAssets.length, judicialLots.length - linkedAssets); i++) {
        try {
          await prisma.assetsOnLots.create({
            data: {
              assetId: disponivelAssets[i].id,
              lotId: judicialLots[linkedAssets + i].id,
              assignedBy: 'system',
              tenantId: tenants[0].id,
            },
          });

          // Atualizar o status do asset para LOTEADO
          await prisma.asset.update({
            where: { id: disponivelAssets[i].id },
            data: { status: 'LOTEADO' },
          });

          linkedAssets++;
        } catch (e) {
          console.log(`⚠️  Erro ao vincular asset ao lote: ${(e as any).message}`);
        }
      }
    }

    console.log(`✅ ${linkedAssets} assets vinculados aos lotes\n`);

    console.log('🖼️ Enriquecendo assets com imagens na galeria...');
    for (const asset of createdAssets) {
      const assetIdentifier = asset.publicId || `asset-${asset.id}`;
      const assetImageCount = 2 + Math.floor(Math.random() * 2);
      const galleryUrls: string[] = [];
      const mediaIds: bigint[] = [];

      for (let variant = 1; variant <= assetImageCount; variant++) {
        const mediaItem = await createSeedMediaItem('asset', assetIdentifier, variant, {
          dataAiHint: asset.dataAiHint || asset.title || 'asset',
        });

        galleryUrls.push(mediaItem.urlOriginal);
        mediaIds.push(mediaItem.id);

        await prisma.assetMedia.create({
          data: {
            assetId: asset.id,
            mediaItemId: mediaItem.id,
            tenantId: tenants[0].id,
            displayOrder: variant - 1,
            isPrimary: variant === 1,
          },
        });
      }

      await prisma.asset.update({
        where: { id: asset.id },
        data: {
          imageUrl: galleryUrls[0],
          galleryImageUrls: galleryUrls,
          mediaItemIds: mediaIds.map(id => id.toString()),
          imageMediaId: mediaIds[0],
        },
      });
    }
    console.log('✅ Assets enriquecidos com imagens na galeria\n');

    // CRIAR DADOS ADICIONAIS PARA PÁGINA DE PREPARAÇÃO DO LEILÃO
    console.log('🎨 Criando dados para página de preparação do leilão...');

    // Garantir que temos um leilão com vários lotes para testar
    const preparationAuction = auctions[0]; // Usar o primeiro leilão

    // Criar habilitações para o leilão
    console.log('   Criando habilitações...');
    const habilitationsForPrep = [];
    for (let i = 0; i < 5; i++) {
      try {
        const habilitation = await prisma.auctionHabilitation.create({
          data: {
            userId: usuarios[1].id, // Usar comprador
            auctionId: preparationAuction.id,
            // status removed as it is not in schema
            habilitatedAt: new Date(),
            tenantId: defaultTenant.id,
          },
        });
        habilitationsForPrep.push(habilitation);
      } catch (e) {
        // Pode já existir, continuar
      }
    }
    console.log(`   ✅ ${habilitationsForPrep.length} habilitações criadas`);

    // Criar alguns lances para o leilão (para estatísticas do pregão)
    console.log('   Criando lances para estatísticas...');
    let bidsForPrep = 0;
    for (const lot of lots.slice(0, 3)) {
      try {
        await prisma.bid.create({
          data: {
            bidderId: usuarios[1].id,
            lotId: lot.id,
            auctionId: preparationAuction.id,
            amount: new Prisma.Decimal(lot.initialPrice || 0).mul(1.1).toNumber(),
            timestamp: new Date(),
            bidderDisplay: 'Comprador Test',
            tenantId: defaultTenant.id,
          },
        });
        bidsForPrep++;
      } catch (e) {
        // Lance pode já existir
      }
    }
    console.log(`   ✅ ${bidsForPrep} lances adicionais criados`);

    console.log('✅ Dados para página de preparação criados\n');

    // RESUMO FINAL ATUALIZADO
    console.log('\n✨ SEED CONCLUÍDO COM SUCESSO!\n');
    console.log('📊 RESUMO COMPLETO:');
    console.log(`   • Tenants: ${tenants.length}`);
    console.log(`   • Roles: ${Object.keys(roles).length}`);
    console.log(`   • Usuários: 8 (5 principais + 3 leiloeiros)`);
    console.log(`   • Auctions: ${auctions.length + additionalAuctions.length}`);
    console.log(`   • Auction Stages (Praças): ${auctionStages.length + additionalStagesCount} (incluindo 1ª e 2ª praças)`);
    console.log(`   • Lots: ${lots.length + lotsCreated} (todos com localização)`);
    console.log(`   • Bids: ${bids.length}`);
    console.log(`   • Habilitações: ${habilitacoes.length}`);
    console.log(`   • Tribunais: 1 (Tribunal de Justiça)`);
    console.log(`   • Comarcas: ${1 + additionalDistricts.length}`);
    console.log(`   • Varas Judiciais: ${1 + additionalBranches.length}`);
    console.log(`   • Vendedores Judiciais: ${1 + additionalSellers.length}`);
    console.log(`   • Processos Judiciais: ${3 + additionalProcesses.length} (todos com partes e advogados)`);
    console.log(`   • Assets (Bens): ${createdAssets.length} (todos vinculados a processos e com localização)`);
    console.log(`   • Assets vinculados a Lotes: ${linkedAssets}`);

    console.log('\n🔐 CREDENCIAIS DE TESTE:');
    console.log('\n   1️⃣  LEILOEIRO (ADMIN):');
    console.log('   Email: test.leiloeiro@bidexpert.com');
    console.log('   Senha: Test@12345');
    console.log('   Roles: LEILOEIRO, COMPRADOR, ADMIN');

    console.log('\n   2️⃣  COMPRADOR:');
    console.log('   Email: test.comprador@bidexpert.com');
    console.log('   Senha: Test@12345');
    console.log('   Roles: COMPRADOR');

    console.log('\n   3️⃣  ADVOGADO (com painel completo):');
    console.log('   Email: advogado@bidexpert.com.br');
    console.log('   Senha: Test@12345');
    console.log('   Roles: ADVOGADO, COMPRADOR');
    console.log(`   • ${3 + additionalProcesses.length} Processos Judiciais vinculados`);
    console.log(`   • ${createdAssets.length} Bens (Assets) vinculados aos processos`);
    console.log('   • Acesso completo ao painel do advogado');
    console.log('   • Visualização de partes e dados processuais');

    console.log('\n   4️⃣  VENDEDOR:');
    console.log('   Email: test.vendedor@bidexpert.com');
    console.log('   Senha: Test@12345');
    console.log('   Roles: VENDEDOR, COMPRADOR');

    console.log('\n   5️⃣  AVALIADOR:');
    console.log('   Email: test.avaliador@bidexpert.com');
    console.log('   Senha: Test@12345');
    console.log('   Roles: AVALIADOR');

    console.log('\n📋 ESTRUTURA DE DADOS:');
    console.log('   • Todos os leilões possuem praças (stages) configuradas');
    console.log('   • Leilões judiciais possuem 1ª e 2ª praças');
    console.log('   • Todos os auctions possuem endereço e CEP de capitais brasileiras');
    console.log('   • Todos os lotes possuem localização (cidade, estado, endereço)');
    console.log('   • Todos os processos judiciais possuem bens (assets) vinculados');
    console.log('   • Bens com status LOTEADO foram vinculados aos lotes do leilão judicial');
    console.log('   • Cada processo possui de 1 a 3 bens registrados');
    console.log('   • Assets incluem: imóveis, veículos, maquinários e mobiliários');
    console.log('   • Todos os assets possuem valor de avaliação e localização completa');
    console.log('   • Status dos assets: CADASTRO, DISPONIVEL, LOTEADO');
    console.log('   • Localizações incluem CEPs dos centros das capitais: SP, RJ, MG, DF, BA, PR, CE, RS');
    console.log('\n');



    // 9. CRIAR CONFIGURAÇÕES DA PLATAFORMA
    console.log('⚙️ Criando configurações da plataforma...');

    const platformSettings = await prisma.platformSettings.upsert({
      where: { tenantId: tenants[0].id },
      update: {
        IdMasks: {
          upsert: {
            create: {
              auctionCodeMask: 'AUC-{YYYY}-{####}',
              lotCodeMask: 'LOTE-{####}',
              assetCodeMask: 'ASSET-{####}',
              userCodeMask: 'USER-{####}',
              auctioneerCodeMask: 'LEIL-{####}',
              sellerCodeMask: 'COM-{####}',
              categoryCodeMask: 'CAT-{####}',
              subcategoryCodeMask: 'SUB-{####}'
            },
            update: {
              auctionCodeMask: 'AUC-{YYYY}-{####}',
              lotCodeMask: 'LOTE-{####}',
              assetCodeMask: 'ASSET-{####}',
              userCodeMask: 'USER-{####}',
              auctioneerCodeMask: 'LEIL-{####}',
              sellerCodeMask: 'COM-{####}',
              categoryCodeMask: 'CAT-{####}',
              subcategoryCodeMask: 'SUB-{####}'
            }
          }
        }
      },
      create: {
        tenantId: tenants[0].id,
        siteTitle: 'BidExpert Leilões',
        siteTagline: 'O melhor lugar para bons negócios',
        isSetupComplete: true,
        crudFormMode: 'modal',
        searchPaginationType: 'numberedPages',
        searchItemsPerPage: 12,
        showCountdownOnCards: true,
        showCountdownOnLotDetail: true,
        IdMasks: {
          create: {
            auctionCodeMask: 'AUC-{YYYY}-{####}',
            lotCodeMask: 'LOTE-{####}',
            assetCodeMask: 'ASSET-{####}',
            userCodeMask: 'USER-{####}',
            auctioneerCodeMask: 'LEIL-{####}',
            sellerCodeMask: 'COM-{####}',
            categoryCodeMask: 'CAT-{####}',
            subcategoryCodeMask: 'SUB-{####}'
          }
        },
        PaymentGatewaySettings: {
          create: {
            defaultGateway: 'Manual',
            platformCommissionPercentage: 5.0,
          }
        },
        MentalTriggerSettings: {
          create: {
            showDiscountBadge: true,
            showPopularityBadge: true,
            showHotBidBadge: true,
            showExclusiveBadge: true,
          }
        },
        NotificationSettings: {
          create: {
            notifyOnNewAuction: true,
            notifyOnAuctionEndingSoon: true,
            notifyOnPromotions: true,
          }
        }
      }
    });
    console.log('✅ Configurações da plataforma criadas/verificadas\n');

    // 10. CRIAR CATEGORIAS E SUBCATEGORIAS
    console.log('🗂️ Criando categorias e subcategorias...');

    const categoriesData = [
      {
        name: 'Imóveis',
        slug: 'imoveis',
        icon: 'Home',
        subcategories: ['Residencial', 'Comercial', 'Industrial', 'Rural', 'Terrenos']
      },
      {
        name: 'Veículos',
        slug: 'veiculos',
        icon: 'Car',
        subcategories: ['Carros', 'Motos', 'Caminhões', 'Utilitários', 'Náutica']
      },
      {
        name: 'Informática',
        slug: 'informatica',
        icon: 'Monitor',
        subcategories: ['Notebooks', 'Desktops', 'Monitores', 'Periféricos', 'Servidores']
      },
      {
        name: 'Mobiliário',
        slug: 'mobiliario',
        icon: 'Sofa',
        subcategories: ['Escritório', 'Residencial', 'Decoração', 'Eletrodomésticos']
      },
      {
        name: 'Maquinário',
        slug: 'maquinario',
        icon: 'Cog',
        subcategories: ['Industrial', 'Agrícola', 'Construção Civil', 'Ferramentas']
      }
    ];

    const createdCategories = [];

    for (const catData of categoriesData) {
      // Verificar se categoria já existe
      let category = await prisma.lotCategory.findFirst({
        where: { slug: catData.slug }
      });

      if (!category) {
        category = await prisma.lotCategory.create({
          data: {
            name: catData.name,
            slug: catData.slug,
            isGlobal: true,
            tenantId: tenants[0].id // Associando ao tenant principal para simplificar, mas marcado como global
          }
        });
      }
      createdCategories.push(category);

      // Criar subcategorias
      for (const subName of catData.subcategories) {
        const subSlug = subName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');

        const existingSub = await prisma.subcategory.findFirst({
          where: {
            slug: subSlug,
            parentCategoryId: category.id
          }
        });

        if (!existingSub) {
          await prisma.subcategory.create({
            data: {
              name: subName,
              slug: subSlug,
              parentCategoryId: category.id,
              isGlobal: true,
              tenantId: tenants[0].id
            }
          });
        }
      }
    }
    console.log(`✅ ${createdCategories.length} categorias e suas subcategorias criadas\n`);

    // Atualizar alguns lotes com categorias
    console.log('🔄 Atualizando lotes com categorias...');
    const imoveisCat = createdCategories.find(c => c.slug === 'imoveis');
    const veiculosCat = createdCategories.find(c => c.slug === 'veiculos');
    const maqCat = createdCategories.find(c => c.slug === 'maquinario');
    const mobCat = createdCategories.find(c => c.slug === 'mobiliario');

    if (imoveisCat) {
      await prisma.lot.updateMany({
        where: { type: 'IMOVEL', categoryId: null },
        data: { categoryId: imoveisCat.id }
      });
    }
    if (veiculosCat) {
      await prisma.lot.updateMany({
        where: { type: 'VEICULO', categoryId: null },
        data: { categoryId: veiculosCat.id }
      });
    }
    if (maqCat) {
      await prisma.lot.updateMany({
        where: { type: 'MAQUINARIO', categoryId: null },
        data: { categoryId: maqCat.id }
      });
    }
    if (mobCat) {
      await prisma.lot.updateMany({
        where: { type: 'MOBILIARIO', categoryId: null },
        data: { categoryId: mobCat.id }
      });
    }
    console.log('✅ Lotes atualizados com categorias\n');


    // 11. CRIAR OFERTAS DE VENDA DIRETA
    console.log('🏷️ Criando ofertas de venda direta...');

    if (imoveisCat) {
      await prisma.directSaleOffer.create({
        data: {
          publicId: `offer-${timestamp}-1`,
          title: 'Oportunidade: Terreno em Condomínio Fechado',
          description: 'Terreno de 500m² em condomínio de alto padrão. Pronto para construir.',
          offerType: 'BUY_NOW',
          price: new Prisma.Decimal('180000.00'),
          minimumOfferPrice: new Prisma.Decimal('170000.00'),
          status: 'ACTIVE',
          locationCity: 'São Paulo',
          locationState: 'SP',
          categoryId: imoveisCat.id,
          sellerId: seller.id,
          tenantId: tenants[0].id,
          itemsIncluded: ['Projeto Arquitetônico', 'Topografia'],
          updatedAt: new Date(),
        }
      });
    }

    if (veiculosCat) {
      await prisma.directSaleOffer.create({
        data: {
          publicId: `offer-${timestamp}-2`,
          title: 'Frota de Caminhões Seminovos',
          description: 'Lote com 3 caminhões Volvo FH 540, ano 2021. Venda direta do proprietário.',
          offerType: 'ACCEPTS_PROPOSALS',
          price: new Prisma.Decimal('1200000.00'),
          minimumOfferPrice: new Prisma.Decimal('1000000.00'),
          status: 'ACTIVE',
          locationCity: 'Curitiba',
          locationState: 'PR',
          categoryId: veiculosCat.id,
          sellerId: seller.id,
          tenantId: tenants[0].id,
          updatedAt: new Date(),
        }
      });
    }
    console.log('✅ Ofertas de venda direta criadas\n');

    // 12. CRIAR DADOS DO DASHBOARD DO ARREMATANTE
    console.log('👤 Criando dados do dashboard do arrematante...');

    // Perfil do Arrematante
    let bidderProfile = await prisma.bidderProfile.findUnique({ where: { userId: compradorUser.id } });

    if (!bidderProfile && compradorUser.cpf) {
        bidderProfile = await prisma.bidderProfile.findUnique({ where: { cpf: compradorUser.cpf } });
        
        if (bidderProfile) {
             bidderProfile = await prisma.bidderProfile.update({
                where: { id: bidderProfile.id },
                data: { userId: compradorUser.id }
             });
        }
    }

    if (!bidderProfile) {
         bidderProfile = await prisma.bidderProfile.create({
            data: {
                userId: compradorUser.id,
                fullName: compradorUser.fullName,
                cpf: compradorUser.cpf,
                phone: '(11) 99999-8888',
                address: 'Rua dos Compradores, 100',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01000-000',
                documentStatus: 'APPROVED',
                emailNotifications: true,
                smsNotifications: true,
                tenantId: tenants[0].id,
                updatedAt: new Date(),
            }
         });
    }

    // Métodos de Pagamento
    await prisma.paymentMethod.create({
      data: {
        bidderId: bidderProfile.id,
        type: 'CREDIT_CARD',
        isDefault: true,
        cardLast4: '4242',
        cardBrand: 'VISA',
        isActive: true,
        tenantId: tenants[0].id,
        updatedAt: new Date(),
      }
    });

    // Histórico de Participação
    await prisma.participationHistory.create({
      data: {
        bidderId: bidderProfile.id,
        lotId: lots[0].id,
        auctionId: auctions[0].id,
        title: lots[0].title,
        auctionName: auctions[0].title,
        maxBid: new Prisma.Decimal('140000.00'),
        finalBid: new Prisma.Decimal('140000.00'),
        result: 'LOST', // Perdeu para outro lance maior (simulado)
        bidCount: 2,
        tenantId: tenants[0].id
      }
    });

    // Notificações do Arrematante
    await prisma.bidderNotification.create({
      data: {
        bidderId: bidderProfile.id,
        type: 'AUCTION_ENDING',
        title: 'Leilão Encerrando',
        message: 'O leilão de Veículos encerra em 1 hora.',
        isRead: false,
        tenantId: tenants[0].id
      }
    });
    console.log('✅ Dados do dashboard do arrematante criados\n');

    // 13. CRIAR DADOS DE PÓS-VENDA (ARREMATES)
    console.log('🏆 Criando dados de pós-venda (arremates)...');

    // Simular que o comprador ganhou o Lote 4 (Veículo)
    const wonLot = lots[3]; // Honda Civic

    // Atualizar lote como vendido
    await prisma.lot.update({
      where: { id: wonLot.id },
      data: {
        status: 'VENDIDO',
        winnerId: compradorUser.id,
        endDate: new Date()
      }
    });

    // Criar UserWin
    const userWin = await prisma.userWin.create({
      data: {
        lotId: wonLot.id,
        userId: compradorUser.id,
        winningBidAmount: new Prisma.Decimal('62000.00'), // Valor do lance dele
        paymentStatus: 'PENDENTE',
        retrievalStatus: 'PENDENTE',
        tenantId: tenants[0].id
      }
    });

    // Criar WonLot (view do dashboard)
    await prisma.wonLot.create({
      data: {
        bidderId: bidderProfile.id,
        lotId: wonLot.id,
        auctionId: auctions[1].id,
        title: wonLot.title,
        finalBid: new Prisma.Decimal('62000.00'),
        status: 'WON',
        paymentStatus: 'PENDENTE',
        totalAmount: new Prisma.Decimal('65100.00'), // +5% comissão
        deliveryStatus: 'PENDING',
        tenantId: tenants[0].id,
        updatedAt: new Date()
      }
    });

    // Criar Parcelas (InstallmentPayment)
    await prisma.installmentPayment.create({
      data: {
        userWinId: userWin.id,
        installmentNumber: 1,
        totalInstallments: 1,
        amount: new Prisma.Decimal('65100.00'),
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 dias
        status: 'PENDENTE',
        tenantId: tenants[0].id
      }
    });
    console.log('✅ Dados de pós-venda criados\n');

    // 14. CRIAR DADOS DE SUPORTE (ITSM)
    console.log('🆘 Criando dados de suporte (ITSM)...');

    const ticket = await prisma.iTSM_Ticket.create({
      data: {
        publicId: `ticket-${timestamp}-1`,
        userId: compradorUser.id,
        title: 'Dúvida sobre documentação',
        description: 'Gostaria de saber quais documentos preciso enviar para habilitação no leilão judicial.',
        status: 'ABERTO',
        priority: 'MEDIA',
        category: 'DUVIDA',
        tenantId: tenants[0].id,
        updatedAt: new Date(),
        itsm_messages: {
          create: [
            {
              userId: compradorUser.id,
              message: 'Olá, preciso de ajuda com a documentação.',
              isInternal: false
            }
          ]
        }
      }
    });
    console.log('✅ Ticket de suporte criado\n');

    // 15. CRIAR DADOS DE ENGAJAMENTO E AUDITORIA
    console.log('📝 Criando dados de engajamento e auditoria...');

    // Review
    await prisma.review.create({
      data: {
        lotId: lots[0].id,
        auctionId: auctions[0].id,
        userId: compradorUser.id,
        rating: 5,
        comment: 'Ótima oportunidade, imóvel bem localizado.',
        userDisplayName: 'Comprador Test',
        tenantId: tenants[0].id
      }
    });

    // Pergunta no Lote
    await prisma.lotQuestion.create({
      data: {
        lotId: lots[1].id,
        auctionId: auctions[0].id,
        userId: compradorUser.id,
        userDisplayName: 'Comprador Test',
        questionText: 'O imóvel possui dívidas de condomínio?',
        isPublic: true,
        tenantId: tenants[0].id
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: tenants[0].id,
        userId: compradorUser.id,
        entityType: 'Bid',
        entityId: BigInt(1), // Exemplo
        action: 'CREATE',
        metadata: { amount: 125000.00 },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 Test Agent'
      }
    });

    // Notificação Geral
    await prisma.notification.create({
      data: {
        userId: compradorUser.id,
        message: 'Bem-vindo ao BidExpert! Complete seu cadastro para participar.',
        isRead: false,
        tenantId: tenants[0].id
      }
    });

    // =================================================================================================
    // ATUALIZAÇÃO AUTOMÁTICA: GARANTIR PRAÇAS E LOCALIZAÇÃO EM TUDO
    // =================================================================================================
    console.log('\n🔄 Executando verificação e atualização de dados faltantes (Praças e Localização)...');

    const allAuctions = await prisma.auction.findMany({
      include: { AuctionStage: true }
    });

    const capitalsList = Object.entries(capitalZipCodes);
    const capitalToUF: Record<string, string> = {
      'São Paulo': 'SP', 'Rio de Janeiro': 'RJ', 'Belo Horizonte': 'MG', 'Brasília': 'DF',
      'Salvador': 'BA', 'Fortaleza': 'CE', 'Curitiba': 'PR', 'Manaus': 'AM', 'Recife': 'PE',
      'Porto Alegre': 'RS', 'Belém': 'PA', 'Goiânia': 'GO', 'São Luís': 'MA', 'Maceió': 'AL',
      'Natal': 'RN', 'Campo Grande': 'MS', 'Teresina': 'PI', 'João Pessoa': 'PB', 'Aracaju': 'SE',
      'Cuiabá': 'MT', 'Porto Velho': 'RO', 'Florianópolis': 'SC', 'Macapá': 'AP', 'Rio Branco': 'AC',
      'Vitória': 'ES', 'Boa Vista': 'RR', 'Palmas': 'TO'
    };

    for (const auction of allAuctions) {
      // 1. Garantir Praças (Stages)
      if (auction.AuctionStage.length === 0) {
        console.log(`   ➕ Criando praças para o leilão ${auction.title}...`);
        const startDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

        await prisma.auctionStage.create({
          data: {
            name: '1ª Praça',
            auctionId: auction.id,
            tenantId: auction.tenantId,
            startDate: startDate,
            endDate: new Date(startDate.getTime() + 24 * 60 * 60 * 1000),
            status: 'AGUARDANDO_INICIO',
          }
        });

        await prisma.auctionStage.create({
          data: {
            name: '2ª Praça',
            auctionId: auction.id,
            tenantId: auction.tenantId,
            startDate: new Date(startDate.getTime() + 48 * 60 * 60 * 1000),
            endDate: new Date(startDate.getTime() + 72 * 60 * 60 * 1000),
            status: 'AGENDADO',
          }
        });
      }

      // 2. Garantir Localização no Leilão
      if (!auction.zipCode || !auction.address) {
        const randomCapital = capitalsList[Math.floor(Math.random() * capitalsList.length)];
        console.log(`   📍 Atualizando localização do leilão ${auction.title} para ${randomCapital[0]}...`);

        await prisma.auction.update({
          where: { id: auction.id },
          data: {
            zipCode: randomCapital[1],
            address: `Endereço Central em ${randomCapital[0]}`,
          }
        });
      }
    }

    // 3. Garantir Localização nos Lotes
    const allLots = await prisma.lot.findMany();
    for (const lot of allLots) {
      if (!lot.cityName || !lot.stateUf || !lot.mapAddress) {
        const randomCapital = capitalsList[Math.floor(Math.random() * capitalsList.length)];
        const capitalName = randomCapital[0];
        const uf = capitalToUF[capitalName] || 'SP';

        console.log(`   📍 Atualizando localização do lote ${lot.title} para ${capitalName}...`);
        await prisma.lot.update({
          where: { id: lot.id },
          data: {
            cityName: capitalName,
            stateUf: uf,
            mapAddress: `Endereço Central em ${capitalName}`,
          }
        });
      }
    }

    // 4. Garantir Localização nos Assets
    const allAssets = await prisma.asset.findMany();
    for (const asset of allAssets) {
      if (!asset.locationCity || !asset.locationState || !asset.address) {
        const randomCapital = capitalsList[Math.floor(Math.random() * capitalsList.length)];
        const capitalName = randomCapital[0];
        const uf = capitalToUF[capitalName] || 'SP';

        console.log(`   📍 Atualizando localização do ativo ${asset.title} para ${capitalName}...`);
        await prisma.asset.update({
          where: { id: asset.id },
          data: {
            locationCity: capitalName,
            locationState: uf,
            address: `Endereço Central em ${capitalName}`,
          }
        });
      }
    }

    console.log('✅ Atualização de dados faltantes concluída!\n');

    console.log('✅ Dados de engajamento e auditoria criados\n');

    // EXECUTAR POPULAÇÃO COMPLEMENTAR (MESCLADO DE seed-populate-missing.ts)
    // Usando o tenantId do tenant principal
    const mainTenantId = tenants[0].id;
    
    // SEED DE TABELAS COMPLEMENTARES CRÍTICAS (States, Cities, Validation Rules, etc)
    await seedCriticalGlobalTables(mainTenantId);
    
    await populateMissingData(mainTenantId);

    // SEED DE HABILITAÇÕES - Grid de Documentos e Status
    // Cria 35 usuários com diferentes status de habilitação
    await seedHabilitacoes(prisma, mainTenantId, UsersOnTenantsModel);

    // EXECUTAR CORREÇÃO DE INCONSISTÊNCIAS DE AUDITORIA
    // Garante que todas as tabelas estejam completas e sem inconsistências
    await fixAuditInconsistencies(mainTenantId);

    // SEED DE DADOS ITSM (Sistema de Chamados de Suporte)
    // Popula tickets, mensagens, anexos, chat logs, query logs e form submissions
    await seedItsmData(mainTenantId);

    // SEED DE LOTES ARREMATADOS (COM SERVICES)
    // Gera leilões finalizados com lotes vendidos e arrematantes habilitados
    await seedWonLotsWithServices(mainTenantId);

    // SEED MÍNIMO DE 50 REGISTROS PARA TABELAS ZERADAS (NÃO CONFIG)
    await seedMin50ZeroTables(mainTenantId);

  } catch (error) {
    console.error('❌ Erro durante seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
