/**
 * @fileoverview Seed canônico do tenant Leilões e Cia com um evento público
 * path-based, um leilão, praça, lote, ativo e vínculos de loteamento.
 *
 * BDD: Garantir que o slug /leiloesecia exista no banco com dados reais do
 * anúncio Mercedes-Benz 915E Blinfort para smoke em Vercel/main.
 * TDD: Validar idempotência por slug/unique keys e integridade da cadeia.
 */

import { Prisma, PrismaClient } from '@prisma/client';

const SOURCE_URL = 'https://www.vipleiloes.com.br/evento/anuncio/mercedes-benz-915e-blinfort-124051';
const TERMS_URL = 'https://armazupvipleiloesprd.blob.core.windows.net/uploads/d0f0327f-4f5b-40fe-8b0c-e215a4cc2e9f.pdf';
const DEFAULT_GALLERY = [
  'https://armazupvipleiloesprd.blob.core.windows.net/uploads/9a7538d6-7789-4ed0-8b0e-a7d254645412.jpg',
  'https://armazupvipleiloesprd.blob.core.windows.net/uploads/c3a10ec6-a8b8-41f6-b5ca-eca4724b8c29.jpg',
  'https://armazupvipleiloesprd.blob.core.windows.net/uploads/964f21ef-def0-4170-9f1b-c0087ca33490.jpg',
];

const TENANT_SLUG = 'leiloesecia';
const AUCTION_SLUG = 'leiloesecia-mercedes-benz-915e-blinfort-124051';
const LOT_NUMBER = 'L001';
const DAY = 24 * 60 * 60 * 1000;

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureState(prisma: PrismaClient) {
  const stateName = 'Rio de Janeiro';
  const uf = 'RJ';

  const existing = await prisma.state.findFirst({ where: { uf } });
  if (existing) {
    return existing;
  }

  return prisma.state.create({
    data: {
      slug: slugify(stateName),
      name: stateName,
      uf,
    },
  });
}

