// src/components/cards/seller-list-item.tsx
'use client';

import * as React from 'react';
import type { SellerProfileInfo } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, MapPin, Edit, Users, Gavel, Scale, Building } from 'lucide-react';
import { isValidImageUrl } from '@/lib/ui-helpers';
import EntityEditMenu from '../entity-edit-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface SellerListItemProps {
  seller: SellerProfileInfo;
  onUpdate?: () => void;
}

export default function SellerListItem({ seller, onUpdate }: SellerListItemProps) {
  const displayLocation = seller.city && seller.state ? `${seller.city} - ${seller.state}` : seller.state || seller.city || 'N/A';
  const logoUrl = isValidImageUrl(seller.logoUrl) ? seller.logoUrl! : `https://placehold.co/120x90.png?text=${seller.name.charAt(0)}`;
  const SellerIcon = seller.isJudicial ? Scale : Building;

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg group overflow-hidden">
        <div className="flex items-center p-4 gap-4">
            <Link href={`/sellers/${seller.slug || seller.publicId || seller.id}`}>
                <Avatar className="h-20 w-20 border-2">
                    <AvatarImage src={logoUrl} alt={seller.name} data-ai-hint={seller.dataAiHintLogo || 'logo comitente'} />
                    <AvatarFallback>{seller.name.charAt(0)}</AvatarFallback>
                </Avatar>
            </Link>
            <div className="flex-grow">
                 <Link href={`/sellers/${seller.slug || seller.publicId || seller.id}`} className="group/link">
                    <h3 className="text-base font-semibold text-foreground group-hover/link:text-primary transition-colors">{seller.name}</h3>
                 </Link>
                 <div className="flex items-center gap-2 mt-1 mb-1.5">
                    <Badge variant={seller.isJudicial ? 'outline' : 'secondary'} className={seller.isJudicial ? "border-blue-500/60" : ""}>
                        <SellerIcon className="mr-1.5 h-3.5 w-3.5"/>
                        {seller.isJudicial ? 'Judicial' : 'Outros'}
                    </Badge>
                 </div>
                 <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1 text-primary/80"/> {displayLocation}</div>
                    <div className="flex items-center"><Gavel className="h-3.5 w-3.5 mr-1 text-primary/80"/> {seller.auctionsFacilitatedCount || 0} leilões</div>
                 </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
                <Button asChild size="sm" variant="outline">
                    <Link href={`/sellers/${seller.slug || seller.publicId || seller.id}`}><Eye className="mr-2 h-4 w-4"/>Ver Perfil</Link>
                </Button>
                <EntityEditMenu
                    entityType="seller"
                    entityId={seller.id}
                    publicId={seller.publicId}
                    currentTitle={seller.name}
                    isFeatured={false} // Sellers don't have a featured status
                    onUpdate={onUpdate}
                />
            </div>
        </div>
    </Card>
  );
}
