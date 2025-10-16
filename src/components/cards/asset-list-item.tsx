// src/components/cards/asset-list-item.tsx
'use client';

import * as React from 'react';
import type { Asset } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MapPin, Tag, Building, FileText, Edit, Link2 } from 'lucide-react';
import { isValidImageUrl } from '@/lib/ui-helpers';

interface AssetListItemProps {
  asset: Asset;
  onUpdate?: () => void;
}

export default function AssetListItem({ asset, onUpdate }: AssetListItemProps) {
  const editUrl = `/admin/assets/${asset.id}/edit`;
  const mainImageUrl = isValidImageUrl(asset.imageUrl) ? asset.imageUrl! : `https://placehold.co/120x90.png?text=Ativo`;

  const getStatusVariant = (status: Asset['status']) => {
    switch (status) {
        case 'DISPONIVEL': return 'secondary';
        case 'LOTEADO': return 'default';
        case 'VENDIDO': return 'outline';
        case 'REMOVIDO':
        case 'INATIVADO': 
            return 'destructive';
        default: return 'secondary';
    }
  }

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg group overflow-hidden">
        <div className="flex items-center p-4 gap-4">
            <Link href={editUrl} className="flex-shrink-0">
                <div className="relative w-24 h-24 bg-muted rounded-md overflow-hidden">
                    <Image
                        src={mainImageUrl}
                        alt={asset.title}
                        fill
                        className="object-cover"
                        data-ai-hint={asset.dataAiHint || 'imagem ativo lista'}
                    />
                </div>
            </Link>
            <div className="flex-grow">
                 <div className="flex items-center gap-2 mb-1">
                     <Badge variant={getStatusVariant(asset.status)}>{asset.status}</Badge>
                 </div>
                 <Link href={editUrl} className="group/link">
                    <h3 className="text-base font-semibold text-foreground group-hover/link:text-primary transition-colors">{asset.title}</h3>
                 </Link>
                 <p className="text-xs text-muted-foreground mt-0.5" title={`ID: ${asset.publicId || asset.id}`}>
                    ID: {asset.publicId || asset.id}
                </p>
                 <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1.5">
                    <div className="flex items-center"><Tag className="h-3.5 w-3.5 mr-1 text-primary/80"/> {asset.categoryName || 'N/A'}</div>
                    <div className="flex items-center"><Building className="h-3.5 w-3.5 mr-1 text-primary/80"/> {asset.sellerName || 'N/A'}</div>
                     {asset.judicialProcessNumber && (
                        <div className="flex items-center"><FileText className="h-3.5 w-3.5 mr-1 text-primary/80"/> {asset.judicialProcessNumber}</div>
                     )}
                     {asset.lotInfo && (
                        <div className="flex items-center"><Link2 className="h-3.5 w-3.5 mr-1 text-primary/80"/> {asset.lotInfo}</div>
                     )}
                 </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
                <Button asChild size="sm" variant="outline">
                    <Link href={editUrl}><Edit className="mr-2 h-4 w-4"/>Gerenciar</Link>
                </Button>
            </div>
        </div>
    </Card>
  );
}
