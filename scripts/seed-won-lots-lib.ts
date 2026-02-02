/**
 * @fileoverview Seed de lotes arrematados usando services (leilões finalizados,
 * lotes vendidos, arrematantes habilitados e documentação aprovada).
 *
 * BDD: Garantir massa de dados para jornada do arrematante.
 * TDD: Validar criação via services e amarração de entidades.
 */
import { faker } from '@faker-js/faker/locale/pt_BR';
import { prisma } from '../src/lib/prisma';
import { AuctionService } from '../src/services/auction.service';
import { LotService } from '../src/services/lot.service';
import { AuctionHabilitationService } from '../src/services/auction-habilitation.service';
import { UserDocumentService } from '../src/services/user-document.service';
import { BidderService } from '../src/services/bidder.service';
import { UserService } from '../src/services/user.service';
import { DocumentTypeService } from '../src/services/document-type.service';
import { UserWinService } from '../src/services/user-win.service';
import { AuctioneerService } from '../src/services/auctioneer.service';
import { SellerService } from '../src/services/seller.service';

interface SeedWonLotsOptions {
  auctionsCount: number;
  lotsPerAuction: number;
  winnersPerAuction: number;
}

interface SeedWonLotsDeps {
  auctionService: AuctionService;
  lotService: LotService;
  auctionHabilitationService: AuctionHabilitationService;
  userDocumentService: UserDocumentService;
  bidderService: BidderService;
  userService: UserService;
  documentTypeService: DocumentTypeService;
  userWinService: UserWinService;
  auctioneerService: AuctioneerService;
  sellerService: SellerService;
}

const DEFAULT_OPTIONS: SeedWonLotsOptions = {
  auctionsCount: 2,
  lotsPerAuction: 4,
  winnersPerAuction: 3,
};

