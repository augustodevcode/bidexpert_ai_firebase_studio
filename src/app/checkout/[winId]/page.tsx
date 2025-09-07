// src/app/checkout/[winId]/page.tsx
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getWinDetailsForCheckoutAction } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { getPaymentStatusText } from '@/lib/ui-helpers';
import CheckoutForm from './checkout-form';
import { getPlatformSettings } from '@/app/admin/settings/actions';

export default async function CheckoutPage({ params }: { params: { winId: string } }) {
  const winId = params.winId;
  const [winDetails, platformSettings] = await Promise.all([
    getWinDetailsForCheckoutAction(winId),
    getPlatformSettings(),
  ]);

  if (!winDetails) {
    notFound();
  }
  
  if (winDetails.paymentStatus === 'PAGO') {
      redirect(`/dashboard/wins?payment_success=true&winId=${winId}`);
  }

  if (!winDetails.lot) {
     return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Erro nos Dados do Lote</h1>
        <p className="text-muted-foreground">Não foi possível carregar os detalhes do lote associado a este arremate.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/wins">Voltar para Meus Arremates</Link>
        </Button>
      </div>
    );
  }

  const commissionRate = (platformSettings?.paymentGatewaySettings?.platformCommissionPercentage || 5) / 100;
  const commissionValue = winDetails.winningBidAmount * commissionRate;
  const totalDue = winDetails.winningBidAmount + commissionValue;

  return (
    <div className="container mx-auto max-w-5xl py-8" data-ai-id="checkout-page-container">
        <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href="/dashboard/wins">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Meus Arremates
            </Link>
        </Button>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start" data-ai-id="checkout-layout-grid">
        
        {/* Order Summary */}
        <Card className="shadow-lg" data-ai-id="checkout-order-summary-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Resumo do Pedido</CardTitle>
            <CardDescription>Você está pagando pelo seguinte lote arrematado:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-start gap-4" data-ai-id="order-summary-lot-details">
                <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                     <Image src={winDetails.lot.imageUrl || 'https://placehold.co/100x100.png'} alt={winDetails.lot.title} fill className="object-cover" data-ai-hint={winDetails.lot.dataAiHint || 'imagem lote checkout'} />
                </div>
                <div className="flex-grow">
                    <p className="font-semibold text-foreground">{winDetails.lot.title}</p>
                    <p className="text-sm text-muted-foreground">Lote: {winDetails.lot.number}</p>
                    <p className="text-xs text-muted-foreground">Leilão: {winDetails.lot.auctionName}</p>
                </div>
             </div>
             <Separator />
             <div className="space-y-2 text-sm" data-ai-id="order-summary-price-breakdown">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor do Arremate</span>
                    <span className="font-medium text-foreground">R$ {winDetails.winningBidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Comissão do Leiloeiro ({commissionRate * 100}%)</span>
                    <span className="font-medium text-foreground">R$ {commissionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Outras Taxas</span>
                    <span className="font-medium text-foreground">R$ 0,00</span>
                </div>
             </div>
             <Separator />
             <div className="flex justify-between text-lg font-bold" data-ai-id="order-summary-total-due">
                <span className="text-foreground">Total a Pagar</span>
                <span className="text-primary">R$ {totalDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             </div>
          </CardContent>
           <CardFooter>
             <p className="text-xs text-muted-foreground">
                Ao continuar, você concorda com os termos e condições do leilão e do pagamento.
             </p>
           </CardFooter>
        </Card>

        {/* Payment Form */}
        <div data-ai-id="checkout-payment-form-container">
          <CheckoutForm winId={winId} totalAmount={totalDue} />
        </div>
      </div>
    </div>
  );
}
