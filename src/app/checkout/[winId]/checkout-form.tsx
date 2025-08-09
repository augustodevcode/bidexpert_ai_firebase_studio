// src/app/checkout/[winId]/checkout-form.tsx
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { checkoutFormSchema, type CheckoutFormValues } from './checkout-form-schema';
import { processPaymentAction } from './actions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CreditCard, Lock, Loader2 } from 'lucide-react';

interface CheckoutFormProps {
  winId: string;
  totalAmount: number;
}

export default function CheckoutForm({ winId, totalAmount }: CheckoutFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      cardholderName: '',
      cardNumber: '',
      expiryDate: '',
      cvc: '',
    },
  });

  async function onSubmit(values: CheckoutFormValues) {
    setIsLoading(true);
    toast({ title: 'Processando Pagamento...', description: 'Aguarde, estamos processando seu pagamento.' });
    
    const result = await processPaymentAction(winId, values);

    if (result.success) {
      toast({ title: 'Pagamento Aprovado!', description: result.message });
      router.push('/dashboard/wins');
      router.refresh();
    } else {
      toast({ title: 'Erro no Pagamento', description: result.message, variant: 'destructive' });
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Informações de Pagamento
        </CardTitle>
        <CardDescription>
          Insira os detalhes do seu cartão de crédito para finalizar a compra.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="cardholderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome no Cartão</FormLabel>
                  <FormControl><Input placeholder="Nome como aparece no cartão" {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do Cartão</FormLabel>
                  <FormControl><Input placeholder="0000 0000 0000 0000" {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validade (MM/AA)</FormLabel>
                    <FormControl><Input placeholder="MM/AA" {...field} disabled={isLoading} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cvc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CVC</FormLabel>
                    <FormControl><Input placeholder="123" {...field} disabled={isLoading} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              {isLoading ? 'Processando...' : `Pagar R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Transação segura e criptografada.
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
