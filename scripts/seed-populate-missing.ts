
/**
 * DEPRECATED — use `scripts/ultimate-master-seed.ts`. This file will be removed after two releases; update your PRs to modify `ultimate-master-seed.ts` instead.
 * @fileoverview Script para popular tabelas "zeradas" e garantir um ambiente de Demo rico.
 * Executa após o seed principal (seed-demo.ts).
 */

import { PrismaClient, ITSM_TicketStatus, ITSM_Priority, ITSM_Category, PaymentMethodType, AuditAction, AuctionStageStatus, BidderNotificationType, DirectSaleOfferType, DocumentTemplateType, ParticipationResult, SubmissionStatus, UserDocumentStatus, LotRiskType, LotRiskLevel, VisitorEventType, ValidationType, ValidationSeverity, InvoiceStatus } from '@prisma/client';
import { AuctionHabilitationService } from '@/services/auction-habilitation.service';
import { ContactMessageService } from '@/services/contact-message.service';
import { VehicleMakeService } from '@/services/vehicle-make.service';
import { VehicleModelService } from '@/services/vehicle-model.service';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Services
const auctionHabilitationService = new AuctionHabilitationService();
const contactMessageService = new ContactMessageService();
const vehicleMakeService = new VehicleMakeService();
const vehicleModelService = new VehicleModelService();

