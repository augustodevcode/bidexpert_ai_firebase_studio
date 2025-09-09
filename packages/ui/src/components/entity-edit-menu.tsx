// packages/ui/src/components/entity-edit-menu.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Pencil, Image as ImageIcon, TextCursorInput, Star, Trash2, ExternalLink } from 'lucide-react';
import type { MediaItem } from '@bidexpert/core';
import Link from 'next/link';
import UpdateTitleModal from './update-title-modal';

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
  const router = useRouter();
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const hasEditPermission = true; // Temporarily set to true

  if (!hasEditPermission) {
    return null;
  }

  const handleToggleFeatured = async () => {
    // Removed action call
    console.log("Toggle featured clicked");
  };

  const handleTitleUpdate = async (newTitle: string) => {
    // Removed action call
    console.log("Title update clicked");
    setIsTitleModalOpen(false);
  };
  
   const handleImageUpdate = async (selectedItems: Partial<MediaItem>[]) => {
    // Removed action call
    console.log("Image update clicked");
  };


  const adminEditUrl = `/admin/${entityType}s/${entityId}/edit`;

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
            <span>Editar Imagem Principal</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsTitleModalOpen(true)}>
            <TextCursorInput className="mr-2 h-4 w-4" />
            <span>Alterar Título</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleFeatured}>
            <Star className="mr-2 h-4 w-4" />
            <span>{isFeatured ? 'Remover Destaque' : 'Destacar no Marketplace'}</span>
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
      
      {/* Removed ChooseMediaDialog */}
    </>
  );
}