/**
 * Zod schema for AssetsOnLots junction entity (Admin Plus CRUD).
 * Composite key: lotId + assetId.
 */
import { z } from 'zod';

export const assetsOnLotsSchema = z.object({
  lotId: z.string().min(1, 'Lote é obrigatório'),
  assetId: z.string().min(1, 'Ativo é obrigatório'),
  assignedBy: z.string().min(1, 'Atribuído por é obrigatório'),
});
