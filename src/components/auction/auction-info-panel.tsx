
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
  const auctioneerInitial = auction.auctioneerName ? auction.auctioneerName.charAt(0).toUpperCase() : 'L';
  
  return (
    <Card className="card-auction-info" data-ai-id="auction-info-panel">
      <CardHeader className="header-card-auction-info" data-ai-id="auction-info-header">
        <CardTitle className="header-card-auction-info-title">
          <Info className="icon-auction-info-header" /> Informações do Leilão
        </CardTitle>
      </CardHeader>
      <CardContent className="content-card-auction-info" data-ai-id="auction-info-content">
        <div className="wrapper-auctioneer-info" data-ai-id="auction-info-auctioneer">
          <p className="text-auction-info-label">Leiloeiro:</p>
          <div className="wrapper-auctioneer-details">
            {auction.auctioneer?.logoUrl && (
              <Avatar className="avatar-auctioneer-info" data-ai-id="auction-info-auctioneer-avatar">
                <AvatarImage src={auction.auctioneer.logoUrl} alt={auction.auctioneerName} data-ai-hint="logo leiloeiro pequeno" />
                <AvatarFallback>{auctioneerInitial}</AvatarFallback>
              </Avatar>
            )}
            <span className="text-auction-info-value">{auction.auctioneerName}</span>
          </div>
        </div>
        {auction.seller?.name && (
          <div className="wrapper-seller-info" data-ai-id="auction-info-seller">
            <p className="text-auction-info-label">Comitente Principal:</p>
            <p className="text-auction-info-value">{auction.seller.name}</p>
          </div>
        )}
        <div className="wrapper-auction-info-actions" data-ai-id="auction-info-actions">
          {auction.documentsUrl && (
            <Button variant="outline" size="sm" asChild className="btn-auction-info-action" data-ai-id="auction-info-docs-btn">
              <a href={auction.documentsUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="icon-auction-info-action" /> Ver Edital e Documentos
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild className="btn-auction-info-action" data-ai-id="auction-info-details-btn">
            <Link href={`/auctions/${auction.publicId || auction.id}`}>
              <ExternalLink className="icon-auction-info-action" /> Detalhes Completos do Leilão
            </Link>
          </Button>
           <Button variant="outline" size="sm" disabled className="btn-auction-info-action" data-ai-id="auction-info-support-btn">
            <Users className="icon-auction-info-action" /> Falar com Suporte (Em breve)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
