// src/app/dashboard/wins/page.tsx
'use client';

import React from 'react';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, FileText, CreditCard, CalendarDays, Eye, AlertCircle, Truck, CalendarCheck, Loader2 } from 'lucide-react';
import { getPaymentStatusText } from '@/lib/ui-helpers';
import type { UserWin } from '@/types';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatInSaoPaulo, convertUtcToSaoPaulo } from '@/lib/timezone'; // Import timezone functions
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState, useCallback } from 'react';
import { getWinsForUserAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { generateWinningBidTermAction } from '@/app/auctions/[auctionId]/lots/[lotId]/actions'; // Import the action

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'PAGO':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'PENDENTE':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'FALHOU':
    case 'REEMBOLSADO':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
};

function WinsPageContent() {
    const { userProfileWithPermissions } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [wins, setWins] = useState<UserWin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingTerm, setIsGeneratingTerm] = useState<string | null>(null);

    const fetchWins = useCallback(async (userId: string) => {
      setIsLoading(true);
      try {
        const userWins = await getWinsForUserAction(userId);
        setWins(userWins);
      } catch (error) {
        console.error("Error fetching user wins:", error);
        toast({
          title: "Erro ao buscar arremates",
          description: "Não foi possível carregar seus lotes arrematados.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, [toast]);

    useEffect(() => {
        if (searchParams.get('payment_success') === 'true') {
            toast({
                title: "Pagamento Realizado com Sucesso!",
                description: "Obrigado por sua compra. Você pode acompanhar os detalhes aqui.",
            });
        }
    }, [searchParams, toast]);

    useEffect(() => {
        if (userProfileWithPermissions?.uid) {
        fetchWins(userProfileWithPermissions.uid);
        } else {
        setIsLoading(false); // No user, stop loading
        }
    }, [userProfileWithPermissions, fetchWins]);

    const handleGenerateTerm = async (lotId: string) => {
        setIsGeneratingTerm(lotId);
        toast({ title: 'Gerando Documento...', description: 'Aguarde, isso pode levar alguns segundos.'});

        try {
            const result = await generateWinningBidTermAction(lotId);

            if (result.success && result.pdfBase64 && result.fileName) {
                const byteCharacters = atob(result.pdfBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = result.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast({ title: 'Sucesso!', description: 'Download do PDF iniciado.' });
            } else {
                throw new Error(result.message || "A resposta da API não continha um PDF válido.");
            }
        } catch (error: any) {
            console.error("Error generating winning bid term PDF:", error);
            toast({ title: 'Erro ao Gerar PDF', description: error.message, variant: 'destructive'});
        } finally {
            setIsGeneratingTerm(null);
        }
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Carregando seus arremates...</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle className="text-2xl font-bold font-headline flex items-center">
                    <ShoppingBag className="h-7 w-7 mr-3 text-primary" />
                    Meus Arremates
                </CardTitle>
                <CardDescription>
                    Veja todos os lotes que você arrematou, gerencie pagamentos e acompanhe a retirada.
                </CardDescription>
                </CardHeader>
                <CardContent>
                {wins.length === 0 ? (
                    <div className="text-center py-12 bg-secondary/30 rounded-lg">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-muted-foreground">Nenhum Arremate Encontrado</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Os lotes que você ganhar em leilões aparecerão aqui.
                    </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {wins.map((win) => {
                        if (!win.lot) {
                        return <Card key={win.id} className="p-4 text-destructive">Lote com ID {win.lotId} não encontrado.</Card>;
                        }
                        const paymentDeadline = addDays(convertUtcToSaoPaulo(win.winDate as string), 5); // Exemplo: 5 dias para pagar, usando data em SP
                        const commissionRate = 0.05; // Exemplo: 5% de comissão
                        const commissionValue = win.winningBidAmount * commissionRate;
                        const totalDue = win.winningBidAmount + commissionValue; // Simplificado, pode haver outras taxas

                        return (
                        <Card key={win.id} className="overflow-hidden shadow-md flex flex-col">
                            <div className="relative aspect-[16/9] bg-muted">
                            <Image 
                                src={win.lot.imageUrl || 'https://placehold.co/600x400.png'} 
                                alt={win.lot.title} 
                                fill 
                                className="object-cover"
                                data-ai-hint={win.lot.dataAiHint || 'imagem lote arrematado'}
                            />
                            </div>
                            <CardHeader className="pb-2">
                            <CardTitle className="text-lg leading-tight hover:text-primary">
                                <Link href={`/auctions/${win.lot.auctionId}/lots/${win.lot.publicId || win.lot.id}`}>
                                    {win.lot.title}
                                </Link>
                            </CardTitle>
                            <CardDescription className="text-xs pt-0.5">
                                Leilão: {win.lot.auctionName} (Lote: {win.lot.number || win.lot.id})
                            </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2.5 text-sm flex-grow">
                            <div>
                                <span className="font-medium text-muted-foreground">Valor do Arremate:</span>
                                <span className="text-primary font-bold ml-2 text-lg">
                                R$ {win.winningBidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                <p><span className="font-medium text-foreground">Comissão do Leiloeiro (5%):</span> R$ {commissionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (placeholder)</p>
                                <p><span className="font-medium text-foreground">Total Devido:</span> R$ {totalDue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (placeholder)</p>
                            </div>
                            <div className="flex items-center">
                                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>Arrematado em: {formatInSaoPaulo(win.winDate as string, "dd/MM/yyyy 'às' HH:mm")}</span>
                            </div>
                            <div className="flex items-center">
                                <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>Status do Pagamento: </span>
                                <Badge variant="outline" className={`ml-2 ${getPaymentStatusColor(win.paymentStatus)}`}>
                                    {getPaymentStatusText(win.paymentStatus)}
                                </Badge>
                            </div>
                            {win.paymentStatus === 'PENDENTE' && (
                                <div className="flex items-center text-xs text-amber-600">
                                    <CalendarCheck className="h-4 w-4 mr-2" />
                                    <span>Prazo para Pagamento: {formatInSaoPaulo(paymentDeadline, "dd/MM/yyyy")} (placeholder)</span>
                                </div>
                            )}
                            <div className="flex items-center">
                                <Truck className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>Status da Retirada: {win.paymentStatus === 'PAGO' ? 'Aguardando Agendamento' : 'Aguardando Pagamento'} (placeholder)</span>
                            </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4 flex flex-col sm:flex-row flex-wrap gap-2">
                                <Button size="sm" className="flex-1 min-w-[calc(50%-0.25rem)]" asChild>
                                    <Link href={`/auctions/${win.lot.auctionId}/lots/${win.lot.publicId || win.lot.id}`}>
                                        <Eye className="mr-2 h-4 w-4" /> Ver Lote
                                    </Link>
                                </Button>
                                {win.paymentStatus === 'PENDENTE' && (
                                    <Button variant="default" size="sm" className="flex-1 min-w-[calc(50%-0.25rem)]" asChild>
                                        <Link href={`/checkout/${win.id}`}>
                                            <CreditCard className="mr-2 h-4 w-4" /> Pagar Agora
                                        </Link>
                                    </Button>
                                )}
                                {win.paymentStatus === 'PAGO' && (
                                    <>
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            className="flex-1 min-w-[calc(50%-0.25rem)]"
                                            onClick={() => handleGenerateTerm(win.lot.id)}
                                            disabled={isGeneratingTerm === win.lot.id}
                                        >
                                            {isGeneratingTerm === win.lot.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-2 h-4 w-4" />}
                                            Termo Arrem.
                                        </Button>
                                        <Button variant="outline" size="sm" className="flex-1 min-w-[calc(50%-0.25rem)]" disabled>
                                            <Truck className="mr-2 h-4 w-4" /> Agendar Retirada
                                        </Button>
                                    </>
                                )}
                            </CardFooter>
                        </Card>
                        )
                    })}
                    </div>
                )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function MyWinsPage() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <WinsPageContent />
        </React.Suspense>
    );
}
