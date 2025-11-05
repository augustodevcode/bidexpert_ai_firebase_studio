import { MediaItemRepository } from '@/repositories/media-item.repository';
import type { Prisma } from '@prisma/client';

export class MediaItemService {
  private repository: MediaItemRepository;

  constructor() {
    this.repository = new MediaItemRepository();
  }

  async createMediaItem(data: Prisma.MediaItemCreateInput) {
    try {
      const newMediaItem = await this.repository.create(data);
      return { success: true, message: 'Item de mídia criado com sucesso.', mediaItem: newMediaItem };
    } catch (error: any) {
      console.error('Error creating media item:', error);
      return { success: false, message: `Falha ao criar item de mídia: ${error.message}` };
    }
  }

  async getMediaItemById(id: bigint) {
    return this.repository.findById(id);
  }

  async getMediaItems(args?: Prisma.MediaItemFindManyArgs) {
    return this.repository.findMany(args);
  }

  async updateMediaItem(id: bigint, data: Prisma.MediaItemUpdateInput) {
    try {
      const updatedMediaItem = await this.repository.update(id, data);
      return { success: true, message: 'Item de mídia atualizado com sucesso.', mediaItem: updatedMediaItem };
    } catch (error: any) {
      console.error('Error updating media item:', error);
      return { success: false, message: `Falha ao atualizar item de mídia: ${error.message}` };
    }
  }

  async deleteMediaItem(id: bigint) {
    try {
      await this.repository.delete(id);
      return { success: true, message: 'Item de mídia excluído com sucesso.' };
    } catch (error: any) {
      console.error('Error deleting media item:', error);
      return { success: false, message: `Falha ao excluir item de mídia: ${error.message}` };
    }
  }
}