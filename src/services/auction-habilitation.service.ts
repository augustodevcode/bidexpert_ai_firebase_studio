// src/services/auction-habilitation.service.ts
import { AuctionHabilitationRepository } from '@/repositories/auction-habilitation.repository';
import type { Prisma, AuctionHabilitation } from '@prisma/client';

export class AuctionHabilitationService {
  private repository: AuctionHabilitationRepository;

  constructor() {
    this.repository = new AuctionHabilitationRepository();
  }

  async upsertAuctionHabilitation(data: Prisma.AuctionHabilitationCreateInput): Promise<AuctionHabilitation> {
    return this.repository.upsert(data);
  }
}
