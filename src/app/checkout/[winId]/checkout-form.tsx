// src/app/checkout/[winId]/checkout-form.tsx
'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { checkoutFormSchema, type CheckoutFormValues } from './checkout-form-schema';
import { processPaymentAction } from './actions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CreditCard, Lock, Loader2, Landmark } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      paymentMethod: 'credit_card',
      installments: 1,
      cardDetails: {
        cardholderName: '',
        cardNumber: '',
        expiryDate: '',
        cvc: '',
      },
    },
  });

  const paymentMethod = useWatch({ control: form.control, name: 'paymentMethod' });
  const installmentCount = useWatch({ control: form.control, name: 'installments' }) || 1;
  
  const installmentAmount = React.useMemo(() => {
    if (installmentCount > 1) {
      // Simulate 1.5% interest per month for installments > 1
      const interestRate = 0.015;
      const totalWithInterest = totalAmount * (1 + (interestRate * installmentCount));
      return totalWithInterest / installmentCount;
    }
    return totalAmount;
  }, [totalAmount, installmentCount]);

  async function onSubmit(values: CheckoutFormValues) {
    setIsLoading(true);
    toast({ title: 'Processando Pagamento...', description: 'Aguarde, estamos processando sua solicitação.' });
    
    const result = await processPaymentAction(winId, values);

    if (result.success) {
      toast({ title: 'Pagamento Realizado com Sucesso!', description: result.message });
      router.push('/dashboard/wins');
      router.refresh();
    } else {
      toast({ title: 'Erro no Pagamento', description: result.message, variant: 'destructive' });
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg shadow-lg" data-ai-id="checkout-payment-form">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Pagamento
                </CardTitle>
                <CardDescription>
                    Escolha o método de pagamento para finalizar a compra.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Método de Pagamento</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                <FormItem>
                                    <Label htmlFor="pm-card" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground has-[div>input:checked]:border-primary">
                                        <FormControl>
                                            <RadioGroupItem value="credit_card" id="pm-card" className="sr-only" />
                                        </FormControl>
                                        <CreditCard className="mb-3 h-6 w-6" />
                                        Cartão de Crédito
                                    </Label>
                                </FormItem>
                                <FormItem>
                                    <Label htmlFor="pm-installments" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground has-[div>input:checked]:border-primary">
                                         <FormControl>
                                            <RadioGroupItem value="installments" id="pm-installments" className="sr-only" />
                                        </FormControl>
                                        <Landmark className="mb-3 h-6 w-6" />
                                        Boleto Parcelado
                                    </Label>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                {paymentMethod === 'credit_card' && (
                    <div className="space-y-4 pt-4 border-t">
                        <FormField control={form.control} name="cardDetails.cardholderName" render={({ field }) => (<FormItem><FormLabel>Nome no Cartão</FormLabel><FormControl><Input placeholder="Nome como aparece no cartão" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="cardDetails.cardNumber" render={({ field }) => (<FormItem><FormLabel>Número do Cartão</FormLabel><FormControl><Input placeholder="0000 0000 0000 0000" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>)}/>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="cardDetails.expiryDate" render={({ field }) => (<FormItem><FormLabel>Validade (MM/AA)</FormLabel><FormControl><Input placeholder="MM/AA" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="cardDetails.cvc" render={({ field }) => (<FormItem><FormLabel>CVC</FormLabel><FormControl><Input placeholder="123" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>)}/>
                        </div>
                    </div>
                )}
                {paymentMethod === 'installments' && (
                    <div className="space-y-4 pt-4 border-t">
                         <FormField
                            control={form.control}
                            name="installments"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Número de Parcelas</FormLabel>
                                <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o número de parcelas" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {[2,3,4,5,6,7,8,9,10,11,12].map(i => (
                                        <SelectItem key={i} value={String(i)}>{i}x de {`R$ ${(totalAmount / i).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>O valor das parcelas pode incluir juros.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex-col gap-4">
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Processando...' : `Confirmar Pagamento (${installmentCount}x de R$ ${installmentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`}
                </Button>
                <p className="text-xs text-muted-foreground text-center">Transação segura e criptografada.</p>
            </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
