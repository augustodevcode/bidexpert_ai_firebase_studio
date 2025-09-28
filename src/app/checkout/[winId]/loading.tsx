// src/app/checkout/[winId]/loading.tsx
/**
 * @fileoverview Componente de esqueleto de carregamento para a página de checkout.
 * Exibe uma representação visual da estrutura da página (resumo do pedido e
 * formulário de pagamento) enquanto os dados do arremate estão sendo carregados,
 * melhorando a experiência do usuário ao fornecer um feedback visual imediato.
 */
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CheckoutLoading() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-10rem)] py-12 gap-8">
      {/* Order Summary Skeleton */}
      <Card className="w-full max-w-md animate-pulse">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-md" />
            <div className="space-y-2 flex-grow">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-2">
            <div className="flex justify-between"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-4 w-1/4" /></div>
            <div className="flex justify-between"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-1/4" /></div>
            <div className="flex justify-between"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-1/4" /></div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="flex justify-between"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-6 w-1/4" /></div>
        </CardContent>
      </Card>

      {/* Checkout Form Skeleton */}
      <Card className="w-full max-w-lg animate-pulse">
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-10 w-full" /></div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </CardFooter>
      </Card>
    </div>
  );
}
