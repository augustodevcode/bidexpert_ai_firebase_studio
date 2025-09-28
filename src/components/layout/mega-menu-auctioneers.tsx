'use client';

import * as React from 'react';
import Link from 'next/link';
import { NavigationMenuLink } from '@/components/ui/navigation-menu';
import type { AuctioneerProfileInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronRight, Landmark } from 'lucide-react';

interface MegaMenuAuctioneersProps {
  auctioneers: AuctioneerProfileInfo[];
  onLinkClick?: () => void;
}

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & { 
    auctioneer: AuctioneerProfileInfo;
  }
>(({ className, auctioneer, ...props }, ref) => {
  const auctioneerInitial = auctioneer.name ? auctioneer.name.charAt(0).toUpperCase() : 'L';
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            'flex select-none items-center space-x-3 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={auctioneer.logoUrl || `https://placehold.co/40x40.png?text=${auctioneerInitial}`} alt={auctioneer.name} data-ai-hint={auctioneer.dataAiHintLogo || "logo leiloeiro"} />
            <AvatarFallback>{auctioneerInitial}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <div className="text-sm font-medium leading-none">{auctioneer.name}</div>
            <p className="line-clamp-1 text-xs leading-snug text-muted-foreground">
              {auctioneer.registrationNumber || `${auctioneer.city || ''}${auctioneer.city && auctioneer.state ? ' - ' : ''}${auctioneer.state || ''}` || 'Leiloeiro Oficial'}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = 'ListItem';

export default function MegaMenuAuctioneers({ auctioneers, onLinkClick }: MegaMenuAuctioneersProps) {
  if (!auctioneers || auctioneers.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">Nenhum leiloeiro disponível.</p>;
  }

  const MAX_AUCTIONEERS_IN_MEGAMENU = 8;
  const visibleAuctioneers = auctioneers.slice(0, MAX_AUCTIONEERS_IN_MEGAMENU);
  const hasMoreAuctioneers = auctioneers.length > MAX_AUCTIONEERS_IN_MEGAMENU;

  return (
    <div className="p-2">
      <ul className="grid w-[300px] gap-1 p-2 md:w-[350px] lg:w-[400px] md:grid-cols-1">
        {visibleAuctioneers.map((auctioneer) => (
          <ListItem
            key={auctioneer.id}
            auctioneer={auctioneer}
            href={`/auctioneers/${auctioneer.slug || auctioneer.publicId || auctioneer.id}`}
            onClick={onLinkClick}
          />
        ))}
        {hasMoreAuctioneers && (
           <li>
              <NavigationMenuLink asChild>
                <Link
                  href="/auctioneers"
                  onClick={onLinkClick}
                  className={cn(
                    'flex select-none items-center justify-center rounded-md p-3 text-sm font-semibold text-primary hover:bg-accent hover:text-primary/90 leading-none no-underline outline-none transition-colors focus:bg-accent focus:text-primary/90'
                  )}
                >
                  <Landmark className="h-4 w-4 mr-2"/> 
                  <span>Ver Todos os Leiloeiros</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </NavigationMenuLink>
            </li>
        )}
      </ul>
    </div>
  );
}
