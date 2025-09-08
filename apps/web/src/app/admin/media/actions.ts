
// src/app/admin/media/actions.ts
'use server';

import type { MediaItem } from '@bidexpert/core';
import { MediaService } from '@bidexpert/services';
import { createCrudActions } from '@/lib/actions/create-crud-actions';

const mediaService = new MediaService();
const {
  obterTodos: getMediaItems,
  criar: createMediaItem,
  excluir: deleteMediaItem,
} = createCrudActions({
  service: mediaService,
  entityName: 'MediaItem',
  entityNamePlural: 'MediaItems',
  routeBase: '/admin/media',
});

export { getMediaItems, createMediaItem, deleteMediaItem };


// Custom actions that don't fit the CRUD pattern
export async function updateMediaItemMetadata(
    id: string,
    metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>
): Promise<{ success: boolean; message: string }> {
  return mediaService.updateMediaItemMetadata(id, metadata);
}
