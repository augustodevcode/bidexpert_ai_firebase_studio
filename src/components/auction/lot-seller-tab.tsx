'use client';

import type { SellerProfileInfo } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Mail, Phone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { slugify } from '@/lib/sample-data';
import { useEffect, useState } from 'react';
import { getSellerBySlug } from '@/app/admin/sellers/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

interface LotSellerTabProps {
  sellerName?: string | null;
  sellerId?: string | null;   // Pode ser o publicId ou ID numérico, dependendo do que o lote armazena
  auctionSellerName?: string | null;
}

export default function LotSellerTab({ sellerName, sellerId, auctionSellerName }: LotSellerTabProps) {
  const [sellerDetails, setSellerDetails] = useState<SellerProfileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const finalSellerNameToUse = sellerName || auctionSellerName;
  // Se temos um sellerId, ele é mais confiável para buscar detalhes
  // Se não, tentamos gerar um slug a partir do nome para o link, mas os detalhes serão limitados.
  const idOrSlugToFetch = sellerId || (finalSellerNameToUse ? slugify(finalSellerNameToUse) : undefined);

  useEffect(() => {
    if (idOrSlugToFetch) {
      setIsLoading(true);
      getSellerBySlug(idOrSlugToFetch) // getSellerBySlug pode precisar aceitar publicId também
        .then(data => setSellerDetails(data))
        .catch(err => {
            console.error("Error fetching seller details:", err);
            // Se a busca por ID/Slug falhar, mas tivermos um nome, usamos o nome como fallback
            if (finalSellerNameToUse && finalSellerNameToUse !== "Informação do Vendedor Indisponível") {
                setSellerDetails({
                    id: idOrSlugToFetch, // use o que foi tentado
                    publicId: idOrSlugToFetch,
                    name: finalSellerNameToUse,
                    slug: slugify(finalSellerNameToUse),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                } as SellerProfileInfo); // Cast para SellerProfileInfo, preenchendo o mínimo
            } else {
                setSellerDetails(null);
            }
        })
        .finally(() => setIsLoading(false));
    } else if (finalSellerNameToUse && finalSellerNameToUse !== "Informação do Vendedor Indisponível") {
        // Caso onde não temos ID, apenas nome (do leilão por ex.)
        setSellerDetails({
            id: slugify(finalSellerNameToUse),
            publicId: slugify(finalSellerNameToUse),
            name: finalSellerNameToUse,
            slug: slugify(finalSellerNameToUse),
            createdAt: new Date(),
            updatedAt: new Date(),
        } as SellerProfileInfo);
        setIsLoading(false);
    } else {
        setSellerDetails(null);
        setIsLoading(false);
    }
  }, [idOrSlugToFetch, finalSellerNameToUse]);

  if (isLoading) {
    return <div className="flex items-center py-4"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Carregando informações do comitente...</div>;
  }
  
  const displaySellerName = sellerDetails?.name || finalSellerNameToUse || "Informação do Vendedor Indisponível";
  const sellerInitial = displaySellerName ? displaySellerName.charAt(0).toUpperCase() : '?';

  return (
    <Card className="shadow-none border-0">
      <CardHeader className="px-1 pt-0">
        <CardTitle className="text-xl font-semibold flex items-center">
          <Briefcase className="h-5 w-5 mr-2 text-muted-foreground" /> Comitente / Vendedor
        </CardTitle>
      </CardHeader>
      <CardContent className="px-1 space-y-3">
        {sellerDetails ? (
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border">
              <AvatarImage src={sellerDetails.logoUrl || `https://placehold.co/64x64.png?text=${sellerInitial}`} alt={sellerDetails.name} data-ai-hint={sellerDetails.dataAiHintLogo || 'logo comitente'} />
              <AvatarFallback>{sellerInitial}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-medium text-foreground">{sellerDetails.name}</p>
              {sellerDetails.description && <p className="text-xs text-muted-foreground">{sellerDetails.description.substring(0,100)}...</p>}
              {sellerDetails.email && <div className="flex items-center text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5 mr-1.5"/>{sellerDetails.email}</div>}
              {sellerDetails.phone && <div className="flex items-center text-xs text-muted-foreground"><Phone className="h-3.5 w-3.5 mr-1.5"/>{sellerDetails.phone}</div>}
              {sellerDetails.website && <div className="flex items-center text-xs"><Globe className="h-3.5 w-3.5 mr-1.5 text-muted-foreground"/><a href={sellerDetails.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">{sellerDetails.website}</a></div>}
               {sellerDetails.slug && (
                <Button variant="outline" size="sm" asChild className="mt-2 text-xs">
                  <Link href={`/sellers/${sellerDetails.slug}`}>Ver Perfil Completo do Comitente</Link>
                </Button>
               )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{displaySellerName}</p>
        )}
      </CardContent>
    </Card>
  );
}
