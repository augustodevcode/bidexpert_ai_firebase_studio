
'use client';

import type { Lot } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Share2,
  MapPin,
  Building,
  Eye,
  ListChecks,
  DollarSign,
  CalendarDays,
  Clock,
  Users,
  Gavel,
  LandPlot,
  Car,
  Truck,
  Info,
  X,
  Facebook,
  Mail,
  MessageSquareText,
} from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { getAuctionStatusText, getLotStatusColor } from '@/lib/sample-data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LotCardProps {
  lot: Lot;
}

const LotCardClientContent: React.FC<LotCardProps> = ({ lot }) => {
  const [isFavorite, setIsFavorite] = useState(lot.isFavorite || false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isPast, setIsPast]   = useState<boolean>(false);
  const [lotDetailUrl, setLotDetailUrl] = useState<string>(`/auctions/${lot.auctionId}/lots/${lot.id}`);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLotDetailUrl(`${window.location.origin}/auctions/${lot.auctionId}/lots/${lot.id}`);
    }
  }, [lot.auctionId, lot.id]);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const endDate = new Date(lot.endDate);
      
      setIsPast(now > endDate);

      if (now > endDate) {
        if (lot.status === 'ABERTO_PARA_LANCES' || lot.status === 'EM_BREVE') {
          setTimeRemaining(getAuctionStatusText('ENCERRADO'));
        } else {
          setTimeRemaining(getAuctionStatusText(lot.status));
        }
        return;
      }
      
      if (lot.status === 'EM_BREVE') {
        setTimeRemaining(`Inicia em ${format(endDate, "dd/MM HH:mm", { locale: ptBR })}`);
        return;
      }


      const days = differenceInDays(endDate, now);
      const hours = differenceInHours(endDate, now) % 24;
      const minutes = differenceInMinutes(endDate, now) % 60;

      if (days > 0) {
        setTimeRemaining(`em: ${days} dia(s)`);
      } else if (hours > 0) {
        setTimeRemaining(`em: ${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`em: ${minutes}m`);
      } else {
        setTimeRemaining('Encerrando');
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [lot.endDate, lot.status]);

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };
  
  const getSocialLink = (platform: 'x' | 'facebook' | 'whatsapp' | 'email', url: string, title: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    switch(platform) {
      case 'x':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
      case 'email':
        return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
    }
  }

  const getTypeIcon = (type: string) => {
    const upperType = type.toUpperCase();
    if (upperType.includes('CASA') || upperType.includes('IMÓVEL') || upperType.includes('APARTAMENTO')) {
        return <Building className="h-3 w-3 text-muted-foreground" />;
    }
    if (upperType.includes('VEÍCULO') || upperType.includes('AUTOMÓVEL') || upperType.includes('CARRO')) {
        return <Car className="h-3 w-3 text-muted-foreground" />;
    }
    if (upperType.includes('MAQUINÁRIO') || upperType.includes('TRATOR')) {
        return <Truck className="h-3 w-3 text-muted-foreground" />;
    }
    return <Info className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group">
      <div className="relative">
        <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>
          <div className="aspect-[16/10] relative bg-muted">
            <Image
              src={lot.imageUrl}
              alt={lot.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint={lot.dataAiHint || 'imagem lote'}
            />
            <Badge className={`absolute top-2 left-2 text-xs px-2 py-1 ${getLotStatusColor(lot.status)}`}>
              {getAuctionStatusText(lot.status)}
            </Badge>
            <div className="absolute top-2 right-2 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 hover:bg-background" onClick={handleFavoriteToggle}>
                <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
              </Button>
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-7 w-7 bg-background/80 hover:bg-background">
                  <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href={getSocialLink('x', lotDetailUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs">
                    <X className="h-3.5 w-3.5" /> X (Twitter)
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={getSocialLink('facebook', lotDetailUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs">
                    <Facebook className="h-3.5 w-3.5" /> Facebook
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={getSocialLink('whatsapp', lotDetailUrl, lot.title)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs">
                    <MessageSquareText className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={getSocialLink('email', lotDetailUrl, lot.title)} className="flex items-center gap-2 text-xs">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </Link>
      </div>

      <CardContent className="p-3 flex-grow space-y-1.5">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{lot.location}</span>
          </div>
          <div className="flex items-center gap-1">
            {getTypeIcon(lot.type)}
            <span>{lot.type}</span>
          </div>
        </div>

        <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>
          <h3 className="text-sm font-semibold hover:text-primary transition-colors leading-tight min-h-[2.2em] line-clamp-2">
            {lot.title}
          </h3>
        </Link>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
                <ListChecks className="h-3 w-3" />
                <span>{lot.auctionName}</span>
            </div>
            <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{lot.views}</span>
            </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 border-t flex-col items-start space-y-1.5">
        <div className="w-full">
          <p className="text-xs text-muted-foreground">Lance Mínimo</p>
          <p className={`text-xl font-bold ${isPast ? 'text-muted-foreground line-through' : 'text-primary'}`}>
            R$ {lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`flex items-center text-xs ${isPast ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>
          <CalendarDays className="h-3 w-3 mr-1" />
          <span>{format(new Date(lot.endDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
        </div>
        
        <div className="w-full flex justify-between items-center text-xs">
            <div className={`flex items-center gap-1 ${isPast ? 'text-muted-foreground line-through' : ''}`}>
                <Clock className="h-3 w-3" />
                <span>{timeRemaining}</span>
            </div>
            <div className={`flex items-center gap-1 ${isPast ? 'text-muted-foreground line-through' : ''}`}>
                <Gavel className="h-3 w-3" />
                <span>{lot.bidsCount} Lances</span>
            </div>
            <span className={`font-semibold ${isPast ? 'text-muted-foreground line-through' : 'text-foreground'}`}>Lote {lot.id.replace('LOTE', '')}</span>
        </div>
         <Button asChild className="w-full mt-2" size="sm">
            <Link href={`/auctions/${lot.auctionId}/lots/${lot.id}`}>Ver Detalhes do Lote</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}


export default function LotCard({ lot }: LotCardProps) {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
      setIsClient(true);
    }, []);
  
    if (!isClient) {
      return (
        <Card className="flex flex-col overflow-hidden h-full shadow-md rounded-lg group">
             <div className="relative aspect-[16/10] bg-muted animate-pulse"></div>
             <CardContent className="p-3 flex-grow space-y-1.5">
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                <div className="h-8 bg-muted rounded w-full animate-pulse mt-1"></div>
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse mt-1"></div>
             </CardContent>
             <CardFooter className="p-3 border-t flex-col items-start space-y-1.5">
                <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse mt-1"></div>
                <div className="h-4 bg-muted rounded w-full animate-pulse mt-1"></div>
                 <div className="h-8 bg-muted rounded w-full animate-pulse mt-2"></div>
             </CardFooter>
        </Card>
      );
    }
  
    return <LotCardClientContent lot={lot} />;
  }

