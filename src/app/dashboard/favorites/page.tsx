
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Eye, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function FavoriteLotsPage() {
  // Exemplo de lote favorito (substituir por dados reais no futuro)
  const sampleFavoriteLot = {
    id: 'LOTEFAV001',
    title: 'Exemplo de Lote Favorito: Relógio Vintage Raro',
    imageUrl: 'https://placehold.co/300x200.png',
    dataAiHint: 'relogio vintage',
    status: 'ABERTO_PARA_LANCES',
    currentBid: 'R$ 1.250,00',
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <Heart className="h-7 w-7 mr-3 text-primary" />
            Meus Lotes Favoritos
          </CardTitle>
          <CardDescription>
            Acompanhe os lotes que você marcou como favoritos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Simulação de um lote favorito */}
          {true ? ( // Mude para false para ver a mensagem de "nenhum favorito"
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="overflow-hidden">
                <div className="relative aspect-video">
                  <Image src={sampleFavoriteLot.imageUrl} alt={sampleFavoriteLot.title} fill className="object-cover" data-ai-hint={sampleFavoriteLot.dataAiHint}/>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-md mb-1 truncate">{sampleFavoriteLot.title}</h4>
                  <p className="text-sm text-muted-foreground">Status: <span className="text-green-600 font-medium">{sampleFavoriteLot.status.replace('_', ' ')}</span></p>
                  <p className="text-sm text-muted-foreground">Lance Atual: <span className="text-primary font-medium">{sampleFavoriteLot.currentBid}</span></p>
                </CardContent>
                <CardFooter className="p-4 border-t flex gap-2">
                  <Button size="sm" className="flex-1" disabled>
                    <Eye className="mr-2 h-4 w-4" /> Ver Lote
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:border-red-500" disabled>
                    <XCircle className="mr-2 h-4 w-4" /> Remover
                  </Button>
                </CardFooter>
              </Card>
              {/* Adicionar mais cards de favoritos aqui ou mapear de uma lista */}
            </div>
          ) : (
            <div className="text-center py-12 bg-secondary/30 rounded-lg">
              <h3 className="text-xl font-semibold text-muted-foreground">Nenhum Lote Favorito</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Marque lotes como favoritos para encontrá-los facilmente aqui.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
