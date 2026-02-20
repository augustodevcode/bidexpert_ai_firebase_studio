/**
 * Biblioteca de seed de habilitações para leilões.
 * Gera documentos de usuários e vínculos de habilitação em leilões para o tenant informado.
 */
import { PrismaClient } from '@prisma/client';

type UserOnTenantModel = {
  findMany: (args: Record<string, unknown>) => Promise<Array<{ userId: bigint }>>;
};

const REQUIRED_DOCUMENT_TYPES = [
  { name: 'RG', appliesTo: 'BIDDER' },
  { name: 'CPF', appliesTo: 'BIDDER' },
  { name: 'Comprovante de Residência', appliesTo: 'BIDDER' },
  { name: 'Comprovante de Renda', appliesTo: 'BIDDER' },
];

export async function seedHabilitacoes(
  prisma: PrismaClient,
  tenantId: bigint,
  usersOnTenantsModel: UserOnTenantModel
): Promise<void> {
  console.log('📄 Iniciando seed de habilitações e documentos...');

  const auctions = await prisma.auction.findMany({
    where: { tenantId },
    select: { id: true },
    take: 8,
    orderBy: { id: 'desc' },
  });

  if (auctions.length === 0) {
    console.log('⚠️ Nenhum leilão encontrado para criar habilitações.');
    return;
  }

  for (const docType of REQUIRED_DOCUMENT_TYPES) {
    await prisma.documentType.upsert({
      where: { name: docType.name },
      update: { appliesTo: docType.appliesTo, isRequired: true },
      create: {
        name: docType.name,
        appliesTo: docType.appliesTo,
        description: `${docType.name} obrigatório para habilitação em leilão`,
        isRequired: true,
      },
    });
  }

  const allDocumentTypes = await prisma.documentType.findMany({
    where: { appliesTo: 'BIDDER' },
    select: { id: true, name: true },
  });

  const tenantUsers = await usersOnTenantsModel.findMany({
    where: { tenantId },
    select: { userId: true },
    take: 60,
  });

  if (tenantUsers.length === 0) {
    console.log('⚠️ Nenhum usuário associado ao tenant para habilitar.');
    return;
  }

  const userIds = tenantUsers.map(({ userId }) => userId);

  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      email: { not: { contains: 'admin@' } },
    },
    select: { id: true, email: true },
    take: 35,
    orderBy: { id: 'asc' },
  });

  for (const user of users) {
    for (const [index, docType] of allDocumentTypes.entries()) {
      const status = index % 5 === 0 ? 'PENDING_ANALYSIS' : 'APPROVED';

      await prisma.userDocument.upsert({
        where: {
          userId_documentTypeId: {
            userId: user.id,
            documentTypeId: docType.id,
          },
        },
        update: {
          status,
          fileName: `${docType.name.toLowerCase().replace(/\s+/g, '-')}-${user.id}.pdf`,
          fileUrl: `https://cdn.bidexpert.local/documents/${user.id}/${docType.name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
          rejectionReason: status === 'PENDING_ANALYSIS' ? null : null,
        },
        create: {
          userId: user.id,
          documentTypeId: docType.id,
          tenantId,
          status,
          fileName: `${docType.name.toLowerCase().replace(/\s+/g, '-')}-${user.id}.pdf`,
          fileUrl: `https://cdn.bidexpert.local/documents/${user.id}/${docType.name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
          updatedAt: new Date(),
        },
      });
    }
  }

  let habilitacoesCriadas = 0;

  for (const auction of auctions) {
    for (const user of users) {
      await prisma.auctionHabilitation.upsert({
        where: {
          userId_auctionId: {
            userId: user.id,
            auctionId: auction.id,
          },
        },
        update: { tenantId },
        create: {
          userId: user.id,
          auctionId: auction.id,
          tenantId,
        },
      });
      habilitacoesCriadas += 1;
    }
  }

  console.log(`✅ Habilitações processadas: ${habilitacoesCriadas}`);
  console.log(`✅ Usuários processados para documentos: ${users.length}`);
}