async function ensureCity(prisma: PrismaClient, stateId: bigint) {
  const cityName = 'Rio de Janeiro';

  const existing = await prisma.city.findFirst({
    where: {
      name: cityName,
      stateId,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.city.create({
    data: {
      name: cityName,
      stateId,
      slug: slugify(cityName),
      updatedAt: new Date(),
    },
  });
}

async function ensureCategory(prisma: PrismaClient, tenantId: bigint) {
  const categoryName = 'Pesados';
  const categorySlug = 'pesados';

  const existing = await prisma.lotCategory.findFirst({
    where: {
      OR: [{ slug: categorySlug }, { name: categoryName }],
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.lotCategory.create({
    data: {
      name: categoryName,
      slug: categorySlug,
      description: 'Categoria canônica para o lote Mercedes-Benz do tenant Leilões e Cia.',
      isGlobal: true,
      tenantId,
      updatedAt: new Date(),
    },
  });
}

async function ensureAuctionStage(prisma: PrismaClient, auctionId: bigint, tenantId: bigint, now: Date) {
  const stageName = 'Praça Única';
  const existing = await prisma.auctionStage.findFirst({
    where: {
      auctionId,
      tenantId,
      name: stageName,
    },
  });

  const stageData = {
    name: stageName,
    auctionId,
    tenantId,
    startDate: new Date(now.getTime() - DAY),
    endDate: new Date(now.getTime() + DAY),
    status: 'EM_ANDAMENTO' as const,
    discountPercent: new Prisma.Decimal('100.00'),
  };

  if (existing) {
    return prisma.auctionStage.update({
      where: { id: existing.id },
      data: stageData,
    });
  }

  return prisma.auctionStage.create({
    data: stageData,
  });
}

export async function seedLeiloesCiaTenant(prisma: PrismaClient) {
  const now = new Date();
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: TENANT_SLUG },
    update: {
      name: 'Leilões e Cia',
      domain: null,
      resolutionStrategy: 'PATH',
      status: 'ACTIVE',
      metadata: {
        source: SOURCE_URL,
        seededFrom: 'vip-leiloes-public-ad',
        canonicalSlug: TENANT_SLUG,
      },
      activatedAt: now,
      updatedAt: now,
    },
    create: {
      name: 'Leilões e Cia',
      subdomain: TENANT_SLUG,
      domain: null,
      resolutionStrategy: 'PATH',
      status: 'ACTIVE',
      activatedAt: now,
      metadata: {
        source: SOURCE_URL,
        seededFrom: 'vip-leiloes-public-ad',
        canonicalSlug: TENANT_SLUG,
      },
      updatedAt: now,
    },
  });

  const state = await ensureState(prisma);
  const city = await ensureCity(prisma, state.id);
  const category = await ensureCategory(prisma, tenant.id);

  const seller = await prisma.seller.upsert({
    where: { slug: 'leiloes-e-cia-comitente' },
    update: {
      name: 'Leilões e Cia - Comitente',
      description: 'Comitente do tenant Leilões e Cia para o evento Mercedes-Benz 915E Blinfort.',
      email: 'atendimento@leiloesecia.com.br',
      phone: '551137775942',
      city: city.name,
      state: state.uf,
      zipCode: '21010-076',
      tenantId: tenant.id,
      updatedAt: now,
    },
    create: {
      publicId: 'seller-leiloesecia',
      slug: 'leiloes-e-cia-comitente',
      name: 'Leilões e Cia - Comitente',
      description: 'Comitente do tenant Leilões e Cia para o evento Mercedes-Benz 915E Blinfort.',
      email: 'atendimento@leiloesecia.com.br',
      phone: '551137775942',
      city: city.name,
      state: state.uf,
      zipCode: '21010-076',
      tenantId: tenant.id,
      updatedAt: now,
    },
  });

  const auctioneer = await prisma.auctioneer.upsert({
    where: { slug: 'leiloes-e-cia' },
    update: {
      name: 'Leilões e Cia',
      description: 'Leiloeiro do tenant Leilões e Cia para o evento Mercedes-Benz 915E Blinfort.',
      email: 'leiloes@leiloesecia.com.br',
      phone: '551137775942',
      supportWhatsApp: '551137775942',
      city: city.name,
      state: state.uf,
      zipCode: '21010-076',
      tenantId: tenant.id,
      updatedAt: now,
    },
    create: {
      publicId: 'auctioneer-leiloesecia',
      slug: 'leiloes-e-cia',
      name: 'Leilões e Cia',
      description: 'Leiloeiro do tenant Leilões e Cia para o evento Mercedes-Benz 915E Blinfort.',
      email: 'leiloes@leiloesecia.com.br',
      phone: '551137775942',
      supportWhatsApp: '551137775942',
      city: city.name,
      state: state.uf,
      zipCode: '21010-076',
      tenantId: tenant.id,
      updatedAt: now,
    },
  });

  const auction = await prisma.auction.upsert({
    where: { slug: AUCTION_SLUG },
    update: {
      title: 'Leilões e Cia - Mercedes-Benz 915E Blinfort',
      description: 'Leilão público do tenant Leilões e Cia com o caminhão Mercedes-Benz 915E Blinfort.',
      status: 'ABERTO_PARA_LANCES',
      auctionDate: new Date(now.getTime() - DAY),
      endDate: new Date(now.getTime() + 2 * DAY),
      auctionType: 'EXTRAJUDICIAL',
      auctionMethod: 'STANDARD',
      participation: 'ONLINE',
      tenantId: tenant.id,
      sellerId: seller.id,
      auctioneerId: auctioneer.id,
      onlineUrl: SOURCE_URL,
      documentsUrl: TERMS_URL,
      auctionCertificateUrl: TERMS_URL,
      address: 'Av. Brasil, 14000B - Parada de Lucas/Penha',
      zipCode: '21010-076',
      supportPhone: '551137775942',
      supportEmail: 'leiloes@leiloesecia.com.br',
      supportWhatsApp: '551137775942',
      updatedAt: now,
    },
    create: {
      publicId: 'auction-leiloesecia-124051',
      slug: AUCTION_SLUG,
      title: 'Leilões e Cia - Mercedes-Benz 915E Blinfort',
      description: 'Leilão público do tenant Leilões e Cia com o caminhão Mercedes-Benz 915E Blinfort.',
      status: 'ABERTO_PARA_LANCES',
      auctionDate: new Date(now.getTime() - DAY),
      endDate: new Date(now.getTime() + 2 * DAY),
      auctionType: 'EXTRAJUDICIAL',
      auctionMethod: 'STANDARD',
      participation: 'ONLINE',
      tenantId: tenant.id,
      sellerId: seller.id,
      auctioneerId: auctioneer.id,
      onlineUrl: SOURCE_URL,
      documentsUrl: TERMS_URL,
      auctionCertificateUrl: TERMS_URL,
      address: 'Av. Brasil, 14000B - Parada de Lucas/Penha',
      zipCode: '21010-076',
      supportPhone: '551137775942',
      supportEmail: 'leiloes@leiloesecia.com.br',
      supportWhatsApp: '551137775942',
      updatedAt: now,
    },
  });

  const auctionStage = await ensureAuctionStage(prisma, auction.id, tenant.id, now);

  const lot = await prisma.lot.upsert({
    where: {
      auctionId_number: {
        auctionId: auction.id,
        number: LOT_NUMBER,
      },
    },
    update: {
      publicId: 'lot-leiloesecia-124051',
      slug: 'mercedes-benz-915e-blinfort-124051',
      title: 'MERCEDES-BENZ 915E BLINFORT',
      description: 'Caminhão Mercedes-Benz 915E Blinfort 2021/2021, preto, diesel, câmbio manual, direção hidráulica, chave disponível, procedência de recuperação financeira.',
      type: 'VEICULO',
      status: 'ABERTO_PARA_LANCES',
      price: new Prisma.Decimal('60000.00'),
      initialPrice: new Prisma.Decimal('60000.00'),
      bidIncrementStep: new Prisma.Decimal('3000.00'),
      categoryId: category.id,
      sellerId: seller.id,
      auctioneerId: auctioneer.id,
      cityId: city.id,
      stateId: state.id,
      cityName: city.name,
      stateUf: state.uf,
      mapAddress: 'Av. Brasil, 14000B, Parada de Lucas/Penha, Rio de Janeiro, RJ',
      imageUrl: DEFAULT_GALLERY[0],
      galleryImageUrls: DEFAULT_GALLERY,
      dataAiHint: 'truck',
      condition: 'Blindado / recuperado de financiamento',
      updatedAt: now,
    },
    create: {
      publicId: 'lot-leiloesecia-124051',
      auctionId: auction.id,
      number: LOT_NUMBER,
      slug: 'mercedes-benz-915e-blinfort-124051',
      title: 'MERCEDES-BENZ 915E BLINFORT',
      description: 'Caminhão Mercedes-Benz 915E Blinfort 2021/2021, preto, diesel, câmbio manual, direção hidráulica, chave disponível, procedência de recuperação financeira.',
      type: 'VEICULO',
      status: 'ABERTO_PARA_LANCES',
      price: new Prisma.Decimal('60000.00'),
      initialPrice: new Prisma.Decimal('60000.00'),
      bidIncrementStep: new Prisma.Decimal('3000.00'),
      categoryId: category.id,
      sellerId: seller.id,
      auctioneerId: auctioneer.id,
      cityId: city.id,
      stateId: state.id,
      cityName: city.name,
      stateUf: state.uf,
      mapAddress: 'Av. Brasil, 14000B, Parada de Lucas/Penha, Rio de Janeiro, RJ',
      imageUrl: DEFAULT_GALLERY[0],
      galleryImageUrls: DEFAULT_GALLERY,
      dataAiHint: 'truck',
      condition: 'Blindado / recuperado de financiamento',
      tenantId: tenant.id,
      updatedAt: now,
    },
  });

  const asset = await prisma.asset.upsert({
    where: { publicId: 'asset-leiloesecia-124051' },
    update: {
      title: 'Mercedes-Benz 915E Blinfort',
      description: 'Ativo principal do tenant Leilões e Cia para o leilão Mercedes-Benz 915E Blinfort.',
      status: 'LOTEADO',
      categoryId: category.id,
      sellerId: seller.id,
      lotId: lot.id,
      evaluationValue: new Prisma.Decimal('60000.00'),
      tenantId: tenant.id,
      make: 'Mercedes-Benz',
      model: '915E Blinfort',
      year: 2021,
      modelYear: 2021,
      color: 'Preta',
      fuelType: 'Diesel',
      transmissionType: 'Manual',
      hasKey: true,
      runningCondition: 'Nao informado',
      bodyCondition: 'Conservado',
      locationCity: city.name,
      locationState: state.uf,
      address: 'Av. Brasil, 14000B, Parada de Lucas/Penha, Rio de Janeiro, RJ',
      dataAiHint: 'truck',
      updatedAt: now,
    },
    create: {
      publicId: 'asset-leiloesecia-124051',
      title: 'Mercedes-Benz 915E Blinfort',
      description: 'Ativo principal do tenant Leilões e Cia para o leilão Mercedes-Benz 915E Blinfort.',
      status: 'LOTEADO',
      categoryId: category.id,
      sellerId: seller.id,
      lotId: lot.id,
      evaluationValue: new Prisma.Decimal('60000.00'),
      tenantId: tenant.id,
      make: 'Mercedes-Benz',
      model: '915E Blinfort',
      year: 2021,
      modelYear: 2021,
      color: 'Preta',
      fuelType: 'Diesel',
      transmissionType: 'Manual',
      hasKey: true,
      runningCondition: 'Nao informado',
      bodyCondition: 'Conservado',
      locationCity: city.name,
      locationState: state.uf,
      address: 'Av. Brasil, 14000B, Parada de Lucas/Penha, Rio de Janeiro, RJ',
      dataAiHint: 'truck',
      updatedAt: now,
    },
  });

  await prisma.assetsOnLots.upsert({
    where: { lotId_assetId: { lotId: lot.id, assetId: asset.id } },
    update: {
      assignedBy: 'seed-leiloes-cia',
      tenantId: tenant.id,
    },
    create: {
      lotId: lot.id,
      assetId: asset.id,
      assignedBy: 'seed-leiloes-cia',
      tenantId: tenant.id,
    },
  });

  await prisma.lotStagePrice.upsert({
    where: { lotId_auctionStageId: { lotId: lot.id, auctionStageId: auctionStage.id } },
    update: {
      auctionId: auction.id,
      tenantId: tenant.id,
      initialBid: new Prisma.Decimal('60000.00'),
      bidIncrement: new Prisma.Decimal('3000.00'),
    },
    create: {
      lotId: lot.id,
      auctionId: auction.id,
      auctionStageId: auctionStage.id,
      tenantId: tenant.id,
      initialBid: new Prisma.Decimal('60000.00'),
      bidIncrement: new Prisma.Decimal('3000.00'),
    },
  });

  const lotDocument = await prisma.lotDocument.findFirst({
    where: {
      lotId: lot.id,
      title: 'Condições do Leilão',
    },
  });

  if (lotDocument) {
    await prisma.lotDocument.update({
      where: { id: lotDocument.id },
      data: {
        fileName: 'condicoes-leiloesecia.pdf',
        description: 'Condições e regulamento do evento Leilões e Cia.',
        fileUrl: TERMS_URL,
        isPublic: true,
        updatedAt: now,
        tenantId: tenant.id,
      },
    });
  } else {
    await prisma.lotDocument.create({
      data: {
        lotId: lot.id,
        fileName: 'condicoes-leiloesecia.pdf',
        title: 'Condições do Leilão',
        description: 'Condições e regulamento do evento Leilões e Cia.',
        fileUrl: TERMS_URL,
        isPublic: true,
        tenantId: tenant.id,
        updatedAt: now,
      },
    });
  }

  const lotRisk = await prisma.lotRisk.findFirst({
    where: {
      lotId: lot.id,
      riskType: 'OUTRO',
    },
  });

  if (lotRisk) {
    await prisma.lotRisk.update({
      where: { id: lotRisk.id },
      data: {
        riskLevel: 'ALTO',
        riskDescription: 'Veiculo blindado com validacao documental e regulatoria obrigatoria antes do lance.',
        mitigationStrategy: 'Conferir habilitacao do comprador e validar a documentacao do bem antes de concluir a participacao.',
        verified: false,
        updatedAt: now,
        tenantId: tenant.id,
      },
    });
  } else {
    await prisma.lotRisk.create({
      data: {
        lotId: lot.id,
        riskType: 'OUTRO',
        riskLevel: 'ALTO',
        riskDescription: 'Veiculo blindado com validacao documental e regulatoria obrigatoria antes do lance.',
        mitigationStrategy: 'Conferir habilitacao do comprador e validar a documentacao do bem antes de concluir a participacao.',
        verified: false,
        tenantId: tenant.id,
        updatedAt: now,
      },
    });
  }

  return {
    tenantId: tenant.id,
    auctionId: auction.id,
    auctionStageId: auctionStage.id,
    lotId: lot.id,
    assetId: asset.id,
  };
}