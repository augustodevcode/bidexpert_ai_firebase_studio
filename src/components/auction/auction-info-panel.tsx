
'use client';

import type { Auction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Info, FileText, Users, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface AuctionInfoPanelProps {
  auction: Auction;
}

export default function AuctionInfoPanel({ auction }: AuctionInfoPanelProps) {
  const auctioneerInitial = auction.auctioneer ? auction.auctioneer.charAt(0).toUpperCase() : 'L';
  
  return (
    <Card className="shadow-md">
      <CardHeader className="p-3 border-b">
        <CardTitle className="text-md font-semibold flex items-center">
          <Info className="h-4 w-4 mr-2 text-primary" /> Informações do Leilão
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2 text-xs">
        <div>
          <p className="font-medium text-muted-foreground">Leiloeiro:</p>
          <div className="flex items-center gap-2 mt-0.5">
            {auction.auctioneerLogoUrl && (
              <Avatar className="h-7 w-7">
                <AvatarImage src={auction.auctioneerLogoUrl} alt={auction.auctioneer} data-ai-hint="logo leiloeiro pequeno" />
                <AvatarFallback>{auctioneerInitial}</AvatarFallback>
              </Avatar>
            )}
            <span className="text-foreground">{auction.auctioneer}</span>
          </div>
        </div>
        {auction.seller && (
          <div>
            <p className="font-medium text-muted-foreground">Comitente Principal:</p>
            <p className="text-foreground">{auction.seller}</p>
          </div>
        )}
        <div className="pt-1 space-y-1.5">
          {auction.documentsUrl && (
            <Button variant="outline" size="sm" asChild className="w-full justify-start text-left">
              <a href={auction.documentsUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-3.5 w-3.5 mr-2" /> Ver Edital e Documentos
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild className="w-full justify-start text-left">
            <Link href={`/auctions/${auction.publicId || auction.id}`}>
              <ExternalLink className="h-3.5 w-3.5 mr-2" /> Detalhes Completos do Leilão
            </Link>
          </Button>
           <Button variant="outline" size="sm" disabled className="w-full justify-start text-left">
            <Users className="h-3.5 w-3.5 mr-2" /> Falar com Suporte (Em breve)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