async function createMediaItem(tenantId: bigint, fileName: string, url: string) {
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

function slugify(text: string) {
    return text.toString().toLowerCase().trim().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('[POPULATE] Iniciando população de tabelas complementares...');

  // 1. Obter Contexto
  const tenant = await prisma.tenant.findFirst({
    where: { subdomain: 'demo' }
  });

  if (!tenant) {
    console.log('[POPULATE] ⚠️ Tenant Demo não encontrado. Tentando pegar o primeiro tenant disponível...');
  }
  
  const targetTenant = tenant || await prisma.tenant.findFirst();
  if (!targetTenant) {
     console.error('[POPULATE] ❌ Nenhum tenant encontrado.');
     return;
  }
  const tenantId = targetTenant.id;

  const users = await prisma.user.findMany({ 
      where: { tenants: { some: { tenantId: tenantId } } } 
  });
  const arrematante = users.find(u => u.email.startsWith('Arrematante')) || users[0];
    const allAuctions = await prisma.auction.findMany({ where: { tenantId: tenantId } });
    const lots = await prisma.lot.findMany({ where: { tenantId: tenantId } });
    const auctioneers = await prisma.auctioneer.findMany({ where: { tenantId: tenantId } });
    const sellers = await prisma.seller.findMany({ where: { tenantId: tenantId } });
  
  // 2. Popular Marcas e Modelos de Veículos (VehicleMake / VehicleModel - GLOBAL)
  console.log('[POPULATE] Gerando Marcas e Modelos...');
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
            const result = await vehicleMakeService.createVehicleMake({
                name: makeName,
                // active: true removed
            } as any);
            if (result.success && result.makeId) makeId = BigInt(result.makeId);
          } catch (e) { /* ignore */ }
      }

      if (makeId) {
          const models = modelsMap[makeName] || [];
          for (const modelName of models) {
              const existingModel = await prisma.vehicleModel.findFirst({ where: { name: modelName, makeId: makeId } });
              if (!existingModel) {
                  try {
                    await vehicleModelService.createVehicleModel({
                        makeId: makeId.toString(),
                        name: modelName,
                        // active/type removed
                    } as any);
                  } catch (e) { /* ignore */ }
              }
          }
      }
  }

  // 3. Popular Subcategorias
  console.log('[POPULATE] Gerando Subcategorias...');
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
  console.log('[POPULATE] Gerando Habilitações...');
  const auctions = allAuctions
      .filter(auction => ['ABERTO_PARA_LANCES', 'EM_BREVE'].includes(auction.status as string))
      .slice(0, 20);
    const platformSettings = (await prisma.platformSettings.findFirst({ where: { tenantId: tenantId } }))
        || (await prisma.platformSettings.findFirst());
  const seller = await prisma.seller.findFirst({ where: { tenantId: tenantId } });
  const category = await prisma.lotCategory.findFirst({ where: { tenantId: tenantId } });

  // 4.1 Estágios de Leilão e Preços por Estágio
  console.log('[POPULATE] Gerando Estágios de Leilão e Preços por Estágio...');
  for (const auction of allAuctions) {
      try {
          const existingStages = await prisma.auctionStage.findMany({ where: { auctionId: auction.id } });
          const stagesToUse = [...existingStages];

          const desiredStages = 2;
          if (existingStages.length < desiredStages) {
              const baseStart = new Date();
              for (let i = existingStages.length; i < desiredStages; i++) {
                  const startDate = new Date(baseStart.getTime() + i * 8 * 24 * 60 * 60 * 1000);
                  const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                  const stage = await prisma.auctionStage.create({
                      data: {
                          name: `${i + 1}ª Praça`,
                          startDate,
                          endDate,
                          auctionId: auction.id,
                          tenantId: tenantId,
                          status: i === 0 ? AuctionStageStatus.ABERTO : AuctionStageStatus.AGENDADO,
                          discountPercent: i === 0 ? '100.00' : '70.00'
                      }
                  });
                  stagesToUse.push(stage);
              }
          }

          const auctionLots = await prisma.lot.findMany({ where: { auctionId: auction.id } });
          for (const lot of auctionLots) {
              for (const stage of stagesToUse) {
                  const existingStagePrice = await prisma.lotStagePrice.findFirst({
                      where: { lotId: lot.id, auctionStageId: stage.id }
                  });

                  if (!existingStagePrice) {
                      const basePrice = lot.initialPrice || lot.price || 1000;
                      await prisma.lotStagePrice.create({
                          data: {
                              lotId: lot.id,
                              auctionId: auction.id,
                              auctionStageId: stage.id,
                              initialBid: basePrice,
                              bidIncrement: 100,
                              tenantId: tenantId
                          }
                      });
                  }
              }
          }
      } catch (e) {
          console.log('Erro ao gerar praças/preços:', auction.id, e);
      }
  }

  // 4.2 Riscos de Lotes
  console.log('[POPULATE] Gerando Riscos de Lotes...');
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
                  mitigationStrategy: 'Revisão documental completa e acompanhamento jurídico especializado.'
              }
          });
      }
  }

  // 4.3 Documentos de Lote
  console.log('[POPULATE] Gerando Documentos de Lote...');
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
            bidderProfile = await prisma.bidderProfile.create({
                data: {
                    userId: arrematante.id,
                    fullName: arrematante.name || 'Arrematante Demo',
                    cpf: '123.456.789-00',
                    // documentStatus: 'HABILITADO' as BidderDocumentStatus, // Removed, likely not in CreateInput or relies on default
                    // isActive: true, // Removed if not in schema
                    // emailNotifications: true // Removed if not in schema
                    tenantId: tenantId
                }
            });
          } catch (e) { console.log('Erro ao criar perfil:', e); }
      }

      for (const user of users.slice(0, 25)) {
          const existingProfile = await prisma.bidderProfile.findUnique({ where: { userId: user.id } });
          if (!existingProfile) {
              await prisma.bidderProfile.create({
                  data: {
                      userId: user.id,
                      fullName: user.name || `Arrematante ${user.id}`,
                      cpf: `000.000.00${Number(user.id % 100n).toString().padStart(2, '0')}-00`,
                      tenantId: tenantId
                  }
              });
          }
      }

      for (const auction of auctions) {
          try {
             // Verificar se já existe
             const exists = await prisma.auctionHabilitation.findUnique({
                 where: { userId_auctionId: { userId: arrematante.id, auctionId: auction.id } }
             });
             
             if (!exists) {
                await auctionHabilitationService.upsertAuctionHabilitation({
                    user: { connect: { id: arrematante.id } },
                    auction: { connect: { id: auction.id } },
                    tenant: { connect: { id: tenantId } },
                });
             }
          } catch(e) { console.log('Erro ao habilitar:', e); }
      }
      
      // 4.1 Métodos de Pagamento
      try {
          const bidderProfiles = await prisma.bidderProfile.findMany({ where: { tenantId: tenantId } });
          const existingPayments = await prisma.paymentMethod.count({ where: { tenantId: tenantId } });
          const targetPayments = 25;

          for (let i = existingPayments; i < targetPayments; i++) {
              const profile = bidderProfiles[i % bidderProfiles.length] || bidderProfile;
              if (!profile) continue;
              await prisma.paymentMethod.create({
                  data: {
                      bidderId: profile.id,
                      type: 'CREDIT_CARD' as PaymentMethodType,
                      cardBrand: i % 2 === 0 ? 'Visa' : 'Mastercard',
                      cardLast4: (4242 + i).toString().slice(-4),
                      cardToken: `tok_${100000 + i}`,
                      isDefault: i % 5 === 0,
                      tenantId: tenantId,
                      isActive: true
                  }
              });
          }
      } catch(e) { console.log('Erro PaymentMethod:', e); }

      // 4.2 Notificações e Histórico do Arrematante
    const sampleAuction = auctions[0] || allAuctions[0];
      const sampleLot = lots[0];

      if (bidderProfile && sampleAuction) {
          const existingBidderNotifs = await prisma.bidderNotification.count({ where: { bidderId: bidderProfile.id } });
          const targetBidderNotifs = 25;
          for (let i = existingBidderNotifs; i < targetBidderNotifs; i++) {
              await prisma.bidderNotification.create({
                  data: {
                      bidderId: bidderProfile.id,
                      tenantId: tenantId,
                      type: BidderNotificationType.AUCTION_ENDING,
                      title: `Leilão próximo do encerramento #${i + 1}`,
                      message: 'Seu leilão favorito está prestes a encerrar. Faça seu lance final!',
                      data: { auctionId: sampleAuction.id }
                  }
              });
          }
      }

      if (arrematante && sampleLot) {
          const existingNotifications = await prisma.notification.count({ where: { userId: arrematante.id } });
          const targetNotifications = 25;
          for (let i = existingNotifications; i < targetNotifications; i++) {
              await prisma.notification.create({
                  data: {
                      userId: arrematante.id,
                      tenantId: tenantId,
                      message: `Novo lote disponível para lances! (${i + 1})`,
                      link: `/lotes/${sampleLot.id}`,
                      lotId: sampleLot.id
                  }
              });
          }
      }

      if (bidderProfile && sampleAuction && sampleLot) {
          const existingParticipation = await prisma.participationHistory.count({ where: { bidderId: bidderProfile.id } });
          const targetParticipation = 25;
          for (let i = existingParticipation; i < targetParticipation; i++) {
              const lot = lots[i % lots.length] || sampleLot;
              await prisma.participationHistory.create({
                  data: {
                      bidderId: bidderProfile.id,
                      lotId: lot.id,
                      auctionId: sampleAuction.id,
                      title: lot.title || `Lote ${lot.lotNumber}`,
                      auctionName: sampleAuction.title || 'Leilão Demo',
                      maxBid: '15000.00',
                      finalBid: '14500.00',
                      result: ParticipationResult.LOST,
                      bidCount: 3,
                      tenantId: tenantId
                  }
              });
          }
      }

      if (arrematante && sampleLot) {
          for (const lot of lots.slice(0, 25)) {
              const hasMaxBid = await prisma.userLotMaxBid.findFirst({ where: { userId: arrematante.id, lotId: lot.id } });
              if (!hasMaxBid) {
                  await prisma.userLotMaxBid.create({
                      data: {
                          userId: arrematante.id,
                          lotId: lot.id,
                          maxAmount: '25000.00',
                          tenantId: tenantId
                      }
                  });
              }
          }
      }
  }

  // 5. Mensagens de Contato
  console.log('[POPULATE] Gerando Mensagens de Contato...');
  const messages = [
      { name: "João Silva", email: "joao@teste.com", subject: "Dúvida sobre lote", message: "Gostaria de saber mais sobre o lote 10." },
      { name: "Maria Oliveira", email: "maria@teste.com", subject: "Parceria", message: "Sou leiloeira gostaria de usar a plataforma." },
      { name: "Carlos Souza", email: "carlos@teste.com", subject: "Pagamento", message: "Quais as formas de pagamento aceitas?" },
      { name: "Ana Pereira", email: "ana_adv@juridico.com", subject: "Processo Judicial", message: "Dúvidas sobre a homologação." }
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
  console.log('[POPULATE] Gerando Galeria de Imagens (AssetMedia)...');
  const assets = await prisma.asset.findMany({ 
      where: { tenantId: tenantId },
      include: { gallery: true }, // Verify current gallery count
      take: 50
  });

  const sampleImages = [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80',
      'https://images.unsplash.com/photo-1605559424843-9e4c228d9c7ce?w=800&q=80',
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80'
  ];

  for (const asset of assets) {
      if (asset.gallery.length === 0) {
        for (let i = 0; i < 2; i++) {
            const imgUrl = sampleImages[i % sampleImages.length];
            // Create MediaItem
            const media = await prisma.mediaItem.create({
                data: {
                    tenantId: tenantId,
                    fileName: `gallery-${asset.id}-${i}.jpg`,
                    storagePath: `gallery/${asset.id}/${i}.jpg`,
                    urlOriginal: imgUrl,
                    mimeType: 'image/jpeg'
                }
            });

            // Associate AssetMedia
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
  console.log('[POPULATE] Garantindo mídia mínima por Lote/Leilão/Leiloeiro/Comitente...');
  for (const lot of lots) {
      if (!lot.imageMediaId) {
          const media = await createMediaItem(tenantId, `lot-${lot.id}.jpg`, `https://images.unsplash.com/photo-1501183638710-841dd1904471?w=800&q=80`);
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

  for (const auction of allAuctions) {
      if (!auction.imageMediaId) {
          const media = await createMediaItem(tenantId, `auction-${auction.id}.jpg`, `https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80`);
          await prisma.auction.update({
              where: { id: auction.id },
              data: { imageMediaId: media.id }
          });
      }
  }

  for (const auctioneer of auctioneers) {
      if (!auctioneer.logoMediaId) {
          const media = await createMediaItem(tenantId, `auctioneer-${auctioneer.id}.jpg`, `https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=800&q=80`);
          await prisma.auctioneer.update({
              where: { id: auctioneer.id },
              data: { logoMediaId: media.id, logoUrl: media.urlOriginal }
          });
      }
  }

  for (const sellerItem of sellers) {
      if (!sellerItem.logoMediaId) {
          const media = await createMediaItem(tenantId, `seller-${sellerItem.id}.jpg`, `https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80`);
          await prisma.seller.update({
              where: { id: sellerItem.id },
              data: { logoMediaId: media.id, logoUrl: media.urlOriginal }
          });
      }
  }

  // 7. Popular Support/Logs
  console.log('[POPULATE] Gerando Logs e Dados de Sistema...');

  const targetTickets = 25;
  const existingTickets = await prisma.iTSM_Ticket.findMany({ where: { tenantId: tenantId }, take: targetTickets });
  const ticketsToUse: Array<{ id: bigint; userId: bigint }> = [...existingTickets] as any;

  for (let i = existingTickets.length; i < targetTickets; i++) {
      const user = users[i % users.length] || arrematante;
      if (!user) continue;
      try {
          const newTicket = await prisma.iTSM_Ticket.create({
              data: {
                  tenantId: tenantId,
                  userId: user.id,
                  title: `Solicitação de suporte #${i + 1}`,
                  description: 'Chamado fictício para demonstração.',
                  status: 'ABERTO' as ITSM_TicketStatus,
                  priority: 'MEDIA' as ITSM_Priority,
                  category: 'OUTRO' as ITSM_Category,
                  publicId: uuidv4(),
              }
          });
          ticketsToUse.push({ id: newTicket.id, userId: user.id });
      } catch(e) { console.log('Erro tickets:', e); }
  }

  for (const ticket of ticketsToUse) {
      const messageCount = await prisma.iTSM_Message.count({ where: { ticketId: ticket.id } });
      for (let i = messageCount; i < 2; i++) {
          await prisma.iTSM_Message.create({
              data: {
                  ticketId: ticket.id,
                  userId: ticket.userId,
                  message: `Mensagem de suporte ${i + 1}`
              }
          });
      }

      const attachmentCount = await prisma.iTSM_Attachment.count({ where: { ticketId: ticket.id } });
      for (let i = attachmentCount; i < 2; i++) {
          await prisma.iTSM_Attachment.create({
              data: {
                  ticketId: ticket.id,
                  fileName: `anexo-ticket-${ticket.id}-${i + 1}.pdf`,
                  fileUrl: `https://storage.demo/itsm/anexo-${ticket.id}-${i + 1}.pdf`,
                  fileSize: 120000,
                  mimeType: 'application/pdf',
                  uploadedBy: ticket.userId
              }
          });
      }

      const hasChatLog = await prisma.iTSM_ChatLog.findFirst({ where: { ticketId: ticket.id } });
      if (!hasChatLog) {
          await prisma.iTSM_ChatLog.create({
              data: {
                  ticketId: ticket.id,
                  userId: ticket.userId,
                  tenantId: tenantId,
                  sessionId: uuidv4(),
                  messages: [
                      { role: 'user', text: 'Preciso de ajuda com meu cadastro.' },
                      { role: 'assistant', text: 'Vamos resolver rapidamente.' }
                  ],
                  context: { source: 'chatbot' },
                  wasHelpful: true,
                  ticketCreated: true
              }
          });
      }
  }

  // Visitor
  try {
      const existingVisitors = await prisma.visitor.count();
      const targetVisitors = 25;
      for (let i = existingVisitors; i < targetVisitors; i++) {
          await prisma.visitor.create({
            data: {
                visitorId: uuidv4(),
                firstIpAddress: `200.100.50.${(10 + i).toString()}`,
                firstUserAgent: "Mozilla/5.0 ... Chrome/120.0",
                deviceType: "DESKTOP",
                firstVisitAt: new Date(),
                lastVisitAt: new Date(),
            }
          });
      }
  } catch(e) { console.log('Erro visitor:', e); }

  const visitors = await prisma.visitor.findMany({ take: 25 });
  for (const visitor of visitors) {
      const existingSessions = await prisma.visitorSession.count({ where: { visitorId: visitor.id } });
      const targetSessionsPerVisitor = 2;
      const sessionIds: bigint[] = [];

      for (let i = existingSessions; i < targetSessionsPerVisitor; i++) {
          const newSession = await prisma.visitorSession.create({
              data: {
                  visitorId: visitor.id,
                  sessionId: uuidv4(),
                  userAgent: visitor.firstUserAgent || 'Mozilla/5.0',
                  ipAddress: visitor.firstIpAddress || '127.0.0.1',
                  referrer: 'https://google.com',
                  utmSource: 'google',
                  utmMedium: 'cpc',
                  utmCampaign: 'lotes-demo',
                  pageViews: 4,
                  eventsCount: 2,
                  duration: 180
              }
          });
          sessionIds.push(newSession.id);
      }

      if (sessionIds.length === 0) {
          const existing = await prisma.visitorSession.findMany({ where: { visitorId: visitor.id }, take: 2 });
          sessionIds.push(...existing.map(s => s.id));
      }

      const existingEvents = await prisma.visitorEvent.count({ where: { visitorId: visitor.id } });
      const targetEventsPerVisitor = 4;
      for (let i = existingEvents; i < targetEventsPerVisitor; i++) {
          const sessionId = sessionIds[i % sessionIds.length];
          if (!sessionId) continue;
          await prisma.visitorEvent.create({
              data: {
                  visitorId: visitor.id,
                  sessionId: sessionId,
                  eventId: uuidv4(),
                  eventType: VisitorEventType.PAGE_VIEW,
                  pageUrl: '/lotes',
                  metadata: { source: 'seed', index: i + 1 }
              }
          });
      }
  }

  // Audit Log
  if (arrematante) {
      try {
        const existingAuditLogs = await prisma.auditLog.count({ where: { tenantId: tenantId } });
        const targetAuditLogs = 25;
        for (let i = existingAuditLogs; i < targetAuditLogs; i++) {
            await prisma.auditLog.create({
                data: {
                    tenantId: tenantId,
                    userId: arrematante.id,
                    entityType: "Auth",
                    entityId: arrematante.id,
                    action: 'CREATE' as AuditAction,
                    metadata: { ip: "127.0.0.1", method: "credentials", event: `user.login.${i + 1}` }
                }
            });
        }
      } catch(e) { console.log('Erro audit:', e); }
  }

  // Document Types
  console.log('[POPULATE] Gerando Tipos de Documentos...');
  const docTypes = ['Edital', 'Matrícula', 'Laudo', 'Prestação de Contas', 'Termo de Arrematação', 'RG/CPF', 'Comprovante Residência'];
  for (const dt of docTypes) {
      await prisma.documentType.upsert({
          where: { name: dt },
          update: {},
          create: {
              name: dt,
              description: `Tipo de documento: ${dt}`,
              isRequired: false,
              appliesTo: 'ALL'
          }
      });
  }
  const existingDocTypeCount = await prisma.documentType.count();
  const targetDocTypeCount = 25;
  for (let i = existingDocTypeCount; i < targetDocTypeCount; i++) {
      await prisma.documentType.create({
          data: {
              name: `Documento Demo ${i + 1}`,
              description: `Tipo de documento demo ${i + 1}`,
              isRequired: false,
              appliesTo: 'ALL'
          }
      });
  }

  // Templates de Documentos
  console.log('[POPULATE] Gerando Templates de Documentos...');
  const templateTypes = [
      DocumentTemplateType.WINNING_BID_TERM,
      DocumentTemplateType.EVALUATION_REPORT,
      DocumentTemplateType.AUCTION_CERTIFICATE
  ];
  const existingTemplateCount = await prisma.documentTemplate.count();
  const targetTemplateCount = 25;
  for (let i = existingTemplateCount; i < targetTemplateCount; i++) {
      const name = `Template Demo ${i + 1}`;
      await prisma.documentTemplate.upsert({
          where: { name },
          update: {},
          create: {
              name,
              type: templateTypes[i % templateTypes.length],
              content: `Conteúdo fictício do template: ${name}`
          }
      });
  }

  // Documentos de Usuário
  const allDocTypes = await prisma.documentType.findMany({ take: 25 });
  for (let i = 0; i < 25; i++) {
      const user = users[i % users.length];
      const docType = allDocTypes[i % allDocTypes.length];
      if (!user || !docType) continue;
      const existingUserDoc = await prisma.userDocument.findFirst({
          where: { userId: user.id, documentTypeId: docType.id }
      });

      if (!existingUserDoc) {
          await prisma.userDocument.create({
              data: {
                  userId: user.id,
                  documentTypeId: docType.id,
                  fileName: 'rg-frente.jpg',
                  fileUrl: `https://storage.demo/user-docs/${user.id}-rg.jpg`,
                  status: UserDocumentStatus.SUBMITTED,
                  tenantId: tenantId
              }
          });
      }
  }

  // Submissões de Formulário
  const existingSubmissions = await prisma.formSubmission.count({ where: { tenantId: tenantId } });
  const targetSubmissions = 25;
  for (let i = existingSubmissions; i < targetSubmissions; i++) {
      const user = users[i % users.length];
      if (!user) continue;
      await prisma.formSubmission.create({
          data: {
              tenantId: tenantId,
              userId: user.id,
              formType: 'HABILITACAO_LEILAO',
              status: SubmissionStatus.SUBMITTED,
              validationScore: 90,
              data: { step: 'final', agreedTerms: true, index: i + 1 },
              validationErrors: []
          }
      });
  }

  // Regras de Validação
  const validationRules = [
      { entityType: 'User', fieldName: 'email', ruleType: ValidationType.PATTERN, config: { regex: '^\\S+@\\S+\\.\\S+$' }, errorMessage: 'E-mail inválido.' },
      { entityType: 'User', fieldName: 'name', ruleType: ValidationType.MIN_LENGTH, config: { min: 3 }, errorMessage: 'Nome muito curto.' },
      { entityType: 'Lot', fieldName: 'initialPrice', ruleType: ValidationType.MIN_VALUE, config: { min: 100 }, errorMessage: 'Preço mínimo inválido.' },
      { entityType: 'Auction', fieldName: 'title', ruleType: ValidationType.REQUIRED, config: {}, errorMessage: 'Título obrigatório.' },
      { entityType: 'DirectSaleOffer', fieldName: 'price', ruleType: ValidationType.MIN_VALUE, config: { min: 1000 }, errorMessage: 'Preço mínimo inválido.' },
  ];
  for (let i = 0; i < 25; i++) {
      const rule = validationRules[i % validationRules.length];
      const uniqueField = `${rule.fieldName}_${i + 1}`;
      await prisma.validationRule.upsert({
          where: { entityType_fieldName_ruleType: { entityType: rule.entityType, fieldName: uniqueField, ruleType: rule.ruleType } },
          update: {},
          create: {
              entityType: rule.entityType,
              fieldName: uniqueField,
              ruleType: rule.ruleType,
              config: rule.config,
              errorMessage: rule.errorMessage,
              severity: ValidationSeverity.ERROR,
              isActive: true
          }
      });
  }

  // Ofertas de Venda Direta
  if (seller && category) {
      const existingOfferCount = await prisma.directSaleOffer.count({ where: { tenantId: tenantId } });
      const targetOfferCount = 25;
      for (let i = existingOfferCount; i < targetOfferCount; i++) {
          await prisma.directSaleOffer.create({
              data: {
                  publicId: uuidv4(),
                  title: `Oferta Direta Demo ${i + 1}`,
                  description: 'Oferta fictícia de venda direta para demonstração.',
                  offerType: DirectSaleOfferType.BUY_NOW,
                  price: '450000.00',
                  categoryId: category.id,
                  sellerId: seller.id,
                  sellerName: seller.name,
                  tenantId: tenantId,
                  locationCity: 'São Paulo',
                  locationState: 'SP',
                  imageUrl: 'https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=800&q=80',
                  itemsIncluded: ['Imóvel', 'Documentação'],
                  views: 12 + i
              }
          });
      }
  }

  // Métricas de Visualização
  const sampleLot = lots[0];
  const sampleAuction = auctions[0] || allAuctions[0];
  for (const lot of lots.slice(0, 25)) {
      await prisma.entityViewMetrics.upsert({
          where: { entityType_entityId: { entityType: 'Lot', entityId: lot.id } },
          update: { totalViews: 120, uniqueViews: 80, viewsLast24h: 14 },
          create: {
              entityType: 'Lot',
              entityId: lot.id,
              tenantId: tenantId,
              totalViews: 120,
              uniqueViews: 80,
              viewsLast24h: 14,
              viewsLast7d: 60,
              viewsLast30d: 110,
              sharesCount: 3,
              favoritesCount: 5
          }
      });
  }
  for (const auction of allAuctions.slice(0, 5)) {
      await prisma.entityViewMetrics.upsert({
          where: { entityType_entityId: { entityType: 'Auction', entityId: auction.id } },
          update: { totalViews: 240, uniqueViews: 150 },
          create: {
              entityType: 'Auction',
              entityId: auction.id,
              tenantId: tenantId,
              totalViews: 240,
              uniqueViews: 150,
              viewsLast24h: 20,
              viewsLast7d: 140,
              viewsLast30d: 210
          }
      });
  }

  // Contadores Globais
  const counters = [
      'Auction', 'Lot', 'Bid', 'User', 'Payment', 'DirectSaleOffer', 'Notification',
      'Report', 'Ticket', 'Seller', 'Auctioneer', 'Document', 'MediaItem', 'Subcategory',
      'Category', 'Visitor', 'Session', 'Event', 'FormSubmission', 'UserDocument',
      'AuctionStage', 'LotStagePrice', 'LotRisk', 'UserWin', 'InstallmentPayment',
      'ParticipationHistory', 'EntityViewMetrics'
  ];
  for (const entityType of counters) {
      await prisma.counterState.upsert({
          where: { tenantId_entityType: { tenantId: tenantId, entityType } },
          update: { currentValue: 1000 },
          create: { tenantId: tenantId, entityType, currentValue: 1000 }
      });
  }

  // Configurações de Plataforma
  if (platformSettings) {
      const hasIdMasks = await prisma.idMasks.findFirst({ where: { platformSettingsId: platformSettings.id } });
      if (!hasIdMasks) {
          await prisma.idMasks.create({
              data: {
                  platformSettingsId: platformSettings.id,
                  auctionCodeMask: 'LEILAO-####',
                  lotCodeMask: 'LOTE-####',
                  userCodeMask: 'USER-####',
                  sellerCodeMask: 'SELLER-####'
              }
          });
      }

    const hasTheme = await prisma.themeSettings.findFirst({ where: { platformSettingsId: platformSettings.id } });
      let themeId = hasTheme?.id;
      if (!hasTheme) {
          const newTheme = await prisma.themeSettings.create({
              data: {
                  name: `Tema Demo ${tenantId}`,
                  platformSettingsId: platformSettings.id
              }
          });
          themeId = newTheme.id;
      }

      if (themeId) {
          const hasColors = await prisma.themeColors.findFirst({ where: { themeSettingsId: themeId } });
          if (!hasColors) {
              await prisma.themeColors.create({
                  data: {
                      themeSettingsId: themeId,
                      light: { primary: '#FF6B00', background: '#FFFFFF', text: '#1A1A1A' },
                      dark: { primary: '#FF8F3D', background: '#0F1115', text: '#F5F5F5' }
                  }
              });
          }
      }

      const hasRealtime = await prisma.realtimeSettings.findFirst({ where: { platformSettingsId: platformSettings.id } });
      if (!hasRealtime) {
          await prisma.realtimeSettings.create({
              data: {
                  platformSettingsId: platformSettings.id,
                  blockchainEnabled: false,
                  softCloseEnabled: true,
                  softCloseMinutes: 5,
                  lawyerPortalEnabled: true,
                  lawyerSubscriptionPrice: 19900,
                  lawyerPerUsePrice: 5000,
                  lawyerRevenueSharePercent: '2.50'
              }
          });
      }

      const hasRules = await prisma.variableIncrementRule.findFirst({ where: { platformSettingsId: platformSettings.id } });
      if (!hasRules) {
          await prisma.variableIncrementRule.createMany({
              data: [
                  { platformSettingsId: platformSettings.id, from: 0, to: 10000, increment: 100 },
                  { platformSettingsId: platformSettings.id, from: 10001, to: 50000, increment: 250 }
              ]
          });
      }
  }

  // Relatórios e Marketing
  if (arrematante) {
      const existingReportCount = await prisma.report.count({ where: { tenantId: tenantId } });
      const targetReportCount = 25;
      for (let i = existingReportCount; i < targetReportCount; i++) {
          await prisma.report.create({
              data: {
                  name: `Relatório Demo ${i + 1}`,
                  description: 'Relatório fictício para demonstração.',
                  definition: { type: 'sales', period: 'monthly', index: i + 1 },
                  tenantId: tenantId,
                  createdById: arrematante.id
              }
          });
      }
  }

  const existingSubscriberCount = await prisma.subscriber.count({ where: { tenantId: tenantId } });
  const targetSubscriberCount = 25;
  for (let i = existingSubscriberCount; i < targetSubscriberCount; i++) {
      await prisma.subscriber.create({
          data: {
              tenantId: tenantId,
              email: `cliente.demo.${i + 1}@bidexpert.com.br`,
              name: `Cliente Demo ${i + 1}`,
              phone: `1199999${(1000 + i).toString()}`,
              preferences: { categories: ['Imóveis', 'Veículos'] }
          }
      });
  }

  const tokenEmails = users.slice(0, 25).map(u => u.email);
  for (let i = 0; i < 25; i++) {
      const email = tokenEmails[i] || `user.demo.${i + 1}@bidexpert.com.br`;
      await prisma.passwordResetToken.create({
          data: {
              email,
              token: uuidv4(),
              expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
          }
      });
  }

  // Faturas de Tenant
  const existingInvoiceCount = await prisma.tenantInvoice.count({ where: { tenantId: tenantId } });
  const targetInvoiceCount = 25;
  for (let i = existingInvoiceCount; i < targetInvoiceCount; i++) {
      const periodStart = new Date(Date.now() - (30 * (i + 1)) * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);
      await prisma.tenantInvoice.create({
          data: {
              tenantId: tenantId,
              invoiceNumber: `INV-${tenantId}-${(i + 1).toString().padStart(3, '0')}`,
              amount: '299.00',
              periodStart,
              periodEnd,
              dueDate: new Date(periodEnd.getTime() + 7 * 24 * 60 * 60 * 1000),
              status: i % 3 === 0 ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
              description: 'Fatura mensal do tenant - ambiente de demonstração',
              lineItems: [
                  { description: 'Plano Profissional', amount: 299.00 }
              ]
          }
      });
  }
  
  // WonLot
  if (arrematante) {
      const bidderProf = await prisma.bidderProfile.findUnique({ where: { userId: arrematante.id } });
      const closedLot = await prisma.lot.findFirst({ 
          where: { status: 'VENDIDO', tenantId: tenantId, bidsCount: { gt: 0 } },
          include: { auction: true }
      });
      
      if (bidderProf && closedLot) {
           const targetWinCount = 25;
           const soldLots = await prisma.lot.findMany({ where: { tenantId: tenantId, status: 'VENDIDO' }, take: targetWinCount });
           const missingCount = targetWinCount - soldLots.length;

           if (missingCount > 0) {
               const additionalLots = await prisma.lot.findMany({
                   where: { tenantId: tenantId, status: { notIn: ['VENDIDO'] } },
                   take: missingCount
               });

               for (const lot of additionalLots) {
                   await prisma.lot.update({
                       where: { id: lot.id },
                       data: {
                           status: 'VENDIDO',
                           bidsCount: lot.bidsCount && lot.bidsCount > 0 ? lot.bidsCount : 1,
                           price: lot.price || lot.initialPrice || '1000.00'
                       }
                   });
                   soldLots.push({ ...lot, status: 'VENDIDO' } as any);
               }
           }

           for (const lot of soldLots) {
               let userWin = await prisma.userWin.findFirst({ where: { lotId: lot.id } });
               if (!userWin) {
                   userWin = await prisma.userWin.create({
                       data: {
                           lotId: lot.id,
                           userId: arrematante.id,
                           tenantId: tenantId,
                           winningBidAmount: lot.price || lot.initialPrice || '1000.00',
                           invoiceUrl: `https://storage.demo/invoices/invoice-${lot.id}.pdf`
                       }
                   });
               }

               const hasInstallments = await prisma.installmentPayment.findFirst({ where: { userWinId: userWin.id } });
               if (!hasInstallments) {
                   await prisma.installmentPayment.createMany({
                       data: [
                           {
                               userWinId: userWin.id,
                               installmentNumber: 1,
                               totalInstallments: 2,
                               amount: '5000.00',
                               dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                               tenantId: tenantId
                           },
                           {
                               userWinId: userWin.id,
                               installmentNumber: 2,
                               totalInstallments: 2,
                               amount: '5000.00',
                               dueDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
                               tenantId: tenantId
                           }
                       ]
                   });
               }

               const existingWin = await prisma.wonLot.findFirst({ where: { lotId: lot.id } });
               if (!existingWin) {
                   await prisma.wonLot.create({
                       data: {
                           tenantId: tenantId,
                           bidderId: bidderProf.id,
                           lotId: lot.id,
                           auctionId: lot.auctionId,
                           finalBid: lot.price || lot.initialPrice || '1000.00',
                           totalAmount: lot.price || lot.initialPrice || '1000.00',
                           status: 'WON',
                           paymentStatus: 'PENDENTE',
                           wonAt: new Date(),
                           title: lot.title || `Lote ${lot.lotNumber}`
                       }
                   });
               }
           }

      }
  }

  console.log('[POPULATE] ✅ População complementar concluída!');

  // Run parent-child integrity enforcement to ensure children exist for all parents
  try {
    const afc = await import('./analyze-and-fill-children');
    if (afc && typeof afc.ensureParentChildRelations === 'function') {
      console.log('[POPULATE] Executando ensureParentChildRelations para completar filhos faltantes...');
      await afc.ensureParentChildRelations();
      console.log('[POPULATE] ensureParentChildRelations executado.');
    }
  } catch (e) {
    console.warn('[POPULATE] Não foi possível executar ensureParentChildRelations automaticamente:', e);
  }
}

main()
  .catch((e) => {
      console.error('[POPULATE] ❌ Erro:', e);
  })
  .finally(() => prisma.$disconnect());
