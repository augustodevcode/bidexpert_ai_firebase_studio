
import { MediaItemRepository } from '@/repositories/media-item.repository';
import type { Prisma } from '@prisma/client';

export class MediaItemService {
  private repository: MediaItemRepository;

  constructor() {
    this.repository = new MediaItemRepository();
  }

  async createMediaItem(data: Omit<Prisma.MediaItemCreateInput, 'user'> & { userId: string }) {
    try {
      const { userId, ...restOfData } = data;
      const createData: Prisma.MediaItemCreateInput = {
        ...restOfData,
        uploadedBy: { connect: { id: BigInt(userId) } },
      };
      const newMediaItem = await this.repository.create(createData);
      return { success: true, message: 'Item de mídia criado com sucesso.', mediaItem: newMediaItem };
    } catch (error: any) {
      console.error('Error creating media item:', error);
      return { success: false, message: `Falha ao criar item de mídia: ${error.message}` };
    }
  }

  async getMediaItemById(id: string) {
    return this.repository.findById(BigInt(id));
  }

  async getMediaItems(args?: Prisma.MediaItemFindManyArgs) {
    return this.repository.findMany(args);
  }

  async updateMediaItem(id: string, data: Prisma.MediaItemUpdateInput) {
    try {
      const updatedMediaItem = await this.repository.update(BigInt(id), data);
      return { success: true, message: 'Item de mídia atualizado com sucesso.', mediaItem: updatedMediaItem };
    } catch (error: any) {
      console.error('Error updating media item:', error);
      return { success: false, message: `Falha ao atualizar item de mídia: ${error.message}` };
    }
  }

  async deleteMediaItem(id: string) {
    try {
      await this.repository.delete(BigInt(id));
      return { success: true, message: 'Item de mídia excluído com sucesso.' };
    } catch (error: any) {
      console.error('Error deleting media item:', error);
      return { success: false, message: `Falha ao excluir item de mídia: ${error.message}` };
    }
  }
}
