
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, UserSquare, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getUniqueSellers, slugify } from '@/lib/sample-data';
import { useEffect, useState } from 'react';

export default function SellersListPage() {
  const [sellers, setSellers] = useState<string[]>([]);

  useEffect(() => {
    setSellers(getUniqueSellers());
  }, []);

  const getSellerInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'S';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg">
        <Building className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-4 font-headline">Nossos Comitentes</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Conheça os vendedores e instituições que confiam no BidExpert para leiloar seus bens.
        </p>
      </section>

      {sellers.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Carregando lista de comitentes...
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sellers.map((sellerName) => (
          <Card key={slugify(sellerName)} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="items-center text-center">
              <Avatar className="h-20 w-20 mb-3 border-2 border-primary/30">
                {/* Placeholder para logo do comitente. Poderia ser dinâmico se tivéssemos URLs */}
                <AvatarImage src={`https://placehold.co/100x100.png?text=${getSellerInitial(sellerName)}`} alt={sellerName} data-ai-hint="logo comitente placeholder" />
                <AvatarFallback>{getSellerInitial(sellerName)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl font-semibold">{sellerName}</CardTitle>
              <CardDescription className="text-xs">Comitente Verificado</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {/* Poderia adicionar uma breve descrição do comitente se disponível */}
              <Button asChild variant="outline" className="w-full mt-2">
                <Link href={`/sellers/${slugify(sellerName)}`}>
                  Ver Leilões e Lotes <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
