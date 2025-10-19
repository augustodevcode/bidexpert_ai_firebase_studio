// src/services/user-lot-max-bid.service.ts
import { UserLotMaxBidRepository } from '@/repositories/user-lot-max-bid.repository';
import type { Prisma, UserLotMaxBid } from '@prisma/client';

export class UserLotMaxBidService {
  private repository: UserLotMaxBidRepository;

  constructor() {
    this.repository = new UserLotMaxBidRepository();
  }

  async createOrUpdateUserLotMaxBid(data: Prisma.UserLotMaxBidCreateInput): Promise<UserLotMaxBid> {
    return this.repository.upsert(data);
  }
}
