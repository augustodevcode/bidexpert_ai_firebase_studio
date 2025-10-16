// src/components/cards/asset-card.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Asset } from '@/types';
import { Eye, Edit, Package, Tag, Building, FileText } from 'lucide-react';
import { isValidImageUrl } from '@/lib/ui-helpers';

interface AssetCardProps {
  asset: Asset;
  onUpdate?: () => void;
}

export default function AssetCard({ asset, onUpdate }: AssetCardProps) {
  const editUrl = `/admin/assets/${asset.id}/edit`;
  const mainImageUrl = isValidImageUrl(asset.imageUrl) ? asset.imageUrl! : `https://placehold.co/600x400.png?text=Ativo`;

  const getStatusVariant = (status: Asset['status']) => {
    switch (status) {
        case 'DISPONIVEL': return 'bg-green-600 text-white';
        case 'LOTEADO': return 'bg-blue-600 text-white';
        case 'VENDIDO': return 'bg-gray-600 text-white';
        case 'REMOVIDO':
        case 'INATIVADO': 
            return 'bg-destructive text-white';
        default: return 'bg-secondary text-secondary-foreground';
    }
  }

  return (
    <Card data-ai-id={`asset-card-${asset.id}`} className="flex flex-col overflow-hidden h-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group">
      <div className="relative">
        <Link href={editUrl}>
          <div className="aspect-video relative bg-muted">
            <Image
              src={mainImageUrl}
              alt={asset.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint={asset.dataAiHint || 'imagem ativo'}
            />
          </div>
        </Link>
        <div className="absolute top-2 left-2 z-10">
          <Badge className={`text-xs px-2 py-1 ${getStatusVariant(asset.status)}`}>
            {asset.status}
          </Badge>
        </div>
      </div>

      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm font-semibold hover:text-primary transition-colors leading-tight min-h-[2.2em] line-clamp-2">
          <Link href={editUrl}>{asset.title}</Link>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-3 pt-0 flex-grow space-y-1 text-xs text-muted-foreground">
         <div className="flex items-center gap-1.5" title="Categoria">
            <Tag className="h-3 w-3" />
            <span>{asset.categoryName || 'Não especificada'}</span>
        </div>
         <div className="flex items-center gap-1.5" title="Comitente">
            <Building className="h-3 w-3" />
            <span>{asset.sellerName || 'Não informado'}</span>
        </div>
         <div className="flex items-center gap-1.5" title="Processo Judicial">
            <FileText className="h-3 w-3" />
            <span className="truncate">{asset.judicialProcessNumber || 'N/A'}</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-3 border-t flex flex-col items-start space-y-1.5">
          {asset.evaluationValue && (
            <div className="w-full">
                <p className="text-xs text-muted-foreground">Valor de Avaliação</p>
                <p className="text-lg font-bold text-primary">
                R$ {asset.evaluationValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
            </div>
          )}
          <Button asChild className="w-full mt-2" size="sm">
            <Link href={editUrl}><Edit className="mr-2 h-4 w-4"/> Gerenciar Ativo</Link>
          </Button>
      </CardFooter>
    </Card>
  );
}
