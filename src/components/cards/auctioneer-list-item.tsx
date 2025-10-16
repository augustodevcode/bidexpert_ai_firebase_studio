// src/components/cards/auctioneer-list-item.tsx
'use client';

import * as React from 'react';
import type { AuctioneerProfileInfo } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, MapPin, Edit, Users, Gavel } from 'lucide-react';
import { isValidImageUrl } from '@/lib/ui-helpers';
import EntityEditMenu from '../entity-edit-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface AuctioneerListItemProps {
  auctioneer: AuctioneerProfileInfo;
  onUpdate?: () => void;
}

export default function AuctioneerListItem({ auctioneer, onUpdate }: AuctioneerListItemProps) {
  const displayLocation = auctioneer.city && auctioneer.state ? `${auctioneer.city} - ${auctioneer.state}` : auctioneer.state || auctioneer.city || 'N/A';
  const logoUrl = isValidImageUrl(auctioneer.logoUrl) ? auctioneer.logoUrl! : `https://placehold.co/120x90.png?text=${auctioneer.name.charAt(0)}`;

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg group overflow-hidden">
        <div className="flex items-center p-4 gap-4">
            <Link href={`/auctioneers/${auctioneer.slug || auctioneer.publicId || auctioneer.id}`}>
                <Avatar className="h-20 w-20 border-2">
                    <AvatarImage src={logoUrl} alt={auctioneer.name} data-ai-hint={auctioneer.dataAiHintLogo || 'logo leiloeiro'} />
                    <AvatarFallback>{auctioneer.name.charAt(0)}</AvatarFallback>
                </Avatar>
            </Link>
            <div className="flex-grow">
                 <Link href={`/auctioneers/${auctioneer.slug || auctioneer.publicId || auctioneer.id}`} className="group/link">
                    <h3 className="text-base font-semibold text-foreground group-hover/link:text-primary transition-colors">{auctioneer.name}</h3>
                    <p className="text-sm text-muted-foreground">{auctioneer.registrationNumber || 'Leiloeiro Oficial Credenciado'}</p>
                 </Link>
                 <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1.5">
                    <div className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1 text-primary/80"/> {displayLocation}</div>
                    <div className="flex items-center"><Gavel className="h-3.5 w-3.5 mr-1 text-primary/80"/> {auctioneer.auctionsConductedCount || 0} leilões</div>
                 </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
                <Button asChild size="sm" variant="outline">
                    <Link href={`/auctioneers/${auctioneer.slug || auctioneer.publicId || auctioneer.id}`}><Eye className="mr-2 h-4 w-4"/>Ver Perfil</Link>
                </Button>
                 <EntityEditMenu 
                    entityType="auctioneer"
                    entityId={auctioneer.id}
                    publicId={auctioneer.publicId}
                    currentTitle={auctioneer.name}
                    isFeatured={false} // Placeholder, auctioneers não têm `isFeatured`
                    onUpdate={onUpdate}
                />
            </div>
        </div>
    </Card>
  );
}
