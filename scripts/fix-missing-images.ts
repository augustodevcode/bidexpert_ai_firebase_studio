
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Iniciando correção de imagens faltantes...');

  // 1. Identificar o Tenant (assumindo ID 1 ou pegando o primeiro)
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error('❌ Nenhum tenant encontrado.');
    return;
  }
  const tenantId = tenant.id;

  // 2. Identificar um usuário para ser o "uploader" (Admin ou Leiloeiro)
  const uploader = await prisma.user.findFirst({
    where: { roles: { some: { role: { name: 'ADMIN' } } } }
  });
  const uploaderId = uploader?.id;

  // Helper para criar MediaItem
  const createMediaItem = async (
    entityType: 'auction' | 'lot' | 'asset',
    identifier: string,
    variant: number,
    overrides: any = {}
  ) => {
    const safeIdentifier = identifier || `${entityType}-${Date.now()}`;
    const seed = `${safeIdentifier}-${variant}`;
    const encodedSeed = encodeURIComponent(seed);
    
    return prisma.mediaItem.create({
      data: {
        fileName: `${seed}.jpg`,
        storagePath: `media-fix/${entityType}/${safeIdentifier}/${seed}.jpg`,
        urlOriginal: `https://picsum.photos/seed/${encodedSeed}/1600/900`,
        urlThumbnail: `https://picsum.photos/seed/${encodedSeed}/600/338`,
        urlMedium: `https://picsum.photos/seed/${encodedSeed}/1024/768`,
        urlLarge: `https://picsum.photos/seed/${encodedSeed}/1920/1080`,
        mimeType: 'image/jpeg',
        sizeBytes: 100000 + Math.floor(Math.random() * 100000),
        altText: `Imagem ${variant} de ${entityType}`,
        title: `${entityType} ${safeIdentifier} - ${variant}`,
        dataAiHint: entityType,
        uploadedByUserId: uploaderId,
        tenantId: tenantId,
        ...overrides
      }
    });
  };

  // 3. Corrigir Lote Específico (se solicitado) ou todos sem imagem
  // O usuário pediu especificamente: lot-1764169048835-002
  const targetPublicId = 'lot-1764169048835-002';
  
  const lotsToFix = await prisma.lot.findMany({
    where: {
      OR: [
        { publicId: targetPublicId },
        { imageMediaId: null },
        { imageUrl: null }
      ]
    }
  });

  console.log(`📦 Encontrados ${lotsToFix.length} lotes para corrigir imagens.`);

  for (const lot of lotsToFix) {
    console.log(`   > Processando lote: ${lot.title} (${lot.publicId})`);
    
    const imageCount = 3;
    const galleryUrls: string[] = [];
    const mediaIds: bigint[] = [];

    for (let i = 1; i <= imageCount; i++) {
      const media = await createMediaItem('lot', lot.publicId || `lot-${lot.id}`, i, {
        linkedLotIds: [lot.id]
      });
      galleryUrls.push(media.urlOriginal);
      mediaIds.push(media.id);
    }

    await prisma.lot.update({
      where: { id: lot.id },
      data: {
        imageUrl: galleryUrls[0],
        galleryImageUrls: galleryUrls,
        mediaItemIds: mediaIds,
        imageMediaId: mediaIds[0]
      }
    });
  }

  // 4. Corrigir Auctions sem imagem
  const auctionsToFix = await prisma.auction.findMany({
    where: { imageMediaId: null }
  });
  
  console.log(`🔨 Encontrados ${auctionsToFix.length} leilões para corrigir imagens.`);
  
  for (const auction of auctionsToFix) {
     console.log(`   > Processando leilão: ${auction.title}`);
     const media = await createMediaItem('auction', auction.publicId || `auction-${auction.id}`, 1);
     
     await prisma.auction.update({
       where: { id: auction.id },
       data: { imageMediaId: media.id }
     });
  }

  // 5. Corrigir Assets sem imagem
  const assetsToFix = await prisma.asset.findMany({
    where: { imageMediaId: null }
  });

  console.log(`🏛️ Encontrados ${assetsToFix.length} assets para corrigir imagens.`);

  for (const asset of assetsToFix) {
    console.log(`   > Processando asset: ${asset.title}`);
    const imageCount = 2;
    const galleryUrls: string[] = [];
    const mediaIds: bigint[] = [];

    for (let i = 1; i <= imageCount; i++) {
      const media = await createMediaItem('asset', asset.publicId || `asset-${asset.id}`, i, {
        judicialProcessId: asset.judicialProcessId ?? undefined
      });
      
      galleryUrls.push(media.urlOriginal);
      mediaIds.push(media.id);

      // Criar AssetMedia
      await prisma.assetMedia.create({
        data: {
          assetId: asset.id,
          mediaItemId: media.id,
          tenantId: tenantId,
          displayOrder: i - 1,
          isPrimary: i === 1
        }
      });
    }

    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        imageUrl: galleryUrls[0],
        galleryImageUrls: galleryUrls,
        mediaItemIds: mediaIds,
        imageMediaId: mediaIds[0]
      }
    });
  }

  console.log('✅ Correção concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
