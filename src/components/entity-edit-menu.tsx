
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil, Image as ImageIcon, TextCursorInput, Star, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { hasPermission } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';
import { updateLotFeaturedStatus, updateLotTitle } from '@/app/admin/lots/actions';
import { updateAuctionFeaturedStatus, updateAuctionTitle } from '@/app/admin/auctions/actions';
import UpdateTitleModal from './update-title-modal';
import ChooseMediaDialog from './admin/media/choose-media-dialog';
import type { MediaItem } from '@/types';
import Link from 'next/link';

interface EntityEditMenuProps {
  entityType: 'lot' | 'auction';
  entityId: string;
  publicId: string;
  currentTitle: string;
  isFeatured: boolean;
  onUpdate?: () => void;
}

export default function EntityEditMenu({
  entityType,
  entityId,
  publicId,
  currentTitle,
  isFeatured,
  onUpdate,
}: EntityEditMenuProps) {
  const { userProfileWithPermissions } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // For now, only full admins can use this quick-edit menu.
  // This could be expanded later to check for specific ownership (e.g., lot.sellerId === user.id)
  const hasEditPermission = hasPermission(userProfileWithPermissions, 'manage_all');

  if (!hasEditPermission) {
    return null;
  }

  const handleToggleFeatured = async () => {
    const newStatus = !isFeatured;
    let result;
    if (entityType === 'lot') {
      result = await updateLotFeaturedStatus(publicId || entityId, newStatus);
    } else {
      result = await updateAuctionFeaturedStatus(publicId || entityId, newStatus);
    }

    if (result.success) {
      toast({ title: 'Sucesso!', description: result.message });
      router.refresh();
      onUpdate?.(); // Trigger a refresh if the parent component provided a callback
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive' });
    }
  };

  const handleTitleUpdate = async (newTitle: string) => {
    let result;
    if (entityType === 'lot') {
      result = await updateLotTitle(publicId || entityId, newTitle);
    } else {
      result = await updateAuctionTitle(publicId || entityId, newTitle);
    }
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Título atualizado com sucesso.' });
      setIsTitleModalOpen(false);
      router.refresh();
      onUpdate?.();
    } else {
      toast({ title: 'Erro ao Atualizar Título', description: result.message, variant: 'destructive' });
    }
  };
  
   const handleImageUpdate = (selectedItems: Partial<MediaItem>[]) => {
    if (selectedItems.length > 0 && selectedItems[0].urlOriginal) {
        // Here you would call a server action like `updateLotImage(entityId, selectedItems[0].urlOriginal)`
        toast({ title: "Imagem Atualizada (Simulação)", description: `A imagem d${entityType === 'lot' ? 'o lote' : 'o leilão'} foi atualizada.` });
        router.refresh();
        onUpdate?.();
    }
  };


  const adminEditUrl = `/admin/${entityType}s/${publicId || entityId}/edit`;

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 hover:bg-primary/10" aria-label="Editar Entidade">
                <Pencil className="h-3.5 w-3.5 text-primary" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent><p>Opções de Edição</p></TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Edição Rápida</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsMediaModalOpen(true)}>
            <ImageIcon className="mr-2 h-4 w-4" />
            <span>Editar Imagem</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsTitleModalOpen(true)}>
            <TextCursorInput className="mr-2 h-4 w-4" />
            <span>Alterar Título</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleFeatured}>
            <Star className="mr-2 h-4 w-4" />
            <span>{isFeatured ? 'Tirar Destaque' : 'Destacar'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={adminEditUrl}>
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>Edição Completa</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UpdateTitleModal
        isOpen={isTitleModalOpen}
        onClose={() => setIsTitleModalOpen(false)}
        onSubmit={handleTitleUpdate}
        currentTitle={currentTitle}
        entityTypeLabel={entityType === 'lot' ? 'Lote' : 'Leilão'}
      />
      
      <ChooseMediaDialog
        isOpen={isMediaModalOpen}
        onOpenChange={setIsMediaModalOpen}
        onMediaSelect={handleImageUpdate}
        allowMultiple={false}
      />
    </>
  );
}