function formatCpf(raw: string) {
  return raw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function buildDeps(): SeedWonLotsDeps {
  return {
    auctionService: new AuctionService(),
    lotService: new LotService(),
    auctionHabilitationService: new AuctionHabilitationService(),
    userDocumentService: new UserDocumentService(),
    bidderService: new BidderService(),
    userService: new UserService(),
    documentTypeService: new DocumentTypeService(),
    userWinService: new UserWinService(),
    auctioneerService: new AuctioneerService(),
    sellerService: new SellerService(),
  };
}

async function resolveDocumentTypes(documentTypeService: DocumentTypeService) {
  const rg = await documentTypeService.findByName('RG');
  const cpf = await documentTypeService.findByName('CPF');

  if (rg && cpf) {
    return { rg, cpf };
  }

  const fallback = await prisma.documentType.findFirst();
  if (!fallback) {
    throw new Error('Nenhum DocumentType encontrado. Execute o seed principal antes.');
  }

  return { rg: rg ?? fallback, cpf: cpf ?? fallback };
}

async function ensureAuctioneerAndSeller(
  tenantId: bigint,
  deps: SeedWonLotsDeps
) {
  const auctioneer = await prisma.auctioneer.findFirst({ where: { tenantId } });
  const seller = await prisma.seller.findFirst({ where: { tenantId } });

  let auctioneerId = auctioneer?.id?.toString();
  let sellerId = seller?.id?.toString();

  if (!auctioneerId) {
    const createdAuctioneer = await deps.auctioneerService.createAuctioneer(tenantId.toString(), {
      name: `Leiloeiro Seed ${faker.person.lastName()}`,
      description: 'Leiloeiro seed automático para dados de arremate.',
      email: faker.internet.email(),
      phone: faker.phone.number(),
    } as any);
    if (!createdAuctioneer.auctioneerId) {
      throw new Error(createdAuctioneer.message || 'Falha ao criar leiloeiro para seed.');
    }
    auctioneerId = createdAuctioneer.auctioneerId;
  }

  if (!sellerId) {
    const createdSeller = await deps.sellerService.createSeller(tenantId.toString(), {
      name: `Comitente Seed ${faker.company.name()}`,
      description: 'Comitente seed automático para dados de arremate.',
      email: faker.internet.email(),
      phone: faker.phone.number(),
    } as any);
    if (!createdSeller.sellerId) {
      throw new Error(createdSeller.message || 'Falha ao criar comitente para seed.');
    }
    sellerId = createdSeller.sellerId;
  }

  return { auctioneerId, sellerId };
}

async function ensureApprovedBidderUsers(
  tenantId: bigint,
  requiredCount: number,
  deps: SeedWonLotsDeps
) {
  const approvedDocs = await prisma.userDocument.findMany({
    where: { tenantId, status: 'APPROVED' as any },
    select: { userId: true }
  });

  const approvedUserIds = Array.from(new Set(approvedDocs.map(doc => doc.userId.toString())));

  if (approvedUserIds.length >= requiredCount) {
    return approvedUserIds.map(id => BigInt(id));
  }

  const { rg, cpf } = await resolveDocumentTypes(deps.documentTypeService);

  while (approvedUserIds.length < requiredCount) {
    const index = approvedUserIds.length + 1;
    const email = `arrematante${index}@seed.com`;

    const createUserResult = await deps.userService.createUser({
      email,
      password: 'Test@12345',
      fullName: faker.person.fullName(),
      tenantId: tenantId.toString(),
    } as any);

    if (!createUserResult.userId) {
      throw new Error(createUserResult.message || 'Falha ao criar usuário arrematante.');
    }

    const userId = BigInt(createUserResult.userId);
    const rawCpf = faker.string.numeric(11);
    const cpfFormatted = formatCpf(rawCpf);

    await deps.userDocumentService.createUserDocument({
      user: { connect: { id: userId } },
      documentType: { connect: { id: rg.id } },
      fileUrl: faker.internet.url(),
      fileName: 'rg.pdf',
      status: 'APPROVED' as any,
      tenant: { connect: { id: tenantId } },
    } as any);

    await deps.userDocumentService.createUserDocument({
      user: { connect: { id: userId } },
      documentType: { connect: { id: cpf.id } },
      fileUrl: faker.internet.url(),
      fileName: 'cpf.pdf',
      status: 'APPROVED' as any,
      tenant: { connect: { id: tenantId } },
    } as any);

    await deps.userService.updateUserProfile(createUserResult.userId, {
      habilitationStatus: 'HABILITADO' as any,
      cpf: cpfFormatted,
    } as any);

    await deps.bidderService.getOrCreateBidderProfile(userId);
    await deps.bidderService.updateBidderProfile(userId, {
      documentStatus: 'APPROVED' as any,
      cpf: cpfFormatted,
      city: 'São Paulo',
      state: 'SP',
      phone: faker.phone.number(),
    });

    approvedUserIds.push(userId.toString());
  }

  return approvedUserIds.map(id => BigInt(id));
}

export async function seedWonLotsWithServices(
  tenantId: bigint,
  options: Partial<SeedWonLotsOptions> = {},
  deps: SeedWonLotsDeps = buildDeps()
) {
  const { auctionsCount, lotsPerAuction, winnersPerAuction } = {
    ...DEFAULT_OPTIONS,
    ...options
  };

  const { auctioneerId, sellerId } = await ensureAuctioneerAndSeller(tenantId, deps);

  const requiredWinners = auctionsCount * winnersPerAuction;
  const winnerUserIds = await ensureApprovedBidderUsers(tenantId, requiredWinners, deps);

  for (let a = 0; a < auctionsCount; a++) {
    const auctionName = `Leilão Finalizado Seed #${a + 1} - ${Date.now()}`;
    const startDate = faker.date.past({ years: 1 });
    const endDate = faker.date.recent({ days: 10 });

    const createdAuction = await deps.auctionService.createAuction(tenantId.toString(), {
      title: auctionName,
      description: 'Seed de leilão finalizado para testes de lotes arrematados.',
      status: 'FINALIZADO' as any,
      auctionType: 'JUDICIAL' as any,
      auctionMethod: 'STANDARD' as any,
      participation: 'ONLINE' as any,
      endDate,
      auctioneerId,
      sellerId,
      auctionStages: [
        {
          name: '1ª Praça',
          startDate,
          endDate,
          discountPercent: 100,
        }
      ]
    } as any);

    if (!createdAuction.auctionId) {
      throw new Error(createdAuction.message || 'Falha ao criar leilão para seed.');
    }

    const auctionId = createdAuction.auctionId;

    for (let l = 0; l < lotsPerAuction; l++) {
      const lotPrice = faker.number.int({ min: 10000, max: 50000 });
      const winnerIndex = (a * winnersPerAuction + l) % winnerUserIds.length;
      const winnerUserId = winnerUserIds[winnerIndex];
      const winningBid = faker.number.int({ min: lotPrice + 1000, max: lotPrice + 10000 });

      await deps.userService.updateUserProfile(winnerUserId.toString(), {
        habilitationStatus: 'HABILITADO' as any,
      } as any);

      const createdLot = await deps.lotService.createLot({
        auctionId,
        title: `Lote ${l + 1} do ${auctionName}`,
        description: 'Lote seed para arrematação.',
        status: 'VENDIDO' as any,
        price: lotPrice,
        type: 'IMOVEL',
        winnerId: winnerUserId.toString(),
        endDate,
      } as any, tenantId.toString());

      if (!createdLot.lotId) {
        throw new Error(createdLot.message || 'Falha ao criar lote para seed.');
      }

      await deps.lotService.updateLot(createdLot.lotId, {
        status: 'VENDIDO' as any,
        winnerId: winnerUserId.toString(),
        tenantId: tenantId.toString(),
      } as any);

      await deps.auctionHabilitationService.upsertAuctionHabilitation({
        User: { connect: { id: winnerUserId } },
        Auction: { connect: { id: BigInt(auctionId) } },
        Tenant: { connect: { id: tenantId } },
      } as any);

      const bidderProfile = await deps.bidderService.getOrCreateBidderProfile(winnerUserId);
      await deps.bidderService.updateBidderProfile(winnerUserId, {
        documentStatus: 'APPROVED' as any,
      });

      await deps.userWinService.create({
        Lot: { connect: { id: BigInt(createdLot.lotId) } },
        User: { connect: { id: winnerUserId } },
        Tenant: { connect: { id: tenantId } },
        winningBidAmount: winningBid,
        paymentStatus: 'PAGO' as any,
        retrievalStatus: 'ENTREGUE',
        winDate: faker.date.recent({ days: 10 }),
      } as any);

      await deps.bidderService.createWonLot({
        bidder_profiles: { connect: { id: bidderProfile.id } },
        lotId: BigInt(createdLot.lotId),
        auctionId: BigInt(auctionId),
        title: `Lote ${l + 1} do ${auctionName}`,
        finalBid: winningBid,
        wonAt: faker.date.recent({ days: 10 }),
        status: 'WON' as any,
        paymentStatus: 'PAGO' as any,
        totalAmount: winningBid,
        paidAmount: winningBid,
        dueDate: faker.date.recent({ days: 5 }),
        deliveryStatus: 'DELIVERED' as any,
        Tenant: { connect: { id: tenantId } },
        updatedAt: new Date(),
      } as any);
    }
  }
}
