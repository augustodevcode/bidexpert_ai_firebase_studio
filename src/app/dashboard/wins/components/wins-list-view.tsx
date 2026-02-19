'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, CreditCard, LayoutGrid, List as ListIcon, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { getPaymentStatusText } from '@/lib/ui-helpers';
import type { UserWin } from '@/types';
import { generateWinningBidTermAction } from '@/app/auctions/[auctionId]/lots/[lotId]/actions'; // Importing directly
import { useToast } from '@/hooks/use-toast';
import { ClientOnlyDate } from '@/components/ui/data-table-column-header';

interface WinCardProps {
    win: UserWin;
    isGeneratingTerm: string | null;
    handleGenerateTerm: (lotId: string) => void;
    viewMode: 'grid' | 'list';
}

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'PAGO':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100';
    case 'PENDENTE':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-100';
    case 'FALHOU':
    case 'REEMBOLSADO':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-100';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
};

const WinCard: React.FC<WinCardProps> = ({ win, isGeneratingTerm, handleGenerateTerm, viewMode }) => {
    if (!win.lot) {
        return <Card className="p-4 text-destructive">Lote com ID {win.lotId} não encontrado.</Card>;
    }
    const commissionRate = 0.05;
    const commissionValue = win.winningBidAmount * commissionRate;
    const totalDue = win.winningBidAmount + commissionValue;

    if (viewMode === 'list') {
        return (
            <Card className="overflow-hidden shadow-sm flex flex-col md:flex-row hover:shadow-md transition-shadow">
                <div className="relative w-full md:w-48 aspect-video md:aspect-auto bg-muted">
                     <Image 
                        src={win.lot.imageUrl || 'https://placehold.co/600x400.png'} 
                        alt={win.lot.title} 
                        fill 
                        className="object-cover"
                    />
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                             <div>
                                <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                                    <Link href={`/auctions/${win.lot.auctionId}/lots/${win.lot.publicId || win.lot.id}`}>
                                        {win.lot.title}
                                    </Link>
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                    Leilão: {win.lot.auctionName} (Lote: {win.lot.number || win.lot.id})
                                </p>
                             </div>
                             <Badge variant="outline" className={`${getPaymentStatusColor(win.paymentStatus)}`}>
                                {getPaymentStatusText(win.paymentStatus)}
                            </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                            <div>
                                <span className="text-muted-foreground block text-xs">Valor do Arremate</span>
                                <span className="font-bold text-primary">
                                    R$ {win.winningBidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block text-xs">Total Comissões</span>
                                <span className="font-medium">
                                    R$ {commissionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
                        <Link href={`/checkout/${win.id}`}>
                            <Button size="sm" variant={win.paymentStatus === 'PENDENTE' ? 'default' : 'outline'}>
                                {win.paymentStatus === 'PENDENTE' ? 'Pagar Agora' : 'Ver Recibo'}
                            </Button>
                        </Link>
                         {win.paymentStatus === 'PAGO' && (
                            <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={() => handleGenerateTerm(win.lotId)}
                                disabled={isGeneratingTerm === win.lotId}
                            >
                                {isGeneratingTerm === win.lotId ? (
                                    <>Gerando...</>
                                ) : (
                                    <><FileText className="mr-2 h-4 w-4" /> Termo</>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden shadow-md flex flex-col h-full hover:shadow-lg transition-shadow">
            <div className="relative aspect-[16/9] bg-muted group">
                <Image 
                    src={win.lot.imageUrl || 'https://placehold.co/600x400.png'} 
                    alt={win.lot.title} 
                    fill 
                    className="object-cover transition-transform group-hover:scale-105"
                />
                 <div className="absolute top-2 right-2">
                     <Badge variant="secondary" className="backdrop-blur-md bg-white/80 dark:bg-black/60">
                        {win.lot.number ? `Lote ${win.lot.number}` : 'Lote'}
                     </Badge>
                 </div>
            </div>
            <CardHeader className="pb-2 space-y-1">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base leading-tight hover:text-primary line-clamp-2 min-h-[2.5rem]">
                        <Link href={`/auctions/${win.lot.auctionId}/lots/${win.lot.publicId || win.lot.id}`}>
                            {win.lot.title}
                        </Link>
                    </CardTitle>
                </div>
                <CardDescription className="text-xs pt-0.5 line-clamp-1">
                    {win.lot.auctionName}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm flex-grow">
                <div className="bg-muted/50 p-2 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                         <span className="text-xs text-muted-foreground">Valor Lance:</span>
                         <span className="text-primary font-bold">
                            R$ {win.winningBidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                         </span>
                    </div>
                     <div className="flex justify-between items-center">
                         <span className="text-xs text-muted-foreground">Comissão (5%):</span>
                         <span className="text-xs">
                            R$ {commissionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                         </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-dashed border-muted-foreground/30 mt-1 pt-1">
                         <span className="text-xs font-medium">Total:</span>
                         <span className="text-sm font-bold">
                            R$ {totalDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                         </span>
                    </div>
                </div>

                <div className="flex items-center text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3 mr-1.5" />
                    <ClientOnlyDate date={win.winDate} format="dd/MM/yyyy HH:mm"/>
                </div>
                
                <div className="flex items-center justify-between">
                     <span className="text-xs font-medium flex items-center">
                        <CreditCard className="h-3 w-3 mr-1.5" /> Status:
                     </span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getPaymentStatusColor(win.paymentStatus)}`}>
                        {getPaymentStatusText(win.paymentStatus)}
                    </Badge>
                </div>
            </CardContent>
            <CardFooter className="pt-2 pb-4 flex gap-2 justify-between border-t bg-muted/20">
                 <Link href={`/checkout/${win.id}`} className="w-full">
                    <Button size="sm" variant={win.paymentStatus === 'PENDENTE' ? 'default' : 'outline'} className="w-full h-8 text-xs">
                        {win.paymentStatus === 'PENDENTE' ? 'Pagar' : 'Detalhes'}
                    </Button>
                </Link>
                 {win.paymentStatus === 'PAGO' && (
                    <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleGenerateTerm(win.lotId)}
                        disabled={isGeneratingTerm === win.lotId}
                        title="Gerar Termo de Arrematação"
                    >
                        <FileText className="h-4 w-4" />
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export function WinsListView({ wins }: { wins: UserWin[] }) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isGeneratingTerm, setIsGeneratingTerm] = useState<string | null>(null);
    const { toast } = useToast();

    const handleGenerateTerm = async (lotId: string) => {
        const win = wins.find(w => w.lotId === lotId);
        if (!win || !win.lot) return;

        setIsGeneratingTerm(lotId);
        toast({ title: 'Gerando Documento...', description: 'Aguarde, isso pode levar alguns segundos.'});

        try {
            // Note: The action only requires lotId, not auctionId
            const result = await generateWinningBidTermAction(lotId);
             if (result.success && result.pdfBase64 && result.fileName) {
                const byteCharacters = atob(result.pdfBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                
                toast({
                    title: "Sucesso",
                    description: "Termo de arrematação gerado com sucesso.",
                    action: <Link href={url} download={result.fileName} target="_blank" className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">Baixar PDF</Link>,
                });
            } else {
                toast({
                    title: "Erro",
                    description: result.message || "Erro ao gerar termo.",
                    variant: "destructive",
                });
            }
        } catch (error) {
             console.error("Error generating term:", error);
             toast({
                title: "Erro",
                description: "Ocorreu um erro ao tentar gerar o termo.",
                variant: "destructive",
            });
        } finally {
            setIsGeneratingTerm(null);
        }
    };

    if (wins.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/10">
                <div className="p-4 bg-muted rounded-full mb-4">
                     <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhum arremate encontrado</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-6">
                    Você ainda não arrematou nenhum lote. Participe dos nossos leilões e dê seus lances!
                </p>
                <Link href="/auctions">
                    <Button>Ir para Leilões</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-background p-2 rounded-md border shadow-sm sticky top-0 z-10">
                <div className="text-sm font-medium ml-2">
                    {wins.length} {wins.length === 1 ? 'Arremate' : 'Arremates'} encontrados
                </div>
                <div className="flex gap-1 bg-muted p-1 rounded-md">
                    <Button 
                        variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                        size="sm" 
                        className="h-7 w-7 p-0"
                        onClick={() => setViewMode('grid')}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant={viewMode === 'list' ? 'default' : 'ghost'} 
                        size="sm" 
                        className="h-7 w-7 p-0"
                        onClick={() => setViewMode('list')}
                    >
                        <ListIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
                {wins.map((win) => (
                    <WinCard 
                        key={win.id} 
                        win={win} 
                        isGeneratingTerm={isGeneratingTerm}
                        handleGenerateTerm={handleGenerateTerm}
                        viewMode={viewMode}
                    />
                ))}
            </div>
        </div>
    );
}

