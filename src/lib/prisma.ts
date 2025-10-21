import { PrismaClient } from '@prisma/client';
import { BusinessCodeService } from '@/services/business-code.service';

// Evita múltiplas instâncias do PrismaClient em desenvolvimento
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

const businessCodeService = new BusinessCodeService();

prisma.$use(async (params, next) => {
  const entitiesToGenerateCode = ['Auction', 'Lot', 'Seller', 'Auctioneer', 'Asset', 'LotCategory', 'Subcategory'];

  if (params.action === 'create' && entitiesToGenerateCode.includes(params.model!)) {
    // Assuming tenantId is available in the context or params.args.data
    // For simplicity, let's assume tenantId is directly in params.args.data for now.
    // A more robust solution might involve passing tenantId through a context.
    const tenantId = params.args.data.tenantId || params.args.data.tenants?.create[0]?.tenant.connect.id || '1'; // Default to '1' for landlord or if not present

    if (!params.args.data.codigo) {
      const entityType = params.model!.toLowerCase() as Parameters<typeof businessCodeService.generateNextCode>[0];
      params.args.data.codigo = await businessCodeService.generateNextCode(entityType, tenantId);
    }
  }

  return next(params);
});
