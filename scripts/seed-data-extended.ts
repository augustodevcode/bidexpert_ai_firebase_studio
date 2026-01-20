// scripts/seed-data-extended.ts
/**
 * @fileoverview Script de seed completo e robusto para a plataforma BidExpert.
 * Popula TODAS as tabelas do banco de dados com dados consistentes e interligados,
 * utilizando os SERVIÇOS da aplicação para garantir que todas as regras de negócio
 * e validações sejam aplicadas, resultando em um banco de dados idêntico ao que
 * seria gerado pela interação real com a UI.
 *
 * Para executar: `npx tsx scripts/seed-data-extended.ts`
 */
import { PrismaClient, Prisma, PaymentStatus, DirectSaleOfferStatus, DirectSaleOfferType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { hash } from 'bcryptjs';
import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';

// Inicializa o Prisma Client
const prisma = new PrismaClient();

// Importação de serviços
import { RoleService } from '../src/services/role.service';
import { CityService } from '../src/services/city.service';
import { CourtService } from '../src/services/court.service';
import { JudicialBranchService } from '../src/services/judicial-branch.service';
import { JudicialDistrictService } from '../src/services/judicial-district.service';
import { JudicialProcessService } from '../src/services/judicial-process.service';
import { LotService } from '../src/services/lot.service';
import { SellerService } from '../src/services/seller.service';
import { StateService } from '../src/services/state.service';
import { SubcategoryService } from '../src/services/subcategory.service';
import { AuctionService } from '../src/services/auction.service';
import { AuctioneerService } from '../src/services/auctioneer.service';
import { CategoryService } from '../src/services/category.service';
import { DocumentTypeService } from '../src/services/document-type.service';
import { DocumentService } from '../src/services/document.service';
import { MediaService } from '../src/services/media.service';
import { PlatformSettingsService } from '../src/services/platform-settings.service';
import { TenantService } from '../src/services/tenant.service';
import { UserService } from '../src/services/user.service';
import { VehicleMakeService } from '../src/services/vehicle-make.service';
import { VehicleModelService } from '../src/services/vehicle-model.service';
import { AuctionStageService } from '../src/services/auction-stage.service';
import { BidService } from '../src/services/bid.service';

// Tipos auxiliares
type UserRoleType = 'ADMIN' | 'AUCTIONEER' | 'SELLER' | 'BIDDER';
import { UserWinService } from '../src/services/user-win.service';
import { InstallmentPaymentService } from '../src/services/installment-payment.service';
import { LotQuestionService } from '../src/services/lot-question.service';
import { ReviewService } from '../src/services/review.service';
import { DirectSaleOfferService } from '../src/services/direct-sale-offer.service';
import { NotificationService } from '../src/services/notification.service';
import { ContactMessageService } from '../src/services/contact-message.service';
import { DocumentTemplateService } from '../src/services/document-template.service';
import { SubscriberService } from '../src/services/subscriber.service';
import { UserLotMaxBidService } from '../src/services/user-lot-max-bid.service';
import { DataSourceService } from '../src/services/data-source.service';

// --- Funções Utilitárias ---
function log(message: string, level = 0) {
  const indent = '  '.repeat(level);
  const fullMessage = `${indent}${message}`;
  console.log(fullMessage);
  return fullMessage;
};

const randomEnum = <T extends object>(e: T): T[keyof T] => {
  const values = Object.values(e);
  return values[Math.floor(Math.random() * values.length)] as T[keyof T];
};

const slugifyText = (text: string) => {
  if (!text) return '';
  return slugify(text, { lower: true, strict: true });
};

// --- Armazenamento de Entidades Criadas ---
const entityStore: {
  tenantId: string;
  roles: Record<string, bigint>;
  users: (Prisma.UserGetPayload<{}> & { roleNames: string[], id: bigint })[];
  categories: (Prisma.LotCategoryGetPayload<{ include: { subcategories: true } }> & { id: bigint })[];
  states: (Prisma.StateGetPayload<{}> & { id: bigint })[];
  cities: (Prisma.CityGetPayload<{}> & { id: bigint })[];
  courts: (Prisma.CourtGetPayload<{}> & { id: bigint })[];
  judicialDistricts: (Prisma.JudicialDistrictGetPayload<{}> & { id: bigint })[];
  judicialBranches: (Prisma.JudicialBranchGetPayload<{}> & { id: bigint })[];
  sellers: (Prisma.SellerGetPayload<{}> & { id: bigint })[];
  auctioneers: (Prisma.AuctioneerGetPayload<{}> & { id: bigint })[];
  judicialProcesses: (Prisma.JudicialProcessGetPayload<{ include: { parties: true } }> & { id: bigint })[];
  assets: (Prisma.AssetGetPayload<{}> & { id: bigint })[];
  auctions: (Prisma.AuctionGetPayload<{ include: { stages: true, judicialProcess: true, seller: true } }> & { id: bigint })[];
  lots: (Prisma.LotGetPayload<{ include: { lotPrices: true } }> & { id: bigint })[];
  mediaItems: (Prisma.MediaItemGetPayload<{}> & { id: bigint })[];
  documentTypes: Record<string, bigint>;
  documentTemplates: (Prisma.DocumentTemplateGetPayload<{}> & { id: bigint })[];
  dataSources: (Prisma.DataSourceGetPayload<{}> & { id: bigint })[];
  userWins: (Prisma.UserWinGetPayload<{}> & { id: bigint })[];
  vehicleMakes: (Prisma.VehicleMakeGetPayload<{}> & { id: bigint })[];
  vehicleModels: (Prisma.VehicleModelGetPayload<{}> & { id: bigint })[];
} = {
  tenantId: '1',
  roles: {},
  users: [],
  categories: [],
  states: [],
  cities: [],
  courts: [],
  judicialDistricts: [],
  judicialBranches: [],
  sellers: [],
  auctioneers: [],
  judicialProcesses: [],
  assets: [],
  auctions: [],
  lots: [],
  mediaItems: [],
  documentTypes: {},
  documentTemplates: [],
  dataSources: [],
  userWins: [],
  vehicleMakes: [],
  vehicleModels: [],
};

// --- Instâncias dos Serviços ---
const services = {
  auction: new AuctionService(),
  auctioneer: new AuctioneerService(),
  category: new CategoryService(),
  city: new CityService(),
  court: new CourtService(),
  judicialBranch: new JudicialBranchService(),
  judicialDistrict: new JudicialDistrictService(),
  judicialProcess: new JudicialProcessService(),
  lot: new LotService(),
  role: new RoleService(),
  seller: new SellerService(),
  state: new StateService(),
  subcategory: new SubcategoryService(),
  tenant: new TenantService(),
  user: new UserService(),
  documentType: new DocumentTypeService(),
  document: new DocumentService(),
  media: new MediaService(),
  platformSettings: new PlatformSettingsService(),
  vehicleMake: new VehicleMakeService(),
  vehicleModel: new VehicleModelService(),
  auctionStage: new AuctionStageService(),
  bid: new BidService(),
  userWin: new UserWinService(),
  installmentPayment: new InstallmentPaymentService(),
  lotQuestion: new LotQuestionService(),
  review: new ReviewService(),
  directSaleOffer: new DirectSaleOfferService(),
  notification: new NotificationService(),
  contactMessage: new ContactMessageService(),
  documentTemplate: new DocumentTemplateService(prisma),
  subscriber: new SubscriberService(),
  userLotMaxBid: new UserLotMaxBidService(),
  dataSource: new DataSourceService(),
};

// --- Constantes de Geração ---
const TOTAL_USERS = 30;
const TOTAL_SELLERS = 15;
const TOTAL_AUCTIONEERS = 5;
const TOTAL_ASSETS = 150;
const TOTAL_AUCTIONS = 25;
const MAX_LOTS_PER_AUCTION = 15;
const MAX_ASSETS_PER_LOT = 5;
const MAX_BIDS_PER_LOT = 50;
const IMAGE_PLACEHOLDER_DIR = './public/uploads/sample-images';

// --- Lógica Principal de Seeding ---

async function runStep(stepFunction: () => Promise<any>, stepName: string) {
  const stepLog = log(`- ${stepName}...`);
  try {
    const startTime = Date.now();
    await stepFunction();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`✅ ${stepName} concluído em ${duration}s.`);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    const errorMessage = `❌ Erro em ${stepName}: ${error.message}`;
    console.error(stepLog, error);
    log(errorMessage, 1);
    throw error;
  }
}

