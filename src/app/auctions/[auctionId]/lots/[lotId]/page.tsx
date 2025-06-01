
import type { Lot, Auction } from '@/types';
import { sampleLots, sampleAuctions } from '@/lib/sample-data';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
    Printer, Share2, ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Search, Key, Info, 
    Tag, CalendarDays, Clock, Users, DollarSign, MapPin, Car, Settings, ThumbsUp, 
    ShieldCheck, HelpCircle, ShoppingCart, Heart
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
// Simula o estado de autenticação. Em um app real, viria de um contexto/hook.
const isAuthenticated = false; 

async function getLotData(auctionId: string, lotId: string): Promise<{ lot: Lot | undefined, auction: Auction | undefined }> {
  const auction = sampleAuctions.find(a => a.id === auctionId);
  if (!auction) {
    return { lot: undefined, auction: undefined };
  }
  // Busca o lote diretamente dentro da lista de lotes do leilão encontrado
  const lot = auction.lots.find(l => l.id === lotId);
  return { lot, auction };
}

export default async function LotDetailPage({ params }: { params: { auctionId: string, lotId: string } }) {
  const { lot, auction } = await getLotData(params.auctionId, params.lotId);

  if (!lot || !auction) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Lote Não Encontrado</h1>
        <p className="text-muted-foreground">O lote que você está procurando não existe ou não pertence a este leilão.</p>
        <Button asChild className="mt-4">
          <Link href={`/auctions/${params.auctionId}`}>Voltar para o Leilão</Link>
        </Button>
      </div>
    );
  }

  const lotTitle = `${lot.year || ''} ${lot.make || ''} ${lot.model || ''} ${lot.series || lot.title}`.trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-2">
        <h1 className="text-2xl md:text-3xl font-bold font-headline text-center sm:text-left">{lotTitle}</h1>
        <div className="flex items-center space-x-2 flex-wrap justify-center">
          <Button variant="outline" size="sm"><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
          <Button variant="outline" size="sm"><Share2 className="mr-2 h-4 w-4" /> Compartilhar</Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/auctions/${params.auctionId}`}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o leilão</Link>
          </Button>
          <div className="flex items-center">
            <Button variant="outline" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm text-muted-foreground mx-2">Lote {lot.id.replace('LOTE', '')} de {auction.totalLots}</span>
            <Button variant="outline" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal: Imagens e Detalhes do Veículo */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="relative aspect-[16/9] w-full bg-muted rounded-md overflow-hidden mb-4">
                <Image src={lot.imageUrl} alt={lot.title} fill className="object-cover" data-ai-hint={lot.dataAiHint || "imagem principal lote"}/>
                <div className="absolute top-2 left-2 space-x-2">
                  <Button variant="secondary" size="sm"><RotateCcw className="mr-2 h-4 w-4" /> Ver 360°</Button>
                  <Button variant="secondary" size="sm"><Search className="mr-2 h-4 w-4" /> Ver HD</Button>
                </div>
              </div>
              {lot.galleryImageUrls && lot.galleryImageUrls.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {lot.galleryImageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square bg-muted rounded overflow-hidden">
                      <Image src={url} alt={`Imagem ${index + 1} de ${lot.title}`} fill className="object-cover" data-ai-hint="imagem galeria carro"/>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                {lot.hasKey && <span className="flex items-center"><Key className="h-4 w-4 mr-1 text-primary"/> Chave Presente</span>}
                <span></span> {/* Placeholder for More Actions */}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">Informações do Veículo <Info className="h-4 w-4 ml-2 text-muted-foreground" /></CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {Object.entries({
                "Nº de Estoque:": lot.stockNumber,
                "Filial de Venda:": lot.sellingBranch,
                "VIN (Status):": lot.vinStatus,
                "Tipo de Perda:": lot.lossType,
                "Dano Primário:": lot.primaryDamage,
                "Documento (Título/Venda):": lot.titleInfo,
                "Marca do Documento:": lot.titleBrand,
                "Código de Partida:": lot.startCode,
                "Chave:": lot.hasKey ? "Presente" : "Ausente",
                "Odômetro:": lot.odometer,
                "Airbags:": lot.airbagsStatus,
              }).map(([key, value]) => value ? <div key={key}><span className="font-medium text-foreground">{key}</span> <span className="text-muted-foreground">{value}</span></div> : null)}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">Descrição do Veículo <Info className="h-4 w-4 ml-2 text-muted-foreground" /></CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {Object.entries({
                "VIN (Status):": lot.vinStatus, // Repetido conforme imagem
                "Veículo:": lot.type,
                "Estilo da Carroceria:": lot.bodyStyle,
                "Motor:": lot.engineDetails,
                "Transmissão:": lot.transmissionType,
                "Tipo de Tração:": lot.driveLineType,
                "Tipo de Combustível:": lot.fuelType,
                "Cilindros:": lot.cylinders,
                "Sistema de Retenção:": lot.restraintSystem,
                "Cor Externa/Interna:": lot.exteriorInteriorColor,
                "Opcionais:": lot.options,
                "Fabricado em:": lot.manufacturedIn,
                "Classe do Veículo:": lot.vehicleClass,
                "Modelo:": lot.model,
                "Série:": lot.series,
              }).map(([key, value]) => value ? <div key={key}><span className="font-medium text-foreground">{key}</span> <span className="text-muted-foreground">{value}</span></div> : null)}
            </CardContent>
             {lot.description && (
                <>
                    <Separator className="my-4" />
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{lot.description}</p>
                    </CardContent>
                </>
            )}
          </Card>
        </div>

        {/* Coluna Lateral: Informações de Lance, Venda e Adicionais */}
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Informações do Lance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isAuthenticated ? (
                <div className="text-sm text-muted-foreground p-3 bg-secondary/50 rounded-md">
                  <p>Você não está logado.</p>
                  <p>Por favor, <Link href="/auth/login" className="text-primary hover:underline font-medium">faça login</Link> ou <Link href="/auth/register" className="text-primary hover:underline font-medium">registre-se agora</Link> para dar lances.</p>
                </div>
              ) : (
                <Button className="w-full" disabled={lot.status !== 'ABERTO_PARA_LANCES'}>
                  <DollarSign className="mr-2 h-4 w-4" /> 
                  {lot.status === 'ABERTO_PARA_LANCES' ? 'Fazer Pré-Lance' : 'Lances Encerrados'}
                </Button>
              )}
              <Button variant="outline" className="w-full"><Heart className="mr-2 h-4 w-4" /> Adicionar à Minha Lista</Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">Informações da Venda <Info className="h-4 w-4 ml-2 text-muted-foreground" /></CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {Object.entries({
                "Filial de Venda:": lot.sellingBranch || auction.sellingBranch,
                "Localização do Veículo:": lot.vehicleLocationInBranch || auction.vehicleLocation,
                "Data e Hora do Leilão (Lote):": lot.lotSpecificAuctionDate ? format(new Date(lot.lotSpecificAuctionDate), "dd/MM/yyyy HH:mm'h'", { locale: ptBR }) : 'N/A',
                "Pista/Corrida #:": lot.laneRunNumber,
                "Corredor/Vaga:": lot.aisleStall,
                "Valor Real em Dinheiro (VCV):": lot.actualCashValue,
                "Custo Estimado de Reparo:": lot.estimatedRepairCost,
                "Vendedor:": lot.sellerName || auction.seller,
                "Documento (Título/Venda):": lot.titleInfo, // Repetido conforme imagem
                "Marca do Documento:": lot.titleBrand, // Repetido conforme imagem
              }).map(([key, value]) => value ? <div key={key}><span className="font-medium text-foreground">{key}</span> <span className="text-muted-foreground">{value}</span></div> : null)}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">Opções Adicionais <Info className="h-4 w-4 ml-2 text-muted-foreground" /></CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Button variant="outline" className="w-full justify-start text-left h-auto py-2">
                <Settings className="mr-2 h-4 w-4 text-primary" />
                <div>
                  <span className="font-medium">Serviços de Inspeção Veicular</span><br/>
                  <span className="text-xs text-primary">Solicitar Inspeção &rarr;</span>
                </div>
              </Button>
              <div className="text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Você também pode:</p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Ver o item pessoalmente antes da venda durante a janela de pré-visualização do leilão.</li>
                  <li>Restrições podem ser aplicadas, por favor, contate a Filial de Venda acima para agendar uma pré-visualização.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Generate static paths for sample lots to enable ISR or SSG if desired
export async function generateStaticParams() {
  const paths = sampleAuctions.flatMap(auction => 
    auction.lots.map(lot => ({
      auctionId: auction.id,
      lotId: lot.id,
    }))
  );
  return paths;
}
