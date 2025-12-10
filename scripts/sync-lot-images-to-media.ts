
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando sincronização de imagens de TODOS os lotes para a Biblioteca de Mídia...');

  // 1. Identificar o Tenant
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error('❌ Nenhum tenant encontrado.');
    return;
  }
  const tenantId = tenant.id;
  console.log(`🏢 Tenant identificado: ${tenantId}`);

  // 2. Identificar um usuário Admin
  const uploader = await prisma.user.findFirst({
    where: { roles: { some: { role: { name: 'ADMIN' } } } }
  });
  
  if (!uploader) {
    console.error('❌ Nenhum usuário admin encontrado para atribuir o upload.');
    return;
  }
  const uploaderId = uploader.id;
  console.log(`👤 Uploader identificado: ${uploader.email} (${uploaderId})`);

  // 3. Buscar todos os lotes que precisam de correção
  const lotsToFix = await prisma.lot.findMany({
    where: {
      AND: [
        {
          OR: [
            { imageUrl: { not: null } },
            { galleryImageUrls: { not: Prisma.JsonNull } }
          ]
        },
        // Opcional: filtrar apenas os que não têm mediaItemIds se quiser ser mais eficiente,
        // mas rodar em todos garante que nada foi perdido.
        // {
        //   OR: [
        //     { mediaItemIds: { equals: Prisma.JsonNull } },
        //     { mediaItemIds: { equals: [] } },
        //     { imageMediaId: null }
        //   ]
        // }
      ]
    }
  });

  console.log(`📦 Encontrados ${lotsToFix.length} lotes com imagens para verificar.`);

  for (const lot of lotsToFix) {
    console.log(`   > Processando lote: ${lot.title} (${lot.publicId})`);

    const urlsToProcess: string[] = [];
    if (lot.imageUrl) urlsToProcess.push(lot.imageUrl);
    if (lot.galleryImageUrls && Array.isArray(lot.galleryImageUrls)) {
      urlsToProcess.push(...(lot.galleryImageUrls as string[]));
    }

    // Remover duplicatas
    const uniqueUrls = [...new Set(urlsToProcess)];
    if (uniqueUrls.length === 0) {
        console.log('      ⚠️ Sem URLs válidas.');
        continue;
    }
    
    // console.log(`      📸 Encontradas ${uniqueUrls.length} URLs únicas.`);

    const mediaIds: bigint[] = [];

    for (const url of uniqueUrls) {
      // Verificar se já existe na Media Library
      let mediaItem = await prisma.mediaItem.findFirst({
        where: { urlOriginal: url }
      });

      if (mediaItem) {
        // console.log(`      ✅ Mídia já existe: ${mediaItem.id}`);
        mediaIds.push(mediaItem.id);
        
        // Atualizar linkedLotIds se necessário (lógica simplificada: apenas garantir que existe)
        // Para fazer direito, teríamos que ler, parsear, adicionar e salvar.
        // Vamos pular por enquanto para focar na criação.
      } else {
        console.log(`      ➕ Criando nova mídia para: ${url}`);
        
        let fileName = 'image.jpg';
        try {
          const urlObj = new URL(url);
          const pathname = urlObj.pathname;
          const parts = pathname.split('/');
          const lastPart = parts[parts.length - 1];
          if (lastPart && lastPart.length < 100) {
              fileName = lastPart;
          }
        } catch (e) {
          // URL inválida
        }

        mediaItem = await prisma.mediaItem.create({
          data: {
            fileName: fileName,
            storagePath: url,
            urlOriginal: url,
            urlThumbnail: url,
            urlMedium: url,
            urlLarge: url,
            mimeType: 'image/jpeg',
            sizeBytes: 0,
            altText: `Imagem do lote ${lot.title}`,
            title: fileName,
            dataAiHint: 'lot-image',
            uploadedByUserId: uploaderId,
            tenantId: tenantId,
            linkedLotIds: [Number(lot.id)]
          }
        });
        mediaIds.push(mediaItem.id);
        console.log(`         ✨ Criado com ID: ${mediaItem.id}`);
      }
    }

    // 4. Atualizar o lote com os IDs das mídias
    if (mediaIds.length > 0) {
      // Verificar se precisa atualizar (se os IDs forem diferentes)
      // Simplificação: sempre atualiza para garantir sincronia
      await prisma.lot.update({
        where: { id: lot.id },
        data: {
          mediaItemIds: mediaIds.map(id => id.toString()),
          imageMediaId: mediaIds[0]
        }
      });
      // console.log('      ✅ Lote atualizado.');
    }
  }
  
  console.log('🏁 Sincronização concluída!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