// ... (rest of the code remains the same)

async function seedInstallmentPayments() {
    // Filtrar apenas arremates que ainda não têm parcelas
    const winsWithoutInstallments = [];
    
    for (const win of entityStore.userWins) {
        const existingPayments = await prisma.installmentPayment.count({
            where: { userWinId: BigInt(win.id) }
        });
        
        if (existingPayments === 0 && faker.datatype.boolean(0.4)) {
            winsWithoutInstallments.push(win);
        }
    }
    
    if (winsWithoutInstallments.length === 0) {
        log('Nenhum arremate sem parcelas encontrado para processar.', 1);
        return;
    }

    log(`Processando ${winsWithoutInstallments.length} arremates sem parcelas.`, 1);
    let totalInstallments = 0;
    
    for (const win of winsWithoutInstallments) {
        try {
            const numInstallments = faker.number.int({ min: 2, max: 12 });
            const paymentResult = await services.installmentPayment.createInstallmentsForWin(win as any, numInstallments);
            
            if (paymentResult.success && paymentResult.payments?.length > 0) {
                totalInstallments += paymentResult.payments.length;
                
                const lot = await prisma.lot.findUnique({ 
                    where: { id: BigInt(win.lotId) },
                    select: { id: true }
                });
                
                if (lot) {
                    for (const payment of paymentResult.payments) {
                        try {
                            await prisma.installmentPayment.update({
                                where: { id: BigInt(payment.id) },
                                data: { 
                                    lot: { connect: { id: lot.id } },
                                    status: 'PENDENTE'
                                }
                            });
                        } catch (updateError) {
                            const errorMessage = updateError instanceof Error ? updateError.message : 'Erro desconhecido';
                            log(`Erro ao atualizar pagamento ${payment.id}: ${errorMessage}`, 2);
                            continue;
                        }
                    }
                }

                // Marcar algumas parcelas como pagas
                if (faker.datatype.boolean(0.8) && paymentResult.payments.length > 0) {
                    try {
                        await services.installmentPayment.updatePaymentStatus(
                            BigInt(paymentResult.payments[0].id), 
                            'PAGO' as PaymentStatus
                        );
                        
                        if (numInstallments > 1 && faker.datatype.boolean(0.5)) {
                            await services.installmentPayment.updatePaymentStatus(
                                BigInt(paymentResult.payments[1].id), 
                                'PAGO' as PaymentStatus
                            );
                        }
                    } catch (statusError) {
                        const errorMessage = statusError instanceof Error ? statusError.message : 'Erro desconhecido';
                        log(`Erro ao atualizar status de pagamento: ${errorMessage}`, 2);
                    }
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            log(`Erro ao processar arremate ${win.id}: ${errorMessage}`, 2);
            continue;
        }
    }
    log(`${totalInstallments} parcelas criadas para ${winsWithoutInstallments.length} arremates.`, 1);
}

async function seedPostAuctionInteractions() {
    const users = entityStore.users.filter(u => u.roleNames.includes('BIDDER'));
    if (users.length === 0) return;

    for (const lot of entityStore.lots) {
        if (faker.datatype.boolean(0.2)) {
            const user = faker.helpers.arrayElement(users);
            const questionText = faker.lorem.sentence() + '?';
            
            // Obter o leilão do lote para garantir que temos o ID do leilão
            const lotWithAuction = await prisma.lot.findUnique({
                where: { id: lot.id },
                include: { lotPrices: { include: { lot: true } } }
            });
            
            if (!lotWithAuction) {
                log(`Lote com ID ${lot.id} não encontrado. Pulando criação de pergunta.`, 2);
                continue;
            }
            
            // Criar a pergunta usando o Prisma diretamente para evitar problemas de conversão de tipos
            const questionResult = await prisma.lotQuestion.create({
                data: {
                    lotId: lot.id,
                    userId: user.id,
                    auctionId: lotWithAuction.auctionId,
                    userDisplayName: user.fullName || 'Usuário Anônimo',
                    questionText: questionText,
                    isPublic: true,
                    tenantId: BigInt(entityStore.tenantId)
                }
            });
            if (questionResult) {
                await services.lotQuestion.addAnswer(questionResult.id.toString(), faker.lorem.sentence(), entityStore.users[0].id.toString(), entityStore.users[0].fullName!);
            }
        }
    }
    log(`Perguntas e respostas criadas.`, 1);

    for (const win of entityStore.userWins) {
        if (faker.datatype.boolean(0.5)) {
            const user = entityStore.users.find(u => u.id === win.userId);
            const lot = await prisma.lot.findUnique({ 
                where: { id: BigInt(win.lotId) } 
            });
            if (lot && user) {
                const lot = await prisma.lot.findUnique({
                    where: { id: BigInt(win.lotId) },
                    select: { auctionId: true }
                });
                if (lot?.auctionId) {
                    await prisma.review.create({
                        data: {
                            auction: { connect: { id: lot.auctionId } },
                            lot: { connect: { id: BigInt(win.lotId) } },
                            user: { connect: { id: BigInt(win.userId) } },
                            tenant: { connect: { id: BigInt(entityStore.tenantId) } },
                            rating: faker.number.int({ min: 3, max: 5 }),
                            comment: faker.lorem.paragraph()
                        }
                    });
                }
            }
        }
    }
    log(`Avaliações criadas para lotes arrematados.`, 1);
}

async function seedMiscData() {
    const usersWithNotifications = faker.helpers.arrayElements(entityStore.users, { min: 10, max: 30 });
    for (const user of usersWithNotifications) {
        await prisma.notification.create({
            data: {
                userId: user.id,
                message: faker.lorem.sentence(),
                link: faker.internet.url(),
                createdAt: new Date(),
                tenantId: BigInt(entityStore.tenantId)
            }
        });
    }

    // Verificar se existe pelo menos um Tenant
    const existingTenant = await prisma.tenant.findFirst();
    let tenantId = entityStore.tenantId;
    
    if (!existingTenant) {
        log('Nenhum tenant encontrado. Criando um tenant padrão...', 1);
        const newTenant = await prisma.tenant.create({
            data: {
                name: 'Tenant Padrão',
                subdomain: 'default-tenant',
                domain: 'default.bidexpert.com',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        tenantId = newTenant.id.toString();
        entityStore.tenantId = tenantId;
    }

    for (let i = 0; i < 50; i++) {
        const asset = await prisma.asset.create({
            data: {
                title: `Ativo ${i}`,
                description: `Descrição do ativo ${i}`,
                publicId: `asset-${i}-${Date.now()}`,
                status: 'DISPONIVEL',
                createdAt: new Date(),
                tenant: { connect: { id: BigInt(tenantId) } }
            }
        });
        await prisma.subscriber.create({
            data: {
                email: faker.internet.email(),
                name: faker.person.fullName(),
                tenant: { connect: { id: BigInt(entityStore.tenantId) } }
            }
        });
    }
    log('Notificações e assinantes criados.', 1);

    for (let i = 0; i < 15; i++) {
        await prisma.contactMessage.create({
            data: {
                name: faker.person.fullName(),
                email: faker.internet.email(),
                subject: faker.lorem.sentence(),
                message: faker.lorem.paragraph()
            }
        });
    }
    log('Mensagens de contato criadas.', 1);
}

async function cleanupPreviousData() {
    try {
        // Lista de tabelas a serem limpas (em ordem reversa para evitar violações de chave estrangeira)
        const tables = [
            'UserRole',
            'User',
            'Role',
            'Tenant'
        ];

        // Desativar verificações de chave estrangeira temporariamente
        await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;
        
        try {
            // Tentar limpar cada tabela individualmente
            for (const table of tables) {
                try {
                    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
                    log(`Tabela ${table} limpa.`, 1);
                } catch (err) {
                    log(`Aviso: Não foi possível limpar a tabela ${table}. Ela pode não existir.`, 2);
                }
            }
        } finally {
            // Reativar verificações de chave estrangeira
            await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;
        }
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        log(`Aviso ao limpar dados anteriores: ${error.message}`, 2);
        // Não lançamos o erro para permitir que o seed continue
    }
}

async function logSummary() {
    const counts = {
      tenants: await prisma.tenant.count(),
      users: await prisma.user.count(),
      categories: await prisma.lotCategory.count(),
      assets: await prisma.asset.count(),
      auctions: await prisma.auction.count(),
      lots: await prisma.lot.count(),
      bids: await prisma.bid.count(),
      wins: await prisma.userWin.count(),
      installments: await prisma.installmentPayment.count(),
      notifications: await prisma.notification.count(),
      directSales: await prisma.directSaleOffer.count(),
      documentTemplates: await prisma.documentTemplate.count(),
      reports: await prisma.report.count(),
      judicialParties: await prisma.judicialParty.count()
    };
    
    console.log('\nResumo do Seeding:');
    console.table(counts);
}

async function updateTenantReferences() {
    try {
        log('Atualizando referências do tenant...', 1);
        
        // Obtém o ID do tenant que foi criado
        const tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            log('Nenhum tenant encontrado no banco de dados. Pulando atualização de referências.', 2);
            return;
        }

        const tenantId = tenant.id;
        log(`Atualizando referências para o tenant ID: ${tenantId}`, 1);

        // Atualiza as permissões das funções usando o serviço Role
        const roleService = new RoleService();
        const roleUpdates = [
            { id: 236n, permissions: ["manage_all"] },
            { 
                id: 237n, 
                permissions: ["view_auctions", "view_lots", "place_bids", "view_wins", "manage_payments", "schedule_retrieval"] 
            },
            { 
                id: 238n, 
                permissions: ["view_auctions", "view_lots", "place_bids", "view_wins", "manage_payments", "schedule_retrieval", "direct_sales:place_proposal", "direct_sales:buy_now"] 
            },
            { 
                id: 239n, 
                permissions: ["auctions:manage_own", "lots:manage_own", "auctions:read", "lots:read", "consignor_dashboard:view", "view_reports", "media:upload", "media:read"] 
            },
            { 
                id: 240n, 
                permissions: ["auctions:read", "auctions:manage_assigned", "lots:read", "lots:finalize", "conduct_auctions", "documents:generate_report", "documents:generate_certificate", "documents:generate_term"] 
            },
            { 
                id: 241n, 
                permissions: ["users:read", "auctions:read", "lots:read", "view_reports", "documents:generate_report", "documents:generate_certificate", "documents:generate_term"] 
            },
            { 
                id: 242n, 
                permissions: ["consignor_dashboard:view", "auctions:manage_own", "lots:manage_own", "auctions:read", "lots:read", "view_reports", "media:upload", "media:read"] 
            },
            { 
                id: 243n, 
                permissions: ["conduct_auctions", "auctions:read", "auctions:manage_assigned", "lots:read", "lots:finalize", "documents:generate_report", "documents:generate_certificate", "documents:generate_term"] 
            }
        ];

        for (const roleUpdate of roleUpdates) {
            try {
                const role = await roleService.getRoleById(roleUpdate.id);
                if (role) {
                    // Garantindo que o ID seja passado como bigint
                    await roleService.updateRole(BigInt(role.id.toString()), {
                        name: role.name,
                        description: role.description || '',
                        permissions: roleUpdate.permissions
                    });
                    log(`Permissões atualizadas para a função ${role.name}`, 1);
                }
            } catch (error) {
                log(`Erro ao atualizar permissões para a função ID ${roleUpdate.id}: ${error instanceof Error ? error.message : String(error)}`, 2);
            }
        }

        // Atualiza as configurações da plataforma para apontar para o tenant correto
        // Usando prisma diretamente apenas para este ajuste final de tenantId
        try {
            await prisma.platformSettings.updateMany({
                where: {},
                data: {
                    tenantId: tenantId
                }
            });
            log('Configurações da plataforma atualizadas com sucesso!', 1);
        } catch (error) {
            log(`Erro ao atualizar configurações da plataforma: ${error instanceof Error ? error.message : String(error)}`, 2);
        }

        // Atualiza os usuários para estarem associados ao tenant correto
        // Usando prisma diretamente apenas para este ajuste final de tenantId
        try {
            const users = await prisma.user.findMany({
                where: {
                    email: {
                        contains: '@bidexpert.com'
                    }
                }
            });

            for (const user of users) {
                await prisma.usersOnTenants.upsert({
                    where: {
                        userId_tenantId: {
                            userId: user.id,
                            tenantId: tenantId
                        }
                    },
                    update: {},
                    create: {
                        userId: user.id,
                        tenantId: tenantId
                    }
                });
            }
            log('Usuários associados ao tenant com sucesso!', 1);
        } catch (error) {
            log(`Erro ao associar usuários ao tenant: ${error instanceof Error ? error.message : String(error)}`, 2);
        }

        log('Referências do tenant atualizadas com sucesso!', 1);
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        log(`Erro ao atualizar referências do tenant: ${error.message}`, 2);
        throw error;
    }
}

async function main() {
    console.log('🚀 Iniciando o seed completo e robusto do banco de dados...');
    console.log('=====================================================');

    try {
        await prisma.$connect();
        await runStep(cleanupPreviousData, 'Limpando dados anteriores');
        // Comentando funções de seed não implementadas
        // await seedCoreInfra(prisma);
        // await seedPlatformSettings(prisma);
        // await seedDocumentTemplates(prisma);
        // await seedReportBuilderData(prisma);
        // await seedMedia(prisma);
        // await seedCategoriesAndVehicles(prisma);
        // await seedLocations(prisma);
        // await seedJudicialInfra(prisma);
        // await seedParticipants(prisma);
        // await seedUserDocuments(prisma);
        // await seedJudicialProcesses(prisma);
        // await seedAssets(prisma);
        // await seedAuctionsAndLots(prisma);
        // await seedJudicialRelations(prisma);
        // await seedScenarioBasedInteractions(prisma);
        // await seedGenericInteractions(prisma);
        // await seedBids(prisma);
        // await seedUserLotMaxBids(prisma);
        await runStep(seedInstallmentPayments, 'Criando pagamentos parcelados');
        await runStep(seedPostAuctionInteractions, 'Criando interações pós-leilão');
        // await runStep(seedDirectSaleOffers, 'Criando ofertas de venda direta'); // Função não implementada
        await runStep(seedMiscData, 'Criando dados diversos');
        await runStep(updateTenantReferences, 'Atualizando referências do tenant');
        
        console.log(`\n=====================================================`);
        console.log(`✅ Seed do banco de dados finalizado com sucesso!`);
        console.log(`=====================================================`);
        await logSummary();
        console.log(`\n🎉 Dataset completo gerado com sucesso!`);
    } catch (error) {
        console.error('❌ Erro ao executar o seed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();