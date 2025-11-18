// scripts/enrich-lot-v2-data.ts
/**
 * Script to enrich lot data for V2 lot detail page:
 * - Populate missing lot address, city, state, evaluationValue from assets or generate
 * - Add random gallery images (3-5 images per lot using Unsplash)
 * - Create random questions and reviews for lots
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';

const prisma = new PrismaClient();

const unsplashImageUrls = [
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
  'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
];

const questionExamples = [
  'Qual é o estado de conservação do imóvel?',
  'Este lote possui documentação regularizada?',
  'Há débitos condominiais pendentes?',
  'O imóvel está ocupado?',
  'Qual o valor aproximado do IPTU anual?',
  'Aceita visita ao local antes do leilão?',
  'Há possibilidade de financiamento?',
  'Qual o prazo para desocupação após arrematação?',
  'O imóvel possui ônus ou gravames?',
  'Há necessidade de reformas estruturais?',
];

const answerExamples = [
  'O imóvel está em bom estado de conservação, conforme laudo técnico anexo.',
  'Sim, toda a documentação está regularizada e disponível para consulta.',
  'Não há débitos condominiais pendentes. Certidão disponível nos documentos.',
  'O imóvel está desocupado e disponível para visitação mediante agendamento.',
  'O valor do IPTU anual é de aproximadamente R$ 2.500,00.',
  'Sim, visitas são permitidas mediante agendamento prévio de 48h.',
  'Financiamento pode ser realizado após a arrematação, junto à instituição de sua preferência.',
  'O prazo é de 30 dias corridos após homologação da arrematação.',
  'Não há ônus ou gravames registrados no imóvel.',
  'Pequenas reformas cosméticas podem ser necessárias, mas não há problemas estruturais.',
];

const reviewComments = [
  'Excelente oportunidade! Recomendo a visita presencial antes do lance.',
  'Imóvel bem localizado e com boa documentação.',
  'Preço inicial muito atraente para a região.',
  'Acompanhei o leilão anterior deste lote, vale a pena.',
  'Ótimo estado de conservação conforme fotos.',
  'Localização privilegiada próxima ao centro.',
  'Documentação muito bem organizada, parabéns ao leiloeiro.',
  'Imóvel com grande potencial de valorização.',
];

async function enrichLots() {
  console.log('🔄 Starting lot data enrichment...\n');

  const lots = await prisma.lot.findMany({
    where: {
      status: { notIn: ['RASCUNHO', 'CANCELADO'] },
    },
    include: {
      assets: {
        include: { asset: true },
      },
      auction: true,
    },
    take: 20, // Limit to first 20 lots for performance
  });

  console.log(`📦 Found ${lots.length} lots to enrich\n`);

  for (const lot of lots) {
    const updates: any = {};
    let updated = false;

    // 1. Enrich address/city/state from first asset if missing
    const firstAsset = lot.assets?.[0]?.asset;
    
    if (!lot.mapAddress && firstAsset?.address) {
      updates.mapAddress = firstAsset.address;
      updated = true;
      console.log(`  ✓ Added mapAddress from asset: ${firstAsset.address.substring(0, 40)}...`);
    } else if (!lot.mapAddress) {
      updates.mapAddress = faker.location.streetAddress(true);
      updated = true;
      console.log(`  ✓ Generated mapAddress: ${updates.mapAddress}`);
    }

    if (!lot.cityName && firstAsset?.locationCity) {
      updates.cityName = firstAsset.locationCity;
      updated = true;
      console.log(`  ✓ Added cityName from asset: ${firstAsset.locationCity}`);
    } else if (!lot.cityName) {
      updates.cityName = faker.location.city();
      updated = true;
      console.log(`  ✓ Generated cityName: ${updates.cityName}`);
    }

    if (!lot.stateUf && firstAsset?.locationState) {
      updates.stateUf = firstAsset.locationState;
      updated = true;
      console.log(`  ✓ Added stateUf from asset: ${firstAsset.locationState}`);
    } else if (!lot.stateUf) {
      const states = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'GO'];
      updates.stateUf = faker.helpers.arrayElement(states);
      updated = true;
      console.log(`  ✓ Generated stateUf: ${updates.stateUf}`);
    }

    // 2. Enrich evaluationValue from asset if missing - NOTE: evaluationValue is not on Lot model
    // It's calculated from assets, so we skip this update
    // if ((!lot.evaluationValue || lot.evaluationValue === 0) && firstAsset?.evaluationValue) {
    //   updates.evaluationValue = firstAsset.evaluationValue;
    //   updated = true;
    //   console.log(`  ✓ Added evaluationValue from asset: R$ ${firstAsset.evaluationValue}`);
    // }

    // 3. Add gallery images (3-5 random images)
    const currentGallery = lot.galleryImageUrls ? (Array.isArray(lot.galleryImageUrls) ? lot.galleryImageUrls : []) : [];
    if (currentGallery.length < 3) {
      const imageCount = faker.number.int({ min: 3, max: 5 });
      const newGallery = faker.helpers.arrayElements(unsplashImageUrls, imageCount);
      updates.galleryImageUrls = newGallery;
      updated = true;
      console.log(`  ✓ Added ${imageCount} gallery images`);
    }

    // 4. Update imageUrl if missing
    if (!lot.imageUrl) {
      updates.imageUrl = faker.helpers.arrayElement(unsplashImageUrls);
      updated = true;
      console.log(`  ✓ Added main imageUrl`);
    }

    // Update lot if needed
    if (updated) {
      await prisma.lot.update({
        where: { id: lot.id },
        data: updates,
      });
      console.log(`✅ Updated lot ${lot.publicId || lot.id} (${lot.title})\n`);
    }

    // 5. Add random questions (2-4 per lot)
    const existingQuestions = await prisma.lotQuestion.count({
      where: { lotId: lot.id },
    });

    if (existingQuestions < 2) {
      const questionCount = faker.number.int({ min: 2, max: 4 });
      const users = await prisma.user.findMany({ take: 5 });
      
      if (users.length > 0) {
        for (let i = 0; i < questionCount; i++) {
          const user = faker.helpers.arrayElement(users);
          const questionText = faker.helpers.arrayElement(questionExamples);
          const shouldAnswer = faker.datatype.boolean(0.7); // 70% chance of being answered
          
          await prisma.lotQuestion.create({
            data: {
              lotId: lot.id,
              auctionId: lot.auctionId,
              userId: user.id,
              userDisplayName: user.fullName || user.email,
              questionText,
              answerText: shouldAnswer ? faker.helpers.arrayElement(answerExamples) : null,
              answeredAt: shouldAnswer ? faker.date.recent({ days: 10 }) : null,
              answeredByUserId: shouldAnswer ? user.id : null,
              answeredByUserDisplayName: shouldAnswer ? 'Leiloeiro Oficial' : null,
              isPublic: true,
              createdAt: faker.date.recent({ days: 30 }),
            },
          });
        }
        console.log(`  ✓ Added ${questionCount} questions to lot ${lot.publicId || lot.id}`);
      }
    }

    // 6. Add random reviews (1-3 per lot)
    const existingReviews = await prisma.review.count({
      where: { lotId: lot.id },
    });

    if (existingReviews < 1) {
      const reviewCount = faker.number.int({ min: 1, max: 3 });
      const users = await prisma.user.findMany({ take: 5 });
      
      if (users.length > 0) {
        for (let i = 0; i < reviewCount; i++) {
          const user = faker.helpers.arrayElement(users);
          
          await prisma.review.create({
            data: {
              lotId: lot.id,
              auctionId: lot.auctionId,
              userId: user.id,
              userDisplayName: user.fullName || user.email,
              rating: faker.number.int({ min: 3, max: 5 }),
              comment: faker.helpers.arrayElement(reviewComments),
              createdAt: faker.date.recent({ days: 30 }),
            },
          });
        }
        console.log(`  ✓ Added ${reviewCount} reviews to lot ${lot.publicId || lot.id}\n`);
      }
    }
  }

  console.log('✅ Lot data enrichment completed successfully!');
}

enrichLots()
  .catch((e) => {
    console.error('❌ Error enriching lots:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
